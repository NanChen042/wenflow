<template>
  <div class="relative w-full transition-all duration-200 group/bubble mb-6" 
       :class="{ 'cursor-pointer select-none': isSharingMode }"
       @click="handleBubbleClick">
       
    <!-- Share Checkbox Overlay (Properly aligned on top-left of message) -->
    <div v-if="isSharingMode" class="absolute left-0 top-3 z-10 pointer-events-none transition-transform">
      <div class="w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all shadow-2xs" 
           :class="isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300 hover:border-slate-400'">
        <el-icon v-if="isSelected" class="text-white text-xs font-black"><Check /></el-icon>
      </div>
    </div>

    <!-- Inner Wrapper -->
    <div class="w-full flex transition-all duration-200" :class="[
      isUser ? 'justify-end' : 'justify-start',
      isLastMessage && !isSharingMode ? 'pb-8' : '',
      isSharingMode ? 'pl-8' : ''
    ]">

      <!-- User Message -->
      <div v-if="isUser" class="relative max-w-[85%] md:max-w-[75%]">
        <div class="px-4 py-2.5 bg-blue-600 text-white rounded-2xl rounded-br-sm text-[14px] leading-relaxed break-words shadow-2xs font-normal selection:bg-blue-800">
          <!-- Conversation-Style Assets Grid -->
          <div v-if="assets && assets.length > 0" class="mb-2.5">
            <div :class="[
              'grid gap-1.5',
              assets.length === 1 ? 'max-w-[280px]' : 
              assets.length === 2 ? 'grid-cols-2 max-w-[360px]' : 
              'grid-cols-2 md:grid-cols-3 max-w-[440px]'
            ]">
              <div v-for="(asset, idx) in assets" :key="idx" 
                   class="asset-conversation-card group/asset"
                   :class="{ 'aspect-video': assets.length === 1, 'aspect-square': assets.length > 1 }">
                
                <!-- Image/PDF Preview -->
                <template v-if="asset.type === 'image'">
                  <el-image 
                    :src="asset.url" 
                    class="w-full h-full object-cover rounded shadow-2xs"
                    :preview-src-list="assets.filter(a => a.type === 'image' || a.type === 'pdf').map(a => a.url)"
                    :initial-index="idx"
                    preview-teleported
                    fit="cover"
                    lazy
                  />
                </template>

                <button
                  v-else-if="asset.type === 'pdf'"
                  type="button"
                  class="w-full h-full flex flex-col items-center justify-center bg-white/20 backdrop-blur-xs rounded border border-white/30 text-white cursor-pointer"
                  @click.stop="openAsset(asset.url)"
                  :title="asset.name || '打开 PDF 文件'"
                >
                  <el-icon class="text-xl mb-1"><Document /></el-icon>
                  <span class="text-[9px] font-bold uppercase tracking-wider">PDF</span>
                </button>

                <!-- Audio/Video/Other -->
                <div v-else class="w-full h-full flex flex-col items-center justify-center bg-white/20 backdrop-blur-xs rounded border border-white/30 text-white">
                  <el-icon v-if="asset.type === 'audio'" class="text-xl mb-1"><Mic /></el-icon>
                  <el-icon v-else class="text-xl mb-1"><VideoPlay /></el-icon>
                  <span class="text-[9px] font-bold uppercase tracking-wider opacity-80">{{ asset.type }}</span>
                </div>

                <!-- Frosted Label -->
                <div class="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/40 text-[8px] font-bold text-white uppercase opacity-0 group-hover/asset:opacity-100 transition-opacity">
                  {{ asset.type === 'image' ? '图片' : (asset.type === 'pdf' ? '文档' : (asset.type === 'audio' ? '音频' : '视频')) }}
                </div>
              </div>
            </div>
          </div>
          {{ content }}
        </div>
      </div>

      <!-- Assistant Message -->
      <div v-else class="flex w-full group">
        <div class="flex-1 min-w-0 relative">
          <!-- Status Badge (Only when there is no reasoning block) -->
          <div v-if="!isUser && loading && !reasoningContent" class="flex items-center gap-2 mb-2 animate-in fade-in slide-in-from-top-1 duration-300">
            <div class="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
            <span class="text-xs font-semibold text-blue-600 tracking-wider">正在回复...</span>
          </div>

          <!-- DeepSeek-R1 深度思考推理块 (参照 DeepSeek 官方现代设计) -->
          <div v-if="reasoningContent" class="mb-3 animate-in fade-in slide-in-from-top-1 duration-300">
            <details 
              class="group/reasoning transition-all duration-200 select-none" 
              :open="isReasoningOpen"
              @toggle="onDetailsToggle"
            >
              <summary class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100/90 text-slate-600 hover:text-slate-900 text-xs font-medium cursor-pointer list-none transition-colors border border-slate-200/80">
                <el-icon v-if="loading && isLastMessage && !content" class="animate-spin text-blue-600 text-xs"><Loading /></el-icon>
                <el-icon v-else class="text-slate-400 text-xs"><Cpu /></el-icon>

                <span>{{ (loading && isLastMessage && !content) ? '深度思考中...' : '已深度思考' }}</span>

                <el-icon class="text-[10px] text-slate-400 transition-transform duration-200 group-open/reasoning:rotate-180">
                  <ArrowDown />
                </el-icon>
              </summary>

              <!-- 思考内容: 纯净沉浸式左侧边线设计，柔和低饱和灰字与正文明确区分 -->
              <div 
                class="mt-2.5 ml-0.5 pl-3.5 border-l-2 text-xs text-slate-500 leading-relaxed reasoning-markdown select-text"
                :class="(loading && isLastMessage && !content) ? 'border-blue-400/80' : 'border-slate-200'"
                v-html="renderedReasoning"
              ></div>
            </details>
          </div>

          <!-- Main Content (Text/Image) -->
          <div class="flex flex-col gap-3">
            <!-- Text Mode -->
            <div v-if="type === 'text'" class="text-[14px] text-slate-800 leading-[1.65] break-words custom-markdown selection:bg-blue-100" v-html="renderedContent"></div>

            <!-- Image Mode -->
            <div v-else-if="type === 'image'" class="w-full">
              <!-- Status Text -->
              <div v-if="loading || (images && images.length === 0)" class="text-sm font-medium text-slate-600 mb-2.5 animate-pulse">
                {{ content }}
              </div>

              <!-- Generation Progress -->
              <div v-if="loading && progress !== undefined && progress < 100" class="mb-3">
                <div class="w-full max-w-xs h-1.5 bg-slate-100 rounded overflow-hidden">
                  <div class="h-full bg-blue-600 rounded transition-all duration-500" :style="{ width: `${progress}%` }"></div>
                </div>
                <div class="mt-1 text-[10.5px] font-semibold text-slate-400 flex justify-between max-w-xs">
                  <span>正在渲染创作</span>
                  <span>{{ progress }}%</span>
                </div>
              </div>

              <!-- Image Results Grid / Skeletons (Adaptive Proportional Scaling) -->
              <div 
                class="image-gallery-grid" 
                :class="(!images || images.length <= 1) ? 'grid-cols-1 max-w-lg' : 'grid-cols-1 sm:grid-cols-2 max-w-2xl'"
              >
                <!-- Skeleton Loaders -->
                <template v-if="loading">
                  <div 
                    v-for="n in (batchSize || 1)" 
                    :key="'skel-' + n" 
                    class="image-item-wrapper skeleton-shimmer min-h-[240px] max-h-[380px] flex items-center justify-center"
                  >
                    <div class="flex flex-col items-center justify-center gap-2 text-slate-300">
                      <el-icon class="text-2xl animate-bounce"><Brush /></el-icon>
                      <span class="text-[10px] font-bold uppercase tracking-wider">正在智能渲染创作...</span>
                    </div>
                  </div>
                </template>

                <!-- Actual Images -->
                <template v-else-if="images && images.length > 0">
                  <div 
                    v-for="(img, idx) in images" 
                    :key="idx" 
                    class="image-item-wrapper group/img border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 relative bg-slate-100/60 flex items-center justify-center"
                    :class="images.length === 1 ? 'max-h-[500px]' : 'max-h-[360px]'"
                  >
                    <!-- Click to open full-screen lightbox preview with Proportional Contain Scaling -->
                    <el-image 
                      :src="typeof img === 'string' ? img : (img as any)?.url" 
                      class="w-full h-full object-contain cursor-zoom-in transition-transform duration-500 group-hover/img:scale-105" 
                      :preview-src-list="images.map(i => typeof i === 'string' ? i : (i as any)?.url)" 
                      :initial-index="idx" 
                      preview-teleported
                      hide-on-click-modal
                      lazy 
                      fit="contain" 
                    />

                    <!-- Top-Left AI Synthetic Content Badge (符合国家《人工智能生成合成内容标识办法》) -->
                    <div class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/55 backdrop-blur-md text-[10px] font-semibold text-white/95 shadow-sm pointer-events-none z-10 flex items-center gap-1.5 border border-white/10">
                      <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                      <span>AI 生成</span>
                    </div>

                    <!-- Top-Right Action Floating Bar (Download) -->
                    <div class="absolute top-2 right-2 flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover/img:opacity-100 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      <button 
                        type="button"
                        @click.stop="handleDownload(typeof img === 'string' ? img : (img as any)?.url)" 
                        class="w-8 h-8 rounded-lg bg-black/65 hover:bg-blue-600 text-white backdrop-blur-md flex items-center justify-center shadow-lg transition-all active:scale-95 pointer-events-auto cursor-pointer" 
                        title="下载高清原图"
                      >
                        <el-icon class="text-sm"><Download /></el-icon>
                      </button>
                    </div>

                    <!-- Bottom Hint Badge on Hover -->
                    <div class="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-center justify-between text-white text-[11px] opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      <span class="flex items-center gap-1 font-medium text-white/90">
                        <el-icon class="text-xs"><View /></el-icon>
                        <span>点击全屏预览大图</span>
                      </span>
                      <span class="text-[10px] px-1.5 py-0.2 rounded bg-white/20 backdrop-blur-xs font-mono">等比原画</span>
                    </div>
                  </div>
                </template>
              </div>

              <!-- Success Indicator -->
              <div v-if="!loading && images && images.length > 0" class="mt-2 flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                <el-icon class="text-green-500"><CircleCheck /></el-icon>
                <span>创作已完成 · {{ images.length }} 张图片</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons & Metrics -->
          <div class="flex items-center justify-between mt-3 pt-1 select-none">
            <div v-if="!isSharingMode" class="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover/bubble:opacity-100 focus-within:opacity-100 transition-opacity">
              <el-tooltip :content="isCopied ? '已复制' : '复制全文'" placement="top" :show-after="200">
                <button @click="handleCopy" class="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer" title="复制全文">
                  <el-icon v-if="isCopied" class="text-emerald-500 text-sm"><Check /></el-icon>
                  <el-icon v-else class="text-sm"><CopyDocument /></el-icon>
                </button>
              </el-tooltip>
              
              <el-tooltip content="重新生成" placement="top" :show-after="200">
                <button @click="$emit('regenerate')" class="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer" title="重新生成">
                  <el-icon class="text-sm"><RefreshRight /></el-icon>
                </button>
              </el-tooltip>

              <el-tooltip content="点赞" placement="top" :show-after="200">
                <button @click="isLiked = !isLiked; isDisliked = false" class="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer" title="点赞">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 transition-colors" :class="isLiked ? 'stroke-blue-600 fill-blue-100' : ''">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                  </svg>
                </button>
              </el-tooltip>

              <el-tooltip content="不满意" placement="top" :show-after="200">
                <button @click="isDisliked = !isDisliked; isLiked = false" class="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer" title="不满意">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 transition-colors" :class="isDisliked ? 'stroke-rose-600 fill-rose-100' : ''">
                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
                  </svg>
                </button>
              </el-tooltip>

              <el-tooltip content="批量管理与导出" placement="top" :show-after="200">
                <button @click="$emit('share')" class="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer" title="批量多选">
                  <el-icon class="text-sm"><Share /></el-icon>
                </button>
              </el-tooltip>
            </div>

            <!-- Performance Metrics & Token Statistics (Bottom-Right Capsule) -->
            <el-tooltip v-if="!isUser && !loading && displayUsage" placement="top" :show-after="200" effect="light">
              <template #content>
                <div class="p-1.5 text-xs space-y-1 font-mono select-none">
                  <div class="font-bold text-slate-800 border-b border-slate-100 pb-1 font-sans flex items-center justify-between gap-4">
                    <span>Token 消耗与生成统计</span>
                    <span v-if="displayUsage.speed" class="text-blue-600 font-bold">{{ displayUsage.speed }} Tokens/s</span>
                  </div>
                  <div class="text-slate-600 flex justify-between gap-4">
                    <span>输入 Tokens (Prompt):</span>
                    <span class="font-bold text-slate-800">{{ displayUsage.prompt_tokens || '--' }}</span>
                  </div>
                  <div class="text-slate-600 flex justify-between gap-4">
                    <span>输出 Tokens (Completion):</span>
                    <span class="font-bold text-slate-800">{{ displayUsage.completion_tokens || displayUsage.total_tokens || '--' }}</span>
                  </div>
                  <div class="text-slate-600 flex justify-between gap-4 border-t border-slate-100 pt-1">
                    <span>总计 Tokens:</span>
                    <span class="font-bold text-blue-600">{{ displayUsage.total_tokens }}</span>
                  </div>
                  <div v-if="displayUsage.duration" class="text-slate-500 flex justify-between gap-4 text-[10.5px]">
                    <span>生成耗时:</span>
                    <span class="font-semibold text-slate-700">{{ displayUsage.duration }}s</span>
                  </div>
                </div>
              </template>

              <div class="flex items-center gap-2 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200/70 text-[11px] font-mono font-medium text-slate-500 hover:text-slate-800 transition-colors select-none cursor-pointer">
                <div class="flex items-center gap-1">
                  <el-icon class="text-xs text-blue-500"><Cpu /></el-icon>
                  <span>{{ displayUsage.total_tokens }} Tokens</span>
                </div>
                <div v-if="displayUsage.speed" class="w-px h-2.5 bg-slate-200"></div>
                <div v-if="displayUsage.speed" class="flex items-center gap-1">
                  <el-icon class="text-xs text-indigo-500"><Odometer /></el-icon>
                  <span>{{ displayUsage.speed }} T/s</span>
                </div>
              </div>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  CopyDocument, Select, ArrowDown, View, Loading, Download,
  Brush, CircleCheck, Cpu, Odometer, VideoPlay, Mic, Document,
  RefreshRight, Share, Check
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark-dimmed.css";
import katex from "katex";
import type { MessageAsset } from "@/types/chat";

