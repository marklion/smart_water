<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="water-drop drop-1"></div>
      <div class="water-drop drop-2"></div>
      <div class="water-drop drop-3"></div>
      <div class="water-wave wave-1"></div>
      <div class="water-wave wave-2"></div>
      <div class="water-wave wave-3"></div>
    </div>

    <!-- 左侧展示区域 -->
    <div class="login-showcase">
      <div class="showcase-content">
        <div class="logo-section">
          <div class="logo-icon">
            <img src="/logo.png" :alt="systemName" class="plant-logo" />
          </div>
          <h1 class="system-title">{{ systemName }}</h1>
          <p class="system-subtitle">Smart Water Management System</p>
        </div>

        <div class="system-intro">
          <div class="intro-content">
            <h2 class="intro-title">让灌溉更智能，让农业更简单</h2>
            <p class="intro-description">专业的水肥一体化智能管理平台</p>
            <p class="intro-subtitle">通过物联网技术、大数据分析。为您提供精准、高效、节水的灌溉解决方案。支持远程监控、智能决策、自动控制，让传统农业迈向智慧农业新时代。</p>
            <div class="intro-features">
              <span class="feature-tag">智能控制</span>
              <span class="feature-tag">节水增效</span>
              <span class="feature-tag">远程监控</span>
              <span class="feature-tag">数据分析</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧登录区域 -->
    <div class="login-form-section">
      <el-card class="login-card" shadow="always">
        <div class="login-header">
          <h2 class="login-title">欢迎登录</h2>
          <div class="company-info">
            <div class="company-logo-section">
              <el-avatar :size="24" :src="logoSrc" class="company-logo"></el-avatar>
              <div class="company-text">
                <p class="company-name">北京卓创微朗科技有限公司提供技术支持</p>
                <p class="company-address">北京市海淀区高梁桥斜街42号111号</p>
              </div>
            </div>
          </div>
        </div>

        <el-form ref="loginFormRef" :model="loginForm" :rules="rules" @submit.prevent="handleLogin" class="login-form"
          size="large">
          <el-form-item prop="username">
            <el-input v-model="loginForm.username" placeholder="请输入用户名" :prefix-icon="User" :disabled="isLoading"
              clearable />
          </el-form-item>

          <el-form-item prop="password">
            <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" :prefix-icon="Lock"
              :disabled="isLoading" show-password @keyup.enter="handleLogin" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" class="login-btn" :loading="isLoading" @click="handleLogin" size="large">
              {{ isLoading ? '登录中...' : '登录' }}
            </el-button>
          </el-form-item>
        </el-form>

        <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" show-icon
          class="error-alert" />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import call_remote from '../../../lib/call_remote.js'

const router = useRouter()
const loginFormRef = ref()

const logoSrc = '/产品 LOGO.jpeg'
const systemName = ref('智能灌溉管理系统')

const loginForm = reactive({
  username: '',
  password: ''
})


const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 4, max: 20, message: '长度在 4 到 20 个字符', trigger: 'blur' }
  ]
}

const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  if (!loginFormRef.value) return

  const valid = await loginFormRef.value.validate().catch(() => false)
  if (!valid) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await call_remote('/auth/login', {
      username: loginForm.username,
      password: loginForm.password
    })

    if (response && response.token) {
      localStorage.setItem('auth_token', response.token)
      localStorage.setItem('username', loginForm.username)
      router.push('/center')
    } else {
      errorMessage.value = response.message || '登录失败'
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

<style scoped>
.login-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 30%, #74b9ff 60%, #2a5298 75%, #1e3c72 100%);
  overflow: hidden;
  z-index: 9999;
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
  width: 80px;
  height: 80px;
  top: 10%;
  left: 15%;
  animation-delay: 0s;
}

.drop-2 {
  width: 60px;
  height: 60px;
  top: 60%;
  left: 8%;
  animation-delay: 2s;
}

.drop-3 {
  width: 40px;
  height: 40px;
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
  width: 100px;
  height: 100px;
  top: 20%;
  right: 10%;
  animation-delay: 0s;
}

.wave-2 {
  width: 150px;
  height: 150px;
  top: 50%;
  right: 20%;
  animation-delay: 3s;
}

.wave-3 {
  width: 80px;
  height: 80px;
  top: 75%;
  right: 15%;
  animation-delay: 6s;
}

@keyframes float {

  0%,
  100% {
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

/* 左侧展示区域 */
.login-showcase {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: white;
  position: relative;
  z-index: 2;
}

.showcase-content {
  max-width: 500px;
  text-align: center;
}

.logo-section {
  margin-bottom: 60px;
}

.logo-icon {
  margin-bottom: 30px;
}

.plant-logo {
  width: 200px;
  height: 200px;
  object-fit: contain;
  filter: drop-shadow(0 0 20px rgba(156, 255, 172, 0.4));
  animation: glow 3s ease-in-out infinite alternate;
}

.system-title {
  font-size: 48px;
  font-weight: 700;
  margin: 0 0 10px 0;
  color: #ffffff;
  text-shadow: 
    2px 2px 4px rgba(0, 0, 0, 0.8),
    0 0 10px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(0, 0, 0, 0.3);
  filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.6));
}

.system-subtitle {
  font-size: 18px;
  margin: 0;
  color: #ffffff;
  font-weight: 400;
  letter-spacing: 1px;
  text-shadow: 
    1px 1px 2px rgba(0, 0, 0, 0.8),
    0 0 5px rgba(0, 0, 0, 0.5);
}

.system-intro {
  margin-top: 40px;
}

.intro-content {
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 30px;
}

.intro-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 15px 0;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.intro-description {
  font-size: 20px;
  font-weight: 500;
  margin: 0 0 15px 0;
  color: #e8f5e8;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.intro-subtitle {
  font-size: 16px;
  margin: 0 0 20px 0;
  opacity: 0.9;
  color: white;
  line-height: 1.6;
  font-weight: 300;
}

.intro-features {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.feature-tag {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
}

.feature-tag:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

/* 右侧登录区域 */
.login-form-section {
  width: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  border-radius: 16px;
}

.login-card :deep(.el-card__body) {
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-title {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 15px 0;
}

.company-info {
  padding-top: 15px;
  border-top: 1px solid #e1e8ed;
}

.company-logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.company-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.company-name {
  font-size: 13px;
  margin: 0 0 4px 0;
  color: #666;
  font-weight: 400;
}

.company-address {
  font-size: 11px;
  margin: 0;
  color: #999;
  font-weight: 300;
}

.login-form {
  margin-bottom: 20px;
}

.login-btn {
  width: 100%;
  height: 50px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
}

.error-alert {
  margin-top: 20px;
}

@keyframes glow {
  from {
    filter: drop-shadow(0 0 20px rgba(156, 255, 172, 0.4));
  }

  to {
    filter: drop-shadow(0 0 30px rgba(156, 255, 172, 0.8));
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .login-form-section {
    width: 400px;
  }

  .login-showcase {
    padding: 40px;
  }

  .system-title {
    font-size: 36px;
  }
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }

  .login-showcase {
    flex: none;
    height: 40%;
    padding: 20px;
  }

  .login-form-section {
    width: 100%;
    flex: 1;
  }

  .system-title {
    font-size: 28px;
  }
}
</style>