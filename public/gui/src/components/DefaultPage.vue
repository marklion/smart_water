<template>
  <div class="default-page">
    <!-- 监控中心特殊布局 -->
    <div v-if="route.name === '监控中心'" class="monitoring-center">

      <!-- 内容包装器 -->
      <div class="content-wrapper">
        <!-- 主要内容区域 -->
        <div class="main-content">
          <!-- 左侧信息面板 -->
          <div class="left-panel">
            <!-- 基本信息卡片 -->
            <BasicInfoCard :data="basicInfo" :items="basicInfoItems" title="基本信息" />

            <!-- 气象信息卡片 -->
            <el-card class="weather-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span class="card-title">气象信息</span>
                </div>
              </template>
              <div class="weather-content">
                <WeatherWeekly ref="weatherRef" />
              </div>
            </el-card>
          </div>

          <!-- 中央地图区域 -->
          <div class="center-panel">
            <!-- 农场地图卡片 -->
            <el-card class="map-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span class="card-title">农场地图</span>
                </div>
              </template>

              <div class="map-container">
                <InteractiveMapComponent :devices="mapMarkers" :center="mapCenter" :zoom="mapZoom"
                  @device-click="onDeviceClick" @device-toggle="onDeviceToggle" />
              </div>
            </el-card>

            <!-- 轮灌组详情和策略运行时状态卡片 -->
            <el-card class="irrigation-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span class="card-title">策略详情</span>
                  <el-button type="primary" size="small" @click="refreshIrrigationData" :icon="Refresh">
                    刷新
                  </el-button>
                </div>
              </template>

              <el-tabs v-model="activeIrrigationTab" class="irrigation-tabs" @tab-change="handleIrrigationTabChange">
                <!-- 轮灌组状态 Tab -->
                <el-tab-pane label="轮灌组状态" name="watering">
                  <div class="tab-content">
                    <WateringGroupStatus ref="wateringGroupRef" :farm-name="selectedFarm" />
                  </div>
                </el-tab-pane>

                <!-- 策略运行时状态 Tab -->
                <el-tab-pane label="策略运行时状态" name="runtime">
                  <div class="tab-content">
                    <PolicyRuntimeStatus ref="policyRuntimeRef" :farm-name="selectedFarm" />
                  </div>
                </el-tab-pane>
              </el-tabs>
            </el-card>
          </div>

          <!-- 右侧信息面板 -->
          <div class="right-panel">
            <!-- 实时数据卡片 -->
            <el-card class="realtime-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span class="card-title">实时数据</span>
                </div>
              </template>

              <div class="realtime-data">
                <div class="data-item">
                  <div class="data-label">总计流量</div>
                  <div class="data-value">{{ realtimeData.totalFlow }}</div>
                </div>
                <div class="data-item">
                  <div class="data-label">主管流量</div>
                  <div class="data-value">{{ realtimeData.mainPipeFlow }}</div>
                </div>
                <div class="data-item">
                  <div class="data-label">主管管压力</div>
                  <div class="data-value">{{ realtimeData.mainPipePressure }}</div>
                </div>
                <div class="data-item">
                  <div class="data-label">肥料流量</div>
                  <div class="data-value">{{ realtimeData.fertilizerFlow }}</div>
                </div>
                <div class="data-item">
                  <div class="data-label">总施肥量</div>
                  <div class="data-value">{{ realtimeData.totalFertilizer }}</div>
                </div>
              </div>
            </el-card>

            <!-- 告警信息卡片 -->
            <el-card class="warning-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span class="card-title">系统告警</span>
                  <el-badge :value="warningData.total" :max="99" class="warning-badge" />
                </div>
              </template>

              <div class="warning-list">
                <el-scrollbar height="300px" v-if="warningData.warnings.length > 0">
                  <div class="warning-item" v-for="(warning, index) in warningData.warnings" :key="index">
                    <div class="warning-icon">
                      <el-icon :size="16" color="#f56c6c">
                        <Warning />
                      </el-icon>
                    </div>
                    <div class="warning-content">
                      <div class="warning-text">{{ warning.content }}</div>
                    </div>
                  </div>
                </el-scrollbar>
                <el-empty v-else description="暂无告警信息" :image-size="80" />
              </div>
            </el-card>
          </div>
        </div>

      </div>

    </div>

    <!-- 其他页面的默认布局 -->
    <div v-else>
      <el-card>
        <template #header>
          <div class="card-header">
            <span>{{ pageTitle }}</span>
          </div>
        </template>

        <div class="page-content">
          <el-empty :description="pageDescription" :image-size="200">
            <el-button type="primary">开始使用</el-button>
          </el-empty>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted, shallowRef, watch, inject } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Warning, Refresh, Monitor } from '@element-plus/icons-vue'
import WeatherWeekly from '../../../../weather/gui/WeatherWeekly.vue'
import InteractiveMapComponent from './InteractiveMapComponent.vue'
import WateringGroupStatus from '../../../../policy/gui/WateringGroupStatus.vue'
import PolicyRuntimeStatus from '../../../../policy/gui/PolicyRuntimeStatus.vue'
import BasicInfoCard from '../../../../monitoring/gui/BasicInfoCard.vue'
import call_remote from '../../../lib/call_remote.js'
import { fetchMapConfig, getCityLocation, saveMapCenterToStorage } from '../config/mapConfig.js'

