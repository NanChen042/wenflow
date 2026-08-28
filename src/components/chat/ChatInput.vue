<template>
  <div class="chat-input-container" :class="{ 'is-compact': compact }">
    <!-- Asset Preview Gallery (Inside container) -->
    <div v-if="assets.length > 0" class="asset-previews-bar animate-in fade-in slide-in-from-bottom-2">
      <div v-for="(asset, idx) in assets" :key="idx" class="asset-preview-card group">
        <div class="asset-type-badge">{{ asset.type.toUpperCase() }}</div>
        <img v-if="asset.type === 'image'" :src="asset.url" class="asset-thumb" :alt="asset.name || '图片附件'" />
        <button v-else-if="asset.type === 'pdf'" type="button" class="asset-icon-wrapper cursor-pointer" @click="openAsset(asset.url)" :title="asset.name || '打开 PDF 文件'">
          <el-icon>
            <Document />
          </el-icon>
        </button>
        <div v-else class="asset-icon-wrapper">
          <el-icon v-if="asset.type === 'audio'">
            <Mic />
          </el-icon>
          <el-icon v-else>
            <VideoPlay />
          </el-icon>
        </div>
        <button @click="removeAsset(idx)" class="remove-asset-btn" title="移除附件">
          <el-icon>
            <Close />
          </el-icon>
        </button>
        <div class="asset-name-tooltip">{{ asset.name }}</div>
      </div>
    </div>

    <!-- Main Unified High-End Input Card -->
    <div :class="[
      'unified-input-card transition-all duration-300',
      isFocused ? 'is-focused' : '',
      currentMode === 'image' ? 'is-art-mode' : '',
      isHero ? 'is-hero-card' : '',
      compact ? 'is-compact-card' : '',
      isCompactExpanded ? 'is-compact-expanded' : ''
    ]">
      <!-- Top: Textarea Section -->
      <div class="textarea-section" :class="{ 'is-hero-textarea': isHero }">
        <textarea ref="textareaRef" v-model="message" :placeholder="placeholderText" class="chat-native-textarea custom-scrollbar" :class="{ 'is-hero-input': isHero, 'is-compact-input': compact }" :rows="isHero && !compact ? 3 : 1" @input="adjustHeight" @paste="handlePaste" @keydown.enter.exact.prevent="handleSend" @keydown.enter.shift="handleNewline" @focus="isFocused = true" @blur="isFocused = false" :disabled="disabled"></textarea>
      </div>

      <div class="integrated-toolbar" :class="{ 'is-hero-toolbar': isHero, 'is-compact-toolbar': compact }">
        <div class="flex items-center gap-1.5 min-w-0">
          <button @click="triggerUpload" class="toolbar-icon-btn" :disabled="disabled || assets.length >= 5" title="上传图片或 PDF">
            <el-icon class="text-base">
              <Plus />
            </el-icon>
          </button>

          <!-- Modern Minimalist Model Selector (ChatGPT-4o Style) -->
          <button
            type="button"
            @click="openFullScreenSquare"
            class="integrated-model-pill group cursor-pointer transition-all duration-150 hover:bg-slate-100/90 text-slate-700 hover:text-slate-900 rounded-lg flex items-center gap-1.5 px-2 py-1 select-none active:scale-[0.98]"
            title="点击切换模型（打开全景模型广场）"
          >
            <div class="w-4 h-4 flex items-center justify-center shrink-0">
              <img v-if="currentModelTheme.isLogo" :src="currentModelTheme.logoSrc" class="w-3.5 h-3.5 object-contain" alt="Logo" />
              <el-icon v-else class="text-xs text-slate-500 group-hover:text-slate-800 transition-colors">
                <component :is="currentModelTheme.icon" class="w-3.5 h-3.5" />
              </el-icon>
            </div>
            <span class="truncate font-semibold max-w-[160px] sm:max-w-[220px] text-xs text-slate-700 group-hover:text-slate-900 tracking-tight">{{ formatModelDisplayName(selectedModel) || modelLabel }}</span>
            <el-icon class="text-[10px] text-slate-400 group-hover:text-slate-600 transition-transform">
              <ArrowDown />
            </el-icon>
          </button>

          <!-- Art Settings Trigger (Only in Art Mode) -->
          <el-popover v-if="currentMode === 'image'" placement="top-start" :width="360" trigger="click" popper-class="art-settings-popper">
            <template #reference>
              <button class="toolbar-pill-btn text-purple-600 bg-purple-50 hover:bg-purple-100/80 border border-purple-200/80" title="绘画高级参数">
                <el-icon class="text-xs">
                  <Operation />
                </el-icon>
                <span>参数设置</span>
                <span v-if="artOptions.referenceImage" class="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
              </button>
            </template>
            <div class="p-2.5 space-y-3.5 text-xs select-none max-h-[460px] overflow-y-auto custom-scrollbar">
              <!-- Header -->
              <div class="flex items-center justify-between pb-2 border-b border-slate-100 font-bold text-slate-800">
                <div class="flex items-center gap-1.5">
                  <el-icon class="text-purple-600 text-sm">
                    <Brush />
                  </el-icon>
                  <span class="text-xs font-bold text-slate-800">AI 艺术创作控制台</span>
                </div>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-mono font-medium">Kolors Pro</span>
              </div>

              <!-- 1. 分辨率与画幅比例 -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="text-[11px] font-semibold text-slate-600">画幅比例 & 分辨率</label>
                  <span class="text-[10px] font-mono text-purple-600 font-bold">{{ artOptions.size }}</span>
                </div>
                <div class="grid grid-cols-5 gap-1.5">
                  <button v-for="preset in sizePresets" :key="preset.value" type="button" @click="artOptions.size = preset.value" class="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border text-center transition-all cursor-pointer" :class="artOptions.size === preset.value ? 'bg-purple-50 border-purple-400 text-purple-700 font-bold shadow-2xs' : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'">
                    <span class="text-[11px] font-bold">{{ preset.label }}</span>
                    <span class="text-[9px] text-slate-400 mt-0.5 scale-90">{{ preset.name }}</span>
                  </button>
                </div>
              </div>

              <!-- 2. 参考底图 (垫图 / 图生图) -->
              <div>
                <label class="text-[11px] font-semibold text-slate-600 block mb-1.5">垫图参考 (图生图构图引导)</label>
                <input ref="refImageInput" type="file" accept="image/*" class="hidden" @change="onRefImageChange" />

                <!-- If image uploaded: Show Preview -->
                <div v-if="artOptions.referenceImage" class="relative flex items-center gap-2.5 p-2 bg-purple-50/60 border border-purple-200 rounded-lg">
                  <img :src="artOptions.referenceImage" class="w-12 h-12 rounded object-cover border border-purple-200 shadow-2xs shrink-0" alt="Ref Image" />
                  <div class="flex-1 min-w-0">
                    <div class="text-[11px] font-bold text-slate-700 truncate">已载入垫图底稿</div>
                    <div class="text-[10px] text-slate-400 mt-0.5">AI 将基于此图的色彩构图生成</div>
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <button type="button" @click="triggerRefImageUpload" class="px-2 py-1 bg-white border border-slate-200 text-[10px] text-slate-600 rounded hover:text-purple-600 cursor-pointer">替换</button>
                    <button type="button" @click="removeRefImage" class="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer" title="移除"><el-icon>
                        <Close />
                      </el-icon></button>
                  </div>
                </div>

                <!-- If no image: Upload Dropzone -->
                <button v-else type="button" @click="triggerRefImageUpload" class="w-full py-2 px-3 border border-dashed border-slate-300 hover:border-purple-400 rounded-lg bg-slate-50/60 hover:bg-purple-50/40 text-slate-500 hover:text-purple-600 flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                  <el-icon class="text-xs">
                    <Plus />
                  </el-icon>
                  <span class="text-[11px] font-medium">点击上传参考垫图 (支持 JPG/PNG)</span>
                </button>
              </div>

              <!-- 3. 画风快捷滤镜 -->
              <div>
                <label class="text-[11px] font-semibold text-slate-600 block mb-1.5">画风滤镜（点击快捷注入提示词）</label>
                <div class="flex flex-wrap gap-1.5">
                  <button v-for="style in stylePresets" :key="style.label" type="button" @click="applyStyle(style.prompt)" class="px-2 py-0.5 rounded bg-slate-100 hover:bg-purple-100/80 text-slate-600 hover:text-purple-700 border border-slate-200/70 text-[10.5px] transition-colors cursor-pointer">
                    + {{ style.label }}
                  </button>
                </div>
              </div>

              <!-- 4. 采样步数 & 引导系数 (CFG) -->
              <div class="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <div class="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>推理步数</span>
                    <span class="font-mono text-purple-600 font-bold">{{ artOptions.steps }}</span>
                  </div>
                  <el-slider v-model="artOptions.steps" :min="15" :max="50" :step="1" size="small" />
                </div>
                <div>
                  <div class="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>提示词引导 (CFG)</span>
                    <span class="font-mono text-purple-600 font-bold">{{ artOptions.guidance_scale }}</span>
                  </div>
                  <el-slider v-model="artOptions.guidance_scale" :min="3" :max="15" :step="0.5" size="small" />
                </div>
              </div>

              <!-- 5. 生成张数与随机种子 -->
              <div class="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label class="text-[11px] font-semibold text-slate-600 block mb-1">生成张数</label>
                  <el-radio-group v-model="artOptions.batch_size" size="small">
                    <el-radio-button :value="1">1 张</el-radio-button>
                    <el-radio-button :value="2">2 张</el-radio-button>
                    <el-radio-button :value="4">4 张</el-radio-button>
                  </el-radio-group>
                </div>
                <div class="flex-1 max-w-[120px]">
                  <label class="text-[11px] font-semibold text-slate-600 block mb-1">固定种子</label>
                  <el-input v-model="artOptions.seed" placeholder="随机" size="small" clearable />
                </div>
              </div>

              <!-- 6. 负向提示词 -->
              <div class="pt-1 border-t border-slate-100">
                <div class="flex items-center justify-between mb-1">
                  <label class="text-[11px] font-semibold text-slate-600">反向提示词 (过滤不良元素)</label>
                  <button type="button" @click="fillCommonNegative" class="text-[10px] text-purple-600 hover:underline cursor-pointer">+ 填入常用过滤</button>
                </div>
                <el-input v-model="artOptions.negative_prompt" type="textarea" :rows="2" placeholder="如：模糊, 畸变, 多余手指, 水印, 破损..." size="small" />
              </div>
            </div>
          </el-popover>

          <!-- Attachment capability warning -->
          <div v-if="assets.length > 0 && !isVLM" class="vlm-warning-badge">
            <el-icon>
              <Warning />
            </el-icon>
            <span class="hidden sm:inline">当前模型不支持图片识别</span>
            <button @click="switchToVisionModel" class="underline font-bold">切换视觉模型</button>
          </div>
          <div v-else-if="hasPdfAsset" class="vlm-warning-badge">
            <el-icon>
              <Warning />
            </el-icon>
            <span class="hidden sm:inline">PDF 需转为图片后识别</span>
          </div>
        </div>

        <!-- Right Group: Guide + Send/Stop -->
        <div class="flex items-center gap-1.5 shrink-0 ml-auto pl-1">
          <!-- Magic Prompt Enhancer / Optimizer Button -->
          <button 
            type="button"
            @click="handleOptimizePrompt" 
            :disabled="disabled || isOptimizingPrompt"
            class="toolbar-icon-btn shrink-0 relative transition-all duration-200" 
            :class="{ 
              'text-indigo-600 bg-indigo-50 hover:bg-indigo-100/80 shadow-2xs': message.trim().length > 0,
              'animate-pulse text-indigo-500': isOptimizingPrompt 
            }"
            :title="isOptimizingPrompt ? 'AI 正在润色优化提示词...' : (message.trim().length > 0 ? '一键 AI 智能润色优化提示词' : 'AI 提示词润色优化（输入文字后点击）')"
          >
            <el-icon class="text-base" :class="{ 'animate-spin': isOptimizingPrompt }">
              <MagicStick />
            </el-icon>
          </button>

          <!-- Stop or Send Button -->
          <button v-if="disabled" @click="$emit('abort')" class="send-action-btn is-stop shrink-0" title="停止生成 (Stop)">
            <div class="w-2.5 h-2.5 bg-white rounded-xs"></div>
          </button>

          <button v-else @click="handleSend" :disabled="!isValidInput" :class="[
            'send-action-btn shrink-0',
            isValidInput ? 'is-active' : 'is-disabled'
          ]" title="发送消息 (Enter)">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Hidden Input for file upload -->
    <input type="file" ref="fileInput" class="hidden" multiple accept="image/*,audio/*,video/*,application/pdf" @change="onFileChange" />

    <!-- Help Drawer -->
    <el-drawer v-model="showPromptHelp" title="多模态提示词指南" direction="rtl" size="360px" class="help-drawer">
      <div class="p-4 space-y-6 h-full overflow-y-auto pb-16">
        <section>
          <h4 class="flex items-center gap-1.5 font-bold text-slate-800 mb-2 text-sm">
            <el-icon class="text-blue-500">
              <MagicStick />
            </el-icon> OCR 文档识别技巧
          </h4>
          <p class="text-xs text-slate-500 mb-3 leading-relaxed">搭配以下提示词获得最佳结构化提取效果：</p>
          <div class="grid grid-cols-2 gap-2">
            <button @click="appendPrompt('<image>\n<|grounding|>Convert the document to markdown.')" class="prompt-chip">转 Markdown</button>
            <button @click="appendPrompt('<image>\nOCR this image.')" class="prompt-chip">通用识别</button>
            <button @click="appendPrompt('<image>\nParse the figure.')" class="prompt-chip">解析图表</button>
            <button @click="appendPrompt('<image>\nFree OCR.')" class="prompt-chip">自由提取</button>
          </div>
        </section>

        <section>
          <h4 class="flex items-center gap-1.5 font-bold text-slate-800 mb-2 text-sm">
            <el-icon class="text-indigo-500">
              <VideoPlay />
            </el-icon> 影音多模态
          </h4>
          <ul class="space-y-1.5 text-xs text-slate-600">
            <li class="flex items-center gap-2">
              <div class="w-1 h-1 bg-indigo-500 rounded-full"></div> 支持 30s 内的视频分析
            </li>
            <li class="flex items-center gap-2">
              <div class="w-1 h-1 bg-indigo-500 rounded-full"></div> 支持音频转录与内容总结
            </li>
            <li class="flex items-center gap-2">
              <div class="w-1 h-1 bg-indigo-500 rounded-full"></div> 多图对比与视觉细节问答
            </li>
          </ul>
        </section>

        <section>
          <h4 class="flex items-center gap-1.5 font-bold text-slate-800 mb-2 text-sm">
            <el-icon class="text-slate-800">
              <Brush />
            </el-icon> 艺术创作示例
          </h4>
          <div class="text-xs bg-slate-50 p-3 rounded border border-slate-200 text-slate-600 leading-relaxed">
            "宁静的海滩上，夕阳西下，天空呈现出橙红色，海浪轻轻拍打着沙滩，写实风格，8k。"
          </div>
        </section>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, nextTick, markRaw, shallowRef, onMounted, onUnmounted } from 'vue'
