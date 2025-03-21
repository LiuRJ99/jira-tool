import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // 添加开发服务器代理配置，解决CORS问题
  server: {
    proxy: {
      // 将JIRA API请求代理到JIRA服务器
      '/jira-api': {
        target: 'http://xx.xx.xx.xx:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/jira-api/, ''),
        secure: false
      }
    }
  }
})
