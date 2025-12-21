<template>
    <div class="interactive-map-container">

        <div id="amap-container" class="amap-container"></div>

        <!-- 轮灌组进度卡片（左下角） -->
        <div v-if="schemeProgress.total > 0" class="scheme-progress-card">
            <div class="progress-header">
                <span class="progress-title">当前方案进度</span>
                <span class="progress-text">{{ schemeProgress.completed }} / {{ schemeProgress.total }}</span>
            </div>
            <el-progress :percentage="schemeProgress.percent" :stroke-width="10" status="success" />
        </div>

        <UnifiedControlPanel :devices="devices" @open-wizard="showPolicyConfigWizard"
            @device-click="handleDeviceClick" />


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
                                经度: {{ selectedDevice.longitude.toFixed(6) }}, 纬度: {{ selectedDevice.latitude.toFixed(6)
                                }}
                            </span>
                            <span v-else>
                                X: {{ selectedDevice.x }}, Y: {{ selectedDevice.y }}
                            </span>
                        </span>
                    </div>
                </div>


                <div v-if="(selectedDevice.runtime_info && selectedDevice.runtime_info.length > 0) || selectedDevice.is_online !== undefined"
                    class="runtime-info-section" :class="{ loading: refreshingRuntimeInfo }">
                    <div class="section-title">
                        <el-icon>
                            <Monitor />
                        </el-icon>
                        <span>运行时信息</span>
                        <el-button size="small" type="primary" :icon="Refresh" @click="refreshRuntimeInfo"
                            :loading="refreshingRuntimeInfo" circle />
                    </div>
                    <div class="runtime-info-list">

                        <div v-if="selectedDevice.is_online !== undefined" class="runtime-info-item online-status-item">
                            <div class="info-label">
                                <el-icon class="status-icon"
                                    :class="{ 'online': selectedDevice.is_online, 'offline': !selectedDevice.is_online }">
                                    <CircleCheck v-if="selectedDevice.is_online" />
                                    <CircleClose v-else />
                                </el-icon>
                                设备在线状态：
                            </div>
                            <div class="info-value"
                                :class="{ 'online': selectedDevice.is_online, 'offline': !selectedDevice.is_online }">
                                {{ selectedDevice.is_online ? '在线' : '离线' }}
                            </div>
                        </div>

                        <div v-for="(info, index) in selectedDevice.runtime_info" :key="index"
                            class="runtime-info-item">
                            <div class="info-label">{{ info.title }}：</div>
                            <div class="info-value">{{ info.text }}</div>
                        </div>
                    </div>
                </div>

                <div class="device-actions" v-if="hasAnyDeviceCapability(selectedDevice)">
                    <div class="device-controls-container">

                        <div v-for="buttonGroup in getDeviceButtonGroupsWrapperLocal(selectedDevice)"
                            :key="buttonGroup.key" :class="buttonGroup.containerClass">
                            <el-button v-for="buttonConfig in buttonGroup.buttons" :key="buttonConfig.key"
                                :type="buttonConfig.buttonType" :size="buttonConfig.buttonSize"
                                :class="buttonConfig.buttonClass"
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


        <div v-if="loading" class="loading-overlay">
            <div class="loading-spinner"></div>
            <p>地图加载中...</p>
        </div>



    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch, getCurrentInstance, inject } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ZoomIn, ZoomOut, Refresh, Close, Location, ArrowDown, Grid, Monitor, VideoPlay, VideoPause, Warning, CircleCheck, CircleClose, Setting, Plus, Delete, CopyDocument, ArrowLeft, ArrowRight, FullScreen, Check, View } from '@element-plus/icons-vue'
import call_remote from '../../../lib/call_remote.js'
import { mapConfig, getAMapScriptUrl, getDeviceIcon, convertXYToLngLat } from '../config/mapConfig.js'
import UnifiedControlPanel from './UnifiedControlPanel.vue'
import {
    getDeviceType,
    hasDeviceCapability,
    hasAnyDeviceCapability,
    refreshRuntimeInfo as refreshRuntimeInfoUtil,
    createRuntimeInfoAutoRefresh,
    handleDeviceAction as handleDeviceActionUtil,
    getDeviceButtonGroupsWrapper,
    openDevice,
    closeDevice
} from '../utils/deviceUtils.js'


const router = useRouter()

// 从上层布局注入当前选中的方案
const injectedSelectedSchemeId = inject('selectedSchemeId', null)
const injectedCurrentSchemeName = inject('currentSchemeName', null)

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


const emit = defineEmits(['device-click'])

// 轮灌组进度
const schemeProgress = ref({
    completed: 0,
    total: 0,
    percent: 0
})

