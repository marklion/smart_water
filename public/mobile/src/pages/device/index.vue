<template>
    <view class="page">
        <!-- 顶部标题栏 -->
        <PageHeader ref="pageHeaderRef" :show-farm-selector="true" @farm-change="onFarmChange" />

        <!-- 设备列表 - 使用 scroll-view 支持滚动 -->
        <scroll-view class="device-list-scroll" scroll-y :enable-flex="true" :scroll-with-animation="true">
            <view class="device-list">
                <view class="filter-bar">
                    <view class="filter-main-row">
                        <view class="filter-picker-wrap">
                            <picker mode="selector" :range="deviceTypeOptions" range-key="label" @change="onTypeChange">
                                <view class="filter-pill">
                                    <text class="filter-icon">🔍</text>
                                    <fui-text :text="currentTypeLabel" :size="26" color="#303133"></fui-text>
                                    <text class="picker-arrow">▼</text>
                                </view>
                            </picker>
                        </view>
                        <view class="filter-add-btn" @click="onAddDevice">
                            <text class="filter-add-icon">＋</text>
                            <text class="filter-add-text">添加设备</text>
                        </view>
                    </view>
                    <view class="filter-meta">
                        <fui-text :text="`当前: ${filteredDeviceList.length} / 总计: ${deviceList.length}`" :size="22"
                            color="#909399"></fui-text>
                    </view>
                </view>
                <view v-if="loading && deviceList.length === 0" class="loading-container">
                    <fui-text :text="'加载中...'" :size="28" color="#909399"></fui-text>
                </view>

                <view v-else-if="deviceList.length === 0" class="empty-container">
                    <fui-text :text="'暂无设备'" :size="28" color="#909399"></fui-text>
                    <fui-text :text="emptyMessage" :size="24" color="#C0C4CC"></fui-text>
                </view>

                <view v-else class="device-items">
                    <view v-for="device in filteredDeviceList" :key="device.device_name" class="device-card">
                        <!-- 设备基本信息 -->
                        <view class="device-header">
                            <view class="device-name-row">
                                <view class="device-icon-container">
                                    <image
                                        :src="getDeviceIconPath(device.device_type, device.device_name)"
                                        class="device-icon"
                                        mode="aspectFit"
                                        @error="handleImageError"
                                        @load="handleImageLoad"
                                        :lazy-load="false"
                                    />
                                </view>
                                <view class="device-name-info">
                                    <fui-text :text="device.device_name" :size="32" :fontWeight="600"
                                        color="#303133"></fui-text>
                                </view>
                            </view>
                            <view class="device-meta">
                                <view class="meta-item">
                                    <view class="meta-label">类型</view>
                                    <fui-text :text="getDeviceTypeName(device.device_type)" :size="24"
                                        color="#303133"></fui-text>
                                </view>
                                <view v-if="device.farm_name" class="meta-item">
                                    <view class="meta-label">农场</view>
                                    <fui-text :text="device.farm_name" :size="24" color="#303133"></fui-text>
                                </view>
                                <view v-if="device.block_name" class="meta-item">
                                    <view class="meta-label">区块</view>
                                    <fui-text :text="device.block_name" :size="24" color="#303133"></fui-text>
                                </view>
                                <view v-if="device.longitude || device.latitude" class="meta-item">
                                    <view class="meta-label">经纬度</view>
                                    <fui-text :text="`${device.longitude ?? '-'}, ${device.latitude ?? '-'}`" :size="24"
                                        color="#303133"></fui-text>
                                </view>
                            </view>
                        </view>

                        <!-- 运行时信息 -->
                        <view
                            v-if="(device.runtime_info && device.runtime_info.length > 0) || device.is_online !== undefined"
                            class="runtime-info-section">
                            <view class="runtime-title">
                                <fui-text :text="'运行时信息'" :size="28" :fontWeight="600" color="#303133"></fui-text>
                            </view>
                            <view class="runtime-info-list">
                                <!-- 设备在线状态 -->
                                <view v-if="device.is_online !== undefined" class="runtime-info-item online-status-item"
                                    :class="device.is_online ? 'online' : 'offline'">
                                    <view class="info-label">
                                        <fui-text :text="'是否在线：'" :size="24" color="#606266"></fui-text>
                                    </view>
                                    <view class="info-value" :class="device.is_online ? 'online' : 'offline'">
                                        <fui-text :text="device.is_online ? '在线' : '离线'" :size="24"
                                            :color="device.is_online ? '#67C23A' : '#F56C6C'"></fui-text>
                                    </view>
                                </view>
                                <!-- 其他运行时信息 -->
                                <view v-for="(info, idx) in device.runtime_info" :key="idx" class="runtime-info-item"
                                    :class="getRuntimeInfoItemClass(info)">
                                    <view class="info-label">
                                        <fui-text :text="formatRuntimeTitle(info.title) + '：'" :size="24" color="#606266"></fui-text>
                                    </view>
                                    <view class="info-value" :class="getRuntimeInfoStateClass(info)">
                                        <fui-text :text="getRuntimeInfoDisplayText(info)" :size="24"
                                            :color="getRuntimeInfoValueColor(info)"></fui-text>
                                    </view>
                                </view>
                            </view>
                        </view>

                        <!-- 设备控制区域 -->
                        <view v-if="hasAnyCapability(device)" class="device-control-area">
                            <view class="normal-control-section">
                                <view class="section-header">
                                    <fui-text :text="'设备控制'" :size="26" :fontWeight="600" color="#303133"></fui-text>
                                    <view v-if="getDeviceCapabilities(device).length > 0" class="toggle-capability-btn"
                                        @click="toggleCapabilityVisible(device)">
                                        <fui-text :text="isCapabilityVisible(device) ? '收起动作集' : '显示动作集'" :size="22"
                                            color="#409eff"></fui-text>
                                    </view>
                                </view>

                                <!-- 能力集显示 -->
                                <view v-if="isCapabilityVisible(device)" class="capability-section">
                                    <view class="capability-tags">
                                        <view v-for="cap in getDeviceCapabilities(device)" :key="cap"
                                            class="capability-tag">
                                            <fui-text :text="getCapabilityName(cap)" :size="22"
                                                color="#409eff"></fui-text>
                                        </view>
                                    </view>
                                </view>

                                <!-- 控制按钮 -->
                                <view class="control-buttons">
                                    <view v-for="buttonGroup in getDeviceButtonGroups(device)" :key="buttonGroup.key"
                                        :class="buttonGroup.containerClass">
                                        <view v-for="buttonConfig in buttonGroup.buttons" :key="buttonConfig.key"
                                            class="control-btn"
                                            :class="[buttonConfig.buttonClass, { disabled: !device.is_online || controlLoading[device.device_name] }]"
                                            @click="handleDeviceAction(buttonConfig.action, device)">
                                            <fui-text
                                                :text="controlLoading[device.device_name] ? buttonConfig.loadingText || '操作中...' : buttonConfig.buttonText"
                                                :size="26" color="#ffffff"></fui-text>
                                        </view>
                                    </view>
                                </view>
                            </view>
                        </view>
                    </view>
                </view>
            </view>
        </scroll-view>

        <!-- 添加轮灌阀门弹窗 -->
        <view v-if="showAddValveDialog" class="add-valve-mask">
            <view class="add-valve-modal">
                <view class="add-valve-header">
                    <text class="add-valve-title">添加轮灌组阀门</text>
                    <text class="add-valve-close" @click="closeAddValve">×</text>
                </view>
                <view class="add-valve-body">
                    <view class="form-item">
                        <text class="form-label">所属农场</text>
                        <text class="form-value readonly">{{ addValveForm.farm_name || currentFarmName }}</text>
                    </view>
                    <view class="form-item">
                        <text class="form-label">所属区块</text>
                        <picker mode="selector" :range="blocks" range-key="name" @change="onBlockChange">
                            <view class="picker-field">
                                <text class="picker-text">
                                    {{ addValveForm.block_name || (blocks[0] && blocks[0].name) || '请选择区块' }}
                                </text>
                                <text class="picker-arrow">▼</text>
                            </view>
                        </picker>
                    </view>
                    <view class="form-item">
                        <text class="form-label">设备名称</text>
                        <input class="input-field" v-model="addValveForm.valve_name" placeholder="请输入设备名称" />
                    </view>
                    <view class="form-item">
                        <text class="form-label">驱动类型</text>
                        <picker mode="selector" :range="driverOptions" range-key="label" @change="onDriverChange">
                            <view class="picker-field">
                                <text class="picker-text">{{ addValveForm.driver_name }}</text>
                                <text class="picker-arrow">▼</text>
                            </view>
                        </picker>
                    </view>
                    <view class="form-item">
                        <text class="form-label">token</text>
                        <input class="input-field" v-model="valveConfigForm.token" placeholder="请输入 token" />
                    </view>
                    <view class="form-item">
                        <text class="form-label">device_sn</text>
                        <input class="input-field" v-model="valveConfigForm.device_sn" placeholder="请输入设备序列号" />
                    </view>
                    <view class="form-item switch-item">
                        <text class="form-label">阀门位置</text>
                        <switch :checked="valveConfigForm.is_left" @change="(e) => valveConfigForm.is_left = e.detail.value" />
                        <text class="switch-text">{{ valveConfigForm.is_left ? '左侧阀门' : '右侧阀门' }}</text>
                    </view>
                    <view class="form-row">
                        <view class="form-item half">
                            <text class="form-label">经度</text>
                            <input class="input-field" type="number" v-model.number="addValveForm.longitude"
                                placeholder="经度" />
                        </view>
                        <view class="form-item half">
                            <text class="form-label">纬度</text>
                            <input class="input-field" type="number" v-model.number="addValveForm.latitude"
                                placeholder="纬度" />
                        </view>
                    </view>
                    <view class="form-row">
                        <view class="form-item half">
                            <text class="form-label">开阀压力下限</text>
                            <input class="input-field" type="number"
                                v-model.number="addValveForm.open_pressure_low_limit" placeholder="例如 0.1" />
                        </view>
                        <view class="form-item half">
                            <text class="form-label">关阀压力上限</text>
                            <input class="input-field" type="number"
                                v-model.number="addValveForm.close_pressure_high_limit" placeholder="例如 0.25" />
                        </view>
                    </view>
                    <view class="form-item">
                        <text class="form-label">压力检查周期(秒)</text>
                        <input class="input-field" type="number"
                            v-model.number="addValveForm.pressure_check_interval" placeholder="例如 3" />
                    </view>
                </view>
                <view class="add-valve-footer">
                    <view class="footer-btn cancel" @click="closeAddValve">
                        <text>取消</text>
                    </view>
                    <view class="footer-btn confirm" @click="submitAddValve">
                        <text>确定</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- 加载组件 -->
        <Loading :show="pageLoading" text="加载中..." />
    </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import call_remote from '../../../../lib/call_remote.js'
