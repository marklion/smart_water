<template>
    <view class="page">
        <!-- 顶部标题栏 -->
        <PageHeader ref="pageHeaderRef" :show-farm-selector="true" @farm-change="onFarmChange" />
        <view class="top-add-btn" @click="openCreateForm(false)">
            <text class="plus-icon">+</text>
        </view>

        <!-- 主要内容区域 - 使用 scroll-view 支持滚动 -->
        <scroll-view class="content-scroll" scroll-y :enable-flex="true" :scroll-with-animation="true">
            <view class="content">
                <WeatherCard />

                <view class="section-title-row">
                    <fui-text :text="'轮灌组运行状态'" :size="30" :fontWeight="600" color="#303133"></fui-text>
                </view>

                <view v-if="loading" class="loading-block">
                    <fui-text :text="'加载中...'" :size="28" color="#606266"></fui-text>
                </view>
                <view v-else-if="groups.length === 0" class="empty-block">
                    <image class="empty-icon" src="/static/tabbar/Irrigation.png" mode="widthFix" />
                    <fui-text :text="'暂无轮灌组，请先新增或在PC配置后刷新'" :size="26" color="#909399"></fui-text>
                </view>
                <view v-else class="group-list">
                    <view v-for="group in groups" :key="group.name" class="group-card">
                        <view class="group-header">
                            <view class="group-title">
                                <fui-text :text="group.name" :size="32" :fontWeight="600" color="#303133"></fui-text>
                                <view class="view-config-btn" @click="viewPolicyConfig(group.name)">
                                    <text class="eye-icon">👁</text>
                                </view>
                            </view>
                            <view class="group-state" :class="statusClass(group.cur_state)">
                                <fui-text :text="group.cur_state || '未知'" :size="22" color="#fff"></fui-text>
                            </view>
                        </view>
                        <view class="group-meta">
                            <view class="meta-item">
                                <view class="meta-label">面积(亩)</view>
                                <fui-text :text="formatNumber(group.area)" :size="24" color="#303133"></fui-text>
                            </view>
                            <view class="meta-item">
                                <view class="meta-label">方式</view>
                                <fui-text :text="group.method || '-'" :size="24" color="#303133"></fui-text>
                            </view>
                            <view class="meta-item">
                                <view class="meta-label">施肥率(L/亩)</view>
                                <fui-text :text="formatNumber(group.fert_rate)" :size="24" color="#303133"></fui-text>
                            </view>
                        </view>
                        <view class="group-meta">
                            <view class="meta-item">
                                <view class="meta-label">总水量(L)</view>
                                <fui-text :text="formatNumber(group.total_water)" :size="24" color="#303133"></fui-text>
                            </view>
                            <view class="meta-item">
                                <view class="meta-label">总肥量(L)</view>
                                <fui-text :text="formatNumber(group.total_fert)" :size="24" color="#303133"></fui-text>
                            </view>
                            <view class="meta-item">
                                <view class="meta-label">剩余时间(分)</view>
                                <fui-text :text="formatNumber(group.minute_left)" :size="24" color="#303133"></fui-text>
                            </view>
                        </view>
                        <view class="valves-row">
                            <view class="meta-label">阀门</view>
                            <view class="valves-tags" v-if="group.valveList.length">
                                <view v-for="(v, idx) in group.valveList" :key="idx" class="valve-tag">{{ v }}</view>
                            </view>
                            <fui-text v-else :text="'-'" :size="24" color="#909399"></fui-text>
                        </view>

                        <view class="card-actions">
                            <view class="water-only-btn"
                                :class="{ active: waterOnlyMode[group.name], loading: waterOnlyLoading[group.name] }"
                                @click="handleWaterOnlyToggle(group.name)">
                                <fui-text :text="waterOnlyMode[group.name] ? '只浇水 ✓' : '只浇水'" :size="24"
                                    :color="waterOnlyMode[group.name] ? '#fff' : '#67C23A'"></fui-text>
                            </view>
                            <view class="action-buttons-row">
                                <view class="action-btn success" @click="handleQuickAction(group.name, '启动')"
                                    :class="{ loading: quickActionLoading[`${group.name}-启动`] }">
                                    <fui-text :text="'启动'" :size="24" color="#fff"></fui-text>
                                </view>
                                <view class="action-btn warning" @click="handleQuickAction(group.name, '跳过')"
                                    :class="{ loading: quickActionLoading[`${group.name}-跳过`] }">
                                    <fui-text :text="'跳过'" :size="24" color="#fff"></fui-text>
                                </view>
                            </view>
                            <view class="action-btn danger" @click="handleQuickAction(group.name, '停止')"
                                :class="{ loading: quickActionLoading[`${group.name}-停止`] }">
                                <fui-text :text="'停止'" :size="24" color="#fff"></fui-text>
                            </view>
                        </view>
                    </view>
                </view>
            </view>
        </scroll-view>

        <!-- 轮灌组向导弹层 -->
        <view v-if="formVisible" class="form-mask" @click.self="closeForm">
            <view class="form-panel wide">
                <view class="form-header">
                    <fui-text :text="formMode === 'copy' ? '复制轮灌组' : '新增轮灌组'" :size="30" :fontWeight="600"
                        color="#303133"></fui-text>
                    <view class="close" @click="closeForm">×</view>
                </view>

                <view class="step-indicator">
                    <view :class="['step-dot', wizardStep === 1 ? 'active' : '']">1</view>
                    <view class="step-label">基础信息</view>
                    <view class="step-line"></view>
                    <view :class="['step-dot', wizardStep === 2 ? 'active' : '']">2</view>
                    <view class="step-label">分配阀门</view>
                    <view class="step-line"></view>
                    <view :class="['step-dot', wizardStep === 3 ? 'active' : '']">3</view>
                    <view class="step-label">确认下发</view>
                </view>

                <view class="form-body">
                    <!-- Step 1 基础信息 -->
                    <view v-if="wizardStep === 1" class="step-content step-page">
                        <view class="form-item">
                            <view class="form-label">名称</view>
                            <input class="form-input" v-model="formData.name" placeholder="请输入轮灌组名称" />
                        </view>
                        <view class="form-item">
                            <view class="form-label">面积(亩)</view>
                            <view class="inline-row">
                                <input class="form-input flex-1" v-model.number="formData.area" type="number"
                                    placeholder="必填，>0" />
                                <view v-if="suggestedArea" class="suggest-btn" @click="useSuggestedArea">
                                    <text>用建议值({{ suggestedArea }})</text>
                                </view>
                            </view>
                        </view>
                        <view class="form-item">
                            <view class="form-label">灌溉方式</view>
                            <picker mode="selector" :range="methodOptions" range-key="label" @change="onMethodChange">
                                <view class="picker-value">{{ getMethodLabel(formData.method) }}</view>
                            </picker>
                        </view>
                        <view class="form-item">
                            <view class="form-label">亩定量(L/亩)</view>
                            <input class="form-input" v-model.number="formData.AB_fert" type="number"
                                placeholder="方法为定量时必填" />
                        </view>
                        <view class="form-item">
                            <view class="form-label">总定量(L)</view>
                            <input class="form-input" v-model.number="formData.total_fert" type="number"
                                placeholder="方法为总定量时必填" />
                        </view>
                        <view class="form-item">
                            <view class="form-label">定时(分钟)</view>
                            <input class="form-input" v-model.number="formData.fert_time" type="number"
                                placeholder="方法为定时时必填" />
                        </view>
                        <view class="form-item">
                            <view class="form-label">肥后时间(分钟)</view>
                            <input class="form-input" v-model.number="formData.post_fert_time" type="number"
                                placeholder="可选，默认0" />
                        </view>
                        <view class="form-item">
                            <view class="form-label">总时间(分钟)</view>
                            <input class="form-input" v-model.number="formData.total_time" type="number"
                                placeholder="必填，>0" />
                        </view>
                    </view>

                    <!-- Step 2 分配阀门 -->
                    <view v-else-if="wizardStep === 2" class="step-content step-page">
                        <view class="form-item">
                            <view class="form-label">分配阀门</view>
                            <view class="tabs">
                                <view :class="['tab', valveView === 'list' ? 'active' : '']"
                                    @click="valveView = 'list'">
                                    列表
                                </view>
                                <view :class="['tab', valveView === 'map' ? 'active' : '']" @click="valveView = 'map'">
                                    地图
                                </view>
                            </view>
                            <view class="tips-text">从 WaterGroupValve / WaterGroupValve_v2 设备中选择，至少1个。</view>
                        </view>
                        <view v-if="valveLoading" class="loading-block small">
                            <fui-text :text="'加载阀门设备中...'" :size="26" color="#606266"></fui-text>
                        </view>
                        <view v-else-if="availableValves.length === 0" class="empty-block small">
                            <fui-text :text="'暂无可选阀门，请先在设备里配置 WaterGroupValve 类设备'" :size="24"
                                color="#909399"></fui-text>
                        </view>
                        <template v-else>
                            <view v-if="valveView === 'list'" class="valve-list">
                                <view v-for="v in availableValves" :key="v.device_name" class="valve-item"
                                    :class="{ checked: isValveSelected(v.device_name) }"
                                    @click="toggleValve(v.device_name)">
                                    <view class="valve-name">{{ v.device_name }}</view>
                                    <view class="valve-meta">经纬度: {{ v.longitude || '-' }}, {{ v.latitude || '-' }}
                                    </view>
                                    <view class="check-indicator">{{ isValveSelected(v.device_name) ? '✓' : '' }}</view>
                                </view>
                            </view>
                            <view v-else class="map-wrapper">
                                <map class="valve-map" :latitude="mapCenter.lat" :longitude="mapCenter.lng"
                                    :scale="mapScale" :markers="mapMarkers" @markertap="onMarkerTap"></map>
                                <view class="map-legend">点击标记以选择/取消阀门</view>
                            </view>
                        </template>
                    </view>

                    <!-- Step 3 确认 -->
                    <view v-else class="step-content step-page">
                        <view class="form-item">
                            <view class="form-label">开始时间</view>
                            <picker mode="time" :value="startTime" @change="onTimeChange">
                                <view class="picker-value">{{ startTime }}</view>
                            </picker>
                        </view>
                        <view class="summary-card">
                            <view class="summary-row">
                                <view class="summary-label">名称</view>
                                <view class="summary-value">{{ formData.name || '-' }}</view>
                            </view>
                            <view class="summary-row">
                                <view class="summary-label">面积(亩)</view>
                                <view class="summary-value">{{ formData.area || '-' }}</view>
                            </view>
                            <view class="summary-row">
                                <view class="summary-label">方式</view>
                                <view class="summary-value">{{ getMethodLabel(formData.method) }}</view>
                            </view>
                            <view class="summary-row">
                                <view class="summary-label">亩定量</view>
                                <view class="summary-value">{{ formData.AB_fert ?? '-' }}</view>
                            </view>
                            <view class="summary-row">
                                <view class="summary-label">总定量</view>
                                <view class="summary-value">{{ formData.total_fert ?? '-' }}</view>
                            </view>
                            <view class="summary-row">
                                <view class="summary-label">定时</view>
                                <view class="summary-value">{{ formData.fert_time ?? '-' }}</view>
                            </view>
                            <view class="summary-row">
                                <view class="summary-label">肥后时间</view>
                                <view class="summary-value">{{ formData.post_fert_time ?? 0 }}</view>
                            </view>
                            <view class="summary-row">
                                <view class="summary-label">总时间</view>
                                <view class="summary-value">{{ formData.total_time ?? '-' }}</view>
                            </view>
                            <view class="summary-row">
                                <view class="summary-label">阀门</view>
                                <view class="summary-tags" v-if="selectedValves.length">
                                    <view v-for="v in selectedValves" :key="v" class="valve-tag small">{{ v }}</view>
                                </view>
                                <view class="summary-value" v-else>-</view>
                            </view>
                        </view>
                    </view>
                </view>

                <view class="form-actions fixed">
                    <view class="action-btn ghost" @click="closeForm">
                        <fui-text :text="'关闭'" :size="28" color="#606266"></fui-text>
                    </view>
                    <view v-if="wizardStep > 1" class="action-btn ghost" @click="prevWizardStep">
                        <fui-text :text="'上一步'" :size="28" color="#606266"></fui-text>
                    </view>
                    <view v-if="wizardStep < 3" class="action-btn primary" :class="{ disabled: submitting }"
                        @click="nextWizardStep">
                        <fui-text :text="submitting ? '处理中...' : '下一步'" :size="28" color="#fff"></fui-text>
                    </view>
                    <view v-else class="action-btn primary" :class="{ disabled: submitting }" @click="submitForm">
                        <fui-text :text="submitting ? '下发中...' : '下发策略'" :size="28" color="#fff"></fui-text>
                    </view>
                </view>
            </view>
        </view>

        <!-- 加载组件 -->
        <Loading :show="pageLoading" text="加载中..." />

        <!-- 策略配置查看对话框 -->
        <fui-dialog :show="showPolicyConfigDialog" :title="policyConfigTitle" :buttons="policyConfigButtons"
            :maskClosable="true" @click="handlePolicyConfigDialogClick" @close="closePolicyConfigDialog">
            <view class="policy-config-content">
                <view v-if="policyConfigLoading" class="config-loading">
                    <fui-text :text="'加载中...'" :size="28" color="#909399"></fui-text>
                </view>
                <view v-else-if="policyConfigError" class="config-error">
                    <fui-text :text="policyConfigError" :size="28" color="#f56c6c"></fui-text>
                </view>
                <view v-else-if="policyConfigData" class="config-details">
                    <!-- 基本信息 -->
                    <view class="config-section">
                        <fui-text :text="'基本信息'" :size="30" :fontWeight="600" color="#303133"
                            :padding="[0, 0, 16, 0]"></fui-text>
                        <view class="config-item">
                            <view class="config-item-label">
                                <fui-text :text="'轮灌组名称：'" :size="26" color="#606266"></fui-text>
                            </view>
                            <view class="config-item-value">
                                <fui-text :text="policyConfigData.name" :size="26" color="#303133"></fui-text>
                            </view>
                        </view>
                        <view class="config-item">
                            <view class="config-item-label">
                                <fui-text :text="'面积：'" :size="26" color="#606266"></fui-text>
                            </view>
                            <view class="config-item-value">
                                <fui-text :text="(policyConfigData.area || 0) + ' 亩'" :size="26"
                                    color="#303133"></fui-text>
                            </view>
                        </view>
                    </view>

                    <!-- 阀门配置 -->
                    <view class="config-section">
                        <fui-text :text="'阀门配置'" :size="30" :fontWeight="600" color="#303133"
                            :padding="[0, 0, 16, 0]"></fui-text>
                        <view v-if="policyConfigData.valves && policyConfigData.valves.length > 0"
                            class="valves-config">
                            <view v-for="(valve, idx) in policyConfigData.valves" :key="idx" class="valve-config-tag">
                                <fui-text :text="valve" :size="24" color="#409eff"></fui-text>
                            </view>
                        </view>
                        <view v-else class="config-empty-item">
                            <fui-text :text="'未配置阀门'" :size="26" color="#909399"></fui-text>
                        </view>
                        <view class="config-item">
                            <view class="config-item-label">
                                <fui-text :text="'阀门数量：'" :size="26" color="#606266"></fui-text>
                            </view>
                            <view class="config-item-value">
                                <fui-text :text="(policyConfigData.valves?.length || 0) + ' 个'" :size="26"
                                    color="#303133"></fui-text>
                            </view>
                        </view>
                    </view>

                    <!-- 施肥配置 -->
                    <view class="config-section">
                        <fui-text :text="'施肥配置'" :size="30" :fontWeight="600" color="#303133"
                            :padding="[0, 0, 16, 0]"></fui-text>
                        <view class="config-item">
                            <view class="config-item-label">
                                <fui-text :text="'施肥方式：'" :size="26" color="#606266"></fui-text>
                            </view>
                            <view class="config-item-value">
                                <fui-text :text="getFertMethodLabel(policyConfigData.fertConfig?.method)" :size="26"
                                    color="#303133"></fui-text>
                            </view>
                        </view>
                        <view v-if="policyConfigData.fertConfig?.method === 'AreaBased'" class="config-item">
                            <view class="config-item-label">
                                <fui-text :text="'亩定量：'" :size="26" color="#606266"></fui-text>
                            </view>
                            <view class="config-item-value">
                                <fui-text :text="(policyConfigData.fertConfig?.AB_fert || 0) + ' L/亩'" :size="26"
                                    color="#303133"></fui-text>
                            </view>
                        </view>
                        <view v-if="policyConfigData.fertConfig?.method === 'Total'" class="config-item">
                            <view class="config-item-label">
                                <fui-text :text="'总定量：'" :size="26" color="#606266"></fui-text>
                            </view>
                            <view class="config-item-value">
                                <fui-text :text="(policyConfigData.fertConfig?.total_fert || 0) + ' L'" :size="26"
                                    color="#303133"></fui-text>
                            </view>
                        </view>
                        <view v-if="policyConfigData.fertConfig?.method === 'Time'" class="config-item">
                            <view class="config-item-label">
                                <fui-text :text="'施肥时间：'" :size="26" color="#606266"></fui-text>
                            </view>
                            <view class="config-item-value">
                                <fui-text :text="(policyConfigData.fertConfig?.fert_time || 0) + ' 分钟'" :size="26"
                                    color="#303133"></fui-text>
                            </view>
                        </view>
                        <view class="config-item">
                            <view class="config-item-label">
                                <fui-text :text="'肥后时间：'" :size="26" color="#606266"></fui-text>
                            </view>
                            <view class="config-item-value">
                                <fui-text :text="(policyConfigData.fertConfig?.post_fert_time || 0) + ' 分钟'" :size="26"
                                    color="#303133"></fui-text>
                            </view>
                        </view>
                        <view class="config-item">
                            <view class="config-item-label">
                                <fui-text :text="'总灌溉时间：'" :size="26" color="#606266"></fui-text>
                            </view>
                            <view class="config-item-value">
                                <fui-text :text="(policyConfigData.fertConfig?.total_time || 0) + ' 分钟'" :size="26"
                                    color="#303133"></fui-text>
                            </view>
                        </view>
                    </view>
                </view>
            </view>
        </fui-dialog>
    </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import fuiText from 'firstui-uni/firstui/fui-text/fui-text.vue'
