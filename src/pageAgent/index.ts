/**
 * Page Agent 初始化入口
 * 使用官方 page-agent npm 包
 */

import { usePageAgentStore } from '@/stores/pageAgent'
import { initPageAgent, destroyPageAgent, reinitializePageAgent } from './agent'

/**
 * 初始化 Page Agent
 */
export function initPageAgentSystem(): void {
  const store = usePageAgentStore()
  store.loadConfig()

  if (store.isConfigured && store.hasApiKey) {
    initPageAgent()
  }
}

/**
 * 销毁 Page Agent
 */
export function destroyPageAgentSystem(): void {
  destroyPageAgent()
}

/**
 * 重新初始化
 */
export function reloadPageAgent(): void {
  reinitializePageAgent()
}

export * from './agent'
