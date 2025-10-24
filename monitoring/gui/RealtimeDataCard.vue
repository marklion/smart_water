<template>
  <el-card class="realtime-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span class="card-title">实时数据</span>
        <div class="header-actions">
          <el-button 
            type="primary" 
            size="small" 
            :icon="Refresh" 
            @click="refreshData"
            :loading="loading"
          >
            刷新
          </el-button>
          <el-switch
            v-model="autoRefresh"
            active-text="自动刷新"
            size="small"
            @change="toggleAutoRefresh"
          />
        </div>
      </div>
    </template>

    <div class="realtime-data" v-if="dataItems.length > 0">
      <div class="data-item" v-for="item in dataItems" :key="item.key">
        <div class="data-label">{{ item.label }}</div>
        <div class="data-value" :class="item.valueClass">
          {{ item.value }}
        </div>
        <div class="data-unit">{{ item.unit }}</div>
      </div>
    </div>
    
    <!-- 无数据时的提示 -->
    <div v-else class="no-data">
      <el-empty description="暂无实时数据" :image-size="80" />
    </div>

    <!-- 最后更新时间 -->
    <div class="last-update" v-if="lastUpdateTime">
      <el-icon><Clock /></el-icon>
      <span>最后更新：{{ lastUpdateTime }}</span>
    </div>
  </el-card>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Clock } from '@element-plus/icons-vue'
import call_remote from '../../public/lib/call_remote.js'

// 定义props
const props = defineProps({
  farmName: {
    type: String,
    required: false
  }
})

// 响应式数据
const loading = ref(false)
const autoRefresh = ref(true)
const lastUpdateTime = ref('')
const refreshInterval = ref(null)

// 实时数据 - 动态存储用户配置的统计项
const realtimeData = reactive({})

// 数据项配置 - 根据后端返回的数据动态生成
const dataItems = computed(() => {
  return Object.entries(realtimeData).map(([key, data], index) => {
    // 根据统计项名称生成显示标签
    const label = generateLabel(key)
    
    // 根据索引分配样式类
    const valueClasses = ['primary', 'success', 'warning', 'info', 'danger']
    const valueClass = valueClasses[index % valueClasses.length]
    
    return {
      key: key,
      label: label,
      value: data.value.toFixed(data.unit === 'mpa' ? 2 : 1),
      unit: data.unit,
      valueClass: valueClass,
      timestamp: data.timestamp
    }
  })
})