const currentSchemeId = computed(() => {
    if (injectedSelectedSchemeId && injectedSelectedSchemeId.value) return injectedSelectedSchemeId.value
    if (injectedCurrentSchemeName && injectedCurrentSchemeName.value) return injectedCurrentSchemeName.value
    if (typeof window !== 'undefined') {
        try {
            return localStorage.getItem('selectedSchemeId') || ''
        } catch (e) {
            return ''
        }
    }
    return ''
})

const loadSchemeProgress = async () => {
    const schemeId = currentSchemeId.value
    if (!schemeId) {
        schemeProgress.value = { completed: 0, total: 0, percent: 0 }
        return
    }
    try {
        const response = await call_remote('/policy/list_watering_groups', {
            pageNo: 0,
            scheme_id: schemeId
        })
        if (response && response.groups) {
            const groups = response.groups
            const total = response.total || groups.length
            let completed = 0
            groups.forEach(group => {
                const status = (group.cur_state || '').toLowerCase()
                const hasWater = group.total_water && group.total_water !== '-' && group.total_water !== 0 && group.total_water !== '0'
                const hasFert = group.total_fert && group.total_fert !== '-' && group.total_fert !== 0 && group.total_fert !== '0'
                if (status.includes('完成') || status.includes('finished') || status.includes('done') || hasWater || hasFert) {
                    completed += 1
                }
            })
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0
            schemeProgress.value = { completed, total, percent }
        } else {
            schemeProgress.value = { completed: 0, total: 0, percent: 0 }
        }
    } catch (error) {
        console.warn('加载方案进度失败:', error)
        schemeProgress.value = { completed: 0, total: 0, percent: 0 }
    }
}

watch(currentSchemeId, async (newVal, oldVal) => {
    if (newVal && newVal !== oldVal) {
        await loadSchemeProgress()
    } else if (!newVal) {
        schemeProgress.value = { completed: 0, total: 0, percent: 0 }
    }
})


const selectedDevice = ref(null)
const loading = ref(true)
const currentLayerType = ref('卫星地图')
const refreshingRuntimeInfo = ref(false)
const deviceStatuses = ref({})


const runtimeInfoAutoRefresh = createRuntimeInfoAutoRefresh(
    () => selectedDevice,
    () => refreshRuntimeInfo(),
    30000
)




const scanPeriod = ref(200)
const scanLoading = ref(false)
const isScanning = ref(false)

let map = null

let satelliteLayer = null
let trafficLayer = null
let markers = []


const initMap = async () => {
    try {
        loading.value = true


        if (!globalThis.AMap) {
            await loadAMapScript()
        }


        if (!globalThis.AMap) {
            throw new Error('高德地图API加载失败')
        }


        const initialStyle = mapConfig.mapStyles.normal

        map = new AMap.Map('amap-container', {
            zoom: props.zoom,
            center: [props.center.lng, props.center.lat],
            mapStyle: initialStyle,
            viewMode: '2D',
            pitch: 0,
            rotation: 0,
            features: ['bg', 'road', 'building', 'point'],
            showLabel: true,

            optimize: true,

            renderOnMoving: false
        })


        setTimeout(() => {
            if (map) {

                setSatelliteLayer()

                map.render()
            }
        }, 1000)


        if (mapConfig.controls.showScale) {
            map.addControl(new AMap.Scale())
        }
        if (mapConfig.controls.showToolbar) {
            map.addControl(new AMap.ToolBar())
        }


        map.on('click', onMapClick)


        map.on('complete', () => {
            loading.value = false

            initDeviceMarkers()
        })

    } catch (error) {
        console.error('地图初始化失败:', error)
        loading.value = false
        ElMessage.error('地图加载失败，请检查网络连接')
    }
}


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


const initDeviceMarkers = () => {
    if (!map || !props.devices) {
        return
    }


    clearMarkers()

    for (const device of props.devices) {
        const marker = createDeviceMarker(device)
        if (marker) {
            markers.push(marker)
        }
    }
}


const createDeviceMarker = (device) => {
    if (!globalThis.AMap) {
        return null
    }

    try {
        let lng, lat


        if (device.longitude && device.latitude) {
            lng = device.longitude
            lat = device.latitude
        } else if (device.x && device.y) {

            const converted = convertXYToLngLat(device.x, device.y, props.center.lng, props.center.lat)
            lng = converted.lng
            lat = converted.lat
        } else {
            return null
        }


        const markerContent = createMarkerContent(device)

        const marker = new AMap.Marker({
            position: [lng, lat],
            content: markerContent,
            anchor: 'center',
            offset: new AMap.Pixel(0, 0)
        })


        marker.on('click', () => {

            const deviceWithType = {
                ...device,
                type: getDeviceType(device)
            }
            onDeviceClick(deviceWithType)
        })


        map.add(marker)

        return marker
    } catch (error) {
        console.error('创建设备标记失败:', error, device)
        return null
    }
}


