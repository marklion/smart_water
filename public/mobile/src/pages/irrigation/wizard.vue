<template>
    <view class="page">
        <PageHeader ref="pageHeaderRef" :show-farm-selector="true" @farm-change="onFarmChange" />

        <scroll-view class="content-scroll" scroll-y :enable-flex="true">
            <view class="content">
                <view class="header-row">
                    <view class="title">策略程序设定向导</view>
                </view>

                <view class="form-card">
                    <!-- 步骤指示器 -->
                    <view class="step-indicator">
                        <view class="step-item">
                            <view :class="['step-dot', wizardStep === 1 ? 'active' : '', wizardStep > 1 ? 'completed' : '']">
                                <text v-if="wizardStep > 1" class="step-check">✓</text>
                                <text v-else class="step-number">1</text>
                            </view>
                            <view :class="['step-label', wizardStep === 1 ? 'active' : '']">输入方案名称</view>
                        </view>
                        <view :class="['step-line', wizardStep > 1 ? 'completed' : '']"></view>
                        
                        <view class="step-item">
                            <view :class="['step-dot', wizardStep === 2 ? 'active' : '', wizardStep > 2 ? 'completed' : '']">
                                <text v-if="wizardStep > 2" class="step-check">✓</text>
                                <text v-else class="step-number">2</text>
                            </view>
                            <view :class="['step-label', wizardStep === 2 ? 'active' : '']">创建轮灌组</view>
                        </view>
                        <view :class="['step-line', wizardStep > 2 ? 'completed' : '']"></view>
                        
                        <view class="step-item">
                            <view :class="['step-dot', wizardStep === 3 ? 'active' : '', wizardStep > 3 ? 'completed' : '']">
                                <text v-if="wizardStep > 3" class="step-check">✓</text>
                                <text v-else class="step-number">3</text>
                            </view>
                            <view :class="['step-label', wizardStep === 3 ? 'active' : '']">分配设备</view>
                        </view>
                        <view :class="['step-line', wizardStep > 3 ? 'completed' : '']"></view>
                        
                        <view class="step-item">
                            <view :class="['step-dot', wizardStep === 4 ? 'active' : '']">
                                <text class="step-number">4</text>
                            </view>
                            <view :class="['step-label', wizardStep === 4 ? 'active' : '']">施肥配置</view>
                        </view>
                    </view>

                    <!-- 步骤1：仅输入方案名称（对齐 PC 行为） -->
                    <view v-if="wizardStep === 1" class="wizard-step-content">
                        <view class="scheme-name-card">
                            <text class="form-label">方案名称</text>
                            <input class="scheme-input" v-model="schemeName" placeholder="请输入方案名称" />
                            <text class="scheme-hint">最终会生成类似 plan_{{ schemeName || '方案名称' }}.txt 的方案文件</text>
                        </view>
                    </view>

                    <!-- 步骤2：创建轮灌组 -->
                    <view v-else-if="wizardStep === 2" class="wizard-step-content">
                        <view class="watering-groups-config">
                            <view class="groups-header">
                                <text>轮灌组列表</text>
                                <view class="header-buttons">
                                    <view class="action-btn ghost small" @click="loadExistingGroups">
                                        <text>加载已配置</text>
                                    </view>
                                    <view class="action-btn primary small" @click="addWateringGroup">
                                        <text>+ 添加轮灌组</text>
                                    </view>
                                </view>
                            </view>

                            <!-- 已配置的轮灌组（列表形式，卡片样式，可查看/编辑阀门/复制/删除） -->
                            <view v-if="existingGroups.length > 0 && !isEditMode" class="existing-groups-section">
                                <view class="existing-groups-header">
                                    <text>已配置的轮灌组</text>
                                    <text class="groups-count">共 {{ existingGroups.length }} 个</text>
                                </view>
                                <view class="existing-groups-list">
                                    <view v-for="existingGroup in existingGroups" :key="existingGroup.name"
                                        class="existing-group-row">
                                        <view class="group-info">
                                            <view class="group-name-input readonly">
                                                {{ existingGroup.name }}
                                            </view>
                                        </view>
                                        <view class="group-info group-info-bottom">
                                            <view class="group-area-input readonly">
                                                {{ existingGroup.area || 0 }}
                                            </view>
                                            <text class="unit">亩</text>
                                        </view>
                                        <view class="action-row">
                                            <view class="mini-btn view" @click.stop="viewExistingGroup(existingGroup)">查看</view>
                                            <view class="mini-btn edit" @click.stop="editExistingGroupValves(existingGroup)">编辑阀门</view>
                                            <view class="mini-btn copy" @click.stop="copyExistingGroup(existingGroup)">复制</view>
                                            <view class="mini-btn delete" @click.stop="removeExistingGroup(existingGroup)">删除</view>
                                        </view>
                                    </view>
                                </view>
                            </view>

                            <!-- 轮灌组列表 -->
                            <view v-for="(group, index) in wateringGroups" :key="index" class="group-item">
                                <view class="group-info">
                                    <input class="group-name-input" v-model="group.name" placeholder="轮灌组名称" />
                                    <input class="group-area-input" v-model.number="group.area" type="number"
                                        placeholder="面积" />
                                    <text class="unit">亩</text>
                                    <view class="action-row">
                                        <view class="mini-btn view" @click.stop="viewGroupDetail(group)">查看</view>
                                        <view class="mini-btn edit" @click.stop="editValvesForGroup(index)">编辑阀门</view>
                                        <view class="mini-btn copy" @click.stop="copyCurrentGroup(group)">复制</view>
                                        <view class="mini-btn delete" @click.stop="removeWateringGroup(index)">删除</view>
                                    </view>
                                </view>
                            </view>
                        </view>
                    </view>

                    <!-- 步骤3：分配设备 -->
                    <view v-else-if="wizardStep === 3" class="wizard-step-content">
                        <view v-if="availableValveDevices.length === 0" class="no-devices-warning">
                            <text>未找到WaterGroupValve设备，请先配置相关设备</text>
                        </view>

                        <view class="device-allocation">
                            <!-- 组切换器 -->
                            <view v-if="wateringGroups.length > 1" class="group-switcher">
                                <view class="action-btn ghost small" :class="{ disabled: currentGroupIndex === 0 }"
                                    @click="switchToPreviousGroup">
                                    <text>上一个</text>
                                </view>
                                <text class="group-counter">{{ currentGroupIndex + 1 }} / {{ wateringGroups.length
                                    }}</text>
                                <view class="action-btn ghost small"
                                    :class="{ disabled: currentGroupIndex === wateringGroups.length - 1 }"
                                    @click="switchToNextGroup">
                                    <text>下一个</text>
                                </view>
                            </view>

                            <!-- 设备选择列表 -->
                            <view v-for="(group, index) in wateringGroups" :key="group.name" class="group-device-config"
                                :class="{ 'active': index === currentGroupIndex, 'hidden': index !== currentGroupIndex }">
                                <view class="group-device-header">
                                    <text class="group-name-title">{{ group.name }}</text>
                                    <view class="display-mode-tabs">
                                        <view :class="['tab', valveDisplayMode === 'map' ? 'active' : '']"
                                            @click="openValveMap(group.name)">
                                            地图
                                        </view>
                                        <view :class="['tab', valveDisplayMode === 'list' ? 'active' : '']"
                                            @click="valveDisplayMode = 'list'">
                                            列表
                                        </view>
                                    </view>
                                </view>

                                <!-- 地图显示提示 -->
                                <view v-if="valveDisplayMode === 'map'" class="valve-selection-map-container">
                                    <view class="map-placeholder">
                                        <text class="map-hint">点击上方"地图"标签打开全屏地图选择阀门</text>
                                        <view class="selected-valves-info">
                                            <text>已选择 {{ getSelectedValvesCount(group.name) }} / {{
                                                availableValveDevices.length }} 个阀门</text>
                                            <view v-if="getSelectedValvesCount(group.name) > 0"
                                                class="action-btn danger small"
                                                @click="clearSelectedValves(group.name)">
                                                <text>清空</text>
                                            </view>
                                        </view>
                                    </view>
                                </view>

                                <!-- 列表显示 -->
                                <view v-if="valveDisplayMode === 'list'" class="valve-selection-list-container">
                                    <view class="valve-list-header">
                                        <text>已选择 {{ getSelectedValvesCount(group.name) }} / {{
                                            availableValveDevices.length }} 个阀门</text>
                                        <view class="list-actions">
                                            <view v-if="getSelectedValvesCount(group.name) > 0"
                                                class="action-btn danger small"
                                                @click="clearSelectedValves(group.name)">
                                                <text>清空</text>
                                            </view>
                                            <view
                                                v-if="getSelectedValvesCount(group.name) < availableValveDevices.length"
                                                class="action-btn primary small" @click="selectAllValves(group.name)">
                                                <text>全选</text>
                                            </view>
                                        </view>
                                    </view>
                                    <view class="valve-list-content">
                                        <view v-for="device in availableValveDevices" :key="device.device_name"
                                            class="valve-list-item"
                                            :class="{ 'selected': isValveSelected(device.device_name, group.name) }"
                                            @click="toggleValveSelection(device.device_name, group.name)">
                                            <view class="valve-item-content">
                                                <view class="valve-item-info">
                                                    <text class="valve-name">{{ device.device_name }}</text>
                                                </view>
                                                <view class="check-indicator">
                                                    {{ isValveSelected(device.device_name, group.name) ? '✓' : '' }}
                                                </view>
                                            </view>
                                        </view>
                                    </view>
                                </view>
                            </view>
                        </view>
                    </view>

                    <!-- 步骤4：施肥配置 -->
                    <view v-else-if="wizardStep === 4" class="wizard-step-content">
                        <view class="fert-config">
                            <view v-for="group in wateringGroups" :key="group.name" class="group-fert-config">
                                <text class="group-name-title">{{ group.name }}</text>

                                <view class="fert-method">
                                    <text class="form-label">施肥方式：</text>
                                    <view class="radio-group">
                                        <view
                                            :class="['radio-item', getFertConfig(group).method === 'WaterOnly' ? 'active' : '']"
                                            @click="getFertConfig(group).method = 'WaterOnly'">
                                            <text>只浇水</text>
                                        </view>
                                        <view
                                            :class="['radio-item', getFertConfig(group).method === 'AreaBased' ? 'active' : '']"
                                            @click="getFertConfig(group).method = 'AreaBased'">
                                            <text>亩定量</text>
                                        </view>
                                        <view
                                            :class="['radio-item', getFertConfig(group).method === 'Total' ? 'active' : '']"
                                            @click="getFertConfig(group).method = 'Total'">
                                            <text>总定量</text>
                                        </view>
                                        <view
                                            :class="['radio-item', getFertConfig(group).method === 'Time' ? 'active' : '']"
                                            @click="getFertConfig(group).method = 'Time'">
                                            <text>定时</text>
                                        </view>
                                    </view>
                                </view>

                                <!-- 施肥量相关参数（只浇水时隐藏） -->
                                <view v-if="getFertConfig(group).method !== 'WaterOnly'" class="fert-params">
                                    <view v-if="getFertConfig(group).method === 'AreaBased'" class="param-item">
                                        <text class="param-label">每亩施肥量：</text>
                                        <input class="param-input"
                                            v-model.number="getFertConfig(group).AB_fert"
                                            type="number" placeholder="施肥量" />
                                        <text class="unit">L/亩</text>
                                    </view>

                                    <view v-if="getFertConfig(group).method === 'Total'" class="param-item">
                                        <text class="param-label">施肥总量：</text>
                                        <input class="param-input"
                                            v-model.number="getFertConfig(group).total_fert"
                                            type="number" placeholder="总量" />
                                        <text class="unit">L</text>
                                    </view>

                                    <view v-if="getFertConfig(group).method === 'Time'" class="param-item">
                                        <text class="param-label">施肥时间：</text>
                                        <input class="param-input"
                                            v-model.number="getFertConfig(group).fert_time"
                                            type="number" placeholder="施肥时间" />
                                        <text class="unit">分钟</text>
                                    </view>
                                </view>

                                <!-- 时间参数：只浇水模式只需要总灌溉时间，其它模式配置肥前/肥后时间 -->
                                <view v-if="getFertConfig(group).method === 'WaterOnly'" class="time-params">
                                    <view class="param-item">
                                        <text class="param-label">总灌溉时间：</text>
                                        <input class="param-input"
                                            v-model.number="getFertConfig(group).total_time"
                                            type="number" placeholder="总灌溉时间" />
                                        <text class="unit">分钟</text>
                                    </view>
                                </view>
                                <view v-else class="time-params">
                                    <view class="param-item">
                                        <text class="param-label">肥前时间：</text>
                                        <input class="param-input"
                                            v-model.number="getFertConfig(group).pre_fert_time"
                                            type="number" placeholder="肥前时间" />
                                        <text class="unit">分钟</text>
                                    </view>
                                    <view class="param-item">
                                        <text class="param-label">肥后时间：</text>
                                        <input class="param-input"
                                            v-model.number="getFertConfig(group).post_fert_time"
                                            type="number" placeholder="肥后时间" />
                                        <text class="unit">分钟</text>
                                    </view>
                                </view>
                            </view>
                        </view>
                    </view>
                </view>

            </view>
        </scroll-view>

        <!-- 底部固定区域 -->
        <view class="wizard-footer">
            <!-- 建议亩数 - 仅在步骤2显示 -->
            <view v-if="wizardStep === 2" class="recommended-area-card" @click="openAreaParamsDialog">
                <text class="recommended-label">建议亩数</text>
                <text class="recommended-value" v-if="getRecommendedArea(0) > 0">
                    {{ getRecommendedArea(0).toFixed(2) }}亩
                </text>
                <text class="recommended-value" v-else>点击设置</text>
            </view>

            <!-- 操作按钮 -->
            <view class="wizard-actions">
            <view class="action-btn ghost" @click="goBack">
                <text>返回</text>
            </view>

            <view v-if="wizardStep > 1" class="action-btn ghost" @click="prevStep">
                <text>上一步</text>
            </view>

            <view v-if="wizardStep === 4" class="action-btn success" @click="finishWizard">
                <text>完成配置</text>
            </view>
            <view v-else class="action-btn primary" @click="nextStep">
                <text>下一步</text>
            </view>
            </view>
        </view>

        <Loading :show="pageLoading" text="加载中..." />

        <!-- FirstUI弹窗 -->
        <fui-dialog :show="showDialog" :title="dialogTitle" :buttons="dialogButtons" :maskClosable="false"
            @click="handleDialogClick" @close="closeDialog">
            <view class="dialog-content-custom">
                <fui-text :text="dialogLabel" :size="28" color="#606266" :padding="[0, 0, 20, 0]"></fui-text>
                <fui-input v-model="dialogInputValue" :placeholder="dialogPlaceholder" :maxlength="50"
                    :borderColor="dialogError ? '#f56c6c' : '#ebeef5'" @input="onDialogInput"></fui-input>
                <view v-if="dialogError" class="dialog-error">
                    <fui-text :text="dialogError" :size="24" color="#f56c6c"></fui-text>
                </view>
            </view>
        </fui-dialog>

        <!-- 建议亩数参数设置弹窗 -->
        <fui-dialog :show="showAreaParamsDialog" :title="'建议亩数计算参数'" :buttons="areaParamsDialogButtons"
            :maskClosable="false" @click="handleAreaParamsDialogClick" @close="closeAreaParamsDialog">
            <view class="area-params-dialog-content">
                <!-- 计算公式说明 -->
                <view class="params-formula-section">
                    <fui-text :text="'计算公式：'" :size="26" color="#606266" :fontWeight="500"></fui-text>
                    <view class="formula-text">
                        <text>系统流量 × 1000 ÷ (667 ÷ 铺设间距 ÷ 滴头间距 × 滴头流量) × 系数</text>
                    </view>
                </view>

                <!-- 参数输入 -->
                <view class="params-input-section">
                    <view class="param-row">
                        <fui-text :text="'系统流量：'" :size="28" color="#303133" :fontWeight="500"></fui-text>
                        <input class="param-input" v-model.number="tempAreaParams.system_flow" type="number"
                            placeholder="请输入" step="0.01" />
                        <text class="param-unit">m3/h</text>
                    </view>
                    <view class="param-row">
                        <fui-text :text="'铺设间距：'" :size="28" color="#303133" :fontWeight="500"></fui-text>
                        <input class="param-input" v-model.number="tempAreaParams.laying_spacing" type="number"
                            placeholder="请输入" step="0.01" />
                        <text class="param-unit">m</text>
                    </view>
                    <view class="param-row">
                        <fui-text :text="'滴头间距：'" :size="28" color="#303133" :fontWeight="500"></fui-text>
                        <input class="param-input" v-model.number="tempAreaParams.dripper_spacing" type="number"
                            placeholder="请输入" step="0.01" />
                        <text class="param-unit">m</text>
                    </view>
                    <view class="param-row">
                        <fui-text :text="'滴头流量：'" :size="28" color="#303133" :fontWeight="500"></fui-text>
                        <input class="param-input" v-model.number="tempAreaParams.dripper_flow" type="number"
                            placeholder="请输入" step="0.01" />
                        <text class="param-unit">L/h</text>
                    </view>
                    <view class="param-row">
                        <fui-text :text="'系数：'" :size="28" color="#303133" :fontWeight="500"></fui-text>
                        <input class="param-input" v-model.number="tempAreaParams.coefficient" type="number"
                            placeholder="请输入" step="0.01" />
                        <text class="param-unit">系统默认</text>
                    </view>
                </view>

                <!-- 计算结果 -->
                <view class="params-result-section">
                    <fui-text :text="'计算结果：'" :size="28" color="#303133" :fontWeight="500"></fui-text>
                    <fui-text :text="getTempRecommendedArea().toFixed(2) + '亩'" :size="32" color="#409eff"
                        :fontWeight="600"></fui-text>
                </view>
            </view>
        </fui-dialog>
    </view>
