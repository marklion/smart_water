<template>
  <el-card class="realtime-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <el-tabs v-model="activeTab" class="header-tabs">
          <el-tab-pane label="实时数据" name="realtime"></el-tab-pane>
          <el-tab-pane label="数据面板" name="dashboard"></el-tab-pane>
        </el-tabs>
        <div class="header-actions">
          <UnifiedButton variant="refresh" size="small" :icon="Refresh" @click="refreshData" :loading="loading">
            刷新
          </UnifiedButton>
        </div>
      </div>
    </template>

    <!-- 实时数据 Tab -->
    <div v-if="activeTab === 'realtime'" class="tab-content">
      <div class="realtime-data" v-if="deviceDataItems.length > 0">
        <div class="data-item" v-for="item in deviceDataItems" :key="item.key">
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
      <div class="last-update" v-if="deviceLastUpdateTime">
        <el-icon>
          <Clock />
        </el-icon>
        <span>最后更新：{{ deviceLastUpdateTime }}</span>
      </div>
    </div>

    <!-- 数据面板 Tab -->
    <div v-if="activeTab === 'dashboard'" class="tab-content">
      <div class="realtime-data" v-if="dataItems.length > 0">
        <div class="data-item" v-for="item in dataItems" :key="item.key">
          <div class="data-label">{{ item.label }}</div>
          <div class="data-value-wrapper">
            <div class="data-value" :class="item.valueClass">
              {{ item.value }}
            </div>
            <UnifiedButton variant="primary" :icon="View" circle size="small" class="history-btn-center"
              @click.stop="openHistoryDialog(item)" title="查看历史数据" />
            <div class="data-unit">{{ item.unit }}</div>
          </div>
        </div>
      </div>

      <!-- 无数据时的提示 -->
      <div v-else class="no-data">
        <el-empty description="暂无数据" :image-size="80" />
      </div>

      <!-- 最后更新时间 -->
      <div class="last-update" v-if="lastUpdateTime">
        <el-icon>
          <Clock />
        </el-icon>
        <span>最后更新：{{ lastUpdateTime }}</span>
      </div>
    </div>
  </el-card>

  <!-- 历史数据对话框 - 独立弹窗 -->
  <el-dialog v-model="historyDialogVisible" :title="`${currentHistoryItem?.label || ''} - 历史数据`" width="800px"
    :close-on-click-modal="false" class="history-dialog" :append-to-body="true" destroy-on-close>
    <div class="history-filter">
      <div class="filter-header">
        <div class="filter-title">
          <el-icon class="filter-icon">
            <Calendar />
          </el-icon>
          <span>日期范围筛选</span>
        </div>
      </div>
      <div class="date-range-picker">
        <el-date-picker v-model="dateRange" type="datetimerange" range-separator="至" start-placeholder="开始日期"
          end-placeholder="结束日期" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" size="default"
          class="date-picker-input" />
        <div class="filter-actions">
          <UnifiedButton variant="query" :icon="Search" @click="applyDateFilter" :loading="historyLoading">
            查询
          </UnifiedButton>
          <UnifiedButton variant="reset" :icon="RefreshLeft" @click="resetDateFilter">
            重置
          </UnifiedButton>
        </div>
      </div>
    </div>
    <div v-loading="historyLoading" class="history-content">
      <div class="table-header" v-if="filteredHistoryData.length > 0">
        <div class="data-count">
          <el-icon>
            <Clock />
          </el-icon>
          <span>共 {{ filteredHistoryData.length }} 条记录</span>
        </div>
        <UnifiedButton variant="export" :icon="Download" @click="exportToExcel" :loading="exporting" size="small">
          导出Excel
        </UnifiedButton>
      </div>
      <el-table :data="filteredHistoryData" stripe max-height="400" class="history-table"
        :row-class-name="tableRowClassName">
        <el-table-column prop="timestamp" label="时间" width="200">
          <template #default="{ row }">
            <div class="timestamp-cell">
              <el-icon class="time-icon">
                <Clock />
              </el-icon>
              <span>{{ row.timestamp }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="value" label="数值" width="150">
          <template #default="{ row }">
            <div class="value-cell">
              <span class="value-number">{{ parseFloat(row.value).toFixed(2) }}</span>
              <span class="value-unit">{{ currentHistoryItem?.unit || '' }}</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="!historyLoading && filteredHistoryData.length === 0" class="no-history-data">
        <el-empty description="暂无历史数据" :image-size="80" />
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <UnifiedButton variant="default" @click="historyDialogVisible = false" size="default">关闭</UnifiedButton>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Clock, View, Calendar, Search, RefreshLeft, Download } from '@element-plus/icons-vue'
import call_remote from '../../public/lib/call_remote.js'
import UnifiedButton from '../../public/gui/src/components/UnifiedButton.vue'