const handleDeviceAction = async (action, deviceName) => {

    if (action === 'openDevice') {
        await openDeviceWrapper(deviceName)
    } else if (action === 'closeDevice') {
        await closeDeviceWrapper(deviceName)
    }
    else if (action == 'setDeviceKeyValue') {
        let numericValue = undefined
        try {
            const result = await ElMessageBox.prompt('请输入关键参数值:', '设置关键参数', {
                confirmButtonText: '设置',
                cancelButtonText: '取消',
                inputPattern: /^-?\d+(\.\d+)?$/,
                inputErrorMessage: '请输入有效的数字值'
            })

            const value = result?.value
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                ElMessage.error('参数值不能为空，操作已取消')
                return
            }

            numericValue = Number.parseFloat(value)
            if (isNaN(numericValue)) {
                ElMessage.error('无效的数字值，操作已取消')
                return
            }
        } catch (error) {
            if (error && error !== 'cancel' && error.toString().indexOf('cancel') === -1) {
                console.error('设置关键参数时出错:', error)
            }
            return // 用户取消，直接返回
        }

        // 确保 numericValue 有效后再调用
        if (numericValue === undefined || numericValue === null || isNaN(numericValue)) {
            ElMessage.error('参数值无效，操作已取消')
            return
        }

        await handleDeviceActionUtil(action, deviceName, refreshRuntimeInfo, numericValue)
    }
    else {

        await handleDeviceActionUtil(action, deviceName, refreshRuntimeInfo)
    }
}


const getDeviceButtonGroupsWrapperLocal = (device) => {
    return getDeviceButtonGroupsWrapper(device, getCurrentInstance)
}


const getDeviceStatus = (device) => {
    if (!device) return false
    const deviceName = device.deviceName || device.device_name
    return deviceStatuses.value[deviceName] || false
}


const setDeviceStatus = (deviceName, status) => {
    deviceStatuses.value[deviceName] = status
}


const createMarkerContent = (device) => {
    const deviceType = getDeviceType(device)
    const iconName = getDeviceIcon(deviceType)
    const deviceName = device.label || device.device_name || device.deviceName

    let statusClass
    if (device.is_online === true) {
        statusClass = 'online'
    } else if (device.is_online === false) {
        statusClass = 'offline'
    } else {
        const isOpen = getDeviceStatus(device)
        statusClass = isOpen ? 'active' : 'inactive'
    }

    return `
    <div class="device-marker ${deviceType} ${statusClass}" title="${deviceName}">
      <div class="marker-icon">
        <img src="/deviceIcon/${iconName}.png" alt="${deviceName}" />
      </div>
      <div class="marker-info">
        <div class="device-name">${deviceName}</div>
      </div>
    </div>
  `
}


const onDeviceClick = (device) => {
    selectedDevice.value = device
    emit('device-click', device)


    startRuntimeInfoAutoRefresh()
}


const onMapClick = (e) => {

    if (selectedDevice.value) {
        closeDevicePanel()
    }
}


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


const setSatelliteLayer = () => {
    if (!map) return

    currentLayerType.value = '卫星地图'

    try {

        clearAllLayers()


        satelliteLayer = new AMap.TileLayer.Satellite({
            zIndex: 1
        })


        map.add(satelliteLayer)


        map.setMapStyle(mapConfig.mapStyles.normal)

        ElMessage.success('已切换到卫星地图')

    } catch (error) {
        console.error('设置卫星图层失败:', error)
        ElMessage.error('卫星地图设置失败')
    }
}


const setTrafficLayer = () => {
    if (!map) return

    currentLayerType.value = '实时交通'

    try {

        clearAllLayers()


        trafficLayer = new AMap.TileLayer.Traffic({
            zIndex: 1,
            autoRefresh: true,
            interval: 180
        })


        map.add(trafficLayer)


        map.setMapStyle(mapConfig.mapStyles.normal)

        ElMessage.success('已切换到实时交通地图')

    } catch (error) {
        console.error('设置交通图层失败:', error)
        ElMessage.error('交通地图设置失败')
    }
}


const setHybridLayer = () => {
    if (!map) return

    currentLayerType.value = '混合图层'

    try {

        clearAllLayers()


        satelliteLayer = new AMap.TileLayer.Satellite({
            zIndex: 1
        })


        trafficLayer = new AMap.TileLayer.Traffic({
            zIndex: 2,
            autoRefresh: true,
            interval: 180
        })


        map.add(satelliteLayer)
        map.add(trafficLayer)


        map.setMapStyle(mapConfig.mapStyles.normal)

        ElMessage.success('已切换到混合图层（卫星+交通）')

    } catch (error) {
        console.error('设置混合图层失败:', error)
        ElMessage.error('混合图层设置失败')
    }
}


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


