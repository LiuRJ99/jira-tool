<script setup lang="ts">
import { computed } from 'vue'
import { usePageAgentStore } from '@/stores/pageAgent'
import { getPageAgent, reinitializePageAgent } from '../agent'
import { Bot } from 'lucide-vue-next'

const store = usePageAgentStore()

const isEnabled = computed(() => store.isEnabled)
const isReady = computed(() => store.hasApiKey)

// 显示官方面板
function showPanel() {
  const agent = getPageAgent()

  // 检查 agent 是否存在且 panel 是否有效
  if (!agent || !agent.panel) {
    // agent 已被销毁，需要重新初始化
    const newAgent = reinitializePageAgent()
    if (!newAgent) {
      alert('PageAgent 初始化失败，请检查 LLM 配置')
      return
    }
    newAgent.panel.show()
    return
  }

  // 检查 panel 的 wrapper 是否还在 DOM 中
  if (!document.body.contains(agent.panel.wrapper)) {
    // panel 的 wrapper 已被移除，需要重新初始化
    reinitializePageAgent().panel.show()
    return
  }

  // 正常显示面板
  agent.panel.show()
}
</script>

<template>
  <div v-if="isEnabled" class="page-agent-widget">
    <button
      class="agent-float-btn"
      @click="showPanel"
      :disabled="!isReady"
      :title="isReady ? 'JIRA 助手' : '请先配置 LLM API'"
    >
      <Bot class="w-6 h-6" />
    </button>
  </div>
</template>

<style scoped>
.page-agent-widget {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
}

.agent-float-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
  transition: all 0.3s ease;
}

.agent-float-btn:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.5);
}

.agent-float-btn:disabled {
  background: #bfbfbf;
  box-shadow: none;
  cursor: not-allowed;
}
</style>