import fuiDialog from 'firstui-uni/firstui/fui-dialog/fui-dialog.vue'
import PageHeader from '../../components/PageHeader.vue'
import Loading from '../../components/Loading.vue'
import WeatherCard from '../monitoring/WeatherCard.vue'
import call_remote from '../../../../lib/call_remote.js'


const refreshing = ref(false)
const pageHeaderRef = ref(null)
const pageLoading = ref(false)
const loading = ref(false)
const currentFarmName = ref('')
const groups = ref([])
const waterOnlyMode = ref({}) // 跟踪每个轮灌组的"只浇水"状态
const waterOnlyLoading = ref({}) // 跟踪"只浇水"按钮的加载状态
const quickActionLoading = ref({}) // 跟踪快速操作的加载状态
const isFirstLoad = ref(true) // 标记是否是首次加载

// 策略配置查看相关
const showPolicyConfigDialog = ref(false)
const policyConfigTitle = ref('策略配置')
const policyConfigLoading = ref(false)
const policyConfigError = ref('')
const policyConfigData = ref(null)
const policyConfigButtons = ref([
    { text: '确定', color: '#409eff' }
])

const formVisible = ref(false)
const formMode = ref('create') // create | copy
const submitting = ref(false)
const wizardStep = ref(1)
const valveLoading = ref(false)
const availableValves = ref([])
const selectedValves = ref([])
const startTime = ref('08:00')
const suggestedArea = ref(null)
const valveView = ref('list')
const mapCenter = ref({ lat: 23.1291, lng: 113.2644 })
const mapScale = ref(12)
const mapMarkers = ref([])
const farmAreaParams = ref({
    system_flow: 0,
    laying_spacing: 0,
    dripper_spacing: 0,
    dripper_flow: 0,
    coefficient: 0.9
})
const methodOptions = [
    { label: '定量', value: 'AreaBased' },
    { label: '总定量', value: 'Total' },
    { label: '定时', value: 'Time' },
]
const formData = ref({
    name: '',
    area: null,
    method: 'AreaBased',
    AB_fert: null,
    total_fert: null,
    fert_time: null,
    post_fert_time: null,
    total_time: null,
})

