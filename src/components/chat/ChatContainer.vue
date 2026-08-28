<template>
  <div class="relative flex h-full w-full bg-white overflow-hidden text-slate-800">
    <!-- 移动端侧边栏背景遮罩 -->
    <Transition name="fade">
      <div 
        v-if="isSidebarOpen" 
        class="md:hidden fixed inset-0 bg-slate-900/30 z-30 transition-opacity"
        @click="isSidebarOpen = false"
      ></div>
    </Transition>

    <!-- 侧边栏平滑折叠/展开动画容器 -->
    <div 
      class="sidebar-animated-container shrink-0 z-40 transition-all duration-300 ease-in-out fixed md:relative left-0 top-0 h-full overflow-hidden shadow-xl md:shadow-none"
      :class="isSidebarOpen ? 'w-64 translate-x-0 opacity-100' : 'w-0 -translate-x-full md:translate-x-0 md:w-0 opacity-0 pointer-events-none'"
    >
      <ChatSidebar 
        @open-settings="openSettings"
        @open-model-square="openModelSquare"
        @close-mobile="isSidebarOpen = false"
      />
    </div>

    <!-- 主对话区域 -->
    <div class="flex-1 flex flex-col min-w-0 bg-white relative">
      <!-- 顶部状态栏: 全宽贴边自然布局 -->
      <header class="sticky top-0 z-20 w-full h-12 md:h-13 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 md:px-5 flex items-center justify-between">
        <div class="flex items-center gap-2 min-w-0">
          <!-- 侧边栏切换按钮 -->
          <button 
            @click="toggleSidebar" 
            class="w-8 h-8 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center cursor-pointer" 
            title="展开/收起侧边栏"
          >
            <el-icon class="text-base">
              <component :is="isSidebarOpen ? Fold : Expand" />
            </el-icon>
          </button>

          <!-- 当前标题和模型 -->
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-xs md:text-sm font-bold text-slate-800 tracking-tight truncate max-w-[140px] md:max-w-xs">{{ chatStore.activeSession?.title || '新对话' }}</span>
            <span class="hidden sm:inline-block text-[11px] font-medium text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md shrink-0">
              {{ modelOptions[currentModel] || currentModel }}
            </span>
          </div>
        </div>
 
        <div class="flex items-center gap-1">
          <!-- 清空对话 -->
          <el-tooltip content="清空当前对话" placement="bottom">
            <button 
              @click="showClearConfirm" 
              :disabled="loading" 
              class="w-8 h-8 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500"
            >
              <el-icon class="text-base"><Delete /></el-icon>
            </button>
          </el-tooltip>
        </div>
      </header>

      <!-- 消息列表 -->
      <main class="flex-1 overflow-y-auto w-full pt-4 pb-28 scroll-smooth custom-scrollbar" ref="messagesContainer">
        <div class="max-w-3xl mx-auto px-3 md:px-4 flex flex-col gap-6 text-sm min-h-full">

          <!-- 空状态：全新居中欢迎界面 -->
          <div v-if="messages.length === 0" class="empty-state-wrapper select-none animate-in fade-in zoom-in-95 duration-500 my-auto py-6">
            <!-- Logo & 标题区 -->
            <div class="empty-state-hero text-center mb-6">
              <!-- Logo -->
              <div class="relative mb-4 flex items-center justify-center group cursor-default">
                <div class="relative w-16 h-16 transition-transform duration-300 group-hover:scale-105">
                  <img :src="wenflowLogo" alt="Logo" class="w-full h-full object-contain filter drop-shadow-[0_8px_20px_rgba(79,70,229,0.2)]" />
                </div>
              </div>

              <!-- Title -->
              <h2 class="text-xl md:text-[22px] font-bold tracking-tight text-slate-900 mb-1.5 leading-tight">
                问流 AI <span class="text-slate-300 font-light mx-1">·</span> 智能工作台
              </h2>
              <p class="text-xs text-slate-400 font-normal max-w-sm mx-auto leading-relaxed">
                输入你的问题开始对话，或点击下方热词探索灵感
              </p>
            </div>

            <!-- 灵感热词探索面板 -->
            <QuickStartGrid density="chat" @select="handleStarterClick" />
          </div>


          <!-- 消息气泡 -->
          <MessageBubble 
            v-for="(message, index) in messages" 
            :key="index" 
            :type="message.type" 
            :content="message.content" 
            :reasoning-content="message.reasoning_content" 
            :images="message.images" 
            :assets="message.assets" 
            :progress="message.progress" 
            :usage="message.usage"
            :is-user="message.role === 'user'" 
            :loading="message.loading" 
            :is-last-message="index === messages.length - 1" 
            :is-sharing-mode="isSharingMode"
            :is-selected="selectedShareMessages.has(index)"
            @regenerate="$emit('regenerate', index)"
            @share="initShareMode(index)"
            @toggle-select="toggleShareSelect(index)"
            @continue="$emit('continue', message.content)" 
          />

          <!-- 加载占位 (仅对话模式) -->
          <Transition name="fade">
            <div v-if="loading && (!messages.length || messages[messages.length - 1].role === 'user')" class="flex items-start gap-4">
              <div class="w-8 h-8 rounded border border-slate-200 flex items-center justify-center bg-white shadow-2xs shrink-0">
                <img :src="wenflowLogo" class="w-5 h-5 object-contain animate-pulse" alt="AI Avatar" />
              </div>
              <div class="flex flex-col gap-1 mt-0.5">
                <span class="text-xs font-semibold text-slate-600">正在思考与响应...</span>
                <div class="flex items-center gap-1.5 h-5">
                  <span class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </main>

      <!-- 输入区域 或 分享工具栏 -->
      <footer class="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-white via-white/95 to-transparent pt-8 pb-4 px-3 md:px-4 pointer-events-none">
        <div class="max-w-3xl mx-auto w-full pointer-events-auto">
          
          <ChatInput 
            v-if="!isSharingMode" 
            :disabled="loading" 
            @send="(msg, mode, opts) => $emit('send', msg, mode, opts)" 
            @model-change="handleModelChange($event)" 
            @open-model-square="openModelSquare"
            @abort="$emit('abort')"
          />
          <p v-if="!isSharingMode" class="text-[11px] text-slate-400 text-center mt-2 select-none tracking-tight">
            内容由 AI 模型生成，请仔细甄别，仅供参考
          </p>
          
          <!-- Modern Multi-Select / Share Floating Toolbar -->
          <div v-else class="h-13 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl flex items-center justify-between px-4 shadow-lg animate-in slide-in-from-bottom-2 duration-200">
            <div class="flex items-center gap-3">
              <el-checkbox :model-value="isAllSelected" @change="toggleSelectAll" class="!mr-0">
                <span class="text-xs font-semibold text-slate-700 ml-1.5">全选</span>
              </el-checkbox>
              <div class="w-px h-3.5 bg-slate-200"></div>
              <span class="text-xs text-slate-600">已选中 <span class="text-blue-600 font-bold font-mono">{{ selectedShareMessages.size }}</span> 条对话记录</span>
            </div>
            <div class="flex items-center gap-2">
              <button 
                @click="cancelShareMode" 
                class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors cursor-pointer active:scale-95"
              >
                取消
              </button>
              <button 
                :disabled="selectedShareMessages.size === 0" 
                @click="showShareProcessDialog = true" 
                class="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <el-icon class="text-xs"><CopyDocument /></el-icon>
                <span>复制选中内容</span>
              </button>
            </div>
          </div>

        </div>
      </footer>
    </div>

    <!-- 清空确认弹窗: 极简现代设计 -->
    <el-dialog 
      v-model="showConfirmDialog" 
      width="380px" 
      align-center
      :show-close="false"
      class="wenflow-minimal-dialog"
    >
      <div class="p-6">
        <h3 class="text-base font-bold text-slate-900 tracking-tight">清空当前对话？</h3>
        <p class="text-xs text-slate-500 mt-2 leading-relaxed">
          清空后当前会话的所有历史消息将无法恢复，确定要继续吗？
        </p>

        <div class="flex items-center justify-end gap-2.5 mt-6">
          <button 
            @click="showConfirmDialog = false" 
            class="px-4 py-2 rounded-lg border border-slate-200/90 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer active:scale-95"
          >
            取消
          </button>
          <button 
            @click="handleClear" 
            class="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium shadow-2xs transition-all cursor-pointer active:scale-95"
          >
            确认清空
          </button>
        </div>
      </div>
    </el-dialog>

    <!-- 分享隐私提示弹窗: 极简现代设计 -->
    <el-dialog 
      v-model="showShareProcessDialog" 
      width="400px" 
      align-center
      :show-close="false"
      class="wenflow-minimal-dialog"
    >
      <div class="p-6">
        <h3 class="text-base font-bold text-slate-900 tracking-tight">复制选中内容</h3>
        <p class="text-xs text-slate-500 mt-2 leading-relaxed">
          已选择 {{ selectedShareMessages.size }} 条对话。将整理为纯文本并复制到剪贴板，请确认内容中不包含个人隐私。
        </p>

        <div class="flex items-center justify-end gap-2.5 mt-6">
          <button 
            @click="showShareProcessDialog = false" 
            class="px-4 py-2 rounded-lg border border-slate-200/90 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer active:scale-95"
          >
            取消
          </button>
          <button 
            @click="confirmShare" 
            class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-2xs transition-all cursor-pointer active:scale-95"
          >
            确认复制
          </button>
        </div>
      </div>
    </el-dialog>

    <!-- 统一设置弹窗 (Reusable Modal) -->
    <SettingsModal v-model="showSettingsDialog" />

    <!-- 硅基流动全屏官方模型广场 -->
    <ModelSquareModal ref="modelSquareRef" @select="handleSquareModelSelect" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from "vue";