import fuiText from 'firstui-uni/firstui/fui-text/fui-text.vue'
import PageHeader from '../../components/PageHeader.vue'
import Loading from '../../components/Loading.vue'
import { getDeviceIcon, getDeviceTypeFromName } from '../../config/mapConfig.js'

const deviceList = ref([])
const deviceTypeFilter = ref('')
const loading = ref(false)
const refreshing = ref(false)
const controlLoading = ref({})
const currentFarmName = ref('')
const pageHeaderRef = ref(null)
const pageLoading = ref(false)
const isFirstLoad = ref(true) // 标记是否是首次加载
const capabilityVisibleMap = ref({})

// 添加轮灌阀门相关状态（与 Web 端接口一致）
const showAddValveDialog = ref(false)
const blocks = ref([])
const addValveForm = ref({
    farm_name: '',
    block_name: '',
    valve_name: '',
    driver_name: 'WaterGroupValve',
    valve_config_key: '',
    latitude: null,
    longitude: null,
    open_pressure_low_limit: 0.1,
    close_pressure_high_limit: 0.25,
    pressure_check_interval: 3
})

const valveConfigForm = ref({
    token: '',
    device_sn: '',
    is_left: false
})

// 设备能力按钮映射配置
const deviceCapabilityButtonMapping = {
    open: {
        buttonText: '开启设备',
        buttonClass: 'start-btn',
        action: 'openDevice',
        loadingText: '启动中...',
        description: '打开设备阀门或开关'
    },
    close: {
        buttonText: '关闭设备',
        buttonClass: 'stop-btn',
        action: 'closeDevice',
        loadingText: '停止中...',
        description: '关闭设备阀门或开关'
    },
    readout: {
        buttonText: '读取读数',
        buttonClass: 'read-btn',
        action: 'readDeviceStatus',
        loadingText: '读取中...',
        description: '读取设备当前示数和状态'
    },
    clear_total_readout: {
        buttonText: '清零累计',
        buttonClass: 'stop-btn',
        action: 'clearTotalReadout',
        loadingText: '清零中...',
        description: '将流量计累计流量清零'
    },
}

