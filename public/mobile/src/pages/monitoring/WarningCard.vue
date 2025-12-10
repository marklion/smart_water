<template>
  <fui-card :padding="[0, 0]" :margin="[0, 0, 32, 0]" :radius="32" class="premium-card">
    <view class="card-header-wrapper">
      <view class="header-row">
        <fui-text text="系统告警" :size="32" :fontWeight="600" color="#303133"></fui-text>
        <view v-if="warningList.length > 0" class="warning-badge">
          <fui-text :text="String(warningList.length)" :size="22" :fontWeight="600" color="#ffffff"></fui-text>
        </view>
      </view>
    </view>
    <view class="card-body warning-body">
      <view v-if="warningList.length > 0" class="warning-list">
        <view 
          v-for="(warning, index) in warningList" 
          :key="index" 
          class="warning-item"
        >
          <view class="warning-content">
            <view class="warning-title-row">
              <fui-text :text="warning.title || warning.warning_type || '警告'" :size="28" :fontWeight="600" :color="getWarningColor(warning.level || warning.severity)"></fui-text>
              <fui-text :text="formatTime(warning.timestamp || warning.create_time)" :size="22" color="#909399"></fui-text>
            </view>
            <view class="warning-desc">
              <fui-text :text="warning.description || warning.message || warning.content || '无描述'" :size="24" color="#606266"></fui-text>
            </view>
          </view>
        </view>
      </view>
      <view v-else class="empty-state">
        <fui-text text="暂无警告" :size="28" color="#909399"></fui-text>
      </view>
    </view>
  </fui-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import call_remote from '../../../../lib/call_remote.js'
import fuiText from 'firstui-uni/firstui/fui-text/fui-text.vue'
import fuiCard from 'firstui-uni/firstui/fui-card/fui-card.vue'

const warningList = ref([])

// 加载警告数据
const loadWarningData = async () => {
  try {
    const warningResult = await call_remote('/warning/list_warnings', { pageNo: 0 })
    const warnings = warningResult.warnings || []
    // 按时间倒序排列，最新的在前
    warningList.value = warnings.sort((a, b) => {
      const timeA = new Date(a.timestamp || a.create_time || 0).getTime()
      const timeB = new Date(b.timestamp || b.create_time || 0).getTime()
      return timeB - timeA
    })
  } catch (error) {
    console.error('加载警告数据失败:', error)
    warningList.value = []
  }
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '--'
  try {
    const date = new Date(timeStr)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  } catch (error) {
    return '--'
  }
}

// 获取警告颜色
const getWarningColor = (level) => {
  if (!level) return '#e6a23c'
  const levelStr = String(level).toLowerCase()
  if (levelStr.includes('严重') || levelStr.includes('critical') || levelStr.includes('error')) {
    return '#f56c6c'
  }
  if (levelStr.includes('警告') || levelStr.includes('warning')) {
    return '#e6a23c'
  }
  if (levelStr.includes('信息') || levelStr.includes('info')) {
    return '#409eff'
  }
  return '#e6a23c'
}

onMounted(() => {
  loadWarningData()
})

// 暴露刷新方法给父组件
defineExpose({
  refresh: loadWarningData
})
</script>

<style lang="scss" scoped>
.premium-card {
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 32rpx !important;
  box-shadow: 
    0 16rpx 64rpx rgba(0, 0, 0, 0.08),
    0 4rpx 16rpx rgba(0, 0, 0, 0.04),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
  position: relative;
}

.premium-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4rpx;
  background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
  opacity: 0.8;
}

.card-header-wrapper {
  padding: 40rpx 48rpx 32rpx 48rpx;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  position: relative;
}

.card-header-wrapper::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 48rpx;
  right: 48rpx;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.warning-badge {
  background: linear-gradient(135deg, #f56c6c 0%, #e6a23c 100%);
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  min-width: 40rpx;
  text-align: center;
  box-shadow: 0 2rpx 8rpx rgba(245, 108, 108, 0.3);
}

.card-body {
  padding: 24rpx 48rpx 36rpx 48rpx;
  background: transparent;
}

.warning-body {
  padding: 24rpx 48rpx 36rpx 48rpx;
}

.warning-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.warning-item {
  padding: 24rpx 32rpx;
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 24rpx;
  border-left: 4rpx solid #e6a23c;
  box-shadow: 
    0 4rpx 16rpx rgba(0, 0, 0, 0.06),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.8);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
}

.warning-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, rgba(230, 162, 60, 0.3), transparent);
}

.warning-item:hover {
  transform: translateY(-4rpx);
  box-shadow: 
    0 16rpx 48rpx rgba(0, 0, 0, 0.08),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.9);
}

.warning-content {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.warning-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16rpx;
}

.warning-desc {
  line-height: 1.6;
  word-break: break-word;
}

.empty-state {
  padding: 60rpx 0;
  text-align: center;
}
</style>