// 定义props
const props = defineProps({
  farmName: {
    type: String,
    required: false
  }
})

// 响应式数据
const activeTab = ref('realtime')
const loading = ref(false)
const lastUpdateTime = ref('')
const deviceLastUpdateTime = ref('')
const refreshInterval = ref(null)

// 历史数据相关
const historyDialogVisible = ref(false)
const historyLoading = ref(false)
const historyData = ref([]) // 所有历史数据
const filteredHistoryData = ref([]) // 筛选后的历史数据
const currentHistoryItem = ref(null)
const dateRange = ref(null) // 日期范围
const exporting = ref(false) // 导出状态

// 实时数据 - 动态存储用户配置的统计项
const realtimeData = reactive({})

// 设备实时数据
const deviceRealtimeData = reactive({})

// 实时数据配置缓存
const realtimeConfigs = ref([])
// 标记是否已经加载过配置（用于避免重复请求）
const configsLoaded = ref(false)
// 设备信息缓存（避免重复调用 list_device）
const deviceInfoCache = reactive({})

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

// 设备实时数据项配置 - 按配置顺序显示
const deviceDataItems = computed(() => {
  return Object.entries(deviceRealtimeData).map(([key, data], index) => {
    // 根据索引分配样式类
    const valueClasses = ['primary', 'success', 'warning', 'info', 'danger']
    const valueClass = valueClasses[index % valueClasses.length]

    return {
      key: key,
      label: data.label || key,
      value: data.value !== null && data.value !== undefined ? parseFloat(data.value).toFixed(2) : '0.00',
      unit: data.unit || '',
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

// 判断设备是否应该显示在实时数据中 - 根据driver_name和设备名称判断
const shouldDisplayDevice = (deviceName, driverName) => {
  const name = deviceName || ''
  const driver = driverName || ''

  // WaterFlowMeter + 主管道 -> 主管道的流速
  if (driver === 'WaterFlowMeter' && name.includes('主管道')) {
    return { display: true, label: '主管道的流速' }
  }

  // PressureMeter + 主管道 -> 主管道的压力（实时数据）
  if (driver === 'PressureMeter' && name.includes('主管道')) {
    return { display: true, label: '主管道的压力' }
  }

  // FertFlowMeter（非主管道）-> 管道流速（实时）
  if (driver === 'FertFlowMeter' && !name.includes('主管道')) {
    return { display: true, label: '肥管道流速' }
  }

  // WaterFlowMeter（非主管道）-> 管道流速（实时）
  if (driver === 'WaterFlowMeter' && !name.includes('主管道')) {
    return { display: true, label: '主管道流速' }
  }

  // virtualDevice + 液位计 -> 液位计的度数（实时）
  if (driver === 'virtualDevice' && (name.includes('液位计') || name.includes('液位'))) {
    return { display: true, label: '液位计的度数' }
  }

  return { display: false, label: '' }
}

// 加载实时数据配置（只在初始化或配置可能变化时调用）
const loadRealtimeConfigs = async (force = false) => {
  // 如果已经加载过且不是强制刷新，直接返回
  if (configsLoaded.value && !force) {
    return
  }

  try {
    const configResponse = await call_remote('/resource/list_realtime', {
      farm_name: props.farmName || undefined
    })

    if (configResponse && configResponse.configs) {
      realtimeConfigs.value = configResponse.configs
    } else {
      realtimeConfigs.value = []
    }
    configsLoaded.value = true // 标记已加载
  } catch (error) {
    console.error('加载实时数据配置失败:', error)
    realtimeConfigs.value = []
    configsLoaded.value = true // 即使失败也标记为已加载，避免重复请求
  }
}

// 加载设备实时数据 - 从配置中读取
const loadDeviceRealtimeData = async () => {
  try {
    loading.value = true

    // 如果还没有加载过配置，先加载配置（只加载一次）
    if (!configsLoaded.value) {
      await loadRealtimeConfigs(false) // 不强制刷新
      // 如果加载后配置仍为空，标记为已加载，避免重复请求
      if (realtimeConfigs.value.length === 0) {
        configsLoaded.value = true
      }
    }

    // 如果还是没有配置，清空数据并返回
    if (realtimeConfigs.value.length === 0) {
      Object.keys(deviceRealtimeData).forEach(key => {
        delete deviceRealtimeData[key]
      })
      loading.value = false
      return
    }

    // 获取每个配置项的设备数据
    const deviceDataResult = {}
    for (const config of realtimeConfigs.value) {
      const key = `${config.farm_name}_${config.label}` // 使用农场名和标签作为唯一key

      try {
        let value = 0
        let unit = ''

        // 根据data_type调用不同的接口
        if (config.data_type === 'readout') {
          const readoutResponse = await call_remote('/device_management/readout_device', {
            device_name: config.device_name
          })

          if (readoutResponse && readoutResponse.readout !== null && readoutResponse.readout !== undefined) {
            value = parseFloat(readoutResponse.readout) || 0
          }

          // 从缓存获取设备信息，如果没有则调用接口
          if (!deviceInfoCache[config.device_name]) {
            try {
              const deviceResponse = await call_remote('/device_management/list_device', {
                pageNo: 0,
                device_name: config.device_name
              })

              if (deviceResponse && deviceResponse.devices && deviceResponse.devices.length > 0) {
                deviceInfoCache[config.device_name] = deviceResponse.devices[0]
              }
            } catch (error) {
              console.warn(`获取设备 ${config.device_name} 信息失败:`, error)
            }
          }

          if (deviceInfoCache[config.device_name]) {
            const device = deviceInfoCache[config.device_name]
            unit = getDeviceUnit(device.device_name, device.driver_name)
          }
        } else if (config.data_type === 'total_readout') {
          const readoutResponse = await call_remote('/device_management/readout_device', {
            device_name: config.device_name
          })

          if (readoutResponse && readoutResponse.total_readout !== null && readoutResponse.total_readout !== undefined) {
            value = parseFloat(readoutResponse.total_readout) || 0
          }

          // 从缓存获取设备信息，如果没有则调用接口
          if (!deviceInfoCache[config.device_name]) {
            try {
              const deviceResponse = await call_remote('/device_management/list_device', {
                pageNo: 0,
                device_name: config.device_name
              })

              if (deviceResponse && deviceResponse.devices && deviceResponse.devices.length > 0) {
                deviceInfoCache[config.device_name] = deviceResponse.devices[0]
              }
            } catch (error) {
              console.warn(`获取设备 ${config.device_name} 信息失败:`, error)
            }
          }

          if (deviceInfoCache[config.device_name]) {
            const device = deviceInfoCache[config.device_name]
            unit = getDeviceUnit(device.device_name, device.driver_name)
          }
        }

        deviceDataResult[key] = {
          label: config.label,
          value: value,
          unit: unit,
          timestamp: new Date().toISOString(),
          deviceName: config.device_name,
          dataType: config.data_type
        }
      } catch (error) {
        console.warn(`获取设备 ${config.device_name} (${config.data_type}) 数据失败:`, error)
        // 仍然添加配置项，但值为0
        deviceDataResult[key] = {
          label: config.label,
          value: 0,
          unit: '',
          timestamp: null,
          deviceName: config.device_name,
          dataType: config.data_type
        }
      }
    }

    // 3. 更新数据
    Object.keys(deviceRealtimeData).forEach(key => {
      delete deviceRealtimeData[key]
    })

    Object.assign(deviceRealtimeData, deviceDataResult)

    // 更新最后更新时间
    deviceLastUpdateTime.value = new Date().toLocaleTimeString()

  } catch (error) {
    console.error('加载设备实时数据失败:', error)
    ElMessage.error('获取设备实时数据失败')

    // 清空数据
    Object.keys(deviceRealtimeData).forEach(key => {
      delete deviceRealtimeData[key]
    })
  } finally {
    loading.value = false
  }
}

// 根据设备类型获取单位
const getDeviceUnit = (deviceName, driverName) => {
  const name = (deviceName || driverName || '').toLowerCase()
  if (name.includes('flow') || name.includes('流量') || name.includes('流速')) {
    return 'm³/h'
  } else if (name.includes('pressure') || name.includes('压力')) {
    return 'MPa'
  } else if (name.includes('temperature') || name.includes('温度')) {
    return '°C'
  } else if (name.includes('液位') || name.includes('level')) {
    return 'm'
  } else if (name.includes('valve') || name.includes('阀门')) {
    return ''
  } else if (name.includes('pump') || name.includes('泵')) {
    return ''
  } else {
    return ''
  }
}

// 刷新数据
const refreshData = async () => {
  if (activeTab.value === 'dashboard') {
    await loadRealtimeData()
  } else if (activeTab.value === 'realtime') {
    await loadDeviceRealtimeData()
  }
  ElMessage.success('数据已刷新')
}

// 开始自动刷新
const startAutoRefresh = () => {
  stopAutoRefresh() // 先清除现有的定时器
  refreshInterval.value = setInterval(() => {
    if (activeTab.value === 'dashboard') {
      loadRealtimeData()
    } else if (activeTab.value === 'realtime') {
      loadDeviceRealtimeData()
    }
  }, 3000) // 每3秒刷新一次
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

// 监听tab切换
watch(activeTab, (newTab) => {
  if (newTab === 'dashboard') {
    loadRealtimeData()
  } else if (newTab === 'realtime') {
    // 切换tab时，如果还没加载过配置才加载
    if (!configsLoaded.value) {
      loadRealtimeConfigs(false).then(() => {
        loadDeviceRealtimeData()
      })
    } else {
      // 已经加载过配置，直接加载数据
      loadDeviceRealtimeData()
    }
  }
})

// 监听farmName变化，重新加载配置
watch(() => props.farmName, (newFarmName, oldFarmName) => {
  // 只有在农场真正变化时才重新加载
  if (newFarmName !== oldFarmName && activeTab.value === 'realtime') {
    configsLoaded.value = false // 重置加载标志
    realtimeConfigs.value = [] // 清空旧配置
    loadRealtimeConfigs(false).then(() => {
      loadDeviceRealtimeData()
    })
  }
})

// 组件挂载时直接加载数据并开始自动刷新
onMounted(() => {
  // 默认加载实时数据配置和数据
  configsLoaded.value = false // 确保初始化时加载
  loadRealtimeConfigs(true).then(() => {
    loadDeviceRealtimeData()
  })
  // 开始自动刷新
  startAutoRefresh()
})

// 组件卸载时清理定时器
onUnmounted(() => {
  stopAutoRefresh()
})

// 打开历史数据对话框
const openHistoryDialog = async (item) => {
  currentHistoryItem.value = item
  historyDialogVisible.value = true
  historyData.value = []
  filteredHistoryData.value = []
  dateRange.value = null
  await loadHistoryData(item.key)
}

// 应用日期范围筛选 - 重新从后端加载数据
const applyDateFilter = async () => {
  if (!currentHistoryItem.value) {
    return
  }

  if (!dateRange.value || dateRange.value.length !== 2) {
    // 如果没有选择日期范围，重新加载所有数据
    await loadHistoryData(currentHistoryItem.value.key)
    return
  }

  const [startDate, endDate] = dateRange.value
  await loadHistoryDataWithDateRange(currentHistoryItem.value.key, startDate, endDate)
}

// 根据日期范围加载历史数据
const loadHistoryDataWithDateRange = async (itemName, startDate, endDate) => {
  try {
    historyLoading.value = true
    const allRecords = []
    let pageNo = 0
    let hasMore = true

    while (hasMore && pageNo < 10) { // 最多获取10页，避免数据过多
      const response = await call_remote('/statistic/list_item_history', {
        item_name: itemName,
        pageNo: pageNo,
        start_date: startDate,
        end_date: endDate
      })

      if (response && response.records && response.records.length > 0) {
        allRecords.push(...response.records)
        // 如果返回的记录数少于预期，说明没有更多数据了
        if (response.records.length < 20) {
          hasMore = false
        } else {
          pageNo++
        }
      } else {
        hasMore = false
      }
    }

    // 按时间正序排列
    filteredHistoryData.value = allRecords.sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp)
    })

    if (filteredHistoryData.value.length === 0) {
      ElMessage.info('所选日期范围内暂无数据')
    }
  } catch (error) {
    console.error('加载历史数据失败:', error)
    ElMessage.error('获取历史数据失败')
    filteredHistoryData.value = []
  } finally {
    historyLoading.value = false
  }
}

// 重置日期筛选
const resetDateFilter = () => {
  dateRange.value = null
  filteredHistoryData.value = [...historyData.value]
}

// 加载历史数据
const loadHistoryData = async (itemName) => {
  try {
    historyLoading.value = true
    // 获取历史数据，可以获取多页数据
    const allRecords = []
    let pageNo = 0
    let hasMore = true

    while (hasMore && pageNo < 10) { // 最多获取10页，避免数据过多
      const response = await call_remote('/statistic/list_item_history', {
        item_name: itemName,
        pageNo: pageNo
      })

      if (response && response.records && response.records.length > 0) {
        allRecords.push(...response.records)
        // 如果返回的记录数少于预期，说明没有更多数据了
        if (response.records.length < 100) {
          hasMore = false
        } else {
          pageNo++
        }
      } else {
        hasMore = false
      }
    }

    // 按时间正序排列
    historyData.value = allRecords.sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp)
    })

    // 初始化筛选后的数据为所有数据
    filteredHistoryData.value = [...historyData.value]

    if (historyData.value.length === 0) {
      ElMessage.info('暂无历史数据')
    }
  } catch (error) {
    console.error('加载历史数据失败:', error)
    ElMessage.error('获取历史数据失败')
    historyData.value = []
  } finally {
    historyLoading.value = false
  }
}


