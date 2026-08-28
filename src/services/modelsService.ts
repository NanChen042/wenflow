import { ModelType } from './aiService'
import deepseekLogo from '@/assets/deepseeklogo.svg'
import { getModelCapabilities, supportsImageInput } from './modelCapabilities'

export interface SiliconModelItem {
  id: string
  label: string
  value: string
  desc: string
  category: string
  provider: string      // e.g. 'DeepSeek' | 'Qwen' | '智谱' | 'Kimi' | 'MiniMax' | 'Meta' | '美团' | '百度' | '字节跳动' | '电信星辰' | '百川' | '书生浦语'
  type: 'chat' | 'image' | 'video' | 'audio' | 'embedding' | 'rerank'
  tag?: string
  tagBadgeClass?: string
  tags?: string[]       // e.g. ['对话', 'Tools', '视觉', '4B', '256K', 'MoE']
  isLogo?: boolean
  logoSrc?: string
  iconName?: 'Cpu' | 'Aim' | 'Lightning' | 'Document' | 'VideoPlay' | 'Picture' | 'Brush'
  iconBg?: string
  iconColor?: string
  contextWindow?: string // e.g. '256K', '1M', '128K', '32K', '8K'
  paramScale?: string    // e.g. '4B', '7B', '14B', '32B', '72B', '671B', '1.6T'
  isFree?: boolean
  isNew?: boolean
  pricingText?: string   // e.g. '0 元免费', '$0.50 / $1.50 / M'
  inputPrice?: string    // e.g. '$0.50 / M'
  outputPrice?: string   // e.g. '$1.50 / M'
  platform?: 'siliconflow' | 'openrouter' | 'deepseek'
  /** Image input has been explicitly verified for this endpoint. */
  supportsImage?: boolean
  /** Present only after a successful GET /models sync. */
  isLive?: boolean
}

export interface ModelGroup {
  category: string
  items: SiliconModelItem[]
}

export interface UserAccountInfo {
  name: string
  email?: string
  balance: string
  totalBalance?: string
  currency: string
}

const SILICON_API_BASE = 'https://api.siliconflow.cn/v1'

/**
 * 格式化模型友好展示名称 (UI 资深设计级名称优化)
 */