// 根据设备能力集获取按钮配置（直接使用接口返回的能力集）
const getDeviceButtonConfig = (deviceCapabilities) => {
    if (!Array.isArray(deviceCapabilities)) {
        try {
            deviceCapabilities = JSON.parse(deviceCapabilities)
        } catch (e) {
            return []
        }
    }

    // 定义按钮优先级顺序
    const priorityOrder = ['open', 'close', 'readout', 'clear_total_readout', 'is_opened', 'status_map', 'mock_readout', 'ava_readout', 'total_readout', 'mock_total_readout']

    // 只保留有对应按钮配置的能力
    const availableCapabilities = deviceCapabilities.filter(cap =>
        deviceCapabilityButtonMapping[cap]
    )

    // 按优先级排序
    return availableCapabilities
        .sort((a, b) => {
            const aIndex = priorityOrder.indexOf(a)
            const bIndex = priorityOrder.indexOf(b)
            // 如果不在优先级列表中，排在后面
            if (aIndex === -1 && bIndex === -1) return 0
            if (aIndex === -1) return 1
            if (bIndex === -1) return -1
            return aIndex - bIndex
        })
        .map(capability => ({
            ...deviceCapabilityButtonMapping[capability],
            capability,
            key: capability
        }))
}

// 获取设备按钮分组（开启/关闭/读取放在同一行，其他按钮各自一行）
const getDeviceButtonGroups = (device) => {
    if (!device) return []

    let capabilities = []

    try {
        capabilities = JSON.parse(device.capability || '[]')
    } catch (e) {
        capabilities = (device.capability || '').split(',').map(c => c.trim())
    }

    const buttonConfigs = getDeviceButtonConfig(capabilities)
    const groups = []

    const primaryOrder = ['open', 'close', 'readout']
    const primaryButtons = primaryOrder
        .map(cap => buttonConfigs.find(config => config.capability === cap))
        .filter(Boolean)

    if (primaryButtons.length > 0) {
        groups.push({
            key: 'primary-control-group',
            containerClass: 'control-row',
            buttons: primaryButtons
        })
    }

    // 其他按钮各自一行
    const otherButtons = buttonConfigs.filter(config =>
        !primaryOrder.includes(config.capability)
    )

    otherButtons.forEach(button => {
        groups.push({
            key: `${button.capability}-group`,
            containerClass: 'control-column',
            buttons: [button]
        })
    })

    return groups
}