</template>

<script setup>
import { onLoad, onShow } from '@dcloudio/uni-app'
import { onMounted, ref, computed } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import Loading from '../../components/Loading.vue'
import fuiText from 'firstui-uni/firstui/fui-text/fui-text.vue'
import fuiDialog from 'firstui-uni/firstui/fui-dialog/fui-dialog.vue'
import fuiInput from 'firstui-uni/firstui/fui-input/fui-input.vue'
import call_remote from '../../../../lib/call_remote.js'

const mode = ref('create')
const isEditMode = computed(() => mode.value === 'edit')
const pageHeaderRef = ref(null)
const pageLoading = ref(false)
const wizardStep = ref(1)
const currentFarmName = ref('')

// 方案数据：仅用于输入方案名称（对齐 PC：第 1 步只输入名称）
// 不在第一步真正创建/下发方案，只有在 finishWizard 时统一下发
const schemes = ref([]) // 预留：后续如需加载已存在方案可复用
const selectedSchemeId = ref('') // 当前无选择已有方案的入口，可保持为空
const schemeName = ref('')
const newSchemeName = ref('')
const newSchemeDescription = ref('')

// 轮灌组数据
const wateringGroups = ref([])
const existingGroups = ref([])

// 设备选择
const availableValveDevices = ref([])
const selectedValveDevices = ref({})
const currentGroupIndex = ref(0)
const valveDisplayMode = ref('list')
const mapCenter = ref({ lat: 23.1291, lng: 113.2644 })
const mapScale = ref(12)

// 施肥配置（与 PC PolicyWizard 的字段保持一致）
const fertConfigs = ref({})

// 获取某个轮灌组的施肥配置（懒加载初始化，字段与 PC 完全一致）
const getFertConfig = (group) => {
    const key = group.configKey || group.name
    if (!fertConfigs.value[key]) {
        fertConfigs.value[key] = {
            method: 'AreaBased', // WaterOnly / AreaBased / Total / Time
            AB_fert: 0,
            total_fert: 0,
            fert_time: 0,
            pre_fert_time: 0,
            post_fert_time: 0,
            total_time: 0,
        }
    }
    return fertConfigs.value[key]
}

// 编辑模式下：将当前方案已有的轮灌组初始化到编辑列表中
const initWateringGroupsFromExisting = async () => {
    if (!isEditMode.value) return
    // 如果已经有编辑中的轮灌组，就不再重复初始化
    if (wateringGroups.value.length > 0) return
    if (!existingGroups.value.length) return

    existingGroups.value.forEach(g => {
        const name = g.name
        wateringGroups.value.push({
            name,
            area: g.area || 0,
            isCopied: false,
            configKey: name
        })
        fertConfigs.value[name] = g.fertConfig || {
            method: 'AreaBased',
            AB_fert: 0,
            total_fert: 0,
            fert_time: 0,
            pre_fert_time: 0,
            post_fert_time: 0,
            total_time: 0,
        }
        
        // 确保阀门数据是数组格式，并去除重复项
        let valvesArray = []
        if (g.valves) {
            if (Array.isArray(g.valves)) {
                valvesArray = [...g.valves]
            } else if (typeof g.valves === 'string') {
                valvesArray = parseValvesFromGroup({ valves: g.valves })
            }
        }
        selectedValveDevices.value[name] = [...new Set(valvesArray.filter(v => v && v.trim()))]
    })
}

// 面积参数
const farmAreaParams = ref({
    system_flow: 1,
    laying_spacing: 0,
    dripper_spacing: 0,
    dripper_flow: 0,
    coefficient: 0.9
})

// 弹窗相关
const showDialog = ref(false)
const dialogTitle = ref('')
const dialogLabel = ref('')
const dialogPlaceholder = ref('')
const dialogInputValue = ref('')
const dialogError = ref('')
const dialogCallback = ref(null)
const dialogValidateFn = ref(null)
const dialogButtons = ref([
    { text: '取消', color: '#606266' },
    { text: '确定', color: '#409eff' }
])

// 建议亩数参数弹窗
const showAreaParamsDialog = ref(false)
const tempAreaParams = ref({
    system_flow: 1,
    laying_spacing: 0,
    dripper_spacing: 0,
    dripper_flow: 0,
    coefficient: 0.9
})
const areaParamsDialogButtons = ref([
    { text: '取消', color: '#606266' },
    { text: '保存', color: '#409eff' }
])