export function formatModelDisplayName(id: string): string {
  if (!id) return '';
  const map: Record<string, string> = {
    'deepseek-ai/DeepSeek-V3': 'DeepSeek V3',
    'deepseek-ai/DeepSeek-R1': 'DeepSeek R1',
    'Pro/deepseek-ai/DeepSeek-V3': 'DeepSeek V3 Pro',
    'Pro/deepseek-ai/DeepSeek-R1': 'DeepSeek R1 Pro',
    'deepseek-ai/DeepSeek-V4-Pro': 'DeepSeek V4 Pro',
    'deepseek-ai/DeepSeek-V4-Flash': 'DeepSeek V4 Flash',
    'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B': 'DeepSeek R1 (Qwen 7B)',
    'deepseek-ai/DeepSeek-R1-Distill-Llama-8B': 'DeepSeek R1 (Llama 8B)',
    'deepseek-ai/DeepSeek-R1-Distill-Qwen-14B': 'DeepSeek R1 (Qwen 14B)',
    'deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B': 'DeepSeek R1 (Qwen 1.5B)',
    'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B': 'DeepSeek R1 (Qwen 32B)',
    'deepseek-ai/DeepSeek-R1-Distill-Llama-70B': 'DeepSeek R1 (Llama 70B)',
    'Qwen/Qwen2.5-72B-Instruct': 'Qwen 2.5 (72B)',
    'Qwen/Qwen2.5-32B-Instruct': 'Qwen 2.5 (32B)',
    'Qwen/Qwen2.5-14B-Instruct': 'Qwen 2.5 (14B)',
    'Qwen/Qwen2.5-7B-Instruct': 'Qwen 2.5 (7B)',
    'Qwen/Qwen2.5-Coder-32B-Instruct': 'Qwen 2.5 Coder (32B)',
    'Qwen/Qwen2.5-Coder-7B-Instruct': 'Qwen 2.5 Coder (7B)',
    'Qwen/Qwen2.5-VL-72B-Instruct': 'Qwen 2.5 VL (72B)',
    'Qwen/Qwen2.5-VL-7B-Instruct': 'Qwen 2.5 VL (7B)',
    'Qwen/Qwen2-VL-7B-Instruct': 'Qwen 2 VL (7B)',
    'Qwen/QwQ-32B-Preview': 'QwQ (32B 推理)',
    'meta-llama/Llama-3.3-70B-Instruct': 'Llama 3.3 (70B)',
    'meta-llama/llama-3.3-70b-instruct:free': 'Llama 3.3 (70B 免费)',
    'meta-llama/Meta-Llama-3.1-70B-Instruct': 'Llama 3.1 (70B)',
    'meta-llama/Meta-Llama-3.1-8B-Instruct': 'Llama 3.1 (8B)',
    'google/gemini-2.0-flash-exp:free': 'Gemini 2.0 Flash (免费)',
    'google/gemini-2.0-flash-001': 'Gemini 2.0 Flash',
    'google/gemini-flash-1.5': 'Gemini 1.5 Flash',
    'google/gemini-pro-1.5': 'Gemini 1.5 Pro',
    'anthropic/claude-3.5-sonnet': 'Claude 3.5 Sonnet',
    'anthropic/claude-3-opus': 'Claude 3 Opus',
    'anthropic/claude-3.5-haiku': 'Claude 3.5 Haiku',
    'openai/gpt-4o': 'GPT-4o',
    'openai/gpt-4o-mini': 'GPT-4o Mini',
    'openai/o1-preview': 'OpenAI o1 Preview',
    'openai/o1-mini': 'OpenAI o1 Mini',
    'openrouter/free': 'OpenRouter Free (智能免费路由)',
    'THUDM/glm-4-9b-chat': 'GLM-4 (9B)',
    'zai-org/GLM-5.2': 'GLM 5.2 (最新旗舰)',
    'moonshotai/Kimi-K2.7-Code': 'Kimi K2.7 Code (代码旗舰)',
    'Pro/moonshotai/Kimi-K2.6': 'Kimi K2.6 Pro',
    'meituan-longcat/LongCat-2.0': 'LongCat 2.0 (美团旗舰)',
    '01-ai/Yi-1.5-34B-Chat-16K': 'Yi-1.5 (34B)',
    '01-ai/Yi-1.5-9B-Chat-16K': 'Yi-1.5 (9B)',
    '01-ai/Yi-1.5-6B-Chat': 'Yi-1.5 (6B)',
    'internlm/internlm2_5-20b-chat': 'InternLM 2.5 (20B)',
    'internlm/internlm2_5-7b-chat': 'InternLM 2.5 (7B)',
    'baichuan-inc/Baichuan2-7B-Chat': 'Baichuan 2 (7B)',
    'inclusionAI/ling-mini-2.0': 'Ling Mini 2.0',
    'inclusionAI/ling-flash-2.0': 'Ling Flash 2.0',
    'Qwen/Qwen3-Omni-30B-A3B-Thinking': 'Qwen3 Omni 30B Thinking',
    'Qwen/Qwen3-Omni-30B-A3B-Instruct': 'Qwen3 Omni 30B Instruct',
    'Qwen/Qwen3-VL-30B-A3B-Thinking': 'Qwen3 VL 30B Thinking',
    'deepseek-ai/DeepSeek-OCR': 'DeepSeek OCR',
    'Kwai-Kolors/Kolors': 'Kolors 图像生成',
    'black-forest-labs/FLUX.1-schnell': 'FLUX.1 Schnell',
    'black-forest-labs/FLUX.1-dev': 'FLUX.1 Dev',
    'stabilityai/stable-diffusion-3-5-large': 'SD 3.5 Large'
  };
  if (map[id]) return map[id];

  let cleaned = id;
  const isPro = cleaned.startsWith('Pro/');
  if (isPro) cleaned = cleaned.replace(/^Pro\//, '');
  const isFree = cleaned.endsWith(':free');
  if (isFree) cleaned = cleaned.replace(/:free$/, '');

  const parts = cleaned.split('/');
  let name = parts[parts.length - 1] || id;
  name = name.replace(/[-_]/g, ' ');
  return isPro ? `${name} Pro` : (isFree ? `${name} (Free)` : name);
}

/**
 * 硅基流动官方 0 元 Token 免费模型端点白名单
 */
export const OFFICIAL_FREE_MODEL_IDS = new Set<string>([
  'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
  'deepseek-ai/DeepSeek-R1-Distill-Llama-8B',
  'deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B',
  'Qwen/Qwen2.5-7B-Instruct',
  'Qwen/Qwen2.5-Coder-7B-Instruct',
  'Qwen/Qwen2.5-VL-7B-Instruct',
  'Qwen/Qwen2-7B-Instruct',
  'Qwen/Qwen2-VL-7B-Instruct',
  'internlm/internlm2_5-7b-chat',
  'baichuan-inc/Baichuan2-7B-Chat',
  'meta-llama/Meta-Llama-3.1-8B-Instruct',
  'meta-llama/Llama-3.2-3B-Instruct',
  'meta-llama/Llama-3.2-1B-Instruct',
  '01-ai/Yi-1.5-9B-Chat',
  'THUDM/glm-4-9b-chat',
  'THUDM/chatglm3-6b'
])

/**
 * 硅基流动官方完整模型矩阵库 (严格依据官方 HuggingFace/SiliconFlow 发布卡片说明录入)
 */
export const OFFICIAL_SILICON_MODELS: SiliconModelItem[] = [
  // ==================== 1. DeepSeek 官方系列 ====================
  {
    id: 'deepseek-ai/DeepSeek-V4-Pro',
    label: 'deepseek-ai/DeepSeek-V4-Pro',
    value: 'deepseek-ai/DeepSeek-V4-Pro',
    desc: 'DeepSeek-V4 系列中的旗舰 MoE 语言模型，拥有 1.6T 总参数，49B 激活参数，原生支持 100 万 tokens 超长上下文。该模型采用创新的混合注意力架构，结合压缩稀疏注意力 (CSA) 与高度压缩注意力 (HCA)。',
    category: 'DeepSeek 官方系列',
    provider: 'DeepSeek',
    type: 'chat',
    tag: 'New 旗舰',
    tagBadgeClass: 'bg-rose-50 text-rose-700 border border-rose-200/80 font-semibold',
    tags: ['对话', 'Tools', '1.6T', '1M', 'MoE', '推理模型'],
    isLogo: true,
    logoSrc: deepseekLogo,
    iconName: 'Cpu',
    contextWindow: '1M',
    paramScale: '1.6T',
    isNew: true,
    isFree: false
  },
  {
    id: 'deepseek-ai/DeepSeek-V4-Flash',
    label: 'deepseek-ai/DeepSeek-V4-Flash',
    value: 'deepseek-ai/DeepSeek-V4-Flash',
    desc: 'DeepSeek-V4 系列预览版 MoE 语言模型，总参数量 284B，激活 13B，支持 1M 超长上下文，极低时延与高速吞吐。',
    category: 'DeepSeek 官方系列',
    provider: 'DeepSeek',
    type: 'chat',
    tag: 'New 极速',
    tagBadgeClass: 'bg-rose-50 text-rose-700 border border-rose-200/80 font-semibold',
    tags: ['对话', 'Tools', '284B', '1M', 'MoE', '推理模型'],
    isLogo: true,
    logoSrc: deepseekLogo,
    iconName: 'Lightning',
    contextWindow: '1M',
    paramScale: '284B',
    isNew: true,
    isFree: false
  },
  {
    id: 'deepseek-ai/DeepSeek-V3',
    label: 'deepseek-ai/DeepSeek-V3',
    value: 'deepseek-ai/DeepSeek-V3',
    desc: 'DeepSeek-V3 是一个强大的开源专家混合 (MoE) 语言模型，总参数量为 671B，每个 token 激活 37B 参数。支持 64K 上下文，具备极强的代码生成与多任务通用能力。',
    category: 'DeepSeek 官方系列',
    provider: 'DeepSeek',
    type: 'chat',
    tag: '旗舰',
    tagBadgeClass: 'bg-blue-50 text-blue-700 border border-blue-200/80 font-medium',
    tags: ['对话', 'Tools', '671B', '64K', 'MoE', '旗舰基座'],
    isLogo: true,
    logoSrc: deepseekLogo,
    iconName: 'Cpu',
    contextWindow: '64K',
    paramScale: '671B',
    isFree: false
  },
  {
    id: 'deepseek-ai/DeepSeek-R1',
    label: 'deepseek-ai/DeepSeek-R1',
    value: 'deepseek-ai/DeepSeek-R1',
    desc: 'DeepSeek-R1 是通过大规模强化学习训练的一代推理模型，总参数 671B（激活 37B）。在数学、编程与复杂逻辑推理等任务上展现出强大的自主思考链能力。',
    category: 'DeepSeek 官方系列',
    provider: 'DeepSeek',
    type: 'chat',
    tag: '推理模型',
    tagBadgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-semibold',
    tags: ['对话', '671B', '64K', 'MoE', '深度思考', '推理模型'],
    isLogo: true,
    logoSrc: deepseekLogo,
    iconName: 'Aim',
    contextWindow: '64K',
    paramScale: '671B',
    isFree: false
  },
  {
    id: 'Pro/deepseek-ai/DeepSeek-V3',
    label: 'Pro/deepseek-ai/DeepSeek-V3',
    value: 'Pro/deepseek-ai/DeepSeek-V3',
    desc: 'DeepSeek-V3 Pro 企业级高可用集群，专为高并发生产环境优化，具备专属算力保障与极速吞吐响应。',
    category: 'DeepSeek 官方系列',
    provider: 'DeepSeek',
    type: 'chat',
    tag: 'Pro 旗舰',
    tagBadgeClass: 'bg-purple-50 text-purple-700 border border-purple-200/80 font-semibold',
    tags: ['对话', 'Tools', '671B', '64K', 'MoE', 'Pro 企业级'],
    isLogo: true,
    logoSrc: deepseekLogo,
    iconName: 'Cpu',
    contextWindow: '64K',
    paramScale: '671B',
    isFree: false
  },
  {
    id: 'Pro/deepseek-ai/DeepSeek-R1',
    label: 'Pro/deepseek-ai/DeepSeek-R1',
    value: 'Pro/deepseek-ai/DeepSeek-R1',
    desc: 'DeepSeek-R1 Pro 企业级深度推理集群，为高并发复杂逻辑推理与代码生成场景提供低延迟专属保障。',
    category: 'DeepSeek 官方系列',
    provider: 'DeepSeek',
    type: 'chat',
    tag: 'Pro 推理',
    tagBadgeClass: 'bg-purple-50 text-purple-700 border border-purple-200/80 font-semibold',
    tags: ['对话', '671B', '64K', 'MoE', 'Pro 企业级', '推理模型'],
    isLogo: true,
    logoSrc: deepseekLogo,
    iconName: 'Aim',
    contextWindow: '64K',
    paramScale: '671B',
    isFree: false
  },
  {
    id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
    label: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
    value: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
    desc: '基于 Qwen-7B 蒸馏微调的 DeepSeek-R1 推理模型，融合 R1 推理思维链，具备轻量与高响应速度特性，官方 0 元免费。',
    category: 'DeepSeek 官方系列',
    provider: 'DeepSeek',
    type: 'chat',
    tag: '免费 (¥0)',
    tagBadgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold',
    tags: ['对话', '7B', '32K', '推理模型', '免费 (¥0)'],
    isLogo: true,
    logoSrc: deepseekLogo,
    iconName: 'Lightning',
    contextWindow: '32K',
    paramScale: '7B',
    isFree: true
  },
  {
    id: 'deepseek-ai/DeepSeek-R1-Distill-Llama-8B',
    label: 'deepseek-ai/DeepSeek-R1-Distill-Llama-8B',
    value: 'deepseek-ai/DeepSeek-R1-Distill-Llama-8B',
    desc: '基于 Llama-3.1-8B 蒸馏微调的 DeepSeek-R1 推理模型，兼具轻量结构与推理思维链输出，官方 0 元免费。',
    category: 'DeepSeek 官方系列',
    provider: 'DeepSeek',
    type: 'chat',
    tag: '免费 (¥0)',
    tagBadgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold',
    tags: ['对话', '8B', '32K', '推理模型', '免费 (¥0)'],
    isLogo: true,
    logoSrc: deepseekLogo,
    iconName: 'Lightning',
    contextWindow: '32K',
    paramScale: '8B',
    isFree: true
  },
  {
    id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B',
    label: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B',
    value: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B',
    desc: '基于 Qwen-1.5B 蒸馏的超轻量思维链推理模型，推理速度极快，适合边缘及快速响应场景，官方 0 元免费。',
    category: 'DeepSeek 官方系列',
    provider: 'DeepSeek',
    type: 'chat',
    tag: '免费 (¥0)',
    tagBadgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold',
    tags: ['对话', '1.5B', '32K', '极速响应', '免费 (¥0)'],
    isLogo: true,
    logoSrc: deepseekLogo,
    iconName: 'Lightning',
    contextWindow: '32K',
    paramScale: '1.5B',
    isFree: true
  },
  {
    id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-14B',
    label: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-14B',
    value: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-14B',
    desc: '基于 Qwen-14B 蒸馏的进阶推理模型，在数理推理与计算资源之间取得良好平衡。',
    category: 'DeepSeek 官方系列',
    provider: 'DeepSeek',
    type: 'chat',
    tag: '14B 推理',
    tagBadgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-medium',
    tags: ['对话', '14B', '32K', '深度思考', '推理模型'],
    isLogo: true,
    logoSrc: deepseekLogo,
    iconName: 'Aim',
    contextWindow: '32K',
    paramScale: '14B',
    isFree: false
  },
  {
    id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
    label: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
    value: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
    desc: '基于 Qwen-32B 蒸馏的高阶推理模型，在数学竞赛和代码推理评测中表现优异。',
    category: 'DeepSeek 官方系列',
    provider: 'DeepSeek',
    type: 'chat',
    tag: '32B 推理',
    tagBadgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-medium',
    tags: ['对话', '32B', '32K', '高阶数理', '推理模型'],
    isLogo: true,
    logoSrc: deepseekLogo,
    iconName: 'Aim',
    contextWindow: '32K',
    paramScale: '32B',
    isFree: false
  },
  {
    id: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B',
    label: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B',
    value: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B',
    desc: '基于 Llama-3.3-70B 蒸馏的大规模推理模型，具备接近满血 R1 的深度思考与长程推理能力。',
    category: 'DeepSeek 官方系列',
    provider: 'DeepSeek',
    type: 'chat',
    tag: '70B 推理',
    tagBadgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-semibold',
    tags: ['对话', '70B', '64K', '大参数', '推理模型'],
    isLogo: true,
    logoSrc: deepseekLogo,
    iconName: 'Aim',
    contextWindow: '64K',
    paramScale: '70B',
    isFree: false
  },
  {
    id: 'deepseek-ai/DeepSeek-Coder-V2-Instruct',
    label: 'deepseek-ai/DeepSeek-Coder-V2-Instruct',
    value: 'deepseek-ai/DeepSeek-Coder-V2-Instruct',
    desc: 'DeepSeek-Coder-V2 是基于 MoE 架构的代码大模型，总参数 236B（激活 21B），支持 338 种编程语言与 128K 上下文。',
    category: 'DeepSeek 官方系列',
    provider: 'DeepSeek',
    type: 'chat',
    tag: 'Coder 代码',
    tagBadgeClass: 'bg-amber-50 text-amber-700 border border-amber-200/80 font-medium',
    tags: ['对话', 'Tools', '236B', '128K', 'MoE', 'Coder'],
    isLogo: true,
    logoSrc: deepseekLogo,
    iconName: 'Cpu',
    contextWindow: '128K',
    paramScale: '236B',
    isFree: false
  },

  // ==================== 2. Qwen 通义千问全系列 ====================
  {
    id: 'Qwen/Qwen2.5-7B-Instruct',
    label: 'Qwen/Qwen2.5-7B-Instruct',
    value: 'Qwen/Qwen2.5-7B-Instruct',
    desc: 'Qwen2.5-7B-Instruct 是阿里开源的 7B 通用指令模型，支持 128K 上下文与多语言对话，官方 0 元免费。',
    category: 'Qwen 通义千问全系列',
    provider: 'Qwen',
    type: 'chat',
    tag: '免费 (¥0)',
    tagBadgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold',
    tags: ['对话', 'Tools', '7B', '128K', '免费 (¥0)'],
    iconName: 'Lightning',
    contextWindow: '128K',
    paramScale: '7B',
    isFree: true
  },
  {
    id: 'Qwen/Qwen2.5-Coder-7B-Instruct',
    label: 'Qwen/Qwen2.5-Coder-7B-Instruct',
    value: 'Qwen/Qwen2.5-Coder-7B-Instruct',
    desc: 'Qwen2.5-Coder-7B 是面向代码生成与审查的轻量级代码大模型，官方 0 元免费。',
    category: 'Qwen 通义千问全系列',
    provider: 'Qwen',
    type: 'chat',
    tag: '免费 (¥0)',
    tagBadgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold',
    tags: ['对话', 'Tools', '7B', '128K', 'Coder', '免费 (¥0)'],
    iconName: 'Lightning',
    contextWindow: '128K',
    paramScale: '7B',
    isFree: true
  },
  {
    id: 'Qwen/Qwen2.5-72B-Instruct',
    label: 'Qwen/Qwen2.5-72B-Instruct',
    value: 'Qwen/Qwen2.5-72B-Instruct',
    desc: 'Qwen2.5-72B-Instruct 是通义千问系列开源旗舰模型，在代码、数学、知识理解与长文本 (128K) 任务上达到开源顶尖水准。',
    category: 'Qwen 通义千问全系列',
    provider: 'Qwen',
    type: 'chat',
    tag: '72B 旗舰',
    tagBadgeClass: 'bg-blue-50 text-blue-700 border border-blue-200/80 font-medium',
    tags: ['对话', 'Tools', '72B', '128K', '全能旗舰'],
    iconName: 'Cpu',
    contextWindow: '128K',
    paramScale: '72B',
    isFree: false
  },
  {
    id: 'Qwen/Qwen2.5-32B-Instruct',
    label: 'Qwen/Qwen2.5-32B-Instruct',
    value: 'Qwen/Qwen2.5-32B-Instruct',
    desc: 'Qwen2.5-32B-Instruct 是高性价比全能大模型，兼具超快速度与高阶通用理解能力。',
    category: 'Qwen 通义千问全系列',
    provider: 'Qwen',
    type: 'chat',
    tag: '32B 全能',
    tagBadgeClass: 'bg-slate-100 text-slate-700 border border-slate-200/80 font-medium',
    tags: ['对话', 'Tools', '32B', '128K'],
    iconName: 'Cpu',
    contextWindow: '128K',
    paramScale: '32B',
    isFree: false
  },
  {
    id: 'Qwen/Qwen2.5-14B-Instruct',
    label: 'Qwen/Qwen2.5-14B-Instruct',
    value: 'Qwen/Qwen2.5-14B-Instruct',
    desc: 'Qwen2.5-14B-Instruct 是平衡性能与显存占用的进阶通用对话与逻辑推理模型。',
    category: 'Qwen 通义千问全系列',
    provider: 'Qwen',
    type: 'chat',
    tag: '14B 对话',
    tagBadgeClass: 'bg-slate-100 text-slate-700 border border-slate-200/80 font-medium',
    tags: ['对话', 'Tools', '14B', '128K'],
    iconName: 'Cpu',
    contextWindow: '128K',
    paramScale: '14B',
    isFree: false
  },
  {
    id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
    label: 'Qwen/Qwen2.5-Coder-32B-Instruct',
    value: 'Qwen/Qwen2.5-Coder-32B-Instruct',
    desc: '通义千问 32B 专业代码大模型，支持复杂系统架构设计、多文件代码生成与调试。',
    category: 'Qwen 通义千问全系列',
    provider: 'Qwen',
    type: 'chat',
    tag: 'Coder 代码',
    tagBadgeClass: 'bg-amber-50 text-amber-700 border border-amber-200/80 font-medium',
    tags: ['对话', 'Tools', '32B', '128K', 'Coder'],
    iconName: 'Cpu',
    contextWindow: '128K',
    paramScale: '32B',
    isFree: false
  },
  {
    id: 'Qwen/Qwen2.5-Math-72B-Instruct',
    label: 'Qwen/Qwen2.5-Math-72B-Instruct',
    value: 'Qwen/Qwen2.5-Math-72B-Instruct',
    desc: 'Qwen2.5-Math-72B 是专注于高阶数学推导、竞赛解题与证明的大语言模型。',
    category: 'Qwen 通义千问全系列',
    provider: 'Qwen',
    type: 'chat',
    tag: '数理推导',
    tagBadgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-medium',
    tags: ['对话', '72B', 'Math', '推理模型'],
    iconName: 'Aim',
    contextWindow: '64K',
    paramScale: '72B',
    isFree: false
  },
  {
    id: 'Qwen/QwQ-32B-Preview',
    label: 'Qwen/QwQ-32B-Preview',
    value: 'Qwen/QwQ-32B-Preview',
    desc: '通义千问 32B 深度思维推理实验模型 (QwQ)，展现强大的自主反思与思维链推导能力。',
    category: 'Qwen 通义千问全系列',
    provider: 'Qwen',
    type: 'chat',
    tag: '推理模型',
    tagBadgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-semibold',
    tags: ['对话', '32B', '深度思考', '推理模型'],
    iconName: 'Aim',
    contextWindow: '32K',
    paramScale: '32B',
    isFree: false
  },

  // ==================== 3. 行业新旗舰与智谱 & Kimi ====================
  {
    id: 'zai-org/GLM-5.2',
    label: 'zai-org/GLM-5.2',
    value: 'zai-org/GLM-5.2',
    desc: 'GLM-5.2 是 Z.ai 最新旗舰模型，面向长程任务场景，相比 GLM-5.1 在长程任务能力上有显著提升。该 753B 模型支持稳定的 1M-token 上下文，具备极强编程能力与 thinking effort。',
    category: '智谱 & 零一 & 国产名模',
    provider: '智谱',
    type: 'chat',
    tag: 'New 旗舰',
    tagBadgeClass: 'bg-rose-50 text-rose-700 border border-rose-200/80 font-semibold',
    tags: ['对话', 'Tools', '753B', '1M', 'MoE', '推理模型', 'Vibe Coding', '旗舰'],
    iconName: 'Cpu',
    contextWindow: '1M',
    paramScale: '753B',
    isNew: true,
    isFree: false
  },
  {
    id: 'moonshotai/Kimi-K2.7-Code',
    label: 'moonshotai/Kimi-K2.7-Code',
    value: 'moonshotai/Kimi-K2.7-Code',
    desc: 'Kimi K2.7 Code 是 Moonshot AI 推出的面向代码任务的 agentic 模型，基于 Kimi K2.6 构建，在真实世界长程代码任务中有显著提升，可增强复杂软件工程工作流中的端到端任务完成能力。',
    category: '智谱 & 零一 & 国产名模',
    provider: 'Kimi',
    type: 'chat',
    tag: 'New Coder',
    tagBadgeClass: 'bg-rose-50 text-rose-700 border border-rose-200/80 font-semibold',
    tags: ['对话', 'Tools', '视觉', '1T', '256K', 'MoE', 'Coder', '推理模型'],
    iconName: 'Cpu',
    contextWindow: '256K',
    paramScale: '1T',
    isNew: true,
    isFree: false
  },
  {
    id: 'meituan-longcat/LongCat-2.0',
    label: 'meituan-longcat/LongCat-2.0',
    value: 'meituan-longcat/LongCat-2.0',
    desc: 'LongCat-2.0 核心特性如下：1. 面向 Agent 开发场景，原生支持工具调用、多步推理和长上下文任务；2. 在代码生成、自动化工作流和复杂指令执行上表现突出；3. 深度适配 Claude Code、OpenClaw 等。',
    category: '智谱 & 零一 & 国产名模',
    provider: '美团',
    type: 'chat',
    tag: 'New Agent',
    tagBadgeClass: 'bg-rose-50 text-rose-700 border border-rose-200/80 font-semibold',
    tags: ['对话', 'Tools', '1.6T', '1M', 'MoE', '推理模型'],
    iconName: 'Cpu',
    contextWindow: '1M',
    paramScale: '1.6T',
    isNew: true,
    isFree: false
  },
  {
    id: 'MiniMaxAI/MiniMax-M2.5',
    label: 'MiniMaxAI/MiniMax-M2.5',
    value: 'MiniMaxAI/MiniMax-M2.5',
    desc: 'MiniMax-M2.5 是 MiniMax 推出的最新 MoE 语言模型，总参数量 229B，支持 200K 超长上下文，复杂指令与工具调用卓越。',
    category: '智谱 & 零一 & 国产名模',
    provider: 'MiniMax',
    type: 'chat',
    tag: 'MoE 旗舰',
    tagBadgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-medium',
    tags: ['对话', 'Tools', '229B', '200K', 'MoE'],
    iconName: 'Cpu',
    contextWindow: '200K',
    paramScale: '229B',
    isFree: false
  },
  {
    id: 'THUDM/glm-4-9b-chat',
    label: 'THUDM/glm-4-9b-chat',
    value: 'THUDM/glm-4-9b-chat',
    desc: '清华智谱开源对话模型，多轮对话与工具调用能力强，官方 0 元免费。',
    category: '智谱 & 零一 & 国产名模',
    provider: '智谱',
    type: 'chat',
    tag: '免费 (¥0)',
    tagBadgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold',
    tags: ['对话', 'Tools', '9B', '128K', 'GLM', '免费 (¥0)'],
    iconName: 'Lightning',
    contextWindow: '128K',
    paramScale: '9B',
    isFree: true
  },
  {
    id: '01-ai/Yi-1.5-9B-Chat',
    label: '01-ai/Yi-1.5-9B-Chat',
    value: '01-ai/Yi-1.5-9B-Chat',
    desc: '李开复零一万物 9B 高效文本对话模型，官方 0 元免费。',
    category: '智谱 & 零一 & 国产名模',
    provider: '零一万物',
    type: 'chat',
    tag: '免费 (¥0)',
    tagBadgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold',
    tags: ['对话', '9B', '32K', 'Yi', '免费 (¥0)'],
    iconName: 'Lightning',
    contextWindow: '32K',
    paramScale: '9B',
    isFree: true
  },
  {
    id: 'internlm/internlm2_5-7b-chat',
    label: 'internlm/internlm2_5-7b-chat',
    value: 'internlm/internlm2_5-7b-chat',
    desc: '上海人工智能实验室书生浦语 7B 轻量对话模型，官方 0 元免费。',
    category: '智谱 & 零一 & 国产名模',
    provider: '书生浦语',
    type: 'chat',
    tag: '免费 (¥0)',
    tagBadgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold',
    tags: ['对话', '7B', '32K', '书生浦语', '免费 (¥0)'],
    iconName: 'Lightning',
    contextWindow: '32K',
    paramScale: '7B',
    isFree: true
  },
  {
    id: 'baichuan-inc/Baichuan2-7B-Chat',
    label: 'baichuan-inc/Baichuan2-7B-Chat',
    value: 'baichuan-inc/Baichuan2-7B-Chat',
    desc: '百川智能 7B 轻量对话模型，官方 0 元免费。',
    category: '智谱 & 零一 & 国产名模',
    provider: '百川',
    type: 'chat',
    tag: '免费 (¥0)',
    tagBadgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold',
    tags: ['对话', '7B', '32K', '百川', '免费 (¥0)'],
    iconName: 'Lightning',
    contextWindow: '32K',
    paramScale: '7B',
    isFree: true
  },
  {
    id: '01-ai/Yi-1.5-34B-Chat',
    label: '01-ai/Yi-1.5-34B-Chat',
    value: '01-ai/Yi-1.5-34B-Chat',
    desc: '李开复零一万物 34B 强大中文基座模型。',
    category: '智谱 & 零一 & 国产名模',
    provider: '零一万物',
    type: 'chat',
    tag: 'Yi 34B',
    tagBadgeClass: 'bg-slate-100 text-slate-700 border border-slate-200/80 font-medium',
    tags: ['对话', '34B', '32K'],
    iconName: 'Cpu',
    contextWindow: '32K',
    paramScale: '34B',
    isFree: false
  },

  // ==================== 4. 多模态视觉与文档解析 ====================
  {
    id: 'Qwen/Qwen2.5-VL-7B-Instruct',
    label: 'Qwen/Qwen2.5-VL-7B-Instruct',
    value: 'Qwen/Qwen2.5-VL-7B-Instruct',
    desc: '7B 轻快视觉多模态大模型，快速分析图片与图表，官方 0 元免费。',
    category: '多模态与视觉识别',
    provider: 'Qwen',
    type: 'chat',
    tag: '免费 (¥0)',
    tagBadgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold',
    tags: ['对话', 'Tools', '视觉', '7B', '128K', '免费 (¥0)'],
    iconName: 'Picture',
    contextWindow: '128K',
    paramScale: '7B',
    isFree: true
  },
  {
    id: 'Qwen/Qwen2-VL-7B-Instruct',
    label: 'Qwen/Qwen2-VL-7B-Instruct',
    value: 'Qwen/Qwen2-VL-7B-Instruct',
    desc: '7B 视觉文档与图片识别多模态模型，官方 0 元免费。',
    category: '多模态与视觉识别',
    provider: 'Qwen',
    type: 'chat',
    tag: '免费 (¥0)',
    tagBadgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold',
    tags: ['对话', '视觉', 'OCR', '7B', '免费 (¥0)'],
    iconName: 'Document',
    contextWindow: '32K',
    paramScale: '7B',
    isFree: true
  },
  {
    id: 'Qwen/Qwen2.5-VL-72B-Instruct',
    label: 'Qwen/Qwen2.5-VL-72B-Instruct',
    value: 'Qwen/Qwen2.5-VL-72B-Instruct',
    desc: '通义千问旗舰多模态大模型，高精视觉识别、多图与长视频解析。',
    category: '多模态与视觉识别',
    provider: 'Qwen',
    type: 'chat',
    tag: '视觉旗舰',
    tagBadgeClass: 'bg-cyan-50 text-cyan-700 border border-cyan-200/80 font-medium',
    tags: ['对话', 'Tools', '视觉', '72B', '128K'],
    iconName: 'Picture',
    contextWindow: '128K',
    paramScale: '72B',
    isFree: false
  },

  // ==================== 5. 图像生成与视觉工坊 (Text-to-Image) ====================
  {
    id: 'Kwai-Kolors/Kolors',
    label: 'Kwai-Kolors/Kolors',
    value: 'art-studio',
    desc: '快手可图专业生图引擎，中文理解深刻，支持垫图图生图。',
    category: '图像生成工坊',
    provider: '快手可图',
    type: 'image',
    tag: '可图生图',
    tagBadgeClass: 'bg-purple-50 text-purple-700 border border-purple-200/80 font-medium',
    tags: ['生图', '文生图', '图生图', '中文精调'],
    iconName: 'Brush',
    isFree: false
  },
  {
    id: 'black-forest-labs/FLUX.1-schnell',
    label: 'black-forest-labs/FLUX.1-schnell',
    value: 'black-forest-labs/FLUX.1-schnell',
    desc: '黑森林顶级 FLUX 架构，4 步极速出图与电影质感。',
    category: '图像生成工坊',
    provider: 'BlackForest',
    type: 'image',
    tag: 'FLUX 极速',
    tagBadgeClass: 'bg-purple-50 text-purple-700 border border-purple-200/80 font-medium',
    tags: ['生图', 'FLUX', '4步极速', '12B'],
    iconName: 'Brush',
    isFree: false
  },
  {
    id: 'black-forest-labs/FLUX.1-dev',
    label: 'black-forest-labs/FLUX.1-dev',
    value: 'black-forest-labs/FLUX.1-dev',
    desc: '黑森林 FLUX.1 开发版，极致细节与超强提示词遵循。',
    category: '图像生成工坊',
    provider: 'BlackForest',
    type: 'image',
    tag: 'FLUX 高精',
    tagBadgeClass: 'bg-purple-50 text-purple-700 border border-purple-200/80 font-medium',
    tags: ['生图', 'FLUX', '极致画质', '12B'],
    iconName: 'Brush',
    isFree: false
  },
  {
    id: 'stabilityai/stable-diffusion-3-5-large',
    label: 'stabilityai/stable-diffusion-3-5-large',
    value: 'stabilityai/stable-diffusion-3-5-large',
    desc: 'Stability AI 官方 SD 3.5 Large 8B 顶级画质生成模型。',
    category: '图像生成工坊',
    provider: 'StabilityAI',
    type: 'image',
    tag: 'SD 3.5',
    tagBadgeClass: 'bg-purple-50 text-purple-700 border border-purple-200/80 font-medium',
    tags: ['生图', 'SD3.5', '8B'],
    iconName: 'Brush',
    isFree: false
  },

  // ==================== 6. Meta Llama 3 全系列 ====================
  {
    id: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
    label: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
    value: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
    desc: '8B 轻量高效开源模型，支持 128K 上下文，官方 0 元免费。',
    category: 'Meta Llama 全系列',
    provider: 'Meta',
    type: 'chat',
    tag: '免费 (¥0)',
    tagBadgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold',
    tags: ['对话', '8B', '128K', 'Llama', '免费 (¥0)'],
    iconName: 'Lightning',
    contextWindow: '128K',
    paramScale: '8B',
    isFree: true
  },
  {
    id: 'meta-llama/Llama-3.2-3B-Instruct',
    label: 'meta-llama/Llama-3.2-3B-Instruct',
    value: 'meta-llama/Llama-3.2-3B-Instruct',
    desc: '3B 极小参数极致轻快模型，官方 0 元免费。',
    category: 'Meta Llama 全系列',
    provider: 'Meta',
    type: 'chat',
    tag: '免费 (¥0)',
    tagBadgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold',
    tags: ['对话', '3B', '128K', 'Llama', '免费 (¥0)'],
    iconName: 'Lightning',
    contextWindow: '128K',
    paramScale: '3B',
    isFree: true
  },
  {
    id: 'meta-llama/Llama-3.2-1B-Instruct',
    label: 'meta-llama/Llama-3.2-1B-Instruct',
    value: 'meta-llama/Llama-3.2-1B-Instruct',
    desc: '1B 毫秒级极速响应模型，官方 0 元免费。',
    category: 'Meta Llama 全系列',
    provider: 'Meta',
    type: 'chat',
    tag: '免费 (¥0)',
    tagBadgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold',
    tags: ['对话', '1B', '128K', 'Llama', '免费 (¥0)'],
    iconName: 'Lightning',
    contextWindow: '128K',
    paramScale: '1B',
    isFree: true
  },
  {
    id: 'meta-llama/Llama-3.3-70B-Instruct',
    label: 'meta-llama/Llama-3.3-70B-Instruct',
    value: 'meta-llama/Llama-3.3-70B-Instruct',
    desc: 'Meta 官方最新 Llama 3.3 70B 旗舰指令模型。',
    category: 'Meta Llama 全系列',
    provider: 'Meta',
    type: 'chat',
    tag: '70B 旗舰',
    tagBadgeClass: 'bg-blue-50 text-blue-700 border border-blue-200/80 font-medium',
    tags: ['对话', '70B', '128K', 'Llama 3.3'],
    iconName: 'Cpu',
    contextWindow: '128K',
    paramScale: '70B',
    isFree: false
  },
  {
    id: 'meta-llama/Meta-Llama-3.1-405B-Instruct',
    label: 'meta-llama/Meta-Llama-3.1-405B-Instruct',
    value: 'meta-llama/Meta-Llama-3.1-405B-Instruct',
    desc: '405B 超大参数开源模型，顶级通用理解能力。',
    category: 'Meta Llama 全系列',
    provider: 'Meta',
    type: 'chat',
    tag: '405B 顶配',
    tagBadgeClass: 'bg-blue-50 text-blue-700 border border-blue-200/80 font-medium',
    tags: ['对话', '405B', '128K', '顶级开源'],
    iconName: 'Cpu',
    contextWindow: '128K',
    paramScale: '405B',
    isFree: false
  }
]

for (const model of OFFICIAL_SILICON_MODELS) {
  model.supportsImage = getModelCapabilities(model.id).supportsImage
}

const getStoredApiKey = (customKey?: string): string => {
  if (customKey && customKey.trim()) return customKey.trim()
  try {
    const raw = localStorage.getItem('deepseek_app_config')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.siliconFlowApiKey && parsed.siliconFlowApiKey.trim()) {
        return parsed.siliconFlowApiKey.trim()
      }
    }
  } catch {}
  return (import.meta.env.VITE_SILICONFLOW_API_KEY || '').trim()
}