// 表格行类名
const tableRowClassName = ({ rowIndex }) => {
  if (rowIndex % 2 === 0) {
    return 'even-row'
  }
  return 'odd-row'
}

// 导出Excel
const exportToExcel = async () => {
  if (!currentHistoryItem.value || filteredHistoryData.value.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }

  try {
    exporting.value = true

    const token = localStorage.getItem('auth_token')
    if (!token) {
      ElMessage.error('请先登录')
      return
    }

    // 准备请求参数
    const params = {
      item_name: currentHistoryItem.value.key,
      item_label: currentHistoryItem.value.label || currentHistoryItem.value.key,
      unit: currentHistoryItem.value.unit || ''
    }

    // 如果有日期范围，添加到参数中
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }

    // 调用后端接口下载文件
    const response = await fetch('/api/v1/statistic/export_item_history_excel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': token
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ err_msg: '导出失败' }))
      throw new Error(errorData.err_msg || '导出失败')
    }

    // 获取文件名（从响应头中获取）
    const contentDisposition = response.headers.get('Content-Disposition')
    let fileName = `${currentHistoryItem.value.label || '历史数据'}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = decodeURIComponent(fileNameMatch[1].replace(/['"]/g, ''))
      }
    }

    // 获取文件blob
    const blob = await response.blob()

    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success(`已成功导出 ${filteredHistoryData.value.length} 条记录`)
  } catch (error) {
    console.error('导出Excel失败:', error)
    ElMessage.error(error.message || '导出失败，请稍后重试')
  } finally {
    exporting.value = false
  }
}

// 暴露方法给父组件
defineExpose({
  refreshData,
  loadRealtimeData,
  loadDeviceRealtimeData
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

.header-tabs {
  flex: 1;
}

.header-tabs :deep(.el-tabs__header) {
  margin: 0;
  border: none;
}

.header-tabs :deep(.el-tabs__nav-wrap) {
  &::after {
    display: none;
  }
}

.header-tabs :deep(.el-tabs__item) {
  padding: 0 16px;
  height: 32px;
  line-height: 32px;
  font-size: 16px;
  font-weight: 500;
  color: #606266;
}

.header-tabs :deep(.el-tabs__item.is-active) {
  color: #409eff;
  font-weight: 600;
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
  margin-left: 16px;
}

.tab-content {
  min-height: 200px;
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
  font-size: 14px;
  color: #666;
  margin-bottom: 6px;
  font-weight: 600;
  line-height: 1.4;
}

.data-value-wrapper {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  margin-bottom: 4px;
  position: relative;
  flex-wrap: wrap;
}

.data-value {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.2;
}

.history-btn-center {
  width: 28px;
  height: 28px;
  padding: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow:
    0 2px 8px rgba(102, 126, 234, 0.4),
    0 0 0 2px rgba(255, 255, 255, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: pulse 2s ease-in-out infinite;
  flex-shrink: 0;
}

.history-btn-center:hover {
  transform: scale(1.15) rotate(5deg);
  box-shadow:
    0 4px 16px rgba(102, 126, 234, 0.6),
    0 0 0 4px rgba(255, 255, 255, 0.9);
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

.history-btn-center :deep(.el-icon) {
  font-size: 14px;
  color: #ffffff;
}

@keyframes pulse {

  0%,
  100% {
    box-shadow:
      0 2px 8px rgba(102, 126, 234, 0.4),
      0 0 0 2px rgba(255, 255, 255, 0.8);
  }

  50% {
    box-shadow:
      0 2px 12px rgba(102, 126, 234, 0.6),
      0 0 0 3px rgba(255, 255, 255, 0.9);
  }
}

.history-content {
  min-height: 200px;
}

.no-history-data {
  padding: 40px 0;
  text-align: center;
}

.history-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

.history-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 24px;
  margin: 0;
  border-bottom: none;
}

.history-dialog :deep(.el-dialog__title) {
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.history-dialog :deep(.el-dialog__headerbtn) {
  top: 20px;
  right: 24px;
}

.history-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: #ffffff;
  font-size: 20px;
}

.history-dialog :deep(.el-dialog__headerbtn:hover .el-dialog__close) {
  color: #f0f0f0;
}

.history-dialog :deep(.el-dialog__body) {
  padding: 24px;
  background: linear-gradient(145deg, #f8f9fa 0%, #ffffff 100%);
}

.history-filter {
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 12px;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.05),
    0 2px 4px rgba(0, 0, 0, 0.02);
  border: 1px solid #e4e7ed;
}

.filter-header {
  margin-bottom: 16px;
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.filter-icon {
  color: #409eff;
  font-size: 18px;
}

.date-range-picker {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.date-picker-input {
  flex: 1;
  min-width: 400px;
}

.date-picker-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.date-picker-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  border-color: #409eff;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.history-content {
  min-height: 200px;
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.table-header {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f2f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.data-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}


.data-count .el-icon {
  color: #409eff;
}

.history-table {
  border-radius: 8px;
  overflow: hidden;
}

.history-table :deep(.el-table__header) {
  background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
}

.history-table :deep(.el-table__header th) {
  background: transparent;
  color: #303133;
  font-weight: 600;
  border-bottom: 2px solid #e4e7ed;
  padding: 12px 0;
}

.history-table :deep(.el-table__body tr:hover) {
  background-color: #f0f7ff;
}

.history-table :deep(.el-table__row) {
  transition: all 0.2s ease;
}

.history-table :deep(.el-table__row:hover) {
  transform: scale(1.01);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.timestamp-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.time-icon {
  color: #909399;
  font-size: 14px;
}

.value-cell {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.value-number {
  font-size: 16px;
  font-weight: 700;
  color: #409eff;
}

.value-unit {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0 0 0;
  border-top: 1px solid #e4e7ed;
}

.dialog-footer .el-button {
  border-radius: 8px;
  padding: 10px 24px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.dialog-footer .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.history-table :deep(.even-row) {
  background-color: #ffffff;
}

.history-table :deep(.odd-row) {
  background-color: #fafbfc;
}

.history-table :deep(.even-row:hover),
.history-table :deep(.odd-row:hover) {
  background-color: #f0f7ff !important;
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
  line-height: 1.2;
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