const resetForm = () => {
    formData.value = {
        name: '',
        area: null,
        method: 'AreaBased',
        AB_fert: null,
        total_fert: null,
        fert_time: null,
        post_fert_time: null,
        total_time: null,
    }
    selectedValves.value = []
    wizardStep.value = 1
    startTime.value = '08:00'
}

const formatNumber = (val) => {
    if (val === undefined || val === null || val === '-') return '-'
    if (val === '') return '-'
    return String(val)
}

const parseValves = (valveStr) => {
    if (!valveStr || valveStr === '-') return []
    const quoted = valveStr.match(/"([^"]+)"/g)
    if (quoted && quoted.length) {
        return quoted.map(i => i.replaceAll('"', ''))
    }
    return valveStr.split(/[,|\s]+/).map(v => v.trim()).filter(Boolean)
}

// 从表达式字符串解析阀门列表（PC端逻辑）
const parseValvesFromExpression = (expression) => {
    if (!expression || expression === '-') return []
    if (expression.includes('|')) {
        return expression.split('|').map(v => v.trim().replaceAll('"', '')).filter(Boolean)
    }
    const matches = expression.match(/"([^"]+)"/g)
    return matches ? matches.map(m => m.replaceAll('"', '')) : []
}

// 解析施肥方式（PC端逻辑）
const parseFertMethod = (expression) => {
    const methodStr = (expression || '').replaceAll('"', '')
    if (methodStr === '亩定量' || methodStr === 'AreaBased') return 'AreaBased'
    if (methodStr === '总定量' || methodStr === 'Total') return 'Total'
    if (methodStr === '定时' || methodStr === 'Time') return 'Time'
    return 'AreaBased'
}

