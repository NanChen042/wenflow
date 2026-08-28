<template>
  <el-drawer v-model="visible" title="问流 AI · 批处理与文件数据中心" :size="isMobile ? '100%' : '720px'" direction="rtl" :destroy-on-close="false" class="batch-center-drawer">
    <template #header>
      <div class="flex items-center justify-between pr-4">
        <div>
          <h2 class="text-base font-bold text-slate-800 flex items-center gap-2">
            <el-icon class="text-blue-600">
              <Operation />
            </el-icon>
            <span>批处理与文件中心 (Batch & Files)</span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">支持大规模异步离线推理、半价算力任务提交与云端数据管理</p>
        </div>
        <div class="flex items-center gap-2">
          <button @click="siliconBatchService.downloadSampleJsonlFile()" class="px-2.5 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200/80 rounded-md font-medium flex items-center gap-1 transition-colors" title="下载官方标准的 /v1/chat/completions JSONL 任务模板">
            <el-icon class="text-xs">
              <Document />
            </el-icon>
            <span>示例模板</span>
          </button>
          <button @click="refreshCurrentTab" class="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors" :class="{ 'animate-spin': loading }" title="刷新数据">
            <el-icon class="text-sm">
              <Refresh />
            </el-icon>
          </button>
        </div>
      </div>
    </template>

    <div class="h-full flex flex-col -mt-2">
      <!-- Tabs Header -->
      <div class="flex items-center gap-2 border-b border-slate-200 pb-2.5 mb-4">
        <button @click="activeTab = 'tasks'" class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5" :class="activeTab === 'tasks' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'">
          <el-icon class="text-xs">
            <Tickets />
          </el-icon>
          <span>批处理任务 ({{ batches.length }})</span>
        </button>
        <button @click="activeTab = 'files'" class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5" :class="activeTab === 'files' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'">
          <el-icon class="text-xs">
            <Folder />
          </el-icon>
          <span>云端文件 ({{ files.length }})</span>
        </button>
        <button @click="activeTab = 'create'" class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ml-auto" :class="activeTab === 'create' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'">
          <el-icon class="text-xs">
            <Plus />
          </el-icon>
          <span>新建 Batch 任务</span>
        </button>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto custom-scrollbar pr-1">

        <!-- ==================== TAB 1: 批处理任务列表 ==================== -->
        <div v-if="activeTab === 'tasks'" class="space-y-3">
          <!-- Loading State -->
          <div v-if="loading && batches.length === 0" class="py-12 text-center text-slate-400 text-xs">
            <el-icon class="is-loading text-lg mb-2">
              <Loading />
            </el-icon>
            <div>正在加载批处理任务...</div>
          </div>

          <!-- Empty State -->
          <div v-else-if="batches.length === 0" class="py-16 text-center text-slate-400">
            <el-icon class="text-4xl text-slate-300 mb-2">
              <Tickets />
            </el-icon>
            <p class="text-sm font-medium text-slate-600">暂无任何批处理任务</p>
            <p class="text-xs text-slate-400 mt-1">上传 .jsonl 文件并创建任务，即可享受官方 50% 折扣异步吞吐</p>
            <button @click="activeTab = 'create'" class="mt-4 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg shadow-2xs transition-colors">
              创建首个任务
            </button>
          </div>

          <!-- Batch List Cards -->
          <div v-for="batch in batches" :key="batch.id" class="p-3.5 bg-white border border-slate-200/80 hover:border-slate-300 rounded-lg shadow-2xs transition-all space-y-2.5">
            <!-- Card Header -->
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-xs font-bold text-slate-800 truncate" :title="batch.id">{{ batch.id }}</span>
                  <button @click="copyText(batch.id)" class="text-slate-400 hover:text-slate-700 text-[11px]" title="复制任务 ID">
                    <el-icon>
                      <CopyDocument />
                    </el-icon>
                  </button>
                  <!-- Status Badge -->
                  <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0" :class="getStatusBadgeClass(batch.status)">
                    {{ getStatusLabel(batch.status) }}
                  </span>
                </div>
                <div class="text-[11px] text-slate-400 flex items-center gap-3 mt-1 font-mono">
                  <span>端点: {{ batch.endpoint }}</span>
                  <span>交付窗口: {{ batch.completion_window }}</span>
                  <span>创建: {{ formatTime(batch.created_at) }}</span>
                </div>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <div class="flex items-center justify-between text-[11px] mb-1 font-mono">
                <span class="text-slate-500 font-medium">执行进度 ({{ getProgressPercent(batch) }}%)</span>
                <span class="text-slate-700 font-bold">
                  {{ batch.request_counts?.completed || 0 }} / {{ batch.request_counts?.total || 0 }} 请求
                  <span v-if="batch.request_counts?.failed > 0" class="text-red-500 font-normal">({{ batch.request_counts.failed }} 失败)</span>
                </span>
              </div>
              <div class="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                <div class="h-full transition-all duration-300 rounded-full" :class="batch.status === 'completed' ? 'bg-emerald-500' : (batch.status === 'failed' ? 'bg-red-500' : 'bg-blue-600')" :style="{ width: `${getProgressPercent(batch)}%` }"></div>
              </div>
            </div>

            <!-- Action Bar -->
            <div class="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
              <div class="text-[11px] text-slate-400 truncate">
                <span v-if="batch.metadata?.description">{{ batch.metadata.description }}</span>
                <span v-else>输入文件: {{ batch.input_file_id }}</span>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <!-- Download Output Result -->
                <button v-if="batch.output_file_id" @click="downloadOutput(batch.output_file_id, `batch_result_${batch.id}.jsonl`)" class="px-2 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded text-[11px] font-medium flex items-center gap-1 transition-colors" title="下载批处理结果 JSONL">
                  <el-icon>
                    <Download />
                  </el-icon>
                  <span>下载结果</span>
                </button>

                <!-- Download Error Log -->
                <button v-if="batch.error_file_id" @click="downloadOutput(batch.error_file_id, `batch_error_${batch.id}.jsonl`)" class="px-2 py-1 text-red-700 bg-red-50 hover:bg-red-100 rounded text-[11px] font-medium flex items-center gap-1 transition-colors" title="下载错误详情">
                  <el-icon>
                    <Warning />
                  </el-icon>
                  <span>错误详情</span>
                </button>

                <!-- Cancel Batch Action -->
                <button v-if="batch.status === 'in_progress' || batch.status === 'validating'" @click="cancelBatchTask(batch.id)" class="px-2 py-1 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded text-[11px] font-medium transition-colors">
                  取消任务
                </button>

                <!-- Details Button -->
                <button @click="openBatchDetail(batch)" class="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded text-[11px] font-medium transition-colors">
                  详情
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== TAB 2: 云端文件列表 ==================== -->
        <div v-else-if="activeTab === 'files'" class="space-y-4">
          <!-- Upload Area -->
          <div @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false" @drop.prevent="handleFileDrop" class="border-2 border-dashed rounded-lg p-5 text-center transition-all cursor-pointer" :class="isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'" @click="triggerFileUpload">
            <input ref="fileInputRef" type="file" accept=".jsonl,.txt" class="hidden" @change="onFileSelected" />
            <el-icon class="text-3xl text-slate-400 mb-2">
              <UploadFilled />
            </el-icon>
            <p class="text-xs font-semibold text-slate-700">点击或将 .jsonl 任务文件拖拽至此处上传</p>
            <p class="text-[11px] text-slate-400 mt-1">支持标准 OpenAI / SiliconFlow 批处理 JSONL 格式文件</p>
          </div>

          <!-- Files Table -->
          <div class="space-y-2">
            <div class="text-xs font-semibold text-slate-500 px-1">已上传的文件 ({{ files.length }})</div>

            <div v-if="loading && files.length === 0" class="py-8 text-center text-slate-400 text-xs">
              <el-icon class="is-loading text-base mb-1">
                <Loading />
              </el-icon>
              <div>正在拉取文件列表...</div>
            </div>

            <div v-else-if="files.length === 0" class="py-8 text-center text-slate-400 text-xs">
              暂无已上传的云端文件
            </div>

            <div v-for="file in files" :key="file.id" class="p-3 bg-white border border-slate-200/80 rounded-lg hover:border-slate-300 shadow-2xs flex items-center justify-between gap-3 transition-all">
              <div class="flex items-center gap-2.5 min-w-0 flex-1">
                <div class="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <el-icon>
                    <Document />
                  </el-icon>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-bold text-xs text-slate-800 truncate" :title="file.filename">{{ file.filename }}</div>
                  <div class="text-[10.5px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                    <span>{{ formatBytes(file.bytes) }}</span>
                    <span>•</span>
                    <span>用途: {{ file.purpose }}</span>
                    <span>•</span>
                    <span>{{ formatTime(file.created_at) }}</span>
                  </div>
                </div>
              </div>

              <!-- File Actions -->
              <div class="flex items-center gap-1.5 shrink-0">
                <button @click="createBatchFromFile(file.id)" class="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold transition-colors flex items-center gap-1" title="以此文件为输入创建 Batch 任务">
                  <el-icon>
                    <Plus />
                  </el-icon>
                  <span>创建任务</span>
                </button>
                <button @click="deleteFile(file.id)" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="删除云端文件">
                  <el-icon class="text-xs">
                    <Delete />
                  </el-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== TAB 3: 新建 Batch 任务向导 ==================== -->
        <div v-else-if="activeTab === 'create'" class="space-y-4 p-1">
          <div class="bg-blue-50/60 border border-blue-100 rounded-lg p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
            <el-icon class="text-blue-600 text-base shrink-0 mt-0.5">
              <InfoFilled />
            </el-icon>
            <div>
              <div class="font-bold text-blue-900 mb-0.5">批处理任务说明</div>
              <p class="leading-relaxed">
                批处理任务将在 24 小时内异步执行完毕，并在云端生成对应的结果文件。适合大量长文本分析、代码批量处理或多条数据集并行评测。
              </p>
            </div>
          </div>

          <!-- Form: Input File -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>输入任务文件 (JSONL File) *</span>
              <button @click="siliconBatchService.downloadSampleJsonlFile()" class="text-blue-600 hover:underline font-normal text-[11px]">
                下载示例模板
              </button>
            </label>
            <el-select v-model="createForm.input_file_id" placeholder="请选择已上传的云端任务文件" class="w-full" size="large">
              <el-option v-for="f in validFiles" :key="f.id" :label="`${f.filename || f.id} (${formatBytes(f.bytes || 0)})`" :value="f.id">
                <div class="flex items-center justify-between text-xs w-full">
                  <span class="font-medium truncate">{{ f.filename || f.id }}</span>
                  <span class="text-slate-400 font-mono text-[10px]">{{ f.id }}</span>
                </div>
              </el-option>
            </el-select>
            <div class="text-[11px] text-slate-400">
              若列表中无文件，可前往【云端文件】选项卡上传新的 .jsonl 文件。
            </div>
          </div>

          <!-- Form: Endpoint -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700">目标 API 端点 (Endpoint) *</label>
            <el-select v-model="createForm.endpoint" placeholder="选择执行端点" class="w-full" size="large">
              <el-option label="/v1/chat/completions (聊天与文本对话)" value="/v1/chat/completions" />
              <el-option label="/v1/embeddings (文本向量化)" value="/v1/embeddings" />
            </el-select>
          </div>

          <!-- Form: Completion Window -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700">交付窗口 (Completion Window)</label>
            <el-input v-model="createForm.completion_window" disabled size="large" />
            <div class="text-[11px] text-slate-400">目前固定为 24h 异步交付窗口。</div>
          </div>

          <!-- Form: Description / Metadata -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700">任务备注 / 描述 (可选)</label>
            <el-input v-model="createForm.description" placeholder="例如：500条用户评价情感分类评测" size="large" />
          </div>

          <!-- Submit Button -->
          <div class="pt-3">
            <button @click="submitCreateBatch" :disabled="submitting || !createForm.input_file_id" class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2">
              <el-icon v-if="submitting" class="is-loading">
                <Loading />
              </el-icon>
              <span>{{ submitting ? '正在提交任务...' : '立即提交 Batch 任务' }}</span>
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- ==================== Task Detail Dialog ==================== -->
    <el-dialog 
      v-model="detailDialogVisible" 
      width="92%" 
      style="max-width: 560px"
      append-to-body 
      align-center 
      class="wenflow-unified-dialog"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 shadow-2xs">
            <el-icon class="text-lg"><Tickets /></el-icon>
          </div>
          <div>
            <h3 class="font-bold text-base text-slate-900 leading-snug">批处理任务详情</h3>
            <p class="text-xs text-slate-400 mt-0.5">查看离线批处理任务的执行状态与输入输出文件</p>
          </div>
        </div>
      </template>

      <div v-if="selectedBatch" class="space-y-3 text-xs py-1">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono">
          <div><span class="text-slate-400">任务 ID:</span> <span class="font-bold text-slate-800 break-all">{{ selectedBatch.id }}</span></div>
          <div><span class="text-slate-400">状态:</span> <span class="font-bold text-slate-800">{{ selectedBatch.status }}</span></div>
          <div class="break-all"><span class="text-slate-400">输入文件:</span> {{ selectedBatch.input_file_id }}</div>
          <div><span class="text-slate-400">端点:</span> {{ selectedBatch.endpoint }}</div>
          <div><span class="text-slate-400">总请求数:</span> {{ selectedBatch.request_counts?.total || 0 }}</div>
          <div><span class="text-slate-400">已完成数:</span> {{ selectedBatch.request_counts?.completed || 0 }}</div>
          <div><span class="text-slate-400">失败请求:</span> {{ selectedBatch.request_counts?.failed || 0 }}</div>
          <div><span class="text-slate-400">创建时间:</span> {{ formatTime(selectedBatch.created_at) }}</div>
        </div>

        <div v-if="selectedBatch.output_file_id" class="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center justify-between">
          <div class="min-w-0 flex-1 mr-2">
            <div class="font-bold text-emerald-800">输出结果文件已生成</div>
            <div class="text-[11px] font-mono text-emerald-600 truncate">{{ selectedBatch.output_file_id }}</div>
          </div>
          <button @click="downloadOutput(selectedBatch.output_file_id, `batch_result_${selectedBatch.id}.jsonl`)" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold text-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer">
            <el-icon><Download /></el-icon>
            <span>下载结果</span>
          </button>
        </div>

        <div v-if="selectedBatch.error_file_id" class="p-3 bg-red-50/70 border border-red-200 rounded-lg flex items-center justify-between">
          <div class="min-w-0 flex-1 mr-2">
            <div class="font-bold text-red-800">存在错误记录文件</div>
            <div class="text-[11px] font-mono text-red-600 truncate">{{ selectedBatch.error_file_id }}</div>
          </div>
          <button @click="downloadOutput(selectedBatch.error_file_id, `batch_error_${selectedBatch.id}.jsonl`)" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold text-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer">
            <el-icon><Download /></el-icon>
            <span>下载错误报告</span>
          </button>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end pt-2 border-t border-slate-100">
          <button 
            @click="detailDialogVisible = false" 
            class="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
          >
            关闭
          </button>
        </div>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import {
  Operation, Document, Refresh, Tickets, Folder, Plus, CopyDocument, Download,
  Warning, UploadFilled, Delete, InfoFilled, Loading
} from '@element-plus/icons-vue'
import {
  siliconBatchService,
  SiliconBatchItem,
  SiliconFileItem
} from '@/services/batchService'
import { ElMessage, ElMessageBox } from 'element-plus'

