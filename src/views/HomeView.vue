<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useJiraStore } from '@/stores/jira';
import { CommentType, CommentTypeDisplayNames,DescriptionKeywords } from '@/services/jira.service';

const jiraStore = useJiraStore();
const router = useRouter();
const issueInput = ref('');



// 在组件加载时初始化
onMounted(async () => {
  // 检查是否已配置
  if (jiraStore.isConfigured) {
    // 获取最近查询的issue keys
    const lastQueriedKeys = jiraStore.getLastQueriedKeys();
    if (lastQueriedKeys && lastQueriedKeys.length > 0) {
      // 设置输入框的值
      issueInput.value = lastQueriedKeys.join(', ');
      // 从缓存加载数据
      await jiraStore.fetchIssues(lastQueriedKeys, true);
    }
  }
});

  // 处理查询
  async function handleQuery(forceRefresh: boolean = false) {
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
    
    // 发起查询，如果forceRefresh为true则不使用缓存
    await jiraStore.fetchIssues(issueKeys, !forceRefresh);
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
          @keyup.enter="() => handleQuery(false)"
        />
        <button @click="() => handleQuery(true)" :disabled="jiraStore.isLoading">
          {{ jiraStore.isLoading ? '查询中...' : '刷新查询' }}
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
                :class="{ 'warning-text': issue.description && !DescriptionKeywords.some(keyword => issue.description.includes(keyword)) }"
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
  @import './HomeView.css';
</style>