// 解析时间值（PC端逻辑，毫秒转分钟）
const parseTimeValue = (expression) => {
    const value = Number.parseFloat(expression) || 0
    // 如果是毫秒，转换为分钟
    if (value > 1000) {
        return value / 60000
    }
    return value
}

// 从初始化变量中解析面积
const parseAreaFromVariable = (initVariables) => {
    if (!initVariables) return null
    for (const initVar of initVariables) {
        const varName = initVar.variable_name
        if (varName === 'area' || varName === '面积') {
            const areaValue = Number.parseFloat(initVar.expression) || 0
            if (areaValue > 0) {
                return areaValue
            }
        }
    }
    return null
}

// 从初始化变量中解析施肥配置（PC端逻辑）
const parseFertConfigFromVariables = (initVariables, fertConfig, area = 0) => {
    if (!initVariables) return

    for (const initVar of initVariables) {
        const varName = initVar.variable_name
        const expression = initVar.expression || ''

        if (varName === 'method' || varName === '施肥策略') {
            fertConfig.method = parseFertMethod(expression)
        } else if (varName === 'fert_time' || varName === '施肥时间') {
            fertConfig.fert_time = parseTimeValue(expression)
        } else if (varName === 'post_ms' || varName === '肥后时间') {
            fertConfig.post_fert_time = parseTimeValue(expression)
        } else if (varName === '期望每亩施肥量' || varName === 'area_based_amount') {
            fertConfig.AB_fert = Number.parseFloat(expression) || 0
        } else if (varName === '期望施肥总量') {
            fertConfig.total_fert = Number.parseFloat(expression) || 0
        }
    }

    // 如果施肥方式是"总定量"，且期望施肥总量有值，计算亩定量
    if (fertConfig.method === 'Total' && fertConfig.total_fert > 0 && area > 0) {
        fertConfig.AB_fert = fertConfig.total_fert / area
    }

    // 如果施肥方式是"亩定量"，且期望每亩施肥量有值，计算总定量
    if (fertConfig.method === 'AreaBased' && fertConfig.AB_fert > 0 && area > 0) {
        fertConfig.total_fert = fertConfig.AB_fert * area
    }
}

// 获取施肥方式标签
const getFertMethodLabel = (method) => {
    if (method === 'AreaBased') return '亩定量'
    if (method === 'Total') return '总定量'
    if (method === 'Time') return '定时'
    return '未知'
}

const statusClass = (state) => {
    if (!state) return 'info'
    if (state.includes('执行') || state.includes('灌溉') || state.includes('running')) return 'success'
    if (state.includes('暂停') || state.includes('warning')) return 'warning'
    return 'info'
}

const onMethodChange = (e) => {
    const idx = Number(e.detail.value)
    const opt = methodOptions[idx]
    if (opt) formData.value.method = opt.value
}

const getMethodLabel = (val) => {
    const opt = methodOptions.find(o => o.value === val)
    return opt ? opt.label : '定量'
}

const openCreateForm = (isCopy, group = null) => {
    if (isCopy && group) {
        uni.setStorageSync('irrigation_copy_group', group)
        uni.navigateTo({ url: '/pages/irrigation/wizard?mode=copy' })
        return
    }
    uni.navigateTo({ url: '/pages/irrigation/wizard?mode=create' })
}

const closeForm = () => {
    if (submitting.value) return
    formVisible.value = false
}

const mapMethodToEnum = (methodLabel) => {
    if (!methodLabel) return 'AreaBased'
    if (methodLabel.includes('定时')) return 'Time'
    if (methodLabel.includes('总')) return 'Total'
    return 'AreaBased'
}

const validateStep1 = () => {
    const name = (formData.value.name || '').trim()
    if (!name) {
        uni.showToast({ title: '名称必填', icon: 'none' })
        return false
    }
    if (!formData.value.area || Number(formData.value.area) <= 0) {
        uni.showToast({ title: '面积需大于0', icon: 'none' })
        return false
    }
    if (!formData.value.total_time || Number(formData.value.total_time) <= 0) {
        uni.showToast({ title: '总时间需大于0', icon: 'none' })
        return false
    }
    if (formData.value.method === 'AreaBased' && (!formData.value.AB_fert || Number(formData.value.AB_fert) <= 0)) {
        uni.showToast({ title: '亩定量需大于0', icon: 'none' })
        return false
    }
    if (formData.value.method === 'Total' && (!formData.value.total_fert || Number(formData.value.total_fert) <= 0)) {
        uni.showToast({ title: '总定量需大于0', icon: 'none' })
        return false
    }
    if (formData.value.method === 'Time' && (!formData.value.fert_time || Number(formData.value.fert_time) <= 0)) {
        uni.showToast({ title: '定时需大于0', icon: 'none' })
        return false
    }
    if (!formData.value.total_time || Number(formData.value.total_time) <= 0) {
        uni.showToast({ title: '总时间需大于0', icon: 'none' })
        return false
    }
    return true
}

