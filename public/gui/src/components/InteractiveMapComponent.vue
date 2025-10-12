<template>
  <div class="interactive-map-container">
    <!-- 地图容器 -->
    <div id="amap-container" class="amap-container"></div>
    
    <!-- 地图控件 -->
    <div class="map-controls">
      <el-dropdown trigger="click" @command="handleMapLayerCommand">
        <el-tag type="success" size="small" class="map-type-tag" title="点击选择地图图层类型">
          <el-icon><Location /></el-icon>
          {{ currentLayerType }}
          <el-icon><ArrowDown /></el-icon>
        </el-tag>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="satellite">
              <el-icon><Location /></el-icon>
              卫星地图（定期更新）
            </el-dropdown-item>
            <el-dropdown-item command="traffic">
              <el-icon><Grid /></el-icon>
              实时交通地图
            </el-dropdown-item>
            <el-dropdown-item command="hybrid">
              <el-icon><Grid /></el-icon>
              混合图层（卫星+交通）
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      
      <el-button-group class="control-group">
        <el-button size="small" @click="zoomIn">
          <el-icon><ZoomIn /></el-icon>
        </el-button>
        <el-button size="small" @click="zoomOut">
          <el-icon><ZoomOut /></el-icon>
        </el-button>
        <el-button size="small" @click="resetView">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </el-button-group>
    </div>
    
    <!-- 设备信息面板 -->
    <div v-if="selectedDevice" class="device-info-panel">
      <div class="panel-header">
        <h3>{{ selectedDevice.deviceName }}</h3>
        <el-button size="small" @click="closeDevicePanel">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      <div class="panel-content">
        <div class="device-details">
          <div class="detail-item">
            <span class="label">设备类型：</span>
            <span class="value">{{ selectedDevice.deviceType }}</span>
          </div>
          <div class="detail-item">
            <span class="label">设备状态：</span>
            <el-tag :type="selectedDevice.status === 'open' || selectedDevice.status === 'active' ? 'success' : 'danger'" size="small">
              {{ selectedDevice.status === 'open' || selectedDevice.status === 'active' ? '开启' : '关闭' }}
            </el-tag>
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
        
        <div class="device-actions" v-if="selectedDevice.type === 'valve' || selectedDevice.type === 'fertilizer' || getDeviceTypeFromName(selectedDevice.device_name || selectedDevice.deviceName) === 'valve' || getDeviceTypeFromName(selectedDevice.device_name || selectedDevice.deviceName) === 'fertilizer'">
          <el-button 
            :type="selectedDevice.status === 'open' || selectedDevice.status === 'active' ? 'danger' : 'success'"
            size="small"
            @click="toggleDevice(selectedDevice)"
          >
            {{ selectedDevice.status === 'open' || selectedDevice.status === 'active' ? '关闭设备' : '开启设备' }}
          </el-button>
          <el-button type="primary" size="small" @click="readDeviceStatus(selectedDevice.deviceName)">
            读取状态
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>地图加载中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ZoomIn, ZoomOut, Refresh, Close, Location, ArrowDown, Grid } from '@element-plus/icons-vue'
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
const emit = defineEmits(['device-click', 'device-toggle'])

// 响应式数据
const selectedDevice = ref(null)
const loading = ref(true)
const currentLayerType = ref('卫星地图')
let map = null
// 图层管理
let satelliteLayer = null
let trafficLayer = null
let markers = []

// 地图初始化
const initMap = async () => {
  try {
    loading.value = true
    console.log('开始初始化地图...')
    
    // 动态加载高德地图API
    if (globalThis.AMap) {
      console.log('高德地图API已存在')
    } else {
      console.log('加载高德地图API...')
      await loadAMapScript()
      console.log('高德地图API加载完成')
    }
    
    console.log('创建地图实例，中心点:', props.center, '缩放级别:', props.zoom)
    
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
      showLabel: true
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
    console.log('地图或设备数据未准备好:', { map: !!map, devices: props.devices?.length })
    return
  }
  
  console.log('开始初始化设备标记，设备数量:', props.devices.length)
  
  // 清除现有标记
  clearMarkers()
  
  let index = 0
  for (const device of props.devices) {
    console.log(`创建设备标记 ${index + 1}:`, device)
    const marker = createDeviceMarker(device)
    if (marker) {
      markers.push(marker)
      console.log(`设备标记 ${index + 1} 创建成功`)
    } else {
      console.log(`设备标记 ${index + 1} 创建失败`)
    }
    index++
  }
  
  console.log('设备标记初始化完成，总标记数:', markers.length)
}

