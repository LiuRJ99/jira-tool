<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useJiraStore } from '@/stores/jira';
import { usePageAgentStore } from '@/stores/pageAgent';
import type { LLMProvider } from '@/types/pageAgent';
import { Bot, Key, Settings, Sparkles } from 'lucide-vue-next';

const jiraStore = useJiraStore();
const pageAgentStore = usePageAgentStore();
const router = useRouter();

const host = ref('');
const username = ref('');
const password = ref('');
const protocol = ref('https');
const apiVersion = ref('2');
const isSubmitting = ref(false);

// Page Agent 配置
const paEnabled = ref(true);
const paProvider = ref<LLMProvider>('openai');
const paApiKey = ref('');
const paBaseUrl = ref('');
const paModel = ref('gpt-4o-mini');
const paTemperature = ref(0.7);
const activeSection = ref<'jira' | 'agent'>('jira');

// 提供商默认模型
const providerModels: Record<LLMProvider, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  claude: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
  deepseek: ['deepseek-chat', 'deepseek-coder'],
  qwen: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
  ollama: ['llama2', 'mistral', 'codellama', 'vicuna'],
  custom: ['custom']
};

// 提供商显示名称
const providerNames: Record<LLMProvider, string> = {
  openai: 'OpenAI',
  claude: 'Claude (Anthropic)',
  deepseek: 'DeepSeek',
  qwen: '通义千问 (Qwen)',
  ollama: 'Ollama (本地)',
  custom: '自定义'
};

// 表单验证状态
const formErrors = ref({
  host: '',
  username: '',
  password: ''
});

// 初始化表单
onMounted(() => {
  // 尝试从本地存储加载 JIRA 配置
  if (jiraStore.loadConfig()) {
    const config = jiraStore.config;
    host.value = config.host;
    username.value = config.username;
    password.value = config.password;
    protocol.value = config.protocol || 'https';
    apiVersion.value = config.apiVersion || '2';
  }

  // 加载 Page Agent 配置
  pageAgentStore.loadConfig();
  const paConfig = pageAgentStore.config;
  paEnabled.value = paConfig.enabled;
  paProvider.value = paConfig.llm.provider;
  paApiKey.value = paConfig.llm.apiKey;
  paBaseUrl.value = paConfig.llm.baseUrl || '';
  // 自定义提供商时保持原有模型名称（可能是空字符串）
  paModel.value = paConfig.llm.model;
  paTemperature.value = paConfig.llm.temperature || 0.7;
});

// 验证表单
function validateForm() {
  let isValid = true;
  formErrors.value = {
    host: '',
    username: '',
    password: ''
  };
  
  if (!host.value.trim()) {
    formErrors.value.host = 'JIRA服务器地址不能为空';
    isValid = false;
  }
  
  if (!username.value.trim()) {
    formErrors.value.username = '用户名不能为空';
    isValid = false;
  }
  
  if (!password.value.trim()) {
    formErrors.value.password = '密码不能为空';
    isValid = false;
  }
  
  return isValid;
}

// 切换提供商时更新默认模型
function handleProviderChange() {
  if (paProvider.value === 'custom') {
    paModel.value = '';
  } else {
    paModel.value = providerModels[paProvider.value][0];
  }
}

// 保存 Page Agent 配置
function savePageAgentConfig() {
  pageAgentStore.saveConfig({
    enabled: paEnabled.value,
    llm: {
      provider: paProvider.value,
      apiKey: paApiKey.value.trim(),
      baseUrl: paBaseUrl.value.trim() || undefined,
      model: paModel.value,
      temperature: paTemperature.value,
      maxTokens: 2000
    }
  });
}

// 提交表单
async function handleSubmit() {
  if (activeSection.value === 'jira') {
    if (!validateForm()) {
      return;
    }

    isSubmitting.value = true;

    try {
      const success = await jiraStore.saveConfig({
        host: host.value.trim(),
        username: username.value.trim(),
        password: password.value.trim(),
        protocol: protocol.value,
        apiVersion: apiVersion.value
      });
      if (success) {
        // 同时保存 Page Agent 配置
        savePageAgentConfig();
        setTimeout(() => {
          router.push('/');
        }, 100);
      }
    } finally {
      isSubmitting.value = false;
    }
  } else {
    // 仅保存 Agent 配置
    savePageAgentConfig();
    activeSection.value = 'jira';
  }
}
</script>

