<template>
  <div class="default-page">
    <!-- 监控中心特殊布局 -->
    <div v-if="route.name === '监控中心'" class="monitoring-center">
      <!-- 顶部农场选择器 -->
      <div class="farm-selector-header">
        <div class="selector-container">
          <span class="selector-label">选择农场：</span>
          <el-select v-model="selectedFarm" class="farm-select-main" size="large" @change="onFarmChange">
            <el-option v-for="farm in farmList" :key="farm.id" :label="farm.name" :value="farm.id" />
          </el-select>
        </div>
      </div>

      <!-- 内容包装器 -->
      <div class="content-wrapper">
        <!-- 主要内容区域 -->
        <div class="main-content">
          <!-- 左侧信息面板 -->
          <div class="left-panel">
            <!-- 基本信息卡片 -->
            <el-card class="info-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span class="card-title">基本信息</span>
                </div>
              </template>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">轮灌组数量</div>
                  <div class="info-value">{{ basicInfo.irrigationGroups }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">农场面积</div>
                  <div class="info-value">{{ basicInfo.farmArea }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">作物名称</div>
                  <div class="info-value">{{ basicInfo.cropName }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">设备总数量</div>
                  <div class="info-value">{{ basicInfo.totalDevices }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">在线设备</div>
                  <div class="info-value online">{{ basicInfo.onlineDevices }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">离线设备</div>
                  <div class="info-value offline">{{ basicInfo.offlineDevices }}</div>
                </div>
              </div>
            </el-card>

            <!-- 气象信息卡片 -->
            <el-card class="weather-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span class="card-title">气象信息</span>
                </div>
              </template>
              <div class="weather-content">
                <WeatherWeekly />
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

            <!-- 轮灌组表格卡片 -->
            <el-card class="irrigation-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span class="card-title">轮灌组详情</span>
                </div>
              </template>

              <el-table :data="irrigationGroups" style="width: 100%" :row-class-name="tableRowClassName">

                <el-table-column prop="id" label="轮灌组" width="110" align="left" />
                <el-table-column prop="area" label="面积/亩" width="110" align="left" />
                <el-table-column prop="irrigationMethod" label="灌溉方式" width="110" align="left" />
                <el-table-column prop="name" label="策略名称" width="110" align="left" />
                <el-table-column prop="fertilizerStrategy" label="施肥策略" width="110" align="left" />
                <el-table-column prop="irrigatedVolume" label="已灌溉量" width="110" align="left" />
                <el-table-column prop="fertilizedVolume" label="已施肥量" width="110" align="left" />

                <el-table-column prop="status" label="灌溉状态" width="110" align="left">
                  <template #default="{ row }">
                    <el-tag :type="getStatusTagType(row.status)" size="default" effect="dark" round>
                      {{ row.status }}
                    </el-tag>
                  </template>
                </el-table-column>

                <el-table-column prop="remainingTime" label="剩余灌溉时间" width="110" align="center" />
              </el-table>
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
import { computed, reactive, ref, onMounted, shallowRef } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import WeatherWeekly from '../../../../weather/gui/WeatherWeekly.vue'
import InteractiveMapComponent from './InteractiveMapComponent.vue'
import call_remote from '../../../lib/call_remote.js'

const route = useRoute()
const systemName = ref('智能灌溉管理系统')

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

// 农场列表数据 - 使用shallowRef优化性能
const farmList = shallowRef([])

// 基本信息数据
const basicInfo = reactive({
  irrigationGroups: 0,
  farmArea: '0亩',
  cropName: '',
  totalDevices: 0,
  onlineDevices: 0,
  offlineDevices: 0
})

// 实时数据
const realtimeData = reactive({
  totalFlow: '0 m³',
  mainPipeFlow: '0 m³/h',
  mainPipePressure: '0 mpa',
  fertilizerFlow: '0 L/h',
  totalFertilizer: '0 m³'
})

// 地图配置
const mapCenter = ref({ lng: 111.670801, lat: 40.818311 }) // 默认呼和浩特市坐标
const mapZoom = ref(15)

// 地图标记点 - 使用shallowRef优化性能，从真实设备数据获取
const mapMarkers = shallowRef([])

// 轮灌组数据 - 使用shallowRef优化性能
const irrigationGroups = shallowRef([
  {
    id: 1,
    name: '轮灌组1',
    area: 80,
    irrigationMethod: '顺序',
    irrigationTime: '12h',
    fertilizerStrategy: '30L/亩',
    irrigatedVolume: '1200m³',
    fertilizedVolume: '48m³',
    status: '执行完成',
    remainingTime: '0'
  },
  {
    id: 2,
    name: '轮灌组2',
    area: 75,
    irrigationMethod: '顺序',
    irrigationTime: '12h',
    fertilizerStrategy: '30L/亩',
    irrigatedVolume: '195m³',
    fertilizedVolume: '-m³',
    status: '执行中',
    remainingTime: '06:12:05'
  },
  {
    id: 3,
    name: '轮灌组3',
    area: 80,
    irrigationMethod: '顺序',
    irrigationTime: '12h',
    fertilizerStrategy: '30L/亩',
    irrigatedVolume: '-m³',
    fertilizedVolume: '-m³',
    status: '排队中',
    remainingTime: '-'
  },
  {
    id: 4,
    name: '轮灌组4',
    area: 90,
    irrigationMethod: '顺序',
    irrigationTime: '12h',
    fertilizerStrategy: '30L/亩',
    irrigatedVolume: '-m³',
    fertilizedVolume: '-m³',
    status: '排队中',
    remainingTime: '-'
  },
  {
    id: 5,
    name: '轮灌组5',
    area: 68,
    irrigationMethod: '顺序',
    irrigationTime: '12h',
    fertilizerStrategy: '30L/亩',
    irrigatedVolume: '-m³',
    fertilizedVolume: '-m³',
    status: '排队中',
    remainingTime: '-'
  },
  {
    id: 6,
    name: '轮灌组6',
    area: 50,
    irrigationMethod: '同上',
    irrigationTime: '10h',
    fertilizerStrategy: '30L/亩',
    irrigatedVolume: '-m³',
    fertilizedVolume: '-m³',
    status: '排队中',
    remainingTime: '-'
  }
])

// 表格行样式类名
const tableRowClassName = ({ row }) => {
  if (row.status === '执行中') {
    return 'success-row'
  } else if (row.status === '暂停') {
    return 'warning-row'
  }
  return ''
}

// Element Plus标签类型
const getStatusTagType = (status) => {
  switch (status) {
    case '执行中':
      return 'success'
    case '执行完成':
      return 'primary'
    case '排队中':
      return 'warning'
    case '暂停':
      return 'danger'
    default:
      return 'info'
  }
}

// API接口方法
const loadFarmList = async () => {
  try {
    const response = await call_remote('/resource/list_farm', {})

    // 检查响应结构，数据直接在 farms 中
    if (response && response.farms && Array.isArray(response.farms) && response.farms.length > 0) {
      // 适配真实数据结构，直接使用农场名称作为ID
      farmList.value = response.farms.map((farm) => ({
        id: farm.name, // 直接使用农场名称作为ID
        name: farm.name,
        info: farm.info,
        location: farm.location,
        longitude: farm.longitude,
        latitude: farm.latitude
      }))
      selectedFarm.value = farmList.value[0].id
      await loadFarmData(selectedFarm.value)
    } else {
      farmList.value = []
    }
  } catch (error) {
    console.error('加载农场列表失败:', error)
    farmList.value = []
  }
}

const loadFarmData = async (farmId) => {
  try {
    // 加载基本信息 - 使用监控中心模块
    const basicResponse = await call_remote('/monitoring/getBasicInfo', { farmName: farmId })
    if (basicResponse) {
      basicInfo.irrigationGroups = basicResponse.irrigationGroups || 0
      basicInfo.farmArea = `${basicResponse.totalArea || 0}亩`
      basicInfo.cropName = basicResponse.cropName || '未知'
      basicInfo.totalDevices = basicResponse.totalDevices || 0
      basicInfo.onlineDevices = basicResponse.onlineDevices || 0
      basicInfo.offlineDevices = basicResponse.offlineDevices || 0
    }

    // 加载真实设备数据
    await loadRealDeviceData(farmId)
    
    // 加载轮灌组数据
    await loadIrrigationGroups()
  } catch (error) {
    console.error('加载农场数据失败:', error)
    // 使用模拟数据
    basicInfo.irrigationGroups = 6
    basicInfo.farmArea = '580亩'
    basicInfo.cropName = '玉米'
    basicInfo.totalDevices = 27
    basicInfo.onlineDevices = 25
    basicInfo.offlineDevices = 2

    realtimeData.totalFlow = '1680 m³'
    realtimeData.mainPipeFlow = '250 m³/h'
    realtimeData.mainPipePressure = '0.345 mpa'
    realtimeData.fertilizerFlow = '50 L/h'
    realtimeData.totalFertilizer = '1000 m³'
  }
}

const onFarmChange = async (farmId) => {
  // 更新地图中心点到选中农场的坐标
  const selectedFarmData = farmList.value.find(farm => farm.id === farmId)
  if (selectedFarmData && selectedFarmData.longitude && selectedFarmData.latitude) {
    mapCenter.value = {
      lng: selectedFarmData.longitude,
      lat: selectedFarmData.latitude
    }
  } else {
    // 如果没有坐标信息，使用默认坐标
    mapCenter.value = { lng: 111.670801, lat: 40.818311 }
  }

  await loadFarmData(farmId)
}

// 更新设备实际状态 - 从策略执行状态获取
const updateDeviceStatuses = async (devices) => {
  try {
    // 暂时注释掉策略执行状态获取，因为API不存在
    // TODO: 实现策略执行状态API或使用其他方式获取设备状态
    
    // 直接读取设备实际状态
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
        console.warn(`获取设备 ${device.deviceName} 状态失败:`, error)
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


// 组件挂载时加载数据
// 加载轮灌组数据
const loadIrrigationGroups = async () => {
  try {
    const response = await call_remote('/policy/get_irrigation_groups', {})
    console.log('轮灌组API响应:', response)
    
    if (response && response.groups && Array.isArray(response.groups)) {
      console.log('轮灌组数据:', response.groups)
      // 转换轮灌组数据为前端显示格式
      const groups = response.groups.map((group, index) => {
        console.log(`轮灌组 ${index + 1}:`, group)
        console.log(`轮灌组 ${index + 1} 变量:`, group.variables)
               return {
                 id: index + 1,
                 name: group.name, // 策略名称
                 area: parseInt(group.variables.area) || 0,
                 irrigationMethod: '顺序',
                 irrigationTime: group.variables.irrigation_time || '12h', // 灌溉时间
                 fertilizerStrategy: group.variables.fertilizer_amount || '30L/亩',
                 irrigatedVolume: group.variables.irrigated_volume ? group.variables.irrigated_volume + 'm³' : '0m³',
                 fertilizedVolume: group.variables.fertilized_volume ? group.variables.fertilized_volume + 'm³' : '0m³',
                 status: group.current_state || '待机状态', // 策略的运行时状态
                 remainingTime: parseInt(group.variables.remaining_time) || 0
               }
      })
      
      console.log('转换后的轮灌组数据:', groups)
      irrigationGroups.value = groups
      basicInfo.irrigationGroups = groups.length
    } else {
      // 如果没有轮灌组数据，使用模拟数据
      irrigationGroups.value = [
        {
          id: 1,
          name: '轮灌组1',
          area: 80,
          irrigationMethod: '顺序',
          irrigationTime: '12h',
          fertilizerStrategy: '30L/亩',
          irrigatedVolume: '1200m³',
          fertilizedVolume: '48m³',
          status: '执行完成',
          remainingTime: 0
        }
      ]
      basicInfo.irrigationGroups = irrigationGroups.value.length
    }
  } catch (error) {
    console.error('加载轮灌组数据失败:', error)
    // 使用模拟数据
    irrigationGroups.value = [
      {
        id: 1,
        name: '轮灌组1',
        area: 80,
        irrigationMethod: '顺序',
        irrigationTime: '12h',
        fertilizerStrategy: '30L/亩',
        irrigatedVolume: '1200m³',
        fertilizedVolume: '48m³',
        status: '执行完成',
        remainingTime: 0
      }
    ]
    basicInfo.irrigationGroups = irrigationGroups.value.length
  }
}

onMounted(() => {
  loadFarmList()
  getSystemName()
})

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


/* 顶部农场选择器 */
.farm-selector-header {
  margin-bottom: 20px;
  padding: 16px 24px;
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.selector-container {
  display: flex;
  align-items: center;
  gap: 13px;
  flex-wrap: nowrap;
  min-width: 0;
}

.selector-label {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  white-space: nowrap;
  flex-shrink: 0;
}

.farm-select-main {
  min-width: 200px;
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

.info-card::before,
.weather-card::before,
.map-card::before,
.irrigation-card::before,
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
.map-card:hover,
.irrigation-card:hover,
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
  height: 500px;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  min-height: 300px;
  max-height: 600px;
}

/* 响应式地图容器高度 */
@media (min-width: 1600px) {
  .map-container {
    height: 600px;
    min-height: 500px;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .map-container {
    height: 500px;
    min-height: 400px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .map-container {
    height: 400px;
    min-height: 300px;
  }
}

@media (max-width: 767px) {
  .map-container {
    height: 300px;
    min-height: 250px;
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

  .farm-selector-header {
    padding: 12px 16px;
    margin-bottom: 16px;
  }

  .selector-label {
    font-size: 14px;
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
    height: 250px;
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
    height: 300px;
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
    height: 200px;
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
    height: 200px;
  }
}

/* 表格和内容防止溢出 */
.el-table {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
}
</style>
