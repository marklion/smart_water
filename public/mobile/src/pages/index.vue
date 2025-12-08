<template>
  <view class="page">
    <!-- 顶部标题栏 -->
    <view class="header">
      <view class="header-left">
        <image src="/static/logo.png" class="header-logo" mode="aspectFit" />
        <fui-text :text="systemName" :size="40" :fontWeight="700" color="#303133"></fui-text>
      </view>
      <view class="header-right">
        <picker 
          :value="farmIndex" 
          :range="farmList" 
          range-key="name"
          @change="onFarmChange"
          class="farm-picker"
        >
          <view class="farm-selector">
            <fui-text :text="currentFarmName || '选择农场'" :size="28" color="#409eff"></fui-text>
            <text class="picker-arrow">▼</text>
          </view>
        </picker>
      </view>
    </view>

    <!-- 用户欢迎信息 -->
    <view class="user-welcome">
      <fui-text :text="userInfo + ', 欢迎您'" :size="28" color="#606266"></fui-text>
    </view>

    <!-- 天气预报卡片 -->
    <WeatherCard />

    <!-- 主要内容区域 -->
    <view class="content">
      <!-- 基本信息卡片 -->
      <BasicInfoCard :farmName="currentFarmName" />

      <!-- 系统告警卡片 -->
      <WarningCard />

      <!-- 实时数据卡片 -->
      <RealtimeDataCard />

      <!-- 数据面板卡片 -->
      <DataPanelCard />
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import call_remote from '../../../lib/call_remote.js'
import fuiText from 'firstui-uni/firstui/fui-text/fui-text.vue'
import WeatherCard from './monitoring/WeatherCard.vue'
import BasicInfoCard from './monitoring/BasicInfoCard.vue'
import WarningCard from './monitoring/WarningCard.vue'
import RealtimeDataCard from './monitoring/RealtimeDataCard.vue'
import DataPanelCard from './monitoring/DataPanelCard.vue'

const userInfo = ref('')
const systemName = ref('舒德尔') // 默认值

// 农场相关
const farmList = ref([])
const currentFarmName = ref('')
const farmIndex = ref(0)

// 加载用户信息
const loadUserInfo = () => {
  const username = uni.getStorageSync('username') || (typeof localStorage !== 'undefined' ? localStorage.getItem('username') : '')
  const userEmail = uni.getStorageSync('userEmail') || (typeof localStorage !== 'undefined' ? localStorage.getItem('userEmail') : '')
  userInfo.value = userEmail || username || '用户'
}

// 加载系统名称
const loadSystemName = async () => {
  try {
    const result = await call_remote('/get_sys_name', {})
    if (result && result.sys_name && result.sys_name !== 'no name' && result.sys_name !== 'no_name') {
      systemName.value = result.sys_name
    }
  } catch (error) {
    console.error('加载系统名称失败:', error)
    // 保持默认值
  }
}

// 加载农场列表
const loadFarmList = async () => {
  try {
    const farmResult = await call_remote('/resource/list_farm', { pageNo: 0 })
    const farms = farmResult.farms || []
    farmList.value = farms
    
    // 如果有农场且当前没有选中，选择第一个
    if (farms.length > 0 && !currentFarmName.value) {
      currentFarmName.value = farms[0].name
      farmIndex.value = 0
    }
  } catch (error) {
    console.error('加载农场列表失败:', error)
  }
}

// 农场切换事件
const onFarmChange = (e) => {
  const index = e.detail.value
  farmIndex.value = index
  currentFarmName.value = farmList.value[index].name
  // 组件会自动响应 farmName prop 的变化
}

onMounted(async () => {
  // 检查登录状态
  const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null)
  if (!token) {
    uni.redirectTo({
      url: '/pages/login'
    })
    return
  }
  
  loadUserInfo()
  await loadSystemName()
  // 加载农场列表
  await loadFarmList()
  // 其他数据由各个组件自行加载
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f4f8 0%, #e8edf2 50%, #dde5ec 100%);
  padding-bottom: 80px;
}

/* 顶部标题栏 */
.header {
  padding: 40rpx 40rpx 24rpx 40rpx;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.header-logo {
  width: 48rpx;
  height: 48rpx;
  border-radius: 8rpx;
}

.header-right {
  display: flex;
  align-items: center;
}

.farm-picker {
  display: flex;
  align-items: center;
}

.farm-selector {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 24rpx;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 20rpx;
  border: 1px solid rgba(64, 158, 255, 0.3);
}

.picker-arrow {
  font-size: 20rpx;
  color: #409eff;
  margin-left: 4rpx;
}

/* 用户欢迎信息 */
.user-welcome {
  padding: 24rpx 40rpx;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

/* 内容区域 */
.content {
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

/* 响应式调整 */
@media (max-width: 375px) {
  .content {
    padding: 24rpx;
  }
}
</style>