<template>
  <div class="config-container">
    <h1>系统配置</h1>

    <div v-if="jiraStore.errorMessage" class="error-message">
      {{ jiraStore.errorMessage }}
    </div>

    <!-- 配置标签页 -->
    <div class="config-tabs">
      <button
        class="tab-btn"
        :class="{ active: activeSection === 'jira' }"
        @click="activeSection = 'jira'"
      >
        <Settings class="w-4 h-4" />
        JIRA 配置
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeSection === 'agent' }"
        @click="activeSection = 'agent'"
      >
        <Bot class="w-4 h-4" />
        AI 助手配置
      </button>
    </div>

    <!-- JIRA 配置表单 -->
    <form v-if="activeSection === 'jira'" @submit.prevent="handleSubmit" class="config-form">
      <div class="form-group">
        <label for="protocol">协议:</label>
        <select id="protocol" v-model="protocol">
          <option value="http">HTTP</option>
          <option value="https">HTTPS</option>
        </select>
      </div>

      <div class="form-group">
        <label for="host">JIRA服务器地址:</label>
        <input
          id="host"
          v-model="host"
          type="text"
          placeholder="例如: jira.example.com"
          :class="{ 'has-error': formErrors.host }"
        />
        <div v-if="formErrors.host" class="error-text">{{ formErrors.host }}</div>
      </div>

      <div class="form-group">
        <label for="username">用户名:</label>
        <input
          id="username"
          v-model="username"
          type="text"
          placeholder="JIRA用户名"
          :class="{ 'has-error': formErrors.username }"
        />
        <div v-if="formErrors.username" class="error-text">{{ formErrors.username }}</div>
      </div>

      <div class="form-group">
        <label for="password">密码:</label>
        <input
          id="password"
          v-model="password"
          type="password"
          placeholder="JIRA密码"
          :class="{ 'has-error': formErrors.password }"
        />
        <div v-if="formErrors.password" class="error-text">{{ formErrors.password }}</div>
      </div>

      <div class="form-group">
        <label for="apiVersion">API版本:</label>
        <select id="apiVersion" v-model="apiVersion">
          <option value="2">2</option>
          <option value="3">3</option>
        </select>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? '连接中...' : '保存配置' }}
        </button>
      </div>
    </form>

    <!-- Page Agent 配置表单 -->
    <form v-else @submit.prevent="handleSubmit" class="config-form">
      <div class="agent-intro">
        <Sparkles class="w-5 h-5 text-yellow-500" />
        <p>配置 AI 助手，使用自然语言与 JIRA 工具交互</p>
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="paEnabled" />
          <span>启用 AI 助手</span>
        </label>
      </div>

      <div class="form-group">
        <label for="paProvider">
          <Key class="w-4 h-4 inline" />
          LLM 提供商:
        </label>
        <select id="paProvider" v-model="paProvider" @change="handleProviderChange">
          <option v-for="(name, key) in providerNames" :key="key" :value="key">
            {{ name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="paApiKey">API Key:</label>
        <input
          id="paApiKey"
          v-model="paApiKey"
          type="password"
          placeholder="输入您的 API Key"
        />
        <div class="hint-text">
          API Key 仅存储在本地浏览器中，不会上传到任何服务器
        </div>
      </div>

      <div class="form-group">
        <label for="paBaseUrl">Base URL (可选):</label>
        <input
          id="paBaseUrl"
          v-model="paBaseUrl"
          type="text"
          placeholder="例如: https://api.custom.com/v1"
        />
        <div class="hint-text">仅在使用自定义端点或本地 Ollama 时需要填写</div>
      </div>

      <div class="form-group">
        <label for="paModel">模型:</label>
        <!-- 自定义提供商时使用文本输入 -->
        <input
          v-if="paProvider === 'custom'"
          id="paModel"
          v-model="paModel"
          type="text"
          placeholder="输入自定义模型名称，如: gpt-4o, claude-3-sonnet"
        />
        <!-- 其他提供商使用下拉选择 -->
        <select v-else id="paModel" v-model="paModel">
          <option v-for="model in providerModels[paProvider]" :key="model" :value="model">
            {{ model }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="paTemperature">Temperature: {{ paTemperature }}</label>
        <input
          id="paTemperature"
          v-model.number="paTemperature"
          type="range"
          min="0"
          max="2"
          step="0.1"
        />
        <div class="hint-text">
          较低的值使输出更确定，较高的值使输出更随机
        </div>
      </div>

      <div class="form-actions">
        <button type="submit">保存配置</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
@import './ConfigView.css';
</style>