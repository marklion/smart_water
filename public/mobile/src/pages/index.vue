<template>
  <view class="page">
    <!-- 顶部标题栏 -->
    <PageHeader ref="pageHeaderRef" :show-farm-selector="true" @farm-change="onFarmChange" />

    <!-- 主要内容区域 - 使用 scroll-view 支持滚动 -->
    <scroll-view class="content-scroll" scroll-y :enable-flex="true" :scroll-with-animation="true">
      <!-- 内容区域 -->
      <view class="content">
        <!-- 天气卡片 - 第一个位置 -->
        <WeatherCard />

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
import { ref, nextTick } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import call_remote from '../../../lib/call_remote.js'
import PageHeader from '../components/PageHeader.vue'
import Loading from '../components/Loading.vue'
import BasicInfoCard from './monitoring/BasicInfoCard.vue'
import RealtimeDataCard from './monitoring/RealtimeDataCard.vue'
import DataPanelCard from './monitoring/DataPanelCard.vue'
import WeatherCard from './monitoring/WeatherCard.vue'

const refreshing = ref(false)
const pageLoading = ref(false)
const isFirstLoad = ref(true) // 标记是否是首次加载

// 组件引用
const pageHeaderRef = ref(null)
const basicInfoCardRef = ref(null)
const realtimeDataCardRef = ref(null)
const dataPanelCardRef = ref(null)

// 农场相关
const currentFarmName = ref('')

// 农场切换事件
const onFarmChange = (farmName) => {
  currentFarmName.value = farmName
  // 组件会自动响应 farmName prop 的变化
}

// 下拉刷新
const onRefresh = async () => {
  refreshing.value = true
  try {
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

// 页面显示时加载/刷新数据
onShow(async () => {
  // 检查登录状态
  const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null)
  if (!token) {
    uni.redirectTo({
      url: '/pages/login'
    })
    return
  }

  // 首次加载时显示全屏加载动画
  if (isFirstLoad.value) {
    pageLoading.value = true
    isFirstLoad.value = false
  }

  try {
    // 等待顶部组件加载完成，获取当前农场名称
    await nextTick()
    if (pageHeaderRef.value) {
      await pageHeaderRef.value.refresh()
      currentFarmName.value = pageHeaderRef.value.getCurrentFarmName()
    }
    // 其他数据由各个组件自行加载
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    if (pageLoading.value) {
      // 延迟一下再隐藏加载，确保数据已经渲染
      setTimeout(() => {
        pageLoading.value = false
      }, 300)
    }
  }
})
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  width: 100vw;
  background: linear-gradient(180deg, #f0f4f8 0%, #e8edf2 50%, #dde5ec 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* 内容滚动区域 - scroll-view 需要明确高度 */
.content-scroll {
  /* 改为在文档流内占满剩余空间，避免 H5 固定定位导致无法滚动 */
  flex: 1;
  position: relative;
  margin-top: calc(168rpx + env(safe-area-inset-top));
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
  overflow-y: auto;
  box-sizing: border-box;
  width: 100%;
  /* 移除默认间距 */
  margin-left: 0;
  margin-right: 0;
  padding-left: 0;
  padding-right: 0;
}

/* 内容区域 */
.content {
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 32rpx;
  box-sizing: border-box;
  padding-bottom: 32rpx;
  /* 底部留出一些间距即可，不需要为 tabBar 留空间，因为 scroll-view 已经限制了底部 */
}

/* 响应式调整 */
@media (max-width: 375px) {
  .content {
    padding: 24rpx;
  }
}
</style>
