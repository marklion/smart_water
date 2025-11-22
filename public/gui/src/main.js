import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { inject_err_handler } from '../../lib/call_remote.js'

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

// 只在非登录页设置标题，登录页会自己获取系统名称（避免重复请求）
router.afterEach((to) => {
  if (to.path !== '/login') {
    setPageTitle()
  }
})

// 设置全局错误处理器，处理认证相关错误
inject_err_handler((err_msg) => {
  // 检查是否是认证相关的错误
  const authErrorKeywords = ['缺少token', 'Token无效', 'Token过期', '请先登录', '身份验证失败', 'Token验证失败'];
  const isAuthError = authErrorKeywords.some(keyword => err_msg.includes(keyword));
  
  if (isAuthError) {
    console.log('检测到认证错误，准备清除 token:', err_msg)
    console.log('当前路由:', router.currentRoute.value.path)
    if (router.currentRoute.value.path === '/login') {
      console.log('当前在登录页，不清除 token')
      return
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('username');
    if (router.currentRoute.value.path !== '/login') {
      router.push('/login');
    }
  }
});

// 设备能力集操作按钮映射配置
const deviceCapabilityButtonMapping = {
  // 基础设备控制能力
  open: {
    buttonText: '开启设备',
    buttonType: 'success',
    buttonSize: 'small',
    buttonClass: 'half-width-button',
    icon: 'VideoPlay',
    action: 'openDevice',
    description: '打开设备阀门或开关'
  },
  close: {
    buttonText: '关闭设备', 
    buttonType: 'danger',
    buttonSize: 'small',
    buttonClass: 'half-width-button',
    icon: 'VideoPause',
    action: 'closeDevice',
    description: '关闭设备阀门或开关'
  },
  readout: {
    buttonText: '读取设备读数',
    buttonType: 'primary',
    buttonSize: 'small', 
    buttonClass: 'full-width-button',
    icon: 'Monitor',
    action: 'readDeviceStatus',
    description: '读取设备当前示数和状态'
  },
  shutdown: {
    buttonText: '紧急关闭设备',
    buttonType: 'warning',
    buttonSize: 'small',
    buttonClass: 'full-width-button', 
    icon: 'Close',
    action: 'shutdownDevice',
    description: '紧急停止设备运行'
  },
} 

// 设备能力集组合配置
const deviceCapabilityGroups = {
  // 阀门类设备 - 支持开关控制
  valve: {
    capabilities: ['open', 'close', 'readout', 'shutdown'],
    layout: 'row', // 按钮布局方式
    priority: ['open', 'close', 'readout', 'shutdown'] // 按钮显示优先级
  },
  // 流量计类设备 - 主要支持读数
  flowmeter: {
    capabilities: ['readout', 'shutdown'],
    layout: 'column',
    priority: ['readout', 'shutdown']
  },
  // 施肥机类设备 - 支持完整控制
  fertilizer: {
    capabilities: ['open', 'close', 'readout', 'shutdown'],
    layout: 'mixed', // 混合布局
    priority: ['open', 'close', 'readout', 'shutdown']
  },
  // 传感器类设备 - 主要支持读数
  sensor: {
    capabilities: ['readout'],
    layout: 'column',
    priority: ['readout']
  }
}

// 根据设备能力集获取按钮配置
const getDeviceButtonConfig = (deviceCapabilities, deviceType = 'valve') => {
  if (!Array.isArray(deviceCapabilities)) {
    try {
      deviceCapabilities = JSON.parse(deviceCapabilities)
    } catch (e) {
      console.warn('设备能力集格式无效:', deviceCapabilities)
      return []
    }
  }
  
  const groupConfig = deviceCapabilityGroups[deviceType] || deviceCapabilityGroups.valve
  const availableCapabilities = groupConfig.capabilities.filter(cap => 
    deviceCapabilities.includes(cap)
  )
  
  return availableCapabilities
    .sort((a, b) => {
      const aIndex = groupConfig.priority.indexOf(a)
      const bIndex = groupConfig.priority.indexOf(b)
      return aIndex - bIndex
    })
    .map(capability => ({
      ...deviceCapabilityButtonMapping[capability],
      capability,
      key: capability
    }))
}

// 检查设备是否支持特定能力
const hasDeviceCapability = (device, capability) => {
  if (!device) return false
  
  let capabilities = []
  if (device.capability) {
    if (Array.isArray(device.capability)) {
      capabilities = device.capability
    } else {
      try {
        capabilities = JSON.parse(device.capability)
      } catch (e) {
        capabilities = device.capability.split(',').map(c => c.trim())
      }
    }
  }
  
  return capabilities.includes(capability)
}

// 检查设备是否具有任何操作能力
const hasAnyDeviceCapability = (device) => {
  if (!device) return false
  
  const allCapabilities = Object.keys(deviceCapabilityButtonMapping)
  return allCapabilities.some(capability => hasDeviceCapability(device, capability))
}

// 获取设备类型对应的能力组
const getDeviceTypeCapabilities = (deviceType) => {
  return deviceCapabilityGroups[deviceType] || deviceCapabilityGroups.valve
}

const app = createApp(App)

// 将设备能力集映射配置添加到全局属性
app.config.globalProperties.$deviceCapabilityMapping = deviceCapabilityButtonMapping
app.config.globalProperties.$deviceCapabilityGroups = deviceCapabilityGroups
app.config.globalProperties.$getDeviceButtonConfig = getDeviceButtonConfig
app.config.globalProperties.$hasDeviceCapability = hasDeviceCapability
app.config.globalProperties.$hasAnyDeviceCapability = hasAnyDeviceCapability
app.config.globalProperties.$getDeviceTypeCapabilities = getDeviceTypeCapabilities

app.use(router)
app.use(ElementPlus)

app.mount('#app')