const visible = ref(false)
const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
const activeTab = ref<'tasks' | 'files' | 'create'>('tasks')
const loading = ref(false)
const submitting = ref(false)
const isDragging = ref(false)

const batches = ref<SiliconBatchItem[]>([])
const files = ref<SiliconFileItem[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)

const validFiles = computed(() => {
  return (files.value || []).filter(f => f && f.id && typeof f.id === 'string' && f.id.trim().length > 0)
})

// Detail dialog
const detailDialogVisible = ref(false)
const selectedBatch = ref<SiliconBatchItem | null>(null)

// Create form state
const createForm = reactive({
  input_file_id: '',
  endpoint: '/v1/chat/completions',
  completion_window: '24h',
  description: ''
})

const open = () => {
  visible.value = true
  loadData()
}

const loadData = async () => {
  loading.value = true
  try {
    const [bList, fList] = await Promise.allSettled([
      siliconBatchService.fetchBatches(),
      siliconBatchService.fetchFiles()
    ])
    if (bList.status === 'fulfilled') {
      batches.value = bList.value
    } else {
      ElMessage.error(`批处理任务加载失败：${bList.reason?.message || '请检查 API Key 和网络连接'}`)
    }
    if (fList.status === 'fulfilled') {
      files.value = fList.value
    } else {
      ElMessage.error(`云端文件加载失败：${fList.reason?.message || '请检查 API Key 和网络连接'}`)
    }
  } catch (e: any) {
    ElMessage.error(e.message || '拉取数据失败')
  } finally {
    loading.value = false
  }
}

