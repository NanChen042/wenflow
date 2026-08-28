export enum ModelType {
  V3 = 'deepseek-ai/DeepSeek-V3',
  Reasoner = 'deepseek-ai/DeepSeek-R1',
  R1_Distill_7B = 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
  R1_Distill_8B = 'deepseek-ai/DeepSeek-R1-Distill-Llama-8B',
  R1_Distill_1_5B = 'deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B',
  // This is only the offline fallback. When an API key is available the UI
  // resolves a visual model from the provider's live model list instead.
  OCR = 'Qwen/Qwen2.5-VL-7B-Instruct',
  QwenVL = 'Qwen/Qwen2.5-VL-72B-Instruct',
  ART = 'art-studio',
}

export interface MessageAsset {
  type: 'image' | 'video' | 'audio' | 'pdf'
  url: string // Base64 or ObjectURL / Remote URL
  name?: string
  size?: number
}

export interface Message {
  role: 'user' | 'assistant' | 'system'
  type: 'text' | 'image'
  content: string
  reasoning_content?: string
  images?: string[] // Generated images (Art)
  assets?: MessageAsset[] // Input assets (Multimodal)
  progress?: number
  loading?: boolean
  batchSize?: number
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
    speed?: number // tokens/s
    duration?: number // seconds
  }
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  updatedAt: number
  model?: string // Session-specific model
}

export interface MultimodalContent {
  // SiliconFlow's documented chat-completions path is OpenAI image input.
  // Audio/video/PDF are intentionally not represented here.
  type: 'text' | 'image_url'
  text?: string
  image_url?: { url: string; detail?: 'auto' | 'low' | 'high' }
}

export interface ChatCompletionRequestMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | MultimodalContent[]
  prefix?: boolean
}

export interface StreamChunk {
  content?: string
  reasoning_content?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}
