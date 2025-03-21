import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ConfigView from '../views/ConfigView.vue'
import { useJiraStore } from '../stores/jira'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/config',
      name: 'config',
      component: ConfigView
    }
  ],
})

// 全局导航守卫
router.beforeEach((to, from, next) => {
  // 由于在setup中不能直接使用useJiraStore，需要在导航守卫中动态引入
  const jiraStore = useJiraStore()
  
  // 尝试加载配置
  jiraStore.loadConfig()
  
  // 如果用户未配置且目标不是配置页面，则重定向到配置页面
  if (!jiraStore.isConfigured && to.path !== '/config') {
    next('/config')
  } 
  // 其他情况正常导航
  else {
    next()
  }
})

export default router
