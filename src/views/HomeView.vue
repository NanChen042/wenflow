<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useChatStore } from "@/stores/chat";
import { ModelType } from "@/services/aiService";
import { 
  Setting, Plus, Clock, Compass, Tickets, Delete, EditPen, Check, Close, ChatDotRound, Search, Fold, Expand
} from "@element-plus/icons-vue";
import wenflowLogo from "@/assets/images/wenflow.png";
import ModelSquareModal from "@/components/models/ModelSquareModal.vue";
import SettingsModal from "@/components/common/SettingsModal.vue";
import ChatInput from "@/components/chat/ChatInput.vue";
import { ElMessageBox } from "element-plus";
import { toast } from "@/utils/toast";

const router = useRouter();
const chatStore = useChatStore();
const chatInputRef = ref<InstanceType<typeof ChatInput> | null>(null);
const modelSquareRef = ref<InstanceType<typeof ModelSquareModal> | null>(null);

// Sidebar Expand / Collapse State (Default: true on desktop, persisted in localStorage)
const isSidebarExpanded = ref(
  localStorage.getItem('wenflow_home_sidebar_expanded') !== null
    ? localStorage.getItem('wenflow_home_sidebar_expanded') === 'true'
    : true
);

const toggleSidebar = () => {
  isSidebarExpanded.value = !isSidebarExpanded.value;
  localStorage.setItem('wenflow_home_sidebar_expanded', String(isSidebarExpanded.value));
};

// Modals State
const showSettingsDialog = ref(false);
const showHistoryDrawer = ref(false);

// History Editing State
const editingSessionId = ref<string | null>(null);
const editTitleText = ref("");

const startEditing = (id: string, currentTitle: string) => {
  editingSessionId.value = id;
  editTitleText.value = currentTitle;
};

const saveEditing = (id: string) => {
  if (editingSessionId.value === id) {
    if (editTitleText.value.trim()) {
      chatStore.renameSession(id, editTitleText.value.trim());
    }
    editingSessionId.value = null;
  }
};

const cancelEditing = () => {
  editingSessionId.value = null;
};

const deleteSession = (id: string, e: Event) => {
  e.stopPropagation();
  const targetSession = chatStore.sessions.find(s => s.id === id);
  const hasMessages = targetSession && targetSession.messages && targetSession.messages.length > 0 && targetSession.messages.some(m => m.role === 'user' && m.content && m.content.trim().length > 0);

  // 如果会话中没有提问或内容为空，直接快捷删除，无需二次弹窗
  if (!hasMessages) {
    chatStore.deleteSession(id);
    toast.success('会话已删除');
    return;
  }

  ElMessageBox.confirm(
    `确定要删除会话「${targetSession?.title || '此会话'}」吗？删除后该对话的历史记录将无法恢复。`,
    '删除会话确认',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger',
      autofocus: false
    }
  ).then(() => {
    chatStore.deleteSession(id);
    toast.success('会话已删除');
  }).catch(() => {});
};

const selectSession = (id: string) => {
  chatStore.switchSession(id);
  showHistoryDrawer.value = false;
  router.push('/chat');
};

const handleNewChat = () => {
  chatStore.createSession();
  router.push('/chat');
};

const openModelSquare = () => {
  modelSquareRef.value?.open();
};

const openBatchDrawer = () => {
  batchDrawerRef.value?.open();
};

const handleSquareSelect = (modelId: string) => {
  chatStore.switchModel(modelId as ModelType);
};

const openSettings = () => {
  showSettingsDialog.value = true;
};

const handleHomeSend = (text: string, mode: 'chat' | 'image' = 'chat', options: any = {}) => {
  const currentModel = chatStore.currentModel || ModelType.R1_Distill_7B;
  if (options.assets && options.assets.length > 0) {
    chatStore.setPendingAssets(options.assets);
  }
  
  router.push({
    path: "/chat",
    query: {
      q: text,
      model: currentModel,
      mode: mode
    }
  });
};

