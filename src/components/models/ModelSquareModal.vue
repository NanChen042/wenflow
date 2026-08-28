<template>
  <div 
    v-if="visible" 
    class="fixed inset-0 z-[2000] flex items-center justify-center p-0 md:p-4 bg-slate-900/60 transition-opacity duration-150 select-none"
    @click.self="close"
  >
    <!-- Main Modal Window (Full-screen on Mobile, Floating Luxury Card on Desktop) -->
    <div 
      class="w-full h-full md:h-[88vh] md:max-h-[860px] md:max-w-[1440px] bg-white rounded-none md:rounded-xl shadow-2xl border-0 md:border md:border-slate-200 flex flex-col overflow-hidden text-slate-800 animate-in fade-in duration-150"
    >
      <!-- Top Navigation & Control Bar -->
      <header class="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 sm:gap-4 shrink-0 shadow-2xs">
        <!-- Row 1 on mobile, Left section on Desktop: Brand Logo + Title + Mobile Actions -->
        <div class="flex items-center justify-between md:justify-start gap-2.5 min-w-0">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-white p-0.5 flex items-center justify-center shadow-xs border border-indigo-100/80 shrink-0">
              <img :src="wenflowLogo" class="w-full h-full object-contain" alt="WenFlow" />
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 sm:gap-2">
                <h2 class="font-bold text-xs sm:text-base text-slate-900 tracking-tight truncate">模型全景广场</h2>
                <span class="text-[9.5px] sm:text-[10px] px-1.5 sm:px-2 py-0.2 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-semibold shrink-0">
                  {{ modelsList.length }}+ 模型
                </span>
              </div>
              <p class="text-[10px] sm:text-[11px] text-slate-400 truncate hidden sm:block">
                聚合 DeepSeek、Qwen、Llama 等主流大模型与多模态端点
              </p>
            </div>
          </div>

          <!-- Mobile Only Quick Close & Sync -->
          <div class="flex md:hidden items-center gap-1.5 shrink-0">
            <button 
              @click="syncCloudModels(true)" 
              :disabled="isSyncing"
              class="w-7 h-7 rounded-md bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 text-xs flex items-center justify-center transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              title="从云端拉取最新上架模型"
            >
              <el-icon class="text-xs" :class="{ 'animate-spin': isSyncing }"><Refresh /></el-icon>
            </button>
            <button 
              @click="close"
              class="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              title="关闭 (ESC)"
            >
              <el-icon class="text-sm"><Close /></el-icon>
            </button>
          </div>
        </div>

        <!-- Center on Desktop, Row 2 on Mobile: Search & Filter Toggle -->
        <div class="w-full md:flex-1 md:max-w-xl flex items-center gap-2">
          <!-- Toggle Filter Button -->
          <button
            @click="isFilterSidebarOpen = !isFilterSidebarOpen"
            class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs cursor-pointer"
            :class="isFilterSidebarOpen ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200'"
          >
            <el-icon class="text-xs"><Operation /></el-icon>
            <span class="text-xs">{{ isFilterSidebarOpen ? '收起筛选' : '筛选器' }}</span>
            <span v-if="activeFilterCount > 0" class="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
              {{ activeFilterCount }}
            </span>
          </button>

          <!-- Search Input -->
          <div class="flex-1 flex items-center bg-slate-50 hover:bg-slate-100/70 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 border border-slate-200 rounded-lg px-2.5 sm:px-3 h-8 sm:h-9 shadow-2xs transition-all min-w-0">
            <el-icon class="text-slate-400 text-xs sm:text-sm shrink-0 mr-1.5 pointer-events-none"><Search /></el-icon>
            <input 
              v-model="searchQuery" 
              placeholder="搜索 500+ 模型 (如 DeepSeek, Qwen, 4o)..."
              class="w-full h-full bg-transparent text-xs text-slate-800 placeholder-slate-400 border-none outline-none focus:outline-none focus:ring-0 focus:border-none p-0 min-w-0 shadow-none !ring-0 !outline-none"
              style="outline: none !important; box-shadow: none !important; border: none !important;"
            />
            <button 
              v-if="searchQuery" 
              @click="searchQuery = ''"
              class="text-slate-400 hover:text-slate-600 text-xs p-1 ml-1 cursor-pointer flex items-center justify-center shrink-0"
              title="清空搜索"
            >
              <el-icon><Close /></el-icon>
            </button>
          </div>
        </div>

        <!-- Far Right on Desktop: Balance + Sync + Close Button -->
        <div class="hidden md:flex items-center gap-2 shrink-0">
          <div v-if="userBalance" class="flex items-center gap-1.5 px-3 py-1 bg-blue-50/60 rounded-md text-xs border border-blue-100 font-mono">
            <span class="text-slate-500">余额:</span>
            <span class="font-bold text-blue-700">{{ userBalance.currency }} {{ userBalance.balance }}</span>
          </div>

          <button 
            @click="syncCloudModels(true)" 
            :disabled="isSyncing"
            class="px-2.5 py-1.5 rounded-md bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            title="从云端拉取最新上架模型"
          >
            <el-icon class="text-xs" :class="{ 'animate-spin': isSyncing }"><Refresh /></el-icon>
            <span>同步云端</span>
          </button>

          <button 
            @click="close"
            class="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer ml-1"
            title="关闭 (ESC)"
          >
            <el-icon class="text-base"><Close /></el-icon>
          </button>
        </div>
      </header>

      <!-- Main Body: Filter Sidebar + Cards Grid -->
      <div class="flex-1 flex overflow-hidden relative">
        <!-- Mobile Filter Backdrop -->
        <div 
          v-if="isFilterSidebarOpen" 
          class="md:hidden fixed inset-0 bg-slate-900/40 z-30 transition-opacity"
          @click="isFilterSidebarOpen = false"
        ></div>

        <!-- Left Collapsible Filter Sidebar (Smooth Slide & Width Transition) -->
        <aside 
          class="fixed md:relative inset-y-0 left-0 z-40 md:z-auto shrink-0 bg-white md:bg-slate-50/70 border-r border-slate-200 overflow-hidden flex flex-col transition-all duration-300 ease-in-out shadow-2xl md:shadow-none"
          :class="isFilterSidebarOpen ? 'w-[270px] md:w-[230px] opacity-100' : 'w-0 !border-r-0 opacity-0 pointer-events-none'"
        >
          <div class="w-[270px] md:w-[230px] p-3.5 overflow-y-auto custom-scrollbar flex flex-col gap-3.5 text-xs h-full">
            <!-- Active Filter Reset -->
            <div class="flex items-center justify-between pb-1.5 border-b border-slate-200">
              <span class="font-bold text-slate-800 text-xs">多维筛选器</span>
              <button 
                v-if="hasActiveFilters" 
                @click="resetFilters" 
                class="text-xs text-blue-600 hover:text-blue-700 hover:underline font-semibold cursor-pointer"
              >
                重置全部
              </button>
            </div>

            <!-- 0. 聚合服务平台 (Platform) -->
            <div class="space-y-1">
              <div class="font-bold text-[10.5px] text-slate-400 uppercase tracking-wider">聚合平台</div>
              <div class="grid grid-cols-1 gap-1.5">
                <button
                  v-for="plat in platformOptions"
                  :key="plat.value"
                  @click="selectedPlatform = selectedPlatform === plat.value ? 'all' : plat.value"
                  class="px-2.5 py-1.5 rounded-lg border text-left font-medium transition-all duration-150 cursor-pointer flex items-center justify-between"
                  :class="selectedPlatform === plat.value ? 'bg-blue-50 text-blue-700 border-blue-300/90 shadow-2xs font-semibold' : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200/80'"
                >
                  <div class="truncate text-[11px]">{{ plat.label }}</div>
                  <span class="text-[9.5px] font-mono" :class="selectedPlatform === plat.value ? 'text-blue-600 font-bold' : 'text-slate-400'">{{ getPlatformCount(plat.value) }}</span>
                </button>
              </div>
            </div>

            <!-- 1. 价格计费 (官方 0 元与计费) -->
            <div class="space-y-1">
              <div class="font-bold text-[10.5px] text-slate-400 uppercase tracking-wider">价格计费</div>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  v-for="p in priceOptions"
                  :key="p.value"
                  @click="selectedPrice = selectedPrice === p.value ? 'all' : p.value"
                  class="px-2 py-1.5 rounded-lg border text-left font-medium transition-all duration-150 cursor-pointer"
                  :class="selectedPrice === p.value ? 'bg-blue-50 text-blue-700 border-blue-300/90 shadow-2xs font-semibold' : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200/80'"
                >
                  <div class="truncate text-[11px]">{{ p.label }}</div>
                </button>
              </div>
            </div>

            <!-- 2. 类型 (Type) -->
            <div class="space-y-1">
              <div class="font-bold text-[10.5px] text-slate-400 uppercase tracking-wider">类型</div>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  v-for="t in typeOptions"
                  :key="t.value"
                  @click="selectedType = selectedType === t.value ? 'all' : t.value"
                  class="px-2 py-1.5 rounded-lg border text-left font-medium transition-all duration-150 cursor-pointer"
                  :class="selectedType === t.value ? 'bg-blue-50 text-blue-700 border-blue-300/90 shadow-2xs font-semibold' : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200/80'"
                >
                  <div class="truncate text-[11px]">{{ t.label }}</div>
                </button>
              </div>
            </div>

            <!-- 3. 标签 (Tags) -->
            <div class="space-y-1">
              <div class="font-bold text-[10.5px] text-slate-400 uppercase tracking-wider">能力标签</div>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  v-for="tag in tagOptions"
                  :key="tag"
                  @click="toggleTag(tag)"
                  class="px-2 py-1.5 rounded-lg border text-left font-medium transition-all duration-150 cursor-pointer"
                  :class="selectedTags.includes(tag) ? 'bg-blue-50 text-blue-700 border-blue-300/90 shadow-2xs font-semibold' : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200/80'"
                >
                  <div class="truncate text-[11px]">{{ tag }}</div>
                </button>
              </div>
            </div>

            <!-- 4. 系列 / 厂商 (Provider) -->
            <div class="space-y-1">
              <div class="font-bold text-[10.5px] text-slate-400 uppercase tracking-wider">系列 / 厂商</div>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  v-for="p in providerOptions"
                  :key="p"
                  @click="selectedProvider = selectedProvider === p ? 'all' : p"
                  class="px-2 py-1.5 rounded-lg border text-left font-medium transition-all duration-150 truncate cursor-pointer"
                  :class="selectedProvider === p ? 'bg-blue-50 text-blue-700 border-blue-300/90 shadow-2xs font-semibold' : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200/80'"
                >
                  <div class="truncate text-[11px]">{{ p }}</div>
                </button>
              </div>
            </div>

            <!-- 5. 上下文长度 (Context Window) -->
            <div class="space-y-1">
              <div class="font-bold text-[10.5px] text-slate-400 uppercase tracking-wider">上下文长度</div>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  v-for="ctx in contextOptions"
                  :key="ctx.value"
                  @click="selectedContext = selectedContext === ctx.value ? 'all' : ctx.value"
                  class="px-2 py-1.5 rounded-lg border text-left font-medium transition-all duration-150 cursor-pointer"
                  :class="selectedContext === ctx.value ? 'bg-blue-50 text-blue-700 border-blue-300/90 shadow-2xs font-semibold' : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200/80'"
                >
                  <div class="truncate text-[11px]">{{ ctx.label }}</div>
                </button>
              </div>
            </div>

            <!-- 6. 规格 / 参数量 (Model Scale) -->
            <div class="space-y-1">
              <div class="font-bold text-[10.5px] text-slate-400 uppercase tracking-wider">模型规模</div>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  v-for="scale in scaleOptions"
                  :key="scale.value"
                  @click="selectedScale = selectedScale === scale.value ? 'all' : scale.value"
                  class="px-2 py-1.5 rounded-lg border text-left font-medium transition-all duration-150 cursor-pointer"
                  :class="selectedScale === scale.value ? 'bg-blue-50 text-blue-700 border-blue-300/90 shadow-2xs font-semibold' : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200/80'"
                >
                  <div class="truncate text-[11px]">{{ scale.label }}</div>
                </button>
              </div>
            </div>
          </div>
        </aside>

        <!-- Right Main: Cards Grid Container -->
        <main class="flex-1 flex flex-col p-4 sm:p-5 overflow-hidden bg-slate-50/30">
          <!-- Top Stats Bar -->
          <div class="flex items-center justify-between mb-3 text-xs text-slate-500 shrink-0">
            <div class="flex items-center gap-2 flex-wrap min-w-0">
              <span>共找到 <span class="font-bold text-slate-800 font-mono">{{ filteredModels.length }}</span> 个可用模型端点</span>
              <span v-if="activeFilterCount > 0" class="text-blue-600 font-medium">
                (已启用 {{ activeFilterCount }} 项筛选)
              </span>
            </div>
            <div class="flex items-center gap-1.5 text-[11px] text-slate-500 shrink-0">
              <span class="hidden sm:inline">当前默认模型:</span>
              <button 
                @click="locateDefaultModel"
                class="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold font-mono border border-blue-200 transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                title="点击一键直接筛选定位默认模型"
              >
                <span>⭐ {{ configStore.config.defaultModel }}</span>
              </button>
            </div>
          </div>

          <!-- Shimmer Skeleton Screen (Instant Beautiful Loading) -->
          <div 
            v-if="isSyncing && modelsList.length === 0" 
            class="flex-1 overflow-hidden p-1.5 pt-2 pb-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            <div 
              v-for="i in 9" 
              :key="i"
              class="bg-white rounded-lg p-4 border border-slate-200/70 animate-pulse flex flex-col justify-between h-[210px] shadow-2xs"
            >
              <div>
                <div class="flex items-start gap-3 mb-3">
                  <div class="w-9 h-9 rounded-md bg-slate-200 shrink-0"></div>
                  <div class="flex-1 space-y-2">
                    <div class="w-3/5 h-4 bg-slate-200 rounded"></div>
                    <div class="w-2/5 h-2.5 bg-slate-100 rounded"></div>
                  </div>
                  <div class="w-12 h-5 bg-slate-100 rounded"></div>
                </div>
                <div class="space-y-1.5 my-3">
                  <div class="w-full h-3 bg-slate-100 rounded"></div>
                  <div class="w-4/5 h-3 bg-slate-100 rounded"></div>
                </div>
                <div class="flex gap-2 my-2">
                  <div class="w-12 h-4 bg-slate-100 rounded-sm"></div>
                  <div class="w-14 h-4 bg-slate-100 rounded-sm"></div>
                  <div class="w-10 h-4 bg-slate-100 rounded-sm"></div>
                </div>
              </div>
              <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div class="w-16 h-3 bg-slate-100 rounded"></div>
                <div class="flex gap-2">
                  <div class="w-14 h-6 bg-slate-100 rounded-md"></div>
                  <div class="w-18 h-6 bg-slate-200 rounded-md"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredModels.length === 0" class="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <div class="w-12 h-12 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <el-icon class="text-xl"><Search /></el-icon>
            </div>
            <div class="font-bold text-sm text-slate-700 mb-1">未匹配到符合条件的模型</div>
            <div class="text-xs text-slate-400 max-w-sm mb-4">请尝试清除部分筛选条件或更换搜索关键词。</div>
            <button @click="resetFilters" class="px-4 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer">
              清空所有筛选条件
            </button>
          </div>

          <!-- Cards Grid with Virtual Scrolling / Incremental Pagination -->
          <div 
            v-else
            ref="cardsScrollContainerRef"
            @scroll="handleCardsScroll"
            class="flex-1 overflow-y-auto custom-scrollbar p-1.5 pt-2 pb-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch content-start"
          >
            <div 
              v-for="model in displayedModels" 
              :key="model.id"
              @click="openPriceDetail(model)"
              class="group relative bg-white rounded-xl p-4 transition-all duration-200 hover:shadow-[0_10px_24px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
              :class="isCurrentActiveModel(model.value) 
                ? 'border border-blue-500 bg-gradient-to-b from-blue-50/40 via-white to-white ring-2 ring-blue-500/20 shadow-md shadow-blue-500/5' 
                : 'border border-slate-200/80 hover:border-slate-300 hover:shadow-md hover:bg-white'"
            >
              <!-- Card Top: Brand Avatar + Full Title + Badges -->
              <div>
                <div class="flex items-start gap-3 mb-2">
                  <BrandLogo 
                    :provider="model.provider" 
                    :model-id="model.id" 
                    size="md" 
                    class="mt-0.5 group-hover:scale-105 transition-transform"
                  />

                  <div class="min-w-0 flex-1">
                    <div class="flex items-start justify-between gap-1.5">
                      <div class="min-w-0 flex-1">
                        <h3 class="font-bold text-[13.5px] text-slate-900 leading-snug group-hover:text-blue-600 transition-colors" :title="model.id">
                          {{ formatModelDisplayName(model.id) || model.label }}
                        </h3>
                        <div class="text-[10px] font-mono text-slate-400 truncate mt-0.5" :title="model.id">
                          {{ model.id }}
                        </div>
                      </div>

                      <!-- Status Badges: Active / New / Free -->
                      <div class="flex items-center gap-1 shrink-0 pt-0.5">
                        <span v-if="isCurrentActiveModel(model.value)" class="text-[9.5px] px-2 py-0.5 rounded-md font-bold bg-blue-600 text-white shadow-2xs">使用中</span>
                        <span v-if="model.isNew" class="text-[9.5px] px-1.5 py-0.2 rounded-md font-bold bg-rose-500 text-white tracking-wide uppercase">New</span>
                        <span v-if="model.isFree" class="text-[9.5px] px-1.5 py-0.2 rounded-md font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">免费 ¥0</span>
                      </div>
                    </div>

                    <!-- Metadata Capsule Row -->
                    <div class="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <span class="font-medium text-slate-700">{{ model.provider || '官方开源' }}</span>
                      <span class="text-slate-300">·</span>
                      <span class="px-1.5 py-0.5 rounded-md text-[9.5px] font-semibold tracking-wide"
                        :class="isOpenRouterItem(model) ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'">
                        {{ isOpenRouterItem(model) ? 'OpenRouter' : 'SiliconFlow' }}
                      </span>
                      <span v-if="model.contextWindow" class="px-1.5 py-0.5 rounded-md text-[9.5px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                        {{ model.contextWindow }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Description -->
                <p class="text-[11.5px] text-slate-600 leading-relaxed my-2 line-clamp-2">
                  {{ model.desc }}
                </p>

                <!-- Tags Row -->
                <div class="flex items-center gap-1.5 flex-wrap my-2">
                  <span 
                    v-for="t in (model.tags || (model.tag ? [model.tag] : []))" 
                    :key="t"
                    class="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60 font-medium"
                  >
                    {{ t }}
                  </span>
                </div>
              </div>

              <!-- Card Bottom -->
              <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto" @click.stop>
                <button @click.stop="openPriceDetail(model)" class="text-[11.5px] text-slate-500 hover:text-blue-600 flex items-center gap-0.5 transition-colors cursor-pointer font-medium">
                  <span>参数详情</span>
                  <el-icon class="text-[10px]"><ArrowRight /></el-icon>
                </button>

                <div class="flex items-center gap-1.5">
                  <button 
                    @click.stop="setAsDefaultModel(model)"
                    class="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                    :class="configStore.config.defaultModel === model.id ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'"
                    :title="configStore.config.defaultModel === model.id ? '当前全局默认模型' : '设为全局默认模型'"
                  >
                    {{ configStore.config.defaultModel === model.id ? '已默认' : '设为默认' }}
                  </button>

                  <button 
                    @click.stop="selectModel(model)"
                    class="px-3 py-1 rounded-lg text-[11px] transition-all cursor-pointer shadow-2xs active:scale-95"
                    :class="isCurrentActiveModel(model.value) 
                      ? 'bg-blue-50 text-blue-600 border border-blue-200/80 font-bold cursor-default' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs'"
                  >
                    {{ isCurrentActiveModel(model.value) ? '当前选用' : '选用此模型' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Bottom Loading / End Status Indicator across full grid width -->
            <div class="col-span-full py-4 text-center text-xs text-slate-400 select-none">
              <div v-if="displayLimit < filteredModels.length" class="flex items-center justify-center gap-2 text-blue-600 font-medium">
                <el-icon class="animate-spin text-sm"><Refresh /></el-icon>
                <span>下滑自动加载更多模型 (已呈现 {{ displayedModels.length }} / {{ filteredModels.length }})...</span>
              </div>
              <div v-else-if="filteredModels.length > 24" class="text-slate-400">
                ✓ 已展示全部 {{ filteredModels.length }} 款可用模型端点
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>

    <!-- Detail Dialog Modal (Unified Floating Spec Card) -->
    <div 
      v-if="selectedDetailModel"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
      @click.self="selectedDetailModel = null"
    >
      <div class="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <!-- Header -->
        <div class="p-5 pb-3 border-b border-slate-100 flex items-start justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <BrandLogo 
              :provider="selectedDetailModel.provider" 
              :model-id="selectedDetailModel.id" 
              size="lg" 
            />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="font-bold text-base text-slate-900 leading-tight">
                  {{ formatModelDisplayName(selectedDetailModel.id) || selectedDetailModel.label }}
                </h3>
                <el-icon @click="copyText(selectedDetailModel.id)" class="text-xs text-slate-400 hover:text-slate-700 cursor-pointer" title="复制端点 ID"><CopyDocument /></el-icon>
                <span v-if="selectedDetailModel.isNew" class="text-[9.5px] px-1.5 py-0.2 rounded-sm font-bold bg-rose-500 text-white tracking-wide uppercase">New</span>
                <span v-if="selectedDetailModel.isFree" class="text-[9.5px] px-1.5 py-0.2 rounded-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">免费 ¥0</span>
              </div>
              <div class="text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                <span class="font-mono">{{ selectedDetailModel.id }}</span>
                <span>·</span>
                <span>{{ selectedDetailModel.provider }}</span>
                <span>·</span>
                <span class="px-1.5 py-0.2 rounded-sm text-[9.5px] font-semibold"
                  :class="isOpenRouterItem(selectedDetailModel) ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'">
                  {{ isOpenRouterItem(selectedDetailModel) ? 'OpenRouter' : 'SiliconFlow' }}
                </span>
              </div>
            </div>
          </div>
          <button @click="selectedDetailModel = null" class="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 cursor-pointer">
            <el-icon class="text-base"><Close /></el-icon>
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="p-5 space-y-4 overflow-y-auto custom-scrollbar text-xs flex-1">
          <!-- Description with Expand/Collapse -->
          <div>
            <p class="text-slate-600 leading-relaxed text-[11.5px]" :class="{ 'line-clamp-2': !isDescExpanded }">
              {{ selectedDetailModel.desc }}
            </p>
            <button 
              v-if="selectedDetailModel.desc && selectedDetailModel.desc.length > 60" 
              @click="isDescExpanded = !isDescExpanded"
              class="text-blue-600 hover:underline text-[11px] font-medium mt-1 cursor-pointer"
            >
              {{ isDescExpanded ? '收起' : '展开' }}
            </button>
          </div>

          <!-- Tags Row -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <span 
              v-for="t in (selectedDetailModel.tags || (selectedDetailModel.tag ? [selectedDetailModel.tag] : []))" 
              :key="t"
              class="px-2 py-0.5 rounded-sm bg-slate-100 text-slate-600 border border-slate-200/60 font-medium"
            >
              {{ t }}
            </span>
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex items-center gap-2 pt-1">
            <button 
              @click="selectModel(selectedDetailModel); selectedDetailModel = null"
              class="flex-1 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <span>在线体验此模型</span>
            </button>
            <a 
              :href="isOpenRouterItem(selectedDetailModel) ? `https://openrouter.ai/models/${selectedDetailModel.id}` : 'https://cloud.siliconflow.cn/models'" 
              target="_blank"
              class="flex-1 py-2 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
            >
              <el-icon class="text-xs"><Document /></el-icon>
              <span>{{ isOpenRouterItem(selectedDetailModel) ? 'OpenRouter 官方模型主页' : '官网 API 文档与计费中心' }}</span>
            </a>
          </div>

          <!-- Technical Specs -->
          <div class="pt-2">
            <div class="font-bold text-xs text-slate-800 mb-2 flex items-center gap-1.5">
              <el-icon class="text-blue-600"><Cpu /></el-icon>
              <span>模型规格与技术参数</span>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div class="p-2.5 bg-slate-50 rounded-md border border-slate-200/70">
                <div class="text-slate-400 text-[10.5px]">上下文长度 (Context Window)</div>
                <div class="font-bold text-slate-900 font-mono mt-0.5">{{ selectedDetailModel.contextWindow || '32K' }} Tokens</div>
              </div>
              <div class="p-2.5 bg-slate-50 rounded-md border border-slate-200/70">
                <div class="text-slate-400 text-[10.5px]">模型规模 (Parameter Scale)</div>
                <div class="font-bold text-slate-900 font-mono mt-0.5">{{ selectedDetailModel.paramScale || '全参数架构' }}</div>
              </div>
              <div class="p-2.5 bg-slate-50 rounded-md border border-slate-200/70">
                <div class="text-slate-400 text-[10.5px]">模型提供方 (Provider)</div>
                <div class="font-bold text-slate-900 mt-0.5">{{ selectedDetailModel.provider }}</div>
              </div>
              <div class="p-2.5 bg-slate-50 rounded-md border border-slate-200/70">
                <div class="text-slate-400 text-[10.5px]">计费类型 (Billing Type)</div>
                <div class="font-bold mt-0.5" :class="selectedDetailModel.isFree ? 'text-emerald-600 font-semibold' : 'text-slate-900'">
                  {{ selectedDetailModel.pricingText || (selectedDetailModel.isFree ? '官方 0 元免费模型' : '官方标准计费模型') }}
                </div>
              </div>
            </div>
          </div>

          <!-- Official Pricing & Billing Query Card (No Guesswork, Direct to Official Console) -->
          <div class="pt-1">
            <div class="rounded-md border border-blue-100 bg-blue-50/40 p-3.5 space-y-2.5">
              <div class="flex items-center gap-2 text-blue-900 font-bold text-xs">
                <el-icon class="text-blue-600"><Document /></el-icon>
                <span>官方价格与计费标准说明</span>
              </div>
              <p class="text-slate-600 text-[11.5px] leading-relaxed">
                模型价格会根据云端算力调度、批量优惠与限时活动动态调配。各模型均支持即开即用、按 Token 吞吐实时计费或享受 0 元免费额度。
              </p>
              <div class="pt-1 flex items-center gap-2">
                <button 
                  @click="selectModel(selectedDetailModel); selectedDetailModel = null"
                  class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                >
                  <span>立即在对话中调用</span>
                  <el-icon class="text-xs"><ArrowRight /></el-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <button 
            @click="setAsDefaultModel(selectedDetailModel)"
            class="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            {{ configStore.config.defaultModel === selectedDetailModel.id ? '当前全局默认' : '设为全局默认' }}
          </button>
          <button 
            @click="selectModel(selectedDetailModel); selectedDetailModel = null"
            class="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            立即选用此模型
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, markRaw } from 'vue'
import { 
  Operation, Search, Refresh, Close, Check, ArrowRight, CopyDocument,
  Cpu, Aim, Lightning, Document, VideoPlay, Picture, Brush
} from '@element-plus/icons-vue'
import wenflowLogo from '@/assets/images/wenflow.png'
import { 
  SiliconModelItem, 
  OFFICIAL_SILICON_MODELS, 
  siliconModelsService, 
  UserAccountInfo,
  formatModelDisplayName
} from '@/services/modelsService'
import { 
  openRouterService, 
  BUILTIN_OPENROUTER_MODELS 
} from '@/services/openrouterService'
import BrandLogo from '@/components/common/BrandLogo.vue'
import { supportsImageInput } from '@/services/modelCapabilities'
import { useChatStore } from '@/stores/chat'
import { useConfigStore } from '@/stores/config'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  modelValue?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  'select': [modelId: string]
}>()