// 根据统计项名称生成显示标签
const generateLabel = (itemName) => {
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

// 根据统计项名称推断单位
const getUnitForItem = (itemName) => {
  const name = itemName.toLowerCase()
  if (name.includes('flow') || name.includes('流量')) {
    return 'm³/h'
  } else if (name.includes('pressure') || name.includes('压力')) {
    return 'mpa'
  } else if (name.includes('fertilizer_rate') || name.includes('施肥率')) {
    return 'L/亩'
  } else if (name.includes('fertilizer') || name.includes('施肥') || name.includes('肥料')) {
    return 'L/h'
  } else if (name.includes('temperature') || name.includes('温度')) {
    return '°C'
  } else if (name.includes('total') || name.includes('总计')) {
    return 'm³'
  } else if (name.includes('water') || name.includes('水')) {
    return 'm³'
  } else {
    return ''
  }
}

// 加载实时数据
const loadRealtimeData = async () => {
  try {
    loading.value = true
    // 1. 获取所有统计项列表
    const itemsResponse = await call_remote('/statistic/list_items', { pageNo: 0 })
    
    if (!itemsResponse || !itemsResponse.items) {
      // 清空数据
      Object.keys(realtimeData).forEach(key => {
        delete realtimeData[key]
      })
      return
    }
    
    // 2. 显示所有统计项（不再根据农场筛选）
    // 直接使用所有统计项，不进行农场筛选
    const farmItems = itemsResponse.items
    
    // 3. 获取每个统计项的最新值
    const realtimeDataResult = {}
    
    for (const item of farmItems) {
      try {
        const historyResponse = await call_remote('/statistic/list_item_history', { 
          item_name: item.item_name, 
          pageNo: 0 
        })
        
        if (historyResponse && historyResponse.records && historyResponse.records.length > 0) {
          const latestRecord = historyResponse.records[0]
          realtimeDataResult[item.item_name] = {
            value: parseFloat(latestRecord.value) || 0,
            timestamp: latestRecord.timestamp,
            unit: getUnitForItem(item.item_name)
          }
        } else {
          realtimeDataResult[item.item_name] = {
            value: 0,
            timestamp: null,
            unit: getUnitForItem(item.item_name)
          }
        }
      } catch (error) {
        console.warn(`获取统计项 ${item.item_name} 历史数据失败:`, error)
        realtimeDataResult[item.item_name] = {
          value: 0,
          timestamp: null,
          unit: getUnitForItem(item.item_name)
        }
      }
    }
    
    
    // 4. 更新数据
    // 清空现有数据
    Object.keys(realtimeData).forEach(key => {
      delete realtimeData[key]
    })
    
    // 更新为新的动态数据
    Object.assign(realtimeData, realtimeDataResult)
    
    // 更新最后更新时间
    lastUpdateTime.value = new Date().toLocaleTimeString()
    
  } catch (error) {
    console.error('加载实时数据失败:', error)
    ElMessage.error('获取实时数据失败')
    
    // 清空数据
    Object.keys(realtimeData).forEach(key => {
      delete realtimeData[key]
    })
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = async () => {
  await loadRealtimeData()
  ElMessage.success('数据已刷新')
}

// 切换自动刷新
const toggleAutoRefresh = (enabled) => {
  if (enabled) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

// 开始自动刷新
const startAutoRefresh = () => {
  stopAutoRefresh() // 先清除现有的定时器
  refreshInterval.value = setInterval(() => {
    loadRealtimeData()
  }, 30000) // 每30秒刷新一次
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

// 组件挂载时直接加载数据并开始自动刷新
onMounted(() => {
  loadRealtimeData()
  if (autoRefresh.value) {
    startAutoRefresh()
  }
})

// 组件卸载时清理定时器
onUnmounted(() => {
  stopAutoRefresh()
})

// 暴露方法给父组件
defineExpose({
  refreshData,
  loadRealtimeData
})
</script>

<style scoped>
.realtime-card {
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
}

.realtime-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #67c23a, #409eff, #e6a23c);
  opacity: 0.8;
}

.realtime-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.08),
    0 4px 12px rgba(0, 0, 0, 0.04);
  border-color: rgba(64, 158, 255, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.realtime-data {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  margin-bottom: 16px;
}

.data-item {
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 8px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  text-align: center;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
}

.data-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(64, 158, 255, 0.3), transparent);
}

.data-item:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border-color: rgba(64, 158, 255, 0.2);
}

.data-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  font-weight: 500;
}

.data-value {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.data-value.primary {
  color: #409eff;
}

.data-value.success {
  color: #67c23a;
}

.data-value.warning {
  color: #e6a23c;
}

.data-value.info {
  color: #909399;
}

.data-value.danger {
  color: #f56c6c;
}

.data-unit {
  font-size: 10px;
  color: #999;
  font-weight: 500;
}

.no-data {
  padding: 20px;
  text-align: center;
}

.last-update {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

/* 响应式设计 */
@media (min-width: 1600px) {
  .realtime-data {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 10px;
  }
  
  .data-value {
    font-size: 20px;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .realtime-data {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
  }
  
  .data-value {
    font-size: 18px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .realtime-data {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 6px;
  }
  
  .data-value {
    font-size: 16px;
  }
}

@media (max-width: 767px) {
  .realtime-data {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 6px;
  }
  
  .data-value {
    font-size: 14px;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 768px) {
  .realtime-data {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .data-item {
    padding: 6px 10px;
  }
}

@media (max-width: 480px) {
  .data-item {
    padding: 6px 8px;
  }
}
</style>

