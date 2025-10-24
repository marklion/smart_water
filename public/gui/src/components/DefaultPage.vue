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
            <!-- 地图和策略详情卡片 -->
            <el-card class="map-irrigation-card" shadow="hover">
              <el-tabs v-model="activeMainTab" class="main-tabs" @tab-change="handleMainTabChange">
                <!-- 农场地图 Tab -->
                <el-tab-pane label="农场地图" name="map">
                  <div class="map-container">
                    <InteractiveMapComponent :devices="mapMarkers" :center="mapCenter" :zoom="mapZoom"
                      @device-click="onDeviceClick" @device-toggle="onDeviceToggle" />
                  </div>
                </el-tab-pane>

                <!-- 轮灌组状态 Tab -->
                <el-tab-pane label="轮灌组状态" name="watering">
                  <div class="tab-content-with-actions">
                    <div class="tab-actions">
                      <el-button type="primary" size="small" @click="refreshWateringGroup" :icon="Refresh">
                        刷新
                      </el-button>
                    </div>
                    <div class="tab-content-scroll">
                      <WateringGroupStatus ref="wateringGroupRef" :farm-name="selectedFarm" />
                    </div>
                  </div>
                </el-tab-pane>

                <!-- 策略运行时状态 Tab -->
                <el-tab-pane label="策略运行时状态" name="runtime">
                  <div class="tab-content-with-actions">
                    <div class="tab-actions">
                      <el-button type="primary" size="small" @click="refreshIrrigationData" :icon="Refresh">
                        刷新
                      </el-button>
                    </div>
                    <div class="tab-content-scroll">
                      <PolicyRuntimeStatus ref="policyRuntimeRef" :farm-name="selectedFarm" />
                    </div>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </el-card>
          </div>

          <!-- 右侧信息面板 -->
          <div class="right-panel">
            <!-- 实时数据卡片 -->
            <RealtimeDataCard :farm-name="selectedFarm" ref="realtimeDataRef" />

            <!-- 告警信息卡片 -->
            <WarningCard ref="warningCardRef" />
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
import { computed, reactive, ref, onMounted, onUnmounted, shallowRef, watch, inject } from 'vue'
import { useRoute } from 'vue-router'
import { Refresh } from '@element-plus/icons-vue'
import WeatherWeekly from '../../../../weather/gui/WeatherWeekly.vue'
import InteractiveMapComponent from './InteractiveMapComponent.vue'
import WateringGroupStatus from '../../../../policy/gui/WateringGroupStatus.vue'
import PolicyRuntimeStatus from '../../../../policy/gui/PolicyRuntimeStatus.vue'
import BasicInfoCard from '../../../../monitoring/gui/BasicInfoCard.vue'
import RealtimeDataCard from '../../../../monitoring/gui/RealtimeDataCard.vue'
import WarningCard from '../../../../monitoring/gui/WarningCard.vue'
import call_remote from '../../../lib/call_remote.js'
import { fetchMapConfig } from '../config/mapConfig.js'

const route = useRoute()
// 注入城市变化数据
const cityChangeData = inject('cityChangeData', ref({ city: '', location: null, timestamp: null }))

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
  waterGroupCount: 0,
  farmArea: '0亩',
  cropName: '',
  totalDevices: 0,
  onlineDevices: 0,
  offlineDevices: 0
})

// 基本信息卡片配置
const basicInfoItems = [
  { key: 'waterGroupCount', label: '轮灌组数量', valueClass: '' },
  { key: 'farmArea', label: '农场面积', valueClass: '' },
  { key: 'cropName', label: '作物名称', valueClass: '' },
  { key: 'totalDevices', label: '设备总数量', valueClass: '' },
  { key: 'onlineDevices', label: '在线设备', valueClass: 'online' },
  { key: 'offlineDevices', label: '离线设备', valueClass: 'offline' }
]

// 实时数据已移至 RealtimeDataCard 组件中管理


// 地图配置
const mapCenter = ref({ lng: 111.670801, lat: 40.818311 }) // 默认呼和浩特市坐标
const mapZoom = ref(15)

// 地图标记点 - 使用shallowRef优化性能，从真实设备数据获取
const mapMarkers = shallowRef([])


// Tab切换相关
const activeMainTab = ref('map') // 主tab切换（地图、轮灌组状态、策略运行时状态）
const activeIrrigationTab = ref('watering')


// 组件引用
const wateringGroupRef = ref(null)
const policyRuntimeRef = ref(null)
const realtimeDataRef = ref(null)
const warningCardRef = ref(null)


// API接口方法


