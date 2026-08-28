<script setup lang="ts">
import { ref, computed } from "vue";
import { useChatStore } from "@/stores/chat";
import { 
  Plus, ChatLineRound, ChatDotRound, Delete, Setting, Close, EditPen, Download, Check, Loading, Tickets, Grid, ArrowRight
} from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import wenflowLogo from "@/assets/images/wenflow.png";
import { ElMessageBox } from "element-plus";
import { toast } from "@/utils/toast";

const emit = defineEmits<{
  'open-settings': [];
  'open-model-square': [];
  'close-mobile': [];
}>();

const chatStore = useChatStore();
const router = useRouter();

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

const goHome = () => {
  router.push('/');
  if (window.innerWidth < 768) {
    emit('close-mobile');
  }
};

const handleNewChat = () => {
  const newId = chatStore.createSession();
  router.push({ path: '/chat', query: { id: newId } });
  if (window.innerWidth < 768) {
    emit('close-mobile');
  }
};

const handleSwitch = (id: string) => {
  if (editingSessionId.value) return;
  chatStore.switchSession(id);
  router.push({ path: '/chat', query: { id } });
  if (window.innerWidth < 768) {
    emit('close-mobile');
  }
};

const handleDelete = async (id: string, title: string) => {
  const targetSession = chatStore.sessions.find(s => s.id === id);
  const hasMessages = targetSession && targetSession.messages && targetSession.messages.length > 0 && targetSession.messages.some(m => m.role === 'user' && m.content && m.content.trim().length > 0);

  // 如果会话中没有提问或内容为空，直接静默/快捷删除，无需二级确认弹窗
  if (!hasMessages) {
    chatStore.deleteSession(id);
    if (chatStore.activeSessionId) {
      router.push({ path: '/chat', query: { id: chatStore.activeSessionId } });
    }
    toast.success('会话已删除');
    return;
  }

  // 有提问内容的会话弹出二次确认，防止误删重要历史记录
  try {
    await ElMessageBox.confirm(
      `确定要删除会话「${title}」吗？删除后该对话的历史记录将无法恢复。`,
      '删除会话确认',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
        autofocus: false,
        center: false
      }
    );
    chatStore.deleteSession(id);
    if (chatStore.activeSessionId) {
      router.push({ path: '/chat', query: { id: chatStore.activeSessionId } });
    }
    toast.success('会话已删除');
  } catch {
    // 用户取消删除
  }
};

