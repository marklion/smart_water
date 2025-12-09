<template>
    <view class="page">
        <!-- 顶部标题栏 -->
        <view class="header">
            <view class="header-left" @click="goBack">
                <text class="back-icon">←</text>
            </view>
            <view class="header-center">
                <fui-text :text="groupName + ' - 选择阀门'" :size="32" :fontWeight="600" color="#303133"></fui-text>
            </view>
            <view class="header-right"></view>
        </view>

        <!-- 地图容器 -->
        <view class="map-container">
            <!-- H5端使用高德地图 -->
            <view v-if="isH5" id="amap-container" class="amap-container"></view>
            <!-- App端使用uni-app map组件 -->
            <map v-else class="valve-map" :latitude="mapCenter.lat" :longitude="mapCenter.lng" :scale="mapScale"
                :markers="mapMarkers" @markertap="onMarkerTap" :provider="mapProvider"></map>
        </view>

        <!-- 底部信息栏 -->
        <view class="bottom-info">
            <view class="info-text">
                <fui-text :text="'已选择: '" :size="28" color="#606266"></fui-text>
                <fui-text :text="String(selectedValves.length)" :size="28" :fontWeight="600" color="#409eff"></fui-text>
                <fui-text :text="' / ' + availableValves.length + ' 个阀门'" :size="28" color="#606266"></fui-text>
            </view>
            <view class="info-actions">
                <view v-if="selectedValves.length > 0" class="action-btn danger" @click="clearAll">
                    <fui-text :text="'清空'" :size="28" color="#fff"></fui-text>
                </view>
                <view v-if="selectedValves.length < availableValves.length" class="action-btn primary"
                    @click="selectAll">
                    <fui-text :text="'全选'" :size="28" color="#fff"></fui-text>
                </view>
                <view class="action-btn success" @click="confirmSelection">
                    <fui-text :text="'确定'" :size="28" color="#fff"></fui-text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import fuiText from 'firstui-uni/firstui/fui-text/fui-text.vue'
import { mapConfig, loadAMapScript } from '../../config/mapConfig.js'

const groupName = ref('')
const availableValves = ref([])
const selectedValves = ref([])
const mapCenter = ref({ lat: 23.1291, lng: 113.2644 })
const mapScale = ref(12)
const mapMarkers = ref([])

// 判断是否为H5平台
const isH5 = ref(false)
// 地图提供者（App端使用高德地图）
const mapProvider = ref('amap')
// H5端的高德地图实例
let amapInstance = null
let amapMarkers = []
// 图层相关
let satelliteLayer = null

// 页面加载时接收参数
onLoad(() => {
    // 检测平台
    // #ifdef H5
    isH5.value = true
    // #endif

    // 从本地存储读取数据
    const storedGroupName = uni.getStorageSync('valve_map_group_name')
    const storedAvailableValves = uni.getStorageSync('valve_map_available_valves')
    const storedSelectedValves = uni.getStorageSync('valve_map_selected_valves')

    if (storedGroupName) {
        groupName.value = storedGroupName
    }

    if (storedAvailableValves) {
        try {
            availableValves.value = JSON.parse(storedAvailableValves)
        } catch (e) {
            console.error('解析可用阀门列表失败:', e)
        }
    }

    if (storedSelectedValves) {
        try {
            selectedValves.value = JSON.parse(storedSelectedValves)
        } catch (e) {
            console.error('解析已选阀门列表失败:', e)
        }
    }

    // 初始化地图
    initMap()
})

// 页面挂载后初始化H5地图
onMounted(() => {
    if (isH5.value) {
        nextTick(() => {
            initAMap()
        })
    }
})

// 页面卸载时清理地图资源
onUnmounted(() => {
    if (isH5.value && amapInstance) {
        // 清除所有标记
        amapMarkers.forEach(marker => {
            amapInstance.remove(marker)
        })
        amapMarkers = []
        // 清除图层
        if (satelliteLayer) {
            amapInstance.remove(satelliteLayer)
            satelliteLayer = null
        }
        // 销毁地图实例
        amapInstance.destroy()
        amapInstance = null
    }
})

