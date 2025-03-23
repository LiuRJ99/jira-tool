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
.config-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

h1 {
  text-align: center;
  margin-bottom: 40px;
  font-size: 28px;
  color: #262626;
}

.config-form {
  background-color: #fff;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 28px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

input, select {
  width: 100%;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 16px;
  transition: all 0.3s;
}

input:hover, select:hover {
  border-color: #40a9ff;
}

input:focus, select:focus {
  border-color: #1890ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

input.has-error {
  border-color: #ff4d4f;
  animation: shake 0.5s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.error-text {
  color: #ff4d4f;
  font-size: 14px;
  margin-top: 8px;
}

.error-message {
  margin-bottom: 30px;
  padding: 15px;
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  color: #ff4d4f;
  font-size: 14px;
  width: 100%;
  max-width: 600px;
}

.form-actions {
  text-align: center;
  margin-top: 40px;
}

button {
  min-width: 160px;
  background-color: #1890ff;
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s;
}

button:hover {
  background-color: #40a9ff;
}

button:disabled {
  background-color: #d9d9d9;
  cursor: not-allowed;
}

/* 移动端样式 */
@media screen and (max-width: 767px) {
  .config-container {
    padding: 10px;
  }

  h1 {
    font-size: 24px;
    margin-bottom: 20px;
  }

  .config-form {
    padding: 20px;
    max-width: 100%;
  }

  input, select {
    font-size: 14px;
    padding: 10px;
  }

  button {
    width: 100%;
    min-width: auto;
    padding: 12px 20px;
    font-size: 14px;
  }

  .error-message {
    padding: 10px;
    font-size: 12px;
  }
}

/* 平板样式 */
@media screen and (min-width: 768px) and (max-width: 1023px) {
  .config-container {
    max-width: 90%;
  }

  .config-form {
    max-width: 80%;
    padding: 30px;
  }

  button {
    min-width: 140px;
  }
}

/* 桌面端样式 */
@media screen and (min-width: 1024px) {
  .config-container {
    max-width: 800px;
  }

  .config-form {
    max-width: 600px;
  }
}
</style>