const handleExport = (id: string) => {
  chatStore.exportSessionMarkdown(id);
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  if (date.toLocaleDateString() === now.toLocaleDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const formatFullDateTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const Y = date.getFullYear();
  const M = (date.getMonth() + 1).toString().padStart(2, '0');
  const D = date.getDate().toString().padStart(2, '0');
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${Y}-${M}-${D} ${h}:${m}`;
};

// 按时间智能分组 (今天 / 昨天 / 最近 7 天 / 更早)
const sessionGroups = computed(() => {
  const today: any[] = [];
  const yesterday: any[] = [];
  const pastWeek: any[] = [];
  const older: any[] = [];

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const pastWeekStart = todayStart - 6 * 86400000;

  chatStore.sessions.forEach(s => {
    const time = s.updatedAt || 0;
    if (time >= todayStart) today.push(s);
    else if (time >= yesterdayStart) yesterday.push(s);
    else if (time >= pastWeekStart) pastWeek.push(s);
    else older.push(s);
  });

  return [
    { title: '今天', items: today },
    { title: '昨天', items: yesterday },
    { title: '最近 7 天', items: pastWeek },
    { title: '更早', items: older }
  ].filter(g => g.items.length > 0);
});

// 鼠标悬停平滑精准滚动完整标题
const handleTitleMouseEnter = (e: MouseEvent) => {
  const target = e.currentTarget as HTMLElement;
  const textEl = target.querySelector('.marquee-text') as HTMLElement;
  if (!textEl) return;
  const containerEl = textEl.parentElement;
  if (!containerEl) return;
  const overflow = textEl.scrollWidth - containerEl.clientWidth;
  if (overflow > 4) {
    const duration = Math.max(1.8, parseFloat((overflow / 35).toFixed(2))); // 匀速阅读速度 (35px/s)
    textEl.style.transition = `transform ${duration}s linear 0.2s`;
    textEl.style.transform = `translateX(-${overflow + 6}px)`;
  }
};

const handleTitleMouseLeave = (e: MouseEvent) => {
  const target = e.currentTarget as HTMLElement;
  const textEl = target.querySelector('.marquee-text') as HTMLElement;
  if (!textEl) return;
  textEl.style.transition = 'transform 0.2s ease-out';
  textEl.style.transform = 'translateX(0)';
};
</script>

<template>
  <div class="h-full w-64 flex flex-col bg-white border-r border-slate-200/80 font-sans select-none shrink-0">
    <!-- Header: Brand mark & New chat button -->
    <div class="p-3 bg-white border-b border-slate-100 flex flex-col gap-2.5">
      <!-- Brand & Mobile Close -->
      <div class="h-9 flex items-center justify-between w-full overflow-hidden">
        <button 
          @click="goHome"
          class="flex items-center gap-2 text-slate-800 hover:text-blue-600 transition-all cursor-pointer group rounded-lg text-left"
          title="点击返回首页"
        >
          <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80 shadow-2xs shrink-0 group-hover:scale-105 group-hover:bg-blue-100/80 transition-all">
            <img :src="wenflowLogo" class="w-5 h-5 object-contain" alt="Logo" />
          </div>
          <span class="font-extrabold text-sm tracking-tight text-slate-800 group-hover:text-blue-600 transition-colors">问流 AI</span>
        </button>

        <!-- Mobile Close Button -->
        <button
          @click="$emit('close-mobile')"
          class="md:hidden w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:text-slate-700 active:scale-95 cursor-pointer"
          title="关闭侧边栏"
        >
          <el-icon><Close /></el-icon>
        </button>
      </div>

      <!-- Clean Solid Blue Primary New Chat Button (Ultra-Crisp Vector & Keycap) -->
      <button
        @click="handleNewChat"
        class="w-full h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all active:scale-98 cursor-pointer flex items-center justify-between px-3"
      >
        <div class="flex items-center gap-2">
          <!-- Ultra-crisp vector plus icon -->
          <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span class="font-bold text-xs text-white tracking-tight whitespace-nowrap">开启新对话</span>
        </div>

        <!-- Crisp High-End Keycap Badge -->
        <kbd class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/15 text-white/95 text-[10px] font-mono font-medium border border-white/20 shadow-2xs leading-none select-none">
          <svg class="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
          </svg>
          <span class="text-[10px] font-bold">N</span>
        </kbd>
      </button>
    </div>

    <!-- History Sessions List -->
    <div class="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar">
      <!-- Empty state -->
      <div v-if="chatStore.sessions.length === 0" class="px-3 py-16 text-center flex flex-col items-center gap-2.5">
        <div class="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
           <el-icon class="text-lg"><ChatLineRound /></el-icon>
        </div>
        <div class="text-xs font-bold text-slate-700">暂无历史会话</div>
        <p class="text-[11px] text-slate-400">点击上方按钮开启全新智能对话</p>
      </div>

      <!-- Time Grouped Session List -->
      <div v-else class="space-y-3">
        <div v-for="group in sessionGroups" :key="group.title" class="space-y-0.5">
          <!-- Group Title Header (Matching HomeView Clean Typography) -->
          <div class="px-2 pt-1.5 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{{ group.title }}</span>
            <span class="text-[9.5px] font-mono font-semibold text-slate-400">({{ group.items.length }})</span>
          </div>

          <!-- Session Items in this Group -->
          <div v-for="session in group.items" :key="session.id">
            <el-tooltip
              :disabled="editingSessionId === session.id"
              placement="right"
              :show-after="350"
              :hide-after="50"
              effect="light"
              :offset="10"
            >
              <!-- Popover Bubble Content on the Right (Full Text Display) -->
              <template #content>
                <div class="p-1 max-w-[320px] text-xs">
                  <div class="font-medium text-slate-800 leading-relaxed break-words mb-2">
                    {{ session.title }}
                  </div>
                  <div class="text-[10px] text-slate-400 flex items-center justify-between gap-3 border-t border-slate-100 pt-1.5 font-mono">
                    <span>{{ formatFullDateTime(session.updatedAt) }}</span>
                    <span v-if="session.model" class="text-blue-600 font-semibold truncate max-w-[140px]">
                      {{ session.model }}
                    </span>
                  </div>
                </div>
              </template>

              <!-- Session Row Trigger (Modern Crisp Aesthetics) -->
              <div
                class="group relative flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all duration-150 text-xs overflow-hidden"
                :class="chatStore.activeSessionId === session.id 
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100 shadow-2xs' 
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-blue-600 border border-transparent'"
                @click="handleSwitch(session.id)"
                @dblclick="startEditing(session.id, session.title)"
                @mouseenter="handleTitleMouseEnter"
                @mouseleave="handleTitleMouseLeave"
              >
                <!-- Integrated Left Accent Pill -->
                <div 
                  v-if="chatStore.activeSessionId === session.id" 
                  class="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-600 rounded-r shadow-2xs"
                ></div>

                <!-- Editing Mode Input -->
                <div v-if="editingSessionId === session.id" class="flex-1 flex items-center gap-1.5" @click.stop>
                  <input 
                    v-model="editTitleText" 
                    type="text" 
                    class="w-full bg-white border border-blue-500 rounded-md px-2 py-0.5 text-xs text-slate-800 outline-none shadow-xs font-normal"
                    @keydown.enter="saveEditing(session.id)"
                    @keydown.esc="cancelEditing"
                    @blur="saveEditing(session.id)"
                    autofocus
                  />
                  <button @click="saveEditing(session.id)" class="text-blue-600 p-0.5 hover:bg-blue-50 rounded bg-white shrink-0">
                    <el-icon><Check /></el-icon>
                  </button>
                </div>

                <!-- Normal Display Title (with Precision Linear Marquee on Hover) -->
                <div 
                  v-else 
                  class="flex items-center gap-2 flex-1 overflow-hidden min-w-0"
                >
                  <!-- Generating Spinner or Clean Dot Icon -->
                  <el-icon 
                    v-if="chatStore.isSessionGenerating ? chatStore.isSessionGenerating(session.id) : (chatStore.generatingSessionIds && chatStore.generatingSessionIds.includes(session.id))" 
                    class="animate-spin text-xs text-blue-600 shrink-0"
                    title="正在生成中..."
                  >
                    <Loading />
                  </el-icon>
                  <el-icon 
                    v-else 
                    class="text-xs shrink-0 transition-colors"
                    :class="chatStore.activeSessionId === session.id ? 'text-blue-600 font-bold' : 'text-slate-400 group-hover:text-blue-600'"
                  >
                    <ChatDotRound />
                  </el-icon>
                  
                  <div class="flex-1 overflow-hidden min-w-0 relative">
                    <div class="leading-tight flex items-center">
                      <span 
                        class="marquee-text whitespace-nowrap inline-block text-xs" 
                        :class="chatStore.activeSessionId === session.id ? 'text-blue-900 font-semibold' : 'text-slate-700 group-hover:text-slate-900 font-normal'"
                      >
                        {{ session.title }}
                      </span>
                      
                      <!-- Generating Pill -->
                      <span 
                        v-if="chatStore.isSessionGenerating ? chatStore.isSessionGenerating(session.id) : (chatStore.generatingSessionIds && chatStore.generatingSessionIds.includes(session.id))" 
                        class="text-[9px] px-1 py-0.2 rounded font-normal bg-blue-100 text-blue-700 shrink-0 ml-1"
                      >
                        生成中
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Right Section: Fixed-width time with overlay hover actions -->
                <div class="relative shrink-0 flex items-center justify-end h-5 min-w-[38px]">
                  <!-- Default Time: smoothly hides on hover -->
                  <span 
                    v-if="editingSessionId !== session.id"
                    class="text-[10px] font-mono text-slate-400 group-hover:opacity-0 transition-opacity select-none"
                  >
                    {{ formatTime(session.updatedAt) }}
                  </span>

                  <!-- Action Buttons: smoothly fades in with matching backdrop mask -->
                  <div 
                    v-if="editingSessionId !== session.id" 
                    class="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity pointer-events-none group-hover:pointer-events-auto pl-2"
                    :class="chatStore.activeSessionId === session.id ? 'bg-gradient-to-l from-blue-50/95 via-blue-50/90 to-transparent' : 'bg-gradient-to-l from-slate-100 via-slate-100/90 to-transparent'"
                  >
                    <button
                      @click.stop="startEditing(session.id, session.title)"
                      class="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
                      title="重命名 (双击亦可)"
                    >
                      <el-icon class="text-xs"><EditPen /></el-icon>
                    </button>

                    <button
                      @click.stop="handleExport(session.id)"
                      class="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
                      title="导出 Markdown"
                    >
                      <el-icon class="text-xs"><Download /></el-icon>
                    </button>

                    <button
                      @click.stop="handleDelete(session.id, session.title)"
                      class="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
                      title="删除对话"
                    >
                      <el-icon class="text-xs"><Delete /></el-icon>
                    </button>
                  </div>
                </div>
              </div>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer: Settings & Model Square (Unified Dock Matching HomeView) -->
    <div class="p-2.5 bg-white border-t border-slate-100 space-y-1.5 shrink-0 select-none">
      <!-- Top: Model Square Featured Banner Button -->
      <button
        @click="$emit('open-model-square')"
        class="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 hover:bg-blue-50/80 border border-slate-200/80 text-slate-700 hover:text-blue-600 text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-[0.98] group"
        title="打开全屏问流模型广场"
      >
        <div class="flex items-center gap-2">
          <el-icon class="text-sm text-slate-500 group-hover:text-blue-600"><Grid /></el-icon>
          <span class="whitespace-nowrap font-medium">模型全景广场</span>
        </div>
        <span class="text-[9.5px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 font-bold border border-indigo-100">500+</span>
      </button>

      <!-- Bottom Profile & Settings Section (Matching HomeView) -->
      <div 
        class="flex items-center cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-colors h-11 overflow-hidden group" 
        @click="$emit('open-settings')"
        title="点击打开工作台与 API 配置"
      >
        <div class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/90 flex items-center justify-center text-xs font-bold text-slate-700 relative shrink-0 shadow-2xs">
          <span>AI</span>
          <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
        </div>
        <div class="ml-2.5 min-w-0 flex-1">
          <div class="text-xs font-bold text-slate-800 whitespace-nowrap truncate leading-tight group-hover:text-blue-600 transition-colors">本地沙箱存储</div>
          <div class="text-[10px] text-emerald-600 font-medium whitespace-nowrap truncate leading-tight">密钥安全隔离</div>
        </div>
        <el-icon class="text-slate-400 group-hover:text-blue-600 text-xs shrink-0 ml-auto mr-1 transition-colors"><Setting /></el-icon>
      </div>
    </div>
  </div>
</template>