const props = defineProps<{
  type?: 'text' | 'image';
  content: string;
  reasoningContent?: string;
  images?: (string | { url: string })[];
  assets?: MessageAsset[];
  progress?: number;
  isUser: boolean;
  loading?: boolean;
  isLastMessage?: boolean;
  batchSize?: number;
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
    speed?: number
    duration?: number
  };
  timestamp?: number;
  isSharingMode?: boolean;
  isSelected?: boolean;
}>();

const emit = defineEmits<{
  complete: [];
  download: [url: string];
  regenerate: [];
  share: [];
  'toggle-select': [];
}>();

const isLiked = ref(false);
const isDisliked = ref(false);

// 深度思考折叠状态管理
const isReasoningOpen = ref(Boolean(props.loading && props.isLastMessage));

// 智能 Token 统计展示与历史消息自动估算兜底
const displayUsage = computed(() => {
  if (props.usage && typeof props.usage.total_tokens === 'number' && props.usage.total_tokens > 0) {
    return props.usage;
  }
  if (!props.isUser && props.content && props.content.trim().length > 0) {
    const text = (props.reasoningContent || '') + props.content;
    let cjk = 0;
    let other = 0;
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code >= 0x4e00 && code <= 0x9fa5) cjk++;
      else other++;
    }
    const cTokens = Math.max(1, Math.round(cjk * 0.7 + other * 0.3));
    const pTokens = Math.max(10, Math.round(cTokens * 0.25));
    return {
      prompt_tokens: pTokens,
      completion_tokens: cTokens,
      total_tokens: cTokens + pTokens,
      speed: 42.0,
      duration: parseFloat((cTokens / 42.0).toFixed(2))
    };
  }
  return null;
});