// 获取设备能力集
const getDeviceCapabilities = (device) => {
    try {
        const caps = JSON.parse(device.capability || '[]')
        return caps.filter(cap => cap !== 'shutdown')
    } catch (e) {
        return []
    }
}

const isCapabilityVisible = (device) => {
    return !!capabilityVisibleMap.value[device.device_name]
}

const toggleCapabilityVisible = (device) => {
    const key = device.device_name
    capabilityVisibleMap.value[key] = !capabilityVisibleMap.value[key]
}

// 空状态提示信息
const emptyMessage = computed(() => {
    return currentFarmName.value
        ? `当前农场 "${currentFarmName.value}" 暂无设备`
        : '请先选择农场或添加设备'
})

// 能力名称映射
const capabilityNameMap = {
    open: '打开',
    close: '关闭',
    readout: '读取',
    is_opened: '状态查询',
    status_map: '状态映射',
    mock_readout: '模拟读数',
    total_readout: '累计读数',
    clear_total_readout: '清零累计',
    mock_total_readout: '模拟累计读数',
    ava_readout: '可用读数'
}

const getCapabilityName = (cap) => {
    return capabilityNameMap[cap] || cap
}

// 运行时信息标题显示映射
const runtimeTitleMap = {
    开关是否打开: '是否打开',
    阀门是否打开: '是否打开',
    当前仪表读数: '当前读数',
    当前仪表累计读数: '累计读数',
    当前压力值: '当前压力'
}

const formatRuntimeTitle = (title = '') => {
    return runtimeTitleMap[title] || title
}

const isSwitchStatusInfo = (info) => {
    return formatRuntimeTitle(info?.title || '') === '是否打开'
}

const normalizeRuntimeBoolean = (value) => {
    const text = String(value ?? '').trim().toLowerCase()
    if (['true', '1', 'yes', 'on', '打开', '在线'].includes(text)) return true
    if (['false', '0', 'no', 'off', '关闭', '离线'].includes(text)) return false
    return null
}

const getRuntimeInfoStateClass = (info) => {
    if (!isSwitchStatusInfo(info)) return ''
    const state = normalizeRuntimeBoolean(info?.text)
    if (state === true) return 'online'
    if (state === false) return 'offline'
    return ''
}

const getRuntimeInfoItemClass = (info) => {
    const stateClass = getRuntimeInfoStateClass(info)
    return {
        'online-status-item': isSwitchStatusInfo(info),
        [stateClass]: !!stateClass
    }
}

const getRuntimeInfoDisplayText = (info) => {
    if (!isSwitchStatusInfo(info)) return info?.text
    const state = normalizeRuntimeBoolean(info?.text)
    if (state === true) return '打开'
    if (state === false) return '关闭'
    return info?.text
}

const getRuntimeInfoValueColor = (info) => {
    const stateClass = getRuntimeInfoStateClass(info)
    if (stateClass === 'online') return '#67C23A'
    if (stateClass === 'offline') return '#F56C6C'
    return '#303133'
}

// 设备类型名称映射
const deviceTypeMap = {
    valve: '阀门',
    flowmeter: '流量计',
    fertilizer: '施肥器',
    sensor: '传感器',
    pump: '泵',
    temperature: '温度传感器',
    humidity: '湿度传感器',
    pressure: '压力计',
    level: '液位计'
}

// 根据 driver_name 进行兜底推断
const inferTypeByDriver = (driverName = '') => {
    const dn = driverName.toLowerCase()
    if (dn.includes('pump')) return 'pump'
    if (dn.includes('flow')) return 'flowmeter'
    if (dn.includes('pressure')) return 'pressure'
    if (dn.includes('valv')) return 'valve'
    return ''
}

const normalizeType = (device) => {
    const t = (device.device_type || '').toLowerCase()
    const driver = device.driver_name || ''
    if (t === 'valva') return 'valve' // 后端拼写错误兜底
    if (t) return t
    const inferred = inferTypeByDriver(driver)
    return inferred || t || ''
}

const getDeviceTypeName = (type) => {
    return deviceTypeMap[type] || type || '未知'
}

const deviceTypeOptions = [
    { label: '全部设备', value: '' },
    { label: '阀门', value: 'valve' },
    { label: '泵', value: 'pump' },
    { label: '流量计', value: 'flowmeter' },
    { label: '压力计', value: 'pressure' },
    { label: '液位计', value: 'level' },
]

const currentTypeLabel = computed(() => {
    const found = deviceTypeOptions.find(opt => opt.value === deviceTypeFilter.value)
    return found ? found.label : '全部设备'
})

const typeStats = computed(() => {
    const stat = {}
    deviceList.value.forEach(d => {
        const key = (d.device_type || d.driver_name || '未知').toLowerCase()
        stat[key] = (stat[key] || 0) + 1
    })
    return stat
})

const filteredDeviceList = computed(() => {
    if (!deviceTypeFilter.value) return deviceList.value
    const target = deviceTypeFilter.value.toLowerCase()
    return deviceList.value.filter(d => {
        const norm = normalizeType(d)
        if (norm) {
            if (target === 'valve') {
                // 阀门兼容 valva/valve
                return norm === 'valve'
            }
            return norm === target
        }
        // 若无类型，再用 driver_name 兜底
        const driver = (d.driver_name || '').toLowerCase()
        return driver.includes(target)
    })
})

