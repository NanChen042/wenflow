import type { SiliconModelItem } from './modelsService'
import { supportsImageInput } from './modelCapabilities'

export interface OpenRouterPricing {
  prompt: string
  completion: string
  request?: string
  image?: string
}

export interface OpenRouterRawModel {
  id: string
  name?: string
  description?: string
  context_length?: number
  pricing?: OpenRouterPricing
  architecture?: {
    modality?: string
    tokenizer?: string
    instruct_type?: string
  }
  top_provider?: {
    context_length?: number
    max_completion_tokens?: number
    is_moderated?: boolean
  }
}

export interface OpenRouterAuthInfo {
  label?: string
  usage?: number
  limit?: number
  is_free_tier?: boolean
  rate_limit?: {
    requests?: number
    interval?: string
  }
}

const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1'

/**
 * 格式化上下文长度 (Tokens)
 */
export function formatContextLength(tokens?: number): string {
  if (!tokens || tokens <= 0) return '32K'
  if (tokens >= 1000000) return `${Math.round(tokens / 1000000)}M`
  if (tokens >= 1000) return `${Math.round(tokens / 1000)}K`
  return `${tokens}`
}

/**
 * 从 OpenRouter 模型 ID 提取标准化厂商名称
 */
export function extractOpenRouterProvider(id: string): string {
  const lower = id.toLowerCase()
  if (lower.startsWith('openrouter/')) return 'OpenRouter'
  if (lower.startsWith('google/')) return 'Google'
  if (lower.startsWith('anthropic/')) return 'Anthropic'
  if (lower.startsWith('openai/')) return 'OpenAI'
  if (lower.startsWith('meta-llama/') || lower.startsWith('meta/')) return 'Meta'
  if (lower.startsWith('deepseek/')) return 'DeepSeek'
  if (lower.startsWith('qwen/')) return 'Qwen'
  if (lower.startsWith('mistralai/') || lower.startsWith('mistral/')) return 'Mistral'
  if (lower.startsWith('microsoft/')) return 'Microsoft'
  if (lower.startsWith('cohere/')) return 'Cohere'
  if (lower.startsWith('perplexity/')) return 'Perplexity'
  if (lower.startsWith('x-ai/') || lower.startsWith('grok')) return 'xAI'
  if (lower.startsWith('amazon/')) return 'Amazon'
  if (lower.startsWith('nousresearch/')) return 'Nous'
  if (lower.startsWith('sao10k/')) return 'Sao10K'
  
  const prefix = id.split('/')[0]
  return prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : 'OpenRouter'
}

/**
 * 格式化价格友好提示
 */
export function formatOpenRouterPricing(pricing?: OpenRouterPricing): string {
  if (!pricing) return '计费模型'
  const prompt = Number(pricing.prompt ?? 0)
  const completion = Number(pricing.completion ?? 0)
  if (prompt === 0 && completion === 0) return '免费 ¥0'
  
  const promptPerMillion = isNaN(prompt) ? '0.00' : (prompt * 1000000).toFixed(2)
  const completionPerMillion = isNaN(completion) ? '0.00' : (completion * 1000000).toFixed(2)
  return `$${promptPerMillion} / $${completionPerMillion} (每百万 Tokens)`
}

/**
 * 官方精选 OpenRouter 热门模型（离线预置及无网兜底）
 */