const loadValveDevices = async () => {
    valveLoading.value = true
    try {
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        let pageNo = 0
        let hasMore = true
        const allDevices = []
        while (hasMore) {
            const result = await call_remote('/device_management/list_device', { pageNo, farm_name: currentFarmName.value || undefined }, token)
            const devices = result?.devices || []
            allDevices.push(...devices)
            hasMore = devices.length >= 20
            pageNo++
        }
        availableValves.value = allDevices.filter(d => d.driver_name === 'WaterGroupValve' || d.driver_name === 'WaterGroupValve_v2')
            .map(d => ({
                device_name: d.device_name,
                longitude: d.longitude,
                latitude: d.latitude
            }))
        buildMapMarkers()
    } catch (error) {
        console.error('加载阀门设备失败', error)
        availableValves.value = []
    } finally {
        valveLoading.value = false
    }
}

const toggleValve = (deviceName) => {
    const idx = selectedValves.value.indexOf(deviceName)
    if (idx >= 0) {
        selectedValves.value.splice(idx, 1)
    } else {
        selectedValves.value.push(deviceName)
    }
}

const isValveSelected = (deviceName) => selectedValves.value.includes(deviceName)

const buildMapMarkers = () => {
    const markers = []
    const lats = []
    const lngs = []
    availableValves.value.forEach((d, idx) => {
        if (d.latitude !== undefined && d.longitude !== undefined) {
            lats.push(Number(d.latitude))
            lngs.push(Number(d.longitude))
            markers.push({
                id: idx,
                latitude: Number(d.latitude),
                longitude: Number(d.longitude),
                title: d.device_name,
                iconPath: isValveSelected(d.device_name) ? '/static/tabbar/Irrigation-active.png' : '/static/tabbar/Irrigation.png',
                width: 32,
                height: 32,
                callout: {
                    content: d.device_name,
                    display: 'ALWAYS',
                    bgColor: '#ffffff',
                    color: '#303133',
                    borderRadius: 8,
                    padding: 6
                },
                customCallout: {
                    anchorY: 0,
                    anchorX: 0
                }
            })
        }
    })
    if (lats.length && lngs.length) {
        const lat = lats.reduce((a, b) => a + b, 0) / lats.length
        const lng = lngs.reduce((a, b) => a + b, 0) / lngs.length
        mapCenter.value = { lat, lng }
        mapScale.value = 12
    }
    mapMarkers.value = markers
}

const onMarkerTap = (e) => {
    const marker = mapMarkers.value.find(m => m.id === e.detail.markerId)
    if (!marker) return
    toggleValve(marker.title || marker.callout?.content || '')
    buildMapMarkers()
}

const onTimeChange = (e) => {
    startTime.value = e.detail.value || startTime.value
}

const nextWizardStep = async () => {
    if (wizardStep.value === 1) {
        if (!validateStep1()) return
        await loadValveDevices()
        wizardStep.value = 2
    } else if (wizardStep.value === 2) {
        if (!selectedValves.value.length) {
            uni.showToast({ title: '至少选择1个阀门', icon: 'none' })
            return
        }
        wizardStep.value = 3
    }
}

const prevWizardStep = () => {
    if (wizardStep.value > 1) {
        wizardStep.value -= 1
    }
}

const buildPayload = () => {
    const abVal = formData.value.method === 'Total'
        ? Number(formData.value.total_fert || 0) / Number(formData.value.area || 1)
        : formData.value.AB_fert

    return {
        groups: [{
            name: (formData.value.name || '').trim(),
            area: Number(formData.value.area),
            valves: selectedValves.value.slice(),
            method: formData.value.method,
            AB_fert: abVal !== null ? Number(abVal) : undefined,
            total_fert: formData.value.total_fert !== null ? Number(formData.value.total_fert) : undefined,
            fert_time: formData.value.method === 'Time' ? Number(formData.value.fert_time || 0) : 0,
            post_fert_time: formData.value.post_fert_time !== null ? Number(formData.value.post_fert_time) : 0,
            total_time: formData.value.total_time !== null ? Number(formData.value.total_time) : undefined,
        }],
        farm_name: currentFarmName.value || undefined,
        start_time: startTime.value
    }
}

const submitForm = async () => {
    if (wizardStep.value !== 3 && !validateStep1()) {
        wizardStep.value = 1
        return
    }
    if (!selectedValves.value.length) {
        wizardStep.value = 2
        uni.showToast({ title: '请先分配阀门', icon: 'none' })
        return
    }
    const payload = buildPayload()
    submitting.value = true
    try {
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        await call_remote('/policy/apply_wizard_groups', payload, token)
        uni.showToast({ title: '下发成功', icon: 'success' })
        formVisible.value = false
        await loadGroups()
    } catch (error) {
        console.error('保存轮灌组失败', error)
        uni.showToast({ title: error.err_msg || '保存失败', icon: 'none' })
    } finally {
        submitting.value = false
    }
}

const mapGroup = (raw) => {
    const valveList = parseValves(raw.valves)
    return {
        ...raw,
        valveList
    }
}

const filterByFarm = async (groups) => {
    if (!currentFarmName.value) return groups
    const result = []
    for (const g of groups) {
        try {
            const match = await call_remote('/policy/get_matched_farm', { policy_name: g.name })
            if (!match || !match.farm_name || match.farm_name === currentFarmName.value) {
                result.push(g)
            }
        } catch (e) {
            // 忽略异常，默认不过滤
            console.warn(`获取策略 ${g.name} 的匹配农场失败:`, e)
            result.push(g)
        }
    }
    return result
}

const loadGroups = async () => {
    if (loading.value) return
    loading.value = true
    try {
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        let pageNo = 0
        let hasMore = true
        const allGroups = []
        while (hasMore) {
            const resp = await call_remote('/policy/list_watering_groups', { pageNo }, token)
            const list = resp && resp.groups ? resp.groups : []
            allGroups.push(...list)
            // 如果返回的数据少于20条，说明已经是最后一页了
            hasMore = list.length >= 20
            pageNo++
        }
        const filtered = await filterByFarm(allGroups)
        groups.value = filtered.map(mapGroup)
        // 加载每个轮灌组的"只浇水"状态
        await loadWaterOnlyStates()
    } catch (error) {
        console.error('加载轮灌组失败', error)
        groups.value = []
        uni.showToast({ title: '加载轮灌组失败', icon: 'none' })
    } finally {
        loading.value = false
    }
}