import { 
  Delete, Expand, Fold, Share,
  Cpu, Lock, Key, TopRight, CircleCheckFilled, WarningFilled, InfoFilled
} from "@element-plus/icons-vue";
import { ModelType } from "@/services/aiService";
import { useChatStore } from "@/stores/chat";
import type { Message } from "@/types/chat";
import type { QuickPrompt } from "@/config/quickPrompts";
import wenflowLogo from "@/assets/images/wenflow.png";
import ChatSidebar from "./ChatSidebar.vue";
import ChatInput from "./ChatInput.vue";
import MessageBubble from "./MessageBubble.vue";
import ModelSquareModal from "../models/ModelSquareModal.vue";
import SettingsModal from "../common/SettingsModal.vue";
import QuickStartGrid from "../common/QuickStartGrid.vue";
import { ElMessage } from "element-plus";
import { siliconModelsService } from "@/services/modelsService";

const props = defineProps<{
  messages: Message[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  send: [message: string, mode?: 'chat' | 'image', options?: any];
  clear: [];
  'model-change': [model: ModelType];
  continue: [prefix: string];
  regenerate: [index: number];
  abort: [];
}>();

const chatStore = useChatStore();

const messagesContainer = ref<HTMLElement | null>(null);
const initialLoad = ref(true);
const showConfirmDialog = ref(false);
const showSettingsDialog = ref(false);
const isSidebarOpen = ref(true);
const modelSquareRef = ref<InstanceType<typeof ModelSquareModal> | null>(null);

const openSettings = () => {
  showSettingsDialog.value = true;
};

const openModelSquare = () => {
  modelSquareRef.value?.open();
};

const handleSquareModelSelect = (modelId: string) => {
  handleModelChange(modelId as any);
};

const modelOptions: Record<string, string> = {
  [ModelType.V3]: "DeepSeek V3",
  [ModelType.R1_Distill_7B]: "R1-Distill-Qwen-7B (免费)",
  [ModelType.R1_Distill_8B]: "R1-Distill-Llama-8B (免费)",
  [ModelType.OCR]: "视觉识别",
  [ModelType.QwenVL]: "Qwen-VL",
  [ModelType.ART]: "AI 艺术绘画",
  [ModelType.Reasoner]: "DeepSeek R1 Reasoner"
};

const currentModel = computed(() => chatStore.currentModel || ModelType.V3);

// --- Share Feature State ---
const isSharingMode = ref(false);
const selectedShareMessages = ref<Set<number>>(new Set());
const showShareProcessDialog = ref(false);

const isAllSelected = computed(() => {
  return props.messages.length > 0 && selectedShareMessages.value.size === props.messages.length;
});

const initShareMode = (initialIndex: number) => {
  isSharingMode.value = true;
  selectedShareMessages.value.clear();
  selectedShareMessages.value.add(initialIndex);
};

const toggleShareSelect = (index: number) => {
  if (selectedShareMessages.value.has(index)) {
    selectedShareMessages.value.delete(index);
  } else {
    selectedShareMessages.value.add(index);
  }
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedShareMessages.value.clear();
  } else {
    props.messages.forEach((_, i) => selectedShareMessages.value.add(i));
  }
};

