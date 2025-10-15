// 地图配置文件
export const mapConfig = {
  // 高德地图API配置
  amap: {
    // 使用提供的API密钥
    key: '1cf464a131ce91dfd0e56d28bd80d786',
    version: '2.0',
    plugins: ['AMap.Scale', 'AMap.ToolBar', 'AMap.Geocoder', 'AMap.PlaceSearch']
  },
  
  // 默认地图中心点（呼和浩特市）
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
      'sensor': '流量计'  // 传感器使用流量计图标，或者可以添加专门的传感器图标
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
      'valve': '#409eff',
      'flowmeter': '#e6a23c',
      'fertilizer': '#9c27b0',
      'sensor': '#67c23a'  // 传感器使用绿色
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