// 初始化地图（App端）
const initMap = () => {
    if (availableValves.value.length === 0) return

    // 计算地图中心
    const lats = availableValves.value.map(v => v.latitude).filter(Boolean)
    const lngs = availableValves.value.map(v => v.longitude).filter(Boolean)

    if (lats.length > 0 && lngs.length > 0) {
        const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length
        const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length
        mapCenter.value = { lat: avgLat, lng: avgLng }
        mapScale.value = 12
    }

    // 创建标记（App端）
    if (!isH5.value) {
        updateMarkers()
    }
}

// 初始化高德地图（H5端）
const initAMap = async () => {
    if (availableValves.value.length === 0) return

    try {
        // 加载高德地图脚本
        await loadAMapScript()

        if (!globalThis.AMap) {
            throw new Error('高德地图API加载失败')
        }

        // 计算地图中心
        const lats = availableValves.value.map(v => v.latitude).filter(Boolean)
        const lngs = availableValves.value.map(v => v.longitude).filter(Boolean)

        let center = [mapConfig.defaultCenter.lng, mapConfig.defaultCenter.lat]
        if (lats.length > 0 && lngs.length > 0) {
            const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length
            const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length
            center = [avgLng, avgLat]
        }

        // 创建地图实例
        amapInstance = new AMap.Map('amap-container', {
            zoom: 12,
            center: center,
            mapStyle: 'amap://styles/normal'
        })

        // 添加控件
        amapInstance.addControl(new AMap.Scale())
        amapInstance.addControl(new AMap.ToolBar())

        // 注入标记样式
        injectMarkerStyles()

        // 默认显示卫星图层
        try {
            satelliteLayer = new AMap.TileLayer.Satellite({
                zIndex: 1
            })
            amapInstance.add(satelliteLayer)
            amapInstance.setMapStyle('amap://styles/normal')
        } catch (error) {
            console.error('设置卫星图层失败:', error)
        }

        // 创建标记
        updateAMapMarkers()
    } catch (error) {
        console.error('初始化高德地图失败:', error)
        uni.showToast({
            title: '地图加载失败',
            icon: 'none'
        })
    }
}

// 更新地图标记（App端）
const updateMarkers = () => {
    mapMarkers.value = availableValves.value.map((valve, idx) => ({
        id: idx,
        latitude: valve.latitude,
        longitude: valve.longitude,
        title: valve.device_name,
        iconPath: '/deviceIcon/电磁阀.png',
        width: 50,
        height: 50,
        callout: {
            content: valve.device_name,
            display: 'ALWAYS',
            bgColor: '#ffffff',
            color: '#303133',
            borderRadius: 8,
            padding: 6,
            borderWidth: selectedValves.value.includes(valve.device_name) ? 2 : 1,
            borderColor: selectedValves.value.includes(valve.device_name) ? '#67c23a' : '#e0e0e0'
        }
    })).filter(m => m.latitude && m.longitude)
}

// 注入标记样式到页面（使用策略向导的蓝色样式）
const injectMarkerStyles = () => {
    if (typeof document === 'undefined') return

    // 检查样式是否已注入
    if (document.getElementById('valve-map-marker-styles')) return

    const style = document.createElement('style')
    style.id = 'valve-map-marker-styles'
    style.textContent = `
        .device-marker {
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
        }
        .device-marker:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
            border-color: #409eff;
        }
        .device-marker.selected,
        .device-marker.valve-selected {
            background: rgba(64, 158, 255, 0.9);
            border-color: #409eff;
            box-shadow: 0 4px 16px rgba(64, 158, 255, 0.4);
        }
        .marker-icon {
            width: 32px;
            height: 32px;
            margin-right: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .marker-icon img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        .marker-name {
            font-size: 12px;
            font-weight: 600;
            color: #303133;
            white-space: nowrap;
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .device-marker.selected .marker-name,
        .device-marker.valve-selected .marker-name {
            color: #ffffff;
        }
    `
    document.head.appendChild(style)
}

