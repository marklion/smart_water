import { ElMessage } from 'element-plus'
import call_remote from '../../../lib/call_remote.js'

/**
 * 获取设备类型代码 - 用于图标和动作集映射
 */
export function getDeviceType(device) {
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

/**
 * 检查设备是否具有特定能力
 */
export function hasDeviceCapability(device, capability) {
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

/**
 * 检查设备是否具有任何能力
 */
export function hasAnyDeviceCapability(device) {
  if (!device) return false

  const allCapabilities = ['open', 'close', 'readout', 'shutdown']
  return allCapabilities.some(capability => hasDeviceCapability(device, capability))
}

/**
 * 获取设备按钮分组（动态生成，开启和关闭按钮放在同一行）
 */
export function getDeviceButtonGroups(device, getCurrentInstance) {
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
  const instance = getCurrentInstance()
  if (!instance || !instance.appContext || !instance.appContext.config || !instance.appContext.config.globalProperties || !instance.appContext.config.globalProperties.$getDeviceButtonConfig) {
    console.warn('$getDeviceButtonConfig 全局函数未找到')
    return []
  }
  
  const buttonConfigs = instance.appContext.config.globalProperties.$getDeviceButtonConfig(capabilities, deviceType)

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

/**
 * 打开设备
 */
export async function openDevice(deviceName) {
  try {
    const response = await call_remote('/device_management/open_device', { device_name: deviceName })
    if (response.result) {
      ElMessage.success(`设备 ${deviceName} 已开启`)
    }
  } catch (error) {
    console.error('打开设备失败:', error)
    ElMessage.error(`打开设备失败: ${error.message || error}`)
    throw error
  }
}

/**
 * 关闭设备
 */
export async function closeDevice(deviceName) {
  try {
    const response = await call_remote('/device_management/close_device', { device_name: deviceName })
    if (response.result) {
      ElMessage.success(`设备 ${deviceName} 已关闭`)
    }
  } catch (error) {
    console.error('关闭设备失败:', error)
    ElMessage.error(`关闭设备失败: ${error.message || error}`)
    throw error
  }
}

/**
 * 读取设备状态
 */
export async function readDeviceStatus(deviceName) {
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

/**
 * 关机设备
 */
export async function shutdownDevice(deviceName) {
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

/**
 * 刷新运行时信息
 */
export async function refreshRuntimeInfo(selectedDevice, refreshingRuntimeInfo) {
  if (!selectedDevice) return

  try {
    refreshingRuntimeInfo.value = true

    // 获取最新的设备列表，包含运行时信息
    const response = await call_remote('/device_management/list_device', {
      pageNo: 0,
      farm_name: selectedDevice.farmName || selectedDevice.farm_name,
      block_name: selectedDevice.blockName || selectedDevice.block_name
    })

    if (response.devices && response.devices.length > 0) {
      // 找到当前选中的设备
      const currentDevice = response.devices.find(device =>
        device.device_name === (selectedDevice.device_name || selectedDevice.deviceName)
      )

      if (currentDevice) {
        // 更新运行时信息
        if (currentDevice.runtime_info) {
          selectedDevice.runtime_info = currentDevice.runtime_info
        }
        // 更新在线状态
        if (currentDevice.is_online !== undefined) {
          selectedDevice.is_online = currentDevice.is_online
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

/**
 * 创建自动刷新定时器管理器
 */
export function createRuntimeInfoAutoRefresh(selectedDevice, refreshRuntimeInfoFn, interval = 30000) {
  let timer = null

  const start = () => {
    stop() // 先清除现有定时器
    timer = setInterval(() => {
      if (selectedDevice.value && selectedDevice.value.runtime_info) {
        refreshRuntimeInfoFn()
      }
    }, interval)
  }

  const stop = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  return { start, stop }
}

/**
 * 处理设备操作（统一处理逻辑）
 */
export async function handleDeviceAction(action, deviceName, refreshRuntimeInfoFn) {
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
    // 操作后刷新运行时信息
    if (refreshRuntimeInfoFn) {
      await refreshRuntimeInfoFn()
    }
  } catch (error) {
    console.error('设备操作失败:', error)
    ElMessage.error(`设备操作失败: ${error.message || error}`)
  }
}

/**
 * 获取设备按钮分组（包装函数，用于传入 getCurrentInstance）
 */
export function getDeviceButtonGroupsWrapper(device, getCurrentInstance) {
  return getDeviceButtonGroups(device, getCurrentInstance)
}