const refreshCurrentTab = () => {
  loadData()
}

const triggerFileUpload = () => {
  fileInputRef.value?.click()
}

const onFileSelected = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  await uploadFileCore(file)
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const handleFileDrop = async (e: DragEvent) => {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) {
    await uploadFileCore(file)
  }
}

const uploadFileCore = async (file: File) => {
  loading.value = true
  try {
    const res = await siliconBatchService.uploadFile(file, 'batch')
    ElMessage.success(`文件 ${file.name} 上传成功`)
    await loadData()
    // Auto select uploaded file for creation
    createForm.input_file_id = res.id
  } catch (e: any) {
    ElMessage.error(e.message || '上传文件失败')
  } finally {
    loading.value = false
  }
}

const deleteFile = async (fileId: string) => {
  try {
    await ElMessageBox.confirm('确定要从云端删除该文件吗？若有正在运行的 Batch 任务依赖该文件可能受到影响。', '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    loading.value = true
    await siliconBatchService.deleteFile(fileId)
    ElMessage.success('文件已删除')
    await loadData()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '删除文件失败')
    }
  } finally {
    loading.value = false
  }
}

const createBatchFromFile = (fileId: string) => {
  createForm.input_file_id = fileId
  activeTab.value = 'create'
}

const submitCreateBatch = async () => {
  if (!createForm.input_file_id) {
    ElMessage.warning('请选择输入文件')
    return
  }
  submitting.value = true
  try {
    const metadata = createForm.description ? { description: createForm.description } : undefined
    await siliconBatchService.createBatch(
      createForm.input_file_id,
      createForm.endpoint,
      createForm.completion_window,
      metadata
    )
    ElMessage.success('Batch 任务创建成功，已提交至云端集群排队')
    createForm.description = ''
    activeTab.value = 'tasks'
    await loadData()
  } catch (e: any) {
    ElMessage.error(e.message || '提交任务失败')
  } finally {
    submitting.value = false
  }
}