// 计算属性
const allGroupsAreCopied = computed(() => {
    return wateringGroups.value.every(g => g.isCopied === true)
})

// 解析阀门
const parseValvesFromExpression = (expression) => {
    if (!expression || expression === '""' || expression === '[]' || expression.trim() === '') {
        return []
    }
    let cleanExpression = expression.trim()
    if (cleanExpression.startsWith('"') && cleanExpression.endsWith('"')) {
        cleanExpression = cleanExpression.slice(1, -1)
    }
    if (cleanExpression.startsWith('[') && cleanExpression.endsWith(']')) {
        const arrayContent = cleanExpression.slice(1, -1).trim()
        if (!arrayContent) return []
        const matches = arrayContent.match(/"([^"]+)"/g)
        if (matches) {
            return matches.map(m => m.replaceAll('"', '').trim()).filter(Boolean)
        }
        return arrayContent.split(',').map(v => v.trim()).filter(Boolean)
    }
    const matches = cleanExpression.match(/"([^"]+)"/g)
    if (matches) {
        return matches.map(m => m.replaceAll('"', '').trim()).filter(Boolean)
    }
    return cleanExpression.trim() ? [cleanExpression.trim()] : []
}

const parseFertMethod = (expression) => {
    const methodStr = expression.replaceAll('"', '')
    if (methodStr === '亩定量' || methodStr === 'AreaBased') return 'AreaBased'
    if (methodStr === '总定量' || methodStr === 'Total') return 'Total'
    if (methodStr === '定时' || methodStr === 'Time') return 'Time'
    return 'AreaBased'
}

const parseTimeValue = (expression) => {
    const value = Number.parseFloat(expression) || 0
    if (value > 1000) {
        return value / 60000
    }
    return value
}

const parseFertConfigFromVariables = (initVariables, fertConfig, area = 0) => {
    for (const initVar of initVariables) {
        const varName = initVar.variable_name
        const expression = initVar.expression || ''
        if (varName === 'method' || varName === '施肥策略') {
            fertConfig.method = parseFertMethod(expression)
        } else if (varName === 'fert_time' || varName === '施肥时间') {
            fertConfig.fert_time = parseTimeValue(expression)
        } else if (varName === 'pre_ms' || varName === '肥前时间') {
            fertConfig.pre_fert_time = parseTimeValue(expression)
        } else if (varName === 'post_ms' || varName === '肥后时间') {
            fertConfig.post_fert_time = parseTimeValue(expression)
        } else if (varName === '期望每亩施肥量' || varName === 'area_based_amount') {
            fertConfig.AB_fert = Number.parseFloat(expression) || 0
        } else if (varName === '期望施肥总量') {
            fertConfig.total_fert = Number.parseFloat(expression) || 0
        }
    }
    if (fertConfig.method === 'Total' && fertConfig.total_fert > 0 && area > 0) {
        fertConfig.AB_fert = fertConfig.total_fert / area
    }
    if (fertConfig.method === 'AreaBased' && fertConfig.AB_fert > 0 && area > 0) {
        fertConfig.total_fert = fertConfig.AB_fert * area
    }
}

const parseAreaFromVariable = (initVariables) => {
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

const parseValvesFromGroup = (group) => {
    const valveStr = group?.valves || group
    if (!valveStr || valveStr === '-') {
        return []
    }
    // 先尝试匹配引号内的内容
    const quoted = valveStr.match(/"([^"]+)"/g)
    if (quoted && quoted.length) {
        return quoted.map(i => i.replaceAll('"', '').trim()).filter(Boolean)
    }
    // 如果没有引号，按逗号、竖线或空格分割
    return valveStr.split(/[,|\s]+/).map(v => v.trim()).filter(Boolean)
}

// 打开弹窗
const openDialog = (title, label, placeholder, defaultValue = '', validateFn = null) => {
    dialogTitle.value = title
    dialogLabel.value = label
    dialogPlaceholder.value = placeholder
    dialogInputValue.value = defaultValue
    dialogError.value = ''
    dialogValidateFn.value = validateFn
    showDialog.value = true
}

// 关闭弹窗
const closeDialog = () => {
    showDialog.value = false
    dialogInputValue.value = ''
    dialogError.value = ''
    dialogCallback.value = null
    dialogValidateFn.value = null
}

// 弹窗输入处理 - 当输入时清除错误
const onDialogInput = () => {
    // v-model会自动更新dialogInputValue，这里只需要清除错误
    dialogError.value = ''
}

// 处理弹窗按钮点击
const handleDialogClick = (e) => {
    const index = e.index
    if (index === 1) { // 确定按钮
        const value = dialogInputValue.value.trim()

        if (dialogValidateFn.value) {
            const error = dialogValidateFn.value(value)
            if (error) {
                dialogError.value = error
                return
            }
        }

        if (dialogCallback.value) {
            dialogCallback.value(value)
        }

        closeDialog()
    } else { // 取消按钮
        closeDialog()
    }
}

// 确认弹窗
const confirmDialog = () => {
    handleDialogClick({ index: 1 })
}

// 检查当前农场是否有waterGroup驱动
const checkWaterGroupDriver = async () => {
    try {
        if (!currentFarmName.value) {
            console.log('检查waterGroup驱动：当前农场名称为空')
            return false
        }

        console.log('检查waterGroup驱动，农场名称:', currentFarmName.value)

        // 使用和loadValveDevices相同的接口
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        let allDevices = []
        let pageNo = 0
        let hasMore = true

        while (hasMore) {
            const result = await call_remote('/device_management/list_device', {
                pageNo,
                farm_name: currentFarmName.value || undefined
            }, token)

            const devices = result.devices || []
            allDevices = allDevices.concat(devices)
            hasMore = devices.length >= 20 // 注意：loadValveDevices使用的是20作为分页大小
            pageNo++
        }

        console.log('检查waterGroup驱动，找到设备数量:', allDevices.length)
        console.log('检查waterGroup驱动，设备驱动列表:', allDevices.map(d => ({ name: d.device_name, driver: d.driver_name })))

        // 检查是否有WaterGroupValve驱动
        const hasWaterGroupDriver = allDevices.some(device => {
            const driverName = device.driver_name || ''
            // 检查多种可能的驱动名称格式
            return driverName === 'WaterGroupValve' ||
                driverName === 'WaterGroupValve_v2' ||
                driverName === 'waterGroupValve' ||
                driverName === 'water_group_valve' ||
                driverName.toLowerCase() === 'watergroupvalve'
        })

        console.log('检查waterGroup驱动，结果:', hasWaterGroupDriver)
        return hasWaterGroupDriver
    } catch (error) {
        console.error('检查waterGroup驱动失败:', error)
        return false
    }
}

// 添加轮灌组
const addWateringGroup = async () => {
    // 检查是否有waterGroup驱动
    const hasDriver = await checkWaterGroupDriver()
    if (!hasDriver) {
        uni.showToast({
            title: '当前农场没有WaterGroup驱动设备，请先配置相关设备',
            icon: 'none',
            duration: 3000
        })
        return
    }

    let defaultName = `轮灌组${wateringGroups.value.length + 1}`
    let counter = 1
    while (isGroupNameDuplicate(defaultName)) {
        counter++
        defaultName = `轮灌组${counter}`
    }

    const validateFn = (value) => {
        if (!value) {
            return '轮灌组名称不能为空'
        }
        if (isGroupNameDuplicate(value)) {
            return '该轮灌组名称已存在，请使用其他名称'
        }
        return null
    }

    dialogCallback.value = (groupName) => {
        wateringGroups.value.push({
            name: groupName,
            area: 0,
            isCopied: false,
            configKey: groupName
        })

        selectedValveDevices.value[groupName] = []
        fertConfigs.value[groupName] = {
            method: 'AreaBased',
            AB_fert: 0,
            total_fert: 0,
            fert_time: 0,
            pre_fert_time: 0,
            post_fert_time: 0,
            total_time: 0,
        }
    }

    openDialog('新增轮灌组', '请输入新轮灌组的名称', '请输入轮灌组名称', defaultName, validateFn)
}

// 删除轮灌组
const removeWateringGroup = (index) => {
    const groupName = wateringGroups.value[index].name
    wateringGroups.value.splice(index, 1)
    delete selectedValveDevices.value[groupName]
    delete fertConfigs.value[groupName]
    if (currentGroupIndex.value >= wateringGroups.value.length) {
        currentGroupIndex.value = Math.max(0, wateringGroups.value.length - 1)
    }
}

// 加载已配置的轮灌组
const loadExistingGroups = async () => {
    try {
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        const params = { pageNo: 0 }
        const currentSchemeId = selectedSchemeId.value ? String(selectedSchemeId.value) : ''
        // 编辑模式下，如果携带了方案ID，只加载当前方案下的轮灌组
        if (isEditMode.value && currentSchemeId) {
            params.scheme_id = currentSchemeId
        }
        const response = await call_remote('/policy/list_watering_groups', params, token)
        if (response && response.groups) {
            let filteredGroups = response.groups
            if (currentSchemeId) {
                filteredGroups = filteredGroups.filter(g => String(g.scheme_id || '') === currentSchemeId)
            }
            if (currentFarmName.value && currentFarmName.value !== '默认农场') {
                const policyFarmMatches = await Promise.all(
                    filteredGroups.map(async (group) => {
                        try {
                            const farmMatch = await call_remote('/policy/get_matched_farm', {
                                policy_name: group.name
                            }, token)
                            return {
                                group,
                                farmName: farmMatch.farm_name
                            }
                        } catch (error) {
                            console.warn(`获取策略 ${group.name} 的匹配农场失败:`, error)
                            return {
                                group,
                                farmName: null
                            }
                        }
                    })
                )
                filteredGroups = policyFarmMatches
                    .filter(item => item.farmName === currentFarmName.value)
                    .map(item => item.group)
            }

            const policyListResponse = await call_remote('/policy/list_policy', { pageNo: 0 }, token)
            const allPolicies = policyListResponse?.policies || []

            // 解析单个轮灌组配置的辅助函数
            const parseGroupConfig = (group, policy) => {
                let area = group.area || 0
                let valves = []
                let fertConfig = {
                    method: 'AreaBased',
                    AB_fert: 0,
                    total_fert: 0,
                    fert_time: 0,
                    pre_fert_time: 0,
                    post_fert_time: 0,
                    total_time: group.total_time || 0,
                }

                if (!policy?.init_variables) {
                    return { area, valves, fertConfig }
                }

                // 解析面积
                const areaFromVar = parseAreaFromVariable(policy.init_variables)
                if (areaFromVar !== null) {
                    area = areaFromVar
                }

                // 解析阀门
                for (const initVar of policy.init_variables) {
                    const varName = initVar.variable_name
                    if (varName === 'valves' || varName === '组内阀门') {
                        valves = parseValvesFromExpression(initVar.expression || '')
                        break
                    }
                }

                // 解析施肥配置
                parseFertConfigFromVariables(policy.init_variables, fertConfig, area)

                // 解析时间值（从毫秒转换为分钟）
                let preTimeMs = 0
                let fertTimeMs = 0
                let postTimeMs = 0
                for (const initVar of policy.init_variables) {
                    const varName = initVar.variable_name
                    const expression = initVar.expression || ''
                    if (varName === '肥前时间') {
                        preTimeMs = Number.parseFloat(expression) || 0
                        // 如果值大于1000，说明是毫秒，需要转换为分钟；否则已经是分钟
                        fertConfig.pre_fert_time = preTimeMs > 1000 ? preTimeMs / 60000 : preTimeMs
                    } else if (varName === '施肥时间') {
                        fertTimeMs = Number.parseFloat(expression) || 0
                        fertConfig.fert_time = fertTimeMs > 1000 ? fertTimeMs / 60000 : fertTimeMs
                    } else if (varName === '肥后时间') {
                        postTimeMs = Number.parseFloat(expression) || 0
                        fertConfig.post_fert_time = postTimeMs > 1000 ? postTimeMs / 60000 : postTimeMs
                    }
                }
                if (preTimeMs > 0 || fertTimeMs > 0 || postTimeMs > 0) {
                    fertConfig.total_time = (preTimeMs + fertTimeMs + postTimeMs) / 60000
                }

                return { area, valves, fertConfig }
            }

            existingGroups.value = await Promise.all(filteredGroups.map(async (group) => {
                const policy = allPolicies.find(p => p.name === group.name)
                const { area, valves: parsedValves, fertConfig } = parseGroupConfig(group, policy)

                // 优先使用从 init_variables 解析的阀门，如果为空或数量较少，则从 group.valves 补充
                let valves = parsedValves.length > 0 ? [...parsedValves] : []
                const groupValves = parseValvesFromGroup(group)
                if (groupValves.length > 0) {
                    // 合并两个来源的阀门，去重
                    const allValves = [...new Set([...valves, ...groupValves])]
                    // 如果 group.valves 有更多阀门，优先使用它（因为它是运行时数据，更准确）
                    if (groupValves.length >= valves.length) {
                        valves = groupValves
                    } else {
                        valves = allValves
                    }
                }

                return {
                    name: group.name,
                    area: area,
                    valves: valves,
                    fertConfig: fertConfig
                }
            }))

            uni.showToast({
                title: `已加载 ${existingGroups.value.length} 个已配置的轮灌组`,
                icon: 'success'
            })
        } else {
            existingGroups.value = []
            uni.showToast({ title: '当前没有已配置的轮灌组', icon: 'none' })
        }
    } catch (error) {
        console.error('加载已配置轮灌组失败:', error)
        uni.showToast({ title: '加载已配置轮灌组失败', icon: 'none' })
        existingGroups.value = []
    }
}

