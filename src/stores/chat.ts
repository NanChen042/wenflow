import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { aiService, isVLMModel } from '@/services/aiService'
import { imageService } from '@/services/imageService'
import { getModelCapabilities } from '@/services/modelCapabilities'
import { 
  ModelType, 
  MessageAsset, 
  Message, 
  ChatSession, 
  MultimodalContent, 
  ChatCompletionRequestMessage 
} from '@/types/chat'

import { useConfigStore } from './config'

export type { MessageAsset, Message, ChatSession }

const STORAGE_KEY = 'deepseek_chat_sessions'
const ACTIVE_SESSION_STORAGE_KEY = 'deepseek_active_session_id'

const isStoredMessage = (value: unknown): value is Message => {
  if (!value || typeof value !== 'object') return false
  const message = value as Partial<Message>
  return (message.role === 'user' || message.role === 'assistant' || message.role === 'system')
    && (message.type === 'text' || message.type === 'image')
    && typeof message.content === 'string'
}

const isStoredSession = (value: unknown): value is ChatSession => {
  if (!value || typeof value !== 'object') return false
  const session = value as Partial<ChatSession>
  return typeof session.id === 'string'
    && typeof session.title === 'string'
    && typeof session.updatedAt === 'number'
    && Array.isArray(session.messages)
    && session.messages.every(isStoredMessage)
}

