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
            <svg viewBox="0 0 512 512" class="plant-logo" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="mainLogoGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stop-color="#00b59c" />
                  <stop offset="100%" stop-color="#9cffac" />
                </linearGradient>
              </defs>
              <path
                d="m497 482h-10.002v-1.678c0-12.473 6.708-24.096 17.504-30.335 7.173-4.145 9.628-13.319 5.483-20.492s-13.319-9.63-20.492-5.482c-6.759 3.905-12.65 8.95-17.496 14.805-4.846-5.855-10.737-10.9-17.496-14.805-7.174-4.146-16.348-1.689-20.492 5.482-4.145 7.174-1.689 16.348 5.483 20.493 10.797 6.238 17.504 17.861 17.504 30.334v1.678h-69.996v-1.678c0-12.473 6.708-24.096 17.504-30.335 7.173-4.145 9.628-13.319 5.483-20.492s-13.319-9.63-20.492-5.482c-6.759 3.905-12.65 8.95-17.496 14.805-4.846-5.855-10.737-10.9-17.496-14.805-7.174-4.146-16.348-1.689-20.492 5.482-4.145 7.174-1.689 16.348 5.483 20.493 10.798 6.239 17.506 17.862 17.506 30.334v1.678h-56v-122h25c8.284 0 15-6.716 15-15v-15h15c8.284 0 15-6.716 15-15s-6.716-15-15-15h-15v-15c0-8.284-6.716-15-15-15h-5v-35c0-35.841-29.159-65-65-65s-65 29.159-65 65v35h-5c-8.284 0-15 6.716-15 15v15h-15c-8.284 0-15 6.716-15 15s6.716 15 15 15h15v15c0 8.284 6.716 15 15 15h25v122h-56v-1.678c0-12.473 6.708-24.096 17.504-30.334 7.173-4.146 9.628-13.319 5.483-20.493-4.145-7.173-13.319-9.63-20.492-5.482-6.759 3.905-12.65 8.95-17.496 14.805-4.846-5.855-10.737-10.9-17.496-14.805-7.173-4.146-16.348-1.689-20.492 5.482-4.145 7.173-1.689 16.348 5.483 20.492 10.798 6.24 17.506 17.863 17.506 30.335v1.678h-69.998v-1.678c0-12.473 6.708-24.096 17.504-30.334 7.173-4.146 9.628-13.319 5.483-20.493-4.145-7.173-13.319-9.63-20.492-5.482-6.759 3.905-12.65 8.95-17.496 14.805-4.846-5.855-10.737-10.9-17.496-14.805-7.174-4.146-16.348-1.689-20.492 5.482-4.145 7.173-1.689 16.348 5.483 20.492 10.797 6.239 17.504 17.862 17.504 30.335v1.678h-10c-8.284 0-15 6.716-15 15s6.716 15 15 15h482c8.284 0 15-6.716 15-15s-6.716-15-15-15zm-276-247c0-19.299 15.701-35 35-35s35 15.701 35 35v35h-70zm-20 65h110v30h-110zm40 60h30v122h-30zm220-125c0-8.284 6.716-15 15-15s15 6.716 15 15-6.716 15-15 15-15-6.716-15-15zm-40-15c8.284 0 15 6.716 15 15s-6.716 15-15 15-15-6.716-15-15s6.716-15 15-15zm-70 15c0-8.284 6.716-15 15-15s15 6.716 15 15-6.716 15-15 15-15-6.716-15-15zm-330 0c0-8.284 6.716-15 15-15s15 6.716 15 15-6.716 15-15 15-15-6.716-15-15zm55 0c0-8.284 6.716-15 15-15s15 6.716 15 15-6.716 15-15 15-15-6.716-15-15zm70-15c8.284 0 15 6.716 15 15s-6.716 15-15 15-15-6.716-15-15 6.716-15 15-15zm254.957-129.957c-5.858-5.858-5.858-15.355 0-21.213s15.355-5.858 21.213 0 5.858 15.355 0 21.213-15.355 5.858-21.213 0zm-38.891 38.891c-5.858-5.858-5.858-15.355 0-21.213s15.355-5.858 21.213 0 5.858 15.355 0 21.213-15.355 5.858-21.213 0zm-38.891 38.891c-5.858-5.858-5.858-15.355 0-21.213s15.355-5.858 21.213 0 5.858 15.355 0 21.213c-5.857 5.858-15.355 5.858-21.213 0zm-82.175-152.825c0-8.284 6.716-15 15-15s15 6.716 15 15-6.716 15-15 15-15-6.716-15-15zm0 55c0-8.284 6.716-15 15-15s15 6.716 15 15-6.716 15-15 15-15-6.716-15-15zm0 55c0-8.284 6.716-15 15-15s15 6.716 15 15-6.716 15-15 15-15-6.716-15-15zm-151.17-34.957c-5.858-5.858-5.858-15.355 0-21.213s15.355-5.858 21.213 0 5.858 15.355 0 21.213-15.355 5.858-21.213 0zm38.891 38.891c-5.858-5.858-5.858-15.355 0-21.213s15.355-5.858 21.213 0 5.858 15.355 0 21.213-15.355 5.858-21.213 0zm38.891 38.891c-5.858-5.858-5.858-15.355 0-21.213s15.355-5.858 21.213 0 5.858 15.355 0 21.213-15.355 5.858-21.213 0z"
                fill="url(#mainLogoGradient)" />
            </svg>
          </div>
          <h1 class="system-title">智能水务管理系统</h1>
          <p class="system-subtitle">Smart Water Management System</p>
        </div>

        <div class="feature-list">
          <el-row :gutter="20">
            <el-col :span="24" v-for="feature in features" :key="feature.title" class="feature-col">
              <el-card class="feature-card" shadow="hover">
                <div class="feature-content">
                  <div class="feature-icon" :class="feature.iconClass">{{ feature.icon }}</div>
                  <div class="feature-text">
                    <h3>{{ feature.title }}</h3>
                    <p>{{ feature.description }}</p>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
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
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import call_remote from '../../../lib/call_remote.js'

