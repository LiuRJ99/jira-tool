/**
 * Page Agent 类型定义
 */

// LLM 提供商类型
export type LLMProvider = 'openai' | 'claude' | 'deepseek' | 'qwen' | 'ollama' | 'custom'

// LLM 配置接口
export interface LLMConfig {
  provider: LLMProvider
  apiKey: string
  baseUrl?: string
  model: string
  temperature?: number
  maxTokens?: number
}

// Page Agent 配置接口
export interface PageAgentConfig {
  enabled: boolean
  llm: LLMConfig
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

// Action 参数定义
export interface ActionParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description: string
  required?: boolean
  default?: unknown
  enum?: string[]
}

// Action 定义
export interface ActionDefinition {
  name: string
  description: string
  parameters?: ActionParameter[]
}

// Action 执行函数类型
export type ActionExecutor = (params: Record<string, unknown>) => Promise<unknown> | unknown

// 注册 Action 接口
export interface RegisteredAction extends ActionDefinition {
  execute: ActionExecutor
}

// 页面上下文数据
export interface PageContext {
  currentView: string
  issueResults: Array<{
    key: string
    title: string
    assignee: string
    status?: string
  }>
  selectedAuthors: string[]
  selectedKeywords: string[]
  isLoading: boolean
  errorMessage?: string
}

// Agent 消息类型
export interface AgentMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  actions?: ActionDefinition[]
}

// 确认对话框数据
export interface ConfirmationDialog {
  show: boolean
  title: string
  description: string
  actionName: string
  params: Record<string, unknown>
  countdown?: number
}

// Chat 状态
export interface ChatState {
  isOpen: boolean
  messages: AgentMessage[]
  isProcessing: boolean
  confirmation: ConfirmationDialog | null
}