const onTypeChange = (e) => {
    const idx = Number(e.detail.value || 0)
    const opt = deviceTypeOptions[idx] || deviceTypeOptions[0]
    deviceTypeFilter.value = opt.value
}

// 加载区块列表
const loadBlocks = async () => {
    if (!currentFarmName.value) {
        blocks.value = []
        return
    }
    try {

        const result = await call_remote('/resource/list_block', {
            farm_name: currentFarmName.value,
            pageNo: 0
        })
        blocks.value = result?.blocks || []
    } catch (error) {
        blocks.value = []
    }
}

// 选择区块
const onBlockChange = (e) => {
    const idx = Number(e.detail.value || 0)
    const block = blocks.value[idx]
    if (block) {
        addValveForm.value.block_name = block.name
    }
}

// 选择驱动
const driverOptions = [
    { label: 'WaterGroupValve', value: 'WaterGroupValve' },
    { label: 'WaterGroupValve_v2', value: 'WaterGroupValve_v2' }
]

const onDriverChange = (e) => {
    const idx = Number(e.detail.value || 0)
    const opt = driverOptions[idx] || driverOptions[0]
    addValveForm.value.driver_name = opt.value
}

// 跳转到添加轮灌阀门页面
const onAddDevice = () => {
    if (!currentFarmName.value) {
        uni.showToast({
            title: '请先选择农场',
            icon: 'none'
        })
        return
    }
    const farmName = encodeURIComponent(currentFarmName.value)
    uni.navigateTo({
        url: `/pages/device/add-valve?farmName=${farmName}`
    })
}

// 提交添加轮灌阀门
const submitAddValve = async () => {
    if (!addValveForm.value.block_name) {
        uni.showToast({ title: '请选择所属区块', icon: 'none' })
        return
    }
    if (!addValveForm.value.valve_name) {
        uni.showToast({ title: '请输入设备名称', icon: 'none' })
        return
    }
    if (!valveConfigForm.value.token || !valveConfigForm.value.device_sn) {
        uni.showToast({ title: '请填写 token 和 device_sn', icon: 'none' })
        return
    }
    try {
        addValveForm.value.valve_config_key = JSON.stringify({
            token: valveConfigForm.value.token,
            device_sn: valveConfigForm.value.device_sn,
            is_left: !!valveConfigForm.value.is_left
        })


        const payload = {
            farm_name: addValveForm.value.farm_name,
            block_name: addValveForm.value.block_name,
            valve_name: addValveForm.value.valve_name,
            driver_name: addValveForm.value.driver_name,
            valve_config_key: addValveForm.value.valve_config_key,
            latitude: addValveForm.value.latitude,
            longitude: addValveForm.value.longitude,
            open_pressure_low_limit: addValveForm.value.open_pressure_low_limit,
            close_pressure_high_limit: addValveForm.value.close_pressure_high_limit,
            pressure_check_interval: addValveForm.value.pressure_check_interval
        }
        const result = await call_remote('/config/add_water_group_valve', payload)
        if (result && result.result) {
            // 保存配置到文件
            await call_remote('/config/save_config', {})
            uni.showToast({ title: '添加成功', icon: 'success' })
            showAddValveDialog.value = false
            await loadDeviceList()
        } else {
            uni.showToast({ title: '添加失败', icon: 'none' })
        }
    } catch (error) {
        uni.showToast({
            title: error.err_msg || '添加失败',
            icon: 'none'
        })
    }
}

const closeAddValve = () => {
    showAddValveDialog.value = false
}

// 获取设备图标路径（使用英文文件名，与天气图标一致）
const getDeviceIconPath = (deviceType, deviceName = '') => {
    // 如果 device_type 不准确，尝试从设备名称推断类型
    let actualType = deviceType
    if (!actualType || actualType === 'valve') {
        const inferredType = getDeviceTypeFromName(deviceName)
        if (inferredType) {
            actualType = inferredType
        }
    }

    if (!actualType) {
        return `/static/deviceIcon/valve.png`
    }

    try {
        const iconName = getDeviceIcon(actualType)
        // 直接使用英文文件名，与天气图标的方式一致
        const iconPath = `/static/deviceIcon/${iconName}.png`
        return iconPath
    } catch (error) {
        return `/static/deviceIcon/valve.png`
    }
}

// 处理图片加载成功
const handleImageLoad = (e) => {
    // 图片加载成功
}

// 处理图片加载错误
const handleImageError = (e) => {
    // 设置默认图标（使用英文文件名）
    if (e.target) {
        e.target.src = '/static/deviceIcon/valve.png'
    }
}


// 检查设备是否有任何能力
const hasAnyCapability = (device) => {
    try {
        const capabilities = JSON.parse(device.capability || '[]')
        return capabilities.length > 0
    } catch (e) {
        return false
    }
}

// 农场切换事件
const onFarmChange = (farmName) => {
    currentFarmName.value = farmName
    loadDeviceList()
}

