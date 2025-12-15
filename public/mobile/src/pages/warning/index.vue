<template>
  <view class="page">
    <!-- 顶部标题栏 -->
    <PageHeader ref="pageHeaderRef" :show-farm-selector="true" @farm-change="onFarmChange" />

    <!-- 主要内容区域 -->
    <scroll-view class="content-scroll" scroll-y :enable-flex="true">
      <view class="content">
        <WarningCard ref="warningCardRef" />
      </view>
    </scroll-view>

    <!-- 加载组件 -->
    <Loading :show="pageLoading" text="加载中..." />
  </view>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageHeader from '../../components/PageHeader.vue'
import Loading from '../../components/Loading.vue'
import WarningCard from '../monitoring/WarningCard.vue'

const pageHeaderRef = ref(null)
const warningCardRef = ref(null)
const pageLoading = ref(false)
const isFirstLoad = ref(true)
const currentFarmName = ref('')

// 农场切换事件
const onFarmChange = (farmName) => {
  currentFarmName.value = farmName
  // 刷新告警数据
  if (warningCardRef.value && warningCardRef.value.refresh) {
    warningCardRef.value.refresh()
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
    // 告警数据由 WarningCard 组件自行加载
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

.content-scroll {
  flex: 1;
  position: relative;
  margin-top: calc(168rpx + env(safe-area-inset-top));
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
  overflow-y: auto;
  box-sizing: border-box;
  width: 100%;
  margin-left: 0;
  margin-right: 0;
  padding-left: 0;
  padding-right: 0;
}

.content {
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 32rpx;
  box-sizing: border-box;
  padding-bottom: 32rpx;
}
</style>