export const BUILTIN_OPENROUTER_MODELS: SiliconModelItem[] = [
  {
    id: 'openrouter/free',
    label: 'OpenRouter Free (官方智能免费路由)',
    value: 'openrouter/free',
    desc: 'OpenRouter 官方提供的零成本 Free Router，自动从当前可用的免费顶级模型池（Gemini、Llama、Qwen、DeepSeek 等）中智能择优路由，永久零费用。',
    category: 'OpenRouter 聚合系列',
    provider: 'OpenRouter',
    type: 'chat',
    tag: '智能免费路由',
    tagBadgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold',
    tags: ['官方免费', '智能路由', '多模型混合', '零成本'],
    contextWindow: '128K',
    paramScale: 'Auto',
    isFree: true,
    isNew: true,
    supportsImage: true
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    label: 'Gemini 2.0 Flash (实验免费版)',
    value: 'google/gemini-2.0-flash-exp:free',
    desc: 'Google 最新一代 Gemini 2.0 Flash 实验模型，具备极速响应速度、超强多模态理解与 100 万超长上下文能力，官方 0 元调用。',
    category: 'OpenRouter 聚合系列',
    provider: 'Google',
    type: 'chat',
    tag: 'Gemini 2.0 免费',
    tagBadgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold',
    tags: ['免费 (¥0)', '多模态', '1M 上下文', 'Google 旗舰'],
    contextWindow: '1M',
    paramScale: 'Flash',
    isFree: true,
    isNew: true,
    supportsImage: true
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    label: 'Llama 3.3 70B (免费开源旗舰)',
    value: 'meta-llama/llama-3.3-70b-instruct:free',
    desc: 'Meta 顶级开源 70B 语言模型，在代码、数学、多语言对话与复杂推理上媲美 GPT-4o，OpenRouter 官方提供免费端点。',
    category: 'OpenRouter 聚合系列',
    provider: 'Meta',
    type: 'chat',
    tag: 'Meta 70B 免费',
    tagBadgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold',
    tags: ['免费 (¥0)', '70B 旗舰', '128K', '代码/逻辑'],
    contextWindow: '128K',
    paramScale: '70B',
    isFree: true,
    isNew: true
  },
  {
    id: 'deepseek/deepseek-r1:free',
    label: 'DeepSeek R1 (免费深度推理)',
    value: 'deepseek/deepseek-r1:free',
    desc: 'DeepSeek 671B 全参数深度强化学习思考模型，具备长思维链与自省推理能力，OpenRouter 官方免费通道。',
    category: 'OpenRouter 聚合系列',
    provider: 'DeepSeek',
    type: 'chat',
    tag: 'R1 思考 免费',
    tagBadgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-bold',
    tags: ['免费 (¥0)', '深度思考', '671B MoE', '推理模型'],
    contextWindow: '64K',
    paramScale: '671B',
    isFree: true
  },
  {
    id: 'deepseek/deepseek-chat:free',
    label: 'DeepSeek V3 (免费全能对话)',
    value: 'deepseek/deepseek-chat:free',
    desc: 'DeepSeek-V3 671B 基础大模型，高吞吐、极强知识覆盖与代码生成，OpenRouter 官方免费接入点。',
    category: 'OpenRouter 聚合系列',
    provider: 'DeepSeek',
    type: 'chat',
    tag: 'V3 对话 免费',
    tagBadgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold',
    tags: ['免费 (¥0)', '671B MoE', '通用对话', '代码工程'],
    contextWindow: '64K',
    paramScale: '671B',
    isFree: true
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct:free',
    label: 'Qwen 2.5 72B (通义千问 免费)',
    value: 'qwen/qwen-2.5-72b-instruct:free',
    desc: '阿里通义千问 2.5 72B Instruct 官方开源旗舰，中文理解、角色扮演、长文创作顶尖。',
    category: 'OpenRouter 聚合系列',
    provider: 'Qwen',
    type: 'chat',
    tag: 'Qwen 72B 免费',
    tagBadgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold',
    tags: ['免费 (¥0)', '72B 旗舰', '中文顶尖', '128K'],
    contextWindow: '128K',
    paramScale: '72B',
    isFree: true
  },
  {
    id: 'mistralai/mistral-small-24b-instruct-2501:free',
    label: 'Mistral Small 24B (免费高效推理)',
    value: 'mistralai/mistral-small-24b-instruct-2501:free',
    desc: 'Mistral AI 2025 最新 24B 紧凑高能指令模型，擅长多语言理解与逻辑推理。',
    category: 'OpenRouter 聚合系列',
    provider: 'Mistral',
    type: 'chat',
    tag: 'Mistral 免费',
    tagBadgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold',
    tags: ['免费 (¥0)', '24B', '多语言', '高能效'],
    contextWindow: '32K',
    paramScale: '24B',
    isFree: true
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    label: 'Claude 3.5 Sonnet (行业旗舰标杆)',
    value: 'anthropic/claude-3.5-sonnet',
    desc: 'Anthropic 顶尖多模态大模型，在逻辑编码、长文本推理与学术理解领域位居全球前列。',
    category: 'OpenRouter 聚合系列',
    provider: 'Anthropic',
    type: 'chat',
    tag: 'Claude 旗舰',
    tagBadgeClass: 'bg-amber-50 text-amber-700 border border-amber-200/80 font-bold',
    tags: ['Claude 3.5', '代码天花板', '200K 上下文', '视觉解析'],
    contextWindow: '200K',
    paramScale: 'Sonnet',
    isFree: false,
    supportsImage: true
  },
  {
    id: 'openai/gpt-4o',
    label: 'GPT-4o (OpenAI 旗舰全能)',
    value: 'openai/gpt-4o',
    desc: 'OpenAI 旗舰全能全模态模型，支持视觉解析、极速响应与超强复杂指令遵循。',
    category: 'OpenRouter 聚合系列',
    provider: 'OpenAI',
    type: 'chat',
    tag: 'GPT-4o 旗舰',
    tagBadgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold',
    tags: ['GPT-4o', '视觉解析', '128K', 'OpenAI 官方'],
    contextWindow: '128K',
    paramScale: 'Omni',
    isFree: false,
    supportsImage: true
  }
]