// 创建设备标记
const createDeviceMarker = (device) => {
  if (globalThis.AMap) {
    // 高德地图API已加载，继续执行
  } else {
    console.log('高德地图API未加载')
    return null
  }
  
  try {
    let lng, lat
    
    // 优先使用真实经纬度坐标
    if (device.longitude && device.latitude) {
      lng = device.longitude
      lat = device.latitude
      console.log(`设备 ${device.deviceName || device.device_name} 使用真实坐标:`, { lng, lat })
    } else if (device.x && device.y) {
      // 如果没有真实坐标，使用xy坐标转换
      const converted = convertXYToLngLat(device.x, device.y, props.center.lng, props.center.lat)
      lng = converted.lng
      lat = converted.lat
      console.log(`设备 ${device.deviceName || device.device_name} 坐标转换:`, { 
        original: { x: device.x, y: device.y }, 
        converted: { lng, lat } 
      })
    } else {
      console.log('设备坐标数据不完整:', device)
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
        type: getDeviceTypeFromName(device.device_name || device.deviceName)
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

// 根据设备名称推断设备类型
const getDeviceTypeFromName = (deviceName) => {
  if (deviceName.includes('流量计')) return 'flowmeter'
  if (deviceName.includes('阀门')) return 'valve'
  if (deviceName.includes('施肥机')) return 'fertilizer'
  return 'valve' // 默认类型
}

// 创建标记内容
const createMarkerContent = (device) => {
  const statusClass = device.status === 'open' || device.status === 'active' ? 'active' : 'inactive'
  const deviceType = getDeviceTypeFromName(device.device_name || device.deviceName)
  const iconName = getDeviceIcon(deviceType)
  const deviceName = device.label || device.device_name || device.deviceName
  const statusText = getStatusText(device.status)
  
  return `
    <div class="device-marker ${deviceType} ${statusClass}">
      <div class="marker-icon">
        <img src="/deviceIcon/${iconName}.png" alt="${deviceName}" />
      </div>
      <div class="marker-info">
        <div class="device-name">${deviceName}</div>
        <div class="device-status">${statusText}</div>
      </div>
    </div>
  `
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'open': '开',
    'closed': '关',
    'active': '运行',
    'inactive': '停止'
  }
  return statusMap[status] || status
}

// 设备点击事件
const onDeviceClick = (device) => {
  selectedDevice.value = device
  emit('device-click', device)
}

// 地图点击事件
const onMapClick = (e) => {
  // 点击地图空白区域时关闭设备面板
  if (selectedDevice.value) {
    selectedDevice.value = null
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
  
  console.log('切换到卫星图层')
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
    
    console.log('卫星图层已设置')
    ElMessage.success('已切换到卫星地图')
    
  } catch (error) {
    console.error('设置卫星图层失败:', error)
    ElMessage.error('卫星地图设置失败')
  }
}

// 设置实时交通图层
const setTrafficLayer = () => {
  if (!map) return
  
  console.log('切换到实时交通图层')
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
    
    console.log('交通图层已设置')
    ElMessage.success('已切换到实时交通地图')
    
  } catch (error) {
    console.error('设置交通图层失败:', error)
    ElMessage.error('交通地图设置失败')
  }
}

// 设置混合图层（卫星+交通）
const setHybridLayer = () => {
  if (!map) return
  
  console.log('切换到混合图层')
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
    
    console.log('混合图层已设置')
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
  selectedDevice.value = null
}

// 设备控制方法
const toggleDevice = async (device) => {
  try {
    const deviceName = device.device_name || device.deviceName
    const deviceType = device.type || getDeviceTypeFromName(deviceName)
    
    if (device.status === 'open' || device.status === 'active') {
      await closeDevice(deviceName)
      device.status = deviceType === 'fertilizer' ? 'inactive' : 'closed'
    } else {
      await openDevice(deviceName)
      device.status = deviceType === 'fertilizer' ? 'active' : 'open'
    }
    
    // 更新地图上的标记
    initDeviceMarkers()
    emit('device-toggle', device)
    ElMessage.success('设备操作成功')
  } catch (error) {
    ElMessage.error('设备操作失败: ' + error.message)
  }
}

const openDevice = async (deviceName) => {
  try {
    const response = await call_remote('/device_management/open_device', { device_name: deviceName })
    if (response.result) {
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
    ElMessage.success(`设备状态: ${response.readout || '未知'}`)
    return response.readout
  } catch (error) {
    console.error('读取设备状态失败:', error)
    ElMessage.error('读取设备状态失败')
    return null
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
    console.log('地图中心点变化:', newCenter)
    map.setCenter([newCenter.lng, newCenter.lat])
  }
}, { deep: true })

// 组件挂载
onMounted(() => {
  nextTick(() => {
    initMap()
  })
})

// 组件卸载
onUnmounted(() => {
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
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.amap-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
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
  width: 320px;
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
  gap: 10px;
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

:deep(.device-status) {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 10px;
  text-align: center;
  white-space: nowrap;
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

/* 设备状态颜色 */
:deep(.device-marker.active .device-status) {
  background: #67c23a;
  color: white;
}

:deep(.device-marker.active .marker-icon) {
  border-color: #67c23a;
  background: rgba(103, 194, 58, 0.1);
  animation: pulse-active 2s infinite;
}

:deep(.device-marker.inactive .device-status) {
  background: #f56c6c;
  color: white;
}

:deep(.device-marker.inactive .marker-icon) {
  border-color: #f56c6c;
  background: rgba(245, 108, 108, 0.1);
}

/* 活跃设备脉冲动画 */
@keyframes pulse-active {
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

/* 响应式设计 */
@media (max-width: 768px) {
  .map-controls {
    top: 10px;
    right: 10px;
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
}
</style>
