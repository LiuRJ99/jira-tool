/**
 * PageAgent 实例管理
 * 使用官方 page-agent npm 包
 */

import { PageAgent } from 'page-agent'
import { usePageAgentStore } from '@/stores/pageAgent'

let agentInstance: PageAgent | null = null

/**
 * 获取 PageAgent 实例
 */
export function getPageAgent(): PageAgent | null {
  return agentInstance
}

/**
 * 初始化 PageAgent
 */
export function initPageAgent(): PageAgent {
  const store = usePageAgentStore()
  const llm = store.config.llm

  // 创建实例
  agentInstance = new PageAgent({
    model: llm.model || 'qwen-plus',
    baseURL: llm.baseUrl || 'https://api.openai.com/v1',
    apiKey: llm.apiKey || '',
    language: 'zh-CN'
  })

  return agentInstance
}

/**
 * 销毁 PageAgent 实例
 */
export function destroyPageAgent(): void {
  if (agentInstance) {
    agentInstance = null
  }
}

/**
 * 重新初始化
 */
export function reinitializePageAgent(): PageAgent {
  destroyPageAgent()
  return initPageAgent()
}