// 验证函数
const isGroupNameDuplicate = (name, excludeName = null) => {
    const existsInCurrent = wateringGroups.value.some(g => g.name === name && g.name !== excludeName)
    const existsInExisting = existingGroups.value.some(g => g.name === name)
    return existsInCurrent || existsInExisting
}

// 复制已配置的轮灌组
const copyExistingGroup = (existingGroup) => {
    let groupName = existingGroup.name.trim()
    if (groupName.length > 100) {
        console.warn('轮灌组名称过长，已截断')
        groupName = groupName.substring(0, 100)
    }
    let endIndex = groupName.length
    while (endIndex > 0 && groupName.codePointAt(endIndex - 1) >= 48 && groupName.codePointAt(endIndex - 1) <= 57) {
        endIndex--
    }
    const baseName = endIndex > 0 ? groupName.substring(0, endIndex) : '轮灌组'
    let defaultName = `${baseName}${wateringGroups.value.length + 1}`
    let counter = 1
    while (isGroupNameDuplicate(defaultName)) {
        counter++
        defaultName = `${baseName}${counter}`
    }

    const validateFn = (value) => {
        if (!value) {
            return '轮灌组名称不能为空'
        }
        if (isGroupNameDuplicate(value)) {
            return '该轮灌组名称已存在，请使用其他名称'
        }
        return null
    }

    dialogCallback.value = (trimmedName) => {
        const newGroup = {
            name: trimmedName,
            area: existingGroup.area || 0,
            isCopied: true,
            configKey: trimmedName
        }
        wateringGroups.value.push(newGroup)

        fertConfigs.value[trimmedName] = {
            method: existingGroup.fertConfig?.method || 'AreaBased',
            AB_fert: existingGroup.fertConfig?.AB_fert ?? 0,
            total_fert: existingGroup.fertConfig?.total_fert ?? 0,
            fert_time: existingGroup.fertConfig?.fert_time ?? 0,
            pre_fert_time: existingGroup.fertConfig?.pre_fert_time ?? 0,
            post_fert_time: existingGroup.fertConfig?.post_fert_time ?? 0,
            total_time: existingGroup.fertConfig?.total_time ?? 0,
        }

        selectedValveDevices.value[trimmedName] = []

        uni.showToast({
            title: `已将轮灌组 ${existingGroup.name} 的配置复制到 ${trimmedName}`,
            icon: 'success'
        })

        return trimmedName
    }

    openDialog('复制轮灌组', `请输入新轮灌组的名称（复制自：${existingGroup.name}）`, '请输入轮灌组名称', defaultName, validateFn)
}

// 加载阀门设备
const loadValveDevices = async () => {
    try {
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        let allDevices = []
        let pageNo = 0
        let hasMore = true

        while (hasMore) {
            const result = await call_remote('/device_management/list_device', {
                pageNo,
                farm_name: currentFarmName.value || undefined
            }, token)
            const devices = result.devices || []
            allDevices = allDevices.concat(devices)
            hasMore = devices.length >= 20
            pageNo++
        }

        availableValveDevices.value = allDevices.filter(device =>
            device.driver_name === 'WaterGroupValve' || device.driver_name === 'WaterGroupValve_v2'
        ).map(device => ({
            device_name: device.device_name,
            label: device.device_name,
            is_online: true,
            longitude: device.longitude,
            latitude: device.latitude
        }))

        // 计算地图中心
        if (availableValveDevices.value.length > 0) {
            const lngs = availableValveDevices.value.map(d => d.longitude).filter(Boolean)
            const lats = availableValveDevices.value.map(d => d.latitude).filter(Boolean)
            if (lngs.length > 0 && lats.length > 0) {
                mapCenter.value = {
                    lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
                    lat: lats.reduce((a, b) => a + b, 0) / lats.length
                }
            }
        }
    } catch (error) {
        console.error('加载阀门设备失败:', error)
        availableValveDevices.value = []
    }
}

// 切换组
const switchToPreviousGroup = () => {
    if (currentGroupIndex.value > 0) {
        currentGroupIndex.value--
        const groupName = wateringGroups.value[currentGroupIndex.value]?.name
        if (groupName && !selectedValveDevices.value[groupName]) {
            selectedValveDevices.value[groupName] = []
        }
    }
}

const switchToNextGroup = () => {
    if (currentGroupIndex.value < wateringGroups.value.length - 1) {
        currentGroupIndex.value++
        const groupName = wateringGroups.value[currentGroupIndex.value]?.name
        if (groupName && !selectedValveDevices.value[groupName]) {
            selectedValveDevices.value[groupName] = []
        }
    }
}

// 复制当前列表中的组
const copyCurrentGroup = (group) => {
    if (!group || !group.name) return
    let baseName = group.name
    let counter = 1
    let newName = `${baseName}-副本${counter}`
    while (isGroupNameDuplicate(newName)) {
        counter++
        newName = `${baseName}-副本${counter}`
    }
    const newGroup = {
        name: newName,
        area: group.area || 0,
        isCopied: true,
        configKey: newName
    }
    wateringGroups.value.push(newGroup)
    fertConfigs.value[newName] = {
        ...(fertConfigs.value[group.configKey || group.name] || {
            method: 'AreaBased',
            AB_fert: 0,
            total_fert: 0,
            fert_time: 0,
            pre_fert_time: 0,
            post_fert_time: 0,
            total_time: 0,
        })
    }
    selectedValveDevices.value[newName] = [...(selectedValveDevices.value[group.configKey || group.name] || [])]
    uni.showToast({ title: `已复制 ${group.name}`, icon: 'success' })
}

// 查看组详情（简版弹窗）
const viewGroupDetail = (group) => {
    if (!group) return
    const configKey = group.configKey || group.name
    const config = fertConfigs.value[configKey] || {}
    const valves = selectedValveDevices.value[configKey] || []
    const detail = `
名称：${group.name}
面积：${group.area || 0} 亩
阀门：${valves.join(', ') || '-'}
施肥方式：${config.method || '-'}
每亩施肥量：${config.AB_fert ?? '-'}
总定量：${config.total_fert ?? '-'}
施肥时间：${config.fert_time ?? '-'}
肥前时间：${config.pre_fert_time ?? '-'}
肥后时间：${config.post_fert_time ?? '-'}
总灌溉时间：${config.total_time ?? '-'}
    `
    uni.showModal({
        title: '轮灌组详情',
        content: detail,
        showCancel: false
    })
}

// 查看已配置轮灌组详情
const viewExistingGroup = (existingGroup) => {
    if (!existingGroup) return
    const config = existingGroup.fertConfig || {}
    const valves = existingGroup.valves || []
    const detail = `
名称：${existingGroup.name}
面积：${existingGroup.area || 0} 亩
阀门：${valves.join(', ') || '-'}
施肥方式：${config.method || '-'}
每亩施肥量：${config.AB_fert ?? '-'}
总定量：${config.total_fert ?? '-'}
施肥时间：${config.fert_time ?? '-'}
肥前时间：${config.pre_fert_time ?? '-'}
肥后时间：${config.post_fert_time ?? '-'}
总灌溉时间：${config.total_time ?? '-'}
    `
    uni.showModal({
        title: '轮灌组详情',
        content: detail,
        showCancel: false
    })
}

