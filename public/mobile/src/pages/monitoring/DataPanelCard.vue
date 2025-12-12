<template>
  <fui-card :padding="[0, 0]" :margin="[0, 0, 0, 0]" radius="32" class="premium-card">
    <view class="card-header-wrapper">
      <fui-text text="数据面板" :size="32" :fontWeight="600" color="#303133"></fui-text>
    </view>
    <view class="card-body panel-body">
      <view v-if="panelDataList.length > 0" class="panel-grid">
        <view v-for="(item, index) in panelDataList" :key="index" class="panel-item">
          <view class="panel-label">
            <fui-text :text="item.label" :size="24" color="#606266"></fui-text>
          </view>
          <view class="panel-value">
            <fui-text :text="formatPanelValue(item.value, item.unit)" :size="40" :fontWeight="700"
              :color="getPanelValueColor(index)"></fui-text>
            <fui-text v-if="item.unit" :text="item.unit" :size="22" color="#909399" :padding="[4, 0, 0, 8]"></fui-text>
          </view>
        </view>
      </view>
      <view v-else class="empty-state">
        <fui-text text="暂无数据" :size="28" color="#909399"></fui-text>
      </view>
    </view>
  </fui-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import call_remote from '../../../../lib/call_remote.js'
import fuiText from 'firstui-uni/firstui/fui-text/fui-text.vue'
import fuiCard from 'firstui-uni/firstui/fui-card/fui-card.vue'

const panelDataList = ref([])

// 生成数据面板标签（和PC端逻辑一致）
const generatePanelLabel = (itemName) => {
  // 移除农场名称前缀
  let name = itemName.replace(/^[^_]+_/, '')

  // 将下划线替换为空格
  name = name.replace(/_/g, ' ')

  // 常见的中文映射
  const translations = {
    'total flow': '总计流量',
    'main pipe flow': '主管流量',
    'main pipe pressure': '主管压力',
    'fertilizer rate': '施肥率',
    'fertilizer flow': '肥料流量',
    'total fertilizer': '总施肥量',
    'water usage': '用水量',
    'flow rate': '流量',
    'pressure': '压力',
    'temperature': '温度',
    'humidity': '湿度',
    'ph': 'PH值',
    'ec': 'EC值',
    'nutrient': '营养液',
    'pump': '泵',
    'valve': '阀门',
    'sensor': '传感器'
  }

  // 尝试匹配翻译
  for (const [en, zh] of Object.entries(translations)) {
    if (name.toLowerCase().includes(en)) {
      return zh
    }
  }

  // 如果没有匹配，返回原始名称（首字母大写）
  return name.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

// 获取数据面板单位
const getPanelUnit = (itemName) => {
  const name = itemName.toLowerCase()
  if (name.includes('flow') || name.includes('流量')) {
    return 'm³/h'
  } else if (name.includes('pressure') || name.includes('压力')) {
    return 'MPa'
  } else if (name.includes('fertilizer_rate') || name.includes('施肥率')) {
    return 'L/亩'
  } else if (name.includes('fertilizer') || name.includes('施肥') || name.includes('肥料')) {
    return 'L/h'
  } else if (name.includes('temperature') || name.includes('温度')) {
    return '°C'
  } else if (name.includes('total') || name.includes('总计') || name.includes('累计')) {
    return 'm³'
  } else if (name.includes('water') || name.includes('水')) {
    return 'm³'
  }
  return ''
}

// 格式化数据面板数值
const formatPanelValue = (value, unit) => {
  if (value === null || value === undefined) return '0.00'
  const num = parseFloat(value)
  if (isNaN(num)) return '0.00'

  // 根据单位决定小数位数
  if (unit === 'MPa' || unit === 'm³/h' || unit === 'L/h') {
    return num.toFixed(2)
  } else if (unit === 'm³' || unit === 'L') {
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K'
    }
    return num.toFixed(1)
  }
  return num.toFixed(2)
}

// 获取数据面板数值颜色
const getPanelValueColor = (index) => {
  const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399']
  return colors[index % colors.length]
}

// 加载数据面板数据 - 和PC端一样，从统计项读取
const loadPanelData = async () => {
  try {
    // 获取所有统计项列表（st_开头的文件）
    const itemsResponse = await call_remote('/statistic/list_items', { pageNo: 0 })

    if (!itemsResponse || !itemsResponse.items || itemsResponse.items.length === 0) {
      panelDataList.value = []
      return
    }

    const items = itemsResponse.items
    const panelList = []

    // 获取每个统计项的最新值
    for (const item of items) {
      try {
        const historyResponse = await call_remote('/statistic/list_item_history', {
          item_name: item.item_name,
          pageNo: 0
        })

        if (historyResponse && historyResponse.records && historyResponse.records.length > 0) {
          const latestRecord = historyResponse.records[0]
          const value = parseFloat(latestRecord.value) || 0

          // 生成显示标签（和PC端逻辑一致）
          const label = generatePanelLabel(item.item_name)
          const unit = getPanelUnit(item.item_name)

          panelList.push({
            label: label,
            value: value,
            unit: unit,
            itemName: item.item_name
          })
        }
      } catch (error) {
        console.warn(`获取统计项 ${item.item_name} 历史数据失败:`, error)
      }
    }

    panelDataList.value = panelList
  } catch (error) {
    console.error('加载数据面板失败:', error)
    panelDataList.value = []
  }
}

onMounted(() => {
  loadPanelData()
})

defineExpose({
  refresh: loadPanelData
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

.panel-body {
  padding: 24rpx 48rpx 36rpx 48rpx;
}

.panel-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.panel-item {
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

.panel-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, rgba(64, 158, 255, 0.3), transparent);
}

.panel-item:hover {
  transform: translateY(-4rpx);
  box-shadow:
    0 16rpx 48rpx rgba(0, 0, 0, 0.08),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.9);
  border-color: rgba(64, 158, 255, 0.2);
}

.panel-label {
  margin-bottom: 16rpx;
}

.panel-value {
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