const router = useRouter()
const loginFormRef = ref()

const logoSrc = '/产品 LOGO.jpeg'

const loginForm = reactive({
  username: '',
  password: ''
})

const features = [
  {
    title: '智能灌溉',
    description: '精准控制，节水高效',
    icon: '●',
    iconClass: 'water-icon'
  },
  {
    title: '智慧农业',
    description: '科学种植，提升产量',
    icon: '♦',
    iconClass: 'plant-icon'
  },
  {
    title: '数据监控',
    description: '实时监测，智能决策',
    icon: '■',
    iconClass: 'chart-icon'
  }
]

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
</script>

<style scoped>
.login-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 25%, #74b9ff 40%, #00b59c 70%, #9cffac 100%);
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
  width: 120px;
  height: 120px;
  filter: drop-shadow(0 0 20px rgba(156, 255, 172, 0.4));
  animation: glow 3s ease-in-out infinite alternate;
}

.system-title {
  font-size: 48px;
  font-weight: 700;
  margin: 0 0 10px 0;
  background: linear-gradient(45deg, #ffffff, #e3f2fd);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.system-subtitle {
  font-size: 18px;
  margin: 0;
  opacity: 0.9;
  font-weight: 300;
  letter-spacing: 1px;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature-col {
  margin-bottom: 20px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.feature-card :deep(.el-card__body) {
  padding: 20px;
}

.feature-content {
  display: flex;
  align-items: center;
  text-align: left;
}

.feature-icon {
  font-size: 32px;
  margin-right: 20px;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
}

.water-icon {
  color: #409eff;
}

.plant-icon {
  color: #67c23a;
}

.chart-icon {
  color: #e6a23c;
}

.feature-text h3 {
  margin: 0 0 5px 0;
  font-size: 20px;
  font-weight: 600;
  color: white;
}

.feature-text p {
  margin: 0;
  font-size: 14px;
  opacity: 0.8;
  color: white;
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