// 加载设备列表
const loadDeviceList = async () => {
    if (loading.value) return

    loading.value = true
    try {

        const result = await call_remote('/device_management/list_device', {
            pageNo: 0,
            farm_name: currentFarmName.value || undefined
        })

        deviceList.value = result.devices || []
    } catch (error) {
        uni.showToast({
            title: '加载设备列表失败',
            icon: 'none'
        })
    } finally {
        loading.value = false
        refreshing.value = false
    }
}

// 下拉刷新
const onRefresh = async () => {
    refreshing.value = true
    try {
        // 刷新顶部组件
        if (pageHeaderRef.value && pageHeaderRef.value.refresh) {
            await pageHeaderRef.value.refresh()
            currentFarmName.value = pageHeaderRef.value.getCurrentFarmName()
        }
        await loadDeviceList()
    } catch (error) {
        // 刷新失败
    } finally {
        refreshing.value = false
    }
}


// 统一处理设备操作
const handleDeviceAction = async (action, device) => {
    if (!device.is_online || controlLoading.value[device.device_name]) return

    const deviceName = device.device_name

    await executeDeviceAction(action, deviceName)
}

// 执行设备操作
const executeDeviceAction = async (action, deviceName) => {
    controlLoading.value[deviceName] = true
    try {

        let apiPath = ''
        let successMsg = ''

        switch (action) {
            case 'openDevice':
                apiPath = '/device_management/open_device'
                successMsg = '设备启动成功'
                break
            case 'closeDevice':
                apiPath = '/device_management/close_device'
                successMsg = '设备停止成功'
                break
            case 'readDeviceStatus':
                apiPath = '/device_management/readout_device'
                break
            case 'clearTotalReadout': {
                const confirmRes = await new Promise((resolve) => {
                    uni.showModal({
                        title: '清零累计流量',
                        content: `确认将「${deviceName}」累计流量清零吗？`,
                        success: (res) => resolve(res.confirm),
                        fail: () => resolve(false)
                    })
                })
                if (!confirmRes) return
                apiPath = '/device_management/clear_total_readout'
                successMsg = '累计流量已清零'
                break
            }
            default:
                throw new Error('未知的操作类型')
        }

        const result = await call_remote(apiPath, { device_name: deviceName })

        if (action === 'readDeviceStatus') {
            uni.showToast({
                title: `设备读数: ${result.readout !== null && result.readout !== undefined ? result.readout : '无读数'}`,
                icon: 'none',
                duration: 3000
            })
        } else {
            uni.showToast({
                title: successMsg,
                icon: 'success'
            })
        }

        // 刷新设备状态
        setTimeout(() => {
            loadDeviceList()
        }, 500)
    } catch (error) {
        uni.showToast({
            title: error.err_msg || '操作失败',
            icon: 'none',
            duration: 2000
        })
    } finally {
        controlLoading.value[deviceName] = false
    }
}

// 页面显示时加载/刷新数据
onShow(async () => {
    // 检查登录状态
    // 首次加载时显示全屏加载动画
    if (isFirstLoad.value) {
        pageLoading.value = true
        isFirstLoad.value = false
    }

    try {
        // 等待顶部组件加载完成，获取当前农场名称
        if (pageHeaderRef.value) {
            await pageHeaderRef.value.refresh()
            currentFarmName.value = pageHeaderRef.value.getCurrentFarmName()
        }
        await loadDeviceList()
    } catch (error) {
        // 加载数据失败
    } finally {
        if (pageLoading.value) {
            // 延迟一下再隐藏加载，确保数据已经渲染
            setTimeout(() => {
                pageLoading.value = false
            }, 300)
        }
    }
})
</script>