import {
  Position, Operation, Plus, Close, Cpu, Mic, VideoPlay, MagicStick, Brush, Warning, ArrowDown,
  Aim, Lightning, Document, Picture, Check, Search, Refresh, Grid, ArrowRight
} from '@element-plus/icons-vue'
import deepseekLogo from '@/assets/deepseeklogo.svg'
import { useChatStore, MessageAsset } from '@/stores/chat'
import { useConfigStore } from '@/stores/config'
import { ModelType, isVLMModel, aiService } from '@/services/aiService'
import { imageService } from "@/services/imageService"
import { openRouterService, BUILTIN_OPENROUTER_MODELS } from '@/services/openrouterService'
import { ElMessage } from 'element-plus'

import {
  OFFICIAL_SILICON_MODELS,
  groupModelsByCategory,
  SiliconModelItem,
  DEFAULT_MODEL_GROUPS,
  siliconModelsService,
  UserAccountInfo,
  formatModelDisplayName
} from '@/services/modelsService'

const props = withDefaults(defineProps<{
  disabled?: boolean;
  isHero?: boolean;
  compact?: boolean;
  dropdownPlacement?: 'bottom-start' | 'top-start' | 'bottom-end' | 'top-end';
}>(), {
  disabled: false,
  isHero: false,
  compact: false,
  dropdownPlacement: 'top-start'
});

