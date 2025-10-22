import call_remote from '../../../lib/call_remote.js'

// 地图配置文件
export const mapConfig = {
  // 高德地图API配置
  amap: {
    // 使用提供的API密钥
    key: '1cf464a131ce91dfd0e56d28bd80d786',
    version: '2.0',
    plugins: ['AMap.Scale', 'AMap.ToolBar', 'AMap.Geocoder', 'AMap.PlaceSearch']
  },
  
  // 默认地图中心点（呼和浩特市）- 默认值，实际会从后端获取
  defaultCenter: {
    lng: 111.670801, // 呼和浩特市经度
    lat: 40.818311   // 呼和浩特市纬度
  },
  
  defaultZoom: 15,
  
  // 地图样式配置（只保留卫星地图需要的样式）
  mapStyles: {
    normal: 'amap://styles/normal'  // 作为卫星图层的底图
  },
  
  // 设备标记配置
  deviceMarkers: {
    // 标记大小
    size: {
      width: 36,
      height: 36
    },
    
    // 设备类型图标映射
    iconMap: {
      'valve': '电磁阀',
      'flowmeter': '流量计', 
      'fertilizer': '施肥机',
      'sensor': '流量计',  // 传感器使用流量计图标
      'pump': '电磁阀',    // 泵使用电磁阀图标
      'temperature': '流量计',  // 温度传感器使用流量计图标
      'humidity': '流量计',     // 湿度传感器使用流量计图标
      'pressure': '流量计'      // 压力传感器使用流量计图标
    },
    
    // 设备状态颜色
    statusColors: {
      'open': '#67c23a',
      'closed': '#f56c6c',
      'active': '#67c23a',
      'inactive': '#f56c6c'
    },
    
    // 设备类型颜色
    typeColors: {
      'valve': '#409eff',      // 阀门 - 蓝色
      'flowmeter': '#e6a23c', // 流量计 - 橙色
      'fertilizer': '#9c27b0', // 施肥机 - 紫色
      'sensor': '#67c23a',     // 传感器 - 绿色
      'pump': '#409eff',       // 泵 - 蓝色（与阀门相同）
      'temperature': '#ff6b6b', // 温度传感器 - 红色
      'humidity': '#4ecdc4',    // 湿度传感器 - 青色
      'pressure': '#feca57'     // 压力传感器 - 黄色
    }
  },
  
  // 地图控件配置
  controls: {
    // 是否显示比例尺
    showScale: true,
    // 是否显示工具栏
    showToolbar: true,
    // 是否显示定位按钮
    showLocation: false,
    // 是否显示图层切换
    showLayerSwitch: true
  }
}

// 获取高德地图API脚本URL
export const getAMapScriptUrl = () => {
  const { key, version, plugins } = mapConfig.amap
  const pluginStr = plugins.length > 0 ? `&plugin=${plugins.join(',')}` : ''
  return `https://webapi.amap.com/maps?v=${version}&key=${key}${pluginStr}`
}

// 根据设备类型获取图标文件名
export const getDeviceIcon = (deviceType) => {
  return mapConfig.deviceMarkers.iconMap[deviceType] || '电磁阀'
}

// 根据设备状态获取颜色
export const getDeviceStatusColor = (status) => {
  return mapConfig.deviceMarkers.statusColors[status] || '#666666'
}

// 根据设备类型获取颜色
export const getDeviceTypeColor = (type) => {
  return mapConfig.deviceMarkers.typeColors[type] || '#409eff'
}

// 将xy坐标转换为经纬度坐标
export const convertXYToLngLat = (x, y, centerLng, centerLat, mapWidth = 1000, mapHeight = 600) => {
  // 假设xy是相对于地图容器的像素坐标
  // 将像素坐标转换为相对于地图中心的偏移量
  const offsetX = (x - mapWidth / 2) / mapWidth * 0.01  // 转换为度
  const offsetY = (y - mapHeight / 2) / mapHeight * 0.01 // 转换为度
  
  return {
    lng: centerLng + offsetX,
    lat: centerLat - offsetY  // 注意Y轴方向相反
  }
}

// 从 localStorage 读取地图中心点
export const loadMapCenterFromStorage = () => {
  try {
    const savedCenter = localStorage.getItem('map_center')
    if (savedCenter) {
      return JSON.parse(savedCenter)
    }
  } catch (error) {
    console.warn('读取本地地图中心点失败:', error)
  }
  return null
}

// 保存地图中心点到 localStorage
export const saveMapCenterToStorage = (center) => {
  try {
    localStorage.setItem('map_center', JSON.stringify(center))
  } catch (error) {
    console.warn('保存地图中心点到本地失败:', error)
  }
}

// 从浏览器或后端获取地图配置
export const fetchMapConfig = async () => {
  // 优先使用浏览器保存的地图中心点
  const savedCenter = loadMapCenterFromStorage()
  if (savedCenter) {
    return {
      center: savedCenter,
      zoom: mapConfig.defaultZoom
    }
  }
  
  // 如果没有保存，则从后端获取
  try {
    const centerResult = await call_remote('/config/get_map_center', {})
    const zoomResult = await call_remote('/config/get_map_zoom', {})
    
    if (centerResult.center) {
      mapConfig.defaultCenter = centerResult.center
    }
    
    if (zoomResult.zoom !== undefined) {
      mapConfig.defaultZoom = zoomResult.zoom
    }
    
    return {
      center: mapConfig.defaultCenter,
      zoom: mapConfig.defaultZoom
    }
  } catch (error) {
    console.error('获取地图配置失败，使用默认值:', error)
    return {
      center: mapConfig.defaultCenter,
      zoom: mapConfig.defaultZoom
    }
  }
}

// 通过城市名获取坐标（调用高德地图API）
export const getCityLocation = async (cityName) => {
  try {
    const key = mapConfig.amap.key
    const url = `https://restapi.amap.com/v3/geocode/geo?key=${key}&address=${encodeURIComponent(cityName)}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
      const location = data.geocodes[0].location.split(',')
      const lng = parseFloat(location[0])
      const lat = parseFloat(location[1])
      
      return { lng, lat }
    } else {
      throw new Error(`未找到城市"${cityName}"的坐标信息`)
    }
  } catch (error) {
    console.error('获取城市坐标失败:', error)
    throw error
  }
}