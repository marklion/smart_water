<template>
  <div class="interactive-map-container">
    <!-- 地图容器 -->
    <div id="amap-container" class="amap-container"></div>

    <!-- 统一控制面板 -->
    <div class="unified-control-panel">
      <!-- 紧急停止区域 -->
      <div class="emergency-section">
        <div class="section-header">
          <el-icon class="section-icon">
            <Warning />
          </el-icon>
          <span class="section-title">紧急控制</span>
        </div>
        <el-button type="danger" @click="showEmergencyStopDialog" class="emergency-stop-btn"
          :loading="emergencyStopLoading">
          <el-icon>
            <Warning />
          </el-icon>
          设备紧急停止
        </el-button>
      </div>

      <!-- 分隔线 -->
      <div class="control-divider"></div>

      <!-- 策略运行区域 -->
      <div class="policy-section">
        <div class="section-header">
          <el-icon class="section-icon">
            <Monitor />
          </el-icon>
          <span class="section-title">策略控制</span>
        </div>
        
        <div class="policy-controls">
          <div class="period-input-wrapper">
            <span class="input-label">扫描周期</span>
            <el-input-number 
              v-model="scanPeriod" 
              :min="100" 
              :max="10000" 
              :step="100"
              size="small"
              class="period-input"
            />
            <span class="input-unit">毫秒</span>
          </div>
          
          <div class="control-buttons">
            <el-button 
              type="primary" 
              size="small" 
              @click="startScan"
              :loading="scanLoading"
              :disabled="isScanning"
              :icon="VideoPlay"
              round
            >
              运行策略
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="stopScan"
              :loading="scanLoading"
              :disabled="!isScanning"
              :icon="VideoPause"
              round
            >
              停止运行
            </el-button>
          </div>
          
          <div class="status-indicator">
            <div v-if="isScanning" class="status-running">
              <span class="status-dot running"></span>
              <span class="status-text">运行中</span>
            </div>
            <div v-else class="status-stopped">
              <span class="status-dot stopped"></span>
              <span class="status-text">已停止</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 地图控件 -->
    <div class="map-controls">
      <el-dropdown trigger="click" @command="handleMapLayerCommand">
        <el-tag type="success" size="small" class="map-type-tag" title="点击选择地图图层类型">
          <el-icon>
            <Location />
          </el-icon>
          {{ currentLayerType }}
          <el-icon>
            <ArrowDown />
          </el-icon>
        </el-tag>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="satellite">
              <el-icon>
                <Location />
              </el-icon>
              卫星地图（定期更新）
            </el-dropdown-item>
            <el-dropdown-item command="traffic">
              <el-icon>
                <Grid />
              </el-icon>
              实时交通地图
            </el-dropdown-item>
            <el-dropdown-item command="hybrid">
              <el-icon>
                <Grid />
              </el-icon>
              混合图层（卫星+交通）
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-button-group class="control-group">
        <el-button size="small" @click="zoomIn">
          <el-icon>
            <ZoomIn />
          </el-icon>
        </el-button>
        <el-button size="small" @click="zoomOut">
          <el-icon>
            <ZoomOut />
          </el-icon>
        </el-button>
        <el-button size="small" @click="resetView">
          <el-icon>
            <Refresh />
          </el-icon>
        </el-button>
      </el-button-group>
    </div>

    <!-- 设备信息面板 -->
    <div v-if="selectedDevice" class="device-info-panel">
      <div class="panel-header">
        <h3>{{ selectedDevice.deviceName }}</h3>
        <el-button size="small" @click="closeDevicePanel">
          <el-icon>
            <Close />
          </el-icon>
        </el-button>
      </div>
      <div class="panel-content">
        <div class="device-details">
          <div class="detail-item">
            <span class="label">设备类型：</span>
            <span class="value">{{ selectedDevice.deviceType }}</span>
          </div>
          <div class="detail-item">
            <span class="label">所属农场：</span>
            <span class="value">{{ selectedDevice.farmName }}</span>
          </div>
          <div class="detail-item">
            <span class="label">设备区块：</span>
            <span class="value">{{ selectedDevice.blockName }}</span>
          </div>
          <div class="detail-item">
            <span class="label">坐标位置：</span>
            <span class="value">
              <span v-if="selectedDevice.longitude && selectedDevice.latitude">
                经度: {{ selectedDevice.longitude.toFixed(6) }}, 纬度: {{ selectedDevice.latitude.toFixed(6) }}
              </span>
              <span v-else>
                X: {{ selectedDevice.x }}, Y: {{ selectedDevice.y }}
              </span>
            </span>
          </div>
        </div>

        <!-- 运行时信息区域 -->
        <div v-if="(selectedDevice.runtime_info && selectedDevice.runtime_info.length > 0) || selectedDevice.is_online !== undefined" class="runtime-info-section"
          :class="{ loading: refreshingRuntimeInfo }">
          <div class="section-title">
            <el-icon>
              <Monitor />
            </el-icon>
            <span>运行时信息</span>
            <el-button size="small" type="primary" :icon="Refresh" @click="refreshRuntimeInfo"
              :loading="refreshingRuntimeInfo" circle />
          </div>
          <div class="runtime-info-list">
            <!-- 设备在线状态 -->
            <div v-if="selectedDevice.is_online !== undefined" class="runtime-info-item online-status-item">
              <div class="info-label">
                <el-icon class="status-icon" :class="{ 'online': selectedDevice.is_online, 'offline': !selectedDevice.is_online }">
                  <CircleCheck v-if="selectedDevice.is_online" />
                  <CircleClose v-else />
                </el-icon>
                设备在线状态：
              </div>
              <div class="info-value" :class="{ 'online': selectedDevice.is_online, 'offline': !selectedDevice.is_online }">
                {{ selectedDevice.is_online ? '在线' : '离线' }}
              </div>
            </div>
            <!-- 其他运行时信息 -->
            <div v-for="(info, index) in selectedDevice.runtime_info" :key="index" class="runtime-info-item">
              <div class="info-label">{{ info.title }}：</div>
              <div class="info-value">{{ info.text }}</div>
            </div>
          </div>
        </div>

        <div class="device-actions" v-if="hasAnyDeviceCapability(selectedDevice)">
          <div class="device-controls-container">
            <!-- 动态生成的设备操作按钮 -->
            <div v-for="buttonGroup in getDeviceButtonGroups(selectedDevice)" :key="buttonGroup.key"
              :class="buttonGroup.containerClass">
              <el-button v-for="buttonConfig in buttonGroup.buttons" :key="buttonConfig.key"
                :type="buttonConfig.buttonType" :size="buttonConfig.buttonSize" :class="buttonConfig.buttonClass"
                @click="handleDeviceAction(buttonConfig.action, selectedDevice.deviceName || selectedDevice.device_name)">
                <el-icon v-if="buttonConfig.icon" class="mr-1">
                  <VideoPlay v-if="buttonConfig.icon === 'VideoPlay'" />
                  <VideoPause v-else-if="buttonConfig.icon === 'VideoPause'" />
                  <Monitor v-else-if="buttonConfig.icon === 'Monitor'" />
                  <Close v-else-if="buttonConfig.icon === 'Close'" />
                </el-icon>
                {{ buttonConfig.buttonText }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>地图加载中...</p>
    </div>

    <!-- 紧急停止对话框 -->
    <el-dialog v-model="emergencyStopDialogVisible" title="紧急停止" width="600px" :close-on-click-modal="false"
      :close-on-press-escape="false">
      <div class="emergency-stop-content">
        <div class="emergency-warning">
          <el-icon size="24" color="#f56c6c">
            <Warning />
          </el-icon>
          <span>请选择需要执行急停的地块：</span>
        </div>

        <el-checkbox-group v-model="selectedBlocks" class="block-selection">
          <el-checkbox v-for="block in availableBlocks" :key="block.id" :label="block.id" class="block-checkbox">
            {{ block.name }}
          </el-checkbox>
        </el-checkbox-group>

        <div class="emergency-actions">
          <el-button @click="cancelEmergencyStop">取消</el-button>
          <el-button type="danger" @click="executeEmergencyStop" :loading="emergencyStopLoading">
            执行急停
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch, getCurrentInstance } from 'vue'
import { ElMessage } from 'element-plus'
import { ZoomIn, ZoomOut, Refresh, Close, Location, ArrowDown, Grid, Monitor, VideoPlay, VideoPause, Warning, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import call_remote from '../../../lib/call_remote.js'
import { mapConfig, getAMapScriptUrl, getDeviceIcon, convertXYToLngLat } from '../config/mapConfig.js'

// Props
const props = defineProps({
  devices: {
    type: Array,
    default: () => []
  },
  center: {
    type: Object,
    default: () => mapConfig.defaultCenter
  },
  zoom: {
    type: Number,
    default: mapConfig.defaultZoom
  }
})

// Emits
const emit = defineEmits(['device-click'])

// 响应式数据
const selectedDevice = ref(null)
const loading = ref(true)
const currentLayerType = ref('卫星地图')
const refreshingRuntimeInfo = ref(false)
const deviceStatuses = ref({}) // 跟踪设备状态

// 紧急停止相关数据
const emergencyStopDialogVisible = ref(false)
const selectedBlocks = ref([])
const availableBlocks = ref([])
const emergencyStopLoading = ref(false)

// 策略运行控制相关数据
const scanPeriod = ref(200) // 默认200ms
const scanLoading = ref(false)
const isScanning = ref(false)

let map = null
// 图层管理
let satelliteLayer = null
let trafficLayer = null
let markers = []
// 自动刷新定时器
let runtimeInfoTimer = null

// 地图初始化
const initMap = async () => {
  try {
    loading.value = true

    // 动态加载高德地图API
    if (!globalThis.AMap) {
      await loadAMapScript()
    }

    // 确保AMap已经加载完成
    if (!globalThis.AMap) {
      throw new Error('高德地图API加载失败')
    }

    // 创建地图实例（使用标准地图作为底图）
    const initialStyle = mapConfig.mapStyles.normal

    map = new AMap.Map('amap-container', {
      zoom: props.zoom,
      center: [props.center.lng, props.center.lat],
      mapStyle: initialStyle,
      viewMode: '2D', // 改为2D模式，可能更兼容
      pitch: 0,
      rotation: 0,
      features: ['bg', 'road', 'building', 'point'],
      showLabel: true,
      // 优化Canvas性能
      optimize: true,
      // 减少不必要的重绘
      renderOnMoving: false
    })

    // 确保地图样式正确应用
    setTimeout(() => {
      if (map) {
        // 默认初始化卫星地图
        setSatelliteLayer()
        // 强制刷新地图
        map.render()
      }
    }, 1000)

    // 添加地图控件
    if (mapConfig.controls.showScale) {
      map.addControl(new AMap.Scale())
    }
    if (mapConfig.controls.showToolbar) {
      map.addControl(new AMap.ToolBar())
    }

    // 监听地图事件
    map.on('click', onMapClick)

    // 等待地图完全加载
    map.on('complete', () => {
      loading.value = false
      // 初始化设备标记
      initDeviceMarkers()
    })

  } catch (error) {
    console.error('地图初始化失败:', error)
    loading.value = false
    ElMessage.error('地图加载失败，请检查网络连接')
  }
}

// 动态加载高德地图API
const loadAMapScript = () => {
  return new Promise((resolve, reject) => {
    if (globalThis.AMap) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = getAMapScriptUrl()
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

// 初始化设备标记
const initDeviceMarkers = () => {
  if (!map || !props.devices) {
    return
  }

  // 清除现有标记
  clearMarkers()

  for (const device of props.devices) {
    const marker = createDeviceMarker(device)
    if (marker) {
      markers.push(marker)
    }
  }
}

// 创建设备标记
const createDeviceMarker = (device) => {
  if (!globalThis.AMap) {
    return null
  }

  try {
    let lng, lat

    // 优先使用真实经纬度坐标
    if (device.longitude && device.latitude) {
      lng = device.longitude
      lat = device.latitude
    } else if (device.x && device.y) {
      // 如果没有真实坐标，使用xy坐标转换
      const converted = convertXYToLngLat(device.x, device.y, props.center.lng, props.center.lat)
      lng = converted.lng
      lat = converted.lat
    } else {
      return null
    }

    // 创建自定义标记
    const markerContent = createMarkerContent(device)

    const marker = new AMap.Marker({
      position: [lng, lat],
      content: markerContent,
      anchor: 'center',
      offset: new AMap.Pixel(0, 0)
    })

    // 添加点击事件
    marker.on('click', () => {
      // 为设备添加类型信息
      const deviceWithType = {
        ...device,
        type: getDeviceType(device)
      }
      onDeviceClick(deviceWithType)
    })

    // 添加到地图
    map.add(marker)

    return marker
  } catch (error) {
    console.error('创建设备标记失败:', error, device)
    return null
  }
}

// 获取设备类型代码 - 用于图标和动作集映射
const getDeviceType = (device) => {
  // 优先使用后端返回的设备类型代码
  if (device.device_type) {
    // 如果是虚拟设备，从设备名称判断具体类型
    if (device.device_type === '虚拟设备') {
      const deviceName = device.device_name || device.deviceName || ''
      if (deviceName.includes('流量计')) return 'flowmeter'
      if (deviceName.includes('阀门')) return 'valve'
      if (deviceName.includes('施肥机')) return 'fertilizer'
      if (deviceName.includes('传感器') || deviceName.includes('温度')) return 'sensor'
      return 'valve' // 默认类型
    }
    // 如果不是虚拟设备，直接返回具体类型
    return device.device_type
  }

  // 如果没有device_type，则从设备名称推断（向后兼容）
  const deviceName = device.device_name || device.deviceName || ''
  if (deviceName.includes('流量计')) return 'flowmeter'
  if (deviceName.includes('阀门')) return 'valve'
  if (deviceName.includes('施肥机')) return 'fertilizer'
  if (deviceName.includes('传感器') || deviceName.includes('温度')) return 'sensor'

  return 'valve' // 默认类型
}

// 检查设备是否具有任何能力
const hasAnyDeviceCapability = (device) => {
  if (!device) return false

  const allCapabilities = ['open', 'close', 'readout', 'shutdown']
  return allCapabilities.some(capability => hasDeviceCapability(device, capability))
}

// 检查设备是否具有特定能力
const hasDeviceCapability = (device, capability) => {
  if (!device) return false

  // 从设备的能力集数组中检查
  if (device.capability && Array.isArray(device.capability)) {
    return device.capability.includes(capability)
  }

  // 从原始设备数据中检查
  if (device.originalDevice && device.originalDevice.capability) {
    try {
      const capabilities = JSON.parse(device.originalDevice.capability)
      return Array.isArray(capabilities) && capabilities.includes(capability)
    } catch (error) {
      // 如果不是JSON格式，尝试按逗号分割
      const capabilities = device.originalDevice.capability.split(',').map(c => c.trim())
      return capabilities.includes(capability)
    }
  }

  return false
}

// 获取设备按钮分组（动态生成，开启和关闭按钮放在同一行）
const getDeviceButtonGroups = (device) => {
  if (!device) return []

  // 获取设备类型
  const deviceType = getDeviceType(device)

  // 获取设备能力集
  let capabilities = []
  if (device.capability) {
    if (Array.isArray(device.capability)) {
      capabilities = device.capability
    } else {
      try {
        capabilities = JSON.parse(device.capability)
      } catch (e) {
        capabilities = device.capability.split(',').map(c => c.trim())
      }
    }
  }

  // 使用全局函数获取按钮配置
  const buttonConfigs = getCurrentInstance().appContext.config.globalProperties.$getDeviceButtonConfig(capabilities, deviceType)

  // 将按钮分组：开启和关闭按钮放在同一行，其他按钮各自一行
  const groups = []

  // 检查是否有开启和关闭按钮
  const openButton = buttonConfigs.find(config => config.capability === 'open')
  const closeButton = buttonConfigs.find(config => config.capability === 'close')

  if (openButton && closeButton) {
    // 开启和关闭按钮放在同一行
    groups.push({
      key: 'open-close-group',
      containerClass: 'device-control-row',
      buttons: [openButton, closeButton]
    })
  } else {
    // 如果只有一个，单独显示
    if (openButton) {
      groups.push({
        key: 'open-group',
        containerClass: 'full-width-buttons-container',
        buttons: [openButton]
      })
    }
    if (closeButton) {
      groups.push({
        key: 'close-group',
        containerClass: 'full-width-buttons-container',
        buttons: [closeButton]
      })
    }
  }

  // 其他按钮各自一行
  const otherButtons = buttonConfigs.filter(config =>
    config.capability !== 'open' && config.capability !== 'close'
  )

  otherButtons.forEach(button => {
    groups.push({
      key: `${button.capability}-group`,
      containerClass: 'full-width-buttons-container',
      buttons: [button]
    })
  })

  return groups
}

// 处理设备操作
const handleDeviceAction = async (action, deviceName) => {
  try {
    switch (action) {
      case 'openDevice':
        await openDevice(deviceName)
        break
      case 'closeDevice':
        await closeDevice(deviceName)
        break
      case 'readDeviceStatus':
        await readDeviceStatus(deviceName)
        break
      case 'shutdownDevice':
        await shutdownDevice(deviceName)
        break
      default:
        console.warn('未知的设备操作:', action)
    }
  } catch (error) {
    console.error('设备操作失败:', error)
    ElMessage.error(`设备操作失败: ${error.message || error}`)
  }
}

// 获取设备状态
const getDeviceStatus = (device) => {
  if (!device) return false
  const deviceName = device.deviceName || device.device_name
  return deviceStatuses.value[deviceName] || false
}

// 设置设备状态
const setDeviceStatus = (deviceName, status) => {
  deviceStatuses.value[deviceName] = status
}

// 创建标记内容
const createMarkerContent = (device) => {
  const deviceType = getDeviceType(device)
  const iconName = getDeviceIcon(deviceType)
  const deviceName = device.label || device.device_name || device.deviceName
  
  // 根据在线状态设置颜色
  let statusClass = 'offline' // 默认离线状态
  if (device.is_online === true) {
    statusClass = 'online'
  } else if (device.is_online === false) {
    statusClass = 'offline'
  } else {
    // 如果没有在线状态信息，使用原来的开关状态
    const isOpen = getDeviceStatus(device)
    statusClass = isOpen ? 'active' : 'inactive'
  }

  return `
    <div class="device-marker ${deviceType} ${statusClass}">
      <div class="marker-icon">
        <img src="/deviceIcon/${iconName}.png" alt="${deviceName}" />
      </div>
      <div class="marker-info">
        <div class="device-name">${deviceName}</div>
      </div>
    </div>
  `
}


// 设备点击事件
const onDeviceClick = (device) => {
  selectedDevice.value = device
  emit('device-click', device)


  // 启动自动刷新定时器
  startRuntimeInfoAutoRefresh()
}

// 地图点击事件
const onMapClick = (e) => {
  // 点击地图空白区域时关闭设备面板
  if (selectedDevice.value) {
    closeDevicePanel()
  }
}

// 图层切换处理
const handleMapLayerCommand = (command) => {
  switch (command) {
    case 'satellite':
      setSatelliteLayer()
      break
    case 'traffic':
      setTrafficLayer()
      break
    case 'hybrid':
      setHybridLayer()
      break
  }
}

// 设置卫星图层
const setSatelliteLayer = () => {
  if (!map) return

  currentLayerType.value = '卫星地图'

  try {
    // 清除所有图层
    clearAllLayers()

    // 创建卫星图层
    satelliteLayer = new AMap.TileLayer.Satellite({
      zIndex: 1
    })

    // 添加卫星图层
    map.add(satelliteLayer)

    // 设置底图样式
    map.setMapStyle(mapConfig.mapStyles.normal)

    ElMessage.success('已切换到卫星地图')

  } catch (error) {
    console.error('设置卫星图层失败:', error)
    ElMessage.error('卫星地图设置失败')
  }
}

// 设置实时交通图层
const setTrafficLayer = () => {
  if (!map) return

  currentLayerType.value = '实时交通'

  try {
    // 清除所有图层
    clearAllLayers()

    // 创建交通图层
    trafficLayer = new AMap.TileLayer.Traffic({
      zIndex: 1,
      autoRefresh: true,
      interval: 180
    })

    // 添加交通图层
    map.add(trafficLayer)

    // 设置底图样式
    map.setMapStyle(mapConfig.mapStyles.normal)

    ElMessage.success('已切换到实时交通地图')

  } catch (error) {
    console.error('设置交通图层失败:', error)
    ElMessage.error('交通地图设置失败')
  }
}

// 设置混合图层（卫星+交通）
const setHybridLayer = () => {
  if (!map) return

  currentLayerType.value = '混合图层'

  try {
    // 清除所有图层
    clearAllLayers()

    // 创建卫星图层
    satelliteLayer = new AMap.TileLayer.Satellite({
      zIndex: 1
    })

    // 创建交通图层
    trafficLayer = new AMap.TileLayer.Traffic({
      zIndex: 2,
      autoRefresh: true,
      interval: 180
    })

    // 添加图层
    map.add(satelliteLayer)
    map.add(trafficLayer)

    // 设置底图样式
    map.setMapStyle(mapConfig.mapStyles.normal)

    ElMessage.success('已切换到混合图层（卫星+交通）')

  } catch (error) {
    console.error('设置混合图层失败:', error)
    ElMessage.error('混合图层设置失败')
  }
}

// 清除所有图层
const clearAllLayers = () => {
  if (satelliteLayer) {
    map.remove(satelliteLayer)
    satelliteLayer = null
  }
  if (trafficLayer) {
    map.remove(trafficLayer)
    trafficLayer = null
  }
}

// 地图缩放
const zoomIn = () => {
  if (map) {
    map.zoomIn()
  }
}

const zoomOut = () => {
  if (map) {
    map.zoomOut()
  }
}

// 重置视图
const resetView = () => {
  if (map) {
    map.setCenter([props.center.lng, props.center.lat])
    map.setZoom(props.zoom)
  }
}

// 清除标记
const clearMarkers = () => {
  for (const marker of markers) {
    map.remove(marker)
  }
  markers = []
}

// 关闭设备面板
const closeDevicePanel = () => {
  // 停止自动刷新定时器
  stopRuntimeInfoAutoRefresh()
  selectedDevice.value = null
}




const readDeviceStatus = async (deviceName) => {
  try {
    const response = await call_remote('/device_management/readout_device', { device_name: deviceName })
    ElMessage.success(`设备状态: ${response.readout || '未知'}`)
    return response.readout
  } catch (error) {
    console.error('读取设备状态失败:', error)
    ElMessage.error('读取设备状态失败')
    return null
  }
}

// 设备切换函数
const toggleDevice = async (device) => {
  try {
    const deviceName = device.deviceName || device.device_name
    const currentStatus = getDeviceStatus(device)

    if (currentStatus) {
      // 当前是开启状态，执行关闭操作
      await closeDevice(deviceName)
      setDeviceStatus(deviceName, false)
      ElMessage.success(`设备 ${deviceName} 已关闭`)
    } else {
      // 当前是关闭状态，执行开启操作
      await openDevice(deviceName)
      setDeviceStatus(deviceName, true)
      ElMessage.success(`设备 ${deviceName} 已开启`)
    }

    // 重新渲染设备标记以更新颜色
    initDeviceMarkers()
  } catch (error) {
    console.error('设备切换失败:', error)
    ElMessage.error(`设备切换失败: ${error.message || error}`)
  }
}

// 打开设备
const openDevice = async (deviceName) => {
  try {
    const response = await call_remote('/device_management/open_device', { device_name: deviceName })
    if (response.result) {
      setDeviceStatus(deviceName, true)
      ElMessage.success(`设备 ${deviceName} 已开启`)
      // 重新渲染设备标记以更新状态
      initDeviceMarkers()
    }
  } catch (error) {
    console.error('打开设备失败:', error)
    ElMessage.error(`打开设备失败: ${error.message || error}`)
    throw error
  }
}

// 关闭设备
const closeDevice = async (deviceName) => {
  try {
    const response = await call_remote('/device_management/close_device', { device_name: deviceName })
    if (response.result) {
      setDeviceStatus(deviceName, false)
      ElMessage.success(`设备 ${deviceName} 已关闭`)
      // 重新渲染设备标记以更新状态
      initDeviceMarkers()
    }
  } catch (error) {
    console.error('关闭设备失败:', error)
    ElMessage.error(`关闭设备失败: ${error.message || error}`)
    throw error
  }
}

// 关机设备
const shutdownDevice = async (deviceName) => {
  try {
    const response = await call_remote('/device_management/shutdown_device', { device_name: deviceName })
    if (response.result) {
      ElMessage.success(`设备 ${deviceName} 关机成功`)
    }
  } catch (error) {
    console.error('设备关机失败:', error)
    ElMessage.error(`设备关机失败: ${error.message || error}`)
  }
}



// 刷新运行时信息
const refreshRuntimeInfo = async () => {
  if (!selectedDevice.value) return

  try {
    refreshingRuntimeInfo.value = true

    // 获取最新的设备列表，包含运行时信息
    const response = await call_remote('/device_management/list_device', {
      pageNo: 0,
      farm_name: selectedDevice.value.farmName,
      block_name: selectedDevice.value.blockName
    })

    if (response.devices && response.devices.length > 0) {
      // 找到当前选中的设备
      const currentDevice = response.devices.find(device =>
        device.device_name === (selectedDevice.value.device_name || selectedDevice.value.deviceName)
      )

      if (currentDevice) {
        // 更新运行时信息
        if (currentDevice.runtime_info) {
          selectedDevice.value.runtime_info = currentDevice.runtime_info
        }
        // 更新在线状态
        if (currentDevice.is_online !== undefined) {
          selectedDevice.value.is_online = currentDevice.is_online
        }
        ElMessage.success('运行时信息已更新')
      }
    }
  } catch (error) {
    console.error('刷新运行时信息失败:', error)
    ElMessage.error('刷新运行时信息失败')
  } finally {
    refreshingRuntimeInfo.value = false
  }
}

// 启动自动刷新定时器
const startRuntimeInfoAutoRefresh = () => {
  // 清除现有定时器
  if (runtimeInfoTimer) {
    clearInterval(runtimeInfoTimer)
  }

  // 每30秒自动刷新一次运行时信息
  runtimeInfoTimer = setInterval(() => {
    if (selectedDevice.value && selectedDevice.value.runtime_info) {
      refreshRuntimeInfo()
    }
  }, 30000) // 30秒
}

// 停止自动刷新定时器
const stopRuntimeInfoAutoRefresh = () => {
  if (runtimeInfoTimer) {
    clearInterval(runtimeInfoTimer)
    runtimeInfoTimer = null
  }
}

// 紧急停止相关方法
const showEmergencyStopDialog = async () => {
  try {
    // 获取可用地块列表
    await loadAvailableBlocks()
    emergencyStopDialogVisible.value = true
    selectedBlocks.value = []
  } catch (error) {
    console.error('加载地块列表失败:', error)
    ElMessage.error('加载地块列表失败')
  }
}

const loadAvailableBlocks = async () => {
  try {
    // 从设备数据中提取地块信息
    const blockSet = new Set()
    props.devices.forEach(device => {
      if (device.blockName || device.block_name) {
        blockSet.add(device.blockName || device.block_name)
      }
    })

    availableBlocks.value = Array.from(blockSet).map(blockName => ({
      id: blockName,
      name: blockName
    }))
  } catch (error) {
    console.error('加载地块列表失败:', error)
    availableBlocks.value = []
  }
}

const cancelEmergencyStop = () => {
  emergencyStopDialogVisible.value = false
  selectedBlocks.value = []
}

const executeEmergencyStop = async () => {
  if (selectedBlocks.value.length === 0) {
    ElMessage.warning('请选择至少一个地块')
    return
  }

  emergencyStopLoading.value = true
  try {
    // 获取当前农场名称
    const currentFarm = props.devices.length > 0 ? (props.devices[0].farmName || props.devices[0].farm_name) : '默认农场'

    // 执行急停操作
    const response = await call_remote('/device_management/emergency_stop', {
      farm_name: currentFarm,
      block_names: selectedBlocks.value
    })

    if (response.result) {
      const stoppedCount = response.stopped_devices ? response.stopped_devices.length : 0
      const failedCount = response.failed_devices ? response.failed_devices.length : 0

      if (failedCount === 0) {
        ElMessage.success(`急停操作执行成功，共急停 ${stoppedCount} 个设备`)
      } else {
        ElMessage.warning(`急停操作部分成功：成功 ${stoppedCount} 个，失败 ${failedCount} 个设备`)
      }

      emergencyStopDialogVisible.value = false
      selectedBlocks.value = []

      // 刷新设备状态
      emit('device-click', null) // 触发父组件刷新
    } else {
      ElMessage.error('急停操作执行失败')
    }
  } catch (error) {
    console.error('急停操作失败:', error)
    ElMessage.error(`急停操作失败: ${error.message || error}`)
  } finally {
    emergencyStopLoading.value = false
  }
}

// 策略运行控制方法
const startScan = async () => {
  try {
    scanLoading.value = true
    const result = await call_remote('/policy/set_scan_period', { 
      period_ms: scanPeriod.value 
    })
    
    if (result.result) {
      ElMessage.success(`策略开始运行，扫描周期: ${scanPeriod.value}ms`)
      isScanning.value = true
    }
  } catch (error) {
    console.error('启动策略扫描失败:', error)
    ElMessage.error('启动策略扫描失败')
  } finally {
    scanLoading.value = false
  }
}

const stopScan = async () => {
  try {
    scanLoading.value = true
    const result = await call_remote('/policy/set_scan_period', { 
      period_ms: 0 
    })
    
    if (result.result) {
      ElMessage.success('策略已停止运行')
      isScanning.value = false
    }
  } catch (error) {
    console.error('停止策略扫描失败:', error)
    ElMessage.error('停止策略扫描失败')
  } finally {
    scanLoading.value = false
  }
}

const checkScanStatus = async () => {
  try {
    const result = await call_remote('/policy/get_scan_period', {})
    if (result.period_ms && result.period_ms > 0) {
      isScanning.value = true
      scanPeriod.value = result.period_ms
    } else {
      isScanning.value = false
    }
  } catch (error) {
    console.error('获取扫描状态失败:', error)
  }
}

// 监听设备数据变化
watch(() => props.devices, () => {
  if (map && !loading.value) {
    initDeviceMarkers()
  }
}, { deep: true })

// 监听地图中心点变化
watch(() => props.center, (newCenter) => {
  if (map && newCenter) {
    map.setCenter([newCenter.lng, newCenter.lat])
  }
}, { deep: true })

// 组件挂载
onMounted(() => {
  nextTick(() => {
    initMap()
  })
  // 检查策略扫描状态
  checkScanStatus()
})

// 组件卸载
onUnmounted(() => {
  // 停止自动刷新定时器
  stopRuntimeInfoAutoRefresh()

  if (map) {
    // 清除所有图层
    clearAllLayers()

    // 清除所有标记
    for (const marker of markers) {
      if (marker) {
        map.remove(marker)
      }
    }
    markers = []

    // 销毁地图实例
    map.destroy()
    map = null
  }
})
</script>

<style scoped>
.interactive-map-container {
  position: relative;
  width: 100%;
  height: 718px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.amap-container {
  width: 100%;
  height: 718px;
}

/* 统一控制面板样式 */
.unified-control-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
  display: flex;
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  overflow: hidden;
  min-width: 800px;
  max-width: 1000px;
}

.unified-control-panel:hover {
  border-color: rgba(64, 158, 255, 0.3);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

/* 紧急停止区域 */
.emergency-section {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 200px;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.section-icon {
  font-size: 16px;
  color: #f56c6c;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  letter-spacing: 0.5px;
}

.emergency-stop-btn {
  background: linear-gradient(135deg, #ff4757, #ff3742);
  border: none;
  box-shadow: 0 4px 12px rgba(255, 71, 87, 0.3);
  transition: all 0.3s ease;
  font-weight: 600;
  letter-spacing: 0.5px;
  padding: 0 24px;
  font-size: 14px;
  height: 44px;
  border-radius: 8px;
}

.emergency-stop-btn:hover {
  background: linear-gradient(135deg, #ff3742, #ff2f3a);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(255, 71, 87, 0.4);
}

/* 分隔线 */
.control-divider {
  width: 1px;
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.1), transparent);
  margin: 16px 0;
}

/* 策略运行区域 */
.policy-section {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.policy-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.period-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  height: 44px;
  backdrop-filter: blur(5px);
}

.input-label {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  white-space: nowrap;
}

.period-input {
  width: 90px;
}

.period-input :deep(.el-input__wrapper) {
  height: 32px;
  border-radius: 6px;
}

.input-unit {
  font-size: 11px;
  color: #909399;
  font-weight: 500;
}

.control-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

.control-buttons .el-button {
  height: 44px;
  padding: 0 18px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
}

.status-indicator {
  margin-left: auto;
}

.status-running,
.status-stopped {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 18px;
  font-size: 13px;
  font-weight: 600;
  height: 44px;
  backdrop-filter: blur(5px);
}

.status-running {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.15), rgba(103, 194, 58, 0.08));
  color: #67c23a;
  border: 1px solid rgba(103, 194, 58, 0.3);
}

.status-stopped {
  background: linear-gradient(135deg, rgba(144, 147, 153, 0.15), rgba(144, 147, 153, 0.08));
  color: #909399;
  border: 1px solid rgba(144, 147, 153, 0.3);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  position: relative;
}

.status-dot.running {
  background: #67c23a;
  animation: pulse-running 2s infinite;
  box-shadow: 0 0 6px rgba(103, 194, 58, 0.6);
}

.status-dot.stopped {
  background: #909399;
}

@keyframes pulse-running {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

.status-text {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.emergency-stop-btn:hover {
  background: linear-gradient(135deg, #ff3742, #ff2f3a);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 71, 87, 0.4);
}

.emergency-stop-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(255, 71, 87, 0.3);
}

/* 地图控件样式 */
.map-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.map-type-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-group {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 设备信息面板 */
.device-info-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 280px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  z-index: 1000;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.panel-content {
  padding: 20px;
}

.device-details {
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.detail-item .label {
  font-weight: 500;
  color: #666;
}

.detail-item .value {
  color: #333;
}

.device-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.device-controls-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.device-control-row {
  display: flex;
  gap: 8px;
  width: 100%;
}

.full-width-buttons-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.half-width-button {
  flex: 1;
  width: calc(50% - 4px);
  margin: 0;
  padding: 0;
}

.full-width-button {
  width: 100% !important;
  box-sizing: border-box;
  margin: 0 !important;
  padding: 0;
}

/* 强制Element Plus按钮对齐 */
:deep(.full-width-button) {
  width: 100% !important;
  margin: 0 !important;
  box-sizing: border-box !important;
}

:deep(.half-width-button) {
  flex: 1 !important;
  margin: 0 !important;
  box-sizing: border-box !important;
}

/* 运行时信息样式 */
.runtime-info-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.runtime-info-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.runtime-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.08) 0%, rgba(64, 158, 255, 0.03) 100%);
  border-radius: 8px;
  border-left: 4px solid #409eff;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.runtime-info-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #409eff, #67c23a);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.runtime-info-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.runtime-info-item:hover::before {
  opacity: 1;
}

.info-label {
  font-weight: 500;
  color: #666;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-label::before {
  content: '●';
  color: #409eff;
  font-size: 8px;
}

.info-value {
  font-weight: 600;
  color: #333;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(64, 158, 255, 0.2);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.info-value:hover {
  background: rgba(64, 158, 255, 0.1);
  border-color: #409eff;
}

/* 在线状态特殊样式 */
.online-status-item {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.08) 0%, rgba(103, 194, 58, 0.03) 100%) !important;
  border-left: 4px solid #67c23a !important;
}

.online-status-item .status-icon {
  font-size: 14px;
  margin-right: 6px;
}

.online-status-item .status-icon.online {
  color: #67c23a;
}

.online-status-item .status-icon.offline {
  color: #f56c6c;
}

.online-status-item .info-value.online {
  background: rgba(103, 194, 58, 0.1) !important;
  border-color: #67c23a !important;
  color: #67c23a !important;
  font-weight: 700;
}

.online-status-item .info-value.offline {
  background: rgba(245, 108, 108, 0.1) !important;
  border-color: #f56c6c !important;
  color: #f56c6c !important;
  font-weight: 700;
}

.online-status-item .info-value.online:hover {
  background: rgba(103, 194, 58, 0.2) !important;
  border-color: #67c23a !important;
}

.online-status-item .info-value.offline:hover {
  background: rgba(245, 108, 108, 0.2) !important;
  border-color: #f56c6c !important;
}

/* 运行时信息加载状态 */
.runtime-info-section.loading .runtime-info-item {
  opacity: 0.6;
  pointer-events: none;
}

.runtime-info-section.loading .info-value {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading-shimmer 1.5s infinite;
}

@keyframes loading-shimmer {
  0% {
    background-position: -200% 0;
  }

  100% {
    background-position: 200% 0;
  }
}

/* 加载状态 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.loading-overlay p {
  margin-top: 10px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* 新的设备标记样式 */
:deep(.device-marker) {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 25px;
  padding: 8px 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 2px solid #e0e0e0;
  backdrop-filter: blur(10px);
  min-width: 120px;
}

:deep(.device-marker:hover) {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  border-color: #409eff;
}

:deep(.marker-icon) {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  flex-shrink: 0;
  background: #f8f9fa;
  border: 2px solid #dee2e6;
}

:deep(.marker-icon img) {
  width: 28px;
  height: 28px;
  object-fit: contain;
  border-radius: 50%;
}

:deep(.marker-info) {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

:deep(.device-name) {
  font-size: 12px;
  font-weight: 600;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}


/* 设备类型颜色 */
:deep(.device-marker.valve .marker-icon) {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.1);
}

:deep(.device-marker.flowmeter .marker-icon) {
  border-color: #e6a23c;
  background: rgba(230, 162, 60, 0.1);
}

:deep(.device-marker.fertilizer .marker-icon) {
  border-color: #9c27b0;
  background: rgba(156, 39, 176, 0.1);
}

:deep(.device-marker.sensor .marker-icon) {
  border-color: #67c23a;
  background: rgba(103, 194, 58, 0.1);
}

/* 设备状态颜色 */
:deep(.device-marker.active) {
  border-color: #67c23a !important;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
}

:deep(.device-marker.active .marker-icon) {
  border-color: #67c23a !important;
  background: rgba(103, 194, 58, 0.2) !important;
  animation: pulse-green 2s infinite;
}

:deep(.device-marker.inactive) {
  border-color: #f56c6c !important;
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);
}

:deep(.device-marker.inactive .marker-icon) {
  border-color: #f56c6c !important;
  background: rgba(245, 108, 108, 0.2) !important;
}

/* 在线/离线状态颜色 */
:deep(.device-marker.online) {
  border-color: #67c23a !important;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
}

:deep(.device-marker.online .marker-icon) {
  border-color: #67c23a !important;
  background: rgba(103, 194, 58, 0.2) !important;
  animation: pulse-green 2s infinite;
}

:deep(.device-marker.offline) {
  border-color: #f56c6c !important;
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);
}

:deep(.device-marker.offline .marker-icon) {
  border-color: #f56c6c !important;
  background: rgba(245, 108, 108, 0.2) !important;
}

/* 绿色脉冲动画 */
@keyframes pulse-green {
  0% {
    box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.4);
  }

  70% {
    box-shadow: 0 0 0 6px rgba(103, 194, 58, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(103, 194, 58, 0);
  }
}


/* 紧急停止对话框样式 */
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

/* 响应式设计 */
@media (max-width: 768px) {
  .map-controls {
    top: 10px;
    right: 10px;
  }

  .emergency-stop-control {
    top: 10px;
    left: 10px;
  }

  .device-info-panel {
    top: 10px;
    left: 10px;
    width: calc(100% - 20px);
    max-width: 300px;
  }

  .control-group {
    flex-direction: column;
  }

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