class OpenRouterService {
  /**
   * 从 OpenRouter GET /models 拉取 400+ 实时在线模型
   */
  async fetchLiveModels(apiKey?: string): Promise<{ success: boolean; isOnline: boolean; items: SiliconModelItem[]; message?: string }> {
    const key = apiKey?.trim() || ''
    
    try {
      const headers: Record<string, string> = {
        'HTTP-Referer': 'https://wenflow.ai',
        'X-Title': 'WenFlow AI'
      }
      if (key) {
        headers['Authorization'] = `Bearer ${key}`
      }

      const res = await fetch(`${OPENROUTER_API_BASE}/models`, { headers })
      if (!res.ok) {
        return {
          success: false,
          isOnline: false,
          items: BUILTIN_OPENROUTER_MODELS,
          message: `获取 OpenRouter 模型列表失败 (${res.status})`
        }
      }

      const json = await res.json()
      const rawData: OpenRouterRawModel[] = json.data || []

      if (!Array.isArray(rawData) || rawData.length === 0) {
        return {
          success: true,
          isOnline: true,
          items: BUILTIN_OPENROUTER_MODELS,
          message: 'OpenRouter 云端未返回可用端点'
        }
      }

      const items: SiliconModelItem[] = rawData.map(raw => {
        const id = raw.id
        const lower = id.toLowerCase()
        const provider = extractOpenRouterProvider(id)
        
        // 判定免费：官方 pricing 均为 0，或以 :free 结尾，或为 openrouter/free
        const promptPrice = Number(raw.pricing?.prompt ?? 1)
        const completionPrice = Number(raw.pricing?.completion ?? 1)
        const isFree = (promptPrice === 0 && completionPrice === 0) || id.endsWith(':free') || id === 'openrouter/free'

        // 判定多模态能力
        const modality = raw.architecture?.modality || ''
        const hasVisionModality = modality.includes('image->text') || modality.includes('multimodal')
        const supportsImage = hasVisionModality || supportsImageInput(id) || lower.includes('gemini') || lower.includes('gpt-4o') || lower.includes('claude-3') || lower.includes('-vl')

        const contextLen = raw.context_length || raw.top_provider?.context_length || 32768
        const contextStr = formatContextLength(contextLen)

        // 构造标签
        const tags: string[] = ['对话']
        if (isFree) tags.push('免费 (¥0)')
        if (supportsImage) tags.push('视觉')
        if (lower.includes('coder') || lower.includes('code')) tags.push('Coder')
        if (lower.includes('r1') || lower.includes('reasoner') || lower.includes('qwq') || lower.includes('thinking')) tags.push('推理模型')
        if (contextLen >= 128000) tags.push(contextStr)
        tags.push(provider)

        const promptPerM = !isNaN(promptPrice) ? (promptPrice * 1000000).toFixed(promptPrice * 1000000 < 0.01 ? 4 : 2) : '0'
        const compPerM = !isNaN(completionPrice) ? (completionPrice * 1000000).toFixed(completionPrice * 1000000 < 0.01 ? 4 : 2) : '0'
        const pricingText = isFree ? '0 元免费' : `$${promptPerM} / $${compPerM} / M`
        const inputPrice = isFree ? '$0.00 / M' : `$${promptPerM} / M`
        const outputPrice = isFree ? '$0.00 / M' : `$${compPerM} / M`

        return {
          id: raw.id,
          label: raw.name || raw.id,
          value: raw.id,
          desc: raw.description || `OpenRouter 聚合接入的 ${provider} 大语言模型端点。`,
          category: 'OpenRouter 聚合系列',
          provider,
          type: 'chat',
          tag: isFree ? '免费 ¥0' : provider,
          tagBadgeClass: isFree 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold' 
            : 'bg-slate-100 text-slate-600 border border-slate-200/60 font-medium',
          tags,
          contextWindow: contextStr,
          paramScale: id.match(/(\d+b)/i)?.[1]?.toUpperCase() || 'Cloud',
          isFree,
          isNew: (lower.includes('gemini-2.0') || lower.includes('llama-3.3') || lower.includes('claude-3.5') || lower.includes('o1-')) && !isFree,
          pricingText,
          inputPrice,
          outputPrice,
          platform: 'openrouter',
          supportsImage,
          isLive: true
        }
      })

      // 排序：优先将 0 元免费模型排在前面，方便用户快速选用
      items.sort((a, b) => {
        if (a.isFree && !b.isFree) return -1
        if (!a.isFree && b.isFree) return 1
        return a.id.localeCompare(b.id)
      })

      return {
        success: true,
        isOnline: true,
        items,
        message: `成功拉取 OpenRouter ${items.length} 个全球模型端点`
      }
    } catch (e: any) {
      return {
        success: false,
        isOnline: false,
        items: BUILTIN_OPENROUTER_MODELS,
        message: `OpenRouter 连通异常：${e.message || '网络无法访问'}`
      }
    }
  }