const cancelShareMode = () => {
  isSharingMode.value = false;
  selectedShareMessages.value.clear();
};

const confirmShare = async () => {
  const selected = [...selectedShareMessages.value]
    .sort((a, b) => a - b)
    .map(index => props.messages[index])
    .filter(Boolean)

  const text = selected.map(message => {
    const speaker = message.role === 'user' ? '【用户】' : '【问流 AI】'
    return `${speaker}\n${message.content || (message.images?.length ? '[图片消息]' : '')}`
  }).join('\n\n') + '\n\n---\n*本内容由 问流 AI (WenFlow) 智能大模型辅助生成，请注意甄别，仅供参考*'

  try {
    await navigator.clipboard.writeText(text)
    showShareProcessDialog.value = false
    cancelShareMode()
    ElMessage.success('已复制选中的对话内容')
  } catch {
    ElMessage.error('复制失败，请检查浏览器剪贴板权限')
  }
};

const handleStarterClick = (quickStart: QuickPrompt) => {
  // 保持用户当前已选中的模型，不强制覆盖为模板预设模型
  emit('send', quickStart.prompt, quickStart.mode, {})
}

const handleModelChange = (model: ModelType) => {
  emit('model-change', model);
};

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    const container = messagesContainer.value;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: initialLoad.value ? "auto" : "smooth",
    });
  }
};

watch(() => props.messages, () => scrollToBottom(), { deep: true, immediate: true });
watch(() => chatStore.activeSessionId, () => {
  initialLoad.value = true;
  scrollToBottom();
  nextTick(() => { initialLoad.value = false; });
});

onMounted(() => {
  scrollToBottom();
  nextTick(() => { initialLoad.value = false; });
  if (window.innerWidth < 768) {
    isSidebarOpen.value = false;
  }
});

const showClearConfirm = () => { showConfirmDialog.value = true; };
const handleClear = () => {
  showConfirmDialog.value = false;
  emit("clear");
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.sidebar-animated-container {
  will-change: width, transform, opacity;
}

/* 空态欢迎界面 */
.empty-state-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 220px);
  padding: 0 16px;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
}

.empty-state-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 100%;
}

</style>
