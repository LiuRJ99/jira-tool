<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useJiraStore } from '@/stores/jira';

const jiraStore = useJiraStore();
const router = useRouter();

const host = ref('');
const username = ref('');
const password = ref('');
const protocol = ref('https');
const apiVersion = ref('2');
const isSubmitting = ref(false);

// 表单验证状态
const formErrors = ref({
  host: '',
  username: '',
  password: ''
});

// 初始化表单
onMounted(() => {
  // 尝试从本地存储加载配置
  if (jiraStore.loadConfig()) {
    const config = jiraStore.config;
    host.value = config.host;
    username.value = config.username;
    password.value = config.password;
    protocol.value = config.protocol || 'https';
    apiVersion.value = config.apiVersion || '2';
    
    // 路由跳转由全局导航守卫处理
  }
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

// 提交表单
async function handleSubmit() {
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
      // 添加短暂延迟，确保状态更新后再触发导航
      setTimeout(() => {
        router.push('/');
      }, 100);
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="config-container">
    <h1>JIRA 配置</h1>
    
    <div v-if="jiraStore.errorMessage" class="error-message">
      {{ jiraStore.errorMessage }}
    </div>
    
    <form @submit.prevent="handleSubmit" class="config-form">
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
  </div>
</template>

<style scoped>
@import './ConfigView.css';
</style>