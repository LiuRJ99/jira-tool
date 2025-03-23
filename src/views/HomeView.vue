<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useJiraStore } from '@/stores/jira';
import { CommentType, CommentTypeDisplayNames } from '@/services/jira.service';

const jiraStore = useJiraStore();
const router = useRouter();
const issueInput = ref('');



// 在组件加载时初始化
onMounted(() => {
  // 组件加载时不需要额外处理，全局导航守卫已经处理了路由跳转逻辑
});

// 处理查询
async function handleQuery() {
  if (!issueInput.value.trim()) {
    return;
  }
  
  // 分割工单号（以逗号分隔）并去重
  const issueKeys = [...new Set(
    issueInput.value
      .split(',')
      .map(key => key.trim())
      .filter(key => key !== '')
  )];
  
  if (issueKeys.length === 0) {
    return;
  }
  
  // 更新输入框内容为去重后的工单号
  issueInput.value = issueKeys.join(', ');
  
  // 发起查询
  await jiraStore.fetchIssues(issueKeys);
}

// 清空结果
function clearResults() {
  jiraStore.clearResults();
  issueInput.value = '';
}

// 注销
function handleLogout() {
  jiraStore.logout();
  router.push('/config');
}

// 打开JIRA描述页面
function openJiraPage(url: string) {
  if (url) {
    window.open(url, '_blank');
  }
}
</script>

<template>
  <div class="home-container">
    <header class="app-header">
      <h1>JIRA工单信息查询</h1>
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </header>

    <div v-if="jiraStore.issueResults.length > 0" class="authors-list">
      <h3>参与人员</h3>
      <div class="authors-container">
        <div class="author-item" v-for="author in jiraStore.issueResults[0].commentAuthors" :key="author.name">
          <span class="author-dot" :style="{ backgroundColor: author.color }"></span>
          <span class="author-name">{{ author.name }}</span>
        </div>
      </div>
    </div>
    
    <div class="query-section">
      <div class="input-group">
        <input
          v-model="issueInput"
          placeholder="输入JIRA工单号，多个以逗号分隔 (例如: PROJ-123, PROJ-456)"
          @keyup.enter="handleQuery"
        />
        <button @click="handleQuery" :disabled="jiraStore.isLoading">
          {{ jiraStore.isLoading ? '查询中...' : '查询' }}
        </button>
        <button class="clear-btn" @click="clearResults" :disabled="jiraStore.isLoading">
          清空
        </button>
      </div>
      
      <div v-if="jiraStore.errorMessage" class="error-message">
        {{ jiraStore.errorMessage }}
      </div>
    </div>
    
    <div v-if="jiraStore.isLoading" class="loading">
      <div class="loading-spinner"></div>
      <p>正在获取JIRA信息，请稍候...</p>
    </div>
    
    <div v-else-if="jiraStore.issueResults.length > 0" class="results-section">
      <h2>查询结果</h2>
      <table class="results-table">
        <thead>
          <tr>
            <th>JIRA号</th>
            <th>{{ CommentTypeDisplayNames[CommentType.TEST] }}备注</th>
            <th>{{ CommentTypeDisplayNames[CommentType.REVIEW] }}备注</th>
            <th>{{ CommentTypeDisplayNames[CommentType.APPROVAL] }}备注</th>
            <th>{{ CommentTypeDisplayNames[CommentType.VERIFICATION] }}备注</th>
            <th>描述</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="issue in jiraStore.issueResults" :key="issue.key">
            <td>{{ issue.key }}</td>
            <td>
              <div v-for="(comment, index) in issue.comments[CommentType.TEST]" :key="index" class="comment-item">
                <span class="author-dot" 
                      v-for="author in issue.commentAuthors.filter(a => comment.startsWith(`[${a.name}]`))" 
                      :key="author.name"
                      :style="{ backgroundColor: author.color }">
                </span>
                {{ comment }}
              </div>
              <div v-if="issue.comments[CommentType.TEST].length === 0" class="no-data">
                无
              </div>
            </td>
            <td>
              <div v-for="(comment, index) in issue.comments[CommentType.REVIEW]" :key="index" class="comment-item">
                <span class="author-dot" 
                      v-for="author in issue.commentAuthors.filter(a => comment.startsWith(`[${a.name}]`))" 
                      :key="author.name"
                      :style="{ backgroundColor: author.color }">
                </span>
                {{ comment }}
              </div>
              <div v-if="issue.comments[CommentType.REVIEW].length === 0" class="no-data">
                无
              </div>
            </td>
            <td>
              <div v-for="(comment, index) in issue.comments[CommentType.APPROVAL]" :key="index" class="comment-item">
                <span class="author-dot" 
                      v-for="author in issue.commentAuthors.filter(a => comment.startsWith(`[${a.name}]`))" 
                      :key="author.name"
                      :style="{ backgroundColor: author.color }">
                </span>
                {{ comment }}
              </div>
              <div v-if="issue.comments[CommentType.APPROVAL].length === 0" class="no-data">
                无
              </div>
            </td>
            <td>
              <div v-for="(comment, index) in issue.comments[CommentType.VERIFICATION]" :key="index" class="comment-item">
                <span class="author-dot" 
                      v-for="author in issue.commentAuthors.filter(a => comment.startsWith(`[${a.name}]`))" 
                      :key="author.name"
                      :style="{ backgroundColor: author.color }">
                </span>
                {{ comment }}
              </div>
              <div v-if="issue.comments[CommentType.VERIFICATION].length === 0" class="no-data">
                无
              </div>
            </td>
            <td>
              <a 
                href="#" 
                @click.prevent="openJiraPage(issue.descriptionUrl)"
                class="description-link"
                :title="issue.description"
              >
                {{ issue.description ? '查看描述' : '无描述' }}
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div v-else-if="!jiraStore.isLoading" class="empty-state">
      <p>输入JIRA工单号并点击"查询"按钮获取信息</p>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.authors-list {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  width: 100%;
  margin-bottom: 20px;
}