// 更新高德地图标记（H5端）
const updateAMapMarkers = () => {
    if (!amapInstance || !globalThis.AMap) return

    // 清除现有标记
    amapMarkers.forEach(marker => {
        amapInstance.remove(marker)
    })
    amapMarkers = []

    // 创建新标记
    availableValves.value.forEach((valve, idx) => {
        if (!valve.latitude || !valve.longitude) return

        const isSelected = selectedValves.value.includes(valve.device_name)

        // 添加图片加载错误处理和调试（避免无限循环）
        let retryCount = 0
        const maxRetries = 2

            // 尝试多个可能的路径
            let nextPath = ''
            if (retryCount === 1) {
                // 第一次重试：尝试PC端的完整路径（去掉/mobile前缀）
                if (pathname.startsWith('/mobile')) {
                    nextPath = `${baseUrl.replace('/mobile', '')}/deviceIcon/${iconName}.png`
                } else {
                    nextPath = `${baseUrl}/deviceIcon/${iconName}.png`
                }
            } else if (retryCount === 2) {
                // 第二次重试：尝试移动端的static路径
                nextPath = `${baseUrl}/mobile/static/deviceIcon/${iconName}.png`
            }

            if (nextPath) {
                console.log('尝试备用路径:', nextPath)
                img.src = nextPath
            }
        }

        // 判断选中状态（使用策略向导的样式）
        const statusClass = isSelected ? 'selected' : ''
        const selectionClass = isSelected ? 'valve-selected' : ''

        // 创建DOM元素而不是字符串，这样可以更好地绑定事件
        const markerDiv = document.createElement('div')
        markerDiv.className = `device-marker valve ${statusClass} ${selectionClass}`
        markerDiv.title = valve.device_name
        markerDiv.style.cursor = 'pointer'

        const iconDiv = document.createElement('div')
        iconDiv.className = 'marker-icon'
        const iconImg = document.createElement('img')

        // 使用一个标记来防止无限重试
        if (!iconImg.dataset.retryCount) {
            iconImg.dataset.retryCount = '0'
        }

        const getNextIconPath = (retryCount) => {
            const baseUrl = typeof globalThis.window !== 'undefined' && globalThis.window.location ? globalThis.window.location.origin : ''

            // 优先使用移动端的static路径（图标已复制到移动端）
            const paths = [
                `${baseUrl}/mobile/static/deviceIcon/电磁阀.png`, // 优先：移动端static路径
                `${baseUrl}/static/deviceIcon/电磁阀.png`, // 备用1：相对static路径
                `${baseUrl}/deviceIcon/电磁阀.png`, // 备用2：服务器根路径（生产环境）
            ]

            return paths[retryCount] || paths[paths.length - 1]
        }

        const loadIcon = (retryCount = 0) => {
            const iconUrl = getNextIconPath(retryCount)
            iconImg.src = iconUrl
            iconImg.dataset.retryCount = String(retryCount)
        }

        // 初始加载
        loadIcon(0)

        iconImg.alt = valve.device_name
        iconImg.onerror = () => {
            const retryCount = Number.parseInt(iconImg.dataset.retryCount || '0')
            console.error(`图标加载失败 (尝试 ${retryCount + 1}):`, iconImg.src)

            if (retryCount < 2) {
                // 尝试下一个路径
                loadIcon(retryCount + 1)
            } else {
                // 所有路径都失败，显示占位符
                console.error('所有路径都失败，使用占位符')
                iconImg.style.display = 'none'
                const placeholder = document.createElement('div')
                placeholder.style.width = '32px'
                placeholder.style.height = '32px'
                placeholder.style.backgroundColor = '#409eff'
                placeholder.style.borderRadius = '50%'
                placeholder.style.display = 'flex'
                placeholder.style.alignItems = 'center'
                placeholder.style.justifyContent = 'center'
                placeholder.style.color = '#fff'
                placeholder.style.fontSize = '12px'
                placeholder.style.fontWeight = 'bold'
                placeholder.textContent = '阀'
                iconDiv.appendChild(placeholder)
            }
        }
        iconImg.onload = () => {
            console.log('图标加载成功:', iconImg.src)
        }
        // 设置默认样式，确保图标可见
        iconImg.style.width = '100%'
        iconImg.style.height = '100%'
        iconImg.style.objectFit = 'contain'
        iconDiv.appendChild(iconImg)

        const nameDiv = document.createElement('div')
        nameDiv.className = 'marker-name'
        nameDiv.textContent = valve.device_name

        markerDiv.appendChild(iconDiv)
        markerDiv.appendChild(nameDiv)

        // 直接在DOM元素上添加点击事件
        const deviceName = valve.device_name
        markerDiv.addEventListener('click', (e) => {
            e.stopPropagation()
            e.preventDefault()
            console.log('标记DOM被点击:', deviceName)
            toggleValve(deviceName)
        })

        markerDiv.addEventListener('touchend', (e) => {
            e.stopPropagation()
            e.preventDefault()
            console.log('标记DOM被触摸:', deviceName)
            toggleValve(deviceName)
        })

        // 创建标记
        const marker = new AMap.Marker({
            position: [valve.longitude, valve.latitude],
            content: markerDiv,
            anchor: 'center',
            offset: new AMap.Pixel(0, 0),
            zIndex: 1000, // 确保标记显示在图层上方
            title: valve.device_name,
            clickable: true // 确保标记可点击
        })

        // 也添加标记本身的点击事件（双重保障）
        marker.on('click', (e) => {
            e.stopPropagation()
            console.log('标记对象被点击:', deviceName)
            toggleValve(deviceName)
        })

        amapInstance.add(marker)
        amapMarkers.push(marker)
    })
}

