import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  PageAgentConfig,
  LLMConfig,
  LLMProvider,
  ChatState,
  AgentMessage,
  PageContext,
  ConfirmationDialog
} from '@/types/pageAgent'

// 默认模型配置
const defaultModelMap: Record<LLMProvider, string> = {
  openai: 'gpt-4o-mini',
  claude: 'claude-3-sonnet-20240229',
  deepseek: 'deepseek-chat',
  qwen: 'qwen-turbo',
  ollama: 'llama2',
  custom: ''
}

// 默认配置
const defaultConfig: PageAgentConfig = {
  enabled: true,
  llm: {
    provider: 'openai',
    apiKey: '',
    model: defaultModelMap.openai,
    temperature: 0.7,
    maxTokens: 2000
  },
  position: 'bottom-right'
}

export const usePageAgentStore = defineStore('pageAgent', () => {
  // ============ 配置状态 ============
  const config = ref<PageAgentConfig>({ ...defaultConfig })
  const isConfigured = ref(false)

  // ============ Chat 状态 ============
  const chatState = ref<ChatState>({
    isOpen: false,
    messages: [],
    isProcessing: false,
    confirmation: null
  })

  // ============ 页面上下文 ============
  const pageContext = ref<PageContext>({
    currentView: 'home',
    issueResults: [],
    selectedAuthors: [],
    selectedKeywords: [],
    isLoading: false
  })

  // ============ 计算属性 ============
  const hasApiKey = computed(() => !!config.value.llm.apiKey.trim())
  const isEnabled = computed(() => config.value.enabled && hasApiKey.value)
  const currentProvider = computed(() => config.value.llm.provider)
  const currentModel = computed(() => config.value.llm.model)

  // ============ Actions ============

  /**
   * 加载配置
   */
  function loadConfig(): boolean {
    try {
      const saved = localStorage.getItem('page-agent-config')
      if (saved) {
        const parsed = JSON.parse(saved) as PageAgentConfig
        config.value = {
          ...defaultConfig,
          ...parsed,
          llm: {
            ...defaultConfig.llm,
            ...parsed.llm
          }
        }
        isConfigured.value = hasApiKey.value
        return true
      }
    } catch (error) {
      console.error('加载 Page Agent 配置失败:', error)
    }
    return false
  }

  /**
   * 保存配置
   */
  function saveConfig(newConfig: PageAgentConfig): boolean {
    try {
      config.value = { ...newConfig }
      localStorage.setItem('page-agent-config', JSON.stringify(config.value))
      isConfigured.value = hasApiKey.value
      return true
    } catch (error) {
      console.error('保存 Page Agent 配置失败:', error)
      return false
    }
  }

  /**
   * 更新 LLM 配置
   */
  function updateLLMConfig(llmConfig: Partial<LLMConfig>) {
    config.value.llm = { ...config.value.llm, ...llmConfig }
    if (llmConfig.provider) {
      // 切换提供商时，自动切换到默认模型
      config.value.llm.model = defaultModelMap[llmConfig.provider]
    }
    saveConfig(config.value)
  }

  /**
   * 切换启用状态
   */
  function toggleEnabled(enabled?: boolean) {
    config.value.enabled = enabled !== undefined ? enabled : !config.value.enabled
    saveConfig(config.value)
  }

  /**
   * 打开/关闭聊天面板
   */
  function toggleChat(open?: boolean) {
    chatState.value.isOpen = open !== undefined ? open : !chatState.value.isOpen
  }

  /**
   * 添加消息
   */
  function addMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>) {
    const newMessage: AgentMessage = {
      ...message,
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      timestamp: Date.now()
    }
    chatState.value.messages.push(newMessage)
  }

  /**
   * 清空消息
   */
  function clearMessages() {
    chatState.value.messages = []
  }

  /**
   * 设置处理状态
   */
  function setProcessing(processing: boolean) {
    chatState.value.isProcessing = processing
  }

  /**
   * 显示确认对话框
   */
  function showConfirmation(dialog: Omit<ConfirmationDialog, 'show'>) {
    chatState.value.confirmation = { ...dialog, show: true }
  }

  /**
   * 隐藏确认对话框
   */
  function hideConfirmation() {
    if (chatState.value.confirmation) {
      chatState.value.confirmation.show = false
    }
  }

  /**
   * 更新页面上下文
   */
  function updateContext(context: Partial<PageContext>) {
    pageContext.value = { ...pageContext.value, ...context }
  }

  /**
   * 重置配置
   */
  function resetConfig() {
    config.value = { ...defaultConfig }
    localStorage.removeItem('page-agent-config')
    isConfigured.value = false
  }

  // 初始化时加载配置
  loadConfig()

  return {
    // 状态
    config,
    isConfigured,
    chatState,
    pageContext,

    // 计算属性
    hasApiKey,
    isEnabled,
    currentProvider,
    currentModel,

    // Actions
    loadConfig,
    saveConfig,
    updateLLMConfig,
    toggleEnabled,
    toggleChat,
    addMessage,
    clearMessages,
    setProcessing,
    showConfirmation,
    hideConfirmation,
    updateContext,
    resetConfig
  }
})