.authors-list h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #333;
}

.authors-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.author-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: white;
  padding: 6px 12px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.author-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.author-name {
  font-size: 14px;
  color: #666;
}

.comment-item .author-dot {
  margin-right: 4px;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.logout-btn {
  background-color: #ff4d4f;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.logout-btn:hover {
  background-color: #ff7875;
}

.query-section {
  margin-bottom: 20px;
}

.input-group {
  display: flex;
  gap: 10px;
}

.input-group input {
  flex: 1;
  padding: 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 16px;
}

.input-group button {
  padding: 10px 20px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.input-group button:hover {
  background-color: #40a9ff;
}

.input-group button:disabled {
  background-color: #d9d9d9;
  cursor: not-allowed;
}

.clear-btn {
  background-color: #f0f0f0 !important;
  color: #595959 !important;
}

.clear-btn:hover {
  background-color: #d9d9d9 !important;
}

.error-message {
  margin-top: 10px;
  padding: 10px;
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  color: #ff4d4f;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 2s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.results-section {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

h2 {
  padding: 15px 20px;
  margin: 0;
  background-color: #f8f8f8;
  border-bottom: 1px solid #e8e8e8;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
}

.results-table th,
.results-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e8e8e8;
}

.results-table th {
  background-color: #fafafa;
  font-weight: bold;
}

.results-table tr:last-child td {
  border-bottom: none;
}

.results-table tr:hover {
  background-color: #f5f5f5;
}

.comment-item {
  padding: 8px;
  margin-bottom: 5px;
  background-color: #f9f9f9;
  border-radius: 4px;
  font-size: 14px;
  word-break: break-word;
}

.comment-item:last-child {
  margin-bottom: 0;
}

.no-data {
  color: #999;
  font-style: italic;
}

.description-link {
  color: #1890ff;
  text-decoration: none;
}

.description-link:hover {
  text-decoration: underline;
}

.empty-state {
  padding: 40px;
  text-align: center;
  background-color: #f8f8f8;
  border-radius: 8px;
  color: #595959;
}

/* 移动端样式 */
@media screen and (max-width: 767px) {
  .authors-container {
    gap: 8px;
  }

  .author-item {
    padding: 4px 8px;
    font-size: 12px;
  }

  .results-table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }

  .results-table th,
  .results-table td {
    padding: 8px;
    font-size: 14px;
  }

  .comment-item {
    font-size: 12px;
    padding: 6px;
  }

  .empty-state {
    padding: 20px;
    font-size: 14px;
  }
}

/* 平板样式 */
@media screen and (min-width: 768px) and (max-width: 1023px) {
  .home-container {
    max-width: 90%;
    padding: 15px;
  }

  h1 {
    font-size: 26px;
  }

  .input-group input {
    font-size: 15px;
  }

  .input-group button {
    padding: 10px 18px;
    font-size: 15px;
  }

  .results-table th,
  .results-table td {
    padding: 10px;
    font-size: 15px;
  }
}

/* 桌面端样式 */
@media screen and (min-width: 1024px) {
  .home-container {
    max-width: 1200px;
    padding: 20px;
  }
}
</style>