// 从已配置轮灌组直接进入"编辑阀门"：不再新增副本，直接用原名进入第3步
const editExistingGroupValves = async (existingGroup) => {
    if (!existingGroup || !existingGroup.name) return

    // 重新从后端获取最新的轮灌组数据，确保阀门数据是最新的
    try {
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        const groupsResp = await call_remote('/policy/list_watering_groups', { pageNo: 0 }, token)
        const latestGroup = groupsResp?.groups?.find(g => g.name === existingGroup.name)
        
        // 如果找到最新数据，使用最新的阀门数据
        if (latestGroup && latestGroup.valves && latestGroup.valves !== '-') {
            const latestValves = parseValvesFromGroup({ valves: latestGroup.valves })
            if (latestValves.length > 0) {
                existingGroup.valves = latestValves
            }
        }
    } catch (error) {
        console.warn('获取最新轮灌组数据失败，使用缓存数据:', error)
    }

    // 先尝试在当前编辑列表中找到该组
    let idx = wateringGroups.value.findIndex(g => g.name === existingGroup.name)

    // 如果当前列表没有，就按原名补一条（不加"副本"）
    if (idx < 0) {
        const newGroup = {
            name: existingGroup.name,
            area: existingGroup.area || 0,
            isCopied: true,
            configKey: existingGroup.name
        }
        wateringGroups.value.push(newGroup)

        // 补全施肥配置
        fertConfigs.value[existingGroup.name] = {
            method: existingGroup.fertConfig?.method || 'AreaBased',
            AB_fert: existingGroup.fertConfig?.AB_fert ?? 0,
            total_fert: existingGroup.fertConfig?.total_fert ?? 0,
            fert_time: existingGroup.fertConfig?.fert_time ?? 0,
            pre_fert_time: existingGroup.fertConfig?.pre_fert_time ?? 0,
            post_fert_time: existingGroup.fertConfig?.post_fert_time ?? 0,
            total_time: existingGroup.fertConfig?.total_time ?? 0,
        }

        idx = wateringGroups.value.length - 1
    } else {
        // 如果组已存在，确保它有 configKey
        if (!wateringGroups.value[idx].configKey) {
            wateringGroups.value[idx].configKey = existingGroup.name
        }
    }

    // 无论组是否已存在，都要更新阀门列表（确保使用最新数据）
    const configKey = wateringGroups.value[idx]?.configKey || existingGroup.name
    
    // 确保阀门数据是数组格式，并去除重复项
    let valvesArray = []
    if (existingGroup.valves) {
        if (Array.isArray(existingGroup.valves)) {
            valvesArray = [...existingGroup.valves]
        } else if (typeof existingGroup.valves === 'string') {
            // 如果是字符串，尝试解析
            valvesArray = parseValvesFromGroup({ valves: existingGroup.valves })
        }
    }
    
    // 去除重复项并过滤空值
    selectedValveDevices.value[configKey] = [...new Set(valvesArray.filter(v => v && v.trim()))]

    // 跳到第3步并定位到该组
    currentGroupIndex.value = idx
    wizardStep.value = 3
}

// 从候选列表中移除已配置轮灌组（仅前端列表，不立即删后端）
const removeExistingGroup = (existingGroup) => {
    existingGroups.value = existingGroups.value.filter(g => g.name !== existingGroup.name)
}

// 编辑阀门：跳到第 3 步并聚焦当前组
const editValvesForGroup = (index) => {
    if (index >= 0 && index < wateringGroups.value.length) {
        currentGroupIndex.value = index
        wizardStep.value = 3
    }
}

// 设备选择相关
const isValveSelected = (deviceName, groupName) => {
    const configKey = wateringGroups.value.find(g => g.name === groupName)?.configKey || groupName
    return selectedValveDevices.value[configKey]?.includes(deviceName) || false
}

const toggleValveSelection = (deviceName, groupName) => {
    const configKey = wateringGroups.value.find(g => g.name === groupName)?.configKey || groupName
    if (!selectedValveDevices.value[configKey]) {
        selectedValveDevices.value[configKey] = []
    }
    const index = selectedValveDevices.value[configKey].indexOf(deviceName)
    if (index > -1) {
        selectedValveDevices.value[configKey].splice(index, 1)
    } else {
        selectedValveDevices.value[configKey].push(deviceName)
    }
}

const clearSelectedValves = (groupName) => {
    const configKey = wateringGroups.value.find(g => g.name === groupName)?.configKey || groupName
    if (selectedValveDevices.value[configKey]) {
        selectedValveDevices.value[configKey] = []
    }
}

const selectAllValves = (groupName) => {
    const configKey = wateringGroups.value.find(g => g.name === groupName)?.configKey || groupName
    if (!selectedValveDevices.value[configKey]) {
        selectedValveDevices.value[configKey] = []
    }
    selectedValveDevices.value[configKey] = availableValveDevices.value.map(d => d.device_name)
}

const getSelectedValvesCount = (groupName) => {
    const configKey = wateringGroups.value.find(g => g.name === groupName)?.configKey || groupName
    return selectedValveDevices.value[configKey]?.length || 0
}

const getMapMarkers = (groupName) => {
    const configKey = wateringGroups.value.find(g => g.name === groupName)?.configKey || groupName
    const selected = selectedValveDevices.value[configKey] || []
    return availableValveDevices.value.map((device, idx) => ({
        id: idx,
        latitude: device.latitude,
        longitude: device.longitude,
        title: device.device_name,
        iconPath: selected.includes(device.device_name) ? '/static/tabbar/Irrigation-active.png' : '/static/tabbar/Irrigation.png',
        width: 32,
        height: 32,
        callout: {
            content: device.device_name,
            display: 'ALWAYS',
            bgColor: '#ffffff',
            color: '#303133',
            borderRadius: 8,
            padding: 6
        }
    })).filter(m => m.latitude && m.longitude)
}

const onMarkerTap = (e) => {
    const marker = availableValveDevices.value.find((d, idx) => idx === e.detail.markerId)
    if (!marker) return
    const currentGroup = wateringGroups.value[currentGroupIndex.value]
    if (currentGroup) {
        toggleValveSelection(marker.device_name, currentGroup.name)
    }
}

// 方案相关
// 目前 mobile 向导暂不支持在第一步选择历史方案，因此不加载 scheme 列表，
// 保留 loadSchemes 空实现以便后续扩展时兼容调用。
const loadSchemes = async () => {
    schemes.value = []
}

const validateSchemeStep = () => {
    const name = (schemeName.value || '').trim()
    if (!name) {
        uni.showToast({ title: '请输入方案名称', icon: 'none' })
        return false
    }
    schemeName.value = name
    return true
}

// 验证步骤：检查轮灌组和面积
const validateStep1 = () => {
    if (wateringGroups.value.length === 0) {
        uni.showToast({ title: '请至少创建一个轮灌组', icon: 'none' })
        return false
    }
    for (const group of wateringGroups.value) {
        if (group.area <= 0) {
            uni.showToast({ title: `请为${group.name}设置有效的面积`, icon: 'none' })
            return false
        }
    }
    return true
}

// 验证步骤：检查阀门分配
const validateStep2 = () => {
    for (const group of wateringGroups.value) {
        const configKey = group.configKey || group.name
        if (!selectedValveDevices.value[configKey] || selectedValveDevices.value[configKey].length === 0) {
            uni.showToast({ title: `请为${group.name}分配至少一个阀门设备`, icon: 'none' })
            return false
        }
    }
    return true
}

// 步骤导航
const nextStep = async () => {
    if (wizardStep.value === 1) {
        if (!validateSchemeStep()) return
        wizardStep.value = 2
        return
    }
    if (wizardStep.value === 2) {
        if (!validateStep1()) return
        wizardStep.value = 3
        await loadValveDevices()
        return
    }
    if (wizardStep.value === 3) {
        if (!validateStep2()) return
        wizardStep.value = 4
        return
    }
}

const prevStep = () => {
    if (wizardStep.value > 1) {
        wizardStep.value--
    }
}

// 返回上一页
const goBack = () => {
    // 使用 switchTab 返回到灌溉页面（tabBar页面）
    uni.switchTab({
        url: '/pages/irrigation/index'
    })
}

// 验证施肥配置（完全对齐 PC PolicyWizard 的规则）
const validateFertConfig = (group, config) => {
    if (!config) {
        uni.showToast({ title: `请为${group.name}设置施肥配置`, icon: 'none' })
        return false
    }

    // 只浇水：只校验总灌溉时间
    if (config.method === 'WaterOnly') {
        if (!config.total_time || config.total_time <= 0) {
            uni.showToast({ title: `请为${group.name}设置有效的总灌溉时间参数`, icon: 'none' })
            return false
        }
        return true
    }

    // 非只浇水：校验肥前/施肥/肥后时间组合
    const pre = config.pre_fert_time || 0
    const fert = config.method === 'Time' ? (config.fert_time || 0) : 0
    const post = config.post_fert_time || 0
    const total = pre + fert + post

    if (total <= 0) {
        uni.showToast({ title: `请为${group.name}设置有效的灌溉时间参数（肥前时间、施肥时间、肥后时间）`, icon: 'none' })
        return false
    }
    if (config.method === 'AreaBased' && (!config.AB_fert || config.AB_fert <= 0)) {
        uni.showToast({ title: `请为${group.name}设置有效的亩定量施肥参数`, icon: 'none' })
        return false
    }
    if (config.method === 'Total' && (!config.total_fert || config.total_fert <= 0)) {
        uni.showToast({ title: `请为${group.name}设置有效的总定量施肥参数`, icon: 'none' })
        return false
    }
    if (config.method === 'Time' && fert <= 0) {
        uni.showToast({ title: `请为${group.name}设置有效的定时施肥参数`, icon: 'none' })
        return false
    }
    return true
}

// 构建最终配置（字段和含义与 PC 的 finalConfig 完全一致）
const buildFinalConfig = (group) => {
    const configKey = group.configKey || group.name
    const config = fertConfigs.value[configKey]
    if (!config) return null

    const area = group.area
    let AB_fert = config.AB_fert || 0
    if (config.method === 'Total' && area > 0) {
        AB_fert = config.total_fert / area
    }
    // 只浇水：施肥量强制为 0
    if (config.method === 'WaterOnly') {
        AB_fert = 0
    }

    let total_time_minutes = 0
    let pre_fert_time_hours = 0
    let fert_time_hours = 0
    let post_fert_time_hours = 0

    if (config.method === 'WaterOnly') {
        total_time_minutes = config.total_time || 0
    } else {
        const pre_minutes = config.pre_fert_time || 0
        const fert_minutes = config.method === 'Time' ? (config.fert_time || 0) : 0
        const post_minutes = config.post_fert_time || 0
        pre_fert_time_hours = pre_minutes / 60
        fert_time_hours = fert_minutes / 60
        post_fert_time_hours = post_minutes / 60
    }

    return {
        name: group.name,
        area,
        valves: selectedValveDevices.value[group.name] || [],
        method: config.method === 'WaterOnly' ? 'AreaBased' : config.method,
        AB_fert: Number.parseFloat(AB_fert.toFixed(2)),
        total_fert: config.method === 'Total' ? (config.total_fert || 0) : 0,
        fert_time: fert_time_hours,
        pre_fert_time: pre_fert_time_hours,
        post_fert_time: post_fert_time_hours,
        total_time: total_time_minutes,
        water_only: config.method === 'WaterOnly',
    }
}

// 完成配置
const finishWizard = async () => {
    if (wateringGroups.value.length === 0) {
        uni.showToast({ title: '请至少创建一个轮灌组', icon: 'none' })
        return
    }

    // 验证所有轮灌组的配置
    for (const group of wateringGroups.value) {
        const configKey = group.configKey || group.name
        const config = fertConfigs.value[configKey]
        if (!validateFertConfig(group, config)) {
            return
        }
    }

    // 构建最终配置
    const finalConfig = wateringGroups.value.map(buildFinalConfig).filter(Boolean)

    if (finalConfig.length === 0) {
        uni.showToast({ title: '没有有效的轮灌组配置', icon: 'none' })
        return
    }

    if (!validateSchemeStep()) {
        return
    }

    try {
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        const farm_name = currentFarmName.value || undefined

        if (!farm_name) {
            uni.showToast({ title: '请先选择农场', icon: 'none' })
            return
        }

        // 与 PC 端保持一致：下发前先确保供水/总策略/施肥等必要策略存在
        try {
            await ensureRequiredPolicies(farm_name, token)
        } catch (e) {
            console.error('确保必要策略失败:', e)
            uni.showToast({
                title: e?.err_msg || e?.message || '检查必要策略失败',
                icon: 'none'
            })
            return
        }

        // 下发配置
        console.log('下发轮灌组配置:', { groups: finalConfig, farm_name, scheme_id: selectedSchemeId.value, scheme_name: schemeName.value })
        const resp = await call_remote('/policy/apply_wizard_groups', {
            groups: finalConfig,
            farm_name: farm_name,
            scheme_id: selectedSchemeId.value || undefined,
            scheme_name: schemeName.value?.trim() || undefined
        }, token)
        console.log('接口返回:', resp)

        if (resp && resp.result) {
            uni.showToast({ title: '轮灌组策略已下发并生效', icon: 'success' })
            setTimeout(() => {
                uni.switchTab({
                    url: '/pages/irrigation/index'
                })
            }, 1500)
        } else {
            uni.showToast({ title: resp?.err_msg || '下发失败', icon: 'none' })
        }
    } catch (e) {
        console.error('下发异常:', e)
        uni.showToast({ title: e?.err_msg || e?.message || '下发失败', icon: 'none' })
    }
}

