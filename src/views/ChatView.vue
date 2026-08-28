<template>
  <div class="h-[100dvh] min-h-[100dvh] overflow-hidden">
    <ChatContainer
      :messages="chatStore.messages"
      :loading="chatStore.loading"
      @send="handleSend"
      @clear="chatStore.clearCurrentSession"
      @model-change="chatStore.switchModel"
      @regenerate="chatStore.regenerate"
      @abort="chatStore.abortGeneration"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useChatStore } from '../stores/chat'
import { ModelType } from '@/services/aiService'
import ChatContainer from '@/components/chat/ChatContainer.vue'

const chatStore = useChatStore()
const route = useRoute()
const router = useRouter()

const handleSend = async (message: string, mode: 'chat' | 'image' = 'chat', options: any = {}) => {
  try {
    await chatStore.sendMessage(message, mode, options)
  } catch (error: any) {
    ElMessage.error({
      message: error.message || '发送失败，请检查网络连接',
      duration: 5000,
      showClose: true
    })
  }
}

// 处理来自首页的初始搜索/附件请求以及基于 URL ?id=xxx 的会话路由激活
const checkInitialPrompt = async () => {
  const queryPrompt = (route.query.q as string) || ''
  const mode = (route.query.mode as 'chat' | 'image') || 'chat'
  const queryModel = route.query.model as ModelType
  const querySessionId = (route.query.id as string) || ''
  const pendingAssets = chatStore.consumePendingAssets()

  const hasText = queryPrompt.trim().length > 0
  const hasAssets = pendingAssets.length > 0

  if (hasText || hasAssets) {
    // 1. 创建新会话
    const newId = chatStore.createSession()
    // 2. 切换模型 (如果首页指定了)
    if (queryModel) chatStore.switchModel(queryModel)
    
    // 3. 提取预选资产 (从 HomeView 传入的)
    const options: any = {}
    if (hasAssets) {
      options.assets = pendingAssets
    }

    // 4. 发送初始消息 (支持纯文字、图文混排或纯图识别)
    await chatStore.sendMessage(queryPrompt, mode, options)
    
    // 5. 将 URL 同步为标准 /chat?id=xxx 参数
    router.replace({ path: '/chat', query: { id: newId } })
  } else {
    // 如果 URL 中携带有效的 id 参数，优先激活该会话
    if (querySessionId && chatStore.sessions.some(s => s.id === querySessionId)) {
      chatStore.switchSession(querySessionId)
    } else if (chatStore.sessions.length > 0) {
      const targetId = chatStore.activeSessionId || chatStore.sessions[0].id
      chatStore.switchSession(targetId)
      router.replace({ path: '/chat', query: { id: targetId } })
    } else {
      const newId = chatStore.createSession()
      router.replace({ path: '/chat', query: { id: newId } })
    }
  }
}

onMounted(() => {
  checkInitialPrompt()
})

// 监听 URL 中的 id 参数变化（如用户点击浏览器后退/前进按钮）
watch(() => route.query.id, (newId) => {
  if (typeof newId === 'string' && newId && newId !== chatStore.activeSessionId) {
    if (chatStore.sessions.some(s => s.id === newId)) {
      chatStore.switchSession(newId)
    }
  }
})

// 监听首页传入的新查询
watch(() => route.query.q, (newQ) => {
  if (newQ !== undefined) {
    checkInitialPrompt()
  }
})
</script>
