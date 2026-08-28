<template>
  <el-dialog
    v-model="visible"
    width="580px"
    class="enterprise-settings-dialog"
    :show-close="true"
    append-to-body
    align-center
    :close-on-click-modal="true"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80 shadow-2xs shrink-0">
          <el-icon class="text-base"><Setting /></el-icon>
        </div>
        <div class="min-w-0">
          <h3 class="text-base font-bold text-slate-900 leading-snug">工作台与 API 配置</h3>
          <p class="text-xs text-slate-500 mt-0.5">配置模型服务密钥与默认参数，数据仅存储于本地沙箱</p>
        </div>
      </div>
    </template>

    <div class="enterprise-settings-body">
      <el-tabs v-model="activeTab" class="enterprise-tabs">
        <!-- TAB 1: API 接口与密钥 -->
        <el-tab-pane label="接口与密钥" name="api">
          <el-form label-position="top" class="pt-2">
            <!-- 1. SiliconFlow Key -->
            <el-form-item class="!mb-4.5">
              <template #label>
                <div class="flex items-center justify-between w-full">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-slate-800 text-xs">SiliconFlow API 密钥</span>
                    <span class="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-600 font-semibold border border-blue-100">国内极速</span>
                  </div>
                  <el-button 
                    link 
                    type="primary" 
                    size="small" 
                    :loading="isTestingKey" 
                    :disabled="!tempSiliconFlowKey.trim()" 
                    @click="testKey"
                    class="!text-xs font-medium !p-0"
                  >
                    <el-icon class="mr-1"><Refresh /></el-icon>
                    测试连通性
                  </el-button>
                </div>
              </template>
              <el-input
                v-model="tempSiliconFlowKey"
                placeholder="sk-..."
                show-password
                clearable
                size="default"
              />
              <div class="text-xs text-slate-400 mt-1.5 leading-normal">
                支持 DeepSeek-V3/R1、Qwen 全系列、多模态视觉及图像生成引擎。
              </div>
            </el-form-item>

            <!-- 2. OpenRouter Key -->
            <el-form-item class="!mb-4.5">
              <template #label>
                <div class="flex items-center justify-between w-full">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-slate-800 text-xs">OpenRouter API 密钥</span>
                    <span class="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-semibold border border-purple-100">全球 400+</span>
                  </div>
                  <el-button 
                    link 
                    type="primary" 
                    size="small" 
                    :loading="isTestingOpenRouter" 
                    :disabled="!tempOpenRouterKey.trim()" 
                    @click="testOpenRouterKey"
                    class="!text-xs font-medium !p-0"
                  >
                    <el-icon class="mr-1"><Refresh /></el-icon>
                    测试连通性
                  </el-button>
                </div>
              </template>
              <el-input
                v-model="tempOpenRouterKey"
                placeholder="sk-or-v1-..."
                show-password
                clearable
                size="default"
              />
              <div class="text-xs text-slate-400 mt-1.5 leading-normal">
                可访问 Google Gemini 2.0、Claude 3.5、GPT-4o 及 <span class="font-mono text-emerald-600 font-semibold">openrouter/free</span> 官方 0 元免费模型池。
              </div>
            </el-form-item>

            <!-- 3. DeepSeek Official Key -->
            <el-form-item class="!mb-1">
              <template #label>
                <div class="flex items-center justify-between w-full">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-slate-800 text-xs">DeepSeek 官方直连密钥</span>
                    <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">备用直连</span>
                  </div>
                  <el-button 
                    link 
                    type="primary" 
                    size="small" 
                    :loading="isTestingDeepSeek" 
                    :disabled="!tempDeepSeekKey.trim()" 
                    @click="testDeepSeekKey"
                    class="!text-xs font-medium !p-0"
                  >
                    <el-icon class="mr-1"><Refresh /></el-icon>
                    测试连通性
                  </el-button>
                </div>
              </template>
              <el-input
                v-model="tempDeepSeekKey"
                placeholder="sk-..."
                show-password
                clearable
                size="default"
              />
              <div class="text-xs text-slate-400 mt-1.5 leading-normal">
                DeepSeek 官方开放平台直连密钥 (api.deepseek.com)。
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- TAB 2: 通用偏好 -->
        <el-tab-pane label="偏好与默认模型" name="preferences">
          <el-form label-position="top" class="pt-2">
            <el-form-item label="新建会话默认模型" class="!mb-4">
              <el-select
                v-model="tempDefaultModel"
                placeholder="选择默认模型"
                class="w-full"
                size="default"
                filterable
              >
                <el-option-group label="推荐免费模型（零成本调用）">
                  <el-option label="DeepSeek-R1-Distill-Qwen-7B (免费)" value="deepseek-ai/DeepSeek-R1-Distill-Qwen-7B" />
                  <el-option label="OpenRouter Free 智能免费路由 (免费)" value="openrouter/free" />
                  <el-option label="Gemini 2.0 Flash (OpenRouter 免费)" value="google/gemini-2.0-flash-exp:free" />
                  <el-option label="Llama-3.3-70B-Instruct (OpenRouter 免费)" value="meta-llama/llama-3.3-70b-instruct:free" />
                  <el-option label="DeepSeek-R1-Distill-Llama-8B (免费)" value="deepseek-ai/DeepSeek-R1-Distill-Llama-8B" />
                  <el-option label="Qwen2.5-7B-Instruct (免费)" value="Qwen/Qwen2.5-7B-Instruct" />
                  <el-option label="Qwen2.5-Coder-7B-Instruct (免费代码)" value="Qwen/Qwen2.5-Coder-7B-Instruct" />
                  <el-option label="Qwen2.5-VL-7B-Instruct (免费多模态)" value="Qwen/Qwen2.5-VL-7B-Instruct" />
                </el-option-group>
                <el-option-group label="满血旗舰模型（深度推理与专业创作）">
                  <el-option label="DeepSeek-V3 (671B 旗舰)" value="deepseek-ai/DeepSeek-V3" />
                  <el-option label="DeepSeek-R1 (671B 深度思考)" value="deepseek-ai/DeepSeek-R1" />
                  <el-option label="Claude 3.5 Sonnet (OpenRouter 旗舰)" value="anthropic/claude-3.5-sonnet" />
                  <el-option label="GPT-4o (OpenRouter 旗舰)" value="openai/gpt-4o" />
                  <el-option label="Qwen2.5-72B-Instruct (72B 全能)" value="Qwen/Qwen2.5-72B-Instruct" />
                  <el-option label="Llama-3.3-70B-Instruct (70B 旗舰)" value="meta-llama/Llama-3.3-70B-Instruct" />
                  <el-option label="GLM-4-9B-Chat (智谱清言)" value="THUDM/glm-4-9b-chat" />
                </el-option-group>
              </el-select>
              <div class="text-xs text-slate-400 mt-1.5 leading-normal">
                每次新建对话或打开工作台时，将自动以此模型作为初始配置。
              </div>
            </el-form-item>

            <div class="p-3 bg-slate-50 border border-slate-200/70 rounded-lg text-xs text-slate-500 space-y-1">
              <div class="font-semibold text-slate-700 text-xs">💡 快捷切换提示</div>
              <div class="text-xs text-slate-500 leading-relaxed">您也可以在对话界面顶部随时切换任意模型，无需在此重复修改。</div>
            </div>
          </el-form>
        </el-tab-pane>

        <!-- TAB 3: 安全与存储 -->
        <el-tab-pane label="数据安全与合规" name="security">
          <div class="pt-2 space-y-3 text-xs">
            <div class="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg flex items-start gap-2.5">
              <el-icon class="text-slate-500 text-base mt-0.5 shrink-0"><Lock /></el-icon>
              <div class="text-slate-600 leading-relaxed text-xs">
                <strong class="text-slate-800">本地安全隔离：</strong>
                API 密钥与历史会话仅加密存储于当前浏览器的 LocalStorage 沙箱中。所有大模型请求均直接与官方服务商端点通信，绝不经过任何第三方中间服务器。
              </div>
            </div>

            <div class="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg flex items-start gap-2.5">
              <el-icon class="text-blue-500 text-base mt-0.5 shrink-0"><InfoFilled /></el-icon>
              <div class="text-slate-600 leading-relaxed text-xs">
                <strong class="text-slate-800">合规调用建议：</strong>
                调用 SiliconFlow、OpenRouter 或 DeepSeek 服务需遵守相关平台服务条款与《生成式人工智能服务管理暂行办法》，请勿生成违法或侵权内容。
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <span class="text-xs text-slate-500 flex items-center gap-1.5">
          <el-icon class="text-emerald-500 text-sm"><CircleCheckFilled /></el-icon>
          <span>数据沙箱存储，保存即生效</span>
        </span>
        <div class="flex items-center gap-2.5">
          <el-button @click="close" size="default">取消</el-button>
          <el-button type="primary" :loading="isSaving" @click="saveSettings" size="default">保存配置</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Setting, Refresh, Lock, CircleCheckFilled, InfoFilled } from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config'
