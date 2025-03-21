import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd())
  
  return {
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
        target: env.VITE_JIRA_SERVER,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/jira-api/, ''),
        secure: false
      }
    }
  }
}})