const loadFarmData = async (farmId) => {
  try {

    // 更新地图中心点 - 根据农场位置信息
    await updateMapCenterForFarm(farmId)

    // 加载基本信息 - 使用监控中心模块
    const basicResponse = await call_remote('/monitoring/getBasicInfo', { farmName: farmId })

    if (basicResponse) {
      // 直接从后端API获取所有基础信息，包括轮灌组数量
      basicInfo.waterGroupCount = basicResponse.waterGroupCount || 0
      basicInfo.farmArea = `${basicResponse.totalArea || 0}亩`
      basicInfo.cropName = basicResponse.cropName || '未知'
      basicInfo.totalDevices = basicResponse.totalDevices || 0
      basicInfo.onlineDevices = basicResponse.onlineDevices || 0
      basicInfo.offlineDevices = basicResponse.offlineDevices || 0
    } else {
      // 如果 API 没有返回数据，使用默认值
      basicInfo.waterGroupCount = 0
      basicInfo.farmArea = '0亩'
      basicInfo.cropName = '未知'
      basicInfo.totalDevices = 0
      basicInfo.onlineDevices = 0
      basicInfo.offlineDevices = 0
    }

    // 加载真实设备数据
    await loadRealDeviceData(farmId)

  } catch (error) {
    console.error('加载农场数据失败:', error)
    // 使用默认值而不是硬编码的模拟数据
    basicInfo.waterGroupCount = 0
    basicInfo.farmArea = '0亩'
    basicInfo.cropName = '未知'
    basicInfo.totalDevices = 0
    basicInfo.onlineDevices = 0
    basicInfo.offlineDevices = 0

    // 实时数据由 RealtimeDataCard 组件管理
  }
}

// 实时数据加载已移至 RealtimeDataCard 组件中

// 更新地图中心点 - 根据农场位置信息
const updateMapCenterForFarm = async (farmId) => {
  try {
    // 首先尝试从全局农场列表中获取农场位置信息
    if (window.farmList && window.farmList.length > 0) {
      const farm = window.farmList.find(f => f.id === farmId)
      if (farm && farm.longitude && farm.latitude) {
        mapCenter.value = { lng: farm.longitude, lat: farm.latitude }
        mapZoom.value = 15
        return
      }
    }

    // 如果农场没有位置信息，尝试从设备数据中获取位置
    try {
      const deviceResponse = await call_remote('/device_management/list_device', {
        farm_name: farmId,
        pageNo: 0
      })

      if (deviceResponse && deviceResponse.devices && deviceResponse.devices.length > 0) {
        // 查找有真实坐标的设备
        const deviceWithLocation = deviceResponse.devices.find(device => 
          device.longitude && device.latitude
        )

        if (deviceWithLocation) {
          mapCenter.value = { 
            lng: deviceWithLocation.longitude, 
            lat: deviceWithLocation.latitude 
          }
          mapZoom.value = 15
          return
        }
      }
    } catch (error) {
      console.warn('获取设备位置信息失败:', error)
    }

    // 如果都没有位置信息，使用默认位置
    mapCenter.value = { lng: 111.670801, lat: 40.818311 } // 默认呼和浩特市坐标
    mapZoom.value = 15

  } catch (error) {
    console.error('更新地图中心点失败:', error)
    // 出错时使用默认位置
    mapCenter.value = { lng: 111.670801, lat: 40.818311 }
    mapZoom.value = 15
  }
}

// 处理农场切换事件
const handleFarmChange = async (farmId) => {
  selectedFarm.value = farmId
  await loadFarmData(farmId)
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
    
    // 更新基本信息统计
    updateBasicInfoStats()
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
          latitude: device.latitude,
          // 保存在线状态
          is_online: device.is_online,
          // 保存运行时信息
          runtime_info: device.runtime_info
        }
      })

      mapMarkers.value = devices

      // 获取设备实际状态并更新统计
      await updateDeviceStatuses(devices)

      // 更新基本信息中的设备数量 - 根据在线状态计算
      basicInfo.totalDevices = devices.length
      basicInfo.onlineDevices = devices.filter(d => d.is_online === true).length
      basicInfo.offlineDevices = devices.filter(d => d.is_online === false).length
      

    } else {
      // 如果没有获取到设备数据，使用空数组
      mapMarkers.value = []
    }

  } catch (error) {
    console.error('加载真实设备数据失败:', error)
    // 出错时使用空数组
    mapMarkers.value = []
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
    
    // 根据设备的在线状态计算在线和离线设备数量
    const onlineDevices = mapMarkers.value.filter(d => d.is_online === true).length
    const offlineDevices = mapMarkers.value.filter(d => d.is_online === false).length
    
    basicInfo.onlineDevices = onlineDevices
    basicInfo.offlineDevices = offlineDevices
    
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
      cityChangeData.value.city = savedCity
    }
  } catch (error) {
    console.error('加载地图配置失败，使用默认值:', error)
  }
}


// Tab切换处理
// 主tab切换处理
const handleMainTabChange = (tabName) => {
  // Tab切换时刷新对应组件数据
  if (tabName === 'runtime' && policyRuntimeRef.value) {
    policyRuntimeRef.value.refresh()
  } else if (tabName === 'watering' && wateringGroupRef.value) {
    wateringGroupRef.value.refresh?.()
  }
}

const handleIrrigationTabChange = (tabName) => {
  // Tab切换时刷新对应组件数据
  if (tabName === 'runtime' && policyRuntimeRef.value) {
    policyRuntimeRef.value.refresh()
  }
}