const emit = defineEmits<{
  send: [message: string, mode?: 'chat' | 'image', options?: any];
  'model-change': [model: ModelType];
  'open-model-square': [];
  abort: [];
}>();

const chatStore = useChatStore()
const message = ref('')
const isFocused = ref(false)
const showPromptHelp = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const modelDropdownRef = ref<any>(null)
const userAccount = ref<UserAccountInfo | null>(null)

// Assets state
const assets = ref<MessageAsset[]>([])
const hasPdfAsset = computed(() => assets.value.some(asset => asset.type === 'pdf'))
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024

// Art settings
const artOptions = reactive({
  size: '1024x1024',
  batch_size: 1,
  negative_prompt: '',
  seed: '',
  guidance_scale: 7.5,
  steps: 25,
  referenceImage: ''
})

const sizePresets = [
  { label: '1:1', name: '正方头像', value: '1024x1024' },
  { label: '3:4', name: '竖屏人像', value: '768x1024' },
  { label: '9:16', name: '手机壁纸', value: '720x1280' },
  { label: '4:3', name: '经典风光', value: '1024x768' },
  { label: '16:9', name: '超宽桌面', value: '1536x864' }
]

const stylePresets = [
  { label: '赛博朋克', prompt: ', 赛博朋克风格, 霓虹灯光, 未来都市, 极致细节, 8K超高清' },
  { label: '8K写实摄影', prompt: ', 8k resolution, 真实摄影质感, 电影级光影, 浅景深, 细腻皮肤纹理' },
  { label: '二次元日漫', prompt: ', 二次元动漫风格, 新海诚画风, 绚丽天空, 明亮光影, 绝美插画' },
  { label: '新中式水墨', prompt: ', 新中式唯美水墨风, 烟雨朦胧, 宣纸留白意境, 大师杰作' },
  { label: '3D泡泡玛特', prompt: ', 3D Pop Mart 盲盒手办风格, 粘土材质, Q版可爱公仔, 柔和演播室打光' },
  { label: '奇幻复古插画', prompt: ', 经典童话复古绘本插画, 梦幻浪漫氛围, 细腻手绘笔触' }
]

