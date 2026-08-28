import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { 
  setSiliconFlowKey as setChatKey, 
  setDeepSeekKey as setChatDeepSeekKey,
  setOpenRouterKey as setChatOpenRouterKey
} from '@/services/aiService'
import { setSiliconFlowKey as setImageKey } from '@/services/imageService'

const STORAGE_KEY = 'deepseek_app_config'

export interface AppConfig {
  deepseekApiKey: string
  siliconFlowApiKey: string
  openrouterApiKey: string
  defaultModel: string
}

export const useConfigStore = defineStore('config', () => {
  const loadConfig = (): AppConfig => {
    const defaultConfig: AppConfig = {
      deepseekApiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || '',
      siliconFlowApiKey: import.meta.env.VITE_SILICONFLOW_API_KEY || '',
      openrouterApiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
      defaultModel: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B' // 默认首选免费高品质模型
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return { ...defaultConfig, ...JSON.parse(stored) }
      }
    } catch (e) {
      console.error('Failed to parse app config', e)
    }
    return defaultConfig
  }

  const config = ref<AppConfig>(loadConfig())

  // 初始化时同步到服务
  setChatKey(config.value.siliconFlowApiKey)
  setChatDeepSeekKey(config.value.deepseekApiKey)
  setChatOpenRouterKey(config.value.openrouterApiKey)
  setImageKey(config.value.siliconFlowApiKey)

  // 监听配置变化并自动持久化
  watch(config, (newConfig) => {
    setChatKey(newConfig.siliconFlowApiKey)
    setChatDeepSeekKey(newConfig.deepseekApiKey)
    setChatOpenRouterKey(newConfig.openrouterApiKey)
    setImageKey(newConfig.siliconFlowApiKey)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
  }, { deep: true })

  const setDeepSeekKeyInStore = (key: string) => {
    config.value.deepseekApiKey = key
    setChatDeepSeekKey(key)
  }

  const setSiliconFlowKeyInStore = (key: string) => {
    config.value.siliconFlowApiKey = key
    setChatKey(key)
    setImageKey(key)
  }

  const setOpenRouterKeyInStore = (key: string) => {
    config.value.openrouterApiKey = key
    setChatOpenRouterKey(key)
  }

  const setDefaultModelInStore = (model: string) => {
    config.value.defaultModel = model
  }

  return {
    config,
    setDeepSeekKey: setDeepSeekKeyInStore,
    setSiliconFlowKey: setSiliconFlowKeyInStore,
    setOpenRouterKey: setOpenRouterKeyInStore,
    setDefaultModel: setDefaultModelInStore
  }
})
