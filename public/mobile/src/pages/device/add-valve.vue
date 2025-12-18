<template>
    <view class="add-valve-page">
        <!-- 自定义导航栏 -->
        <view class="nav-bar">
            <view class="nav-left" @click="goBack">
                <text class="back-icon">‹</text>
                <text class="back-text">返回</text>
            </view>
            <view class="nav-title">添加轮灌组阀门</view>
            <view class="nav-right"></view>
        </view>

        <!-- 表单内容 -->
        <scroll-view class="form-scroll" scroll-y>
            <view class="form-container">
                <!-- 基本信息 -->
                <view class="section-card">
                    <view class="section-header">
                        <text class="section-title">基本信息</text>
                    </view>
                    <view class="form-item">
                        <text class="form-label">所属农场</text>
                        <text class="form-value readonly">{{ addValveForm.farm_name }}</text>
                    </view>

                <view class="form-item">
                    <text class="form-label">所属区块</text>
                    <picker mode="selector" :range="blocks" range-key="name" @change="onBlockChange">
                        <view class="picker-field">
                            <text class="picker-text">
                                {{ addValveForm.block_name || (blocks[0] && blocks[0].name) || '请选择区块' }}
                            </text>
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
                        </view>
                    </picker>
                </view>
                </view>

                <!-- 设备配置 -->
                <view class="section-card">
                    <view class="section-header">
                        <text class="section-title">设备配置</text>
                    </view>

                    <view class="form-item">
                        <text class="form-label">密钥</text>
                        <input class="input-field" v-model="valveConfigForm.token" placeholder="请输入 token" />
                    </view>

                    <view class="form-item">
                        <text class="form-label">device_sn</text>
                        <input class="input-field" v-model="valveConfigForm.device_sn" placeholder="请输入设备序列号" />
                    </view>

                    <view class="form-item switch-item">
                        <text class="form-label">左侧阀门</text>
                        <switch :checked="valveConfigForm.is_left" @change="(e) => valveConfigForm.is_left = e.detail.value" />
                        <text class="switch-text">{{ valveConfigForm.is_left ? '左侧阀门' : '右侧阀门' }}</text>
                    </view>

                    <view class="form-item">
                        <text class="form-label">轮询间隔(ms)</text>
                        <input class="input-field" type="number" v-model.number="valveConfigForm.poll_interval"
                            placeholder="例如 5000" />
                    </view>
                </view>

                <!-- 位置与压力参数 -->
                <view class="section-card">
                    <view class="section-header">
                        <text class="section-title">位置与压力参数</text>
                    </view>

                    <view class="form-row">
                        <view class="form-item half">
                            <text class="form-label">经度（-180~180）</text>
                            <input class="input-field" type="number" v-model.number="addValveForm.longitude"
                                placeholder="如 111.670801" />
                        </view>
                        <view class="form-item half">
                            <text class="form-label">纬度（-90~90）</text>
                            <input class="input-field" type="number" v-model.number="addValveForm.latitude"
                                placeholder="如 40.818311" />
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
            </view>
        </scroll-view>

        <!-- 底部按钮 -->
        <view class="page-footer">
            <view class="footer-btn cancel" @click="goBack">
                <text>取消</text>
            </view>
            <view class="footer-btn confirm" @click="submitAddValve">
                <text>确定</text>
            </view>
        </view>
    </view>

</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import call_remote from '../../../../lib/call_remote.js'

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
    is_left: false,
    poll_interval: 5000
})

const blocks = ref([])

const driverOptions = [
    { label: 'WaterGroupValve', value: 'WaterGroupValve' },
    { label: 'WaterGroupValve_v2', value: 'WaterGroupValve_v2' }
]

const loadBlocks = async () => {
    if (!addValveForm.value.farm_name) {
        blocks.value = []
        return
    }
    try {
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        const result = await call_remote('/resource/list_block', {
            farm_name: addValveForm.value.farm_name,
            pageNo: 0
        }, token)
        blocks.value = result?.blocks || []
    } catch (e) {
        blocks.value = []
    }
}

onLoad((options) => {
    const farmName = options?.farmName || ''
    addValveForm.value.farm_name = farmName
    loadBlocks()
})

const onBlockChange = (e) => {
    const idx = Number(e.detail.value || 0)
    const block = blocks.value[idx]
    if (block) {
        addValveForm.value.block_name = block.name
    }
}

