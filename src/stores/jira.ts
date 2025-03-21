import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { JiraConfig, JiraIssueInfo } from '@/services/jira.service';
import { jiraService } from '@/services/jira.service';

export const useJiraStore = defineStore('jira', () => {
  // 状态
  const config = ref<JiraConfig>({
    host: '',
    username: '',
    password: '',
    protocol: 'https',
    apiVersion: '2'
  });
  const isConfigured = ref(false);
  const isLoading = ref(false);
  const issueResults = ref<JiraIssueInfo[]>([]);
  const errorMessage = ref<string | null>(null);

  // 动作

  /**
   * 保存JIRA配置
   * @param newConfig 新的JIRA配置
   */
  async function saveConfig(newConfig: JiraConfig) {
    try {
      config.value = { ...newConfig };
      
      // 初始化JIRA服务
      jiraService.initialize(config.value);
      
      // 测试连接
      const connected = await jiraService.testConnection();
      if (connected) {
        isConfigured.value = true;
        errorMessage.value = null;
        
        // 保存到本地存储
        localStorage.setItem('jira-config', JSON.stringify(config.value));
        return true;
      } else {
        errorMessage.value = '连接JIRA服务器失败，请检查配置';
        return false;
      }
    } catch (error) {
      console.error('保存JIRA配置失败:', error);
      errorMessage.value = `配置错误: ${error instanceof Error ? error.message : '未知错误'}`;
      return false;
    }
  }

  /**
   * 从本地存储加载JIRA配置
   */
  function loadConfig() {
    try {
      const savedConfig = localStorage.getItem('jira-config');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig) as JiraConfig;
        config.value = parsedConfig;
        jiraService.initialize(config.value);
        isConfigured.value = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('加载JIRA配置失败:', error);
      errorMessage.value = '加载保存的配置失败';
      return false;
    }
  }

  /**
   * 查询JIRA工单信息
   * @param issueKeys 工单号数组
   */
  async function fetchIssues(issueKeys: string[]) {
    if (!isConfigured.value) {
      errorMessage.value = '请先配置JIRA连接信息';
      return;
    }

    try {
      isLoading.value = true;
      errorMessage.value = null;
      issueResults.value = await jiraService.getIssuesInfo(issueKeys);
    } catch (error) {
      console.error('获取JIRA工单信息失败:', error);
      errorMessage.value = `获取JIRA信息失败: ${error instanceof Error ? error.message : '未知错误'}`;
      issueResults.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 清空结果
   */
  function clearResults() {
    issueResults.value = [];
    errorMessage.value = null;
  }

  /**
   * 退出登录
   */
  function logout() {
    config.value = {
      host: '',
      username: '',
      password: '',
      protocol: 'https',
      apiVersion: '2'
    };
    isConfigured.value = false;
    issueResults.value = [];
    errorMessage.value = null;
    localStorage.removeItem('jira-config');
  }

  return {
    // 状态
    config,
    isConfigured,
    issueResults,
    isLoading,
    errorMessage,
    
    // Actions
    saveConfig,
    loadConfig,
    fetchIssues,
    clearResults,
    logout
  };
}); 