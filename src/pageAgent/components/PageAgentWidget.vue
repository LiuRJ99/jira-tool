<script setup lang="ts">
import { computed } from 'vue'
import { usePageAgentStore } from '@/stores/pageAgent'
import { getPageAgent } from '../agent'
import { Bot } from 'lucide-vue-next'

const store = usePageAgentStore()

const isEnabled = computed(() => store.isEnabled)
const isReady = computed(() => store.hasApiKey)

// 显示官方面板
function showPanel() {
  const agent = getPageAgent()
  if (!agent) {
    alert('PageAgent 未初始化，请先配置 LLM API')
    return
  }
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