const chatStore = useChatStore()
const configStore = useConfigStore()

const visible = ref(false)
const isFilterSidebarOpen = ref(typeof window !== 'undefined' ? window.innerWidth >= 768 : true)
const isSyncing = ref(false)
const searchQuery = ref('')
const selectedDetailModel = ref<SiliconModelItem | null>(null)
const userBalance = ref<UserAccountInfo | null>(null)
const openRouterCredits = ref<{ totalCredits: number; totalUsage: number } | null>(null)

// Models State (聚合 SiliconFlow 与 OpenRouter 内置模型)
const modelsList = ref<SiliconModelItem[]>([...OFFICIAL_SILICON_MODELS, ...BUILTIN_OPENROUTER_MODELS])

// Filters State
const selectedPlatform = ref<string>('all')    // 'all' | 'siliconflow' | 'openrouter'
const selectedPrice = ref<string>('all')       // 'all' | 'free' | 'paid'
const selectedType = ref<string>('all')        // 'all' | 'chat' | 'image' | 'video' | 'audio'
const selectedProvider = ref<string>('all')    // 'all' | 'DeepSeek' | 'Google' ...
const selectedTags = ref<string[]>([])         // ['视觉', 'MoE', '推理模型'...]
const selectedContext = ref<string>('all')     // 'all' | '8k' | '32k' | '128k' | '1m'
const selectedScale = ref<string>('all')       // 'all' | '<10b' | '10-50b' | '50-100b' | '>100b'

