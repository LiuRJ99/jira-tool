import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { initPageAgentSystem } from './pageAgent'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 初始化 Page Agent
initPageAgentSystem()

app.mount('#app')