const fetchSuggestedArea = async () => {
    if (!currentFarmName.value) {
        suggestedArea.value = null
        return
    }
    try {
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        const paramsResp = await call_remote('/resource/get_farm_area_params', { farm_name: currentFarmName.value }, token)
        if (paramsResp) {
            farmAreaParams.value = {
                system_flow: Number(paramsResp.system_flow) || 0,
                laying_spacing: Number(paramsResp.laying_spacing) || 0,
                dripper_spacing: Number(paramsResp.dripper_spacing) || 0,
                dripper_flow: Number(paramsResp.dripper_flow) || 0,
                coefficient: paramsResp.coefficient !== undefined ? Number(paramsResp.coefficient) : 0.9
            }
            suggestedArea.value = calcRecommendedArea()
        }
    } catch (e) {
        console.warn('获取农场面积参数失败', e)
        suggestedArea.value = null
    }
}

const calcRecommendedArea = () => {
    const p = farmAreaParams.value
    const system_flow = Number(p.system_flow) || 0
    const laying_spacing = Number(p.laying_spacing) || 0
    const dripper_spacing = Number(p.dripper_spacing) || 0
    const dripper_flow = Number(p.dripper_flow) || 0
    const coefficient = Number(p.coefficient) || 0.9

    if (system_flow <= 0 || laying_spacing <= 0 || dripper_spacing <= 0 || dripper_flow <= 0) return null

    const denominator = (667 / laying_spacing / dripper_spacing) * dripper_flow
    if (denominator === 0 || !Number.isFinite(denominator)) return null

    const result = (system_flow * 1000 / denominator) * coefficient
    if (!result || !Number.isFinite(result) || result <= 0) return null
    return Number(result.toFixed(2))
}

const useSuggestedArea = () => {
    if (suggestedArea.value && suggestedArea.value > 0) {
        formData.value.area = suggestedArea.value
    }
}

// 加载每个轮灌组的"只浇水"状态
const loadWaterOnlyStates = async () => {
    const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
    for (const group of groups.value) {
        try {
            const runtimeResult = await call_remote('/policy/get_policy_runtime', {
                policy_name: group.name
            }, token)
            if (runtimeResult && runtimeResult.variables) {
                let variables = {}
                try {
                    variables = JSON.parse(runtimeResult.variables)
                } catch (e) {
                    console.warn(`解析策略 ${group.name} 变量数据失败:`, e)
                }
                // 如果"是否只浇水"为true，则"只浇水"按钮应该被选中
                waterOnlyMode.value[group.name] = variables['是否只浇水'] === true
            }
        } catch (error) {
            console.warn(`获取策略 ${group.name} 运行时状态失败:`, error)
            waterOnlyMode.value[group.name] = false
        }
    }
}

// 处理"只浇水"按钮切换
const handleWaterOnlyToggle = async (policyName) => {
    const currentState = waterOnlyMode.value[policyName] || false
    const newState = !currentState

    try {
        waterOnlyLoading.value[policyName] = true
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')

        // 设置"是否只浇水"变量
        const result = await call_remote('/policy/runtime_assignment', {
            policy_name: policyName,
            variable_name: '是否只浇水',
            expression: newState ? 'true' : 'false',
            is_constant: false
        }, token)

        if (result.result) {
            // 如果启用只浇水模式，需要停止当前的施肥流程（设置"需要启动"为false）
            if (newState) {
                await call_remote('/policy/runtime_assignment', {
                    policy_name: policyName,
                    variable_name: '需要启动',
                    expression: 'false',
                    is_constant: false
                }, token)
            }

            waterOnlyMode.value[policyName] = newState
            uni.showToast({
                title: newState ? '已启用只浇水模式' : '已关闭只浇水模式',
                icon: 'success'
            })
            // 重新加载轮灌组数据
            await loadGroups()
        } else {
            uni.showToast({ title: result?.err_msg || '操作失败', icon: 'none' })
        }
    } catch (error) {
        console.error('切换只浇水模式失败:', error)
        uni.showToast({ title: error?.err_msg || '切换只浇水模式失败', icon: 'none' })
    } finally {
        waterOnlyLoading.value[policyName] = false
    }
}

// 处理快速操作
const handleQuickAction = async (policyName, actionName) => {
    const loadingKey = `${policyName}-${actionName}`
    try {
        quickActionLoading.value[loadingKey] = true
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        const result = await call_remote('/policy/do_quick_action', {
            policy_name: policyName,
            action_name: actionName
        }, token)
        if (result.result) {
            uni.showToast({ title: `快速操作 ${actionName} 执行成功`, icon: 'success' })
            // 重新加载轮灌组数据
            await loadGroups()
        } else {
            uni.showToast({ title: result?.err_msg || `执行快速操作 ${actionName} 失败`, icon: 'none' })
        }
    } catch (error) {
        console.error('执行快速操作失败:', error)
        uni.showToast({ title: error?.err_msg || `执行快速操作 ${actionName} 失败`, icon: 'none' })
    } finally {
        quickActionLoading.value[loadingKey] = false
    }
}

// 解析策略初始化变量中的时间值
const parseTimeValues = (initVariables) => {
    let preTimeMs = 0
    let fertTimeMs = 0
    let postTimeMs = 0

    for (const initVar of initVariables) {
        const varName = initVar.variable_name
        const expression = initVar.expression || ''
        if (varName === '肥前时间') {
            preTimeMs = Number.parseFloat(expression) || 0
        } else if (varName === '施肥时间') {
            fertTimeMs = Number.parseFloat(expression) || 0
        } else if (varName === '肥后时间') {
            postTimeMs = Number.parseFloat(expression) || 0
        }
    }

    return { preTimeMs, fertTimeMs, postTimeMs }
}

// 从策略初始化变量中解析配置
const parsePolicyConfig = (initVariables, group, fertConfig) => {
    let area = group.area || 0
    let valves = []

    // 解析面积
    const areaFromVar = parseAreaFromVariable(initVariables)
    if (areaFromVar !== null) {
        area = areaFromVar
    }

    // 解析阀门
    for (const initVar of initVariables) {
        const varName = initVar.variable_name
        if (varName === 'valves' || varName === '组内阀门') {
            valves = parseValvesFromExpression(initVar.expression || '')
            break
        }
    }

    // 解析施肥配置
    parseFertConfigFromVariables(initVariables, fertConfig, area)

    // 计算总灌溉时间
    const { preTimeMs, fertTimeMs, postTimeMs } = parseTimeValues(initVariables)
    if (preTimeMs > 0 || fertTimeMs > 0 || postTimeMs > 0) {
        const totalMs = preTimeMs + fertTimeMs + postTimeMs
        fertConfig.total_time = totalMs / 60000 // 转换为分钟
    }

    return { area, valves }
}