import { useChatStore } from '@/stores/chat'
import { siliconModelsService } from '@/services/modelsService'
import { openRouterService } from '@/services/openrouterService'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
}>()

const configStore = useConfigStore()
const chatStore = useChatStore()

const visible = ref(props.modelValue)
const activeTab = ref('api')
const tempSiliconFlowKey = ref('')
const tempDeepSeekKey = ref('')
const tempOpenRouterKey = ref('')
const tempDefaultModel = ref('')
const isTestingKey = ref(false)
const isTestingOpenRouter = ref(false)
const isTestingDeepSeek = ref(false)
const isSaving = ref(false)

watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal) {
    tempSiliconFlowKey.value = configStore.config.siliconFlowApiKey || ''
    tempDeepSeekKey.value = configStore.config.deepseekApiKey || ''
    tempOpenRouterKey.value = configStore.config.openrouterApiKey || ''
    tempDefaultModel.value = configStore.config.defaultModel || 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B'
  }
})

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

const close = () => {
  visible.value = false
}

const testKey = async () => {
  const key = tempSiliconFlowKey.value.trim()
  if (!key) {
    ElMessage.warning('请先输入 SiliconFlow API 密钥')
    return
  }

  isTestingKey.value = true
  try {
    const res = await siliconModelsService.testKey(key)
    if (res.success) {
      ElMessage.success(res.message)
    } else {
      ElMessage.error(res.message)
    }
  } finally {
    isTestingKey.value = false
  }
}