export const useChatStore = defineStore('chat', () => {
  const loadSessions = (): ChatSession[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: unknown = JSON.parse(stored)
        const list = Array.isArray(parsed) ? parsed.filter(isStoredSession) : []
        // 自动恢复历史旧会话因 18 字符限制被截断的完整标题
        list.forEach(session => {
          if (session.messages && session.messages.length > 0) {
            const firstUserMsg = session.messages.find(m => m.role === 'user' && m.content)
            if (firstUserMsg && firstUserMsg.content) {
              const fullFirstLine = firstUserMsg.content.split('\n')[0].trim()
              if (session.title && fullFirstLine.startsWith(session.title) && fullFirstLine.length > session.title.length) {
                session.title = fullFirstLine.slice(0, 120)
              } else if (!session.title || session.title === '新对话') {
                session.title = fullFirstLine.slice(0, 120)
              }
            }
          }
        })
        return list
      }
    } catch (e) {
      console.error('Failed to parse chat sessions', e)
    }
    return []
  }

  const loadedSessions = loadSessions()

  const loadActiveSessionId = (list: ChatSession[]): string => {
    try {
      const saved = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY)
      if (saved && list.some(s => s.id === saved)) {
        return saved
      }
    } catch (e) {
      console.error('Failed to load active session id', e)
    }
    return list[0]?.id || ''
  }

  const configStore = useConfigStore()
  const initialActiveId = loadActiveSessionId(loadedSessions)
  const initialActiveSession = loadedSessions.find(s => s.id === initialActiveId)
  const sessions = ref<ChatSession[]>(loadedSessions)
  const activeSessionId = ref<string>(initialActiveId)
  const defaultFallback = (configStore.config.defaultModel as ModelType) || ModelType.R1_Distill_7B
  const currentModel = ref<ModelType>((initialActiveSession?.model as ModelType) || defaultFallback)

  // 初始化时同步给 AI 服务
  if (currentModel.value) {
    aiService.updateConfig({ model: currentModel.value as string })
  }

  watch(activeSessionId, (newId) => {
    if (newId) {
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, newId)
      const session = sessions.value.find(s => s.id === newId)
      if (session?.model) {
        currentModel.value = session.model as ModelType
        aiService.updateConfig({ model: session.model as string })
      }
    } else {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY)
    }
  })

  // 跨页面传递的预备附件列表 (HomeView -> ChatView)
  const pendingAssets = ref<MessageAsset[]>([])

  const setPendingAssets = (items: MessageAsset[]) => {
    pendingAssets.value = [...items]
  }

  const consumePendingAssets = (): MessageAsset[] => {
    const assets = [...pendingAssets.value]
    pendingAssets.value = []
    return assets
  }

  const activeSession = computed(() => 
    sessions.value.find(s => s.id === activeSessionId.value)
  )

  const messages = computed(() => activeSession.value?.messages || [])

  // 多会话并发生成状态管理
  const sessionControllers = new Map<string, AbortController>()
  const generatingSessionIds = ref<string[]>([])

  // 当前激活会话是否在生成中
  const loading = computed(() => generatingSessionIds.value.includes(activeSessionId.value))

  const isSessionGenerating = (sessionId: string) => {
    return generatingSessionIds.value.includes(sessionId)
  }

  const abortGeneration = (targetSessionId?: string) => {
    const sId = targetSessionId || activeSessionId.value
    const controller = sessionControllers.get(sId)
    const session = sessions.value.find(s => s.id === sId)
    const lastMsg = session?.messages[session.messages.length - 1]
    const wasGenerating = Boolean(controller) || generatingSessionIds.value.includes(sId) || Boolean(lastMsg?.loading)
    if (!wasGenerating) return

    if (controller) {
      controller.abort()
      sessionControllers.delete(sId)
    }
    generatingSessionIds.value = generatingSessionIds.value.filter(id => id !== sId)
    
    if (session) {
      if (lastMsg && lastMsg.loading) {
        lastMsg.loading = false
      }
    }
    ElMessage.info('已中断内容生成')
  }

  // 安全的持久化存储机制（防 5MB LocalStorage 溢出）
  const safePersistSessions = (data: ChatSession[]) => {
    try {
      const sanitized = data.map(s => ({
        ...s,
        messages: s.messages.map(m => {
          if (!m.assets || m.assets.length === 0) return m
          return {
            ...m,
            assets: m.assets.map(a => ({
              ...a,
              url: a.url && a.url.length > 30000 ? '' : a.url
            }))
          }
        })
      }))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized))
    } catch (e) {
      console.warn('LocalStorage 空间不足或写入失败，正在执行降级清理...', e)
      try {
        const trimmed = data.slice(0, 10)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
      } catch (err) {
        console.error('LocalStorage 降级持久化仍失败:', err)
      }
    }
  }

  let persistTimer: ReturnType<typeof setTimeout> | null = null
  watch(sessions, (newSessions) => {
    if (persistTimer) clearTimeout(persistTimer)
    persistTimer = setTimeout(() => {
      safePersistSessions(newSessions)
      persistTimer = null
    }, 250)
  }, { deep: true })

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      if (persistTimer) clearTimeout(persistTimer)
      safePersistSessions(sessions.value)
    })
  }

  const createSession = (initialTitle = '新对话'): string => {
    const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const defaultFallback = (configStore.config.defaultModel as ModelType) || ModelType.R1_Distill_7B
    const modelToUse = currentModel.value || defaultFallback
    sessions.value.unshift({ 
      id, 
      title: initialTitle, 
      messages: [], 
      updatedAt: Date.now(),
      model: modelToUse
    })
    activeSessionId.value = id
    return id
  }

  // 切换会话时不打断后台生成，平滑流转，同时同步会话绑定的模型
  const switchSession = (id: string) => { 
    activeSessionId.value = id 
    const session = sessions.value.find(s => s.id === id)
    if (session) {
      if (session.model) {
        currentModel.value = session.model as ModelType
        aiService.updateConfig({ model: session.model as string })
      } else {
        session.model = currentModel.value
      }
    }
  }
  
  const deleteSession = (id: string) => {
    const index = sessions.value.findIndex(s => s.id === id)
    if (index !== -1) {
      const controller = sessionControllers.get(id)
      if (controller) {
        controller.abort()
        sessionControllers.delete(id)
      }
      generatingSessionIds.value = generatingSessionIds.value.filter(sId => sId !== id)
      sessions.value.splice(index, 1)
      if (activeSessionId.value === id) {
        activeSessionId.value = sessions.value[0]?.id || ''
        const nextSession = sessions.value[0]
        if (nextSession?.model) {
          currentModel.value = nextSession.model as ModelType
        }
      }
    }
  }

  const renameSession = (id: string, newTitle: string) => {
    const session = sessions.value.find(s => s.id === id)
    if (session && newTitle.trim()) {
      session.title = newTitle.trim().slice(0, 30)
      session.updatedAt = Date.now()
    }
  }

  const exportSessionMarkdown = (id: string) => {
    const session = sessions.value.find(s => s.id === id)
    if (!session) return

    let md = `# ${session.title}\n\n*导出时间: ${new Date().toLocaleString()}*\n\n---\n\n`
    session.messages.forEach((m, idx) => {
      const speaker = m.role === 'user' ? '**用户 (User)**' : '**问流 AI (WenFlow)**'
      md += `### ${speaker}\n\n`
      if (m.reasoning_content) {
        md += `> **深度思考过程：**\n> ${m.reasoning_content.replace(/\n/g, '\n> ')}\n\n`
      }
      md += `${m.content}\n\n`
      if (m.images && m.images.length > 0) {
        m.images.forEach(img => {
          md += `![生成图片](${img})\n\n`
        })
      }
      md += `---\n\n`
    })

    md += `*声明：本对话内容由 问流 AI (WenFlow) 智能大模型辅助生成，请仔细甄别，仅供参考。依据相关法规，请勿将生成内容用于非法传播。*\n`

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${session.title.replace(/[\\/:*?"<>|]/g, '_')}_${Date.now()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const updateSessionTitle = (id: string, firstMessage: string) => {
    const session = sessions.value.find(s => s.id === id)
    if (session && (session.title === '新对话' || !session.title)) {
      const cleanFirstLine = firstMessage.split('\n')[0].trim()
      session.title = cleanFirstLine.slice(0, 120) || '新对话'
    }
  }

  const switchModel = (model: ModelType | string) => {
    currentModel.value = model as ModelType
    if (activeSession.value) {
      activeSession.value.model = model as ModelType
    }
    aiService.updateConfig({ model: model as string })
  }

  // --- STREAMING CHAT (支持跨会话后台执行与完成浮窗通知) ---
  const sendStreamMessage = async (sessionId: string, payload: ChatCompletionRequestMessage[]) => {
    const session = sessions.value.find(s => s.id === sessionId)
    if (!session) return

    // 绑定独立 AbortController
    const controller = new AbortController()
    sessionControllers.set(sessionId, controller)
    if (!generatingSessionIds.value.includes(sessionId)) {
      generatingSessionIds.value.push(sessionId)
    }

    session.messages.push({ role: 'assistant', type: 'text', content: '', reasoning_content: '', loading: true })
    const targetIdx = session.messages.length - 1
    const startTime = performance.now()

    // 确定实际请求的模型 (优先使用当前选中模型/会话绑定模型，兜底系统默认模型)
    const targetModel = currentModel.value || session.model || (configStore.config.defaultModel as ModelType) || ModelType.R1_Distill_7B
    session.model = targetModel as ModelType

    const estimateTokens = (str: string): number => {
      if (!str) return 0
      let cjkCount = 0
      let otherCount = 0
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i)
        if (code >= 0x4e00 && code <= 0x9fa5) cjkCount++
        else otherCount++
      }
      return Math.max(1, Math.round(cjkCount * 0.7 + otherCount * 0.3))
    }

    let receivedServerUsage = false
    try {
      await aiService.streamChat(payload, (chunk) => {
        if (chunk.reasoning_content) {
          session.messages[targetIdx].reasoning_content = (session.messages[targetIdx].reasoning_content || '') + chunk.reasoning_content
        }
        if (chunk.content) {
          session.messages[targetIdx].content += chunk.content
        }
        
        if (chunk.usage) {
          receivedServerUsage = true
          const endTime = performance.now()
          const durationSec = Math.max(0.1, (endTime - startTime) / 1000)
          const pTokens = chunk.usage.prompt_tokens || 0
          const cTokens = chunk.usage.completion_tokens || 0
          const tTokens = chunk.usage.total_tokens || (pTokens + cTokens)
          const speed = cTokens > 0 ? parseFloat((cTokens / durationSec).toFixed(1)) : 0
          session.messages[targetIdx].usage = {
            prompt_tokens: pTokens,
            completion_tokens: cTokens,
            total_tokens: tTokens,
            speed,
            duration: parseFloat(durationSec.toFixed(2))
          }
        }
        session.updatedAt = Date.now()
      }, { 
        signal: controller.signal,
        model: targetModel as string
      })

      // 服务端未返回 usage 时的智能本地高精度估算兜底
      if (!receivedServerUsage && session.messages[targetIdx]) {
        const endTime = performance.now()
        const durationSec = Math.max(0.1, (endTime - startTime) / 1000)
        const promptText = payload.map(p => typeof p.content === 'string' ? p.content : JSON.stringify(p.content)).join('\n')
        const completionText = (session.messages[targetIdx].reasoning_content || '') + (session.messages[targetIdx].content || '')
        const pTokens = estimateTokens(promptText)
        const cTokens = estimateTokens(completionText)
        const tTokens = pTokens + cTokens
        const speed = cTokens > 0 ? parseFloat((cTokens / durationSec).toFixed(1)) : 0
        session.messages[targetIdx].usage = {
          prompt_tokens: pTokens,
          completion_tokens: cTokens,
          total_tokens: tTokens,
          speed,
          duration: parseFloat(durationSec.toFixed(2))
        }
      }

      // 后台完成通知机制：若用户当前不在该会话中，弹出优雅右侧浮窗
      if (activeSessionId.value !== sessionId) {
        const preview = session.messages[targetIdx]?.content?.slice(0, 90) || '推理与回答已全部生成完成。'
        ElNotification({
          title: `会话「${session.title}」已生成完毕`,
          message: `${preview}...`,
          type: 'success',
          position: 'top-right',
          duration: 5000,
          onClick: () => {
            activeSessionId.value = sessionId
          }
        })
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Session naturally aborted:', sessionId)
        return
      }
      console.error('Error during streaming:', error)
      session.messages[targetIdx].content += '\n\n*(网络连接中断或请求失败)*'
      throw error
    } finally {
      sessionControllers.delete(sessionId)
      generatingSessionIds.value = generatingSessionIds.value.filter(sId => sId !== sessionId)
      if (session.messages[targetIdx]) {
        session.messages[targetIdx].loading = false
      }
    }
  }

  // --- IMAGE GENERATION (ART STUDIO) ---
  const generateImageInChat = async (sessionId: string, prompt: string, options: any = {}) => {
    const session = sessions.value.find(s => s.id === sessionId)
    if (!session) return

    if (!generatingSessionIds.value.includes(sessionId)) {
      generatingSessionIds.value.push(sessionId)
    }
    
    session.messages.push({
      role: 'assistant',
      type: 'image',
      content: '正在为您创作艺术画作...',
      images: [],
      loading: true,
      progress: 0,
      batchSize: options.batch_size || 1
    })
    const targetIdx = session.messages.length - 1

    let progInt: ReturnType<typeof setInterval> | undefined
    const controller = new AbortController()
    sessionControllers.set(sessionId, controller)

    try {
      progInt = setInterval(() => {
        if (session.messages[targetIdx]?.progress! < 90) {
          session.messages[targetIdx].progress! += 5
        }
      }, 800)

      const targetImgModel = (session.model && session.model !== ModelType.ART) 
        ? (session.model as string) 
        : (options.model || 'Kwai-Kolors/Kolors')

      const response = await imageService.generateImage({
        model: targetImgModel,
        prompt: prompt || 'beautiful aesthetic digital art',
        image_size: options.size || '1024x1024',
        num_inference_steps: options.steps || 20,
        batch_size: options.batch_size || 1,
        guidance_scale: options.guidance_scale || 7.5,
        negative_prompt: options.negative_prompt || '',
         seed: options.seed ? parseInt(options.seed) : undefined,
         image: options.referenceImage || options.image || undefined,
         signal: controller.signal
      })

      session.messages[targetIdx].images = (response.images || []).map(img => img.url)
      session.messages[targetIdx].progress = 100
      session.messages[targetIdx].content = '绘制完成'
      session.messages[targetIdx].loading = false
      session.updatedAt = Date.now()

      if (activeSessionId.value !== sessionId) {
        ElNotification({
          title: `绘画「${session.title}」已生成完毕`,
          message: `画面已成功渲染，点击立即查看。`,
          type: 'success',
          position: 'top-right',
          duration: 5000,
          onClick: () => {
            activeSessionId.value = sessionId
          }
        })
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        session.messages[targetIdx].content = '已停止生成'
        session.messages[targetIdx].loading = false
        return
      }
      console.error('Image gen error:', error)
      session.messages[targetIdx].content = `图像生成失败: ${error.message || '未知错误'}`
      session.messages[targetIdx].loading = false
      throw error
    } finally {
      if (progInt) clearInterval(progInt)
      if (sessionControllers.get(sessionId) === controller) sessionControllers.delete(sessionId)
      generatingSessionIds.value = generatingSessionIds.value.filter(sId => sId !== sessionId)
    }
  }

  // --- MULTIMODAL SENDING ---
  const sendMessage = async (message: string, mode: 'chat' | 'image' = 'chat', options: any = {}) => {
    const assets: MessageAsset[] = options.assets || []
    const imageAssets = assets.filter(asset => asset.type === 'image')

    // 智能多模态视觉检测与自适应切换
    if (mode === 'chat' && imageAssets.length > 0) {
      if (!isVLMModel(currentModel.value)) {
        const recommendedVisionModel = 'Qwen/Qwen2.5-VL-72B-Instruct'
        switchModel(recommendedVisionModel)
        ElMessage.success({
          message: '检测到图片，已自动切换至多模态视觉模型 Qwen 2.5 VL',
          duration: 3000
        })
      }
      if (assets.some(asset => asset.type === 'pdf')) {
        ElMessage.warning('当前聊天通道不支持直接解析 PDF 原生文件，建议将页面截屏为图片后发送。')
      }
    }

    if (!activeSessionId.value) createSession()
    const sessionId = activeSessionId.value
    const session = sessions.value.find(s => s.id === sessionId)
    if (!session) return

    const trimmedMsg = (message || '').trim()
    const effectiveText = trimmedMsg || (assets.length > 0 ? `[${assets[0].type.toUpperCase()} 分析]` : '你好')
    if (session.messages.length === 0) updateSessionTitle(sessionId, effectiveText)

    session.messages.push({ 
      role: 'user', 
      type: mode === 'image' ? 'image' : 'text', 
      content: trimmedMsg || (assets.length > 0 ? '请分析上传的图片内容。' : '你好'),
      assets: assets.length > 0 ? assets : undefined
    })

    if (mode === 'image') {
      await generateImageInChat(sessionId, trimmedMsg, options)
    } else {
      const isVLM = isVLMModel(currentModel.value)

      // 文本历史清洗与滑动窗口保护：剔除未完成/报错脏数据，保留最近 20 轮有效会话
      const allTextMsgs = session.messages.filter(m => {
        if (m.type !== 'text') return false
        if (m.loading) return false
        return true
      })
      const windowMsgs = allTextMsgs.length > 20 ? allTextMsgs.slice(-20) : allTextMsgs

      const payload: ChatCompletionRequestMessage[] = windowMsgs
        .map(m => {
          const cleanText = (m.content || '')
            .replace(/\n\n\*\(网络连接中断或请求失败\)\*$/, '')
            .trim()

          if (isVLM && m.assets && m.assets.length > 0) {
            const contentParts: MultimodalContent[] = []
            
            m.assets.forEach(asset => {
              if (asset.type === 'image' && asset.url) {
                contentParts.push({ 
                  type: 'image_url', 
                  image_url: { url: asset.url } 
                })
              } else if (asset.type === 'pdf') {
                contentParts.push({
                  type: 'text',
                  text: `[PDF 附件：${asset.name || '未命名文件'}]`
                })
              }
            })

            const textContent = cleanText || '请识别并详细分析以上图片内容。'
            contentParts.push({ type: 'text', text: textContent })
            return { role: m.role, content: contentParts }
          }
          
          return {
            role: m.role,
            content: cleanText || (m.role === 'user' ? '你好' : '好的。')
          }
        })
        .filter(p => {
          if (Array.isArray(p.content)) return p.content.length > 0
          return typeof p.content === 'string' && p.content.trim().length > 0
        })

      await sendStreamMessage(sessionId, payload)
    }
  }

  const regenerate = async (index: number) => {
    const session = activeSession.value
    if (!session || index < 0 || index >= session.messages.length) return

    const targetUserMsg = session.messages[index - 1]
    if (!targetUserMsg || targetUserMsg.role !== 'user') return

    session.messages = session.messages.slice(0, index)
    await sendMessage(targetUserMsg.content, targetUserMsg.type === 'image' ? 'image' : 'chat', {
      assets: targetUserMsg.assets
    })
  }

  const continueConversation = async (prefix: string) => {
    await sendMessage(`请继续输出未完成的内容。上文最后是：${prefix.slice(-50)}`)
  }

  const clearCurrentSession = () => {
    if (activeSession.value) {
      abortGeneration(activeSession.value.id)
      activeSession.value.messages = []
      activeSession.value.updatedAt = Date.now()
    }
  }

  return {
    sessions,
    activeSessionId,
    activeSession,
    messages,
    loading,
    currentModel,
    pendingAssets,
    setPendingAssets,
    consumePendingAssets,
    createSession,
    switchSession,
    deleteSession,
    renameSession,
    exportSessionMarkdown,
    switchModel,
    sendMessage,
    regenerate,
    regenerateMessage: regenerate,
    continueConversation,
    clearCurrentSession,
    clearChat: clearCurrentSession,
    abortGeneration,
    isSessionGenerating,
    generatingSessionIds
  }
})
