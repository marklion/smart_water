<template>
  <view class="login-page">
    <!-- 背景装饰 -->
    <view class="background-decoration">
      <view class="water-drop drop-1"></view>
      <view class="water-drop drop-2"></view>
      <view class="water-drop drop-3"></view>
      <view class="water-wave wave-1"></view>
      <view class="water-wave wave-2"></view>
      <view class="water-wave wave-3"></view>
    </view>
    
    <view class="login-container">
      <!-- Logo和标题 -->
      <view class="logo-section">
        <image src="@/static/logo.png" class="logo-img" mode="aspectFit" />
        <text class="system-title">{{ systemName }}</text>
      </view>

      <!-- 登录表单 -->
      <view class="form-container">
        <view class="form-card">
          <view class="form-title">欢迎登录舒德尔</view>
          
          <view class="input-group">
            <view class="input-label">用户名</view>
            <input 
              v-model="loginForm.username" 
              class="input-field" 
              placeholder="请输入用户名"
              :disabled="isLoading"
            />
          </view>

          <view class="input-group">
            <view class="input-label">密码</view>
            <input 
              v-model="loginForm.password" 
              class="input-field" 
              type="password"
              placeholder="请输入密码"
              :disabled="isLoading"
              @confirm="handleLogin"
            />
          </view>

          <view v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </view>

          <button 
            class="login-btn" 
            :class="{ 'loading': isLoading }"
            :disabled="isLoading"
            @click="handleLogin"
          >
            {{ isLoading ? '登录中...' : '登录' }}
          </button>
          
          <!-- 分割线 -->
          <view class="divider">
            <view class="divider-line"></view>
            <text class="divider-text">或</text>
            <view class="divider-line"></view>
          </view>
          
          <!-- 微信登录 -->
          <button 
            class="wechat-login-btn" 
            @click="handleWechatLogin"
          >
            <text class="wechat-icon">微信</text>
            <text class="wechat-text">微信登录</text>
          </button>
        </view>

        <!-- 公司信息 -->
        <view class="company-info">
          <text class="company-text">北京卓创微朗科技有限公司提供技术支持</text>
          <text class="company-address">北京市海淀区高梁桥斜街42号111号</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import call_remote from '../../../lib/call_remote.js'

const systemName = ref('智能灌溉管理系统')
const isLoading = ref(false)
const errorMessage = ref('')

const loginForm = reactive({
  username: '',
  password: ''
})

// 微信登录处理
const handleWechatLogin = () => {
  // TODO: 实现微信登录逻辑
  uni.showToast({
    title: '微信登录功能开发中',
    icon: 'none',
    duration: 2000
  })

}

const handleLogin = async () => {
  // 基本验证
  if (!loginForm.username.trim()) {
    errorMessage.value = '请输入用户名'
    return
  }
  if (!loginForm.password.trim()) {
    errorMessage.value = '请输入密码'
    return
  }
  if (loginForm.username.length < 2 || loginForm.username.length > 20) {
    errorMessage.value = '用户名长度在 2 到 20 个字符'
    return
  }
  if (loginForm.password.length < 4 || loginForm.password.length > 20) {
    errorMessage.value = '密码长度在 4 到 20 个字符'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await call_remote('/auth/login', {
      username: loginForm.username,
      password: loginForm.password
    })

    if (response && response.token) {
      // 保存 token 和用户名
      uni.setStorageSync('auth_token', response.token)
      uni.setStorageSync('username', loginForm.username)
      localStorage.setItem('auth_token', response.token)
      localStorage.setItem('username', loginForm.username)
      
      // 设置 axios headers
      const axios = (await import('axios')).default
      axios.defaults.headers.common['token'] = response.token
      
      // 跳转到首页
      uni.switchTab({
        url: '/pages/index'
      })
    } else {
      errorMessage.value = response?.message || '登录失败：响应格式错误'
    }
  } catch (error) {
    console.error('Login error:', error)
    if (error.err_msg) {
      errorMessage.value = error.err_msg
    } else {
      errorMessage.value = '网络错误，请稍后重试'
    }
  } finally {
    isLoading.value = false
  }
}

