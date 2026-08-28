import { ElMessage } from 'element-plus'

export interface SiliconFileItem {
  id: string
  object: 'file'
  bytes: number
  created_at: number
  filename: string
  purpose: string
  status?: string
}

export interface BatchRequestCounts {
  total: number
  completed: number
  failed: number
}

export interface SiliconBatchItem {
  id: string
  object: 'batch'
  endpoint: string
  input_file_id: string
  completion_window: string
  status: 'validating' | 'failed' | 'in_progress' | 'finalizing' | 'completed' | 'expired' | 'cancelling' | 'cancelled'
  output_file_id?: string | null
  error_file_id?: string | null
  created_at: number
  in_progress_at?: number | null
  expires_at?: number | null
  finalizing_at?: number | null
  completed_at?: number | null
  failed_at?: number | null
  expired_at?: number | null
  cancelling_at?: number | null
  cancelled_at?: number | null
  request_counts: BatchRequestCounts
  metadata?: Record<string, any> | null
}

const SILICON_API_BASE = 'https://api.siliconflow.cn/v1'

class SiliconBatchService {
  private getHeaders(apiKey?: string, isJson: boolean = true) {
    let key = (apiKey || '').trim()
    if (!key) {
      try {
        const raw = localStorage.getItem('deepseek_app_config')
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed.siliconFlowApiKey && parsed.siliconFlowApiKey.trim()) {
            key = parsed.siliconFlowApiKey.trim()
          }
        }
      } catch {}
    }
    if (!key) {
      key = (import.meta.env.VITE_SILICONFLOW_API_KEY || '').trim()
    }
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${key}`
    }
    if (isJson) {
      headers['Content-Type'] = 'application/json'
    }
    return headers
  }

  // ==================== 1. 文件管理接口 ====================

  /**
   * 获取云端已上传的文件列表 (GET /v1/files)
   */
  async fetchFiles(purpose: string = 'batch', apiKey?: string): Promise<SiliconFileItem[]> {
    try {
      const url = purpose ? `${SILICON_API_BASE}/files?purpose=${encodeURIComponent(purpose)}` : `${SILICON_API_BASE}/files`
      const res = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(apiKey, false)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `获取文件列表失败 (${res.status})`)
      }
      const data = await res.json()
      const rawList = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : [])
      return rawList.filter((item: any) => item && typeof item === 'object' && typeof item.id === 'string' && item.id.trim().length > 0)
    } catch (e: any) {
      console.warn('fetchFiles error:', e)
      throw e
    }
  }

  /**
   * 上传本地文件到云端 (POST /v1/files)
   */
  async uploadFile(file: File, purpose: string = 'batch', apiKey?: string): Promise<SiliconFileItem> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('purpose', purpose)

      const res = await fetch(`${SILICON_API_BASE}/files`, {
        method: 'POST',
        headers: this.getHeaders(apiKey, false),
        body: formData
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `文件上传失败 (${res.status})`)
      }
      const data = await res.json()
      return data
    } catch (e: any) {
      console.error('uploadFile error:', e)
      throw e
    }
  }

  /**
   * 删除云端文件 (DELETE /v1/files/{file_id})
   */
  async deleteFile(fileId: string, apiKey?: string): Promise<boolean> {
    try {
      const res = await fetch(`${SILICON_API_BASE}/files/${encodeURIComponent(fileId)}`, {
        method: 'DELETE',
        headers: this.getHeaders(apiKey, false)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `删除文件失败 (${res.status})`)
      }
      return true
    } catch (e: any) {
      console.error('deleteFile error:', e)
      throw e
    }
  }

  /**
   * 下载或读取文件内容 (GET /v1/files/{file_id}/content)
   */
  async downloadFileContent(fileId: string, filename?: string, apiKey?: string): Promise<void> {
    try {
      const res = await fetch(`${SILICON_API_BASE}/files/${encodeURIComponent(fileId)}/content`, {
        method: 'GET',
        headers: this.getHeaders(apiKey, false)
      })
      if (!res.ok) {
        throw new Error(`下载文件内容失败 (${res.status})`)
      }
      const blob = await res.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename || `${fileId}.jsonl`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (e: any) {
      console.error('downloadFileContent error:', e)
      ElMessage.error(e.message || '下载文件失败')
    }
  }

  // ==================== 2. 批处理任务接口 ====================

  /**
   * 获取 Batch 任务列表 (GET /v1/batches)
   */
  async fetchBatches(limit: number = 20, apiKey?: string): Promise<SiliconBatchItem[]> {
    try {
      const res = await fetch(`${SILICON_API_BASE}/batches?limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders(apiKey, false)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `获取批处理列表失败 (${res.status})`)
      }
      const data = await res.json()
      const rawList = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : [])
      return rawList.filter((item: any) => item && typeof item === 'object' && typeof item.id === 'string' && item.id.trim().length > 0)
    } catch (e: any) {
      console.warn('fetchBatches error:', e)
      throw e
    }
  }

  /**
   * 创建新的 Batch 任务 (POST /v1/batches)
   */
  async createBatch(
    inputFileId: string, 
    endpoint: string = '/v1/chat/completions', 
    completionWindow: string = '24h',
    metadata?: Record<string, any>,
    apiKey?: string
  ): Promise<SiliconBatchItem> {
    try {
      const payload: any = {
        input_file_id: inputFileId,
        endpoint: endpoint,
        completion_window: completionWindow
      }
      if (metadata && Object.keys(metadata).length > 0) {
        payload.metadata = metadata
      }

      const res = await fetch(`${SILICON_API_BASE}/batches`, {
        method: 'POST',
        headers: this.getHeaders(apiKey, true),
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `创建 Batch 任务失败 (${res.status})`)
      }
      const data = await res.json()
      return data
    } catch (e: any) {
      console.error('createBatch error:', e)
      throw e
    }
  }

  /**
   * 获取 Batch 任务详情 (GET /v1/batches/{batch_id})
   */
  async getBatchDetails(batchId: string, apiKey?: string): Promise<SiliconBatchItem> {
    try {
      const res = await fetch(`${SILICON_API_BASE}/batches/${encodeURIComponent(batchId)}`, {
        method: 'GET',
        headers: this.getHeaders(apiKey, false)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `获取任务详情失败 (${res.status})`)
      }
      const data = await res.json()
      return data
    } catch (e: any) {
      console.error('getBatchDetails error:', e)
      throw e
    }
  }

  /**
   * 取消正在执行的 Batch 任务 (POST /v1/batches/{batch_id}/cancel)
   */
  async cancelBatch(batchId: string, apiKey?: string): Promise<SiliconBatchItem> {
    try {
      const res = await fetch(`${SILICON_API_BASE}/batches/${encodeURIComponent(batchId)}/cancel`, {
        method: 'POST',
        headers: this.getHeaders(apiKey, true)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `取消任务失败 (${res.status})`)
      }
      const data = await res.json()
      return data
    } catch (e: any) {
      console.error('cancelBatch error:', e)
      throw e
    }
  }

  // ==================== 3. 辅助生成与示例工具 ====================

  /**
   * 生成标准的 JSONL 示例模板内容
   */
  generateSampleJsonl(modelName: string = 'deepseek-ai/DeepSeek-V3'): string {
    const samples = [
      {
        custom_id: 'req-001-summary',
        method: 'POST',
        url: '/v1/chat/completions',
        body: {
          model: modelName,
          messages: [
            { role: 'system', content: '你是一个专业的文本摘要助手。' },
            { role: 'user', content: '请用一句话总结量子计算对现代信息安全的核心冲击。' }
          ],
          max_tokens: 200,
          temperature: 0.7
        }
      },
      {
        custom_id: 'req-002-translate',
        method: 'POST',
        url: '/v1/chat/completions',
        body: {
          model: modelName,
          messages: [
            { role: 'system', content: '你是一位精通多语言的翻译官。' },
            { role: 'user', content: '将以下句子翻译为纯正地道的英文："行百里者半九十"。' }
          ],
          max_tokens: 150,
          temperature: 0.3
        }
      },
      {
        custom_id: 'req-003-sentiment',
        method: 'POST',
        url: '/v1/chat/completions',
        body: {
          model: modelName,
          messages: [
            { role: 'system', content: '你是一个情感分析系统，仅输出【正面】、【负面】或【中性】。' },
            { role: 'user', content: '这款耳机的降噪效果令人惊艳，但长时间佩戴略有压耳感。' }
          ],
          max_tokens: 50,
          temperature: 0.1
        }
      }
    ]

    return samples.map(item => JSON.stringify(item)).join('\n')
  }

  /**
   * 触发下载标准示例 JSONL 文件
   */
  downloadSampleJsonlFile(modelName: string = 'deepseek-ai/DeepSeek-V3') {
    const content = this.generateSampleJsonl(modelName)
    const blob = new Blob([content], { type: 'application/jsonl;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `siliconflow_batch_sample_${Date.now()}.jsonl`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    ElMessage.success('已下载官方标准 Batch JSONL 示例模板')
  }
}

export const siliconBatchService = new SiliconBatchService()