<style lang="scss" scoped>
.page {
    height: 100vh;
    width: 100vw;
    background: linear-gradient(180deg, #f0f4f8 0%, #e8edf2 50%, #dde5ec 100%);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
}

/* 添加轮灌阀门弹窗样式 */
.add-valve-mask {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.add-valve-modal {
    width: 90vw;
    max-width: 700rpx;
    max-height: 90vh;
    background: #ffffff;
    border-radius: 24rpx;
    box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.18);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.add-valve-header {
    padding: 24rpx 32rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #ebeef5;
}

.add-valve-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #303133;
}

.add-valve-close {
    font-size: 32rpx;
    color: #909399;
    padding: 8rpx 16rpx;
}

.add-valve-body {
    padding: 24rpx 32rpx 16rpx;
    flex: 1;
    overflow-y: auto;
}

.add-valve-footer {
    padding: 16rpx 24rpx 24rpx;
    display: flex;
    justify-content: flex-end;
    gap: 16rpx;
    border-top: 1px solid #ebeef5;
    background: #fafafa;
}

.footer-btn {
    min-width: 160rpx;
    padding: 18rpx 32rpx;
    border-radius: 999rpx;
    text-align: center;
}

.footer-btn.cancel {
    background: #ffffff;
    border: 1px solid #dcdfe6;
    color: #606266;
}

.footer-btn.confirm {
    background: #409eff;
    color: #ffffff;
}

.form-item {
    margin-bottom: 18rpx;
}

.form-row {
    display: flex;
    justify-content: space-between;
    gap: 16rpx;
}

.form-item.half {
    flex: 1;
}

.form-label {
    font-size: 24rpx;
    color: #606266;
    margin-bottom: 8rpx;
    display: block;
}

.form-value.readonly {
    font-size: 26rpx;
    color: #303133;
}

.input-field {
    width: 100%;
    padding: 16rpx 20rpx;
    border-radius: 12rpx;
    border: 1px solid #dcdfe6;
    font-size: 26rpx;
    box-sizing: border-box;
}

.picker-field {
    width: 100%;
    padding: 16rpx 20rpx;
    border-radius: 12rpx;
    border: 1px solid #dcdfe6;
    display: flex;
    align-items: center;
}

.picker-text {
    font-size: 26rpx;
    color: #303133;
}

.switch-item {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.switch-text {
    font-size: 24rpx;
    color: #606266;
}

.filter-bar {
    padding: 8rpx 24rpx 0;
    box-sizing: border-box;
    position: sticky;
    top: 0;
    z-index: 20;
    background: #f0f4f8;
}

.filter-main-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.filter-picker-wrap {
    flex: 1;
}

.filter-title {
    margin-bottom: 4rpx;
}

.filter-pill {
    display: flex;
    align-items: center;
    gap: 12rpx;
    background: #ffffff;
    border-radius: 999rpx;
    padding: 16rpx 24rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.05);
    font-size: 28rpx;
    color: #303133;
}

.filter-icon {
    font-size: 28rpx;
    color: #909399;
}

.picker-arrow {
    font-size: 26rpx;
    color: #909399;
    margin-left: auto;
}

.filter-add-btn {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 14rpx 18rpx;
    border-radius: 999rpx;
    background: linear-gradient(135deg, #409eff, #67c23a);
    box-shadow: 0 6rpx 14rpx rgba(64, 158, 255, 0.28);
    flex-shrink: 0;
}

.filter-add-icon {
    font-size: 28rpx;
    color: #ffffff;
    font-weight: 700;
    line-height: 1;
}

.filter-add-text {
    font-size: 22rpx;
    color: #ffffff;
    font-weight: 500;
    line-height: 1;
}

.filter-meta {
    margin-top: 8rpx;
}

/* 设备列表滚动区域 - scroll-view 需要明确高度 */
.device-list-scroll {
    flex: 1;
    position: relative;
    margin-top: calc(var(--status-bar-height, 0px) + 96rpx);
    padding-bottom: env(safe-area-inset-bottom);
    overflow: hidden;
    box-sizing: border-box;
    width: 100%;
    margin-left: 0;
    margin-right: 0;
    padding-left: 0;
    padding-right: 0;
}

/* #ifdef H5 */
.device-list-scroll {
    padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}
/* #endif */

/* 设备列表 */
.device-list {
    padding: 8rpx 24rpx 32rpx;
    box-sizing: border-box;
    padding-bottom: 0;
}

.loading-container,
.empty-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 120rpx 40rpx;
    gap: 24rpx;
}


.loading-container fui-text,
.empty-container fui-text {
    opacity: 0.8;
}

.empty-container fui-text:last-child {
    margin-top: 8rpx;
    opacity: 0.6;
}

.device-items {
    display: flex;
    flex-direction: column;
    gap: 28rpx;
}

/* 设备卡片 */
.device-card {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 36rpx;
    box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.08), 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.device-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4rpx;
    background: linear-gradient(90deg, #409eff 0%, #67c23a 100%);
    opacity: 0.6;
}

.device-header {
    margin-bottom: 24rpx;
}

.device-name-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 20rpx;
    flex-wrap: wrap;
}

.device-icon-container {
    width: 64rpx;
    height: 64rpx;
    min-width: 64rpx;
    min-height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: linear-gradient(135deg, #f0f4f8 0%, #e8edf2 100%);
    border-radius: 16rpx;
    padding: 8rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
    overflow: visible;
    position: relative;
    border: 1px solid rgba(0, 0, 0, 0.05);
}

.device-icon {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    display: block;
    flex-shrink: 0;
    background: transparent;
}

.device-name-info {
    flex: 1;
    min-width: 0;
}

.device-meta {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8rpx 12rpx;
    padding-left: 4rpx;
}

.meta-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6rpx;
    min-width: 0;
}

.meta-label {
    font-size: 24rpx;
    color: #909399;
    min-width: 0;
    font-weight: 500;
}

.device-meta fui-text {
    line-height: 1.6;
    width: 100%;
    word-break: break-all;
}

/* 运行时信息 */
.runtime-info-section {
    margin-top: 28rpx;
    margin-bottom: 24rpx;
    padding: 28rpx;
    background: linear-gradient(135deg, #f8fafc 0%, #f0f4f8 100%);
    border-radius: 18rpx;
    border: 1px solid rgba(64, 158, 255, 0.12);
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04), inset 0 1rpx 0 rgba(255, 255, 255, 0.8);
    position: relative;
    overflow: hidden;
}

.runtime-info-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3rpx;
    background: linear-gradient(90deg, #409eff 0%, #67c23a 50%, #409eff 100%);
    background-size: 200% 100%;
    animation: gradient-shift 3s ease infinite;
}