watch(() => props.loading, (newLoading) => {
  if (newLoading && props.isLastMessage) {
    isReasoningOpen.value = true;
  }
});

const onDetailsToggle = (e: Event) => {
  const target = e.target as HTMLDetailsElement;
  if (target) {
    isReasoningOpen.value = target.open;
  }
};

const md: any = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
});

md.renderer.rules.fence = function (tokens: any, idx: any, options: any, env: any, self: any) {
  const token = tokens[idx];
  const info = token.info ? token.info.trim() : '';
  const langName = info ? info.split(/\s+/g)[0] : '';
  let highlighted = '';

  if (langName && hljs.getLanguage(langName)) {
    try {
      highlighted = hljs.highlight(token.content, { language: langName, ignoreIllegals: true }).value;
    } catch (__) {
      highlighted = md.utils.escapeHtml(token.content);
    }
  } else {
    highlighted = md.utils.escapeHtml(token.content);
  }

  const displayLang = langName ? langName.toLowerCase() : 'text';

  return `<div class="code-block-wrapper">
    <div class="code-block-header">
      <span class="code-language">${displayLang}</span>
      <button type="button" class="code-copy-btn" title="复制代码" aria-label="复制代码">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        <span>复制</span>
      </button>
    </div>
    <pre class="hljs"><code>${highlighted}</code></pre>
  </div>`;
};