const refImageInput = ref<HTMLInputElement | null>(null)

const triggerRefImageUpload = () => {
  refImageInput.value?.click()
}

const onRefImageChange = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('仅支持上传图片格式作为垫图参考')
    return
  }
  try {
    const base64 = await imageService.fileToBase64(file)
    artOptions.referenceImage = base64
    ElMessage.success('已载入参考垫图')
  } catch {
    ElMessage.error('读取参考图失败')
  }
  if (refImageInput.value) refImageInput.value.value = ''
}

const removeRefImage = () => {
  artOptions.referenceImage = ''
}

const applyStyle = (stylePrompt: string) => {
  if (!message.value.includes(stylePrompt.trim())) {
    message.value = (message.value.trim() ? message.value.trim() : '精美艺术画面') + stylePrompt
    nextTick(() => adjustHeight())
    ElMessage.success('已注入画风提示词')
  }
}

const fillCommonNegative = () => {
  const common = '低画质, 模糊, 畸变, 多余肢体, 多余手指, 破损, 水印, 签名, 杂色'
  if (!artOptions.negative_prompt) {
    artOptions.negative_prompt = common
  } else if (!artOptions.negative_prompt.includes('低画质')) {
    artOptions.negative_prompt += ', ' + common
  }
  ElMessage.success('已注入常用负向过滤词')
}

const configStore = useConfigStore()
const selectedModel = ref<ModelType>(chatStore.currentModel || (configStore.config.defaultModel as ModelType) || ModelType.R1_Distill_7B)

// 模型库与动态在线加载
const modelSearchQuery = ref('')
const rawModels = shallowRef<SiliconModelItem[]>([...OFFICIAL_SILICON_MODELS, ...BUILTIN_OPENROUTER_MODELS])
const isSyncingModels = ref(false)