  /**
   * 测试 OpenRouter API Key 连通性与余额
   */
  async testKey(apiKey: string): Promise<{ success: boolean; message: string; data?: OpenRouterAuthInfo }> {
    const key = apiKey?.trim()
    if (!key) {
      return { success: false, message: '请输入有效 OpenRouter API Key' }
    }

    try {
      const res = await fetch(`${OPENROUTER_API_BASE}/auth/key`, {
        headers: {
          'Authorization': `Bearer ${key}`,
          'HTTP-Referer': 'https://wenflow.ai',
          'X-Title': 'WenFlow AI'
        }
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return {
          success: false,
          message: err.error?.message || `鉴权失败 (${res.status})`
        }
      }

      const json = await res.json()
      const data: OpenRouterAuthInfo = json.data || {}
      
      const usageVal = typeof data.usage === 'number' ? `$${data.usage.toFixed(4)}` : (data.usage != null ? `$${data.usage}` : '$0.00')
      const limitVal = typeof data.limit === 'number' ? `$${data.limit.toFixed(2)}` : '无限制'
      const isFreeTier = data.is_free_tier ? '免费配额层' : '标准账户'

      return {
        success: true,
        message: `OpenRouter 鉴权通过！${isFreeTier} (已消耗: ${usageVal} / 限额: ${limitVal})`,
        data
      }
    } catch (e: any) {
      return {
        success: false,
        message: `网络连接失败：${e.message || '无法连接 openrouter.ai'}`
      }
    }
  }

  /**
   * 获取 OpenRouter 账户 Credits 余额与总消耗
   */
  async fetchUserCredits(apiKey?: string): Promise<{ totalCredits: number; totalUsage: number } | null> {
    const key = apiKey?.trim()
    if (!key) return null

    try {
      const res = await fetch(`${OPENROUTER_API_BASE}/credits`, {
        headers: {
          'Authorization': `Bearer ${key}`,
          'HTTP-Referer': 'https://wenflow.ai',
          'X-Title': 'WenFlow AI'
        }
      })
      if (!res.ok) return null
      const json = await res.json()
      const data = json.data || {}
      return {
        totalCredits: typeof data.total_credits === 'number' ? data.total_credits : 0,
        totalUsage: typeof data.total_usage === 'number' ? data.total_usage : 0
      }
    } catch {
      return null
    }
  }
}

export const openRouterService = new OpenRouterService()