const testOpenRouterKey = async () => {
  const key = tempOpenRouterKey.value.trim()
  if (!key) {
    ElMessage.warning('请先输入 OpenRouter API 密钥')
    return
  }

  isTestingOpenRouter.value = true
  try {
    const res = await openRouterService.testKey(key)
    if (res.success) {
      ElMessage.success(res.message)
    } else {
      ElMessage.error(res.message)
    }
  } finally {
    isTestingOpenRouter.value = false
  }
}

const testDeepSeekKey = async () => {
  const key = tempDeepSeekKey.value.trim()
  if (!key) {
    ElMessage.warning('请先输入 DeepSeek 官方直连密钥')
    return
  }

  isTestingDeepSeek.value = true
  try {
    const res = await fetch('https://api.deepseek.com/models', {
      headers: { 'Authorization': `Bearer ${key}` }
    })
    if (res.ok) {
      ElMessage.success('DeepSeek 官方开放平台鉴权通过！')
    } else {
      const data = await res.json().catch(() => ({}))
      ElMessage.error(`DeepSeek 连接失败: ${data.error?.message || '密钥鉴权失败'}`)
    }
  } catch (err: any) {
    ElMessage.error(`网络连接异常: ${err.message || '请检查网络'}`)
  } finally {
    isTestingDeepSeek.value = false
  }
}

const saveSettings = async () => {
  isSaving.value = true
  try {
    const sfKey = tempSiliconFlowKey.value.trim()
    const dsKey = tempDeepSeekKey.value.trim()
    const orKey = tempOpenRouterKey.value.trim()
    const model = tempDefaultModel.value.trim()

    configStore.setSiliconFlowKey(sfKey)
    configStore.setDeepSeekKey(dsKey)
    configStore.setOpenRouterKey(orKey)
    if (model) {
      configStore.setDefaultModel(model)
      chatStore.switchModel(model as any)
    }

    ElMessage.success('设置已保存并生效')
    
    if (sfKey) {
      siliconModelsService.fetchLiveModels(sfKey).catch(() => {})
    }
    if (orKey) {
      openRouterService.fetchLiveModels(orKey).catch(() => {})
    }

    close()
  } finally {
    isSaving.value = false
  }
}

defineExpose({
  open: () => { visible.value = true }
})
</script>

<style scoped>
:deep(.el-form-item__label) {
  display: block !important;
  width: 100% !important;
  margin-bottom: 6px !important;
  padding: 0 !important;
  line-height: 1.3 !important;
}

:deep(.el-tabs__header) {
  margin-bottom: 16px;
}

:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: #f1f5f9;
}

:deep(.el-tabs__item) {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  padding: 0 16px;
  height: 36px;
  line-height: 36px;
}

:deep(.el-tabs__item:hover) {
  color: #2563eb;
}

:deep(.el-tabs__item.is-active) {
  color: #2563eb;
}

:deep(.el-tabs__active-bar) {
  background-color: #2563eb;
  height: 2px;
  border-radius: 1px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  height: 36px;
  box-shadow: 0 0 0 1px #e2e8f0 inset !important;
  transition: all 0.2s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #93c5fd inset !important;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1.5px #2563eb inset, 0 0 0 3px rgba(37, 99, 235, 0.08) !important;
}

:deep(.el-select__wrapper) {
  border-radius: 8px;
  min-height: 36px;
  box-shadow: 0 0 0 1px #e2e8f0 inset !important;
}

:deep(.el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px #93c5fd inset !important;
}

:deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1.5px #2563eb inset, 0 0 0 3px rgba(37, 99, 235, 0.08) !important;
}
</style>