// Options Definitions
const platformOptions = [
  { label: '全部聚合平台', value: 'all' },
  { label: '硅基流动 (SiliconFlow)', value: 'siliconflow' },
  { label: 'OpenRouter 全球模型', value: 'openrouter' }
]

const priceOptions = [
  { label: '全部计费', value: 'all' },
  { label: '免费专区 (¥0)', value: 'free' },
  { label: '计费模型', value: 'paid' }
]

const typeOptions = [
  { label: '全部类型', value: 'all' },
  { label: '对话模型', value: 'chat' },
  { label: '生图工坊', value: 'image' },
  { label: '多模态视觉', value: 'vl' }
]

const tagOptions = [
  '视觉', 'MoE', '推理模型', 'Tools', 'Coder', 'Math', 'FIM'
]

const providerOptions = [
  'DeepSeek', 'Qwen', 'Google', 'Anthropic', 'OpenAI', 'Meta', 'Mistral', '智谱', 'Microsoft', 'Kimi', 'MiniMax', '快手可图', 'BlackForest', 'StabilityAI', '字节跳动', '美团', '电信星辰', '百川', '书生浦语', '零一万物', 'xAI'
]

const contextOptions = [
  { label: '全部窗口', value: 'all' },
  { label: '≥ 32K', value: '32k' },
  { label: '≥ 128K', value: '128k' },
  { label: '≥ 1M', value: '1m' }
]

