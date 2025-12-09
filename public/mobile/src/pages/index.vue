<template>
  <view class="page">
    <!-- 顶部标题栏 -->
    <PageHeader ref="pageHeaderRef" :show-farm-selector="true" @farm-change="onFarmChange" />

    <!-- 用户欢迎信息 -->
    <view class="user-welcome">
      <fui-text :text="userInfo + ', 欢迎您'" :size="28" color="#606266"></fui-text>
    </view>

    <!-- 主要内容区域 -->
    <scroll-view class="content-scroll" scroll-y refresher-enabled :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh">
      <view class="content">
        <!-- 基本信息卡片 -->
        <BasicInfoCard ref="basicInfoCardRef" :farmName="currentFarmName" />

        <!-- 实时数据卡片 -->
        <RealtimeDataCard ref="realtimeDataCardRef" />

        <!-- 数据面板卡片 -->
        <DataPanelCard ref="dataPanelCardRef" />
      </view>
    </scroll-view>

    <!-- 加载组件 -->
    <Loading :show="pageLoading" text="加载中..." />
  </view>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import call_remote from '../../../lib/call_remote.js'
import fuiText from 'firstui-uni/firstui/fui-text/fui-text.vue'
import PageHeader from '../components/PageHeader.vue'
import Loading from '../components/Loading.vue'
import BasicInfoCard from './monitoring/BasicInfoCard.vue'
import RealtimeDataCard from './monitoring/RealtimeDataCard.vue'
import DataPanelCard from './monitoring/DataPanelCard.vue'

const userInfo = ref('')
const refreshing = ref(false)
const pageLoading = ref(false)

// 组件引用
const pageHeaderRef = ref(null)
const basicInfoCardRef = ref(null)
const realtimeDataCardRef = ref(null)
const dataPanelCardRef = ref(null)

// 农场相关
const currentFarmName = ref('')

// 加载用户信息
const loadUserInfo = () => {
  const username = uni.getStorageSync('username') || (typeof localStorage !== 'undefined' ? localStorage.getItem('username') : '')
  const userEmail = uni.getStorageSync('userEmail') || (typeof localStorage !== 'undefined' ? localStorage.getItem('userEmail') : '')
  userInfo.value = userEmail || username || '用户'
}

// 农场切换事件
const onFarmChange = (farmName) => {
  currentFarmName.value = farmName
  // 组件会自动响应 farmName prop 的变化
}

// 下拉刷新
const onRefresh = async () => {
  refreshing.value = true
  try {
    // 刷新用户信息
    loadUserInfo()

    // 并行刷新所有组件
    const refreshTasks = []

    // 刷新顶部组件
    if (pageHeaderRef.value && pageHeaderRef.value.refresh) {
      refreshTasks.push(
        Promise.resolve(pageHeaderRef.value.refresh()).then(() => {
          currentFarmName.value = pageHeaderRef.value.getCurrentFarmName()
        }).catch(err => {
          console.error('刷新顶部组件失败:', err)
        })
      )
    }

    // 刷新所有卡片组件（并行执行，使用 Promise.resolve 确保返回 Promise）
    if (basicInfoCardRef.value && basicInfoCardRef.value.refresh) {
      refreshTasks.push(
        Promise.resolve(basicInfoCardRef.value.refresh()).catch(err => {
          console.error('刷新基本信息卡片失败:', err)
        })
      )
    }
    if (realtimeDataCardRef.value && realtimeDataCardRef.value.refresh) {
      refreshTasks.push(
        Promise.resolve(realtimeDataCardRef.value.refresh()).catch(err => {
          console.error('刷新实时数据卡片失败:', err)
        })
      )
    }
    if (dataPanelCardRef.value && dataPanelCardRef.value.refresh) {
      refreshTasks.push(
        Promise.resolve(dataPanelCardRef.value.refresh()).catch(err => {
          console.error('刷新数据面板卡片失败:', err)
        })
      )
    }

    // 等待所有刷新任务完成（使用 allSettled 确保即使有失败也不影响其他）
    await Promise.allSettled(refreshTasks)

    uni.showToast({
      title: '刷新完成',
      icon: 'success',
      duration: 1500
    })
  } catch (error) {
    console.error('刷新失败:', error)
    uni.showToast({
      title: '刷新失败，请重试',
      icon: 'none',
      duration: 2000
    })
  } finally {
    refreshing.value = false
  }
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

  pageLoading.value = true
  try {
    loadUserInfo()
    // 等待顶部组件加载完成，获取当前农场名称
    await nextTick()
    if (pageHeaderRef.value) {
      await pageHeaderRef.value.refresh()
      currentFarmName.value = pageHeaderRef.value.getCurrentFarmName()
    }
    // 其他数据由各个组件自行加载
  } finally {
    // 延迟一下再隐藏加载，确保数据已经渲染
    setTimeout(() => {
      pageLoading.value = false
    }, 300)
  }
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f4f8 0%, #e8edf2 50%, #dde5ec 100%);
  padding-bottom: 80px;
  display: flex;
  flex-direction: column;
}


/* 用户欢迎信息 */
.user-welcome {
  padding: 24rpx 40rpx;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

/* 内容滚动区域 */
.content-scroll {
  flex: 1;
  box-sizing: border-box;
  overflow-y: auto;
}

/* 内容区域 */
.content {
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 32rpx;
  min-height: 100%;
  box-sizing: border-box;
}

/* 响应式调整 */
@media (max-width: 375px) {
  .content {
    padding: 24rpx;
  }
}
</style>
