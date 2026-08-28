/**
 * 完整模型能力判定库 (全面兼容 SiliconFlow / OpenAI 官方多模态规范)
 */
export interface ModelCapabilities {
  supportsImage: boolean
  supportsAudio: boolean
  supportsVideo: boolean
  supportsPdf: boolean
}

const TEXT_ONLY: ModelCapabilities = {
  supportsImage: false,
  supportsAudio: false,
  supportsVideo: false,
  supportsPdf: false
}

const IMAGE_INPUT: ModelCapabilities = {
  ...TEXT_ONLY,
  supportsImage: true
}

const EXPLICIT_CAPABILITIES: Record<string, ModelCapabilities> = {
  'Qwen/Qwen2.5-VL-7B-Instruct': IMAGE_INPUT,
  'Qwen/Qwen2.5-VL-72B-Instruct': IMAGE_INPUT,
  'Qwen/Qwen2-VL-7B-Instruct': IMAGE_INPUT,
  'Qwen/Qwen2-VL-72B-Instruct': IMAGE_INPUT,
  'Pro/Qwen/Qwen2.5-VL-7B-Instruct': IMAGE_INPUT,
  'Pro/Qwen/Qwen2-VL-7B-Instruct': IMAGE_INPUT,
  'deepseek-ai/deepseek-vl2': IMAGE_INPUT,
  'deepseek-ai/deepseek-vl-7b-chat': IMAGE_INPUT,
  'OpenGVLab/InternVL2.5-78B': IMAGE_INPUT,
  'OpenGVLab/InternVL2.5-26B': IMAGE_INPUT,
  'OpenGVLab/InternVL2-26B': IMAGE_INPUT,
  'OpenGVLab/InternVL2-8B': IMAGE_INPUT,
  'TeleAI/TeleMM': IMAGE_INPUT,
  'THUDM/glm-4v-9b': IMAGE_INPUT
}

/**
 * 动态智能判定模型是否支持图片输入与视觉多模态 (VLM)
 */
export const supportsImageInput = (modelId: string): boolean => {
  if (!modelId) return false
  if (EXPLICIT_CAPABILITIES[modelId]?.supportsImage) return true
  
  const lower = modelId.toLowerCase()
  return (
    lower.includes('-vl') ||
    lower.includes('vl-') ||
    lower.includes('vl2') ||
    lower.includes('vision') ||
    lower.includes('multimodal') ||
    lower.includes('internvl') ||
    lower.includes('telemm') ||
    lower.includes('glm-4v') ||
    lower.includes('omni') ||
    lower.includes('ocr') ||
    lower.includes('gemini') ||
    lower.includes('gpt-4o') ||
    lower.includes('claude-3') ||
    lower.includes('claude-sonnet') ||
    lower.includes('claude-opus') ||
    lower.includes('pixtral') ||
    lower.includes('gemma-3') ||
    lower.includes('paligemma') ||
    lower.includes('llava')
  )
}

export const getModelCapabilities = (modelId: string): ModelCapabilities => {
  if (supportsImageInput(modelId)) {
    return IMAGE_INPUT
  }
  return EXPLICIT_CAPABILITIES[modelId] || TEXT_ONLY
}

export const supportsAttachments = (modelId: string): boolean =>
  supportsImageInput(modelId)