/**
 * 将平铺的模型列表按分类组织为分组结构
 */
export const groupModelsByCategory = (models: SiliconModelItem[]): ModelGroup[] => {
  const map = new Map<string, SiliconModelItem[]>()
  
  for (const item of models) {
    const cat = item.category || '其他官方模型'
    if (!map.has(cat)) {
      map.set(cat, [])
    }
    map.get(cat)!.push(item)
  }

  const groups: ModelGroup[] = []
  const order = [
    'DeepSeek 官方系列', 
    'Qwen 通义千问全系列', 
    '多模态与视觉识别', 
    '图像生成工坊', 
    'Meta Llama 全系列',
    '智谱 & 零一 & 国产名模',
    '其他官方模型'
  ]
  
  for (const cat of order) {
    if (map.has(cat)) {
      groups.push({ category: cat, items: map.get(cat)! })
      map.delete(cat)
    }
  }

  // 剩余分类依次追加
  for (const [cat, items] of map.entries()) {
    groups.push({ category: cat, items })
  }

  return groups
}

export const DEFAULT_MODEL_GROUPS = groupModelsByCategory(OFFICIAL_SILICON_MODELS)

export interface LiveModelsResult {
  success: boolean
  isOnline: boolean
  items: SiliconModelItem[]
  message?: string
}

