// API 配置
const API_CONFIG = {
  // 开发环境使用 Vite 代理 /api-v1，生产环境直接请求官方接口
  baseURL: import.meta.env.PROD ? 'https://api.siliconflow.cn/v1' : '/api-v1',
  apiKey: import.meta.env.VITE_SILICONFLOW_API_KEY || ''
}

/**
 * 更新 SiliconFlow API KEY
 * @param key 新的 API KEY
 */
export const setSiliconFlowKey = (key: string) => {
  API_CONFIG.apiKey = key
}

// Image service for handling image generation operations

// 图片尺寸枚举
export enum ImageSize {
  Square = '1024x1024',
  Portrait = '960x1280',
  Small = '768x1024',
  Tall = '720x1440',
  Medium = '720x1280',
  Wide = '1536x1024',
  Widescreen = '2048x1152'
}

export interface ImageGenerationParams {
  model?: string;
  prompt: string;
  negative_prompt?: string;
  image_size: ImageSize | string;
  batch_size: number;
  num_inference_steps: number;
  guidance_scale: number;
  seed?: number;
  image?: string;
  signal?: AbortSignal;
}

export interface ImageGenerationResponse {
  images: Array<{ url: string }>;
  seed: number;
  timings?: {
    total_time: number;
  }
}

// 图片生成请求接口
export interface ImageGenerationRequest {
  model: string
  prompt: string
  image_size: string
  batch_size: number
  num_inference_steps: number
  guidance_scale: number
  negative_prompt?: string
  seed?: number
  image?: string // Base64格式的图片
}

// 默认请求配置
const DEFAULT_IMAGE_CONFIG: ImageGenerationRequest = {
  model: 'Kwai-Kolors/Kolors',
  prompt: 'an island near sea, with seagulls, moon shining over the sea, light house, boats int he background, fish flying over the sea',
  image_size: ImageSize.Square as string,
  batch_size: 1,
  num_inference_steps: 20,
  guidance_scale: 7.5
}

/**
 * 图片生成服务类
 */
class ImageGenerationService {
  /**
   * 生成图片
   * @param params 图片生成参数
   * @returns
   */
  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResponse> {
    try {
      const requestBody: any = {
        model: params.model || 'Kwai-Kolors/Kolors',
        prompt: params.prompt,
        image_size: params.image_size,
        batch_size: parseInt(params.batch_size as any) || 1,
        num_inference_steps: parseInt(params.num_inference_steps as any) || 20,
        guidance_scale: parseFloat(params.guidance_scale as any) || 7.5
      }

      if (params.negative_prompt) {
        requestBody.negative_prompt = params.negative_prompt;
      }

      if (params.seed !== undefined) {
        requestBody.seed = parseInt(params.seed as any);
      }

      if (params.image) {
        requestBody.image = params.image;
      }

      console.log('%c >>> IMAGE SERVICE LOADED (V4) <<< ', 'background: #ff0000; color: #ffffff; font-size: 24px; font-weight: bold; border: 2px solid white; padding: 10px;');
      console.log('Sending image generation request via FETCH:', JSON.stringify({
        ...requestBody,
        image: requestBody.image ? '[BASE64_DATA]' : undefined
      }, null, 2));

      // 检查API密钥
      if (!API_CONFIG.apiKey) {
        throw new Error('API密钥未配置，请检查环境变量')
      }

      const response = await fetch(`${API_CONFIG.baseURL}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_CONFIG.apiKey.trim()}`
        },
        body: JSON.stringify(requestBody),
        signal: params.signal
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Fetch error response:', data);
        throw new Error(data.error?.message || data.message || `请求失败 (${response.status})`);
      }

      console.log('Image generation success:', data)
      return data
    } catch (error: any) {
      console.error('Image generation critical error:', error);
      throw error;
    }
  }

  /**
   * 将本地图片转换为Base64格式
   * @param file 图片文件
   * @returns Base64字符串
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }
}

// 导出服务实例
export const imageService = new ImageGenerationService()