// 检查设备是否存在
const checkDevicesExist = async (farm_name, requiredDevices, token) => {
    const deviceList = await call_remote('/device_management/list_device', {
        farm_name: farm_name,
        pageNo: 0
    }, token)
    const existingDevices = deviceList?.devices || []
    const existingDeviceNames = new Set(existingDevices.map(d => d.device_name))
    return requiredDevices.filter(name => !existingDeviceNames.has(name))
}

// 创建供水策略
const createWaterPolicy = async (farm_name, token) => {
    const requiredDevices = [
        `${farm_name}-主泵`,
        `${farm_name}-主管道压力计`,
        `${farm_name}-主管道流量计`
    ]

    const missingDevices = await checkDevicesExist(farm_name, requiredDevices, token)
    if (missingDevices.length > 0) {
        const errorMsg = `缺少必要设备：${missingDevices.join('、')}。请先配置这些设备，设备名称格式必须为"${farm_name}-设备名"`
        throw new Error(errorMsg + `。请先配置以下设备（设备名称格式必须为"${farm_name}-设备名"）：\n1. ${farm_name}-主泵\n2. ${farm_name}-主管道压力计\n3. ${farm_name}-主管道流量计`)
    }

    await call_remote('/config/init_water_policy', {
        farm_name: farm_name,
        flow_warning_low_limit: 1,
        flow_warning_high_limit: 6,
        pressure_warning_low_limit: 0.1,
        pressure_warning_high_limit: 0.25,
        pressure_shutdown_low_limit: 0.05,
        pressure_shutdown_high_limit: 0.3,
        flow_check_interval: 60,
        pressure_shutdown_check_interval: 3
    }, token)
}

// 创建总策略
const createGlobalPolicy = async (farm_name, token) => {
    await call_remote('/config/init_global_policy', {
        farm_name: farm_name,
        start_hour: 8
    }, token)
}

// 创建施肥策略（可选）
const createFertPolicy = async (farm_name, token) => {
    const requiredFertDevices = [
        `${farm_name}-施肥泵`,
        `${farm_name}-施肥流量计`,
        `${farm_name}-施肥液位计`
    ]

    try {
        const missingDevices = await checkDevicesExist(farm_name, requiredFertDevices, token)
        if (missingDevices.length > 0) {
            console.warn(`缺少施肥策略必要设备：${missingDevices.join('、')}，跳过创建施肥策略`)
            return
        }

        await call_remote('/config/init_fert_policy', {
            farm_name: farm_name,
            flow_expected_value: 2,
            flow_warning_max_offset: 0.5,
            flow_check_interval: 60,
            level_warning_limit: 0.8,
            level_shutdown_limit: 0.5,
            level_check_interval: 60
        }, token)
    } catch (e) {
        console.warn('创建施肥策略失败:', e)
    }
}

// 确保必要的策略存在
const ensureRequiredPolicies = async (farm_name, token) => {
    if (!farm_name) {
        throw new Error('请先选择农场')
    }

    const policyList = await call_remote('/policy/list_policy', { pageNo: 0, farm_name: farm_name }, token)
    const existingPolicies = policyList?.policies || []
    const existingPolicyNames = new Set(existingPolicies.map(p => p.name))

    // 检查并创建供水策略
    const waterPolicyName = `${farm_name}-供水`
    if (!existingPolicyNames.has(waterPolicyName)) {
        try {
            await createWaterPolicy(farm_name, token)
        } catch (e) {
            if (e?.err_msg && e.err_msg.includes('缺少必要设备')) {
                throw e
            }
            throw e
        }
    }

    // 检查并创建总策略
    const globalPolicyName = `${farm_name}-总策略`
    if (!existingPolicyNames.has(globalPolicyName)) {
        await createGlobalPolicy(farm_name, token)
    }

    // 检查并创建施肥策略（可选）
    const fertPolicyName = `${farm_name}-施肥`
    if (!existingPolicyNames.has(fertPolicyName)) {
        await createFertPolicy(farm_name, token)
    }
}

// 建议亩数计算
const getRecommendedArea = (index) => {
    const params = farmAreaParams.value
    const system_flow = Number(params.system_flow) || 0
    const laying_spacing = Number(params.laying_spacing) || 0
    const dripper_spacing = Number(params.dripper_spacing) || 0
    const dripper_flow = Number(params.dripper_flow) || 0
    const coefficient = Number(params.coefficient) || 0.9

    if (system_flow <= 0 || laying_spacing <= 0 || dripper_spacing <= 0 || dripper_flow <= 0) {
        return 0
    }

    const denominator = (667 / laying_spacing / dripper_spacing) * dripper_flow
    if (denominator === 0 || !Number.isFinite(denominator)) {
        return 0
    }

    const result = (system_flow * 1000 / denominator) * coefficient
    return result > 0 && Number.isFinite(result) ? result : 0
}

// 临时参数计算建议亩数（用于弹窗预览）
const getTempRecommendedArea = () => {
    const params = tempAreaParams.value
    const system_flow = Number(params.system_flow) || 0
    const laying_spacing = Number(params.laying_spacing) || 0
    const dripper_spacing = Number(params.dripper_spacing) || 0
    const dripper_flow = Number(params.dripper_flow) || 0
    const coefficient = Number(params.coefficient) || 0.9

    if (system_flow <= 0 || laying_spacing <= 0 || dripper_spacing <= 0 || dripper_flow <= 0) {
        return 0
    }

    const denominator = (667 / laying_spacing / dripper_spacing) * dripper_flow
    if (denominator === 0 || !Number.isFinite(denominator)) {
        return 0
    }

    const result = (system_flow * 1000 / denominator) * coefficient
    return result > 0 && Number.isFinite(result) ? result : 0
}

// 显示建议亩数参数设置弹窗
const openAreaParamsDialog = () => {
    // 复制当前参数到临时变量
    tempAreaParams.value = {
        system_flow: farmAreaParams.value.system_flow || 1,
        laying_spacing: farmAreaParams.value.laying_spacing || 0,
        dripper_spacing: farmAreaParams.value.dripper_spacing || 0,
        dripper_flow: farmAreaParams.value.dripper_flow || 0,
        coefficient: farmAreaParams.value.coefficient || 0.9
    }
    showAreaParamsDialog.value = true
}

// 关闭建议亩数参数弹窗
const closeAreaParamsDialog = () => {
    showAreaParamsDialog.value = false
}

// 处理建议亩数参数弹窗按钮点击
const handleAreaParamsDialogClick = async (e) => {
    if (e.index === 1) {
        // 保存按钮
        try {
            await updateAreaParams()
            closeAreaParamsDialog()
            uni.showToast({
                title: '参数已保存',
                icon: 'success'
            })
        } catch (error) {
            console.error('保存参数失败:', error)
            uni.showToast({
                title: '保存失败',
                icon: 'none'
            })
        }
    } else {
        // 取消按钮
        closeAreaParamsDialog()
    }
}

// 更新面积参数
const updateAreaParams = async () => {
    if (!currentFarmName.value) {
        throw new Error('请先选择农场')
    }

    try {
        await call_remote('/resource/set_farm_area_params', {
            farm_name: currentFarmName.value,
            system_flow: tempAreaParams.value.system_flow,
            laying_spacing: tempAreaParams.value.laying_spacing,
            dripper_spacing: tempAreaParams.value.dripper_spacing,
            dripper_flow: tempAreaParams.value.dripper_flow,
            coefficient: tempAreaParams.value.coefficient
        })

        // 更新本地参数
        farmAreaParams.value = { ...tempAreaParams.value }
    } catch (error) {
        console.error('更新面积参数失败:', error)
        throw error
    }
}

// 使用建议亩数（通过接口获取）
const useRecommendedAreaFromAPI = async (index) => {
    try {
        const group = wateringGroups.value[index]
        if (!group || !currentFarmName.value) {
            return
        }

        // 调用接口获取建议亩数
        const result = await call_remote('/policy/get_recommended_area', {
            farm_name: currentFarmName.value,
            group_name: group.name
        })

        if (result && result.recommended_area > 0) {
            wateringGroups.value[index].area = result.recommended_area
            uni.showToast({
                title: `已应用建议亩数：${result.recommended_area.toFixed(2)}亩`,
                icon: 'success'
            })
        } else {
            // 如果接口没有返回，使用本地计算的值
            const recommended = getRecommendedArea(index)
            if (recommended > 0) {
                wateringGroups.value[index].area = recommended
                uni.showToast({
                    title: `已应用建议亩数：${recommended.toFixed(2)}亩`,
                    icon: 'success'
                })
            }
        }
    } catch (error) {
        console.error('获取建议亩数失败:', error)
        // 如果接口调用失败，使用本地计算的值
        const recommended = getRecommendedArea(index)
        if (recommended > 0) {
            wateringGroups.value[index].area = recommended
            uni.showToast({
                title: `已应用建议亩数：${recommended.toFixed(2)}亩`,
                icon: 'success'
            })
        } else {
            uni.showToast({
                title: '获取建议亩数失败',
                icon: 'none'
            })
        }
    }
}

// 保留原函数作为备用
const useRecommendedArea = (index) => {
    const recommended = getRecommendedArea(index)
    if (recommended > 0) {
        wateringGroups.value[index].area = recommended
    }
}

const onFarmChange = async (farmName) => {
    currentFarmName.value = farmName
    // 只有编辑模式需要加载已配置组
    if (isEditMode.value) {
        await loadExistingGroups()
        await initWateringGroupsFromExisting()
    } else {
        existingGroups.value = []
    }

    // 重新加载农场面积参数
    try {
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null)
        const paramsResponse = await call_remote('/resource/get_farm_area_params', {
            farm_name: farmName || '默认农场'
        }, token)
        if (paramsResponse) {
            farmAreaParams.value = {
                system_flow: paramsResponse.system_flow !== undefined ? paramsResponse.system_flow : 1,
                laying_spacing: paramsResponse.laying_spacing || 0,
                dripper_spacing: paramsResponse.dripper_spacing || 0,
                dripper_flow: paramsResponse.dripper_flow || 0,
                coefficient: paramsResponse.coefficient !== undefined ? paramsResponse.coefficient : 0.9
            }
        }
    } catch (error) {
        console.error('获取农场参数失败:', error)
    }
}

