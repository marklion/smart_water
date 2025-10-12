import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 动态设置页面标题
const setPageTitle = async () => {
  try {
    const response = await fetch('/api/v1/get_sys_name', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const data = await response.json()
    if (data.err_msg === '' && data.result.sys_name && data.result.sys_name !== 'no name') {
      document.title = data.result.sys_name
    }
  } catch (error) {
    console.error('获取系统名称失败:', error)
  }
}

// 在应用启动时设置标题
setPageTitle()

const app = createApp(App)

app.use(router)
app.use(ElementPlus)

app.mount('#app')
