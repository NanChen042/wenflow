<script setup lang="ts">
import { ref, computed } from 'vue'
import { Refresh, TopRight } from '@element-plus/icons-vue'
import type { QuickPrompt, PromptCategory } from '@/config/quickPrompts'
import { quickPrompts, promptCategories } from '@/config/quickPrompts'

withDefaults(defineProps<{
  density?: 'home' | 'chat'
}>(), {
  density: 'chat'
})

const emit = defineEmits<{
  select: [prompt: QuickPrompt]
}>()

const activeCategory = ref<PromptCategory>('all')
const pageIndex = ref(0)
const pageSize = 6
const isRotating = ref(false)

// 根据分类过滤热词
const filteredPrompts = computed(() => {
  if (activeCategory.value === 'all') {
    return quickPrompts
  }
  return quickPrompts.filter(item => item.category === activeCategory.value)
})

// 当前展示的 6 个热词卡片（3 列 x 2 行，支持平滑换一批轮询）
const visiblePrompts = computed(() => {
  const list = filteredPrompts.value
  if (list.length <= pageSize) return list
  
  const start = (pageIndex.value * pageSize) % list.length
  const result: QuickPrompt[] = []
  for (let i = 0; i < pageSize; i++) {
    result.push(list[(start + i) % list.length])
  }
  return result
})

// 切换分类
const selectCategory = (cat: PromptCategory) => {
  activeCategory.value = cat
  pageIndex.value = 0
}

// 换一批热词
const handleRefresh = () => {
  isRotating.value = true
  pageIndex.value++
  setTimeout(() => {
    isRotating.value = false
  }, 350)
}

const selectPrompt = (prompt: QuickPrompt) => {
  emit('select', prompt)
}
</script>

<template>
  <div class="w-full max-w-3xl mx-auto select-none">
    <!-- Header: 极简纯净分类 Tabs + 换一批 -->
    <div class="flex items-center justify-between gap-3 mb-3.5 px-0.5">
      <!-- 纯文本极简分类胶囊 -->
      <div class="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
        <button
          v-for="cat in promptCategories"
          :key="cat.key"
          @click="selectCategory(cat.key)"
          type="button"
          class="px-3 py-1 rounded-full text-xs transition-all duration-150 shrink-0 cursor-pointer font-medium"
          :class="activeCategory === cat.key
            ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200/90 shadow-2xs'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 border border-transparent'"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- 换一批 (极简文字 + 旋转图标) -->
      <button
        v-if="filteredPrompts.length > pageSize"
        @click="handleRefresh"
        type="button"
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer active:scale-95 border border-transparent hover:border-slate-200/60"
        title="换一批灵感"
      >
        <el-icon class="text-xs transition-transform duration-350" :class="{ 'rotate-180': isRotating }">
          <Refresh />
        </el-icon>
        <span class="text-[11.5px] font-medium hidden sm:inline">换一批</span>
      </button>
    </div>

    <!-- 灵感热词卡片矩阵: 6 卡现代网格 (3列 x 2行) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
      <div
        v-for="item in visiblePrompts"
        :key="item.id"
        @click="selectPrompt(item)"
        class="group relative flex flex-col justify-between p-3.5 rounded-lg border border-slate-200/80 bg-white/80 hover:bg-white hover:border-blue-300 hover:shadow-[0_4px_16px_rgba(37,99,235,0.05)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer active:scale-[0.99] text-left"
      >
        <!-- Top: 统一中性灰 Tag + 悬浮亮起微交互箭头 -->
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[10px] font-medium text-slate-500 bg-slate-100/90 border border-slate-200/60 px-1.5 py-0.5 rounded-sm tracking-tight group-hover:text-blue-600 group-hover:bg-blue-50/70 group-hover:border-blue-100 transition-colors">
            {{ item.tag }}
          </span>

          <el-icon class="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-xs">
            <TopRight />
          </el-icon>
        </div>

        <!-- Middle: Title -->
        <h4 class="font-semibold text-xs text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1 leading-snug">
          {{ item.title }}
        </h4>

        <!-- Bottom: Description -->
        <p class="text-[11px] text-slate-400 group-hover:text-slate-500 mt-1 line-clamp-1 leading-normal transition-colors">
          {{ item.description }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rotate-180 {
  transform: rotate(180deg);
}
</style>