const syncModels = async (isManual = false) => {
  isSyncingModels.value = true
  try {
    const sfKey = configStore.config.siliconFlowApiKey
    const orKey = configStore.config.openrouterApiKey

    const [sfRes, orRes] = await Promise.allSettled([
      siliconModelsService.fetchLiveModels(sfKey),
      openRouterService.fetchLiveModels(orKey)
    ])

    const allItems: SiliconModelItem[] = []
    if (sfRes.status === 'fulfilled' && sfRes.value.items && sfRes.value.items.length > 0) {
      allItems.push(...sfRes.value.items)
    } else {
      allItems.push(...OFFICIAL_SILICON_MODELS)
    }

    if (orRes.status === 'fulfilled' && orRes.value.items && orRes.value.items.length > 0) {
      allItems.push(...orRes.value.items)
    } else {
      allItems.push(...BUILTIN_OPENROUTER_MODELS)
    }

    const seen = new Set<string>()
    rawModels.value = allItems.filter(m => {
      if (seen.has(m.id)) return false
      seen.add(m.id)
      return true
    })

    if (isManual) {
      ElMessage.success(`多平台云端同步成功：已加载 ${rawModels.value.length} 个模型端点`)
    }
  } catch (e: any) {
    if (isManual) {
      ElMessage.error(`同步异常：${e.message || '网络连接失败'}`)
    }
  } finally {
    isSyncingModels.value = false
  }
}

// 挂载时尝试拉取硅基流动账户信息与最新模型
const initSiliconAccount = async () => {
  const info = await siliconModelsService.fetchUserBalance()
  if (info) {
    userAccount.value = info
  }
  syncModels(false)
}
initSiliconAccount()

const selectedCategoryTab = ref('all')

const categoryTabs = [
  { label: '全部', value: 'all' },
  { label: 'DeepSeek', value: 'DeepSeek 官方系列' },
  { label: '通义千问', value: 'Qwen 通义千问全系列' },
  { label: '多模态', value: '多模态与视觉识别' },
  { label: '生图工坊', value: '图像生成工坊' },
  { label: 'Llama 3', value: 'Meta Llama 全系列' },
  { label: '国产名模', value: '智谱 & 零一 & 国产名模' }
]

const getCategoryCount = (categoryValue: string) => {
  if (categoryValue === 'all') return rawModels.value.length
  return rawModels.value.filter(m => m.category === categoryValue).length
}

const filteredModelGroups = computed(() => {
  const query = modelSearchQuery.value.trim().toLowerCase()
  let list = rawModels.value

  if (selectedCategoryTab.value !== 'all') {
    list = list.filter(m => m.category === selectedCategoryTab.value)
  }

  if (query) {
    list = list.filter(m =>
      m.id.toLowerCase().includes(query) ||
      m.label.toLowerCase().includes(query) ||
      formatModelDisplayName(m.id).toLowerCase().includes(query) ||
      m.desc.toLowerCase().includes(query) ||
      m.category.toLowerCase().includes(query)
    )
  }
  return groupModelsByCategory(list)
})

const allModels = computed(() => rawModels.value)

const iconMap: Record<string, any> = {
  Cpu: markRaw(Cpu),
  Aim: markRaw(Aim),
  Lightning: markRaw(Lightning),
  Document: markRaw(Document),
  VideoPlay: markRaw(VideoPlay),
  Picture: markRaw(Picture),
  Brush: markRaw(Brush)
}

const getIconComponent = (name?: string) => {
  return iconMap[name || 'Cpu'] || iconMap.Cpu
}

