<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useJiraStore } from '@/stores/jira';
import { CommentType, CommentTypeDisplayNames, DescriptionKeywords, CommentTypeKeywords } from '@/services/jira.service';

const jiraStore = useJiraStore();
const router = useRouter();
const issueInput = ref('');
const selectedAuthors = ref<string[]>([]);
const selectedKeywords = ref<string[]>([]);
const activeTab = ref('authors'); // 当前激活的tab

// 切换作者选中状态
function toggleAuthor(authorName: string) {
  const index = selectedAuthors.value.indexOf(authorName);
  if (index === -1) {
    selectedAuthors.value.push(authorName);
  } else {
    selectedAuthors.value.splice(index, 1);
  }
}

// 切换关键字选中状态
function toggleKeyword(keyword: string) {
  const index = selectedKeywords.value.indexOf(keyword);
  if (index === -1) {
    selectedKeywords.value.push(keyword);
  } else {
    selectedKeywords.value.splice(index, 1);
  }
}

// 获取所有关键字列表
const allKeywords = computed(() => {
  const keywords: string[] = [];
  Object.values(CommentTypeKeywords).forEach(keywordArray => {
    keywords.push(...keywordArray);
  });
  return [...new Set(keywords)];
});

// 根据选中的作者和关键字过滤评论
function filterComments(comments: string[]) {
  let filteredComments = comments;
  
  // 按作者筛选
  if (selectedAuthors.value.length > 0) {
    filteredComments = filteredComments.filter(comment => 
      selectedAuthors.value.some(author => comment.startsWith(`[${author}]`))
    );
  }
  
  // 按关键字筛选
  if (selectedKeywords.value.length > 0) {
    filteredComments = filteredComments.filter(comment =>
      selectedKeywords.value.some(keyword => comment.includes(keyword))
    );
  }
  
  return filteredComments;
}

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

// 监听查询结果变化，自动选中相关的作者和关键字
watch(() => jiraStore.issueResults, (newResults) => {
  if (newResults.length > 0) {
    // 重置选中状态
    selectedAuthors.value = [];
    selectedKeywords.value = [];
    
    // 收集所有评论
    const allComments: string[] = [];
    newResults.forEach(issue => {
      Object.values(issue.comments).forEach(comments => {
        allComments.push(...comments);
      });
    });
    
    // 自动选中有评论的作者
    const authors = newResults[0].commentAuthors;
    authors.forEach(author => {
      if (allComments.some(comment => comment.startsWith(`[${author.name}]`))) {
        selectedAuthors.value.push(author.name);
      }
    });
    
    // 自动选中使用的关键字
    allKeywords.value.forEach(keyword => {
      if (allComments.some(comment => comment.includes(keyword))) {
        selectedKeywords.value.push(keyword);
      }
    });
  }
}, { immediate: true });

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
  selectedAuthors.value = [];
  selectedKeywords.value = [];
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
      <div class="filter-tabs">
        <div 
          class="tab-item" 
          :class="{ 'active': activeTab === 'authors' }" 
          @click="activeTab = 'authors'"
        >
          参与人员
        </div>
        <div 
          class="tab-item" 
          :class="{ 'active': activeTab === 'keywords' }" 
          @click="activeTab = 'keywords'"
        >
          关键字筛选
        </div>
      </div>

      <div class="tab-content">
        <transition name="fade" mode="out-in">
          <div v-if="activeTab === 'authors'" class="authors-container" key="authors">
            <div 
              class="author-item" 
              v-for="author in jiraStore.issueResults[0].commentAuthors" 
              :key="author.name"
              @click="toggleAuthor(author.name)"
              :class="{ 'author-item-selected': selectedAuthors.includes(author.name) }"
            >
              <span class="author-dot" :style="{ backgroundColor: author.color }"></span>
              <span class="author-name">{{ author.name }}</span>
            </div>
          </div>
          
          <div v-else-if="activeTab === 'keywords'" class="keywords-container" key="keywords">
            <div 
              class="keyword-item" 
              v-for="keyword in allKeywords" 
              :key="keyword"
              @click="toggleKeyword(keyword)"
              :class="{ 'keyword-item-selected': selectedKeywords.includes(keyword) }"
            >
              {{ keyword }}
            </div>
          </div>
        </transition>
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
              <div v-for="(comment, index) in filterComments(issue.comments[CommentType.TEST])" :key="index" class="comment-item">
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
              <div v-for="(comment, index) in filterComments(issue.comments[CommentType.REVIEW])" :key="index" class="comment-item">
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
              <div v-for="(comment, index) in filterComments(issue.comments[CommentType.APPROVAL])" :key="index" class="comment-item">
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
              <div v-for="(comment, index) in filterComments(issue.comments[CommentType.VERIFICATION])" :key="index" class="comment-item">
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
