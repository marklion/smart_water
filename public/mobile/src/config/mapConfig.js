// 移动端地图配置文件
export const mapConfig = {
  // 高德地图API配置
  amap: {
    // 使用提供的API密钥
    key: '1cf464a131ce91dfd0e56d28bd80d786',
    version: '2.0',
    plugins: ['AMap.Scale', 'AMap.ToolBar', 'AMap.Geocoder', 'AMap.PlaceSearch']
  },
  
  // 默认地图中心点
  defaultCenter: {
    lng: 111.670801, // 呼和浩特市经度
    lat: 40.818311   // 呼和浩特市纬度
  },
  
  defaultZoom: 15,
  
  // 地图样式配置
  mapStyles: {
    normal: 'amap://styles/normal'
  },
  
  // 设备标记配置
  deviceMarkers: {
    // 设备类型图标映射（使用英文文件名）
    iconMap: {
      'valve': 'valve',
      'flowmeter': 'flowmeter', 
      'fertilizer': 'fertilizer',
      'sensor': 'flowmeter',  // 传感器使用流量计图标
      'pump': 'pump',
      'temperature': 'flowmeter',  // 温度传感器使用流量计图标
      'humidity': 'flowmeter',     // 湿度传感器使用流量计图标
      'pressure': 'pressure',     // 压力传感器使用压力计图标
      'levelmeter': 'levelmeter',   // 液位计使用液位计图标
      '液位计': 'levelmeter'
    }
  }
}

// 获取高德地图API脚本URL
export const getAMapScriptUrl = () => {
  const { key, version, plugins } = mapConfig.amap
  const pluginStr = plugins.length > 0 ? `&plugin=${plugins.join(',')}` : ''
  return `https://webapi.amap.com/maps?v=${version}&key=${key}${pluginStr}`
}

// 加载高德地图脚本
export const loadAMapScript = () => {
  return new Promise((resolve, reject) => {
    // 如果已经加载，直接返回
    if (globalThis.AMap) {
      resolve(globalThis.AMap)
      return
    }
    
    // 检查是否已经有脚本标签
    const existingScript = document.querySelector('script[src*="webapi.amap.com"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (globalThis.AMap) {
          resolve(globalThis.AMap)
        } else {
          reject(new Error('高德地图API加载失败'))
        }
      })
      return
    }
    
    // 创建并加载脚本
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = getAMapScriptUrl()
    script.onload = () => {
      if (globalThis.AMap) {
        resolve(globalThis.AMap)
      } else {
        reject(new Error('高德地图API加载失败'))
      }
    }
    script.onerror = () => {
      reject(new Error('高德地图API脚本加载失败'))
    }
    document.head.appendChild(script)
  })
}

// 根据设备类型获取图标文件名（返回英文文件名）
export const getDeviceIcon = (deviceType) => {
  return mapConfig.deviceMarkers.iconMap[deviceType] || 'valve'
}

// 根据设备名称判断设备类型（如果 device_type 不准确，可以从名称推断）
export const getDeviceTypeFromName = (deviceName) => {
  if (!deviceName) return null
  
  const name = deviceName.toLowerCase()
  
  // 根据设备名称中的关键词判断类型
  if (name.includes('流量计') || name.includes('flowmeter') || name.includes('流量')) {
    return 'flowmeter'
  } else if (name.includes('泵') || name.includes('pump') || name.includes('搅拌泵') || name.includes('施肥泵') || name.includes('主泵')) {
    return 'pump'
  } else if (name.includes('压力计') || name.includes('pressure') || name.includes('压力')) {
    return 'pressure'
  } else if (name.includes('液位计') || name.includes('levelmeter') || name.includes('液位')) {
    return 'levelmeter'
  } else if (name.includes('施肥机') || name.includes('fertilizer') || name.includes('施肥')) {
    return 'fertilizer'
  } else if (name.includes('阀门') || name.includes('valve') || name.includes('阀')) {
    return 'valve'
  }
  
  return null
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
      const lng = Number.parseFloat(location[0])
      const lat = Number.parseFloat(location[1])
      
      return { lng, lat }
    } else {
      throw new Error(`未找到城市"${cityName}"的坐标信息`)
    }
  } catch (error) {
    throw error
  }
}