const onDriverChange = (e) => {
    const idx = Number(e.detail.value || 0)
    const opt = driverOptions[idx] || driverOptions[0]
    addValveForm.value.driver_name = opt.value
}

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
            is_left: !!valveConfigForm.value.is_left,
            poll_interval: Number(valveConfigForm.value.poll_interval) || 5000
        })

        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        const payload = {
            farm_name: addValveForm.value.farm_name,
            block_name: addValveForm.value.block_name,
            valve_name: addValveForm.value.valve_name,
            driver_name: addValveForm.value.driver_name,
            valve_config_key: addValveForm.value.valve_config_key,
            longitude: addValveForm.value.longitude,
            latitude: addValveForm.value.latitude,
            open_pressure_low_limit: addValveForm.value.open_pressure_low_limit,
            close_pressure_high_limit: addValveForm.value.close_pressure_high_limit,
            pressure_check_interval: addValveForm.value.pressure_check_interval
        }
        await call_remote('/config/add_water_group_valve', payload, token)
        // 保存配置到文件
        await call_remote('/config/save_config', {}, token)
        
        uni.showToast({ 
            title: '添加成功', 
            icon: 'success',
            duration: 1500
        })
        
        // 等待 toast 显示完成后返回
        setTimeout(() => {
            uni.switchTab({
                url: '/pages/device/index'
            })
        }, 1800)
    } catch (error) {
        console.error('添加设备失败:', error)
        uni.showToast({
            title: error.err_msg || error.message || '添加失败',
            icon: 'none',
            duration: 2000
        })
    }
}

const goBack = () => {
    // 返回到设备页面（tabBar页面需要使用 switchTab）
    uni.switchTab({
        url: '/pages/device/index'
    })
}
</script>

<style lang="scss" scoped>
.add-valve-page {
    height: 100vh;
    width: 100vw;
    background: linear-gradient(180deg, #f0f4f8 0%, #e8edf2 50%, #dde5ec 100%);
    position: relative;
    overflow: visible;
}

.nav-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 88rpx;
    padding-top: env(safe-area-inset-top);
    padding-left: 24rpx;
    padding-right: 24rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #ffffff;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
    z-index: 20;
}

.nav-left {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 10rpx;
    margin: -10rpx;
    cursor: pointer;
}

.nav-left:active {
    opacity: 0.6;
}

.back-icon {
    font-size: 34rpx;
    color: #409eff;
}

.back-text {
    font-size: 26rpx;
    color: #409eff;
}

.nav-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #303133;
}

.nav-right {
    width: 60rpx;
}

.form-scroll {
    position: absolute;
    top: calc(88rpx + env(safe-area-inset-top));
    bottom: calc(120rpx + env(safe-area-inset-bottom));
    left: 0;
    right: 0;
    padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
    height: calc(100vh - (88rpx + env(safe-area-inset-top)) - (120rpx + env(safe-area-inset-bottom)));
}

.form-container {
    padding: 16rpx 16rpx 24rpx;
    box-sizing: border-box;
}

.section-card {
    background: #ffffff;
    border-radius: 18rpx;
    padding: 18rpx 18rpx 10rpx;
    margin-bottom: 16rpx;
    box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.04);
}

.section-header {
    margin-bottom: 12rpx;
}

.section-title {
    font-size: 26rpx;
    font-weight: 600;
    color: #303133;
}

.form-item {
    margin-bottom: 10rpx;
    width: 100%;
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
    min-height: 64rpx;
    padding: 16rpx 18rpx;
    border-radius: 10rpx;
    border: 1px solid #dcdfe6;
    font-size: 26rpx;
    box-sizing: border-box;
    background: #ffffff;
}

.picker-field {
    min-height: 52rpx;
    padding: 10rpx 10rpx;
    border-radius: 10rpx;
    border: 1px solid #dcdfe6;
    display: flex;
    align-items: center;
    background: #ffffff;
}

.picker-text {
    font-size: 24rpx;
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


.page-footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 12rpx 24rpx calc(24rpx + env(safe-area-inset-bottom));
    background: #ffffff;
    display: flex;
    justify-content: flex-end;
    gap: 16rpx;
    box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.06);
    z-index: 10;
    z-index: 20;
}

.footer-btn {
    min-width: 160rpx;
    padding: 18rpx 32rpx;
    border-radius: 999rpx;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
}

.footer-btn:active {
    transform: scale(0.96);
    opacity: 0.8;
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
</style>