const route = useRoute()
const systemName = ref('智能灌溉管理系统')

// 注入城市变化数据
const cityChangeData = inject('cityChangeData', ref({ city: '', location: null, timestamp: null }))

// 获取系统名称
const getSystemName = async () => {
  try {
    const response = await fetch('/api/v1/get_sys_name', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const data = await response.json()
    if (data.err_msg === '' && data.result.sys_name && data.result.sys_name !== 'no name') {
      systemName.value = data.result.sys_name
    }
  } catch (error) {
    console.error('获取系统名称失败:', error)
  }
}

const pageTitle = computed(() => {
  return route.name || '页面'
})

const pageDescription = computed(() => {
  const descriptions = {
    '首页': '欢迎使用智能灌溉管理系统',
    '设备配置': '在这里可以配置和管理各种设备',
    '策略配置': '在这里可以配置各种策略规则',
    '用户管理': '在这里可以管理系统用户',
    '权限管理': '在这里可以配置用户权限',
    '数据监控': '在这里可以监控系统数据',
    '告警管理': '在这里可以管理系统告警'
  }
  return descriptions[route.name] || `${route.name}功能正在开发中...`
})

// 监控中心数据
const selectedFarm = ref('')
const weatherRef = ref(null) // 天气组件引用

// 基本信息数据
const basicInfo = reactive({
  irrigationGroups: 0,
  farmArea: '0亩',
  cropName: '',
  totalDevices: 0,
  onlineDevices: 0,
  offlineDevices: 0
})

// 基本信息卡片配置
const basicInfoItems = [
  { key: 'irrigationGroups', label: '轮灌组数量', valueClass: '' },
  { key: 'farmArea', label: '农场面积', valueClass: '' },
  { key: 'cropName', label: '作物名称', valueClass: '' },
  { key: 'totalDevices', label: '设备总数量', valueClass: '' },
  { key: 'onlineDevices', label: '在线设备', valueClass: 'online' },
  { key: 'offlineDevices', label: '离线设备', valueClass: 'offline' }
]

// 实时数据
const realtimeData = reactive({
  totalFlow: '0 m³',
  mainPipeFlow: '0 m³/h',
  mainPipePressure: '0 mpa',
  fertilizerFlow: '0 L/h',
  totalFertilizer: '0 m³'
})

// 告警数据
const warningData = reactive({
  warnings: [],
  total: 0
})

// 地图配置
const mapCenter = ref({ lng: 111.670801, lat: 40.818311 }) // 默认呼和浩特市坐标
const mapZoom = ref(15)

// 地图标记点 - 使用shallowRef优化性能，从真实设备数据获取
const mapMarkers = shallowRef([])


// Tab切换相关
const activeIrrigationTab = ref('watering')

// 组件引用
const wateringGroupRef = ref(null)
const policyRuntimeRef = ref(null)


// API接口方法


const loadFarmData = async (farmId) => {
  try {
    console.log('正在加载农场数据:', farmId)

    // 加载基本信息 - 使用监控中心模块
    const basicResponse = await call_remote('/monitoring/getBasicInfo', { farmName: farmId })
    console.log('基本信息响应:', basicResponse)

    if (basicResponse) {
      // 轮灌组数量从 WateringGroupStatus 组件获取，不在这里设置
      basicInfo.farmArea = `${basicResponse.totalArea || 0}亩`
      basicInfo.cropName = basicResponse.cropName || '未知'
      basicInfo.totalDevices = basicResponse.totalDevices || 0
      basicInfo.onlineDevices = basicResponse.onlineDevices || 0
      basicInfo.offlineDevices = basicResponse.offlineDevices || 0
    } else {
      // 如果 API 没有返回数据，使用默认值
      basicInfo.farmArea = '0亩'
      basicInfo.cropName = '未知'
      basicInfo.totalDevices = 0
      basicInfo.onlineDevices = 0
      basicInfo.offlineDevices = 0
    }

    // 加载真实设备数据
    await loadRealDeviceData(farmId)

    // 加载实时数据
    await loadRealtimeData(farmId)

    // 延迟更新轮灌组数量，等待 WateringGroupStatus 组件加载完成
    setTimeout(() => {
      updateIrrigationGroupsCount()
    }, 500)

  } catch (error) {
    console.error('加载农场数据失败:', error)
    // 使用默认值而不是硬编码的模拟数据
    basicInfo.irrigationGroups = 0
    basicInfo.farmArea = '0亩'
    basicInfo.cropName = '未知'
    basicInfo.totalDevices = 0
    basicInfo.onlineDevices = 0
    basicInfo.offlineDevices = 0

    realtimeData.totalFlow = '0 m³'
    realtimeData.mainPipeFlow = '0 m³/h'
    realtimeData.mainPipePressure = '0 mpa'
    realtimeData.fertilizerFlow = '0 L/h'
    realtimeData.totalFertilizer = '0 m³'
  }
}

// 加载实时数据
const loadRealtimeData = async (farmId) => {
  try {
    console.log('正在加载实时数据:', farmId)
    const realtimeResponse = await call_remote('/monitoring/getRealtimeData', { farmName: farmId })
    console.log('实时数据响应:', realtimeResponse)

    if (realtimeResponse) {
      realtimeData.totalFlow = `${realtimeResponse.totalFlow || 0} m³`
      realtimeData.mainPipeFlow = `${realtimeResponse.mainPipeFlow || 0} m³/h`
      realtimeData.mainPipePressure = `${realtimeResponse.mainPipePressure || 0} mpa`
      realtimeData.fertilizerFlow = `${realtimeResponse.fertilizerFlow || 0} L/h`
      realtimeData.totalFertilizer = `${realtimeResponse.totalFertilizer || 0} m³`
    } else {
      realtimeData.totalFlow = '0 m³'
      realtimeData.mainPipeFlow = '0 m³/h'
      realtimeData.mainPipePressure = '0 mpa'
      realtimeData.fertilizerFlow = '0 L/h'
      realtimeData.totalFertilizer = '0 m³'
    }
  } catch (error) {
    console.error('加载实时数据失败:', error)
    realtimeData.totalFlow = '0 m³'
    realtimeData.mainPipeFlow = '0 m³/h'
    realtimeData.mainPipePressure = '0 mpa'
    realtimeData.fertilizerFlow = '0 L/h'
    realtimeData.totalFertilizer = '0 m³'
  }
}

// 处理农场切换事件
const handleFarmChange = async (farmId) => {
  selectedFarm.value = farmId
  await loadFarmData(farmId)

  // 更新轮灌组数量 - 从 WateringGroupStatus 组件获取
  updateIrrigationGroupsCount()
}

// 更新轮灌组数量
const updateIrrigationGroupsCount = () => {
  if (wateringGroupRef.value && wateringGroupRef.value.irrigationGroups) {
    basicInfo.irrigationGroups = wateringGroupRef.value.irrigationGroups.length
  }
}

// 处理城市切换事件
const handleCityChangeEvent = async (cityData) => {
  const { city, location } = cityData

  // 更新地图中心点
  mapCenter.value = location
  mapZoom.value = 13

  // 直接调用天气组件的方法更新天气
  if (weatherRef.value && weatherRef.value.updateCity) {
    weatherRef.value.updateCity(city)
  }
}

// 更新设备实际状态
const updateDeviceStatuses = async (devices) => {
  try {
    // 从设备管理API获取最新的设备信息（包含运行时信息）
    const deviceResponse = await call_remote('/device_management/list_device', {
      pageNo: 0
    })
    
    if (deviceResponse && deviceResponse.devices) {
      // 更新设备状态和运行时信息
      for (const device of devices) {
        const latestDeviceInfo = deviceResponse.devices.find(d => d.device_name === device.deviceName)
        if (latestDeviceInfo) {
          // 更新运行时信息
          if (latestDeviceInfo.runtime_info) {
            device.runtime_info = latestDeviceInfo.runtime_info
          }
          
          // 根据运行时信息或设备读数更新状态
          try {
            const response = await call_remote('/device_management/readout_device', {
              device_name: device.deviceName
            })
            if (response && response.readout !== undefined) {
              if (response.readout > 0) {
                device.status = device.type === 'fertilizer' ? 'active' : 'open'
              } else {
                device.status = device.type === 'fertilizer' ? 'inactive' : 'closed'
              }
            }
          } catch (error) {
            // 保持默认状态
          }
        }
      }
    } else {
      // 如果没有获取到最新设备信息，使用原有方式
      for (const device of devices) {
        try {
          const response = await call_remote('/device_management/readout_device', {
            device_name: device.deviceName
          })
          if (response && response.readout !== undefined) {
            if (response.readout > 0) {
              device.status = device.type === 'fertilizer' ? 'active' : 'open'
            } else {
              device.status = device.type === 'fertilizer' ? 'inactive' : 'closed'
            }
          }
        } catch (error) {
          // 保持默认状态
        }
      }
    }
  } catch (error) {
    console.error('更新设备状态失败:', error)
  }
}

// 加载真实设备数据
const loadRealDeviceData = async (farmId) => {
  try {
    // 从设备管理API获取设备列表
    const deviceResponse = await call_remote('/device_management/list_device', {
      farm_name: farmId,
      pageNo: 0
    })

    if (deviceResponse && deviceResponse.devices) {

      // 转换设备数据为地图标记格式
      const devices = deviceResponse.devices.map((device, index) => {
        // 根据设备类型确定标记类型
        let deviceType = 'valve' // 默认类型
        if (device.driver_name && device.driver_name.includes('流量计')) {
          deviceType = 'flowmeter'
        } else if (device.driver_name && device.driver_name.includes('施肥机')) {
          deviceType = 'fertilizer'
        }
        // 电磁阀类型保持默认值 'valve'

        // 如果有经纬度坐标，不设置x,y（让地图组件直接使用经纬度）；否则使用默认坐标
        let x, y
        if (device.longitude && device.latitude) {
          // 有真实坐标时，不设置x,y，让地图组件直接使用经纬度
          x = null
          y = null
        } else {
          // 使用默认坐标（如果没有设置经纬度）
          x = 20 + (index % 5) * 20
          y = 30 + Math.floor(index / 5) * 20
        }

        return {
          id: device.id || index + 1,
          x: x,
          y: y,
          type: deviceType,
          label: device.device_name || `设备${index + 1}`,
          deviceName: device.device_name,
          deviceType: device.driver_name || '未知设备',
          status: 'closed', // 默认状态设为关闭，需要从实际设备状态获取
          capability: device.capability ? (typeof device.capability === 'string' ? JSON.parse(device.capability) : device.capability) : ['readout'],
          farmName: device.farm_name || farmId,
          blockName: device.block_name || '未知区块',
          showPopover: false,
          // 保存原始设备数据
          originalDevice: device,
          // 保存真实坐标
          longitude: device.longitude,
          latitude: device.latitude
        }
      })

      mapMarkers.value = devices

      // 获取设备实际状态并更新统计
      await updateDeviceStatuses(devices)

      // 更新基本信息中的设备数量
      basicInfo.totalDevices = devices.length
      basicInfo.onlineDevices = devices.filter(d => d.status === 'active' || d.status === 'open').length
      basicInfo.offlineDevices = devices.length - basicInfo.onlineDevices

    } else {
      // 如果没有获取到设备数据，使用默认的模拟数据
      mapMarkers.value = getDefaultDeviceData()
    }

  } catch (error) {
    console.error('加载真实设备数据失败:', error)
    // 出错时使用默认数据
    mapMarkers.value = getDefaultDeviceData()
  }
}

// 获取默认设备数据（作为备用）
const getDefaultDeviceData = () => {
  return [
    {
      id: 1,
      x: 20,
      y: 30,
      type: 'valve',
      label: '电磁阀1',
      deviceName: '温室1号主灌溉管道阀门1',
      deviceType: '电磁阀',
      status: 'closed',
      capability: ['open', 'close', 'readout'],
      farmName: '温室1号',
      blockName: '主灌溉管道',
      showPopover: false
    },
    {
      id: 2,
      x: 60,
      y: 45,
      type: 'valve',
      label: '电磁阀2',
      deviceName: '温室1号施肥管道阀门1',
      deviceType: '电磁阀',
      status: 'open',
      capability: ['open', 'close', 'readout'],
      farmName: '温室1号',
      blockName: '施肥管道',
      showPopover: false
    },
    {
      id: 3,
      x: 80,
      y: 25,
      type: 'flowmeter',
      label: '流量计1',
      deviceName: '温室1号主灌溉管道流量计1',
      deviceType: '流量计',
      status: 'active',
      capability: ['readout'],
      farmName: '温室1号',
      blockName: '主灌溉管道',
      showPopover: false
    }
  ]
}

// 设备控制方法
const openDevice = async (deviceName) => {
  try {
    const response = await call_remote('/device_management/open_device', { device_name: deviceName })
    if (response.result) {
      // 更新标记点状态
      const marker = mapMarkers.value.find(m => m.deviceName === deviceName)
      if (marker) {
        if (marker.type === 'fertilizer') {
          marker.status = 'active'
        } else {
          marker.status = 'open'
        }
      }
      ElMessage.success(`设备 ${deviceName} 打开成功`)
    }
  } catch (error) {
    console.error('打开设备失败:', error)
    ElMessage.error(`打开设备失败: ${error.message || error}`)
  }
}

const closeDevice = async (deviceName) => {
  try {
    const response = await call_remote('/device_management/close_device', { device_name: deviceName })
    if (response.result) {
      // 更新标记点状态
      const marker = mapMarkers.value.find(m => m.deviceName === deviceName)
      if (marker) {
        if (marker.type === 'fertilizer') {
          marker.status = 'inactive'
        } else {
          marker.status = 'closed'
        }
      }
      ElMessage.success(`设备 ${deviceName} 关闭成功`)
    }
  } catch (error) {
    console.error('关闭设备失败:', error)
    ElMessage.error(`关闭设备失败: ${error.message || error}`)
  }
}

const readDeviceStatus = async (deviceName) => {
  try {
    const response = await call_remote('/device_management/readout_device', { device_name: deviceName })
    return response.readout
  } catch (error) {
    console.error('读取设备状态失败:', error)
    return null
  }
}

// 获取设备状态信息
const getDeviceStatusInfo = (marker) => {
  const statusText = {
    'open': '开启',
    'closed': '关闭',
    'active': '运行中',
    'inactive': '停止'
  }

  return {
    deviceName: marker.deviceName,
    deviceType: marker.deviceType,
    status: statusText[marker.status] || marker.status,
    farmName: marker.farmName,
    blockName: marker.blockName,
    capability: marker.capability
  }
}

// 地图事件处理方法
const onDeviceClick = (device) => {
  // 可以在这里添加额外的设备点击处理逻辑
}

const onDeviceToggle = (device) => {
  // 更新本地设备状态
  const marker = mapMarkers.value.find(m => m.id === device.id)
  if (marker) {
    marker.status = device.status
  }

  // 更新基本信息统计
  updateBasicInfoStats()
}

// 更新基本信息统计
const updateBasicInfoStats = () => {
  if (mapMarkers.value && mapMarkers.value.length > 0) {
    basicInfo.totalDevices = mapMarkers.value.length
    basicInfo.onlineDevices = mapMarkers.value.filter(d => d.status === 'active' || d.status === 'open').length
    basicInfo.offlineDevices = mapMarkers.value.length - basicInfo.onlineDevices
  }
}

// 设备控制方法
const toggleDevice = async (marker) => {
  try {
    if (marker.status === 'open' || marker.status === 'active') {
      await closeDevice(marker.deviceName)
      marker.status = 'closed'
    } else {
      await openDevice(marker.deviceName)
      marker.status = 'open'
    }
    ElMessage.success('设备操作成功')
  } catch (error) {
    ElMessage.error('设备操作失败: ' + error.message)
  }
}


// 加载告警数据
const loadWarningData = async () => {
  try {
    const response = await call_remote('/warning/list_warnings', { pageNo: 0 })
    if (response) {
      warningData.warnings = response.warnings || []
      warningData.total = response.total || 0
    }
  } catch (error) {
    console.error('加载告警数据失败:', error)
    warningData.warnings = []
    warningData.total = 0
  }
}

// 初始化地图配置
const initMapConfig = async () => {
  try {
    const config = await fetchMapConfig()
    mapCenter.value = config.center
    mapZoom.value = config.zoom

    // 加载保存的城市
    const savedCity = localStorage.getItem('weather_selected_city')
    if (savedCity) {
      currentCity.value = savedCity
    }
  } catch (error) {
    console.error('加载地图配置失败，使用默认值:', error)
  }
}


// Tab切换处理
const handleIrrigationTabChange = (tabName) => {
  // Tab切换时刷新对应组件数据
  if (tabName === 'watering' && wateringGroupRef.value) {
    wateringGroupRef.value.refresh()
  } else if (tabName === 'runtime' && policyRuntimeRef.value) {
    policyRuntimeRef.value.refresh()
  }
}

// 刷新轮灌组数据
const refreshIrrigationData = async () => {
  if (wateringGroupRef.value) {
    wateringGroupRef.value.refresh()
  }
  if (policyRuntimeRef.value) {
    policyRuntimeRef.value.refresh()
  }
}

// 组件挂载时加载数据
onMounted(async () => {
  await initMapConfig()
  getSystemName()
  loadWarningData()

  // 添加全局事件监听器
  window.addEventListener('farmChanged', (event) => {
    handleFarmChange(event.detail.farmId)
  })


  // 如果是监控中心页面，立即尝试加载数据
  if (route.name === '监控中心') {
    // 先尝试从 localStorage 获取上次选中的农场
    const savedFarm = localStorage.getItem('selectedFarm')
    if (savedFarm) {
      console.log('从 localStorage 恢复农场:', savedFarm)
      selectedFarm.value = savedFarm
      await loadFarmData(savedFarm)
    } else {
      // 如果没有保存的农场，等待 MainLayout 触发事件
      console.log('等待 MainLayout 触发初始农场数据加载')
    }
  }
})

// 监听路由变化，当切换到监控中心时重新加载数据
watch(() => route.name, async (newRouteName, oldRouteName) => {
  if (newRouteName === '监控中心' && oldRouteName !== '监控中心') {
    console.log('切换到监控中心页面，重新加载数据')
    
    // 获取当前选中的农场
    const currentFarm = localStorage.getItem('selectedFarm')
    if (currentFarm) {
      selectedFarm.value = currentFarm
      await loadFarmData(currentFarm)
    } else {
      // 如果没有保存的农场，等待 MainLayout 触发事件
      console.log('等待 MainLayout 触发农场数据加载')
    }
  }
})

// 监听城市变化数据
watch(cityChangeData, (newCityData, oldCityData) => {
  if (newCityData && newCityData.city && newCityData.location && 
      (!oldCityData || newCityData.timestamp !== oldCityData.timestamp)) {
    console.log('检测到城市变化:', newCityData)
    handleCityChangeEvent(newCityData)
  }
}, { deep: true })

</script>

<style scoped>
.default-page {
  height: 100%;
  overflow-x: hidden;
  width: 100%;
  max-width: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  color: #2d3748;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 1;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 18px;
  font-weight: bold;
}

.page-content {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 监控中心响应式样式 */
.monitoring-center {
  min-height: 100vh;
  background: #f5f5f5;
  color: #1a202c;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  padding: 16px;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* 确保所有子元素不会超出容器 */
.monitoring-center * {
  max-width: 100%;
  box-sizing: border-box;
}

/* 防止横向滚动 */
body,
html {
  overflow-x: hidden;
}




/* 内容包装器 */
.content-wrapper {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

/* 响应式网格布局 */

.main-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  min-height: calc(100vh - 120px);
}

/* 超大屏幕布局 (≥1600px) */
@media (min-width: 1600px) {
  .main-content {
    grid-template-columns: 350px 1fr 350px;
    grid-template-areas:
      "left center right";
    gap: 20px;
  }

  .left-panel {
    grid-area: left;
    min-width: 0;
  }

  .center-panel {
    grid-area: center;
    min-width: 0;
  }

  .right-panel {
    grid-area: right;
    min-width: 0;
  }
}

/* 大屏幕布局 (1200px-1599px) */
@media (min-width: 1200px) and (max-width: 1599px) {
  .main-content {
    grid-template-columns: 300px 1fr 300px;
    grid-template-areas:
      "left center right";
    gap: 16px;
  }

  .left-panel {
    grid-area: left;
    min-width: 0;
  }

  .center-panel {
    grid-area: center;
    min-width: 0;
  }

  .right-panel {
    grid-area: right;
    min-width: 0;
  }
}

/* 中等屏幕布局 (768px-1199px) */
@media (min-width: 768px) and (max-width: 1199px) {
  .main-content {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "left right"
      "center center";
    gap: 16px;
  }

  .left-panel {
    grid-area: left;
    min-width: 0;
  }

  .center-panel {
    grid-area: center;
    min-width: 0;
  }

  .right-panel {
    grid-area: right;
    min-width: 0;
  }
}

/* 卡片通用样式 */

.card-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 24px;
  right: 24px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.5px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* 响应式卡片标题 */
@media (min-width: 1600px) {
  .card-title {
    font-size: 22px;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .card-title {
    font-size: 20px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .card-title {
    font-size: 18px;
  }
}

@media (max-width: 767px) {
  .card-title {
    font-size: 16px;
  }
}

.farm-select {
  width: 140px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 8px;
  color: #333;
  padding: 8px 12px;
  font-size: 14px;
}

/* 卡片样式优化 */
.info-card,
.weather-card,
.map-card,
.irrigation-card,
.realtime-card,
.warning-card {
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

.info-card::before,
.weather-card::before,
.map-card::before,
.irrigation-card::before,
.realtime-card::before,
.warning-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
  opacity: 0.8;
}

.info-card:hover,
.weather-card:hover,
.map-card:hover,
.irrigation-card:hover,
.realtime-card:hover,
.warning-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.08),
    0 4px 12px rgba(0, 0, 0, 0.04);
  border-color: rgba(102, 126, 234, 0.2);
}

/* 面板样式 */
.left-panel,
.right-panel,
.center-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
}

/* 确保面板内容能够自适应 */
.left-panel>*,
.right-panel>*,
.center-panel>* {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.panel-title {
  font-size: 18px;
  color: #409eff;
  margin: 0 0 20px 0;
  border-bottom: 2px solid rgba(64, 158, 255, 0.3);
  padding-bottom: 10px;
}

.info-section {
  margin-bottom: 30px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

/* 响应式信息网格 */
@media (min-width: 1600px) {
  .info-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 16px;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .info-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .info-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 10px;
  }
}

@media (max-width: 767px) {
  .info-grid {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 8px;
  }
}

.info-item {
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 8px;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  text-align: center;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.info-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
}

.info-item:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border-color: rgba(102, 126, 234, 0.2);
}

.info-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.info-value {
  font-size: 18px;
  font-weight: 700;
  color: #409eff;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* 响应式信息值字体 */
@media (min-width: 1600px) {
  .info-value {
    font-size: 20px;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .info-value {
    font-size: 18px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .info-value {
    font-size: 16px;
  }
}

@media (max-width: 767px) {
  .info-value {
    font-size: 14px;
  }
}

.info-value.online {
  color: #67c23a;
}

.info-value.offline {
  color: #f56c6c;
}

.weather-section {
  margin-top: 20px;
}


.weather-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

/* 中央地图区域 */
.center-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: fit-content;
}

.map-header {
  margin-bottom: 15px;
}


.map-selector {
  position: absolute;
  top: 80px;
  left: 20px;
  z-index: 10;
}


.map-container {
  width: 100%;
  height: 700px;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  min-height: 500px;
  max-height: 800px;
}

/* 响应式地图容器高度 */
@media (min-width: 1600px) {
  .map-container {
    height: 800px;
    min-height: 700px;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .map-container {
    height: 700px;
    min-height: 600px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .map-container {
    height: 600px;
    min-height: 500px;
  }
}

@media (max-width: 767px) {
  .map-container {
    height: 500px;
    min-height: 400px;
  }
}

/* 旧的地图标记样式已移除，现在使用真实地图组件 */

/* 设备控制弹框样式 - 优化性能 */
.device-control-modal .el-message-box {
  width: 650px;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border: none;
  overflow: hidden;
  background: #ffffff;
  position: relative;
}

.device-control-modal .el-message-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(102, 126, 234, 0.02);
  pointer-events: none;
}

.device-control-modal .el-message-box__header {
  background: #667eea;
  color: white;
  padding: 24px 32px;
  border-bottom: none;
  position: relative;
  overflow: hidden;
}



.device-control-modal .el-message-box__title {
  color: white;
  font-size: 24px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 1px;
  position: relative;
  z-index: 1;
}

.device-control-modal .el-message-box__close {
  color: white;
  font-size: 24px;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.device-control-modal .el-message-box__close:hover {
  transform: scale(1.1);
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.2);
}

.device-control-modal .el-message-box__content {
  padding: 0;
  background: transparent;
}

.device-control-content,
.device-info-content {
  padding: 40px;
  background: linear-gradient(135deg, #ffffff, #f8fafc);
}

.device-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
  position: relative;
  overflow: hidden;
}

.device-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #667eea;
  border-radius: 1px;
}

.device-icon {
  width: 60px;
  height: 60px;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border-radius: 12px;
  border: 2px solid rgba(102, 126, 234, 0.2);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
}


.device-icon img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  object-position: center;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.device-info {
  flex: 1;
  position: relative;
  z-index: 1;
}

.device-name {
  font-size: 20px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 8px 0;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.5px;
}

.device-type {
  display: inline-block;
  padding: 6px 16px;
  background: #667eea;
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: 16px;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}


.device-status {
  margin-bottom: 32px;
}

.device-actions {
  text-align: center;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: relative;
}

.device-actions::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 2px;
  background: #667eea;
  border-radius: 1px;
}

.device-type-badge {
  display: inline-block;
  padding: 6px 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 12px;
  font-weight: 700;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 8px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.device-location {
  font-size: 14px;
  color: #64748b;
  margin-top: 8px;
  font-weight: 500;
}

.device-status-card {
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  border-radius: 16px;
  padding: 24px;
  margin: 24px 0;
  border: 1px solid rgba(102, 126, 234, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.1);
}

.status-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.status-indicator {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  animation: pulse 2s infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.status-text {
  font-weight: 700;
  font-size: 14px;
}

.status-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.status-item:last-child {
  border-bottom: none;
}

.status-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.status-value {
  font-size: 14px;
  font-weight: 600;
  color: #1a202c;
}

.status-value.realtime {
  color: #409eff;
  font-weight: 700;
  font-size: 16px;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 24px;
}

.action-btn {
  min-width: 140px;
  height: 48px;
  font-size: 16px;
  font-weight: 700;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

/* Popover 样式 */
.device-popover-content {
  padding: 16px;
  min-width: 350px;
}

.device-popover-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.device-popover-icon {
  width: 40px;
  height: 40px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.device-popover-icon img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.device-popover-info {
  flex: 1;
}

.device-popover-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.device-popover-details {
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f2f5;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
}

.detail-value {
  font-size: 14px;
  color: #303133;
  font-weight: 600;
}

.device-popover-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.map-marker.valve:hover .marker-icon {
  box-shadow: 0 0 15px rgba(64, 158, 255, 0.8);
}

.map-marker.flowmeter:hover .marker-icon {
  box-shadow: 0 0 15px rgba(230, 162, 60, 0.8);
}

.map-marker.fertilizer:hover .marker-icon {
  box-shadow: 0 0 15px rgba(156, 39, 176, 0.8);
}

/* 右侧面板 */
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}


.farm-selector {
  margin-bottom: 20px;
}

.realtime-data {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
}

/* 响应式实时数据布局 */
@media (min-width: 1600px) {
  .realtime-data {
    gap: 12px;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .realtime-data {
    gap: 10px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .realtime-data {
    gap: 8px;
  }
}

@media (max-width: 767px) {
  .realtime-data {
    gap: 6px;
  }
}

.data-item {
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 8px;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.data-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
}

.data-item:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border-color: rgba(102, 126, 234, 0.2);
}

.data-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

.data-value {
  font-size: 18px;
  font-weight: 700;
  color: #409eff;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

/* 响应式数据值字体 */
@media (min-width: 1600px) {
  .data-value {
    font-size: 20px;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .data-value {
    font-size: 18px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .data-value {
    font-size: 16px;
  }
}

@media (max-width: 767px) {
  .data-value {
    font-size: 14px;
  }
}

/* 底部表格区域 */
.bottom-section {
  margin-top: 20px;
  width: 100%;
}

.irrigation-section {
  margin-top: 20px;
}

/* Element Plus表格样式 */
.irrigation-table {
  width: 100%;
  font-size: 13px;
  border-radius: 6px;
  overflow: hidden;
  table-layout: fixed;
  min-width: 0;
}

/* 响应式表格字体 */
@media (min-width: 1600px) {
  .irrigation-table {
    font-size: 14px;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .irrigation-table {
    font-size: 13px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .irrigation-table {
    font-size: 12px;
  }
}

@media (max-width: 767px) {
  .irrigation-table {
    font-size: 11px;
  }
}

.irrigation-table .el-table__cell {
  padding: 12px 8px !important;
  font-size: 13px;
}

.irrigation-table .el-table__header-cell {
  padding: 12px 8px !important;
  font-size: 13px;
  font-weight: 600;
  background: #f8fafc !important;
  color: #4a5568 !important;
}

.irrigation-table .el-table__body tr:hover {
  background-color: #f7fafc !important;
}

/* 禁用列宽调整 */
.irrigation-table .el-table__header-wrapper {
  user-select: none;
  pointer-events: none;
}

.irrigation-table .el-table__header {
  pointer-events: none;
}

.irrigation-table .el-table__header th {
  cursor: default !important;
  resize: none !important;
  pointer-events: none !important;
  user-select: none !important;
}

.irrigation-table .el-table__header th:hover {
  cursor: default !important;
  pointer-events: none !important;
}

.irrigation-table .el-table__header th::after {
  display: none !important;
  pointer-events: none !important;
}

.irrigation-table .el-table__header th .cell {
  pointer-events: none !important;
  user-select: none !important;
}

.irrigation-table .el-table__header th .el-table__column-resize-proxy {
  display: none !important;
  pointer-events: none !important;
}

.irrigation-table .el-table__header th .el-table__column-resize-trigger {
  display: none !important;
  pointer-events: none !important;
}

.irrigation-table .el-table__header th .el-table__column-resize-handle {
  display: none !important;
  pointer-events: none !important;
}

.irrigation-table .el-table__header th .el-table__column-resize-handle::after {
  display: none !important;
  pointer-events: none !important;
}

/* 禁用所有可能的调整元素 */
.irrigation-table .el-table__header th * {
  pointer-events: none !important;
  user-select: none !important;
  resize: none !important;
}

/* 确保表格布局固定 */
.irrigation-table .el-table__body-wrapper {
  pointer-events: auto;
}

.irrigation-table .el-table__body tr {
  pointer-events: auto;
}

.irrigation-table .el-table__body td {
  pointer-events: auto;
}

/* 表格行样式 */
.el-table .warning-row {
  background: oldlace;
}

.el-table .success-row {
  background: #f0f9eb;
}

/* 表格说明文字 */






/* 移动端优化 */
@media (max-width: 767px) {
  .monitoring-center {
    padding: 12px;
  }


  .main-content {
    gap: 12px;
    display: flex;
    flex-direction: column;
  }

  /* 确保所有面板都显示 */
  .left-panel,
  .center-panel,
  .right-panel {
    width: 100%;
    max-width: 100%;
    order: unset;
  }

  /* 调整显示顺序 */
  .left-panel {
    order: 1;
  }

  .center-panel {
    order: 2;
  }

  .right-panel {
    order: 3;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .info-item {
    padding: 10px 12px;
  }

  .card-header {
    padding: 12px 16px;
  }

  .card-title {
    font-size: 16px;
  }

  .realtime-data {
    gap: 6px;
  }

  .data-item {
    padding: 10px 12px;
  }

  .map-container {
    height: 400px;
  }

  .el-table {
    font-size: 12px;
  }

  .el-table .el-table__cell {
    padding: 6px 4px;
  }
}

/* 平板端优化 */
@media (min-width: 768px) and (max-width: 1023px) {
  .monitoring-center {
    padding: 14px;
  }

  .main-content {
    gap: 14px;
  }

  .info-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 10px;
  }

  .info-item {
    padding: 10px 12px;
  }

  .data-item {
    padding: 10px 12px;
  }

  .map-container {
    height: 450px;
  }
}


/* 超小屏幕优化 */
@media (max-width: 480px) {
  .monitoring-center {
    padding: 8px;
  }

  .farm-selector-header {
    padding: 8px 12px;
  }

  .main-content {
    gap: 8px;
    display: flex;
    flex-direction: column;
  }

  /* 确保所有面板都显示 */
  .left-panel,
  .center-panel,
  .right-panel {
    width: 100%;
    max-width: 100%;
    order: unset;
  }

  /* 调整显示顺序 */
  .left-panel {
    order: 1;
  }

  .center-panel {
    order: 2;
  }

  .right-panel {
    order: 3;
  }

  .card-header {
    padding: 8px 12px;
  }

  .info-item,
  .data-item {
    padding: 8px 10px;
  }

  .map-container {
    height: 350px;
  }

  .el-table {
    font-size: 11px;
  }

  .el-table .el-table__cell {
    padding: 4px 2px;
  }
}

/* 横屏优化 */
@media (orientation: landscape) and (max-height: 600px) {
  .monitoring-center {
    padding: 12px;
  }

  .main-content {
    min-height: calc(100vh - 80px);
  }

  .map-container {
    height: 300px;
  }
}

/* 表格和内容防止溢出 */
.el-table {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
}

/* Tab样式 */
.irrigation-tabs {
  margin-top: 0;
}

.tab-content {
  padding: 20px 0;
}

/* 告警卡片样式 */
.warning-card {
  min-height: 350px;
}

.warning-badge {
  margin-left: auto;
}

.warning-list {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.warning-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  margin-bottom: 8px;
  background: linear-gradient(145deg, #ffffff, #fef5f5);
  border-radius: 8px;
  border-left: 3px solid #f56c6c;
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.1);
  transition: all 0.2s ease;
}

.warning-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.2);
  background: linear-gradient(145deg, #fef5f5, #fff0f0);
}

.warning-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(245, 108, 108, 0.1);
  border-radius: 50%;
  margin-right: 12px;
}

.warning-content {
  flex: 1;
  min-width: 0;
}

.warning-text {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* 响应式告警文字 */
@media (min-width: 1600px) {
  .warning-text {
    font-size: 14px;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .warning-text {
    font-size: 13px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .warning-text {
    font-size: 13px;
  }
}

@media (max-width: 767px) {
  .warning-text {
    font-size: 12px;
  }
  
  .warning-item {
    padding: 10px;
  }
}

/* 急停对话框样式 */
.emergency-stop-content {
  padding: 20px;
}

.emergency-warning {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  background: linear-gradient(135deg, #fff5f5, #ffe6e6);
  border-radius: 8px;
  border-left: 4px solid #f56c6c;
  font-size: 16px;
  font-weight: 600;
  color: #d32f2f;
}

.block-selection {
  margin-bottom: 24px;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
}

.block-checkbox {
  display: block;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  transition: all 0.2s ease;
}

.block-checkbox:hover {
  background: #f5f7fa;
  border-color: #409eff;
}

.block-checkbox:last-child {
  margin-bottom: 0;
}

.emergency-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

/* 响应式急停对话框 */
@media (max-width: 767px) {
  .emergency-stop-content {
    padding: 16px;
  }
  
  .emergency-warning {
    font-size: 14px;
    padding: 12px;
  }
  
  .block-selection {
    max-height: 200px;
    padding: 12px;
  }
  
  .block-checkbox {
    padding: 6px 10px;
    font-size: 14px;
  }
  
  .emergency-actions {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