// 获取系统名称
const getSystemName = async () => {
  try {
    const response = await fetch('/api/v1/get_sys_name', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const data = await response.json()
    if (data.err_msg === '' && data.result.sys_name && data.result.sys_name !== 'no name') {
      systemName.value = data.result.sys_name
    }
  } catch (error) {
    console.error('获取系统名称失败:', error)
  }
}

onMounted(() => {
  getSystemName()
})
</script>

<style lang="scss" scoped>
.login-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 30%, #74b9ff 60%, #2a5298 75%, #1e3c72 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
  z-index: 9999;
  box-sizing: border-box;
}

/* 背景装饰 */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.water-drop {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  animation: float 6s ease-in-out infinite;
}

.drop-1 {
  width: 60px;
  height: 60px;
  top: 10%;
  left: 15%;
  animation-delay: 0s;
}

.drop-2 {
  width: 45px;
  height: 45px;
  top: 60%;
  left: 8%;
  animation-delay: 2s;
}

.drop-3 {
  width: 30px;
  height: 30px;
  top: 80%;
  left: 25%;
  animation-delay: 4s;
}

.water-wave {
  position: absolute;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  animation: ripple 8s linear infinite;
}

.wave-1 {
  width: 80px;
  height: 80px;
  top: 20%;
  right: 10%;
  animation-delay: 0s;
}

.wave-2 {
  width: 120px;
  height: 120px;
  top: 50%;
  right: 20%;
  animation-delay: 3s;
}

.wave-3 {
  width: 60px;
  height: 60px;
  top: 75%;
  right: 15%;
  animation-delay: 6s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes ripple {
  0% {
    transform: scale(0.8);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.3;
  }
  100% {
    transform: scale(0.8);
    opacity: 0.7;
  }
}

.login-container {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 400px;
  margin: 0;
  box-sizing: border-box;
  flex-shrink: 0;
}

.logo-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo-img {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
}

.system-title {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 10px 0;
  text-shadow: 
    2px 2px 4px rgba(0, 0, 0, 0.8),
    0 0 10px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(0, 0, 0, 0.3);
  filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.6));
}

.system-subtitle {
  display: block;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 400;
}

.form-container {
  width: 100%;
}

.form-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  margin-bottom: 20px;
}

.form-title {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  text-align: center;
  margin-bottom: 32px;
}

.input-group {
  margin-bottom: 24px;
}

.input-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.input-field {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  font-size: 16px;
  color: #303133;
  box-sizing: border-box;
}

.input-field:focus {
  border-color: #409eff;
  background: #fff;
}

.input-field:disabled {
  background: #f5f7fa;
  color: #c0c4cc;
}

.error-message {
  padding: 12px;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 8px;
  color: #f56c6c;
  font-size: 14px;
  margin-bottom: 20px;
  text-align: center;
}

.login-btn {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #409eff, #6a8dff);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 8px;
}

.login-btn:active {
  opacity: 0.8;
}

.login-btn.loading {
  opacity: 0.6;
}

.login-btn:disabled {
  opacity: 0.6;
}

/* 分割线 */
.divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
  gap: 12px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: #e4e7ed;
}

.divider-text {
  font-size: 14px;
  color: #909399;
  padding: 0 8px;
}

/* 微信登录按钮 */
.wechat-login-btn {
  width: 100%;
  height: 48px;
  background: #07c160;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 0;
}

.wechat-login-btn:active {
  opacity: 0.8;
  background: #06ad56;
}

.wechat-icon {
  font-size: 18px;
  font-weight: 700;
}

.wechat-text {
  font-size: 16px;
}

.company-info {
  text-align: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.company-text {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 4px;
}

.company-address {
  display: block;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}
</style>