// 打开全屏地图页面
const openValveMap = (groupName) => {
    const currentGroup = wateringGroups.value.find(g => g.name === groupName)
    if (!currentGroup) return

    const configKey = currentGroup.configKey || groupName
    const selected = selectedValveDevices.value[configKey] || []

    // 准备阀门数据
    const valveData = availableValveDevices.value.map(device => ({
        device_name: device.device_name,
        latitude: device.latitude,
        longitude: device.longitude
    }))

    // 使用本地存储传递数据，避免URL过长
    uni.setStorageSync('valve_map_group_name', groupName)
    uni.setStorageSync('valve_map_available_valves', JSON.stringify(valveData))
    uni.setStorageSync('valve_map_selected_valves', JSON.stringify(selected))

    // 跳转到地图页面
    uni.navigateTo({
        url: '/pages/irrigation/valve-map',
        fail: (err) => {
            console.error('跳转失败:', err)
            console.error('尝试的路径:', '/pages/irrigation/valve-map')
            uni.showToast({ title: '页面跳转失败，请重启应用', icon: 'none' })
        }
    })
}

// 初始化
onLoad((opts) => {
    mode.value = opts?.mode || 'create'

    // 从选择方案弹窗跳转过来时，带上当前方案信息，并可直接从指定步骤开始
    if (opts?.schemeName) {
        schemeName.value = opts.schemeName
    }
    if (opts?.schemeId) {
        selectedSchemeId.value = opts.schemeId
    }
    if (opts?.startStep && Number(opts.startStep) >= 2) {
        wizardStep.value = Number(opts.startStep)
    }
})

// 更新阀门选择（供地图页面调用）
const updateValveSelection = (groupName, selectedValves) => {
    const group = wateringGroups.value.find(g => g.name === groupName)
    if (group) {
        const configKey = group.configKey || groupName
        selectedValveDevices.value[configKey] = selectedValves || []
    }
}

// 暴露方法供子页面调用
defineExpose({
    updateValveSelection
})

// 页面显示时检查是否有返回的数据
onShow(() => {
    // 从本地存储读取返回的数据
    const resultStr = uni.getStorageSync('valve_map_selected_result')
    if (resultStr) {
        try {
            const result = JSON.parse(resultStr)
            const group = wateringGroups.value.find(g => g.name === result.groupName)
            if (group) {
                const configKey = group.configKey || result.groupName
                selectedValveDevices.value[configKey] = result.selectedValves || []
            }
            // 清除存储的数据
            uni.removeStorageSync('valve_map_selected_result')
        } catch (e) {
            console.error('解析返回的阀门选择数据失败:', e)
            uni.removeStorageSync('valve_map_selected_result')
        }
    }
})

onMounted(async () => {
    const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null)
    if (!token) {
        uni.redirectTo({ url: '/pages/login' })
        return
    }

    pageLoading.value = true
    try {
        if (pageHeaderRef.value && pageHeaderRef.value.refresh) {
            await pageHeaderRef.value.refresh()
            currentFarmName.value = pageHeaderRef.value.getCurrentFarmName()
        }
        await loadSchemes()
        await loadValveDevices()
        // 新建模式不需要加载已配置的组；只有编辑模式才加载
        if (isEditMode.value) {
            await loadExistingGroups()
            await initWateringGroupsFromExisting()
        }

        // 加载农场面积参数
        try {
            const paramsResponse = await call_remote('/resource/get_farm_area_params', {
                farm_name: currentFarmName.value || '默认农场'
            }, token)
            if (paramsResponse) {
                farmAreaParams.value = {
                    system_flow: paramsResponse.system_flow !== undefined ? paramsResponse.system_flow : 1,
                    laying_spacing: paramsResponse.laying_spacing || 0,
                    dripper_spacing: paramsResponse.dripper_spacing || 0,
                    dripper_flow: paramsResponse.dripper_flow || 0,
                    coefficient: paramsResponse.coefficient !== undefined ? paramsResponse.coefficient : 0.9
                }
            }
        } catch (error) {
            console.error('获取农场参数失败:', error)
        }
    } finally {
        setTimeout(() => {
            pageLoading.value = false
        }, 300)
    }
})
</script>

<style lang="scss" scoped>
.page {
    min-height: 100vh;
    width: 100vw;
    background: linear-gradient(180deg, #f0f4f8 0%, #e8edf2 50%, #dde5ec 100%);
    display: flex;
    flex-direction: column;
    position: relative;
}

.content-scroll {
    flex: 1;
    width: 100%;
    box-sizing: border-box;
    padding-top: calc(160rpx + env(safe-area-inset-top));
    padding-bottom: calc(220rpx + env(safe-area-inset-bottom));
    overflow-y: auto;
}

.content {
    padding: 32rpx;
    display: flex;
    flex-direction: column;
    gap: 32rpx;
    box-sizing: border-box;
    padding-bottom: 32rpx;
    /* 底部留出一些间距即可，不需要为 tabBar 留空间，因为 scroll-view 已经限制了底部 */
}

.header-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.title {
    font-size: 34rpx;
    font-weight: 600;
    color: #303133;
}

.form-card {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 32rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
}

.step-indicator {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 32rpx;
    padding: 24rpx 0 40rpx;
    position: relative;
}

.step-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    position: relative;
    z-index: 2;
}

.step-line {
    position: absolute;
    top: 28rpx;
    left: 50%;
    right: -50%;
    height: 4rpx;
    background: #ebeef5;
    z-index: 1;
    transition: all 0.3s ease;
    border-radius: 2rpx;
}

.step-line.completed {
    background: linear-gradient(90deg, #67c23a 0%, #85ce61 100%);
}

.step-dot {
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    background: #ebeef5;
    color: #909399;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24rpx;
    font-weight: 600;
    transition: all 0.3s ease;
    border: 3px solid #ebeef5;
    box-sizing: border-box;
    margin-bottom: 12rpx;
    position: relative;
    z-index: 3;
}

.step-dot.active {
    background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
    color: #ffffff;
    border-color: #409eff;
    box-shadow: 0 4rpx 12rpx rgba(64, 158, 255, 0.4);
    transform: scale(1.1);
}

.step-dot.completed {
    background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
    color: #ffffff;
    border-color: #67c23a;
    box-shadow: 0 4rpx 12rpx rgba(103, 194, 58, 0.4);
}

.step-number {
    font-size: 28rpx;
    font-weight: 600;
}

.step-check {
    font-size: 32rpx;
    font-weight: bold;
}

.step-label {
    font-size: 22rpx;
    color: #909399;
    text-align: center;
    white-space: nowrap;
    transition: all 0.3s ease;
    margin-top: 4rpx;
    line-height: 1.4;
}

.step-label.active {
    color: #409eff;
    font-weight: 600;
    font-size: 24rpx;
}

.wizard-step-content {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.watering-groups-config {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 32rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.06);
}

.groups-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
    font-weight: 600;
    color: #303133;
    font-size: 28rpx;
}

.header-buttons {
    display: flex;
    gap: 12rpx;
    align-items: center;
    flex-wrap: wrap;
}

/* 底部固定区域 */
.wizard-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: #ffffff;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    padding-bottom: env(safe-area-inset-bottom);
}

/* 建议亩数卡片样式 - 固定在底部 */
.recommended-area-card {
    margin: 0 32rpx;
    margin-top: 16rpx;
    padding: 16rpx 24rpx;
    background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
    border: 1px solid #409eff;
    border-radius: 12rpx;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    box-shadow: 0 2rpx 8rpx rgba(64, 158, 255, 0.2);
    transition: all 0.3s;
}

.recommended-area-card:active {
    transform: scale(0.98);
    box-shadow: 0 1rpx 4rpx rgba(64, 158, 255, 0.3);
    background: linear-gradient(135deg, #bae7ff 0%, #91d5ff 100%);
}

.recommended-label {
    font-size: 26rpx;
    color: #1890ff;
    font-weight: 500;
}

.recommended-value {
    font-size: 26rpx;
    color: #1890ff;
    font-weight: 600;
}

.existing-groups-section {
    margin-bottom: 24rpx;
}

.existing-groups-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12rpx;
    font-weight: 600;
    color: #303133;
    font-size: 26rpx;
}

.groups-count {
    color: #409eff;
    font-size: 22rpx;
    font-weight: 500;
}

.existing-groups-list {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.existing-group-row {
    padding: 24rpx 28rpx;
    border-radius: 20rpx;
    background: #ffffff;
    border: 1px solid #e4e7ed;
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
    transition: all 0.2s;
}

.existing-group-row:active {
    transform: scale(0.98);
    box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.08);
}

.group-info-bottom {
    margin-top: 8rpx;
}

.group-name-input.readonly,
.group-area-input.readonly {
    background: #f8fafc;
    border-color: #ebeef5;
    color: #303133;
}

.action-row {
    display: flex;
    flex-wrap: nowrap; /* 同行展示 */
    gap: 12rpx;
    margin-top: 12rpx;
    align-items: center;
    flex: 1;
}

.mini-btn {
    padding: 10rpx 22rpx;
    border-radius: 999rpx;
    border: 1px solid #dcdfe6;
    font-size: 24rpx;
    color: #606266;
    background: #f5f7fa;
    white-space: nowrap;
}

.mini-btn.view {
    border-color: #67c23a;
    color: #67c23a;
    background: #f0f9eb;
}

.mini-btn.edit {
    border-color: #e6a23c;
    color: #e6a23c;
    background: #fdf6ec;
}

.mini-btn.copy {
    border-color: #409eff;
    color: #409eff;
    background: #ecf5ff;
}

.mini-btn.delete {
    border-color: #f56c6c;
    color: #f56c6c;
    background: #fef0f0;
}

.icon-btn {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
}

.icon-btn:active {
    transform: scale(0.9);
}

.icon-btn.delete-btn {
    background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
    box-shadow: 0 4rpx 12rpx rgba(245, 108, 108, 0.35);
}

.icon-btn.primary-btn {
    background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
    box-shadow: 0 4rpx 12rpx rgba(64, 158, 255, 0.35);
}

.icon-btn.warning-btn {
    background: linear-gradient(135deg, #E6A23C 0%, #f0c78a 100%);
    box-shadow: 0 4rpx 12rpx rgba(230, 162, 60, 0.35);
}

.icon-btn.info-btn {
    background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
    box-shadow: 0 4rpx 12rpx rgba(103, 194, 58, 0.35);
}

.icon-text {
    font-size: 30rpx;
    color: #fff;
    font-weight: 600;
    line-height: 1;
}

.group-item {
    display: flex;
    flex-direction: column;
    padding: 32rpx;
    background: #ffffff;
    border-radius: 20rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.06);
    position: relative;
}

.group-item .group-info {
    display: flex;
    align-items: center;
    width: 100%;
    position: relative;
}

.group-info {
    display: flex;
    align-items: center;
    gap: 12rpx;
    flex: 1;
    flex-wrap: wrap;
}

.group-item .icon-btn.delete-btn {
    margin-left: 100rpx;
}

.group-name-input {
    flex: 1;
    min-width: 200rpx;
    padding: 20rpx 24rpx;
    border: 1px solid #ebeef5;
    border-radius: 16rpx;
    font-size: 28rpx;
    background: #f8fafc;
    transition: all 0.3s;
}

