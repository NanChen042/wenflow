import { 
  ModelType, 
  MultimodalContent, 
  ChatCompletionRequestMessage, 
  StreamChunk 
} from '@/types/chat'
import { supportsImageInput } from './modelCapabilities'

export { ModelType }
export type { MultimodalContent, ChatCompletionRequestMessage, StreamChunk }

// API 配置 (支持 SiliconFlow、DeepSeek 官方与 OpenRouter 三通道智能路由)
const API_CONFIG = {
  siliconFlowBaseURL: 'https://api.siliconflow.cn/v1',
  deepseekBaseURL: 'https://api.deepseek.com',
  openRouterBaseURL: 'https://openrouter.ai/api/v1',
  siliconFlowApiKey: import.meta.env.VITE_SILICONFLOW_API_KEY || '',
  deepseekApiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || '',
  openrouterApiKey: import.meta.env.VITE_OPENROUTER_API_KEY || ''
}

/**
 * 更新 SiliconFlow API Key
 */
export const setSiliconFlowKey = (key: string) => {
  API_CONFIG.siliconFlowApiKey = (key || '').trim()
}

/**
 * 更新 DeepSeek 官方 API Key
 */
export const setDeepSeekKey = (key: string) => {
  API_CONFIG.deepseekApiKey = (key || '').trim()
}

/**
 * 更新 OpenRouter API Key
 */
export const setOpenRouterKey = (key: string) => {
  API_CONFIG.openrouterApiKey = (key || '').trim()
}

// 请求配置接口
interface ChatRequestConfig {
  model: ModelType | string
  temperature?: number
  max_tokens?: number
  stream?: boolean
  system_message?: string
}

// 默认配置
const DEFAULT_CONFIG: ChatRequestConfig = {
  model: ModelType.R1_Distill_7B,
  temperature: 0.7,
  max_tokens: 4000,
  stream: true,
  system_message: '你是 问流 AI (WenFlow) 智能助手，具备卓越的代码、逻辑推理与多模态分析能力。回答应清晰、专业且有帮助。'
}

/**
 * AI 聊天服务类
 */
class AIChatService {
  public config: ChatRequestConfig

  constructor(config: Partial<ChatRequestConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ChatRequestConfig>) {
    this.config = { ...this.config, ...newConfig }
  }