const handleModelChange = (model: ModelType) => {
  chatStore.switchModel(model);
};

// Quick Inspiration Suggestions (Perplexity style prompt chips)
const quickPrompts = [
  { icon: '💡', label: '深度推理', text: '请帮我深度分析一下 2026 年大语言模型与多模态智能体的发展趋势与技术瓶颈' },
  { icon: '💻', label: '代码架构', text: '用 TypeScript 和 Vue 3 设计一个具备撤销重做（Undo/Redo）功能的高性能画布状态管理器' },
  { icon: '✍️', label: '专业写作', text: '为一款主打极简效率与多模型聚合的 AI 开发者工作台撰写一份吸引人的产品发布文案' },
  { icon: '📊', label: '商业调研', text: '对比分析目前主流开源大模型（DeepSeek-V3/R1、Qwen2.5、Llama 3.3）在代码与数学推理上的优缺点' }
];

const applyQuickPrompt = (text: string) => {
  handleHomeSend(text, 'chat');
};
</script>

<template>
  <div class="h-[100dvh] w-full bg-[#f8fbff] flex overflow-hidden select-none font-sans relative">
    <!-- Ambient Aurora Glow Fluid Mesh -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div class="aurora-orb orb-1"></div>
      <div class="aurora-orb orb-2"></div>
    </div>

    <!-- ==================== LEFT EXPANDABLE SIDEBAR (Crisp Modern SaaS Minimalist) ==================== -->
    <aside 
      class="h-full bg-white border-r border-slate-200/80 shrink-0 z-20 shadow-2xs backdrop-blur-md transition-[width] duration-300 ease-in-out select-none flex flex-col justify-between overflow-hidden"
      :class="isSidebarExpanded ? 'w-64 p-3' : 'w-16 p-2'"
    >
      <!-- Top Group: Header + New Chat + Navigation Menu + Recent Chats -->
      <div class="flex flex-col gap-2.5 w-full">
        <!-- 1. Header (Brand Logo + Title + Top-Right Fold Button) -->
        <div class="h-9 flex items-center w-full overflow-hidden" :class="isSidebarExpanded ? 'justify-between' : 'justify-center'">
          <!-- Left: Brand Logo & Title -->
          <div 
            class="flex items-center gap-2 cursor-pointer overflow-hidden min-w-0 group"
            @click="isSidebarExpanded ? router.push('/') : toggleSidebar()"
          >
            <el-tooltip :content="isSidebarExpanded ? '点击返回首页' : '展开侧边栏'" placement="right" :show-after="300">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-50 to-indigo-50 flex items-center justify-center border border-indigo-100/80 shadow-2xs shrink-0 group-hover:scale-105 transition-all">
                <img :src="wenflowLogo" alt="Logo" class="w-6 h-6 object-contain" />
              </div>
            </el-tooltip>

            <span 
              v-if="isSidebarExpanded"
              class="font-extrabold text-sm text-slate-800 tracking-tight whitespace-nowrap"
            >
              问流 Flow
            </span>
          </div>

          <!-- Right: Top-Right Fold Button (Only shown in expanded state) -->
          <el-tooltip v-if="isSidebarExpanded" content="收起侧边栏" placement="right" :show-after="300">
            <button 
              @click="toggleSidebar"
              class="w-7 h-7 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <el-icon class="text-sm"><Fold /></el-icon>
            </button>
          </el-tooltip>
        </div>

        <!-- 2. Pure Blue High-End New Chat Button -->
        <el-tooltip :content="isSidebarExpanded ? '' : '开启新对话 (⌘N)'" placement="right" :disabled="isSidebarExpanded" :show-after="300">
          <button 
            @click="handleNewChat"
            class="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center cursor-pointer active:scale-98 overflow-hidden shrink-0"
            :class="isSidebarExpanded ? 'w-full h-9 justify-between px-3' : 'w-10 h-10 justify-center mx-auto'"
          >
            <div class="flex items-center gap-2 min-w-0">
              <!-- Ultra-crisp vector plus icon -->
              <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span v-if="isSidebarExpanded" class="font-bold text-xs text-white tracking-tight whitespace-nowrap">
                开启新对话
              </span>
            </div>

            <!-- Crisp High-End Keycap Badge -->
            <kbd 
              v-if="isSidebarExpanded" 
              class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/15 text-white/95 text-[10px] font-mono font-medium border border-white/20 shadow-2xs leading-none select-none"
            >
              <svg class="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
              </svg>
              <span class="text-[10px] font-bold">N</span>
            </kbd>
          </button>
        </el-tooltip>

        <!-- 3. Navigation Menu List -->
        <div class="flex flex-col gap-1 w-full pt-1">
          <!-- 历史会话 -->
          <el-tooltip :content="isSidebarExpanded ? '' : '历史会话'" placement="right" :disabled="isSidebarExpanded" :show-after="300">
            <button 
              @click="showHistoryDrawer = true"
              class="rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100/80 transition-colors flex items-center cursor-pointer text-xs font-medium overflow-hidden group shrink-0 relative"
              :class="[
                showHistoryDrawer ? 'bg-blue-50 text-blue-600 font-semibold' : '',
                isSidebarExpanded ? 'w-full h-9 px-2.5' : 'w-10 h-10 justify-center mx-auto'
              ]"
            >
              <div class="flex items-center justify-center relative shrink-0">
                <svg class="w-[19px] h-[19px] text-slate-500 group-hover:text-blue-600 transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span v-if="chatStore.sessions.length > 0" class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
              </div>
              <span v-if="isSidebarExpanded" class="ml-2.5 whitespace-nowrap">
                历史会话
              </span>
              <span 
                v-if="isSidebarExpanded"
                class="ml-auto text-[10.5px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-mono font-medium"
              >
                {{ chatStore.sessions.length }}
              </span>
            </button>
          </el-tooltip>

          <!-- 模型广场 -->
          <el-tooltip :content="isSidebarExpanded ? '' : '模型全景广场 (500+)'" placement="right" :disabled="isSidebarExpanded" :show-after="300">
            <button 
              @click="openModelSquare"
              class="rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100/80 transition-colors flex items-center cursor-pointer text-xs font-medium overflow-hidden group shrink-0"
              :class="isSidebarExpanded ? 'w-full h-9 px-2.5' : 'w-10 h-10 justify-center mx-auto'"
            >
              <div class="flex items-center justify-center shrink-0">
                <svg class="w-[19px] h-[19px] text-slate-500 group-hover:text-blue-600 transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                </svg>
              </div>
              <span v-if="isSidebarExpanded" class="ml-2.5 whitespace-nowrap">
                模型全景广场
              </span>
              <span 
                v-if="isSidebarExpanded"
                class="ml-auto text-[9.5px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 font-bold border border-indigo-100"
              >
                500+
              </span>
            </button>
          </el-tooltip>

          <!-- 工作台配置 -->
          <el-tooltip :content="isSidebarExpanded ? '' : '工作台与 API 设置'" placement="right" :disabled="isSidebarExpanded" :show-after="300">
            <button 
              @click="openSettings"
              class="rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100/80 transition-colors flex items-center cursor-pointer text-xs font-medium overflow-hidden group shrink-0"
              :class="isSidebarExpanded ? 'w-full h-9 px-2.5' : 'w-10 h-10 justify-center mx-auto'"
            >
              <div class="flex items-center justify-center shrink-0">
                <svg class="w-[19px] h-[19px] text-slate-500 group-hover:text-blue-600 transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </div>
              <span v-if="isSidebarExpanded" class="ml-2.5 whitespace-nowrap">
                工作台配置
              </span>
            </button>
          </el-tooltip>
        </div>

        <!-- 4. Recent Chats (Only when expanded) -->
        <div 
          v-if="isSidebarExpanded && chatStore.sessions.length > 0" 
          class="pt-2 border-t border-slate-100 overflow-hidden"
        >
          <div class="px-2 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            最近对话
          </div>
          <div class="space-y-0.5 overflow-y-auto custom-scrollbar max-h-40 px-0.5">
            <div 
              v-for="s in chatStore.sessions.slice(0, 5)" 
              :key="s.id"
              @click="selectSession(s.id)"
              class="group flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100/80 hover:text-blue-600 text-xs truncate cursor-pointer transition-colors whitespace-nowrap"
            >
              <el-icon class="text-slate-400 text-xs shrink-0"><ChatDotRound /></el-icon>
              <span class="truncate">{{ s.title || '新会话' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Profile Section -->
      <div class="w-full pt-2 border-t border-slate-100">
        <el-tooltip :content="isSidebarExpanded ? '' : '工作台配置与沙箱存储'" placement="right" :disabled="isSidebarExpanded" :show-after="300">
          <div 
            class="flex items-center cursor-pointer hover:bg-slate-50 rounded-xl transition-colors overflow-hidden group" 
            :class="isSidebarExpanded ? 'p-1.5 h-11 w-full' : 'w-10 h-10 justify-center mx-auto'"
            @click="openSettings"
          >
            <div class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/90 flex items-center justify-center text-xs font-bold text-slate-700 relative shrink-0 shadow-2xs">
              <span>AI</span>
              <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </div>
            <div 
              v-if="isSidebarExpanded"
              class="ml-2.5 min-w-0"
            >
              <div class="text-xs font-bold text-slate-800 whitespace-nowrap truncate leading-tight group-hover:text-blue-600 transition-colors">本地沙箱存储</div>
              <div class="text-[10px] text-emerald-600 font-medium whitespace-nowrap truncate leading-tight">密钥安全隔离</div>
            </div>
            <el-icon 
              v-if="isSidebarExpanded"
              class="text-slate-400 group-hover:text-blue-600 text-xs shrink-0 ml-auto mr-1 transition-colors"
            >
              <Setting />
            </el-icon>
          </div>
        </el-tooltip>
      </div>
    </aside>

    <!-- ==================== MAIN CENTER WORKSPACE ==================== -->
    <main class="flex-1 h-full flex flex-col justify-between items-center px-4 sm:px-8 relative z-10 overflow-y-auto custom-scrollbar">
      <!-- Top Subtle Space -->
      <div class="w-full h-4 sm:h-8 shrink-0"></div>

      <!-- Center Hero Section (Original Title & Input) -->
      <div class="flex-1 flex flex-col items-center justify-center max-w-3xl w-full mx-auto px-4 my-auto">
        <div class="home-hero text-center mb-6">
          <p class="home-kicker">WENFLOW · 问流 AI 智能工作台</p>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">思绪如流，问答无界</h1>
          <p class="home-subtitle text-xs sm:text-sm text-slate-500 mt-2">汇聚前沿智能模型，让每一次深度探索与灵感创作，都如心流般自然流淌。</p>
        </div>

        <!-- Unified Shared High-End Input Box -->
        <div class="home-composer w-full">
          <ChatInput 
            ref="chatInputRef"
            :is-hero="true"
            dropdown-placement="bottom-start"
            @send="handleHomeSend"
            @model-change="handleModelChange"
            @open-model-square="openModelSquare"
          />
        </div>
      </div>

      <!-- Bottom Minimal Footer -->
      <footer class="w-full py-3 text-center text-[11px] text-slate-400 shrink-0">
        问流 AI (WenFlow) · 聚合多平台模型服务 · 内容由 AI 生成仅供参考 · 密钥保存在本地浏览器
      </footer>
    </main>

    <!-- ==================== HISTORY DRAWER (Slide-over) ==================== -->
    <el-drawer
      v-model="showHistoryDrawer"
      title="历史对话会话"
      size="320px"
      direction="ltr"
      class="history-slide-drawer"
    >
      <template #header>
        <div class="flex items-center justify-between pr-2">
          <div class="flex items-center gap-2">
            <el-icon class="text-blue-600 text-base"><Clock /></el-icon>
            <span class="font-bold text-sm text-slate-800">历史会话 ({{ chatStore.sessions.length }})</span>
          </div>
          <button 
            @click="handleNewChat" 
            class="px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <el-icon><Plus /></el-icon>
            <span>新建</span>
          </button>
        </div>
      </template>

      <div class="h-full flex flex-col -mt-3">
        <div v-if="chatStore.sessions.length === 0" class="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs py-12">
          <el-icon class="text-3xl mb-2 text-slate-300"><ChatDotRound /></el-icon>
          <p>暂无历史会话，点击开启新对话</p>
        </div>

        <div v-else class="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
          <div 
            v-for="s in chatStore.sessions"
            :key="s.id"
            @click="selectSession(s.id)"
            class="p-2.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all cursor-pointer group flex items-center justify-between gap-2"
            :class="{ 'bg-blue-50 border-blue-200 text-blue-700': s.id === chatStore.activeSessionId }"
          >
            <div class="min-w-0 flex-1">
              <div v-if="editingSessionId === s.id" class="flex items-center gap-1" @click.stop>
                <input 
                  v-model="editTitleText" 
                  class="w-full text-xs px-1.5 py-0.5 border border-blue-400 rounded bg-white outline-none"
                  @keydown.enter="saveEditing(s.id)"
                  @keydown.esc="cancelEditing"
                  autofocus
                />
                <button @click="saveEditing(s.id)" class="text-emerald-600 hover:text-emerald-700 p-0.5"><el-icon><Check /></el-icon></button>
                <button @click="cancelEditing" class="text-slate-400 hover:text-slate-600 p-0.5"><el-icon><Close /></el-icon></button>
              </div>
              <div v-else>
                <h4 class="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600">{{ s.title || '新会话' }}</h4>
                <div class="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <span>{{ s.messages.length }} 条对话</span>
                  <span>·</span>
                  <span class="truncate">{{ s.model }}</span>
                </div>
              </div>
            </div>

            <!-- Action buttons -->
            <div v-if="editingSessionId !== s.id" class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                @click.stop="startEditing(s.id, s.title)" 
                class="p-1 rounded hover:bg-white text-slate-400 hover:text-slate-700 transition-colors" 
                title="重命名"
              >
                <el-icon class="text-xs"><EditPen /></el-icon>
              </button>
              <button 
                @click="deleteSession(s.id, $event)" 
                class="p-1 rounded hover:bg-white text-slate-400 hover:text-red-600 transition-colors" 
                title="删除会话"
              >
                <el-icon class="text-xs"><Delete /></el-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 统一设置弹窗 (Reusable Modal) -->
    <SettingsModal v-model="showSettingsDialog" />

    <!-- 官方全屏模型广场 -->
    <ModelSquareModal ref="modelSquareRef" @select="handleSquareSelect" />
  </div>
</template>

<style scoped>
/* ==================== Ambient Aurora Glow ==================== */
.aurora-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.22;
  will-change: transform;
  pointer-events: none;
}

.orb-1 {
  width: min(500px, 80vw);
  height: min(500px, 80vw);
  background: radial-gradient(circle, #3b82f6 0%, rgba(59, 130, 246, 0.4) 60%, transparent 80%);
  top: 15%;
  left: 20%;
  animation: float-orb-1 24s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
}

.orb-2 {
  width: min(460px, 75vw);
  height: min(460px, 75vw);
  background: radial-gradient(circle, #6366f1 0%, rgba(99, 102, 241, 0.35) 60%, transparent 80%);
  bottom: 20%;
  right: 15%;
  animation: float-orb-2 28s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
}

@keyframes float-orb-1 {
  0% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(50px, -30px, 0) scale(1.1); }
  100% { transform: translate3d(-30px, 40px, 0) scale(0.95); }
}

@keyframes float-orb-2 {
  0% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(-40px, 30px, 0) scale(1.06); }
  100% { transform: translate3d(30px, -20px, 0) scale(0.94); }
}
</style>