.group-name-input:focus {
    border-color: #409eff;
    background: #fff;
    box-shadow: 0 0 0 4rpx rgba(64, 158, 255, 0.1);
}

.group-area-input {
    width: 180rpx;
    padding: 20rpx 24rpx;
    border: 1px solid #ebeef5;
    border-radius: 16rpx;
    font-size: 28rpx;
    background: #f8fafc;
    transition: all 0.3s;
}

.group-area-input:focus {
    border-color: #409eff;
    background: #fff;
    box-shadow: 0 0 0 4rpx rgba(64, 158, 255, 0.1);
}

.unit {
    color: #909399;
    font-size: 24rpx;
}

.recommended-area {
    padding: 12rpx 24rpx;
    background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
    border: 1px solid #409eff;
    border-radius: 20rpx;
    font-size: 24rpx;
    color: #1890ff;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 2rpx 8rpx rgba(64, 158, 255, 0.2);
    transition: all 0.3s;
}

.recommended-area:active {
    transform: scale(0.95);
    box-shadow: 0 1rpx 4rpx rgba(64, 158, 255, 0.3);
}

/* 建议亩数显示在输入框下方 */
.recommended-area-below {
    padding: 16rpx 24rpx;
    background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
    border: 1px solid #409eff;
    border-radius: 12rpx;
    font-size: 26rpx;
    color: #1890ff;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 2rpx 8rpx rgba(64, 158, 255, 0.2);
    transition: all 0.3s;
    width: 100%;
    text-align: center;
    margin-top: 8rpx;
    min-height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.recommended-area-below:active {
    transform: scale(0.98);
    box-shadow: 0 1rpx 4rpx rgba(64, 158, 255, 0.3);
    background: linear-gradient(135deg, #bae7ff 0%, #91d5ff 100%);
}

.device-allocation {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 32rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
}

.group-switcher {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 24rpx;
    margin-bottom: 20rpx;
}

.group-counter {
    font-size: 28rpx;
    font-weight: 600;
    color: #303133;
}

.group-device-config {
    display: none;
}

.group-device-config.active {
    display: flex;
    flex-direction: column;
    flex: 1;
}

.group-device-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
}

.group-name-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #303133;
}

.display-mode-tabs {
    display: inline-flex;
    border: 1px solid #dcdfe6;
    border-radius: 999rpx;
    overflow: hidden;
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

.valve-selection-map-container {
    margin-top: 16rpx;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 500rpx;
}

.map-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80rpx 32rpx;
    background: #f8fafc;
    border-radius: 16rpx;
    border: 2px dashed #c6e2ff;
    min-height: 400rpx;
}

.map-hint {
    font-size: 28rpx;
    color: #909399;
    margin-bottom: 32rpx;
    text-align: center;
}

.valve-selection-map {
    width: 100%;
    flex: 1;
    min-height: 500rpx;
    border-radius: 20rpx;
    border: 2px solid #ebeef5;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
    overflow: hidden;
}

.selected-valves-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16rpx;
    padding: 24rpx;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-radius: 20rpx;
    font-size: 26rpx;
    color: #303133;
    font-weight: 500;
    border: 1px solid #b3d8ff;
    box-shadow: 0 2rpx 8rpx rgba(64, 158, 255, 0.1);
}

.valve-selection-list-container {
    background: #f8fafc;
    border-radius: 20rpx;
    padding: 24rpx;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    border: 1px solid rgba(0, 0, 0, 0.06);
}

.valve-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
    font-size: 24rpx;
    color: #606266;
}

.list-actions {
    display: flex;
    gap: 12rpx;
}

.valve-list-content {
    flex: 1;
    max-height: 800rpx;
}

.valve-list-item {
    padding: 28rpx;
    border: 2px solid #e4e7ed;
    border-radius: 20rpx;
    margin-bottom: 16rpx;
    background: #ffffff;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
    transition: all 0.3s;
}

.valve-list-item:active {
    transform: scale(0.98);
}

.valve-list-item.selected {
    border-color: #409eff;
    background: linear-gradient(135deg, #ecf5ff 0%, #e1f3ff 100%);
    box-shadow: 0 4rpx 12rpx rgba(64, 158, 255, 0.2);
}

.valve-item-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.valve-item-info {
    flex: 1;
}

.valve-name {
    font-weight: 600;
    color: #303133;
    font-size: 28rpx;
}

.check-indicator {
    width: 48rpx;
    height: 48rpx;
    border-radius: 50%;
    border: 2px solid #409eff;
    color: #409eff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 32rpx;
    background: #fff;
    transition: all 0.3s;
}

.valve-list-item.selected .check-indicator {
    background: #409eff;
    color: #fff;
    box-shadow: 0 2rpx 8rpx rgba(64, 158, 255, 0.3);
}

.fert-config {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.group-fert-config {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 32rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.06);
}

.fert-method {
    margin-bottom: 24rpx;
}

.form-label {
    display: block;
    margin-bottom: 12rpx;
    font-weight: 500;
    color: #606266;
    font-size: 26rpx;
}

.radio-group {
    display: flex;
    gap: 12rpx;
    flex-wrap: wrap;
}

.radio-item {
    padding: 16rpx 32rpx;
    border: 2px solid #dcdfe6;
    border-radius: 20rpx;
    background: #fff;
    font-size: 26rpx;
    color: #606266;
    font-weight: 500;
    transition: all 0.3s;
    box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.04);
}

.radio-item:active {
    transform: scale(0.95);
}

.radio-item.active {
    background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
    color: #fff;
    border-color: #409eff;
    box-shadow: 0 4rpx 12rpx rgba(64, 158, 255, 0.3);
}

.fert-params,
.time-params {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    margin-bottom: 16rpx;
}

.param-item {
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.param-label {
    font-weight: 500;
    color: #606266;
    min-width: 180rpx;
    font-size: 26rpx;
}

.param-input {
    flex: 1;
    padding: 20rpx 24rpx;
    border: 1px solid #ebeef5;
    border-radius: 16rpx;
    font-size: 28rpx;
    background: #f8fafc;
    transition: all 0.3s;
}

.param-input:focus {
    border-color: #409eff;
    background: #fff;
    box-shadow: 0 0 0 4rpx rgba(64, 158, 255, 0.1);
}

.action-btn {
    padding: 20rpx 36rpx;
    border-radius: 999rpx;
    background: #409eff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 140rpx;
    font-size: 28rpx;
    color: #fff;
    font-weight: 500;
    box-shadow: 0 4rpx 12rpx rgba(64, 158, 255, 0.3);
    transition: all 0.3s;
}

.action-btn:active {
    transform: scale(0.95);
    box-shadow: 0 2rpx 6rpx rgba(64, 158, 255, 0.2);
}

.action-btn.ghost {
    background: #e8f3ff;
    border: 1px solid #c6e2ff;
    color: #409eff;
    box-shadow: 0 2rpx 8rpx rgba(64, 158, 255, 0.15);
}

.action-btn.primary {
    background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
    color: #fff;
    box-shadow: 0 4rpx 16rpx rgba(64, 158, 255, 0.35);
}

.action-btn.success {
    background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
    color: #fff;
    box-shadow: 0 4rpx 16rpx rgba(103, 194, 58, 0.35);
}

.action-btn.danger {
    background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
    color: #fff;
    box-shadow: 0 4rpx 16rpx rgba(245, 108, 108, 0.35);
}

.action-btn.small {
    padding: 12rpx 24rpx;
    font-size: 24rpx;
    min-width: 100rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
}

.action-btn.disabled {
    opacity: 0.5;
    pointer-events: none;
}

.wizard-actions {
    display: flex;
    justify-content: center;
    gap: 20rpx;
    padding: 24rpx 32rpx;
    box-sizing: border-box;
}

.no-devices-warning {
    padding: 32rpx;
    background: linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%);
    border: 2px solid #ffc107;
    border-radius: 20rpx;
    color: #856404;
    font-size: 26rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 4rpx 12rpx rgba(255, 193, 7, 0.2);
    font-weight: 500;
}

/* FirstUI弹窗内容样式 */
.dialog-content-custom {
    padding: 20rpx 0;
    min-width: 500rpx;
}

.dialog-error {
    margin-top: 16rpx;
    padding: 16rpx;
    background: #fef0f0;
    border: 1px solid #fbc4c4;
    border-radius: 12rpx;
    animation: shake 0.3s ease;
}

@keyframes shake {

    0%,
    100% {
        transform: translateX(0);
    }

    25% {
        transform: translateX(-10rpx);
    }

    75% {
        transform: translateX(10rpx);
    }
}

/* 建议亩数参数弹窗样式 */
.area-params-dialog-content {
    padding: 20rpx 0;
    display: flex;
    flex-direction: column;
    gap: 32rpx;
    min-width: 500rpx;
}

.params-formula-section {
    padding: 24rpx;
    background: #f5f7fa;
    border-radius: 12rpx;
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.formula-text {
    font-size: 24rpx;
    color: #409eff;
    font-weight: 500;
    font-family: 'Monaco', 'Menlo', monospace;
    line-height: 1.6;
    word-break: break-all;
}

.params-input-section {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.param-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20rpx;
}

.param-input {
    flex: 1;
    max-width: 300rpx;
    padding: 20rpx 24rpx;
    border: 1px solid #ebeef5;
    border-radius: 12rpx;
    font-size: 28rpx;
    background: #f8fafc;
    transition: all 0.3s;
}

.param-unit {
    min-width: 120rpx;
    text-align: right;
    color: #909399;
    font-size: 24rpx;
    white-space: nowrap;
}

.param-input:focus {
    border-color: #409eff;
    background: #fff;
    box-shadow: 0 0 0 4rpx rgba(64, 158, 255, 0.1);
}

.params-result-section {
    padding: 24rpx;
    background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
    border-radius: 12rpx;
    border: 1px solid #409eff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20rpx;
}

/* 方案选择样式 */
.scheme-list {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 20rpx;
    padding: 24rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.scheme-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8rpx;
}

.scheme-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #303133;
}

.scheme-count {
    font-size: 24rpx;
    color: #909399;
}

.scheme-empty {
    font-size: 26rpx;
    color: #909399;
    padding: 20rpx 0;
}

.scheme-cards {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.scheme-card {
    padding: 18rpx;
    border: 1px solid #ebeef5;
    border-radius: 16rpx;
    background: #f8fafc;
    transition: all 0.2s;
}

.scheme-card.active {
    border-color: #409eff;
    background: #ecf5ff;
    box-shadow: 0 4rpx 12rpx rgba(64, 158, 255, 0.2);
}

.scheme-name {
    font-size: 30rpx;
    font-weight: 600;
    color: #303133;
}

.scheme-desc {
    margin-top: 6rpx;
    font-size: 24rpx;
    color: #909399;
}

.create-scheme {
    margin-top: 20rpx;
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 20rpx;
    padding: 20rpx;
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.create-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #303133;
}

.scheme-input {
    border: 1px solid #ebeef5;
    border-radius: 12rpx;
    padding: 14rpx;
    font-size: 26rpx;
    background: #f8fafc;
}
</style>
