<template>
  <fui-card :padding="[0, 0]" :margin="[0, 0, 32, 0]" :radius="32" class="premium-card">
    <view class="card-header-wrapper">
      <view class="header-row">
        <fui-text text="实时数据" :size="32" :fontWeight="600" color="#303133"></fui-text>
        <view class="update-time">
          <fui-text :text="'更新: ' + lastUpdateTime" :size="22" color="#909399"></fui-text>
        </view>
      </view>
    </view>
    <view class="card-body realtime-body">
      <view v-if="realtimeDataList.length > 0" class="realtime-grid">
        <view v-for="(item, index) in realtimeDataList" :key="index" class="realtime-item">
          <view class="realtime-label">
            <fui-text :text="item.label" :size="24" color="#606266"></fui-text>
          </view>
          <view class="realtime-value">
            <fui-text :text="formatValue(item.value)" :size="36" :fontWeight="700"
              :color="getValueColor(item.value, item.label)"></fui-text>
            <fui-text v-if="item.unit" :text="item.unit" :size="20" color="#909399" :padding="[4, 0, 0, 8]"></fui-text>
          </view>
        </view>
      </view>
      <view v-else class="empty-state">
        <fui-text text="暂无实时数据" :size="28" color="#909399"></fui-text>
      </view>
    </view>
  </fui-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import call_remote from '../../../../lib/call_remote.js'
import fuiText from 'firstui-uni/firstui/fui-text/fui-text.vue'
import fuiCard from 'firstui-uni/firstui/fui-card/fui-card.vue'

const realtimeDataList = ref([])
const lastUpdateTime = ref('--:--:--')

// 获取单位
const getUnitForItem = (itemName) => {
  if (itemName.includes('流量') || itemName.includes('流速')) {
    return 'm³/h'
  }
  if (itemName.includes('压力')) {
    return 'MPa'
  }
  if (itemName.includes('液位')) {
    return 'm'
  }
  if (itemName.includes('温度')) {
    return '°C'
  }
  if (itemName.includes('施肥') || itemName.includes('肥料')) {
    return 'L'
  }
  if (itemName.includes('用水') || itemName.includes('水量')) {
    return 'm³'
  }
  return ''
}

// 格式化数值
const formatValue = (value) => {
  if (value === null || value === undefined) return '0'
  const num = parseFloat(value)
  if (isNaN(num)) return '0'
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K'
  }
  if (num >= 100) {
    return num.toFixed(1)
  }
  return num.toFixed(2)
}

// 根据数值获取颜色
const getValueColor = (value, label) => {
  const num = parseFloat(value) || 0
  if (label.includes('压力') || label.includes('液位')) {
    if (num > 80) return '#f56c6c'
    if (num > 50) return '#e6a23c'
    return '#67c23a'
  }
  if (label.includes('温度')) {
    if (num > 35) return '#f56c6c'
    if (num > 25) return '#e6a23c'
    return '#409eff'
  }
  return '#303133'
}

// 加载实时数据
const loadRealtimeData = async () => {
  try {
    // 获取实时数据配置
    const configResponse = await call_remote('/resource/list_realtime', { pageNo: 0 })

    // 如果没有配置，清空数据
    if (!configResponse || !configResponse.configs || configResponse.configs.length === 0) {
      realtimeDataList.value = []
      lastUpdateTime.value = '--:--:--'
      return
    }

    const configs = configResponse.configs
    const realtimeList = []

    // 根据配置获取设备实时数据
    for (const config of configs) {
      try {
        // 获取设备信息
        const deviceResult = await call_remote('/device_management/get_device', {
          device_name: config.device_name
        })

        if (deviceResult && deviceResult.device) {
          const device = deviceResult.device
          // 根据配置的item_name获取对应的值
          let value = 0
          let label = config.item_name || config.device_name

          // 从设备数据中获取对应的值
          if (device.current_values && device.current_values[config.item_name]) {
            value = parseFloat(device.current_values[config.item_name]) || 0
          } else if (device.value !== undefined) {
            value = parseFloat(device.value) || 0
          }

          // 只添加有值的配置项
          if (value > 0 || device.is_online) {
            realtimeList.push({
              label: label,
              value: value,
              unit: getUnitForItem(config.item_name || config.device_name)
            })
          }
        }
      } catch (error) {
        console.warn(`获取设备 ${config.device_name} 实时数据失败:`, error)
      }
    }

    realtimeDataList.value = realtimeList
    if (realtimeList.length > 0) {
      lastUpdateTime.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
    } else {
      lastUpdateTime.value = '--:--:--'
    }
  } catch (error) {
    console.error('加载实时数据失败:', error)
    realtimeDataList.value = []
    lastUpdateTime.value = '--:--:--'
  }
}

// 定时刷新实时数据
let realtimeTimer = null
const startRealtimeTimer = () => {
  if (realtimeTimer) {
    clearInterval(realtimeTimer)
  }
  realtimeTimer = setInterval(() => {
    loadRealtimeData()
  }, 30000) // 每30秒刷新一次
}

onMounted(() => {
  loadRealtimeData()
  startRealtimeTimer()
})

onUnmounted(() => {
  if (realtimeTimer) {
    clearInterval(realtimeTimer)
    realtimeTimer = null
  }
})

defineExpose({
  refresh: loadRealtimeData
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

.update-time {
  display: flex;
  align-items: center;
}

.card-body {
  padding: 24rpx 48rpx 36rpx 48rpx;
  background: transparent;
}

.realtime-body {
  padding: 24rpx 48rpx 36rpx 48rpx;
}

.realtime-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.realtime-item {
  padding: 24rpx 32rpx;
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 24rpx;
  border: 1px solid rgba(255, 255, 255, 0.5);
  text-align: center;
  box-shadow:
    0 4rpx 16rpx rgba(0, 0, 0, 0.06),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.8);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
}

.realtime-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, rgba(64, 158, 255, 0.3), transparent);
}

.realtime-item:hover {
  transform: translateY(-4rpx);
  box-shadow:
    0 16rpx 48rpx rgba(0, 0, 0, 0.08),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.9);
  border-color: rgba(64, 158, 255, 0.2);
}

.realtime-label {
  margin-bottom: 12rpx;
}

.realtime-value {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  justify-content: center;
}

.empty-state {
  padding: 60rpx 0;
  text-align: center;
}
</style>
