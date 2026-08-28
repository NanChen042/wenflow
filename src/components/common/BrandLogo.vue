<template>
  <div 
    class="brand-logo-container flex items-center justify-center shrink-0 select-none overflow-hidden transition-all duration-200 shadow-2xs border bg-white"
    :class="[containerClass, containerBorderClass]"
  >
    <img 
      v-if="iconSrc" 
      :src="iconSrc" 
      :alt="provider || 'Model'" 
      class="w-full h-full object-contain p-1.5 transition-transform duration-200 group-hover:scale-105" 
      loading="lazy"
      @error="handleImgError"
    />
    <!-- Fallback if no matching logo -->
    <div 
      v-else 
      class="w-full h-full flex items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold font-mono text-xs"
    >
      {{ (provider || modelId || 'AI').slice(0, 2).toUpperCase() }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

// Import official LobeHub full-color vector SVG brand icons
import deepseekSvg from '@/assets/icons/models/deepseek-color.svg'
import openaiSvg from '@/assets/icons/models/openai.svg'
import claudeSvg from '@/assets/icons/models/claude-color.svg'
import geminiSvg from '@/assets/icons/models/gemini-color.svg'
import gemmaSvg from '@/assets/icons/models/gemma-color.svg'
import metaSvg from '@/assets/icons/models/meta-color.svg'
import qwenSvg from '@/assets/icons/models/qwen-color.svg'
import zhipuSvg from '@/assets/icons/models/zhipu-color.svg'
import kimiSvg from '@/assets/icons/models/kimi-color.svg'
import minimaxSvg from '@/assets/icons/models/minimax-color.svg'
import mistralSvg from '@/assets/icons/models/mistral-color.svg'
import doubaoSvg from '@/assets/icons/models/doubao-color.svg'
import baichuanSvg from '@/assets/icons/models/baichuan-color.svg'
import internlmSvg from '@/assets/icons/models/internlm-color.svg'
import yiSvg from '@/assets/icons/models/yi-color.svg'
import stabilitySvg from '@/assets/icons/models/stability-color.svg'
import fluxSvg from '@/assets/icons/models/flux.svg'
import grokSvg from '@/assets/icons/models/grok.svg'
import openrouterSvg from '@/assets/icons/models/openrouter-color.svg'
import siliconcloudSvg from '@/assets/icons/models/siliconcloud-color.svg'
import perplexitySvg from '@/assets/icons/models/perplexity-color.svg'
import cohereSvg from '@/assets/icons/models/cohere-color.svg'
import nvidiaSvg from '@/assets/icons/models/nvidia-color.svg'
import sensenovaSvg from '@/assets/icons/models/sensenova-color.svg'
import stepfunSvg from '@/assets/icons/models/stepfun-color.svg'
import hunyuanSvg from '@/assets/icons/models/hunyuan-color.svg'
import wenxinSvg from '@/assets/icons/models/wenxin-color.svg'
import huggingfaceSvg from '@/assets/icons/models/huggingface-color.svg'

const props = withDefaults(defineProps<{
  provider?: string
  modelId?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  size: 'md'
})

const imgLoadError = ref(false)

const handleImgError = () => {
  imgLoadError.value = true
}

const iconSrc = computed(() => {
  if (imgLoadError.value) return null

  const p = (props.provider || '').toLowerCase()
  const id = (props.modelId || '').toLowerCase()

  // 1. DeepSeek
  if (p.includes('deepseek') || id.includes('deepseek')) return deepseekSvg

  // 2. OpenAI / GPT / o1 / o3
  if (p.includes('openai') || id.includes('gpt') || id.includes('o1-') || id.includes('o3-') || id.includes('text-embedding-3') || id.includes('dall-e')) return openaiSvg

  // 3. Anthropic / Claude
  if (p.includes('anthropic') || id.includes('claude')) return claudeSvg

  // 4. Google / Gemini / Gemma
  if (id.includes('gemma')) return gemmaSvg
  if (p.includes('google') || id.includes('gemini')) return geminiSvg

  // 5. Meta / Llama
  if (p.includes('meta') || id.includes('llama')) return metaSvg

  // 6. Alibaba / Qwen / QwQ / 通义千问
  if (p.includes('qwen') || id.includes('qwen') || id.includes('qwq') || p.includes('阿里') || p.includes('千问')) return qwenSvg

  // 7. 智谱 GLM / Zhipu / ChatGLM
  if (p.includes('智谱') || p.includes('zhipu') || id.includes('glm') || id.includes('chatglm')) return zhipuSvg

  // 8. Moonshot / Kimi
  if (p.includes('kimi') || p.includes('moonshot') || id.includes('kimi') || id.includes('moonshot')) return kimiSvg

  // 9. MiniMax
  if (p.includes('minimax') || id.includes('minimax') || id.includes('abab')) return minimaxSvg

  // 10. Mistral / Codestral / Mixtral / Pixtral
  if (p.includes('mistral') || id.includes('mistral') || id.includes('mixtral') || id.includes('codestral') || id.includes('pixtral')) return mistralSvg

  // 11. 字节跳动 / 豆包 (ByteDance / Doubao)
  if (p.includes('字节') || p.includes('bytedance') || id.includes('doubao') || id.includes('skylark')) return doubaoSvg

  // 12. 百川智能 (Baichuan)
  if (p.includes('百川') || id.includes('baichuan')) return baichuanSvg

  // 13. 书生浦语 (InternLM)
  if (p.includes('书生') || p.includes('internlm') || id.includes('internlm')) return internlmSvg

  // 14. 零一万物 (Yi / 01.AI)
  if (p.includes('零一') || p.includes('01.ai') || id.includes('yi-') || id.includes('yi/')) return yiSvg

  // 15. FLUX (Black Forest Labs)
  if (p.includes('blackforest') || p.includes('flux') || id.includes('flux')) return fluxSvg

  // 16. Stability AI (Stable Diffusion / SDXL)
  if (p.includes('stability') || id.includes('sdxl') || id.includes('stable-diffusion') || id.includes('sd-')) return stabilitySvg

  // 17. xAI / Grok
  if (p.includes('xai') || p.includes('x-ai') || id.includes('grok')) return grokSvg

  // 18. Perplexity
  if (p.includes('perplexity') || id.includes('sonar') || id.includes('perplexity')) return perplexitySvg

  // 19. Cohere
  if (p.includes('cohere') || id.includes('command-r') || id.includes('cohere')) return cohereSvg

  // 20. Nvidia
  if (p.includes('nvidia') || id.includes('nemotron')) return nvidiaSvg

  // 21. 商汤 (SenseNova)
  if (p.includes('商汤') || p.includes('sensenova') || id.includes('nova')) return sensenovaSvg

  // 22. 阶跃星辰 (StepFun)
  if (p.includes('阶跃') || p.includes('stepfun') || id.includes('step-')) return stepfunSvg

  // 23. 腾讯混元 (Hunyuan)
  if (p.includes('腾讯') || p.includes('hunyuan') || id.includes('hunyuan')) return hunyuanSvg

  // 24. 百度文心 (Wenxin)
  if (p.includes('百度') || p.includes('wenxin') || id.includes('ernie')) return wenxinSvg

  // 25. Hugging Face
  if (p.includes('huggingface') || id.includes('zephyr') || id.includes('starcoder')) return huggingfaceSvg

  // 26. OpenRouter
  if (p.includes('openrouter') || id.startsWith('openrouter/')) return openrouterSvg

  // 27. SiliconFlow / SiliconCloud
  if (p.includes('siliconflow') || p.includes('siliconcloud')) return siliconcloudSvg

  return null
})

const containerClass = computed(() => {
  const sizeClasses = {
    sm: 'w-7 h-7 rounded-md',
    md: 'w-10 h-10 rounded-lg',
    lg: 'w-12 h-12 rounded-lg',
    xl: 'w-14 h-14 rounded-xl'
  }
  return `${sizeClasses[props.size]}`
})

const containerBorderClass = computed(() => {
  const p = (props.provider || '').toLowerCase()
  const id = (props.modelId || '').toLowerCase()

  if (p.includes('deepseek') || id.includes('deepseek')) return 'border-blue-100 bg-blue-50/20'
  if (p.includes('openai') || id.includes('gpt') || id.includes('o1-')) return 'border-emerald-100 bg-emerald-50/20'
  if (p.includes('anthropic') || id.includes('claude')) return 'border-amber-100 bg-amber-50/20'
  if (p.includes('google') || id.includes('gemini')) return 'border-indigo-100 bg-indigo-50/20'
  if (p.includes('meta') || id.includes('llama')) return 'border-blue-100 bg-blue-50/20'
  if (p.includes('qwen') || id.includes('qwen')) return 'border-purple-100 bg-purple-50/20'
  if (p.includes('智谱') || id.includes('glm')) return 'border-blue-100 bg-blue-50/20'
  if (p.includes('kimi') || id.includes('kimi')) return 'border-slate-200 bg-slate-50'
  if (p.includes('openrouter') || id.startsWith('openrouter/')) return 'border-purple-100 bg-purple-50/20'

  return 'border-slate-200/80 bg-slate-50/30'
})
</script>