const currentModelTheme = computed(() => {
  const model = allModels.value.find(m => m.value === selectedModel.value)
  if (!model) {
    return {
      isLogo: false,
      logoSrc: '',
      icon: iconMap.Cpu,
      iconColor: 'text-blue-600',
      pillClass: 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700',
      tag: '',
      tagClass: ''
    }
  }
  return {
    isLogo: !!(model as any).isLogo,
    logoSrc: (model as any).logoSrc || '',
    icon: getIconComponent(model.iconName),
    iconColor: model.value === ModelType.ART
      ? 'text-purple-600'
      : (model.value === ModelType.Reasoner
        ? 'text-indigo-600'
        : (model.value === ModelType.OCR ? 'text-cyan-600' : 'text-blue-600')),
    pillClass: model.value === ModelType.ART
      ? 'bg-purple-50/70 border-purple-200 hover:bg-purple-100/70 text-purple-800 font-bold shadow-2xs'
      : (model.value === ModelType.Reasoner
        ? 'bg-indigo-50/70 border-indigo-200 hover:bg-indigo-100/70 text-indigo-800 font-bold shadow-2xs'
        : (model.value === ModelType.OCR
          ? 'bg-cyan-50/70 border-cyan-200 hover:bg-cyan-100/70 text-cyan-800 font-bold shadow-2xs'
          : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 text-slate-700 font-medium')),
    tag: model.tag,
    tagClass: model.tagBadgeClass
  }
})

const currentMode = computed<'chat' | 'image'>(() => {
  return selectedModel.value === ModelType.ART ? 'image' : 'chat'
})

const modelLabel = computed(() => {
  const model = allModels.value.find(m => m.value === selectedModel.value)
  return model ? model.label : '解析中...'
})

const isVLM = computed(() => isVLMModel(selectedModel.value))

const inspirationPrompts = [
  '请为我撰写一篇关于【产品/主题】的小红书爆款种草文案...',
  '用 Python 编写一个支持自动重试与并发限制的网络爬虫脚本...',
  '对比 DeepSeek-V3 与主流大模型的底层架构差异与技术亮点...',
  '帮我制定一份为期 4 周的 Python 数据分析零基础学习计划...',
  '请分析这篇商业报告的核心论点，并输出一份结构化执行摘要...',
  '作为资深前端架构师，请帮我评审这段 Vue3 + TypeScript 代码...',
  '为科技初创公司设计一个富有未来感与科技感的品牌命名方案...'
]

const currentInspirationIndex = ref(0)
const rotatingPlaceholder = ref(inspirationPrompts[0])
let rotationTimer: any = null

const startPlaceholderRotation = () => {
  if (rotationTimer) clearInterval(rotationTimer)
  rotationTimer = setInterval(() => {
    if (!message.value && !isFocused.value) {
      currentInspirationIndex.value = (currentInspirationIndex.value + 1) % inspirationPrompts.length
      rotatingPlaceholder.value = inspirationPrompts[currentInspirationIndex.value]
    }
  }, 4500)
}

onMounted(() => {
  startPlaceholderRotation()
})

onUnmounted(() => {
  if (rotationTimer) clearInterval(rotationTimer)
})

const placeholderText = computed(() => {
  if (currentMode.value === 'image') return '描述你想要创作的画面（如：赛博朋克风格的未来城市，夜雨霓虹）...'
  if (selectedModel.value === ModelType.OCR) return '上传文档或截图后，输入识别指令（按 Enter 发送）...'
  if (props.isHero) return `问问：${rotatingPlaceholder.value}`
  return '输入消息内容（按 Enter 发送，Shift + Enter 换行）...'
})

const isValidInput = computed(() => {
  return message.value.trim().length > 0 || assets.value.length > 0
})

const isCompactExpanded = computed(() => {
  return props.compact && (message.value.length > 100 || message.value.includes('\n'))
})

const handleModelChange = (model: ModelType | string) => {
  selectedModel.value = model as ModelType
  emit('model-change', model as ModelType)

  // 1. 关闭下拉弹窗
  modelDropdownRef.value?.handleClose?.()

  // 2. 弹出明确的切换成功提示
  const found = allModels.value.find(m => m.value === model || m.id === model)
  const name = found ? found.label : model
  ElMessage.success({
    message: `已切换至模型：${name}`,
    duration: 2000,
    showClose: true
  })
}

const openFullScreenSquare = () => {
  modelDropdownRef.value?.handleClose?.()
  emit('open-model-square')
}

const triggerUpload = () => {
  fileInput.value?.click()
}

const onFileChange = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files) return

  await appendFiles(Array.from(files))

  if (fileInput.value) fileInput.value.value = ''
}

const appendFiles = async (files: File[]) => {
  for (const file of files) {
    if (assets.value.length >= 5) {
      ElMessage.warning('最多同时上传 5 个附件')
      break
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      ElMessage.warning(`${file.name} 超过 8MB 限制，请压缩后再上传`)
      continue
    }

    let type: MessageAsset['type'] = 'image'
    if (file.type.startsWith('image/')) type = 'image'
    else if (file.type === 'application/pdf') type = 'pdf'
    else if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
      ElMessage.warning('当前聊天通道暂未接入音频或视频解析，请上传图片或 PDF。')
      continue
    }
    else {
      ElMessage.warning(`受限格式: ${file.name}`)
      continue
    }

    try {
      const base64 = await imageService.fileToBase64(file)
      assets.value.push({
        type,
        url: base64,
        name: file.name,
        size: file.size
      })
      if (type === 'pdf') {
        ElMessage.warning('PDF 已添加为附件预览；当前聊天通道不会直接解析 PDF，请上传截图或使用批处理中心。')
      }
    } catch (err) {
      ElMessage.error('读取文件失败')
    }
  }
}

const handlePaste = (event: ClipboardEvent) => {
  const imageFiles = Array.from(event.clipboardData?.items || [])
    .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
    .map(item => item.getAsFile())
    .filter((file): file is File => Boolean(file))

  if (imageFiles.length === 0) return

  event.preventDefault()
  void appendFiles(imageFiles)
}

const removeAsset = (index: number) => {
  assets.value.splice(index, 1)
}

const openAsset = (url: string) => {
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}

const adjustHeight = () => {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  const maxHeight = props.isHero ? 240 : 200
  el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
}

const handleSend = () => {
  if (props.disabled || !isValidInput.value) return

  const text = message.value.trim()
  const opts: any = {}

  if (assets.value.length > 0) {
    opts.assets = [...assets.value]
  }

  if (currentMode.value === 'image') {
    opts.image_size = artOptions.size
    opts.size = artOptions.size
    opts.batch_size = artOptions.batch_size
    opts.num_inference_steps = artOptions.steps
    opts.steps = artOptions.steps
    opts.guidance_scale = artOptions.guidance_scale
    opts.negative_prompt = artOptions.negative_prompt
    opts.seed = artOptions.seed ? parseInt(artOptions.seed) : undefined
    opts.image = artOptions.referenceImage || undefined
  }

  emit('send', text, currentMode.value, opts)

  message.value = ''
  assets.value = []
  nextTick(() => adjustHeight())
}