const resetView = () => {
    if (map) {
        map.setCenter([props.center.lng, props.center.lat])
        map.setZoom(props.zoom)
    }
}


const clearMarkers = () => {
    for (const marker of markers) {
        map.remove(marker)
    }
    markers = []
}


const closeDevicePanel = () => {

    stopRuntimeInfoAutoRefresh()
    selectedDevice.value = null
}



const toggleDevice = async (device) => {
    try {
        const deviceName = device.deviceName || device.device_name
        const currentStatus = getDeviceStatus(device)

        if (currentStatus) {

            await closeDevice(deviceName)
            setDeviceStatus(deviceName, false)
            ElMessage.success(`设备 ${deviceName} 已关闭`)
        } else {

            await openDevice(deviceName)
            setDeviceStatus(deviceName, true)
            ElMessage.success(`设备 ${deviceName} 已开启`)
        }


        initDeviceMarkers()
    } catch (error) {
        console.error('设备切换失败:', error)
        ElMessage.error(`设备切换失败: ${error.message || error}`)
    }
}


const openDeviceWrapper = async (deviceName) => {
    await openDevice(deviceName)
    setDeviceStatus(deviceName, true)

    initDeviceMarkers()
}


const closeDeviceWrapper = async (deviceName) => {
    await closeDevice(deviceName)
    setDeviceStatus(deviceName, false)

    initDeviceMarkers()
}


const refreshRuntimeInfo = async () => {
    if (!selectedDevice.value) return
    await refreshRuntimeInfoUtil(selectedDevice.value, refreshingRuntimeInfo)
}


const startRuntimeInfoAutoRefresh = () => {
    runtimeInfoAutoRefresh.start()
}


const stopRuntimeInfoAutoRefresh = () => {
    runtimeInfoAutoRefresh.stop()
}


// 处理设备点击事件（从 UnifiedControlPanel 组件触发）
const handleDeviceClick = (device) => {
    emit('device-click', device)
}


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


const showPolicyConfigWizard = () => {
    // 跳转到策略程序设定向导页面
    router.push('/policy_wizard')
}


watch(() => props.devices, () => {
    if (map && !loading.value) {
        initDeviceMarkers()
    }
}, { deep: true })


watch(() => props.center, (newCenter) => {
    if (map && newCenter) {
        map.setCenter([newCenter.lng, newCenter.lat])
    }
})


onMounted(async () => {
    nextTick(() => {
        initMap()
    })

    checkScanStatus()
    await loadSchemeProgress()
})


onUnmounted(() => {

    stopRuntimeInfoAutoRefresh()

    if (map) {

        clearAllLayers()


        for (const marker of markers) {
            if (marker) {
                map.remove(marker)
            }
        }
        markers = []


        map.destroy()
        map = null
    }
})
</script>
<style scoped>
.interactive-map-container {
    position: relative;
    width: 100%;
    height: 730px;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.amap-container {
    width: 100%;
    height: 730px;
}


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


.control-divider {
    width: 1px;
    background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.1), transparent);
    margin: 16px 0;
}


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

    0%,
    100% {
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


.map-controls {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.scheme-progress-card {
    position: absolute;
    left: 20px;
    bottom: 20px;
    z-index: 10000;
    min-width: 260px;
    max-width: 320px;
    padding: 12px 16px;
    border-radius: 16px;
    background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
    border: 2px solid rgba(255, 255, 255, 0.8);
    box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.12),
        0 2px 8px rgba(0, 0, 0, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    color: #303133;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.scheme-progress-card .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
}

.scheme-progress-card .progress-title {
    font-weight: 600;
    letter-spacing: 0.5px;
}

.scheme-progress-card .progress-text {
    font-size: 12px;
    color: #909399;
}

.scheme-progress-card :deep(.el-progress-bar__outer) {
    background-color: rgba(144, 147, 153, 0.18);
}

.scheme-progress-card :deep(.el-progress-bar__inner) {
    background-image: linear-gradient(90deg, #22c55e, #4ade80);
}

.scheme-progress-card :deep(.el-progress__text) {
    color: #303133;
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
    min-width: 200px;
}

:deep(.device-marker:hover) {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    border-color: #409eff;
}

:deep(.marker-icon) {
    width: 50px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 8px;
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
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #2c3e50;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
    line-height: 1.2;
}

:deep(.marker-name) {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #303133;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
    line-height: 1.2;
    margin-left: 4px;
}


:deep(.device-marker .marker-icon) {
    border-color: #dee2e6;
    background: #f8f9fa;
}


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
</style>
