<template>
    <view class="page">
        <!-- 顶部标题栏 -->
        <PageHeader ref="pageHeaderRef" :show-farm-selector="false" />

        <!-- 主要内容区域 - 使用 scroll-view 支持下拉刷新 -->
        <scroll-view class="content-scroll" scroll-y refresher-enabled :refresher-triggered="refreshing"
            @refresherrefresh="onRefresh" :enable-back-to-top="true">
            <view class="content">
                <!-- 用户信息卡片 -->
                <view class="user-card">
                    <view class="user-avatar">
                        <fui-text :text="userInitial" :size="48" :fontWeight="700" color="#ffffff"></fui-text>
                    </view>
                    <view class="user-info">
                        <fui-text :text="userInfo" :size="32" :fontWeight="600" color="#303133"></fui-text>
                        <fui-text :text="userEmail || username || '用户'" :size="24" color="#909399"></fui-text>
                    </view>
                </view>

                <!-- 功能列表 -->
                <view class="menu-section">
                    <view class="menu-item" @click="handleLogout">
                        <view class="menu-icon logout-icon">
                            <text class="icon-text">退出</text>
                        </view>
                        <view class="menu-content">
                            <fui-text :text="'退出登录'" :size="28" color="#303133"></fui-text>
                            <fui-text :text="'安全退出当前账号'" :size="24" color="#909399"></fui-text>
                        </view>
                        <view class="menu-arrow">
                            <text>></text>
                        </view>
                    </view>
                </view>
            </view>
        </scroll-view>

        <!-- 加载组件 -->
        <Loading :show="pageLoading" text="加载中..." />
    </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import call_remote from '../../../../lib/call_remote.js'
import fuiText from 'firstui-uni/firstui/fui-text/fui-text.vue'
import PageHeader from '../../components/PageHeader.vue'
import Loading from '../../components/Loading.vue'

const refreshing = ref(false)
const userInfo = ref('')
const username = ref('')
const userEmail = ref('')
const pageHeaderRef = ref(null)
const pageLoading = ref(false)
const isFirstLoad = ref(true) // 标记是否是首次加载

// 用户头像首字母
const userInitial = computed(() => {
    const name = userEmail.value || username.value || '用户'
    return name.charAt(0).toUpperCase()
})

// 加载用户信息
const loadUserInfo = () => {
    username.value = uni.getStorageSync('username') || (typeof localStorage !== 'undefined' ? localStorage.getItem('username') : '')
    userEmail.value = uni.getStorageSync('userEmail') || (typeof localStorage !== 'undefined' ? localStorage.getItem('userEmail') : '')
    userInfo.value = userEmail.value || username.value || '用户'
}

// 下拉刷新
const onRefresh = async () => {
    refreshing.value = true
    try {
        // 刷新顶部组件
        if (pageHeaderRef.value && pageHeaderRef.value.refresh) {
            await pageHeaderRef.value.refresh()
        }
        loadUserInfo()
    } catch (error) {
        console.error('刷新失败:', error)
    } finally {
        refreshing.value = false
    }
}

// 退出登录
const handleLogout = () => {
    uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: async (res) => {
            if (res.confirm) {
                // 清除本地存储
                uni.removeStorageSync('auth_token')
                uni.removeStorageSync('username')
                uni.removeStorageSync('userEmail')
                if (typeof localStorage !== 'undefined') {
                    localStorage.removeItem('auth_token')
                    localStorage.removeItem('username')
                    localStorage.removeItem('userEmail')
                }

                // 清除 axios headers
                try {
                    const axios = (await import('axios')).default
                    delete axios.defaults.headers.common['token']
                } catch (e) {
                    console.error('清除 axios headers 失败:', e)
                }

                // 跳转到登录页
                uni.reLaunch({
                    url: '/pages/login'
                })
            }
        }
    })
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
        loadUserInfo()
        // 等待顶部组件加载完成
        if (pageHeaderRef.value) {
            await pageHeaderRef.value.refresh()
        }
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
    position: fixed;
    /* PageHeader 总高度 = min-height(120rpx) + padding-top(24rpx + safe-area) + padding-bottom(24rpx) = 168rpx + env(safe-area-inset-top) */
    top: calc(168rpx + env(safe-area-inset-top));
    /* 底部 tabBar 高度 + 安全区 */
    bottom: calc(120rpx + env(safe-area-inset-bottom));
    left: 0;
    right: 0;
    width: 100%;
    box-sizing: border-box;
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

/* 用户信息卡片 */
.user-card {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-radius: 20rpx;
    padding: 40rpx;
    display: flex;
    align-items: center;
    gap: 24rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.06);
}

.user-avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #409eff 0%, #6a8dff 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4rpx 12rpx rgba(64, 158, 255, 0.3);
}

.user-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

/* 功能列表 */
.menu-section {
    background: #ffffff;
    border-radius: 20rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.06);
}

.menu-item {
    display: flex;
    align-items: center;
    padding: 32rpx 40rpx;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    transition: background-color 0.3s ease;
}

.menu-item:last-child {
    border-bottom: none;
}

.menu-item:active {
    background-color: #f5f7fa;
}

.menu-icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;
}

.logout-icon {
    background: linear-gradient(135deg, #f56c6c 0%, #ff7875 100%);
}

.icon-text {
    font-size: 28rpx;
    color: #ffffff;
    font-weight: 600;
}

.menu-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.menu-arrow {
    font-size: 32rpx;
    color: #c0c4cc;
    margin-left: 16rpx;
}

/* 响应式调整 */
@media (max-width: 375px) {
    .content {
        padding: 24rpx;
    }

    .user-card {
        padding: 32rpx;
    }

    .menu-item {
        padding: 28rpx 32rpx;
    }
}
</style>