const scaleOptions = [
  { label: '全部规格', value: 'all' },
  { label: '10B 以下', value: '<10b' },
  { label: '10 ~ 50B', value: '10-50b' },
  { label: '50 ~ 100B', value: '50-100b' },
  { label: '100B 以上', value: '>100b' }
]

// Icon Map
const iconMap: Record<string, any> = {
  Cpu: markRaw(Cpu),
  Aim: markRaw(Aim),
  Lightning: markRaw(Lightning),
  Document: markRaw(Document),
  VideoPlay: markRaw(VideoPlay),
  Picture: markRaw(Picture),
  Brush: markRaw(Brush)
}

const getIcon = (name?: string) => iconMap[name || 'Cpu'] || iconMap.Cpu

const isCurrentActiveModel = (val: string) => {
  return chatStore.currentModel === val || chatStore.activeSession?.model === val
}

const hasActiveFilters = computed(() => {
  return selectedPlatform.value !== 'all' ||
    selectedPrice.value !== 'all' ||
    selectedType.value !== 'all' ||
    selectedProvider.value !== 'all' ||
    selectedTags.value.length > 0 ||
    selectedContext.value !== 'all' ||
    selectedScale.value !== 'all' ||
    searchQuery.value.trim().length > 0
})

const activeFilterCount = computed(() => {
  let count = 0
  if (selectedPlatform.value !== 'all') count++
  if (selectedPrice.value !== 'all') count++
  if (selectedType.value !== 'all') count++
  if (selectedProvider.value !== 'all') count++
  if (selectedTags.value.length > 0) count += selectedTags.value.length
  if (selectedContext.value !== 'all') count++
  if (selectedScale.value !== 'all') count++
  return count
})