// 标记点击事件
const onMarkerTap = (e) => {
    const marker = availableValves.value.find((v, idx) => idx === e.detail.markerId)
    if (!marker) return

    toggleValve(marker.device_name)
}

// 切换阀门选择
const toggleValve = (deviceName) => {
    console.log('toggleValve 被调用:', deviceName, '当前选中:', selectedValves.value)
    const index = selectedValves.value.indexOf(deviceName)
    if (index >= 0) {
        selectedValves.value.splice(index, 1)
        console.log('取消选中:', deviceName)
    } else {
        selectedValves.value.push(deviceName)
        console.log('选中:', deviceName)
    }

    console.log('更新后的选中列表:', selectedValves.value)

    // 更新标记
    if (isH5.value) {
        updateAMapMarkers()
    } else {
        updateMarkers()
    }
}

// 全选
const selectAll = () => {
    selectedValves.value = availableValves.value.map(v => v.device_name)
    if (isH5.value) {
        updateAMapMarkers()
    } else {
        updateMarkers()
    }
}

// 清空
const clearAll = () => {
    selectedValves.value = []
    if (isH5.value) {
        updateAMapMarkers()
    } else {
        updateMarkers()
    }
}

// 返回
const goBack = () => {
    uni.navigateBack()
}

// 确认选择
const confirmSelection = () => {
    // 将选中的阀门保存到本地存储
    uni.setStorageSync('valve_map_selected_result', JSON.stringify({
        groupName: groupName.value,
        selectedValves: selectedValves.value
    }))

    // 清除临时数据
    uni.removeStorageSync('valve_map_group_name')
    uni.removeStorageSync('valve_map_available_valves')
    uni.removeStorageSync('valve_map_selected_valves')

    uni.navigateBack({
        delta: 1
    })
}
</script>

<style lang="scss" scoped>
.page {
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    background: #f5f7fa;
}

.header {
    height: 120rpx;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32rpx;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
    z-index: 100;
}

.header-left {
    width: 80rpx;
    display: flex;
    align-items: center;
}

.back-icon {
    font-size: 40rpx;
    color: #303133;
    font-weight: 600;
}

.header-center {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}

.header-right {
    width: 80rpx;
}

.map-container {
    flex: 1;
    width: 100%;
    position: relative;
}

.valve-map {
    width: 100%;
    height: 100%;
}

.amap-container {
    width: 100%;
    height: 100%;
    position: relative;
}

/* 策略向导的蓝色标记样式（已通过injectMarkerStyles注入，这里保留作为备用） */

.bottom-info {
    background: #ffffff;
    padding: 24rpx 32rpx;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.03);
    display: flex;
    flex-direction: column;
    gap: 20rpx;
}

.info-text {
    display: flex;
    align-items: center;
    justify-content: center;
}

.info-actions {
    display: flex;
    gap: 16rpx;
    justify-content: center;
}

.action-btn {
    padding: 20rpx 40rpx;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 120rpx;
}

.action-btn.primary {
    background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.action-btn.success {
    background: linear-gradient(135deg, #67C23A 0%, #85ce61 100%);
}

.action-btn.danger {
    background: linear-gradient(135deg, #F56C6C 0%, #f89898 100%);
}
</style>