class SiliconModelsService {
  /**
   * 从硅基流动官方 GET /v1/models 接口拉取全量在线活跃模型端点
   */
  async fetchLiveModels(apiKey?: string): Promise<LiveModelsResult> {
    const key = getStoredApiKey(apiKey)
    if (!key) {
      return {
        success: false,
        isOnline: false,
        items: OFFICIAL_SILICON_MODELS,
        message: '未配置 API Key，使用本地内置官方模型库'
      }
    }

    try {
      const res = await fetch(`${SILICON_API_BASE}/models`, {
        headers: {
          'Authorization': `Bearer ${key}`
        }
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        const errorMsg = errJson.message || `云端鉴权失败 (${res.status})`
        return {
          success: false,
          isOnline: false,
          items: OFFICIAL_SILICON_MODELS,
          message: errorMsg
        }
      }
      const result = await res.json()
      const data: Array<{ id: string; sub_type?: string; owned_by?: string }> = result.data || []
      
      if (!Array.isArray(data) || data.length === 0) {
        return {
          success: true,
          isOnline: true,
          items: [],
          message: '云端未返回可用模型端点'
        }
      }

      // 将线上返回的真实模型映射为规范项
      const liveItems: SiliconModelItem[] = data.map(raw => {
        const id = raw.id
        const lower = id.toLowerCase()
        const isDeepSeek = lower.includes('deepseek')
        const isQwen = lower.includes('qwen') || lower.includes('qwq')
        // The API does not return a dependable capability schema. Only send
        // image_url to endpoints in the maintained capability registry.
        const supportsImage = supportsImageInput(id)
        const isVL = supportsImage
        const isImage = lower.includes('kolors') || lower.includes('flux') || lower.includes('diffusion') || lower.includes('sdxl') || lower.includes('image')
        const isLlama = lower.includes('llama') && !isDeepSeek
        const isZhipu = lower.includes('glm')
        const isKimi = lower.includes('kimi') || lower.includes('moonshot')
        const isMiniMax = lower.includes('minimax')
        const isDomestic = isZhipu || lower.includes('yi') || lower.includes('internlm') || lower.includes('baichuan') || lower.includes('telechat') || isKimi || isMiniMax || lower.includes('longcat')

        let provider = '官方开源'
        if (isDeepSeek) provider = 'DeepSeek'
        else if (isQwen) provider = 'Qwen'
        else if (isZhipu) provider = '智谱'
        else if (isKimi) provider = 'Kimi'
        else if (isMiniMax) provider = 'MiniMax'
        else if (isLlama) provider = 'Meta'
        else if (lower.includes('kolors')) provider = '快手可图'
        else if (lower.includes('flux')) provider = 'BlackForest'
        else if (lower.includes('stability')) provider = 'StabilityAI'
        else if (lower.includes('bytedance')) provider = '字节跳动'
        else if (lower.includes('longcat')) provider = '美团'
        else if (lower.includes('internlm')) provider = '书生浦语'
        else if (lower.includes('baichuan')) provider = '百川'
        else if (lower.includes('tele')) provider = '电信星辰'

        let category = '其他官方模型'
        if (isVL) category = '多模态与视觉识别'
        else if (isDeepSeek) category = 'DeepSeek 官方系列'
        else if (isImage) category = '图像生成工坊'
        else if (isQwen) category = 'Qwen 通义千问全系列'
        else if (isLlama) category = 'Meta Llama 全系列'
        else if (isDomestic) category = '智谱 & 零一 & 国产名模'

        // 判定是否为 0 元 Token 免费模型
        const isFree = OFFICIAL_FREE_MODEL_IDS.has(id)

        // 标签判定
        let tag = '官方'
        let tagBadgeClass = 'bg-slate-100 text-slate-600 border border-slate-200/60 font-medium'
        const tags: string[] = []

        if (isImage) {
          tags.push('生图')
        } else if (isVL) {
          tags.push('对话', '视觉')
        } else {
          tags.push('对话')
        }

        if (lower.includes('tools') || isDeepSeek || isQwen || isZhipu || isKimi || isMiniMax) {
          tags.push('Tools')
        }

        // 提取参数
        const match = id.match(/(\d+(?:\.\d+)?B|\d+(?:\.\d+)?T)/i)
        const paramScale = match ? match[1].toUpperCase() : undefined
        if (paramScale) {
          tags.push(paramScale)
        }

        // 提取上下文
        let contextWindow = '32K'
        if (lower.includes('1m') || lower.includes('long')) {
          contextWindow = '1M'
          tags.push('1M')
        } else if (lower.includes('256k')) {
          contextWindow = '256K'
          tags.push('256K')
        } else if (lower.includes('200k')) {
          contextWindow = '200K'
          tags.push('200K')
        } else if (lower.includes('128k') || isQwen || isLlama) {
          contextWindow = '128K'
        }

        if (lower.includes('moe') || id.includes('-A') || id.includes('A3B') || id.includes('A17B') || id.includes('A10B') || isDeepSeek) {
          tags.push('MoE')
        }

        if (lower.includes('r1') || lower.includes('qwq') || lower.includes('reason') || lower.includes('thinking')) {
          tags.push('推理模型')
        }

        if (lower.includes('coder') || lower.includes('code')) {
          tags.push('Coder')
        }

        if (isFree) {
          tag = '免费 (¥0)'
          tagBadgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold'
          tags.push('免费 (¥0)')
        } else if (id.startsWith('Pro/')) {
          tag = 'Pro 旗舰'
          tagBadgeClass = 'bg-purple-50 text-purple-700 border border-purple-200/80 font-semibold'
        } else if (lower.includes('r1') || lower.includes('qwq')) {
          tag = '推理模型'
          tagBadgeClass = 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-semibold'
        } else if (isVL) {
          tag = lower.includes('ocr') ? 'OCR 解析' : '视觉'
          tagBadgeClass = 'bg-cyan-50 text-cyan-700 border border-cyan-200/80 font-medium'
        } else if (isImage) {
          tag = '生图'
          tagBadgeClass = 'bg-purple-50 text-purple-700 border border-purple-200/80 font-medium'
        } else if (lower.includes('coder') || lower.includes('code')) {
          tag = 'Coder'
          tagBadgeClass = 'bg-amber-50 text-amber-700 border border-amber-200/80 font-medium'
        } else if (paramScale) {
          tag = paramScale
          tagBadgeClass = 'bg-slate-100 text-slate-600 border border-slate-200/60 font-medium'
        }

        const iconName: SiliconModelItem['iconName'] = isDeepSeek 
          ? 'Cpu' 
          : (isVL ? (id.includes('ocr') || id.includes('2-vl') ? 'Document' : 'Picture') : (isImage ? 'Brush' : (isFree ? 'Lightning' : 'Cpu')))

        const isNew = lower.includes('5.2') || lower.includes('v4-pro') || lower.includes('k2.7-code')

        let smartDesc = '官方高品质大语言模型端点。'
        if (isDeepSeek) {
          smartDesc = id.includes('R1') ? 'DeepSeek 强化学习推理旗舰，具备超长自省思考链与顶尖数学逻辑能力。' : 'DeepSeek MoE 高吞吐通用大模型，知识覆盖与复杂任务执行出色。'
        } else if (lower.includes('glm-5') || lower.includes('glm-4')) {
          smartDesc = '智谱 AI 旗舰通用基座模型，长文本理解、逻辑推理与中文综合能力卓越。'
        } else if (lower.includes('kimi')) {
          smartDesc = lower.includes('code') ? 'Moonshot Kimi 代码专精大模型，算法编写、架构设计与单元测试全面增强。' : 'Moonshot Kimi 长文本智能对话模型，上下文遵循与知识问答表现出众。'
        } else if (lower.includes('longcat')) {
          smartDesc = '美团 LongCat 旗舰长文本架构大模型，专为超长会话与复杂任务推理设计。'
        } else if (isQwen) {
          smartDesc = lower.includes('coder') ? '通义千问 Coder 官方代码旗舰，支持多编程语言生成与调试。' : (isVL ? '通义千问 VL 多模态视觉模型，高分辨率图像问答与图表抽取。' : '阿里通义千问开源全能旗舰，综合知识、数学及多语言创作顶尖。')
        } else if (isLlama) {
          smartDesc = 'Meta Llama 开源旗舰架构，全球顶尖的多语言对话与指令遵循表现。'
        } else if (isVL) {
          smartDesc = '高精度多模态视觉理解模型，支持复杂文档 OCR、图表与图文综合解析。'
        } else if (isImage) {
          smartDesc = '高画质图像生成与艺术创作引擎，支持多分辨率与风格精准控制。'
        } else if (contextWindow === '1M') {
          smartDesc = '原生支持 100 万超长 Tokens 上下文，海量文档精细检索与长流程分析。'
        }

        return {
          id: id,
          label: id,
          value: isImage && lower.includes('kolors') ? 'art-studio' : id,
          desc: smartDesc,
          category,
          provider,
          type: isImage ? 'image' : 'chat',
          tag,
          tagBadgeClass,
          tags: Array.from(new Set(tags)),
          isLogo: isDeepSeek,
          logoSrc: isDeepSeek ? deepseekLogo : undefined,
          iconName,
          iconBg: 'bg-slate-100 text-slate-700',
          iconColor: 'text-slate-700',
          contextWindow,
          paramScale,
          isFree,
          isNew,
          pricingText: isFree ? '0 元免费' : '官方标准计费',
          platform: 'siliconflow',
          supportsImage,
          isLive: true
        }
      })

      // A successful /models response is authoritative. Retaining every
      // bundled entry here made endpoints removed by the provider selectable.
      const bundledById = new Map(OFFICIAL_SILICON_MODELS.map(item => [item.id, item]))
      const items = liveItems.map(item => {
        const bundled = bundledById.get(item.id)
        return bundled
          ? { ...bundled, ...item, supportsImage: getModelCapabilities(item.id).supportsImage, isLive: true }
          : item
      })

      return {
        success: true,
        isOnline: true,
        items,
        message: `成功同步 ${data.length} 个线上活跃模型`
      }
    } catch (e: any) {
      console.warn('拉取在线模型失败，降级使用官方预设列表:', e)
      return {
        success: false,
        isOnline: false,
        items: OFFICIAL_SILICON_MODELS,
        message: e.message || '网络连接异常'
      }
    }
  }

  /**
   * 查询硅基流动用户账户信息及剩余算力余额
  /**
   * 查询硅基流动用户账户信息及剩余算力余额
   * 注意：SiliconFlow 官方已下线 /v1/user/info 接口 (410 Gone)，静默返回 null 避免控制台红标
   */
  async fetchUserBalance(_apiKey?: string): Promise<UserAccountInfo | null> {
    return null
  }

  /**
   * 测试硅基流动 API Key 连通性（通过官方标准的 /v1/models 接口）
   */
  async testKey(apiKey: string): Promise<{ success: boolean; message: string; account?: string }> {
    const key = apiKey?.trim()
    if (!key) {
      return { success: false, message: '请先输入 SiliconFlow API 密钥' }
    }

    try {
      // 通过标准 /v1/models 验证密钥有效性（此接口对所有有效 Key 开放）
      const res = await fetch(`${SILICON_API_BASE}/models`, {
        headers: {
          'Authorization': `Bearer ${key}`
        }
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const errMsg = data.message || data.error?.message || (res.status === 401 ? 'API Key 鉴权失败，请检查密钥是否正确（请确保以 sk- 开头且无多余空格）' : `请求失败 (${res.status})`)
        return { success: false, message: errMsg }
      }

      return {
        success: true,
        message: 'SiliconFlow 连接成功！服务状态正常',
        account: ''
      }
    } catch (e: any) {
      return {
        success: false,
        message: `网络连接失败：${e.message || '无法连接 api.siliconflow.cn'}`
      }
    }
  }
}

export const siliconModelsService = new SiliconModelsService()