const handleNewline = (e: KeyboardEvent) => {
  if (props.disabled) e.preventDefault()
  nextTick(() => adjustHeight())
}

const isOptimizingPrompt = ref(false)
const originalPromptBeforeOpt = ref<string | null>(null)

const handleOptimizePrompt = async () => {
  const text = message.value.trim()
  if (!text) {
    // 空白状态下点击魔法棒：智能填入当前轮播灵感提示词并自动聚焦
    const samplePrompt = rotatingPlaceholder.value.replace(/\.\.\.$/, '')
    message.value = samplePrompt
    nextTick(() => {
      adjustHeight()
      textareaRef.value?.focus()
    })
    ElMessage.success({
      message: '已为您填入热门灵感提示词，可直接发送或继续修改 ✨',
      duration: 2500
    })
    return
  }

  if (isOptimizingPrompt.value) return
  isOptimizingPrompt.value = true
  originalPromptBeforeOpt.value = message.value

  try {
    const result = await aiService.optimizePrompt(text, { model: selectedModel.value })
    if (result && result !== text) {
      message.value = result
      nextTick(() => {
        adjustHeight()
        textareaRef.value?.focus()
      })
      ElMessage.success('提示词已完成智能结构化优化 ✨')
    } else {
      ElMessage.info('提示词未发生变化或已足够精炼')
    }
  } catch (e: any) {
    ElMessage.error(`提示词优化失败：${e.message || '网络连接或模型响应异常'}`)
  } finally {
    isOptimizingPrompt.value = false
  }
}

const switchToVisionModel = async () => {
  if (!rawModels.value.some(model => model.isLive)) {
    await syncModels(false)
  }

  const visionModel = rawModels.value.find(model => model.supportsImage || isVLMModel(model.value))
  if (!visionModel) {
    ElMessage.error('当前账户没有可用的视觉模型。请同步模型列表或在服务平台开通视觉模型后重试。')
    return
  }
  handleModelChange(visionModel.value as ModelType)
}

watch(() => [chatStore.currentModel, chatStore.activeSessionId, chatStore.activeSession?.model], () => {
  const model = chatStore.currentModel || chatStore.activeSession?.model || (configStore.config.defaultModel as ModelType) || ModelType.R1_Distill_7B
  if (model && selectedModel.value !== model) {
    selectedModel.value = model as ModelType
  }
}, { immediate: true })

defineExpose({
  setMessage: (val: string) => {
    message.value = val
    nextTick(() => adjustHeight())
  },
  focus: () => {
    textareaRef.value?.focus()
  },
  clear: () => {
    message.value = ''
    assets.value = []
    nextTick(() => adjustHeight())
  }
})
</script>

<style scoped>
.chat-input-container {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.chat-input-container.is-compact {
  max-width: 760px;
}

/* 附件浮层 */
.asset-previews-bar {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 8px;
  overflow-x: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.asset-preview-card {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 8px;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  flex-shrink: 0;
}

.asset-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.asset-icon-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #4f46e5;
}

.asset-type-badge {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(15, 23, 42, 0.7);
  color: white;
  font-size: 7.5px;
  padding: 1px 0;
  text-align: center;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.remove-asset-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  opacity: 0;
  transition: opacity 0.15s;
}

.asset-preview-card:hover .remove-asset-btn {
  opacity: 1;
}

/* 一体化高级输入卡片 */
.unified-input-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 8px 30px -6px rgba(15, 23, 42, 0.07);
  padding: 10px 14px 10px 14px;
  display: flex;
  flex-direction: column;
}

.unified-input-card.is-hero-card {
  padding: 14px 18px 12px 18px;
  border-radius: 18px;
  box-shadow: 0 16px 40px -10px rgba(15, 23, 42, 0.08), 0 0 1px 1px rgba(15, 23, 42, 0.03);
  border: 1px solid rgba(226, 232, 240, 0.95);
}

.unified-input-card.is-focused {
  border-color: #3b82f6;
  box-shadow: 0 12px 35px -8px rgba(37, 99, 235, 0.12), 0 0 0 3px rgba(59, 130, 246, 0.08);
}

.unified-input-card.is-hero-card.is-focused {
  border-color: #3b82f6;
  box-shadow: 0 20px 50px -10px rgba(37, 99, 235, 0.14), 0 0 0 3.5px rgba(59, 130, 246, 0.09);
}

/* Home surface: a single-line command bar keeps the first viewport quiet. */
.unified-input-card.is-compact-card {
  position: relative;
  min-height: 52px;
  padding: 6px 10px 6px 46px;
  border-radius: 999px;
  box-shadow: 0 12px 34px -18px rgba(15, 23, 42, 0.28);
  align-items: center;
  flex-direction: row;
  gap: 8px;
}

.unified-input-card.is-compact-card.is-focused {
  box-shadow: 0 16px 38px -18px rgba(37, 99, 235, 0.28), 0 0 0 3px rgba(59, 130, 246, 0.08);
}

.unified-input-card.is-art-mode {
  border-color: #c084fc;
}

.unified-input-card.is-art-mode.is-focused {
  border-color: #a855f7;
  box-shadow: 0 12px 35px -8px rgba(168, 85, 247, 0.12), 0 0 0 3px rgba(168, 85, 247, 0.08);
}

