import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
const base = process.env.NODE_ENV === 'production' ? '/deepseek/' : '/'
// https://vitejs.dev/config/
export default defineConfig({
  base: base,
  plugins: [
    vue(),
    tailwindcss(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    proxy: {
      '/api-v1': {
        target: 'https://api.siliconflow.cn/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-v1/, ''),
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'element-plus': ['element-plus', '@element-plus/icons-vue'],
          'markdown-runtime': ['markdown-it', 'katex', 'highlight.js']
        }
      }
    }
  }
})