const cancelBatchTask = async (batchId: string) => {
  try {
    await ElMessageBox.confirm('确定要取消该 Batch 任务吗？已处理的部分将保留，未执行的请求将被终止。', '取消任务', {
      confirmButtonText: '确定取消',
      cancelButtonText: '返回',
      type: 'warning'
    })
    loading.value = true
    await siliconBatchService.cancelBatch(batchId)
    ElMessage.success('任务取消请求已发出')
    await loadData()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '取消任务失败')
    }
  } finally {
    loading.value = false
  }
}

const downloadOutput = (fileId: string, filename: string) => {
  siliconBatchService.downloadFileContent(fileId, filename)
}

const openBatchDetail = (batch: SiliconBatchItem) => {
  selectedBatch.value = batch
  detailDialogVisible.value = true
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请检查浏览器剪贴板权限')
  }
}

// Helpers
const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    validating: '校验中',
    in_progress: '执行中',
    finalizing: '结算中',
    completed: '已完成',
    failed: '失败',
    expired: '已过期',
    cancelling: '正在取消',
    cancelled: '已取消'
  }
  return map[status] || status
}

const getStatusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    validating: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    in_progress: 'bg-blue-50 text-blue-700 border border-blue-200/80',
    finalizing: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80',
    completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    failed: 'bg-red-50 text-red-700 border border-red-200/80',
    expired: 'bg-slate-100 text-slate-500 border border-slate-200/60',
    cancelling: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    cancelled: 'bg-slate-100 text-slate-500 border border-slate-200/60'
  }
  return map[status] || 'bg-slate-100 text-slate-700'
}

const getProgressPercent = (batch: SiliconBatchItem) => {
  const total = batch.request_counts?.total || 0
  const completed = batch.request_counts?.completed || 0
  if (total === 0) return batch.status === 'completed' ? 100 : 0
  return Math.round((completed / total) * 100)
}

const formatBytes = (bytes: number) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const formatTime = (timestamp: number) => {
  if (!timestamp) return '-'
  const d = new Date(timestamp * 1000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

defineExpose({
  open
})
</script>

<style scoped>
:deep(.batch-center-drawer .el-drawer__body) {
  padding: 16px 20px;
}
</style>