// 查看策略配置（按照PC端逻辑）
const viewPolicyConfig = async (policyName) => {
    showPolicyConfigDialog.value = true
    policyConfigTitle.value = `${policyName} - 配置详情`
    policyConfigLoading.value = true
    policyConfigError.value = ''
    policyConfigData.value = null

    try {
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')

        // 获取轮灌组列表
        const groupsResp = await call_remote('/policy/list_watering_groups', { pageNo: 0 }, token)
        const group = groupsResp?.groups?.find(g => g.name === policyName)

        // 获取策略列表
        const policyResp = await call_remote('/policy/list_policy', {}, token)
        const policy = policyResp?.policies?.find(p => p.name === policyName)

        if (!group || !policy) {
            policyConfigError.value = `未找到轮灌组 "${policyName}" 的配置信息`
            return
        }

        // 初始化配置数据
        const fertConfig = {
            method: 'AreaBased',
            AB_fert: 0,
            total_fert: 0,
            fert_time: 0,
            post_fert_time: 0,
            total_time: group.total_time || 0,
        }

        let area = group.area || 0
        let valves = []

        // 从策略的初始化变量中解析配置
        if (policy.init_variables) {
            const parsed = parsePolicyConfig(policy.init_variables, group, fertConfig)
            area = parsed.area
            valves = parsed.valves
        }

        // 如果阀门列表为空，尝试从轮灌组数据中获取
        if (valves.length === 0 && group.valves && group.valves !== '-') {
            valves = parseValves(group.valves)
        }

        policyConfigData.value = {
            name: policyName,
            area: area,
            valves: valves,
            fertConfig: fertConfig
        }

    } catch (error) {
        console.error('获取策略配置失败:', error)
        policyConfigError.value = error?.err_msg || '获取策略配置失败'
    } finally {
        policyConfigLoading.value = false
    }
}

// 处理策略配置对话框按钮点击
const handlePolicyConfigDialogClick = (e) => {
    // 确定按钮，关闭对话框
    if (e.index === 0) {
        closePolicyConfigDialog()
    }
}

// 关闭策略配置对话框
const closePolicyConfigDialog = () => {
    showPolicyConfigDialog.value = false
    policyConfigData.value = null
    policyConfigError.value = ''
}

// 下拉刷新
const onRefresh = async () => {
    refreshing.value = true
    try {
        if (pageHeaderRef.value && pageHeaderRef.value.refresh) {
            await pageHeaderRef.value.refresh()
            currentFarmName.value = pageHeaderRef.value.getCurrentFarmName()
        }
        await loadGroups()
        uni.showToast({
            title: '刷新完成',
            icon: 'success',
            duration: 1500
        })
    } catch (error) {
        console.error('刷新失败:', error)
        uni.showToast({
            title: '刷新失败，请重试',
            icon: 'none',
            duration: 2000
        })
    } finally {
        refreshing.value = false
    }
}

const onFarmChange = (farmName) => {
    currentFarmName.value = farmName
    loadGroups()
    fetchSuggestedArea()
}

// 页面显示时加载/刷新数据
onShow(async () => {
    // 检查登录状态
    const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null)
    if (!token) {
        uni.redirectTo({
            url: '/pages/login'
        })
        return
    }

    // 首次加载时显示全屏加载动画
    if (isFirstLoad.value) {
        pageLoading.value = true
        isFirstLoad.value = false
    }

    try {
        if (pageHeaderRef.value) {
            await pageHeaderRef.value.refresh()
            currentFarmName.value = pageHeaderRef.value.getCurrentFarmName()
        }
        // 首次加载时获取建议面积
        if (pageLoading.value) {
            await fetchSuggestedArea()
        }
        await loadGroups()
    } catch (error) {
        console.error('加载数据失败:', error)
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

/* 内容滚动区域 - scroll-view 需要明确高度 */
.content-scroll {
    position: fixed;
    /* PageHeader 总高度 = min-height(120rpx) + padding-top(24rpx + safe-area) + padding-bottom(24rpx) = 168rpx + env(safe-area-inset-top) */
    top: calc(168rpx + env(safe-area-inset-top));
    /* 底部 tabBar 高度 + 安全区 */
    bottom: calc(120rpx + env(safe-area-inset-bottom));
    left: 0;
    right: 0;
    width: 100%;
    height: calc(100vh - 168rpx - 120rpx - env(safe-area-inset-top) - env(safe-area-inset-bottom));
    box-sizing: border-box;
}

/* 内容区域 */
.content {
    padding: 32rpx;
    display: flex;
    flex-direction: column;
    gap: 32rpx;
    box-sizing: border-box;
    padding-bottom: 32rpx;
    /* 底部留出一些间距即可，不需要为 tabBar 留空间，因为 scroll-view 已经限制了底部 */
}

.top-add-btn {
    position: fixed;
    bottom: 120rpx;
    right: 40rpx;
    width: 104rpx;
    height: 104rpx;
    border-radius: 50%;
    background: #409eff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 12rpx 28rpx rgba(64, 158, 255, 0.35);
    z-index: 2000;
}

.plus-icon {
    color: #fff;
    font-size: 56rpx;
    line-height: 1;
}

.section-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.loading-block,
.empty-block {
    background: #fff;
    border-radius: 20rpx;
    padding: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.06);
}

.empty-icon {
    width: 100rpx;
    height: 100rpx;
}

.group-list {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.group-card {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 32rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.06);
}

.action-btn {
    padding: 16rpx 28rpx;
    border-radius: 999rpx;
    background: #409eff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 180rpx;
}

.action-btn.ghost {
    background: #e8f3ff;
    border: 1px solid #c6e2ff;
}

.action-btn.primary.disabled {
    opacity: 0.6;
}

.group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;
}

.group-title {
    display: flex;
    align-items: center;
    gap: 12rpx;
    flex: 1;
}

.view-config-btn {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #f0f7ff;
    border: 1px solid #c6e2ff;
    cursor: pointer;
    transition: all 0.3s;
}

.view-config-btn:active {
    background: #e8f3ff;
    transform: scale(0.95);
}

.eye-icon {
    font-size: 28rpx;
    line-height: 1;
}

.group-state {
    padding: 8rpx 16rpx;
    border-radius: 999rpx;
    background: #c0c4cc;
}

.group-state.success {
    background: #67c23a;
}

.group-state.warning {
    background: #e6a23c;
}

.group-state.info {
    background: #909399;
}

.group-meta {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14rpx 12rpx;
    margin-bottom: 12rpx;
}

.meta-item {
    display: flex;
    flex-direction: column;
    gap: 6rpx;
}

.meta-label {
    font-size: 22rpx;
    color: #909399;
}

.valves-row {
    display: flex;
    align-items: flex-start;
    gap: 12rpx;
    margin-top: 8rpx;
}

.valves-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10rpx;
    flex: 1;
}

.valve-tag {
    padding: 8rpx 14rpx;
    background: #f0f7ff;
    color: #409eff;
    border-radius: 12rpx;
    font-size: 22rpx;
}