// 刷新轮灌组数据
const refreshWateringGroup = async () => {
  if (wateringGroupRef.value && wateringGroupRef.value.refresh) {
    wateringGroupRef.value.refresh()
  }
}

const refreshIrrigationData = async () => {
  if (policyRuntimeRef.value) {
    policyRuntimeRef.value.refresh()
  }
}


// 组件挂载时加载数据
onMounted(async () => {
  await initMapConfig()

  // 添加全局事件监听器
  window.addEventListener('farmChanged', (event) => {
    handleFarmChange(event.detail.farmId)
  })
  

  // 如果是监控中心页面，立即尝试加载数据
  if (route.name === '监控中心') {
    // 先尝试从 localStorage 获取上次选中的农场
    const savedFarm = localStorage.getItem('selectedFarm')
    if (savedFarm) {
      selectedFarm.value = savedFarm
      await loadFarmData(savedFarm)
    } else {
      // 如果没有保存的农场，等待 MainLayout 触发事件
    }
  }
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  window.removeEventListener('farmChanged', handleFarmChange)
})


// 监听路由变化，当切换到监控中心时重新加载数据
watch(() => route.name, async (newRouteName, oldRouteName) => {
  if (newRouteName === '监控中心' && oldRouteName !== '监控中心') {
    
    // 获取当前选中的农场
    const currentFarm = localStorage.getItem('selectedFarm')
    if (currentFarm) {
      selectedFarm.value = currentFarm
      await loadFarmData(currentFarm)
    } else {
      // 如果没有保存的农场，等待 MainLayout 触发事件
    }
  }
})

// 监听城市变化数据
watch(cityChangeData, (newCityData, oldCityData) => {
  if (newCityData && newCityData.city && newCityData.location && 
      (!oldCityData || newCityData.timestamp !== oldCityData.timestamp)) {
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

/* 隐藏滚动条但保留滚动功能 */
.default-page ::-webkit-scrollbar {
  display: none;
}

.default-page {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 24px;
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
  height: 100%;
  background: #f5f5f5;
  color: #1a202c;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  padding: 0;
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
  padding: 16px;
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

.map-irrigation-card {
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
  /* 整个卡片的高度自适应 */
  height: auto;
  min-height: 550px;
}

.info-card::before, 
.weather-card::before,
.map-irrigation-card::before,
.realtime-card::before {
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
.map-irrigation-card:hover,
.realtime-card:hover {
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
  gap: 8px;
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
  height: 100%;
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 确保 el-card 的 body 填满剩余空间 */
.map-irrigation-card :deep(.el-card__body) {
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 地图容器高度 */
.map-container {
  height: 100%;
  min-height: 300px;
}

/* 响应式地图容器高度 */
@media (min-width: 1600px) {
  .map-container {
    height: 100%;
    min-height: 300px;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .map-container {
    height: 300px;
    min-height: 280px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .map-container {
    height: 280px;
    min-height: 260px;
  }
}

@media (max-width: 767px) {
  .map-container {
    height: 240px;
    min-height: 220px;
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
    padding: 0;
  }

  .main-content {
    padding: 12px;
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
    padding: 8px 12px;
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
    height: 300px;
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
    padding: 0;
  }

  .main-content {
    padding: 14px;
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
    height: 260px;
  }
}


/* 超小屏幕优化 */
@media (max-width: 480px) {
  .monitoring-center {
    padding: 0;
  }

  .main-content {
    padding: 8px;
    gap: 8px;
    display: flex;
    flex-direction: column;
  }

  .farm-selector-header {
    padding: 8px 12px;
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
    height: 220px;
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
    padding: 0;
  }

  .main-content {
    padding: 12px;
  }

  .map-container {
    height: 180px;
  }
}

/* 表格和内容防止溢出 */
.el-table {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
}

/* Tab样式 */
/* 主tabs样式 */
.main-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.main-tabs :deep(.el-tabs__header) {
  margin: 0 0 0 0;
  flex-shrink: 0;
  height: 40px; /* 降低tab栏高度 */
}

.main-tabs :deep(.el-tabs__nav-wrap) {
  height: 40px; /* 降低tab栏高度 */
}

.main-tabs :deep(.el-tabs__nav) {
  height: 40px; /* 降低tab栏高度 */
}

.main-tabs :deep(.el-tabs__item) {
  height: 40px; /* 降低tab栏高度 */
  line-height: 40px; /* 调整行高匹配高度 */
  padding: 0 20px; /* 调整内边距 */
  font-size: 14px; /* 稍微减小字体 */
}

.main-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

.main-tabs :deep(.el-tab-pane) {
  height: 100%;
}

.irrigation-tabs {
  margin-top: 0;
}

.tab-content {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.tab-content::-webkit-scrollbar {
  display: none;
}

.tab-content-with-actions {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tab-actions {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.tab-content-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.tab-content-scroll::-webkit-scrollbar {
  display: none;
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