/* 输入框 */
.textarea-section {
  width: 100%;
  padding: 2px 2px 6px 2px;
}

.is-compact-card .textarea-section {
  flex: 1;
  min-width: 0;
  padding: 0;
  display: flex;
  align-items: center;
}

.chat-native-textarea {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-size: 15px;
  line-height: 1.6;
  color: #0f172a;
  min-height: 32px;
  max-height: 200px;
  font-family: inherit;
}

.chat-native-textarea.is-hero-input {
  min-height: 56px;
  max-height: 240px;
  font-size: 15.5px;
  line-height: 1.65;
}

.chat-native-textarea.is-compact-input {
  height: 32px;
  min-height: 32px;
  max-height: 420px;
  padding: 4px 0;
  font-size: 15px;
  line-height: 24px;
}

.chat-native-textarea::placeholder {
  color: #94a3b8;
}

/* 一体化工具栏 */
.integrated-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 4px;
}

.integrated-toolbar.is-hero-toolbar {
  padding-top: 8px;
  margin-top: 4px;
  border-top: 1px solid rgba(241, 245, 249, 0.9);
}

.integrated-toolbar.is-compact-toolbar {
  flex: 0 0 auto;
  gap: 4px;
  padding: 0;
  margin: 0;
  border-top: 0;
}

.is-compact-toolbar .toolbar-icon-btn {
  width: 32px;
  height: 32px;
}

.is-compact-card .integrated-toolbar > div:first-child {
  min-width: 0;
}

.is-compact-card .integrated-toolbar > div:first-child > .toolbar-icon-btn:first-child {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 30px;
  height: 30px;
  z-index: 1;
}

.is-compact-toolbar .integrated-model-pill {
  max-width: 190px;
  padding: 4px 6px;
  background: transparent;
}

.is-compact-toolbar .toolbar-pill-btn {
  padding: 5px 7px;
}

.is-compact-card .send-action-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
}

/* Long prompts become a document-like surface with controls docked below. */
.unified-input-card.is-compact-expanded {
  min-height: 0;
  padding: 12px 12px 8px 46px;
  border-radius: 22px;
  align-items: stretch;
  flex-direction: column;
  gap: 4px;
}

.is-compact-expanded .textarea-section {
  width: 100%;
  padding: 0;
  align-items: flex-start;
}

.is-compact-expanded .integrated-toolbar {
  width: 100%;
  min-height: 34px;
  margin-top: 3px;
  justify-content: space-between;
}

.is-compact-expanded .integrated-toolbar > div:first-child > .toolbar-icon-btn:first-child {
  top: auto;
  bottom: 8px;
}

@media (max-width: 640px) {
  .unified-input-card.is-compact-card {
    flex-direction: column !important;
    align-items: stretch !important;
    padding: 10px 12px 8px 12px !important;
    min-height: 84px !important;
    border-radius: 18px !important;
  }

  .unified-input-card.is-compact-card .textarea-section {
    width: 100% !important;
    padding: 0 0 4px 0 !important;
    display: block !important;
  }

  .unified-input-card.is-compact-card .chat-native-textarea {
    width: 100% !important;
    min-height: 36px !important;
    height: auto !important;
    padding: 0 !important;
    font-size: 14.5px !important;
    line-height: 1.5 !important;
  }

  .unified-input-card.is-compact-card .integrated-toolbar {
    width: 100% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    border-top: 1px solid rgba(241, 245, 249, 0.9) !important;
    padding-top: 6px !important;
    margin-top: 2px !important;
  }

  .unified-input-card.is-compact-card .integrated-toolbar > div:first-child > .toolbar-icon-btn:first-child {
    position: static !important;
    width: 30px !important;
    height: 30px !important;
    margin-right: 2px !important;
  }

  .is-compact-toolbar .integrated-model-pill {
    max-width: 210px !important;
    padding: 3px 8px !important;
  }

  .unified-input-card.is-compact-expanded {
    padding: 10px 12px 8px 12px !important;
  }
}

.toolbar-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  background: transparent;
  transition: all 0.15s ease;
  cursor: pointer;
}

.toolbar-icon-btn:hover {
  background: #f1f5f9;
  color: #2563eb;
}

.integrated-model-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  background: transparent;
  border: 0;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;
  max-width: 220px;
}

.integrated-model-pill:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.toolbar-pill-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.vlm-warning-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  font-size: 11px;
  color: #dc2626;
}

/* 发送与停止按钮 */
.send-action-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: pointer;
}

.send-action-btn.is-active {
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.send-action-btn.is-active:hover {
  background: #1d4ed8;
  transform: scale(1.04);
}

.send-action-btn.is-active:active {
  transform: scale(0.96);
}

.send-action-btn.is-disabled {
  background: #f1f5f9;
  color: #cbd5e1;
  cursor: not-allowed;
}

.send-action-btn.is-stop {
  background: #0f172a;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
}

.send-action-btn.is-stop:hover {
  background: #ef4444;
  transform: scale(1.04);
}

.prompt-chip {
  padding: 6px 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  text-align: left;
  color: #475569;
  transition: all 0.15s;
}

.prompt-chip:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #2563eb;
}
</style>