.card-actions {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    margin-top: 20rpx;
}

.water-only-btn {
    padding: 14rpx 24rpx;
    border-radius: 12rpx;
    background: #f0f9ff;
    border: 1px solid #67C23A;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
}

.water-only-btn.active {
    background: linear-gradient(135deg, #67C23A 0%, #85ce61 100%);
    border-color: #67C23A;
    box-shadow: 0 4rpx 12rpx rgba(103, 194, 58, 0.3);
}

.water-only-btn.loading {
    opacity: 0.6;
    pointer-events: none;
}

.action-buttons-row {
    display: flex;
    gap: 12rpx;
    width: 100%;
}

.action-btn {
    padding: 16rpx 24rpx;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
}

.action-buttons-row .action-btn {
    flex: 1;
}

.action-btn.success {
    background: linear-gradient(135deg, #67C23A 0%, #85ce61 100%);
}

.action-btn.warning {
    background: linear-gradient(135deg, #E6A23C 0%, #f0c78a 100%);
}

.action-btn.danger {
    background: linear-gradient(135deg, #F56C6C 0%, #f89898 100%);
    width: 100%;
    box-sizing: border-box;
}

.action-btn.loading {
    opacity: 0.6;
    pointer-events: none;
}

.action-btn:active:not(.loading) {
    transform: scale(0.98);
    box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.15);
}

.form-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
    padding: 24rpx;
    box-sizing: border-box;
}

.form-panel {
    background: #fff;
    border-radius: 20rpx;
    width: 92%;
    max-width: 760rpx;
    padding: 28rpx;
    box-sizing: border-box;
}

.form-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18rpx;
}

.form-panel.wide {
    max-width: 900rpx;
}

.close {
    font-size: 36rpx;
    padding: 8rpx 16rpx;
    color: #909399;
}

.form-body {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    max-height: 60vh;
    overflow-y: auto;
    padding-bottom: 120rpx;
}

.form-item {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.form-label {
    font-size: 24rpx;
    color: #606266;
}

.form-input {
    border: 1px solid #ebeef5;
    border-radius: 12rpx;
    padding: 16rpx;
    font-size: 26rpx;
    background: #f8fafc;
}

.form-textarea {
    border: 1px solid #ebeef5;
    border-radius: 12rpx;
    padding: 16rpx;
    min-height: 120rpx;
    font-size: 26rpx;
    background: #f8fafc;
}

.picker-value {
    border: 1px solid #ebeef5;
    border-radius: 12rpx;
    padding: 16rpx;
    font-size: 26rpx;
    background: #f8fafc;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 16rpx;
    margin-top: 16rpx;
}

.form-actions.fixed {
    position: sticky;
    bottom: 0;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), #fff);
    padding: 16rpx 0;
}

.step-indicator {
    display: grid;
    grid-template-columns: auto auto 1fr auto auto 1fr auto auto;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 12rpx;
}

.step-dot {
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    background: #e8f3ff;
    color: #909399;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
}

.step-dot.active {
    background: #409eff;
    color: #fff;
}

.step-label {
    font-size: 24rpx;
    color: #606266;
}

.step-line {
    height: 2rpx;
    background: linear-gradient(90deg, #c6e2ff, #409eff);
}

.step-content {
    display: flex;
    flex-direction: column;
    gap: 14rpx;
}

.step-page {
    min-height: 320rpx;
    justify-content: flex-start;
}

.valve-list {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.valve-item {
    border: 1px solid #ebeef5;
    border-radius: 16rpx;
    padding: 18rpx;
    background: #f8fafc;
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.valve-item.checked {
    border-color: #409eff;
    background: #e8f3ff;
}

.valve-name {
    font-size: 28rpx;
    color: #303133;
    flex: 1;
}

.valve-meta {
    font-size: 22rpx;
    color: #909399;
}

.check-indicator {
    width: 32rpx;
    height: 32rpx;
    border-radius: 50%;
    border: 1px solid #409eff;
    color: #409eff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
}

.summary-card {
    border: 1px solid #ebeef5;
    border-radius: 16rpx;
    padding: 18rpx;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    gap: 10rpx;
}

.summary-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.summary-label {
    width: 180rpx;
    font-size: 24rpx;
    color: #606266;
}

.summary-value {
    font-size: 26rpx;
    color: #303133;
    flex: 1;
}

.summary-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8rpx;
}

.valve-tag.small {
    padding: 6rpx 12rpx;
    font-size: 22rpx;
}

.tips-text {
    font-size: 22rpx;
    color: #909399;
}

.loading-block.small,
.empty-block.small {
    padding: 24rpx;
    min-height: 0;
}

.steps {
    margin-bottom: 12rpx;
}

.inline-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.flex-1 {
    flex: 1;
}

.suggest-btn {
    padding: 12rpx 18rpx;
    border-radius: 12rpx;
    background: #e8f3ff;
    color: #409eff;
    font-size: 24rpx;
    white-space: nowrap;
}

.tabs {
    display: inline-flex;
    border: 1px solid #dcdfe6;
    border-radius: 999rpx;
    overflow: hidden;
    margin-top: 8rpx;
}

.tab {
    padding: 10rpx 20rpx;
    font-size: 24rpx;
    color: #606266;
    background: #f5f7fa;
}

.tab.active {
    background: #409eff;
    color: #fff;
}

.map-wrapper {
    border: 1px solid #ebeef5;
    border-radius: 16rpx;
    overflow: hidden;
}

.valve-map {
    width: 100%;
    height: 420rpx;
}

.map-legend {
    padding: 12rpx 16rpx;
    font-size: 22rpx;
    color: #606266;
    background: #f8fafc;
}

/* 策略配置对话框样式 */
.policy-config-content {
    max-height: 60vh;
    overflow-y: auto;
    padding: 20rpx 0;
}

.config-loading,
.config-error {
    padding: 40rpx 0;
    text-align: center;
}

.config-section {
    margin-bottom: 32rpx;
}

.config-section:last-child {
    margin-bottom: 0;
}

/* 阀门配置样式 */
.valves-config {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-top: 12rpx;
}

.valve-config-tag {
    padding: 12rpx 20rpx;
    background: #f0f7ff;
    border: 1px solid #c6e2ff;
    border-radius: 12rpx;
}

.config-empty-item {
    padding: 20rpx 0;
    text-align: center;
}

/* 配置参数样式 */
.config-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16rpx 0;
    border-bottom: 1px solid #ebeef5;
}

.config-item:last-child {
    border-bottom: none;
}

.config-item-label {
    flex: 1;
    min-width: 200rpx;
}

.config-item-value {
    flex: 1;
    text-align: right;
    word-break: break-all;
}

@media (max-width: 375px) {

    .content {
        padding: 24rpx;
    }
}
</style>
