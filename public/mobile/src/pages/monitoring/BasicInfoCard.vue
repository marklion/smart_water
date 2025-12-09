<template>
  <fui-card :padding="[0, 0]" :margin="[0, 0, 32, 0]" :radius="32" class="premium-card">
    <view class="card-header-wrapper">
      <fui-text text="基本信息" :size="32" :fontWeight="600" color="#303133"></fui-text>
    </view>
    <view class="card-body basic-info-body">
      <view class="basic-info-grid">
        <view class="basic-info-item">
          <view class="info-label">轮灌组数量</view>
          <view class="info-value">{{ basicInfo.waterGroupCount || 0 }}</view>
        </view>
        <view class="basic-info-item">
          <view class="info-label">农场面积</view>
          <view class="info-value">{{ (basicInfo.farmArea || 0) + '亩' }}</view>
        </view>
        <view class="basic-info-item">
          <view class="info-label">作物名称</view>
          <view class="info-value">{{ basicInfo.cropName || '-' }}</view>
        </view>
        <view class="basic-info-item">
          <view class="info-label">设备总数量</view>
          <view class="info-value">{{ basicInfo.totalDevices || 0 }}</view>
        </view>
        <view class="basic-info-item">
          <view class="info-label">在线设备</view>
          <view class="info-value online">{{ basicInfo.onlineDevices || 0 }}</view>
        </view>
        <view class="basic-info-item">
          <view class="info-label">离线设备</view>
          <view class="info-value offline">{{ basicInfo.offlineDevices || 0 }}</view>
        </view>
      </view>
    </view>
  </fui-card>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import call_remote from '../../../../lib/call_remote.js'
import fuiText from 'firstui-uni/firstui/fui-text/fui-text.vue'
import fuiCard from 'firstui-uni/firstui/fui-card/fui-card.vue'

const props = defineProps({
  farmName: {
    type: String,
    default: ''
  }
})

const basicInfo = ref({
  waterGroupCount: 0,
  farmArea: 0,
  cropName: '-',
  totalDevices: 0,
  onlineDevices: 0,
  offlineDevices: 0
})

// 加载基本信息
const loadBasicInfo = async () => {
  try {
    if (!props.farmName) {
      basicInfo.value = {
        waterGroupCount: 0,
        farmArea: 0,
        cropName: '-',
        totalDevices: 0,
        onlineDevices: 0,
        offlineDevices: 0
      }
      return
    }

    const result = await call_remote('/monitoring/getBasicInfo', {
      farmName: props.farmName
    })

    basicInfo.value = {
      waterGroupCount: result.waterGroupCount || 0,
      farmArea: result.totalArea || 0,
      cropName: result.cropName || '-',
      totalDevices: result.totalDevices || 0,
      onlineDevices: result.onlineDevices || 0,
      offlineDevices: result.offlineDevices || 0
    }
  } catch (error) {
    console.error('加载基本信息失败:', error)
  }
}

watch(() => props.farmName, () => {
  loadBasicInfo()
})

onMounted(() => {
  loadBasicInfo()
})

defineExpose({
  refresh: loadBasicInfo
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

.card-body {
  padding: 24rpx 48rpx 36rpx 48rpx;
  background: transparent;
}

.basic-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200rpx, 1fr));
  gap: 16rpx;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.basic-info-item {
  display: flex;
  flex-direction: column;
  padding: 16rpx 24rpx;
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 16rpx;
  border: 1px solid rgba(255, 255, 255, 0.5);
  text-align: center;
  box-shadow:
    0 4rpx 16rpx rgba(0, 0, 0, 0.06),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.8);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
}

.basic-info-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
}

.basic-info-item:hover {
  transform: translateY(-4rpx);
  box-shadow:
    0 16rpx 48rpx rgba(0, 0, 0, 0.08),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.9);
  border-color: rgba(102, 126, 234, 0.2);
}

.info-label {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
  font-weight: 500;
}

.info-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #409eff;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.info-value.online {
  color: #67c23a;
}

.info-value.offline {
  color: #f56c6c;
}
</style>
