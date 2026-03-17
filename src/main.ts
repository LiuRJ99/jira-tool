import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { initPageAgent } from './pageAgent'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 初始化 Page Agent
initPageAgent()

app.mount('#app')
