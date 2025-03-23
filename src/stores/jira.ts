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
  /**
   * Get cached results for issue keys
   * @param issueKeys Issue keys to check cache for
   */
  function getCachedResults(issueKeys: string[]): { results: JiraIssueInfo[], order: string[] } | null {
    try {
      // Sort keys for cache lookup
      const cacheKey = [...issueKeys].sort().join(',');
      const cached = localStorage.getItem(`jira-results-${cacheKey}`);
      const orderKey = `jira-order-${cacheKey}`;
      const savedOrder = localStorage.getItem(orderKey);
      
      if (cached && savedOrder) {
        const results = JSON.parse(cached);
        const order = JSON.parse(savedOrder);
        return { results, order };
      }
    } catch (error) {
      console.error('Error reading from cache:', error);
    }
    return null;
  }

  /**
   * Cache results for issue keys
   * @param issueKeys Issue keys to cache results for
   * @param results Results to cache
   */
  function cacheResults(issueKeys: string[], results: JiraIssueInfo[]) {
    try {
      // Sort keys for cache storage
      const cacheKey = [...issueKeys].sort().join(',');
      // Store original order
      localStorage.setItem(`jira-results-${cacheKey}`, JSON.stringify(results));
      localStorage.setItem(`jira-order-${cacheKey}`, JSON.stringify(issueKeys));
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  }

  /**
   * Get the last queried issue keys
   */
  function getLastQueriedKeys(): string[] | null {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('jira-order-')) {
          // Return the saved order instead of the cache key
          const order = localStorage.getItem(key);
          return order ? JSON.parse(order) : null;
        }
      }
    } catch (error) {
      console.error('Error getting last queried keys:', error);
    }
    return [];
  }

  /**
   * Clear all cached results
   */
  function clearCache() {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('jira-results-') || key.startsWith('jira-order-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  async function fetchIssues(issueKeys: string[], useCache: boolean = true) {
    if (!isConfigured.value) {
      errorMessage.value = '请先配置JIRA连接信息';
      return;
    }

    // Clear cache if not using it
    if (!useCache) {
      clearCache();
    }

    // Check cache first if using cache
    if (useCache) {
      const cached = getCachedResults(issueKeys);
      if (cached) {
        // Sort results according to original order
        const resultMap = new Map(cached.results.map(result => [result.key, result]));
        issueResults.value = cached.order.map(key => resultMap.get(key)!);
        return;
      }
    }

    try {
      isLoading.value = true;
      errorMessage.value = null;
      // Get results from API
      const results = await jiraService.getIssuesInfo(issueKeys);
      
      // Order results to match input order
      const resultMap = new Map(results.map(result => [result.key, result]));
      const orderedResults = issueKeys.map(key => resultMap.get(key)!);
      
      // Update state and cache
      issueResults.value = orderedResults;
      if (orderedResults.length > 0) {
        cacheResults(issueKeys, orderedResults);
      }
    } catch (error) {
      console.error('获取JIRA工单信息失败:', error);
      errorMessage.value = `获取JIRA信息失败: ${error instanceof Error ? error.message : '未知错误'}`;
      issueResults.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 清空结果和缓存
   */
  function clearResults() {
    issueResults.value = [];
    errorMessage.value = null;
    clearCache();
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
    clearCache,
    getLastQueriedKeys,
    logout
  };
});