@keyframes gradient-shift {

    0%,
    100% {
        background-position: 0% 50%;
    }

    50% {
        background-position: 100% 50%;
    }
}

.runtime-title {
    padding-bottom: 16rpx;
    margin-bottom: 20rpx;
    border-bottom: 2px solid rgba(64, 158, 255, 0.15);
    position: relative;
}

.runtime-title::after {
    content: '';
    position: absolute;
    bottom: -2rpx;
    left: 0;
    width: 80rpx;
    height: 2rpx;
    background: linear-gradient(90deg, #409eff 0%, transparent 100%);
}

.runtime-info-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12rpx;
}

.runtime-info-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8rpx;
    padding: 16rpx 20rpx;
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.03);
    border-radius: 12rpx;
    min-width: 0;
}

.runtime-info-item.online-status-item {
    background: #ffffff;
    border-color: rgba(64, 158, 255, 0.15);
}

.runtime-info-item.online-status-item.online {
    background: linear-gradient(135deg, #f0f9ff 0%, #e8f5e9 100%);
    border-color: rgba(103, 194, 58, 0.25);
}

.runtime-info-item.online-status-item.offline {
    background: linear-gradient(135deg, #fff5f5 0%, #ffeaea 100%);
    border-color: rgba(245, 108, 108, 0.25);
}

.info-label {
    display: flex;
    align-items: center;
    gap: 12rpx;
    flex: 1;
    min-width: 0;
    width: auto;
}

.info-value {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: auto;
    min-width: 80rpx;
    margin-left: 12rpx;
    padding-left: 0;
}

.info-value.online {
    color: #67C23A;
}

.info-value.offline {
    color: #F56C6C;
}

.runtime-info-item fui-text {
    line-height: 1.6;
    word-break: break-all;
}

.info-label fui-text {
    color: #606266;
    font-weight: 500;
    white-space: nowrap;
}

.info-value fui-text {
    font-weight: 600;
    text-align: right;
}

/* 设备控制区域 */
.device-control-area {
    margin-top: 24rpx;
    display: flex;
    flex-direction: column;
    gap: 20rpx;
}

.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16rpx;
}

.toggle-capability-btn {
    padding: 8rpx 16rpx;
    border: 1px solid rgba(64, 158, 255, 0.45);
    border-radius: 18rpx;
    background: rgba(64, 158, 255, 0.08);
}

/* 普通控制区域 */
.normal-control-section {
    padding: 24rpx;
    background: #ffffff;
    border-radius: 16rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.06);
}

.capability-section {
    margin-bottom: 20rpx;
    padding: 0;
}

.capability-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
}

.capability-tag {
    padding: 8rpx 20rpx;
    background: transparent;
    border: 1px solid rgba(64, 158, 255, 0.4);
    border-radius: 20rpx;
    box-shadow: none;
}

.capability-tag fui-text {
    color: #409eff !important;
}

.control-buttons {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    align-items: flex-start;
}

.control-row {
    display: flex;
    gap: 16rpx;
    width: 100%;
}

.control-column {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
}

.control-btn {
    padding: 16rpx 30rpx;
    border-radius: 16rpx;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    font-weight: 500;
    letter-spacing: 0.5rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
    white-space: nowrap;
}

.control-row .control-btn {
    flex: 1;
}

.control-column .control-btn {
    width: auto;
    min-width: 480rpx;
}

.control-btn::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
}

.control-btn:active:not(.disabled)::before {
    width: 300rpx;
    height: 300rpx;
}

.start-btn {
    background: #67C23A;
    box-shadow: 0 4rpx 12rpx rgba(103, 194, 58, 0.4);
}

.start-btn:active:not(.disabled) {
    background: #529b2e;
    box-shadow: 0 2rpx 8rpx rgba(103, 194, 58, 0.3);
    transform: translateY(1rpx);
}

.stop-btn {
    background: #E6A23C;
    box-shadow: 0 4rpx 12rpx rgba(230, 162, 60, 0.4);
}

.stop-btn:active:not(.disabled) {
    background: #c88a2a;
    box-shadow: 0 2rpx 8rpx rgba(230, 162, 60, 0.3);
    transform: translateY(1rpx);
}

.read-btn {
    background: #409eff;
    box-shadow: 0 4rpx 12rpx rgba(64, 158, 255, 0.4);
}

.read-btn:active:not(.disabled) {
    background: #337ecc;
    box-shadow: 0 2rpx 8rpx rgba(64, 158, 255, 0.3);
    transform: translateY(1rpx);
}

.control-btn.disabled {
    background: #c0c4cc;
    box-shadow: none;
    opacity: 0.6;
    cursor: not-allowed;
}

.control-btn fui-text {
    position: relative;
    z-index: 1;
}

/* 响应式调整 */
@media (max-width: 375px) {
    .header {
        padding: 40rpx 32rpx 24rpx 32rpx;
    }

    .farm-selector-section {
        padding: 24rpx 32rpx;
    }

    .device-list {
        padding: 24rpx;
    }

    .device-card {
        padding: 28rpx;
        border-radius: 16rpx;
    }

    .device-name-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 16rpx;
    }

    .control-btn {
        padding: 14rpx 20rpx;
    }
}
</style>