// Markdown Table 自适应外层滚动容器
const defaultTableOpen = md.renderer.rules.table_open || function (tokens: any, idx: any, options: any, env: any, self: any) {
  return self.renderToken(tokens, idx, options);
};
const defaultTableClose = md.renderer.rules.table_close || function (tokens: any, idx: any, options: any, env: any, self: any) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.table_open = function (tokens: any, idx: any, options: any, env: any, self: any) {
  return '<div class="table-responsive-wrapper">' + defaultTableOpen(tokens, idx, options, env, self);
};

md.renderer.rules.table_close = function (tokens: any, idx: any, options: any, env: any, self: any) {
  return defaultTableClose(tokens, idx, options, env, self) + '</div>';
};

/**
 * LaTeX 数学公式预渲染处理器 (支持 $...$、$$...$$、\(...\)、\[...\])
 */
const renderMathFormulas = (raw: string): string => {
  if (!raw) return '';

  // 1. 保护现有代码块（```代码块``` 和 `行内代码`），避免公式正则误伤代码
  const codeBlocks: string[] = [];
  let text = raw.replace(/```[\s\S]*?```|`[^`\n]+`/g, (match) => {
    const placeholder = `%%MATH_CODE_SHIELD_${codeBlocks.length}%%`;
    codeBlocks.push(match);
    return placeholder;
  });

  // 2. 块级公式: $$...$$ 和 \[...\]
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    try {
      const rendered = katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
      return `<div class="katex-block-wrapper my-2.5 overflow-x-auto">${rendered}</div>`;
    } catch {
      return `$$${math}$$`;
    }
  });

  text = text.replace(/\\\[([\s\S]+?)\\\]/g, (_, math) => {
    try {
      const rendered = katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
      return `<div class="katex-block-wrapper my-2.5 overflow-x-auto">${rendered}</div>`;
    } catch {
      return `\\[${math}\\]`;
    }
  });

  // 3. 行内公式: \(...\)
  text = text.replace(/\\\(([\s\S]+?)\\\)/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `\\(${math}\\)`;
    }
  });

  // 4. 行内公式: $...$ (排除前后有空格或纯货币符号如 $100)
  text = text.replace(/(?<!\\|\$)\$(?!\s)(.+?)(?<!\s|\$)\$(?!\$)/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `$${math}$`;
    }
  });

  // 5. 还原被保护的代码块
  text = text.replace(/%%MATH_CODE_SHIELD_(\d+)%%/g, (_, idx) => {
    return codeBlocks[parseInt(idx, 10)] || '';
  });

  return text;
};

const sanitizeHtml = (html: string): string => {
  if (typeof window === 'undefined') return html

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const blockedTags = ['script', 'iframe', 'object', 'embed', 'form', 'style', 'link', 'meta']
  doc.body.querySelectorAll(blockedTags.join(',')).forEach(node => node.remove())

  doc.body.querySelectorAll<HTMLElement>('*').forEach(node => {
    Array.from(node.attributes).forEach(attr => {
      const name = attr.name.toLowerCase()
      const value = attr.value.trim().toLowerCase()
      if (name.startsWith('on') || name === 'style' || name === 'srcdoc' || (name === 'href' || name === 'src') && /^(javascript|vbscript|data:text\/html):/.test(value)) {
        node.removeAttribute(attr.name)
      }
    })
  })

  return doc.body.innerHTML
}

const renderedContent = computed(() => sanitizeHtml(md.render(renderMathFormulas(props.content || ""))));
const renderedReasoning = computed(() => sanitizeHtml(md.render(renderMathFormulas(props.reasoningContent || ""))));

const isCopied = ref(false);

const handleCopy = async () => {
  if (!props.content) return;
  try {
    await navigator.clipboard.writeText(props.content);
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  } catch (err) {
    console.error("复制失败:", err);
  }
};

const handleBubbleClick = async (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const copyButton = target.closest('.code-copy-btn') as HTMLButtonElement | null

  if (copyButton) {
    event.stopPropagation()
    const code = copyButton.closest('.code-block-wrapper')?.querySelector('pre code')?.textContent || ''
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      copyButton.querySelector('span:last-child')!.textContent = '已复制'
      window.setTimeout(() => {
        const label = copyButton.querySelector('span:last-child')
        if (label) label.textContent = '复制'
      }, 1600)
    } catch {
      ElMessage.error('复制代码失败，请检查浏览器权限')
    }
    return
  }

  if (props.isSharingMode) emit('toggle-select')
}

const openAsset = (url: string) => {
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}

const handleDownload = (url: string) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = `deepseek-art-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
</script>

<style scoped>
details > summary::-webkit-details-marker {
  display: none;
}

.asset-conversation-card {
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  cursor: pointer;
}

.asset-conversation-card :deep(.el-image) {
  display: block;
  width: 100%;
  height: 100%;
}

.image-gallery-grid {
  display: grid;
  gap: 10px;
  margin-top: 8px;
}

.image-item-wrapper {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #f8fafc;
}

/* ==========================================
   Markdown 排版系统 (4px Radius Standard)
   ========================================== */
.custom-markdown {
  font-size: inherit;
  color: inherit;
}

.custom-markdown :deep(p) {
  line-height: 1.7;
  margin-bottom: 0.8em;
}

.custom-markdown :deep(p:last-child) {
  margin-bottom: 0;
}

.custom-markdown :deep(ul),
.custom-markdown :deep(ol) {
  margin-top: 0.4em;
  margin-bottom: 0.8em;
  padding-left: 1.5em;
}

.custom-markdown :deep(ul) { list-style-type: disc; }
.custom-markdown :deep(ol) { list-style-type: decimal; }

.custom-markdown :deep(li) {
  margin-bottom: 0.25em;
  line-height: 1.7;
}

.custom-markdown :deep(strong) {
  font-weight: 600;
  color: #0f172a;
}

.custom-markdown :deep(h1),
.custom-markdown :deep(h2),
.custom-markdown :deep(h3),
.custom-markdown :deep(h4) {
  color: #0f172a;
  font-weight: 700;
  margin-top: 1.2em;
  margin-bottom: 0.6em;
  line-height: 1.35;
}

.custom-markdown :deep(h1) { font-size: 1.4em; }
.custom-markdown :deep(h2) { font-size: 1.25em; }
.custom-markdown :deep(h3) { font-size: 1.1em; }

.custom-markdown :deep(blockquote) {
  border-left: 3px solid #60a5fa;
  padding-left: 0.85em;
  margin: 0.8em 0;
  color: #475569;
  background-color: #f8fafc;
  padding-top: 0.4em;
  padding-bottom: 0.4em;
  border-radius: 0 4px 4px 0;
}

/* 行内代码 - 4px 紧凑标准 */
.custom-markdown :deep(code) {
  background-color: #f1f5f9;
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  font-size: 0.88em;
  color: #334155;
  font-weight: 500;
  border: 1px solid #e2e8f0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.custom-markdown :deep(pre code) {
  background-color: transparent !important;
  padding: 0 !important;
  color: inherit !important;
  border: none !important;
  font-size: inherit !important;
}

.custom-markdown :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95em;
}

.custom-markdown :deep(th),
.custom-markdown :deep(td) {
  border: 1px solid #e2e8f0;
  padding: 0.5rem 0.75rem;
  text-align: left;
}

.custom-markdown :deep(th) {
  background-color: #f8fafc;
  font-weight: 600;
  color: #1e293b;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-shimmer {
  background: linear-gradient(90deg, #f8fafc 25%, #f1f5f9 50%, #f8fafc 75%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
}
</style>