  // 流式聊天核心方法
  async streamChat(
    messages: ChatCompletionRequestMessage[], 
    onChunk: (chunk: StreamChunk) => void, 
    options: { signal?: AbortSignal; model?: string; temperature?: number; max_tokens?: number } = {}
  ) {
    try {
      const rawTargetModel = options.model || this.config.model || ModelType.R1_Distill_7B
      const lowerModel = rawTargetModel.toLowerCase()

      // 1. 判断是否走 OpenRouter 聚合通道
      const isOpenRouterModel = (
        lowerModel.startsWith('openrouter/') ||
        lowerModel.endsWith(':free') ||
        lowerModel.startsWith('google/') ||
        lowerModel.startsWith('anthropic/') ||
        lowerModel.startsWith('openai/') ||
        lowerModel.startsWith('mistralai/') ||
        lowerModel.startsWith('cohere/') ||
        lowerModel.startsWith('perplexity/') ||
        lowerModel.startsWith('x-ai/') ||
        lowerModel.startsWith('nousresearch/') ||
        lowerModel.startsWith('sao10k/') ||
        lowerModel.startsWith('deepseek/deepseek-') ||
        lowerModel.startsWith('meta-llama/llama-3.3')
      )

      // 2. 判断是否直连 DeepSeek 官方通道
      const isOfficialDeepSeekModel = !isOpenRouterModel && (
        rawTargetModel === ModelType.V3 || 
        rawTargetModel === ModelType.Reasoner ||
        rawTargetModel === 'deepseek-chat' ||
        rawTargetModel === 'deepseek-reasoner' ||
        rawTargetModel === 'deepseek-ai/DeepSeek-V3' ||
        rawTargetModel === 'deepseek-ai/DeepSeek-R1'
      )
      
      const useOfficialDeepSeek = Boolean(API_CONFIG.deepseekApiKey && isOfficialDeepSeekModel)

      let baseURL = API_CONFIG.siliconFlowBaseURL
      let apiKey = API_CONFIG.siliconFlowApiKey
      let isChannelOpenRouter = false

      if (isOpenRouterModel) {
        baseURL = API_CONFIG.openRouterBaseURL
        apiKey = API_CONFIG.openrouterApiKey
        isChannelOpenRouter = true
      } else if (useOfficialDeepSeek) {
        baseURL = API_CONFIG.deepseekBaseURL
        apiKey = API_CONFIG.deepseekApiKey
      }

      // 官方模型标识转换
      let targetModel = rawTargetModel
      if (useOfficialDeepSeek) {
        if (rawTargetModel.includes('R1') || rawTargetModel.includes('Reasoner')) {
          targetModel = 'deepseek-reasoner'
        } else {
          targetModel = 'deepseek-chat'
        }
      }

      if (!apiKey) {
        if (isChannelOpenRouter) {
          throw new Error('未配置 OpenRouter API Key，请点击左下角【设置】填入 OpenRouter 密钥 (sk-or-v1-...)。')
        } else {
          throw new Error('未配置 API Key，请点击左下角【设置】填入 SiliconFlow 或 DeepSeek 官方 API Key。')
        }
      }

      // 校验并清洗输入消息
      const validMessages = messages.filter(m => {
        if (!m || !m.role) return false
        if (Array.isArray(m.content)) return m.content.length > 0
        return typeof m.content === 'string' && m.content.trim().length > 0
      })

      if (validMessages.length === 0) {
        throw new Error('发送消息内容不能为空。')
      }

      const isReasoner = (
        targetModel === 'deepseek-reasoner' || 
        targetModel.includes('DeepSeek-R1') || 
        targetModel.toLowerCase().includes('reasoner')
      )

      // DeepSeek 官方 deepseek-reasoner 协议不推荐/不支持 system 消息
      const requestMessages: any[] = []
      if (!isReasoner && this.config.system_message) {
        requestMessages.push({ role: 'system', content: this.config.system_message })
      }
      requestMessages.push(...validMessages)

      const requestBody: any = {
        messages: requestMessages,
        model: targetModel,
        stream: true,
        stream_options: { include_usage: true }
      }

      if (isChannelOpenRouter) {
        requestBody.transforms = ['middle-out']
        if (isReasoner || lowerModel.includes('r1') || lowerModel.includes('reason') || lowerModel.includes('qwq') || lowerModel.includes('thinking')) {
          requestBody.reasoning = { effort: 'high' }
        }
      }

      if (!isReasoner) {
        requestBody.temperature = options.temperature ?? this.config.temperature ?? 0.7
      }

      if (options.max_tokens || this.config.max_tokens) {
        requestBody.max_tokens = options.max_tokens ?? this.config.max_tokens
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      }

      if (isChannelOpenRouter) {
        headers['HTTP-Referer'] = 'https://wenflow.ai'
        headers['X-Title'] = 'WenFlow AI'
      }

      const response = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: options.signal
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const rawMsg = errorData.error?.message || errorData.message || ''
        const code = errorData.code || response.status

        let userMsg = rawMsg || `请求失败 (${response.status})`
        const lowerRaw = rawMsg.toLowerCase()

        if (response.status === 401 || code === 30014 || lowerRaw.includes('token is invalid') || lowerRaw.includes('unauthorized')) {
          userMsg = `API Key 无效或鉴权失败，请在【设置】中检查并更新您在 ${isChannelOpenRouter ? 'OpenRouter' : useOfficialDeepSeek ? 'DeepSeek 官方' : 'SiliconFlow'} 平台的有效 API Key。`
        } else if (lowerRaw.includes('terms of service') || lowerRaw.includes('violation of provider') || lowerRaw.includes('prohibited due to')) {
          userMsg = `上游模型厂商服务条款拦截 (Terms Of Service)：该模型（如 Google Gemini / Anthropic Claude）存在严格的地区合规或内容安全策略。建议：① 切换科学上网代理节点至海外非受限地区（如美国/日本/新加坡）；② 或切换为无地区限制的国内/开源模型（如 SiliconFlow 免费模型、Qwen 2.5、DeepSeek 等）。`
        } else if (lowerRaw.includes('location is not supported') || lowerRaw.includes('region') || lowerRaw.includes('country')) {
          userMsg = '上游厂商不支持当前地区 IP 访问，请开启或切换全局代理节点至支持地区，或选用 SiliconFlow 国内高速免费模型。'
        } else if (response.status === 429 || code === 20012) {
          if (isChannelOpenRouter) {
            userMsg = 'OpenRouter 免费模型调用频次已达限制（未充值账户通常为 50 次/天，充值 $10 可提高至 1000 次/天），建议切换为 SiliconFlow 免费模型或稍后重试。'
          } else {
            userMsg = '当前模型调用并发超限 (Rate Limit)，请稍后重试或切换至其他模型。'
          }
        } else if (lowerRaw.includes('model disabled') || code === 30006) {
          userMsg = `模型【${targetModel}】已被服务平台下线停用，请在模型切换菜单中选择其他可用模型。`
        } else if (code === 20015 || lowerRaw.includes('balance') || lowerRaw.includes('余额不足') || lowerRaw.includes('credits')) {
          userMsg = '账户算力余额不足，请前往平台控制台充值或在模型广场中选用 0 元免费模型。'
        }

        throw new Error(userMsg)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder('utf-8')

      if (!reader) throw new Error('读取流失败')

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        // 未闭合的最后一行碎片保留在 buffer 中，供下个 chunk 拼接
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === 'data: [DONE]') continue
          
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6))
              const streamChunk: StreamChunk = {}

              // 处理内容增量
              if (data.choices?.[0]?.delta?.content !== undefined) {
                streamChunk.content = data.choices[0].delta.content
              }

              // 处理思维链增量 (支持 OpenRouter delta.reasoning 以及 SiliconFlow/DeepSeek delta.reasoning_content)
              const reasoningDelta = data.choices?.[0]?.delta?.reasoning_content ?? data.choices?.[0]?.delta?.reasoning
              if (reasoningDelta !== undefined) {
                streamChunk.reasoning_content = reasoningDelta
              }

              // 处理使用统计
              if (data.usage) {
                streamChunk.usage = data.usage
              }

              if (streamChunk.content !== undefined || streamChunk.reasoning_content !== undefined || streamChunk.usage) {
                onChunk(streamChunk)
              }
            } catch (e) {
              console.warn('SSE JSON parse error for line:', trimmed, e)
            }
          }
        }
      }

      // 如果流结束时 buffer 中还有未消费的合法完整数据，做最后一次尝试解析
      if (buffer.trim().startsWith('data: ') && !buffer.includes('[DONE]')) {
        try {
          const data = JSON.parse(buffer.trim().slice(6))
          const streamChunk: StreamChunk = {}
          if (data.choices?.[0]?.delta?.content !== undefined) streamChunk.content = data.choices[0].delta.content
          const reasoningDelta = data.choices?.[0]?.delta?.reasoning_content ?? data.choices?.[0]?.delta?.reasoning
          if (reasoningDelta !== undefined) streamChunk.reasoning_content = reasoningDelta
          if (data.usage) streamChunk.usage = data.usage
          onChunk(streamChunk)
        } catch (_) {}
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw error // 交给上层区分“用户中断”和“请求成功”
      }
      console.error('Stream Chat API error:', error)
      throw new Error(error.message || '聊天服务出错了')
    }
  }

  /**
   * 提示词一键 AI 润色与结构化优化 (Prompt Enhancer - 使用极速轻量/免费模型)
   */
  async optimizePrompt(prompt: string, options: { model?: string; signal?: AbortSignal } = {}): Promise<string> {
    const raw = (prompt || '').trim()
    if (!raw) return ''

    const messages = [
      {
        role: 'system',
        content: `你是一个资深 Prompt 提示词优化与工程专家。
用户的输入可能非常简短、口语化或不完整。
你的任务是将用户的需求扩写并重构为一段结构化、表达精准、意图明确的高质量 Prompt，以便大模型生成最优质的解答。

【核心规则】：
1. 必须精准抓住用户的核心主题与诉求（如：“菜市场” -> 拓展为描写菜市场烟火气细节与生动场景的深度写作提示词；“写个爬虫” -> 拓展为包含并发、反爬、异常处理的规范代码开发需求）。
2. 适当补全：明确角色定位、任务背景、拆分维度、具体格式规范（如分点陈述、案例论证等）。
3. 纯净输出：直接输出优化后的完整 Prompt 正文，严禁输出任何前后缀废话（例如：严禁输出“好的，为您优化如下：”、“\`\`\`” 等包裹说明）。`
      },
      {
        role: 'user',
        content: `请帮我扩写并优化以下内容，直接输出优化后的高质量 Prompt：\n\n${raw}`
      }
    ]

    // 构建可用候选通道列表（按优先级：SiliconFlow -> OpenRouter -> DeepSeek 官方）
    const candidateChannels: { model: string; name: string }[] = []
    
    if (API_CONFIG.siliconFlowApiKey) {
      candidateChannels.push({ model: 'Qwen/Qwen2.5-7B-Instruct', name: 'SiliconFlow' })
    }
    if (API_CONFIG.openrouterApiKey) {
      candidateChannels.push({ model: 'google/gemini-2.0-flash-exp:free', name: 'OpenRouter' })
    }
    if (API_CONFIG.deepseekApiKey) {
      candidateChannels.push({ model: 'deepseek-chat', name: 'DeepSeek 官方' })
    }

    if (candidateChannels.length === 0) {
      throw new Error('未检测到任何 API Key，请点击左下角【设置】填入 SiliconFlow、OpenRouter 或 DeepSeek 官方密钥。')
    }

    let lastError: any = null

    for (const channel of candidateChannels) {
      let optimizedResult = ''
      try {
        await this.streamChat(
          messages as any,
          (chunk) => {
            if (chunk.content) {
              optimizedResult += chunk.content
            }
          },
          {
            model: channel.model,
            temperature: 0.6,
            max_tokens: 1200,
            signal: options.signal
          }
        )

        const clean = optimizedResult.trim()
          .replace(/^```(markdown|text)?\n?/i, '')
          .replace(/\n?```$/i, '')
          .replace(/^(好的|以下是|为您优化后的提示词[：:])\s*/i, '')
          .trim()

        if (clean && clean !== raw) {
          return clean
        }
        return raw
      } catch (e: any) {
        console.warn(`Channel ${channel.name} optimization failed, trying next fallback:`, e)
        lastError = e
        // 如果还有下一个可用渠道，继续尝试，否则抛出
      }
    }

    throw lastError || new Error('提示词优化服务暂时不可用，请检查设置中的密钥是否有效。')
  }
}

// 导出服务实例
export const aiService = new AIChatService()

/**
 * 判断模型是否支持多模态 (视觉/语音/视频)
 */
export const isVLMModel = supportsImageInput