const resetFilters = () => {
  selectedPlatform.value = 'all'
  selectedPrice.value = 'all'
  selectedType.value = 'all'
  selectedProvider.value = 'all'
  selectedTags.value = []
  selectedContext.value = 'all'
  selectedScale.value = 'all'
  searchQuery.value = ''
}

const toggleTag = (tag: string) => {
  const idx = selectedTags.value.indexOf(tag)
  if (idx > -1) {
    selectedTags.value.splice(idx, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

const isOpenRouterItem = (m: SiliconModelItem) => {
  return m.category.includes('OpenRouter') || 
    m.id.startsWith('openrouter/') || 
    m.id.endsWith(':free') || 
    m.provider === 'Google' || 
    m.provider === 'Anthropic' || 
    m.provider === 'OpenAI' || 
    m.provider === 'Mistral'
}

const getPlatformLabel = (v: string) => platformOptions.find(p => p.value === v)?.label || v
const getPlatformCount = (v: string) => {
  if (v === 'all') return modelsList.value.length
  if (v === 'siliconflow') {
    return modelsList.value.filter(m => !isOpenRouterItem(m)).length
  }
  if (v === 'openrouter') {
    return modelsList.value.filter(m => isOpenRouterItem(m)).length
  }
  return 0
}

const getPriceLabel = (v: string) => priceOptions.find(p => p.value === v)?.label || v
const getTypeLabel = (v: string) => typeOptions.find(t => t.value === v)?.label || v
const getScaleLabel = (v: string) => scaleOptions.find(s => s.value === v)?.label || v

// Filtered Models Logic
const filteredModels = computed(() => {
  let list = modelsList.value
  const query = searchQuery.value.trim().toLowerCase()

  // 0. Platform filter
  if (selectedPlatform.value === 'siliconflow') {
    list = list.filter(m => !isOpenRouterItem(m))
  } else if (selectedPlatform.value === 'openrouter') {
    list = list.filter(m => isOpenRouterItem(m))
  }

  // 1. Keyword search
  if (query) {
    list = list.filter(m => 
      m.id.toLowerCase().includes(query) ||
      m.label.toLowerCase().includes(query) ||
      m.desc.toLowerCase().includes(query) ||
      (m.provider && m.provider.toLowerCase().includes(query)) ||
      (m.tags && m.tags.some(t => t.toLowerCase().includes(query)))
    )
  }

  // 2. Price filter
  if (selectedPrice.value === 'free') {
    list = list.filter(m => m.isFree)
  } else if (selectedPrice.value === 'paid') {
    list = list.filter(m => !m.isFree)
  }

  // 3. Type filter
  if (selectedType.value === 'chat') {
    list = list.filter(m => m.type === 'chat' && !m.tags?.includes('视觉'))
  } else if (selectedType.value === 'image') {
    list = list.filter(m => m.type === 'image')
  } else if (selectedType.value === 'vl') {
    list = list.filter(m => m.supportsImage ?? supportsImageInput(m.value))
  }

  // 4. Provider filter
  if (selectedProvider.value !== 'all') {
    list = list.filter(m => m.provider === selectedProvider.value || m.category.includes(selectedProvider.value))
  }

  // 5. Tags filter (AND logic)
  if (selectedTags.value.length > 0) {
    list = list.filter(m => {
      const modelTags = m.tags || (m.tag ? [m.tag] : [])
      return selectedTags.value.every(st => modelTags.some(mt => mt && mt.includes(st)))
    })
  }

  // 6. Context Window filter
  if (selectedContext.value === '32k') {
    list = list.filter(m => m.contextWindow === '32K' || m.contextWindow === '64K' || m.contextWindow === '128K' || m.contextWindow === '256K' || m.contextWindow === '1M')
  } else if (selectedContext.value === '128k') {
    list = list.filter(m => m.contextWindow === '128K' || m.contextWindow === '256K' || m.contextWindow === '1M')
  } else if (selectedContext.value === '1m') {
    list = list.filter(m => m.contextWindow === '1M')
  }

  // 7. Scale filter
  if (selectedScale.value === '<10b') {
    list = list.filter(m => {
      const match = m.paramScale?.match(/(\d+)B/i)
      return match ? parseInt(match[1], 10) < 10 : false
    })
  } else if (selectedScale.value === '10-50b') {
    list = list.filter(m => {
      const match = m.paramScale?.match(/(\d+)B/i)
      if (!match) return false
      const num = parseInt(match[1], 10)
      return num >= 10 && num <= 50
    })
  } else if (selectedScale.value === '50-100b') {
    list = list.filter(m => {
      const match = m.paramScale?.match(/(\d+)B/i)
      if (!match) return false
      const num = parseInt(match[1], 10)
      return num > 50 && num <= 100
    })
  } else if (selectedScale.value === '>100b') {
    list = list.filter(m => {
      const match = m.paramScale?.match(/(\d+)B/i)
      const tMatch = m.paramScale?.match(/(\d+)T/i)
      if (tMatch) return true
      if (!match) return false
      return parseInt(match[1], 10) > 100
    })
  }

  // 8. 智能置顶排序：优先将「当前会话选用模型」与「全局默认模型」置顶在最前排，用户一打开即见，无需翻找
  const activeModelId = chatStore.currentModel
  const defaultModelId = configStore.config.defaultModel

  return [...list].sort((a, b) => {
    const aIsActive = a.id === activeModelId || a.value === activeModelId
    const bIsActive = b.id === activeModelId || b.value === activeModelId
    if (aIsActive && !bIsActive) return -1
    if (!aIsActive && bIsActive) return 1

    const aIsDefault = a.id === defaultModelId || a.value === defaultModelId
    const bIsDefault = b.id === defaultModelId || b.value === defaultModelId
    if (aIsDefault && !bIsDefault) return -1
    if (!aIsDefault && bIsDefault) return 1

    return 0
  })
})

const PAGE_SIZE = 24
const displayLimit = ref(PAGE_SIZE)
const cardsScrollContainerRef = ref<HTMLElement | null>(null)

const displayedModels = computed(() => {
  return filteredModels.value.slice(0, displayLimit.value)
})

const handleCardsScroll = (e: Event) => {
  const target = e.target as HTMLElement
  if (!target) return
  const { scrollTop, scrollHeight, clientHeight } = target
  if (scrollTop + clientHeight >= scrollHeight - 350) {
    if (displayLimit.value < filteredModels.value.length) {
      displayLimit.value = Math.min(displayLimit.value + PAGE_SIZE, filteredModels.value.length)
    }
  }
}

watch([selectedPlatform, selectedPrice, selectedType, selectedProvider, selectedTags, selectedContext, selectedScale, searchQuery], () => {
  displayLimit.value = PAGE_SIZE
  if (cardsScrollContainerRef.value) {
    cardsScrollContainerRef.value.scrollTop = 0
  }
})

const locateDefaultModel = () => {
  resetFilters()
  searchQuery.value = configStore.config.defaultModel
}

// Actions
const selectModel = (model: SiliconModelItem) => {
  chatStore.switchModel(model.value as any)
  emit('select', model.value)
  ElMessage.success(`已切换选用模型：${formatModelDisplayName(model.id) || model.label}`)
  close()
}

const setAsDefaultModel = (model: SiliconModelItem) => {
  configStore.setDefaultModel(model.id)
  ElMessage.success(`已将【${model.label}】设为全局默认模型`)
}

const openPriceDetail = (model: SiliconModelItem) => {
  selectedDetailModel.value = model
  isDescExpanded.value = false
}

const isDescExpanded = ref(false)

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请检查浏览器剪贴板权限')
  }
}

const syncCloudModels = async (isManual = false) => {
  isSyncing.value = true
  try {
    const sfKey = configStore.config.siliconFlowApiKey
    const orKey = configStore.config.openrouterApiKey

    const [sfRes, orRes] = await Promise.allSettled([
      siliconModelsService.fetchLiveModels(sfKey),
      openRouterService.fetchLiveModels(orKey)
    ])

    const all: SiliconModelItem[] = []
    if (sfRes.status === 'fulfilled' && sfRes.value.items && sfRes.value.items.length > 0) {
      all.push(...sfRes.value.items)
    } else {
      all.push(...OFFICIAL_SILICON_MODELS)
    }

    if (orRes.status === 'fulfilled' && orRes.value.items && orRes.value.items.length > 0) {
      all.push(...orRes.value.items)
    } else {
      all.push(...BUILTIN_OPENROUTER_MODELS)
    }

    const seen = new Set<string>()
    modelsList.value = all.filter(m => {
      if (seen.has(m.id)) return false
      seen.add(m.id)
      return true
    })

    if (configStore.config.openrouterApiKey) {
      openRouterService.fetchUserCredits(configStore.config.openrouterApiKey).then(credits => {
        if (credits) openRouterCredits.value = credits
      })
    }

    // 仅在用户主动点击刷新按钮时才弹出提示，自动挂载时静默刷新
    if (isManual) {
      ElMessage.success(`多平台同步完成：已聚合 ${modelsList.value.length} 款全球模型端点`)
    }
  } catch (e: any) {
    if (isManual) {
      ElMessage.error(`同步异常：${e.message || '网络连接失败'}`)
    }
  } finally {
    isSyncing.value = false
  }
}

const open = () => {
  visible.value = true
  emit('update:modelValue', true)
  isFilterSidebarOpen.value = window.innerWidth >= 768
  siliconModelsService.fetchUserBalance().then(info => {
    if (info) userBalance.value = info
  })
  if (configStore.config.openrouterApiKey) {
    openRouterService.fetchUserCredits(configStore.config.openrouterApiKey).then(credits => {
      if (credits) openRouterCredits.value = credits
    })
  }
  syncCloudModels(false)
}

const close = () => {
  visible.value = false
  emit('update:modelValue', false)
  selectedDetailModel.value = null
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && visible.value) {
    if (selectedDetailModel.value) {
      selectedDetailModel.value = null
    } else {
      close()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

defineExpose({
  open,
  close
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.35);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.6);
}
</style>
