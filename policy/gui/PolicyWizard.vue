<template>
    <div class="policy-wizard-page">
        <el-card class="wizard-card" shadow="hover">
            <template #header>
                <div class="card-header">
                    <div class="header-left">
                        <el-icon class="header-icon">
                            <Document />
                        </el-icon>
                        <span class="title">策略程序设定向导</span>
                    </div>
                    <UnifiedButton variant="info" @click="handleCancel" :icon="Close">
                        取消
                    </UnifiedButton>
                </div>
            </template>

            <div class="policy-wizard">
                <!-- 步骤指示器 -->
                <el-steps :active="wizardStep - 1" finish-status="success" align-center class="wizard-steps">
                    <el-step title="创建方案" description="输入方案名称" />
                    <el-step title="创建轮灌组" description="设置轮灌组名称和面积" />
                    <el-step title="分配设备" description="为轮灌组分配阀门设备" />
                    <el-step title="施肥配置" description="设置施肥方式和参数" />
                </el-steps>

                <!-- 步骤1：创建方案 -->
                <div v-if="wizardStep === 1" class="wizard-step-content">
                    <div class="scheme-name-input">
                        <div class="input-section">
                            <label class="input-label">方案名称：</label>
                            <el-input v-model="schemeName" placeholder="请输入方案名称（用于保存配置文件）" style="width: 400px;"
                                maxlength="50" show-word-limit />
                            <div class="input-hint">
                                <el-icon>
                                    <InfoFilled />
                                </el-icon>
                                <span>配置将保存为：plan_{{ schemeName || '方案名称' }}.txt</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 步骤2：创建轮灌组 -->
                <div v-if="wizardStep === 2" class="wizard-step-content">
                
                    <div class="watering-groups-config">
                        <div class="groups-header">
                            <span>轮灌组列表</span>
                            <div class="header-buttons">
                                <UnifiedButton variant="info" size="small" @click="loadExistingGroups" :icon="Refresh">
                                    加载已配置
                                </UnifiedButton>
                                <UnifiedButton variant="primary" size="small" @click="addWateringGroup" :icon="Plus">
                                    添加轮灌组
                                </UnifiedButton>
                            </div>
                        </div>


                        <!-- 轮灌组列表 -->
                        <div v-for="(group, index) in wateringGroups" :key="index" class="group-item">
                            <div class="group-info">
                                <el-input v-model="group.name" placeholder="轮灌组名称" style="width: 200px;" />
                                <el-input-number v-model="group.area" :min="0" :precision="2" placeholder="面积"
                                    style="width: 150px; margin-left: 10px;" />
                                <span class="unit">亩</span>
                                <el-popover v-model:visible="areaParamsPopoverVisible[index]" placement="top"
                                    :width="400" trigger="hover" popper-class="area-params-popover">
                                    <template #reference>
                                        <span class="recommended-area"
                                            :class="{ 'has-recommendation': getRecommendedArea(index) > 0 }">
                                            建议{{ getRecommendedArea(index).toFixed(2) }}亩
                                        </span>
                                    </template>
                                    <div class="area-params-content">
                                        <div class="params-header">
                                            <h4>建议亩数计算参数</h4>
                                        </div>
                                        <div class="params-formula">
                                            <p>计算公式：</p>
                                            <p class="formula-text">系统流量 × 1000 ÷ (667 ÷ 铺设间距 ÷ 滴头间距 × 滴头流量) × 系数</p>
                                        </div>
                                        <div class="params-list">
                                            <div class="param-item">
                                                <span class="param-label">系统流量：</span>
                                                <el-input-number v-model="farmAreaParams.system_flow" :min="0"
                                                    :precision="2" size="small" style="width: 120px;"
                                                    @change="updateAreaParam('system_flow', $event)" />
                                                    <span class="param-unit">m3/h</span>
                                            </div>
                                            <div class="param-item">
                                                <span class="param-label">铺设间距：</span>
                                                <el-input-number v-model="farmAreaParams.laying_spacing" :min="0"
                                                    :precision="2" size="small" style="width: 120px;"
                                                    @change="updateAreaParam('laying_spacing', $event)" />
                                                    <span class="param-unit">m</span>
                                            </div>
                                            <div class="param-item">
                                                <span class="param-label">滴头间距：</span>
                                                <el-input-number v-model="farmAreaParams.dripper_spacing" :min="0"
                                                    :precision="2" size="small" style="width: 120px;"
                                                    @change="updateAreaParam('dripper_spacing', $event)" />
                                                    <span class="param-unit">m</span>
                                            </div>
                                            <div class="param-item">
                                                <span class="param-label">滴头流量：</span>
                                                <el-input-number v-model="farmAreaParams.dripper_flow" :min="0"
                                                    :precision="2" size="small" style="width: 120px;"
                                                    @change="updateAreaParam('dripper_flow', $event)" />
                                                    <span class="param-unit">L/h</span>
                                            </div>
                                            <div class="param-item">
                                                <span class="param-label">系数：</span>
                                                <el-input-number v-model="farmAreaParams.coefficient" :min="0"
                                                    :precision="2" size="small" style="width: 120px;"
                                                    @change="updateAreaParam('coefficient', $event)" />
                                                    <span class="param-unit">系统默认</span>
                                            </div>
                                        </div>
                                        <div class="params-result">
                                            <p>计算结果：<strong>{{ getRecommendedArea(index).toFixed(2) }}亩</strong></p>
                                        </div>
                                    </div>
                                </el-popover>
                            </div>
                            <div class="group-actions">
                                <UnifiedButton v-if="group.area > 0" variant="primary" size="small" :icon="CopyDocument"
                                    @click="copyWateringGroup(group, index)" class="copy-group-btn">
                                    复制
                                </UnifiedButton>
                                <el-popover v-if="group.area > 0" :width="600" placement="left" trigger="click"
                                    popper-class="group-detail-popover">
                                    <template #reference>
                                        <UnifiedButton variant="info" size="small" :icon="View" class="view-group-btn">
                                            查看
                                        </UnifiedButton>
                                    </template>
                                    <template #default>
                                        <div class="group-detail-popover-content">
                                            <div class="popover-header">
                                                <h4 class="popover-title">{{ group.name }} - 配置详情</h4>
                                            </div>
                                            <div style="padding: 20px 24px;">
                                                <div class="detail-section">
                                                    <h5 class="section-title">基本信息</h5>
                                                    <div class="detail-row">
                                                        <span class="detail-label">轮灌组名称：</span>
                                                        <span class="detail-value">{{ group.name }}</span>
                                                    </div>
                                                    <div class="detail-row">
                                                        <span class="detail-label">面积：</span>
                                                        <span class="detail-value">{{ group.area }} 亩</span>
                                                    </div>
                                                </div>

                                                <div class="detail-section">
                                                    <h5 class="section-title">阀门配置</h5>
                                                    <div v-if="selectedValveDevices[group.configKey || group.name] && selectedValveDevices[group.configKey || group.name].length > 0"
                                                        class="valves-list">
                                                        <el-tag
                                                            v-for="(valve, idx) in selectedValveDevices[group.configKey || group.name]"
                                                            :key="idx" type="primary" class="valve-tag">
                                                            {{ valve }}
                                                        </el-tag>
                                                    </div>
                                                    <div v-else class="no-data">未配置阀门</div>
                                                    <div class="detail-row">
                                                        <span class="detail-label">阀门数量：</span>
                                                        <span class="detail-value">{{
                                                            selectedValveDevices[group.configKey || group.name]?.length
                                                            || 0 }} 个</span>
                                                    </div>
                                                </div>

                                                <div class="detail-section">
                                                    <h5 class="section-title">施肥配置</h5>
                                                    <div class="detail-row">
                                                        <span class="detail-label">施肥方式：</span>
                                                        <span class="detail-value">
                                                            {{ fertConfigs[group.configKey || group.name]?.method ===
                                                                'WaterOnly' ? '只浇水' :
                                                                fertConfigs[group.configKey || group.name]?.method ===
                                                                    'AreaBased' ? '亩定量' :
                                                                    fertConfigs[group.configKey || group.name]?.method ===
                                                            'Total' ? '总定量' :
                                                            fertConfigs[group.configKey || group.name]?.method ===
                                                            'Time' ? '定时' : '未配置' }}
                                                        </span>
                                                    </div>
                                                    <!-- 只浇水模式 -->
                                                    <template
                                                        v-if="fertConfigs[group.configKey || group.name]?.method === 'WaterOnly'">
                                                        <div class="detail-row">
                                                            <span class="detail-label">总灌溉时间：</span>
                                                            <span class="detail-value">{{ fertConfigs[group.configKey ||
                                                                group.name]?.total_time || 0 }} 分钟</span>
                                                        </div>
                                                    </template>
                                                    <!-- 非只浇水模式 -->
                                                    <template v-else>
                                                    <div v-if="fertConfigs[group.configKey || group.name]?.method === 'AreaBased'"
                                                        class="detail-row">
                                                        <span class="detail-label">亩定量：</span>
                                                            <span class="detail-value">{{ fertConfigs[group.configKey ||
                                                                group.name]?.AB_fert || 0 }} L/亩</span>
                                                    </div>
                                                    <div v-if="fertConfigs[group.configKey || group.name]?.method === 'Total'"
                                                        class="detail-row">
                                                        <span class="detail-label">总定量：</span>
                                                            <span class="detail-value">{{ fertConfigs[group.configKey ||
                                                                group.name]?.total_fert || 0 }} L</span>
                                                    </div>
                                                    <div v-if="fertConfigs[group.configKey || group.name]?.method === 'Time'"
                                                        class="detail-row">
                                                        <span class="detail-label">施肥时间：</span>
                                                            <span class="detail-value">{{ fertConfigs[group.configKey ||
                                                                group.name]?.fert_time || 0 }} 分钟</span>
                                                    </div>
                                                    <div class="detail-row">
                                                            <span class="detail-label">肥前时间：</span>
                                                            <span class="detail-value">{{ fertConfigs[group.configKey ||
                                                                group.name]?.pre_fert_time || 0 }} 分钟</span>
                                                    </div>
                                                    <div class="detail-row">
                                                            <span class="detail-label">肥后时间：</span>
                                                            <span class="detail-value">{{ fertConfigs[group.configKey ||
                                                                group.name]?.post_fert_time || 0 }} 分钟</span>
                                                    </div>
                                                    </template>
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                </el-popover>
                                <UnifiedButton variant="danger" size="small" @click="removeWateringGroup(index)"
                                    :icon="Delete">
                                    删除
                                </UnifiedButton>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 步骤3：分配设备 -->
                <div v-if="wizardStep === 3" class="wizard-step-content">
                    <div class="step-header">
                        <div v-if="availableValveDevices.length === 0" class="no-devices-warning">
                            <el-alert title="未找到WaterGroupValve设备" type="warning"
                                description="当前农场没有找到WaterGroupValve类型的设备，请先配置相关设备" :closable="false" show-icon />
                        </div>
                    </div>

                    <div class="device-allocation">
                        <!-- 组切换器 -->
                        <div v-if="wateringGroups.length > 1" class="group-switcher">
                            <UnifiedButton :disabled="currentGroupIndex === 0" @click="switchToPreviousGroup"
                                :icon="ArrowLeft" size="small" variant="default">
                                上一个
                            </UnifiedButton>
                            <span class="group-counter">
                                {{ currentGroupIndex + 1 }} / {{ wateringGroups.length }}
                            </span>
                            <UnifiedButton :disabled="currentGroupIndex === wateringGroups.length - 1"
                                @click="switchToNextGroup" :icon="ArrowRight" size="small" variant="default">
                                下一个
                            </UnifiedButton>
                        </div>

                        <!-- 设备选择列表 -->
                        <div v-for="(group, index) in wateringGroups" :key="group.name" class="group-device-config"
                            :class="{ 'active': index === currentGroupIndex, 'hidden': index !== currentGroupIndex }">
                            <div class="group-device-header">
                                <h4>{{ group.name }}</h4>
                                <div class="header-actions">
                                    <el-tabs v-model="valveDisplayMode" class="display-mode-tabs"
                                        @tab-change="handleDisplayModeChange">
                                        <el-tab-pane label="地图显示" name="map"></el-tab-pane>
                                        <el-tab-pane label="列表显示" name="list"></el-tab-pane>
                                    </el-tabs>
                                    <UnifiedButton v-if="valveDisplayMode === 'map'" variant="primary" size="small"
                                        @click="enterFullscreenMap(group.name)" :icon="FullScreen">
                                        全屏查看
                                    </UnifiedButton>
                                </div>
                            </div>

                            <!-- 地图显示 -->
                            <div v-if="valveDisplayMode === 'map'" class="valve-selection-map-container">
                                <div :id="`valve-selection-map-${group.name}`" class="valve-selection-map"
                                    :data-group-name="group.name"></div>
                                <div class="selected-valves-info">
                                    <span class="info-text">已选择 {{ selectedValveDevices[group.configKey ||
                                        group.name]?.length
                                        || 0 }} 个阀门（共 {{ availableValveDevices.length }} 个可用）</span>
                                    <UnifiedButton v-if="selectedValveDevices[group.configKey || group.name]?.length > 0"
                                        variant="danger" size="small"
                                        @click="clearSelectedValves(group.configKey || group.name)" :icon="Delete">
                                        清空选择
                                    </UnifiedButton>
                                </div>
                            </div>

                            <!-- 列表显示 -->
                            <div v-if="valveDisplayMode === 'list'" class="valve-selection-list-container">
                                <div class="valve-list-header">
                                    <span class="info-text">已选择 {{ selectedValveDevices[group.configKey ||
                                        group.name]?.length
                                        || 0 }} 个阀门（共 {{ availableValveDevices.length }} 个可用）</span>
                                    <div class="list-actions">
                                        <UnifiedButton
                                            v-if="selectedValveDevices[group.configKey || group.name]?.length > 0"
                                            variant="danger" size="small"
                                            @click="clearSelectedValves(group.configKey || group.name)" :icon="Delete">
                                            清空选择
                                        </UnifiedButton>
                                        <UnifiedButton
                                            v-if="selectedValveDevices[group.configKey || group.name]?.length < availableValveDevices.length"
                                            variant="primary" size="small"
                                            @click="selectAllValves(group.configKey || group.name)" :icon="Check">
                                            全选
                                        </UnifiedButton>
                                    </div>
                                </div>
                                <div class="valve-list-content">
                                    <el-checkbox-group v-model="selectedValveDevices[group.configKey || group.name]"
                                        class="valve-checkbox-group">
                                        <div v-for="device in availableValveDevices" :key="device.device_name"
                                            class="valve-list-item"
                                            :class="{ 'selected': isValveSelected(device.device_name, group.name) }">
                                            <el-checkbox :label="device.device_name" class="valve-checkbox">
                                                <div class="valve-item-content">
                                                    <div class="valve-item-info">
                                                        <span class="valve-name">{{ device.device_name }}</span>
                                                        <span v-if="device.label && device.label !== device.device_name"
                                                            class="valve-label">{{ device.label }}</span>
                                                    </div>
                                                    <div class="valve-item-meta">
                                                        <el-tag v-if="device.is_online !== undefined"
                                                            :type="device.is_online ? 'success' : 'danger'"
                                                            size="small">
                                                            {{ device.is_online ? '在线' : '离线' }}
                                                        </el-tag>
                                                    </div>
                                                </div>
                                            </el-checkbox>
                                        </div>
                                    </el-checkbox-group>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 步骤4：施肥配置 -->
                <div v-if="wizardStep === 4" class="wizard-step-content">

                    <div class="fert-config">
                        <div v-for="group in wateringGroups" :key="group.name" class="group-fert-config">
                            <h4>{{ group.name }}</h4>

                            <div class="fert-method">
                                <label>施肥方式：</label>
                                <el-radio-group v-model="getFertConfig(group).method">
                                    <el-radio value="WaterOnly">只浇水</el-radio>
                                    <el-radio value="AreaBased">亩定量</el-radio>
                                    <el-radio value="Total">总定量</el-radio>
                                    <el-radio value="Time">定时</el-radio>
                                </el-radio-group>
                            </div>

                            <div v-if="getFertConfig(group).method !== 'WaterOnly'" class="fert-params">
                                <div v-if="getFertConfig(group).method === 'AreaBased'" class="param-item">
                                    <label>每亩施肥量：</label>
                                    <el-input-number v-model="getFertConfig(group).AB_fert" :min="0" :precision="2"
                                        placeholder="施肥量" />
                                    <span class="unit">L/亩</span>
                                </div>

                                <div v-if="getFertConfig(group).method === 'Total'" class="param-item">
                                    <label>施肥总量：</label>
                                    <el-input-number v-model="getFertConfig(group).total_fert" :min="0" :precision="2"
                                        placeholder="总量" />
                                    <span class="unit">L</span>
                                </div>

                                <div v-if="getFertConfig(group).method === 'Time'" class="param-item">
                                    <label>施肥时间：</label>
                                    <el-input-number v-model="getFertConfig(group).fert_time" :min="0" :precision="1"
                                        placeholder="施肥时间" />
                                    <span class="unit">分钟</span>
                                </div>
                            </div>

                            <div v-if="getFertConfig(group).method === 'WaterOnly'" class="time-params">
                                <div class="param-item">
                                    <label>总灌溉时间：</label>
                                    <el-input-number v-model="getFertConfig(group).total_time" :min="0" :precision="1"
                                        placeholder="总灌溉时间" />
                                    <span class="unit">分钟</span>
                                </div>
                            </div>

                            <div v-else class="time-params">
                                <div class="param-item">
                                    <label>肥前时间：</label>
                                    <el-input-number v-model="getFertConfig(group).pre_fert_time" :min="0"
                                        :precision="1" placeholder="肥前时间" />
                                    <span class="unit">分钟</span>
                                </div>

                                <div class="param-item">
                                    <label>肥后时间：</label>
                                    <el-input-number v-model="getFertConfig(group).post_fert_time" :min="0"
                                        :precision="1" placeholder="肥后时间" />
                                    <span class="unit">分钟</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 操作按钮 -->
                <div class="wizard-actions">
                    <UnifiedButton v-if="wizardStep > 1" variant="default" @click="prevStep">上一步</UnifiedButton>

                    <UnifiedButton v-if="wizardStep === 1" variant="primary" @click="nextStep"
                        :disabled="!schemeName || schemeName.trim() === ''">
                        下一步
                    </UnifiedButton>

                    <UnifiedButton v-if="wizardStep === 2 && allGroupsAreCopied" variant="primary" @click="nextStep">
                        下一步
                    </UnifiedButton>
                    <UnifiedButton v-else-if="wizardStep === 2" variant="primary" @click="nextStep">
                        下一步
                    </UnifiedButton>

                    <UnifiedButton v-if="wizardStep === 3" variant="primary" @click="nextStep">
                        下一步
                    </UnifiedButton>

                    <UnifiedButton v-if="wizardStep === 4" variant="success" @click="finishWizard">
                        完成配置
                    </UnifiedButton>
                </div>
            </div>
        </el-card>

        <!-- 全屏地图对话框 -->
        <el-dialog v-model="fullscreenMapVisible" :title="`${fullscreenMapGroupName} - 全屏查看阀门`" width="95vw"
            :close-on-click-modal="false" :close-on-press-escape="true" :modal="true" :append-to-body="true"
            :lock-scroll="true" class="fullscreen-map-dialog" @close="exitFullscreenMap">
            <div class="fullscreen-map-container">
                <div id="fullscreen-valve-map" class="fullscreen-valve-map"></div>
                <div class="fullscreen-map-info">
                    <span>当前轮灌组：{{ fullscreenMapGroupName }}</span>
                    <span>已选择：{{ selectedValveDevices[fullscreenMapGroupName]?.length || 0 }} / {{
                        availableValveDevices.length
                    }} 个阀门</span>
                </div>
            </div>
        </el-dialog>

        <!-- 创建方案对话框 -->
        <el-dialog v-model="createSchemeDialogVisible" title="创建新方案" width="500px">
            <el-form :model="{ name: newSchemeName, description: newSchemeDescription }" label-width="80px">
                <el-form-item label="方案名称" required>
                    <el-input v-model="newSchemeName" placeholder="请输入方案名称" />
                </el-form-item>
                <el-form-item label="方案描述">
                    <el-input v-model="newSchemeDescription" type="textarea" :rows="3" placeholder="请输入方案描述（可选）" />
                </el-form-item>
            </el-form>
            <template #footer>
                <UnifiedButton variant="default" @click="createSchemeDialogVisible = false">取消</UnifiedButton>
                <UnifiedButton variant="primary" @click="createScheme">创建</UnifiedButton>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
    Document, Close, Refresh, Plus, Delete, CopyDocument,
    ArrowLeft, ArrowRight, Check, View, FullScreen, InfoFilled
} from '@element-plus/icons-vue'
import UnifiedButton from '../../public/gui/src/components/UnifiedButton.vue'
import call_remote from '../../public/lib/call_remote.js'
import policy_lib from '../lib/policy_lib.js'
import device_management_lib from '../../device/lib/device_management_lib.js'
import { mapConfig, getAMapScriptUrl, getDeviceIcon } from '../../public/gui/src/config/mapConfig.js'

const router = useRouter()
const route = useRoute()

// 向导步骤
const wizardStep = ref(1)

// 方案数据
const schemes = ref([])
const selectedSchemeId = ref(null)
const createSchemeDialogVisible = ref(false)
const newSchemeName = ref('')
const newSchemeDescription = ref('')
const schemeName = ref('') // 方案名称（用于保存配置文件）

// 轮灌组数据
const wateringGroups = ref([])
const existingGroups = ref([])

// 设备选择
const availableValveDevices = ref([])
const selectedValveDevices = ref({})
const currentGroupIndex = ref(0)
const valveDisplayMode = ref('map')
const valveSelectionMaps = ref({})
const valveSelectionMarkers = ref({})
const fullscreenMapVisible = ref(false)
const fullscreenMapGroupName = ref('')
const fullscreenMapInstance = ref(null)
const fullscreenMapMarkers = ref([])

// 施肥配置
const fertConfigs = ref({})
// 存储初始配置快照，用于对比变更
const initialFertConfigs = ref({})
// 存储初始面积快照
const initialAreas = ref({})
// 存储变更的轮灌组配置
const changedFertConfigs = ref({})
// 存储变更的面积
const changedAreas = ref({})

// 获取轮灌组的施肥配置，如果不存在则初始化
const getFertConfig = (group) => {
    const key = group.configKey || group.name
    if (!fertConfigs.value[key]) {
        fertConfigs.value[key] = {
            method: 'AreaBased',
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

// 保存初始配置快照
const saveInitialFertConfigs = () => {
    initialFertConfigs.value = JSON.parse(JSON.stringify(fertConfigs.value))
    initialAreas.value = {}
    wateringGroups.value.forEach(group => {
        const key = group.configKey || group.name
        initialAreas.value[key] = group.area || 0
    })
    changedFertConfigs.value = {}
    changedAreas.value = {}
}

// 监听面积变化
watch(() => wateringGroups.value.map(g => ({ key: g.configKey || g.name, area: g.area })), (newAreas) => {
    if (!initialAreas.value || Object.keys(initialAreas.value).length === 0) {
        return
    }
    
    newAreas.forEach(({ key, area }) => {
        const oldArea = initialAreas.value[key] || 0
        if (area !== oldArea) {
            changedAreas.value[key] = area
        } else {
            delete changedAreas.value[key]
        }
    })
}, { deep: true })

// 监听 fertConfigs 的变化，只记录变更的配置
// 监听方案变化，自动刷新已配置的轮灌组列表
watch(selectedSchemeId, async (newSchemeId, oldSchemeId) => {
    if (newSchemeId !== oldSchemeId && wizardStep >= 2) {
        // 如果已经在步骤2或之后，且方案发生了变化，重新加载已配置的轮灌组
        console.log(`方案变化: ${oldSchemeId} -> ${newSchemeId}，重新加载轮灌组列表`)
        await loadExistingGroups()
    }
}, { immediate: false })

watch(fertConfigs, (newConfigs, oldConfigs) => {
    if (!initialFertConfigs.value || Object.keys(initialFertConfigs.value).length === 0) {
        return
    }
    
    // 检查每个轮灌组的配置是否有变更
    Object.keys(newConfigs).forEach(key => {
        const newConfig = newConfigs[key]
        const oldConfig = initialFertConfigs.value[key]
        
        if (!oldConfig) {
            // 新添加的配置，记录全部
            changedFertConfigs.value[key] = JSON.parse(JSON.stringify(newConfig))
            return
        }
        
        // 检查是否有变更
        const hasChanged = 
            newConfig.method !== oldConfig.method ||
            newConfig.AB_fert !== oldConfig.AB_fert ||
            newConfig.total_fert !== oldConfig.total_fert ||
            newConfig.fert_time !== oldConfig.fert_time ||
            newConfig.total_time !== oldConfig.total_time ||
            newConfig.post_fert_time !== oldConfig.post_fert_time
        
        if (hasChanged) {
            // 只记录变更的字段
            const changed = {}
            if (newConfig.method !== oldConfig.method) changed.method = newConfig.method
            if (newConfig.AB_fert !== oldConfig.AB_fert) changed.AB_fert = newConfig.AB_fert
            if (newConfig.total_fert !== oldConfig.total_fert) changed.total_fert = newConfig.total_fert
            if (newConfig.fert_time !== oldConfig.fert_time) changed.fert_time = newConfig.fert_time
            if (newConfig.total_time !== oldConfig.total_time) changed.total_time = newConfig.total_time
            if (newConfig.post_fert_time !== oldConfig.post_fert_time) changed.post_fert_time = newConfig.post_fert_time
            
            changedFertConfigs.value[key] = { ...oldConfig, ...changed }
        } else {
            // 如果没有变更，从变更列表中移除
            delete changedFertConfigs.value[key]
        }
    })
}, { deep: true })

// 面积参数
const farmAreaParams = ref({
    system_flow: 1,
    laying_spacing: 0,
    dripper_spacing: 0,
    dripper_flow: 0,
    coefficient: 0.9
})

const areaParamsPopoverVisible = ref({})

// 计算属性
const allGroupsAreCopied = computed(() => {
    return wateringGroups.value.every(g => g.isCopied === true)
})

// 添加轮灌组
const addWateringGroup = async () => {
    let defaultName = `轮灌组${wateringGroups.value.length + 1}`
    let counter = 1
    while (isGroupNameDuplicate(defaultName)) {
        counter++
        defaultName = `轮灌组${counter}`
    }

    try {
        const { value: groupName } = await ElMessageBox.prompt(
            '请输入新轮灌组的名称',
            '新增轮灌组',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                inputValue: defaultName,
                inputPlaceholder: '请输入轮灌组名称',
                inputValidator: (value) => {
                    if (!value || value.trim() === '') {
                        return '轮灌组名称不能为空'
                    }
                    if (isGroupNameDuplicate(value.trim())) {
                        return '该轮灌组名称已存在，请使用其他名称'
                    }
                    return true
                },
                inputErrorMessage: '请输入有效的轮灌组名称'
            }
        )

        if (!groupName || groupName.trim() === '') {
            ElMessage.warning('轮灌组名称不能为空')
            return
        }

        const trimmedName = groupName.trim()
        if (isGroupNameDuplicate(trimmedName)) {
            ElMessage.error('该轮灌组名称已存在，请使用其他名称')
            return
        }

        const index = wateringGroups.value.length
        wateringGroups.value.push({
            name: trimmedName,
            area: 0,
            isCopied: false,
            configKey: trimmedName
        })

        selectedValveDevices.value[trimmedName] = []
        fertConfigs.value[trimmedName] = {
            method: 'AreaBased',
            AB_fert: 0,
            total_fert: 0,
            fert_time: 0,
            pre_fert_time: 0,
            post_fert_time: 0,
            total_time: 0,
        }
        areaParamsPopoverVisible.value[index] = false
    } catch (error) {
        if (error === 'cancel') {
            return
        }
        console.error('新增轮灌组失败:', error)
    }
}

// 删除轮灌组
const removeWateringGroup = (index) => {
    const groupName = wateringGroups.value[index].name
    wateringGroups.value.splice(index, 1)
    delete selectedValveDevices.value[groupName]
    delete fertConfigs.value[groupName]
    delete areaParamsPopoverVisible.value[index]

    if (valveSelectionMaps.value[groupName]) {
        try {
            valveSelectionMaps.value[groupName].destroy()
        } catch (e) {
            console.warn('销毁地图失败:', e)
        }
        delete valveSelectionMaps.value[groupName]
    }
    delete valveSelectionMarkers.value[groupName]
}

// 解析函数
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
            return matches.map(m => m.replace(/"/g, '').trim()).filter(Boolean)
        }
        return arrayContent.split(',').map(v => v.trim()).filter(Boolean)
    }

    if (cleanExpression.includes(',')) {
        const matches = cleanExpression.match(/"([^"]+)"/g)
        if (matches && matches.length > 1) {
            return matches.map(m => m.replace(/"/g, '').trim()).filter(Boolean)
        }
        return cleanExpression.split(',').map(v => v.trim()).filter(Boolean)
    }

    const matches = cleanExpression.match(/"([^"]+)"/g)
    if (matches) {
        return matches.map(m => m.replace(/"/g, '').trim()).filter(Boolean)
    }

    return cleanExpression.trim() ? [cleanExpression.trim()] : []
}

const parseFertMethod = (expression) => {
    const methodStr = expression.replace(/"/g, '')
    if (methodStr === '亩定量' || methodStr === 'AreaBased') return 'AreaBased'
    if (methodStr === '总定量' || methodStr === 'Total') return 'Total'
    if (methodStr === '定时' || methodStr === 'Time') return 'Time'
    return 'AreaBased'
}

const parseTimeValue = (expression) => {
    const value = parseFloat(expression) || 0
    // 如果是毫秒，转换为分钟
    if (value > 1000) {
        return value / 60000
    }
    return value
}

// 辅助函数：处理时间变量
const handleTimeVariable = (varName, expression, fertConfig) => {
    if (varName === 'fert_time' || varName === '施肥时间') {
        fertConfig.fert_time = parseTimeValue(expression)
        return true
    }
    if (varName === 'pre_ms' || varName === '肥前时间') {
        if (fertConfig.pre_fert_time === undefined) {
            fertConfig.pre_fert_time = parseTimeValue(expression)
        }
        return true
    }
    if (varName === 'post_ms' || varName === '肥后时间') {
        if (fertConfig.post_fert_time === undefined) {
            fertConfig.post_fert_time = parseTimeValue(expression)
        }
        return true
    }
    return false
}

// 辅助函数：处理施肥量变量
const handleFertAmountVariable = (varName, expression, fertConfig) => {
    if (varName === '期望每亩施肥量' || varName === 'area_based_amount') {
        fertConfig.AB_fert = parseFloat(expression) || 0
        return true
    }
    if (varName === '期望施肥总量') {
        fertConfig.total_fert = parseFloat(expression) || 0
        return true
    }
    return false
}

const parseFertConfigFromVariables = (initVariables, fertConfig, area = 0) => {
    for (const initVar of initVariables) {
        const varName = initVar.variable_name
        const expression = initVar.expression || ''

        if (varName === 'method' || varName === '施肥策略') {
            fertConfig.method = parseFertMethod(expression)
        } else if (handleTimeVariable(varName, expression, fertConfig)) {
            // 已处理时间变量
        } else if (handleFertAmountVariable(varName, expression, fertConfig)) {
            // 已处理施肥量变量
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

const parseAreaFromVariable = (initVariables) => {
    for (const initVar of initVariables) {
        const varName = initVar.variable_name
        if (varName === 'area' || varName === '面积') {
            const areaValue = parseFloat(initVar.expression) || 0
            if (areaValue > 0) {
                return areaValue
            }
        }
    }
    return null
}

const parseValvesFromGroup = (group) => {
    if (!group.valves || group.valves === '-') {
        return []
    }

    if (group.valves.includes('|')) {
        return group.valves.split('|').map(v => v.trim()).filter(Boolean)
    }

    const matches = group.valves.match(/"([^"]+)"/g)
    return matches ? matches.map(m => m.replace(/"/g, '')) : []
}

// 辅助函数：解析基础信息（面积和阀门）
const parseBasicGroupInfo = (policyContent) => {
    let area = 0
    let valves = []

    const areaMatch = policyContent.match(/init assignment\s+'false'\s+'面积'\s+'([^']+)'/)
    if (areaMatch) {
        area = parseFloat(areaMatch[1]) || 0
    }

    const valveMatch = policyContent.match(/init assignment\s+'false'\s+'组内阀门'\s+'"([^"]+)"'/)
    if (valveMatch) {
        valves = valveMatch[1].split(',').map(v => v.trim()).filter(v => v)
    }

    return { area, valves }
}

// 辅助函数：解析只浇水模式配置
const parseWaterOnlyConfig = (policyContent) => {
    const fertConfig = {
        method: 'WaterOnly',
            AB_fert: 0,
            total_fert: 0,
            fert_time: 0,
        pre_fert_time: 0,
            post_fert_time: 0,
            total_time: 0,
        water_only: true,
        }
        
    const totalTimeMatch = policyContent.match(/init assignment\s+'false'\s+'总灌溉时间'\s+'([^']+)'/)
    if (totalTimeMatch) {
        fertConfig.total_time = parseFloat(totalTimeMatch[1]) / 60000 || 0
    }

    return fertConfig
        }
        
// 辅助函数：解析施肥策略（从方案内容）
const parseFertMethodFromContent = (policyContent) => {
        const fertMethodMatch = policyContent.match(/init assignment\s+'false'\s+'施肥策略'\s+'([^']+)'/)
    if (!fertMethodMatch) return null

            const method = fertMethodMatch[1]
            if (method === '定量') {
                const perMuMatch = policyContent.match(/init assignment\s+'false'\s+'期望每亩施肥量'\s+'([^']+)'/)
                const totalMatch = policyContent.match(/init assignment\s+'false'\s+'期望施肥总量'\s+'([^']+)'/)
                if (perMuMatch) {
            return {
                method: 'AreaBased',
                AB_fert: parseFloat(perMuMatch[1]) || 0,
                total_fert: 0
            }
        }
        if (totalMatch) {
            return {
                method: 'Total',
                AB_fert: 0,
                total_fert: parseFloat(totalMatch[1]) || 0
            }
                }
            } else if (method === '定时') {
                const timeMatch = policyContent.match(/init assignment\s+'false'\s+'施肥时间'\s+'([^']+)'/)
        return {
            method: 'Time',
            AB_fert: 0,
            total_fert: 0,
            fert_time: timeMatch ? parseFloat(timeMatch[1]) / 60000 || 0 : 0
                }
            }
    return null
        }
        
// 辅助函数：解析时间参数
const parseTimeParams = (policyContent, fertMethod) => {
        const preTimeMatch = policyContent.match(/init assignment\s+'false'\s+'肥前时间'\s+'([^']+)'/)
        const fertTimeMatch = policyContent.match(/init assignment\s+'false'\s+'施肥时间'\s+'([^']+)'/)
        const postTimeMatch = policyContent.match(/init assignment\s+'false'\s+'肥后时间'\s+'([^']+)'/)
        const totalTimeMatch = policyContent.match(/init assignment\s+'false'\s+'总灌溉时间'\s+'([^']+)'/)
        
        const preTimeMs = preTimeMatch ? parseFloat(preTimeMatch[1]) || 0 : 0
        const fertTimeMs = fertTimeMatch ? parseFloat(fertTimeMatch[1]) || 0 : 0
        const postTimeMs = postTimeMatch ? parseFloat(postTimeMatch[1]) || 0 : 0
        
    const pre_fert_time = preTimeMs / 60000
    const post_fert_time = postTimeMs / 60000
    const fert_time = fertMethod === 'Time' ? fertTimeMs / 60000 : 0
    const total_time = totalTimeMatch 
        ? parseFloat(totalTimeMatch[1]) / 60000 || 0
        : (preTimeMs + fertTimeMs + postTimeMs) / 60000

    return { pre_fert_time, fert_time, post_fert_time, total_time }
}

// 辅助函数：解析非只浇水模式的施肥配置
const parseFertConfig = (policyContent) => {
    const fertConfig = {
        method: 'AreaBased',
        AB_fert: 0,
        total_fert: 0,
        fert_time: 0,
        pre_fert_time: 0,
        post_fert_time: 0,
        total_time: 0,
        water_only: false,
    }

    const methodInfo = parseFertMethodFromContent(policyContent)
    if (methodInfo) {
        fertConfig.method = methodInfo.method
        fertConfig.AB_fert = methodInfo.AB_fert || 0
        fertConfig.total_fert = methodInfo.total_fert || 0
        if (methodInfo.fert_time !== undefined) {
            fertConfig.fert_time = methodInfo.fert_time
        }
    }

    const timeParams = parseTimeParams(policyContent, fertConfig.method)
    Object.assign(fertConfig, timeParams)

    return fertConfig
}

// 从方案内容解析轮灌组详细信息
const parseGroupsFromSchemeContent = (content) => {
    const groups = []
    // 匹配所有 policy 块
    const policyRegex = /policy\s+'([^']+)'([\s\S]*?)(?=policy\s+'|return\s+web|return\s+warning|return\s+statistic|return\s+config|$)/g
    let match

    while ((match = policyRegex.exec(content)) !== null) {
        const groupName = match[1]
        const policyContent = match[2]

        // 关键过滤：只有包含 "watering group matrix" 的才是轮灌组策略
        if (!policyContent.includes('watering group matrix')) {
            continue
        }

        const { area, valves } = parseBasicGroupInfo(policyContent)

        // 检查"是否只浇水"变量
        const waterOnlyMatch = policyContent.match(/init assignment\s+'false'\s+'是否只浇水'\s+'([^']+)'/)
        const isWaterOnly = waterOnlyMatch && (waterOnlyMatch[1] === 'true' || waterOnlyMatch[1] === true)

        const fertConfig = isWaterOnly 
            ? parseWaterOnlyConfig(policyContent)
            : parseFertConfig(policyContent)
        
        groups.push({
            name: groupName,
            area,
            valves,
            fertConfig
        })
    }
    
    return groups
}

// 加载已配置的轮灌组
const loadExistingGroups = async () => {
    try {
        const currentFarm = localStorage.getItem('selectedFarm') || '默认农场'
        const token = localStorage.getItem('auth_token')

        // 如果选择了方案，只加载属于该方案的轮灌组
        const params = { pageNo: 0 }
        if (selectedSchemeId.value) {
            params.scheme_id = selectedSchemeId.value
        }

        const response = await call_remote('/policy/list_watering_groups', params, token)
        if (response && response.groups) {
            let filteredGroups = response.groups
            if (currentFarm && currentFarm !== '默认农场') {
                const policyFarmMatches = await Promise.all(
                    response.groups.map(async (group) => {
                        try {
                            const farmMatch = await call_remote('/policy/get_matched_farm', {
                                policy_name: group.name
                            }, token)
                            return {
                                group,
                                farmName: farmMatch.farm_name
                            }
                        } catch (error) {
                            return {
                                group,
                                farmName: null
                            }
                        }
                    })
                )
                filteredGroups = policyFarmMatches
                    .filter(item => item.farmName === currentFarm)
                    .map(item => item.group)
            }

            const policyListResponse = await call_remote('/policy/list_policy', { pageNo: 0 }, token)
            const allPolicies = policyListResponse?.policies || []

            existingGroups.value = await Promise.all(filteredGroups.map(async (group) => {
                const policy = allPolicies.find(p => p.name === group.name)

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

                if (policy?.init_variables) {
                    const areaFromVar = parseAreaFromVariable(policy.init_variables)
                    if (areaFromVar !== null) {
                        area = areaFromVar
                    }

                    for (const initVar of policy.init_variables) {
                        const varName = initVar.variable_name
                        if (varName === 'valves' || varName === '组内阀门') {
                            valves = parseValvesFromExpression(initVar.expression || '')
                            break
                        }
                    }

                    // 计算总灌溉时间：肥前时间 + 施肥时间 + 肥后时间
                    // 从策略变量中读取时间值（都是毫秒）
                    let preTimeMs = 0
                    let fertTimeMs = 0
                    let postTimeMs = 0

                    // 检查"是否只浇水"变量（优先从 init_variables 读取）
                    let isWaterOnly = false
                    for (const initVar of policy.init_variables) {
                        const varName = initVar.variable_name
                        const expression = initVar.expression || ''
                        if (varName === '是否只浇水') {
                            isWaterOnly = expression === 'true' || expression === true
                            if (isWaterOnly) {
                                fertConfig.method = 'WaterOnly'
                                fertConfig.water_only = true
                            }
                        }
                    }

                    // 如果只浇水模式，读取总灌溉时间
                    if (isWaterOnly) {
                        for (const initVar of policy.init_variables) {
                            const varName = initVar.variable_name
                            const expression = initVar.expression || ''
                            if (varName === '总灌溉时间') {
                                const totalTimeMs = parseFloat(expression) || 0
                                fertConfig.total_time = totalTimeMs / 60000 // 转换为分钟
                                break
                            }
                        }
                    } else {
                        // 非只浇水模式，读取三个独立时间参数
                    for (const initVar of policy.init_variables) {
                        const varName = initVar.variable_name
                        const expression = initVar.expression || ''
                        if (varName === '肥前时间') {
                            preTimeMs = parseFloat(expression) || 0
                        } else if (varName === '施肥时间') {
                            fertTimeMs = parseFloat(expression) || 0
                        } else if (varName === '肥后时间') {
                            postTimeMs = parseFloat(expression) || 0
                            } else if (varName === '总灌溉时间') {
                                const totalTimeMs = parseFloat(expression) || 0
                                fertConfig.total_time = totalTimeMs / 60000 // 转换为分钟
                            }
                        }

                        // 将毫秒转换为分钟（从 init_variables 读取的值）
                        fertConfig.pre_fert_time = preTimeMs / 60000
                        if (fertConfig.method === 'Time') {
                            fertConfig.fert_time = fertTimeMs / 60000
                        }
                        fertConfig.post_fert_time = postTimeMs / 60000
                    }

                    // 解析施肥配置，传入面积用于计算（在读取时间参数之后，避免覆盖）
                    parseFertConfigFromVariables(policy.init_variables, fertConfig, area)

                    // 如果从策略变量中读取到了时间值，但总时间未设置，则计算总时间
                    if (!fertConfig.total_time && (preTimeMs > 0 || fertTimeMs > 0 || postTimeMs > 0)) {
                        fertConfig.total_time = (preTimeMs + fertTimeMs + postTimeMs) / 60000
                    }
                }

                // 如果 init_variables 中没有"是否只浇水"，尝试从运行时状态读取
                if (!fertConfig.water_only) {
                try {
                    const runtimeResponse = await call_remote('/policy/get_policy_runtime', {
                        policy_name: group.name
                    }, token)
                    if (runtimeResponse && runtimeResponse.variables) {
                        const variables = JSON.parse(runtimeResponse.variables)
                        if (variables['是否只浇水'] === true) {
                            fertConfig.method = 'WaterOnly'
                            fertConfig.water_only = true
                                // 如果运行时状态是只浇水，尝试从 init_variables 读取总灌溉时间
                                if (policy?.init_variables) {
                                    for (const initVar of policy.init_variables) {
                                        if (initVar.variable_name === '总灌溉时间') {
                                            const totalTimeMs = parseFloat(initVar.expression) || 0
                                            fertConfig.total_time = totalTimeMs / 60000
                                            break
                                        }
                                    }
                                }
                        }
                    }
                } catch (error) {
                    // 如果获取运行时状态失败，忽略错误
                    console.warn(`获取轮灌组 ${group.name} 运行时状态失败:`, error)
                    }
                }

                if (valves.length === 0) {
                    valves = parseValvesFromGroup(group)
                }

                return {
                    name: group.name,
                    area: area,
                    valves: valves,
                    fertConfig: fertConfig
                }
            }))

            if (existingGroups.value.length > 0) {
                // 自动将已配置的轮灌组添加到当前列表中
                existingGroups.value.forEach(existingGroup => {
                    const groupName = existingGroup.name
                    // 检查是否已存在
                    if (!wateringGroups.value.some(g => g.name === groupName)) {
                        wateringGroups.value.push({
                            name: groupName,
                            area: existingGroup.area || 0,
                            isCopied: false,
                            configKey: groupName
                        })
                        // 设置施肥配置
                        fertConfigs.value[groupName] = {
                            method: existingGroup.fertConfig?.method || 'AreaBased',
                            AB_fert: existingGroup.fertConfig?.AB_fert ?? 0,
                            total_fert: existingGroup.fertConfig?.total_fert ?? 0,
                            fert_time: existingGroup.fertConfig?.fert_time ?? 0,
                            pre_fert_time: existingGroup.fertConfig?.pre_fert_time ?? 0,
                            post_fert_time: existingGroup.fertConfig?.post_fert_time ?? 0,
                            total_time: existingGroup.fertConfig?.total_time ?? 0,
                            water_only: existingGroup.fertConfig?.water_only ?? false,
                        }
                        // 设置阀门配置
                        selectedValveDevices.value[groupName] = existingGroup.valves || []
                    }
                })
                ElMessage.success(`已自动加载 ${existingGroups.value.length} 个已配置的轮灌组`)
            } else {
                ElMessage.info('当前没有已配置的轮灌组')
            }
        } else {
            existingGroups.value = []
            ElMessage.info('当前没有已配置的轮灌组')
        }
    } catch (error) {
        console.error('加载已配置轮灌组失败:', error)
        ElMessage.error('加载已配置轮灌组失败')
        existingGroups.value = []
    }
}

// 验证函数
const isGroupNameDuplicate = (name, excludeName = null) => {
    const existsInCurrent = wateringGroups.value.some(g => g.name === name && g.name !== excludeName)
    const existsInExisting = existingGroups.value.some(g => g.name === name)
    return existsInCurrent || existsInExisting
}

const validateExistingGroup = (existingGroup) => {
    if (!existingGroup || !existingGroup.name || typeof existingGroup.name !== 'string') {
        ElMessage.error('无效的轮灌组数据')
        return null
    }

    const groupName = existingGroup.name.trim()
    if (groupName.length > 100) {
        ElMessage.error('轮灌组名称过长')
        return null
    }

    return groupName
}

const extractBaseName = (groupName) => {
    if (groupName.length === 0) {
        return '轮灌组'
    }

    let endIndex = groupName.length
    while (endIndex > 0 && groupName.charCodeAt(endIndex - 1) >= 48 && groupName.charCodeAt(endIndex - 1) <= 57) {
        endIndex--
    }

    const baseName = endIndex > 0 ? groupName.substring(0, endIndex) : '轮灌组'
    if (baseName.length > 50) {
        ElMessage.error('轮灌组基础名称过长')
        return null
    }

    return baseName
}

const generateDefaultName = (baseName) => {
    let defaultName = `${baseName}${wateringGroups.value.length + 1}`
    let counter = 1
    while (isGroupNameDuplicate(defaultName)) {
        counter++
        if (counter > 10000) {
            ElMessage.error('无法生成唯一的轮灌组名称')
            return null
        }
        defaultName = `${baseName}${counter}`
    }
    return defaultName
}

// 复制已配置的轮灌组
const copyExistingGroup = async (existingGroup) => {
    const groupName = validateExistingGroup(existingGroup)
    if (!groupName) return

    const baseName = extractBaseName(groupName)
    if (!baseName) return

    const defaultName = generateDefaultName(baseName)
    if (!defaultName) return

    try {
        const { value: newName } = await ElMessageBox.prompt(
            `请输入新轮灌组的名称（复制自：${existingGroup.name}）`,
            '复制轮灌组',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                inputValue: defaultName,
                inputPlaceholder: '请输入轮灌组名称',
                inputValidator: (value) => {
                    if (!value || value.trim() === '') {
                        return '轮灌组名称不能为空'
                    }
                    if (isGroupNameDuplicate(value.trim())) {
                        return '该轮灌组名称已存在，请使用其他名称'
                    }
                    return true
                },
                inputErrorMessage: '请输入有效的轮灌组名称'
            }
        )

        const trimmedName = newName?.trim()
        if (!trimmedName || isGroupNameDuplicate(trimmedName)) {
            if (!trimmedName) {
                ElMessage.warning('轮灌组名称不能为空')
            } else {
                ElMessage.error('该轮灌组名称已存在，请使用其他名称')
            }
            return
        }

        const newGroup = {
            name: trimmedName,
            area: existingGroup.area || 0,
            isCopied: true,
            configKey: trimmedName
        }
        wateringGroups.value.push(newGroup)

        // 先设置施肥配置
        fertConfigs.value[trimmedName] = {
            method: existingGroup.fertConfig?.method || 'AreaBased',
            AB_fert: existingGroup.fertConfig?.AB_fert ?? 0,
            total_fert: existingGroup.fertConfig?.total_fert ?? 0,
            fert_time: existingGroup.fertConfig?.fert_time ?? 0,
            pre_fert_time: existingGroup.fertConfig?.pre_fert_time ?? 0,
            post_fert_time: existingGroup.fertConfig?.post_fert_time ?? 0,
            total_time: existingGroup.fertConfig?.total_time ?? 0,
            water_only: existingGroup.fertConfig?.water_only ?? false,
        }

        // 复制时清空阀门选择，要求用户重新选择（参数可以一样，但阀门必须重新选择）
        selectedValveDevices.value[trimmedName] = []

        // 如果当前在第二步且是地图模式，需要初始化地图（阀门选择为空）
        if (wizardStep.value === 2 && valveDisplayMode.value === 'map') {
            await nextTick()
            await initValveSelectionMap(trimmedName)
        }

        ElMessage.success(`已将轮灌组 ${existingGroup.name} 的配置复制到 ${trimmedName}`)
    } catch (error) {
        if (error === 'cancel') {
            return
        }
        console.error('复制轮灌组失败:', error)
    }
}

// 复制当前列表中的轮灌组
const copyWateringGroup = async (group, index) => {
    const groupName = group.name?.trim()
    if (!groupName) {
        ElMessage.warning('轮灌组名称不能为空')
        return
    }

    const baseName = extractBaseName(groupName)
    if (!baseName) return

    const defaultName = generateDefaultName(baseName)
    if (!defaultName) return

    try {
        const { value: newName } = await ElMessageBox.prompt(
            `请输入新轮灌组的名称（复制自：${groupName}）`,
            '复制轮灌组',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                inputValue: defaultName,
                inputPlaceholder: '请输入轮灌组名称',
                inputValidator: (value) => {
                    if (!value || value.trim() === '') {
                        return '轮灌组名称不能为空'
                    }
                    if (isGroupNameDuplicate(value.trim())) {
                        return '该轮灌组名称已存在，请使用其他名称'
                    }
                    return true
                },
                inputErrorMessage: '请输入有效的轮灌组名称'
            }
        )

        const trimmedName = newName?.trim()
        if (!trimmedName || isGroupNameDuplicate(trimmedName)) {
            if (!trimmedName) {
                ElMessage.warning('轮灌组名称不能为空')
            } else {
                ElMessage.error('该轮灌组名称已存在，请使用其他名称')
            }
            return
        }

        const newGroup = {
            name: trimmedName,
            area: group.area || 0,
            isCopied: true,
            configKey: trimmedName
        }
        wateringGroups.value.push(newGroup)

        // 复制施肥配置
        const originalConfigKey = group.configKey || group.name
        fertConfigs.value[trimmedName] = {
            method: fertConfigs.value[originalConfigKey]?.method || 'AreaBased',
            AB_fert: fertConfigs.value[originalConfigKey]?.AB_fert ?? 0,
            total_fert: fertConfigs.value[originalConfigKey]?.total_fert ?? 0,
            fert_time: fertConfigs.value[originalConfigKey]?.fert_time ?? 0,
            pre_fert_time: fertConfigs.value[originalConfigKey]?.pre_fert_time ?? 0,
            post_fert_time: fertConfigs.value[originalConfigKey]?.post_fert_time ?? 0,
            total_time: fertConfigs.value[originalConfigKey]?.total_time ?? 0,
        }

        // 复制时清空阀门选择，要求用户重新选择（参数可以一样，但阀门必须重新选择）
        selectedValveDevices.value[trimmedName] = []

        // 如果当前在第二步且是地图模式，需要初始化地图（阀门选择为空）
        if (wizardStep.value === 2 && valveDisplayMode.value === 'map') {
            await nextTick()
            await initValveSelectionMap(trimmedName)
        }

        ElMessage.success(`已将轮灌组 ${groupName} 的配置复制到 ${trimmedName}`)
    } catch (error) {
        if (error === 'cancel') {
            return
        }
        console.error('复制轮灌组失败:', error)
    }
}

// 加载阀门设备
const loadValveDevices = async () => {
    try {
        const token = localStorage.getItem('auth_token')
        // 获取所有设备，然后过滤出WaterGroupValve类型的设备
        let allDevices = []
        let pageNo = 0
        let hasMore = true

        while (hasMore) {
            const result = await device_management_lib.list_device(pageNo, null, null, token)
            const devices = result.devices || []
            allDevices = allDevices.concat(devices)

            // 如果返回的设备数量少于20，说明已经是最后一页
            hasMore = devices.length >= 20
            pageNo++
        }

        // 过滤出WaterGroupValve类型的设备
        availableValveDevices.value = allDevices.filter(device =>
            device.driver_name === 'WaterGroupValve' || device.driver_name === 'WaterGroupValve_v2'
        ).map(device => ({
            device_name: device.device_name,
            label: device.device_name,
            is_online: true, // 可以根据实际情况获取在线状态
            longitude: device.longitude,
            latitude: device.latitude
        }))
    } catch (error) {
        console.error('加载阀门设备失败:', error)
        availableValveDevices.value = []
    }
}

// 切换组
const switchToPreviousGroup = async () => {
    if (currentGroupIndex.value > 0) {
        currentGroupIndex.value--

        if (valveDisplayMode.value === 'map') {
            await nextTick()
            const groupName = wateringGroups.value[currentGroupIndex.value]?.name
            if (groupName && !valveSelectionMaps.value[groupName]) {
                await initValveSelectionMap(groupName)
            }
        }

        const groupName = wateringGroups.value[currentGroupIndex.value]?.name
        if (groupName && !selectedValveDevices.value[groupName]) {
            selectedValveDevices.value[groupName] = []
        }
    }
}

const switchToNextGroup = async () => {
    if (currentGroupIndex.value < wateringGroups.value.length - 1) {
        currentGroupIndex.value++

        if (valveDisplayMode.value === 'map') {
            await nextTick()
            const groupName = wateringGroups.value[currentGroupIndex.value]?.name
            if (groupName && !valveSelectionMaps.value[groupName]) {
                await initValveSelectionMap(groupName)
            }
        }

        const groupName = wateringGroups.value[currentGroupIndex.value]?.name
        if (groupName && !selectedValveDevices.value[groupName]) {
            selectedValveDevices.value[groupName] = []
        }
    }
}

// 设备选择相关
const isValveSelected = (deviceName, groupName) => {
    const configKey = wateringGroups.value.find(g => g.name === groupName)?.configKey || groupName
    return selectedValveDevices.value[configKey]?.includes(deviceName) || false
}

const clearSelectedValves = (configKey) => {
    if (selectedValveDevices.value[configKey]) {
        selectedValveDevices.value[configKey] = []

        if (valveDisplayMode.value === 'map') {
            updateValveSelectionMarkers(configKey)
        }
    }
}

const selectAllValves = (configKey) => {
    if (!selectedValveDevices.value[configKey]) {
        selectedValveDevices.value[configKey] = []
    }
    selectedValveDevices.value[configKey] = availableValveDevices.value.map(d => d.device_name)

    if (valveDisplayMode.value === 'map') {
        updateValveSelectionMarkers(configKey)
    }
}

// 加载高德地图脚本
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

// 初始化阀门选择地图
const initValveSelectionMap = async (groupName) => {
    await nextTick()

    const mapContainerId = `valve-selection-map-${groupName}`
    const container = document.getElementById(mapContainerId)
    if (!container) {
        console.error('找不到地图容器:', mapContainerId)
        await new Promise(resolve => setTimeout(resolve, 200))
        const retryContainer = document.getElementById(mapContainerId)
        if (!retryContainer) {
            console.error('重试后仍找不到地图容器:', mapContainerId)
            return
        }
    }

    const group = wateringGroups.value.find(g => (g.configKey || g.name) === groupName || g.name === groupName)
    const configKey = group ? (group.configKey || group.name) : groupName

    if (valveSelectionMaps.value[configKey]) {
        try {
            valveSelectionMaps.value[configKey].destroy()
        } catch (e) {
            console.warn('销毁地图失败:', e)
        }
        delete valveSelectionMaps.value[configKey]
        delete valveSelectionMarkers.value[configKey]
    }

    if (groupName !== configKey && valveSelectionMaps.value[groupName]) {
        try {
            valveSelectionMaps.value[groupName].destroy()
        } catch (e) {
            console.warn('销毁旧地图失败:', e)
        }
        delete valveSelectionMaps.value[groupName]
        delete valveSelectionMarkers.value[groupName]
    }

    try {
        if (!globalThis.AMap) {
            await loadAMapScript()
        }

        if (!globalThis.AMap) {
            throw new Error('高德地图API加载失败')
        }

        let centerLng = mapConfig.defaultCenter.lng
        let centerLat = mapConfig.defaultCenter.lat

        if (availableValveDevices.value.length > 0) {
            const lngs = availableValveDevices.value.map(d => d.longitude).filter(Boolean)
            const lats = availableValveDevices.value.map(d => d.latitude).filter(Boolean)

            if (lngs.length > 0 && lats.length > 0) {
                centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length
                centerLat = lats.reduce((a, b) => a + b, 0) / lats.length
            }
        }

        const selectionMap = new AMap.Map(mapContainerId, {
            zoom: 15,
            center: [centerLng, centerLat],
            mapStyle: 'amap://styles/normal',
            viewMode: '2D'
        })

        const satelliteLayer = new AMap.TileLayer.Satellite({
            zIndex: 1,
            opacity: 1
        })
        selectionMap.add(satelliteLayer)

        valveSelectionMaps.value[configKey] = selectionMap

        const markers = []
        for (const device of availableValveDevices.value) {
            if (!device.longitude || !device.latitude) continue

            const isSelected = selectedValveDevices.value[configKey]?.includes(device.device_name) || false

            const marker = createValveSelectionMarker(device, isSelected, configKey)
            if (marker) {
                selectionMap.add(marker)
                markers.push(marker)
            }
        }

        valveSelectionMarkers.value[configKey] = markers

    } catch (error) {
        console.error('初始化阀门选择地图失败:', error)
        ElMessage.error('地图加载失败')
    }
}

// 创建阀门选择标记
const createValveSelectionMarker = (device, isSelected, groupName) => {
    if (!globalThis.AMap) return null

    try {
        const deviceName = device.device_name
        const deviceType = 'valve'
        const iconName = getDeviceIcon(deviceType)

        const statusClass = isSelected ? 'selected' : ''
        const selectionClass = isSelected ? 'valve-selected' : ''

        const markerContent = `
            <div class="device-marker valve ${statusClass} ${selectionClass}" title="${deviceName}">
                <div class="marker-icon">
                    <img src="/deviceIcon/${iconName}.png" alt="${deviceName}" />
                </div>
                <div class="marker-name">${deviceName}</div>
            </div>
        `

        const marker = new AMap.Marker({
            position: [device.longitude, device.latitude],
            content: markerContent,
            anchor: 'center',
            offset: new AMap.Pixel(0, 0)
        })

        marker.on('click', () => {
            toggleValveSelection(device.device_name, groupName)
        })

        return marker
    } catch (error) {
        console.error('创建阀门选择标记失败:', error)
        return null
    }
}

// 切换阀门选择
const toggleValveSelection = (deviceName, groupName) => {
    if (!selectedValveDevices.value[groupName]) {
        selectedValveDevices.value[groupName] = []
    }

    const index = selectedValveDevices.value[groupName].indexOf(deviceName)
    if (index > -1) {
        selectedValveDevices.value[groupName].splice(index, 1)
    } else {
        selectedValveDevices.value[groupName].push(deviceName)
    }

    if (valveDisplayMode.value === 'map') {
        updateValveSelectionMarkers(groupName)
    }

    // 如果全屏地图可见，更新全屏地图的标记
    if (fullscreenMapVisible.value && fullscreenMapGroupName.value === groupName) {
        updateFullscreenMapMarkers(groupName)
    }
}

// 更新阀门选择标记
const updateValveSelectionMarkers = (groupName) => {
    const group = wateringGroups.value.find(g => (g.configKey || g.name) === groupName || g.name === groupName)
    const configKey = group ? (group.configKey || group.name) : groupName

    const markers = valveSelectionMarkers.value[configKey]
    if (!markers) return

    markers.forEach((marker, index) => {
        const device = availableValveDevices.value[index]
        if (!device) return

        const isSelected = selectedValveDevices.value[configKey]?.includes(device.device_name) || false
        const deviceName = device.device_name
        const deviceType = 'valve'
        const iconName = getDeviceIcon(deviceType)
        const statusClass = isSelected ? 'selected' : ''
        const selectionClass = isSelected ? 'valve-selected' : ''

        const markerContent = `
            <div class="device-marker valve ${statusClass} ${selectionClass}" title="${deviceName}">
                <div class="marker-icon">
                    <img src="/deviceIcon/${iconName}.png" alt="${deviceName}" />
                </div>
                <div class="marker-name">${deviceName}</div>
            </div>
        `

        marker.setContent(markerContent)
    })

    if (configKey !== groupName && valveSelectionMarkers.value[groupName]) {
        delete valveSelectionMarkers.value[groupName]
    }
}

// 更新全屏地图的标记
const updateFullscreenMapMarkers = (groupName) => {
    const markers = fullscreenMapMarkers.value
    if (!markers || markers.length === 0) return

    markers.forEach((marker, index) => {
        const device = availableValveDevices.value[index]
        if (!device) return

        const isSelected = selectedValveDevices.value[groupName]?.includes(device.device_name) || false
        const deviceName = device.device_name
        const deviceType = 'valve'
        const iconName = getDeviceIcon(deviceType)
        const statusClass = isSelected ? 'selected' : ''
        const selectionClass = isSelected ? 'valve-selected' : ''

        const markerContent = `
            <div class="device-marker valve ${statusClass} ${selectionClass}" title="${deviceName}">
                <div class="marker-icon">
                    <img src="/deviceIcon/${iconName}.png" alt="${deviceName}" />
                </div>
                <div class="marker-name">${deviceName}</div>
            </div>
        `

        marker.setContent(markerContent)
    })
}

// 处理显示模式切换
const handleDisplayModeChange = async (mode) => {
    if (mode === 'map') {
        const currentGroup = wateringGroups.value[currentGroupIndex.value]
        if (currentGroup) {
            await nextTick()
            await new Promise(resolve => setTimeout(resolve, 150))
            await initValveSelectionMap(currentGroup.name)
        }
    }
}

// 全屏地图相关
const enterFullscreenMap = async (groupName) => {
    fullscreenMapGroupName.value = groupName
    fullscreenMapVisible.value = true
    await nextTick()
    await initFullscreenMap(groupName)
}

const exitFullscreenMap = () => {
    if (fullscreenMapInstance.value) {
        fullscreenMapInstance.value.destroy()
        fullscreenMapInstance.value = null
    }
    fullscreenMapMarkers.value = []
    fullscreenMapVisible.value = false
    fullscreenMapGroupName.value = ''
}

const getMapCenterFromDevices = () => {
    if (availableValveDevices.value.length === 0) {
        return { lng: mapConfig.defaultCenter.lng, lat: mapConfig.defaultCenter.lat }
    }

    const lngs = availableValveDevices.value.map(d => d.longitude).filter(Boolean)
    const lats = availableValveDevices.value.map(d => d.latitude).filter(Boolean)

    if (lngs.length === 0 || lats.length === 0) {
        return { lng: mapConfig.defaultCenter.lng, lat: mapConfig.defaultCenter.lat }
    }

    return {
        lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
        lat: lats.reduce((a, b) => a + b, 0) / lats.length
    }
}

const createFullscreenMapMarkers = (fullscreenMap, groupName) => {
    const markers = []
    for (const device of availableValveDevices.value) {
        if (!device.longitude || !device.latitude) continue

        const isSelected = selectedValveDevices.value[groupName]?.includes(device.device_name) || false
        const marker = createValveSelectionMarker(device, isSelected, groupName)

        if (marker) {
            fullscreenMap.add(marker)
            markers.push(marker)
        }
    }
    return markers
}

const calculateZoomFromRange = (lngs, lats) => {
    const lngRange = Math.max(...lngs) - Math.min(...lngs)
    const latRange = Math.max(...lats) - Math.min(...lats)
    const maxRange = Math.max(lngRange, latRange)

    if (maxRange <= 0) return null
    return maxRange > 0.1 ? 12 : maxRange > 0.05 ? 13 : 14
}

const getDeviceCoordinates = () => {
    const lngs = availableValveDevices.value.map(d => d.longitude).filter(Boolean)
    const lats = availableValveDevices.value.map(d => d.latitude).filter(Boolean)
    return { lngs, lats }
}

const adjustMapView = (fullscreenMap, markers) => {
    if (markers.length > 0) {
        fullscreenMap.setFitView(markers, false, [100, 100, 100, 100])
        return
    }

    const { lngs, lats } = getDeviceCoordinates()
    if (lngs.length === 0 || lats.length === 0) return

    const center = {
        lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
        lat: lats.reduce((a, b) => a + b, 0) / lats.length
    }

    fullscreenMap.setCenter([center.lng, center.lat])

    const zoom = calculateZoomFromRange(lngs, lats)
    if (zoom !== null) {
        fullscreenMap.setZoom(zoom)
    }
}

const ensureAMapLoaded = async () => {
    if (!globalThis.AMap) {
        await loadAMapScript()
    }
    if (!globalThis.AMap) {
        throw new Error('高德地图API加载失败')
    }
}

const initFullscreenMap = async (groupName) => {
    await nextTick()

    const mapContainerId = 'fullscreen-valve-map'
    const container = document.getElementById(mapContainerId)
    if (!container) {
        console.error('找不到全屏地图容器')
        return
    }

    if (fullscreenMapInstance.value) {
        fullscreenMapInstance.value.destroy()
    }

    try {
        await ensureAMapLoaded()

        const center = getMapCenterFromDevices()
        const fullscreenMap = new AMap.Map(mapContainerId, {
            zoom: 15,
            center: [center.lng, center.lat],
            mapStyle: 'amap://styles/normal',
            viewMode: '2D'
        })

        const satelliteLayer = new AMap.TileLayer.Satellite({
            zIndex: 1,
            opacity: 1
        })
        fullscreenMap.add(satelliteLayer)
        fullscreenMapInstance.value = fullscreenMap

        const markers = createFullscreenMapMarkers(fullscreenMap, groupName)
        fullscreenMapMarkers.value = markers
        adjustMapView(fullscreenMap, markers)

    } catch (error) {
        console.error('初始化全屏地图失败:', error)
        ElMessage.error('全屏地图加载失败')
    }
}

// 步骤导航
const nextStep = async () => {
    if (wizardStep.value === 1) {
        // 验证方案名称
        if (!schemeName.value || schemeName.value.trim() === '') {
            ElMessage.warning('请输入方案名称')
            return
        }
        wizardStep.value = 2
    } else if (wizardStep.value === 2) {
        // 验证轮灌组
        if (wateringGroups.value.length === 0) {
            ElMessage.warning('请至少创建一个轮灌组')
            return
        }
        for (const group of wateringGroups.value) {
            if (group.area <= 0) {
                ElMessage.warning(`请为${group.name}设置有效的面积`)
                return
            }
        }
        wizardStep.value = 3
        await loadValveDevices()

        await nextTick()
        wateringGroups.value.forEach(group => {
            if (valveDisplayMode.value === 'map') {
                initValveSelectionMap(group.name)
            }
        })
    } else if (wizardStep.value === 3) {
        // 验证设备分配
        for (const group of wateringGroups.value) {
            const configKey = group.configKey || group.name
            if (!selectedValveDevices.value[configKey] || selectedValveDevices.value[configKey].length === 0) {
                ElMessage.warning(`请为${group.name}分配至少一个阀门设备`)
                return
            }
        }
        // 验证通过后，进入步骤4
        wizardStep.value = 4
    }
}

const prevStep = () => {
    if (wizardStep.value > 1) {
        wizardStep.value--
    }
}

// 完成配置
const finishWizard = async () => {
    if (!Array.isArray(wateringGroups.value)) {
        wateringGroups.value = []
        ElMessage.error('轮灌组数据异常，请重新配置')
        return
    }

    if (wateringGroups.value.length === 0) {
        ElMessage.warning('请至少创建一个轮灌组')
        return
    }

    // 验证配置
    for (const group of wateringGroups.value) {
        if (!group || !group.name) {
            ElMessage.error('轮灌组数据异常，请重新配置')
            return
        }

        const configKey = group.configKey || group.name
        const config = fertConfigs.value[configKey]
        if (!config) {
            ElMessage.warning(`请为${group.name}设置施肥配置`)
            return
        }
        // 如果选择"只浇水"，只需要验证总灌溉时间
        if (config.method === 'WaterOnly') {
            if (!config.total_time || config.total_time <= 0) {
                ElMessage.warning(`请为${group.name}设置有效的总灌溉时间参数`)
                return
            }
            // "只浇水"模式下，不需要验证施肥参数
        } else {
            // 验证三个独立时间参数
            const pre_fert_time = config.pre_fert_time || 0;
            const fert_time = config.method === 'Time' ? (config.fert_time || 0) : 0;
            const post_fert_time = config.post_fert_time || 0;
            const total_time = pre_fert_time + fert_time + post_fert_time;

            if (total_time <= 0) {
                ElMessage.warning(`请为${group.name}设置有效的灌溉时间参数（肥前时间、施肥时间、肥后时间）`)
                return
            }
            if (config.method === 'AreaBased' && config.AB_fert <= 0) {
                ElMessage.warning(`请为${group.name}设置有效的亩定量施肥参数`)
                return
            }
            if (config.method === 'Total' && config.total_fert <= 0) {
                ElMessage.warning(`请为${group.name}设置有效的总定量施肥参数`)
                return
            }
            if (config.method === 'Time' && fert_time <= 0) {
                ElMessage.warning(`请为${group.name}设置有效的定时施肥参数`)
                return
            }
            if (total_time <= 0) {
                ElMessage.warning(`请为${group.name}设置有效的灌溉时间参数（肥前时间、施肥时间、肥后时间）`)
                return
            }
        }
    }

    // 检查是否有任何变更（包括数量变化、面积变化或配置变化）
    const initialGroupCount = Object.keys(initialAreas.value).length
    const isCountChanged = wateringGroups.value.length !== initialGroupCount

    // 只处理有变更的轮灌组（包括新增的）
    const groupsToUpdate = wateringGroups.value.filter(group => {
        if (!group || !group.name) return false
        const configKey = group.configKey || group.name
        // 如果是新增的轮灌组（不在初始快照中），需要更新
        const isNewGroup = initialAreas.value[configKey] === undefined
        // 如果面积有变更，或者配置有变更，或者是新增的，则需要更新
        return isNewGroup || changedAreas.value[configKey] !== undefined || changedFertConfigs.value[configKey] !== undefined
    })

    if (!isCountChanged && groupsToUpdate.length === 0) {
        ElMessage.info('没有需要更新的配置')
        return
    }

    // 如果有任何变更，我们需要下发当前方案中所有的轮灌组配置，因为后端通常是全量覆盖
    const finalConfig = wateringGroups.value.map(group => {
        if (!group || !group.name) {
            return null
        }

        const configKey = group.configKey || group.name
        // 使用变更后的配置，如果没有变更则使用当前配置
        const config = changedFertConfigs.value[configKey] || fertConfigs.value[configKey]
        if (!config) {
            return null
        }
        
        // 使用变更后的面积，如果没有变更则使用当前面积
        const area = changedAreas.value[configKey] !== undefined ? changedAreas.value[configKey] : group.area
        
        // 如果选择"只浇水"，设置特殊标记
        let AB_fert = config.AB_fert || 0;
        if (config.method === 'Total') {
            AB_fert = config.total_fert / area;
        }
        // "只浇水"模式下，施肥量设为0
        if (config.method === 'WaterOnly') {
            AB_fert = 0;
        }
        // 只浇水模式下，使用总灌溉时间；否则使用三个独立时间参数
        let total_time_minutes = 0;
        let pre_fert_time_hours = 0;
        let fert_time_hours = 0;
        let post_fert_time_hours = 0;

        if (config.method === 'WaterOnly') {
            // 只浇水模式：直接使用总灌溉时间
            total_time_minutes = config.total_time || 0;
        } else {
            // 正常模式：使用三个独立时间参数
            const pre_fert_time_minutes = config.pre_fert_time || 0;
            const fert_time_minutes = config.method === 'Time' ? (config.fert_time || 0) : 0;
            const post_fert_time_minutes = config.post_fert_time || 0;
            pre_fert_time_hours = pre_fert_time_minutes / 60;
            fert_time_hours = fert_time_minutes / 60;
            post_fert_time_hours = post_fert_time_minutes / 60;

            // 调试日志
            console.log(`轮灌组 ${group.name} 的时间参数:`, {
                'config.pre_fert_time': config.pre_fert_time,
                'config.post_fert_time': config.post_fert_time,
                'pre_fert_time_minutes': pre_fert_time_minutes,
                'post_fert_time_minutes': post_fert_time_minutes,
                'pre_fert_time_hours': pre_fert_time_hours,
                'post_fert_time_hours': post_fert_time_hours
            });
        }

        return {
            name: group.name,
            area: area,
            valves: selectedValveDevices.value[group.name] || [],
            method: config.method === 'WaterOnly' ? 'AreaBased' : config.method,
            AB_fert: parseFloat(AB_fert.toFixed(2)),
            total_fert: config.method === 'Total' ? (config.total_fert || 0) : 0,
            fert_time: fert_time_hours,
            pre_fert_time: pre_fert_time_hours,
            post_fert_time: post_fert_time_hours,
            total_time: total_time_minutes,
            water_only: config.method === 'WaterOnly'
        }
    }).filter(Boolean)

    if (finalConfig.length === 0) {
        ElMessage.error('没有有效的轮灌组配置')
        return
    }

    try {
        const farm_name = localStorage.getItem('selectedFarm') || ''
        const token = localStorage.getItem('auth_token')

        if (!farm_name) {
            ElMessage.error('请先选择农场')
            return
        }

        // 确保必要的策略存在
        try {
            await ensureRequiredPolicies(farm_name, token)
        } catch (e) {
            console.error('确保必要策略失败:', e)
            ElMessage.error(e?.err_msg || e?.message || '检查必要策略失败: ' + String(e))
            return
        }

        const resp = await call_remote('/policy/apply_wizard_groups', { 
            groups: finalConfig, 
            farm_name, 
            scheme_id: selectedSchemeId.value,
            scheme_name: schemeName.value.trim()
        }, token)

        if (resp && resp.result) {
            ElMessage.success('轮灌组策略已下发并生效')
            router.push('/center')
        } else {
            const errorMsg = resp?.err_msg || resp?.message || '下发失败，未知错误'
            ElMessage.error(errorMsg)
        }
    } catch (e) {
        console.error('下发异常:', e)
        const errorMsg = e?.err_msg || e?.message || e?.toString() || '下发失败，未知错误'
        ElMessage.error(errorMsg)
    }
}

// 确保必要的策略存在
const ensureRequiredPolicies = async (farm_name, token) => {
    if (!farm_name) {
        throw new Error('请先选择农场')
    }

    try {
        // 检查并创建必要的策略
        const requiredPolicies = [
            { name: `${farm_name}-供水`, type: '供水策略' },
            { name: `${farm_name}-总策略`, type: '总策略' }
        ]

        const policyList = await call_remote('/policy/list_policy', { pageNo: 0, farm_name: farm_name }, token)
        const existingPolicies = policyList?.policies || []
        const existingPolicyNames = new Set(existingPolicies.map(p => p.name))

        // 检查并创建供水策略
        const waterPolicyName = `${farm_name}-供水`
        if (!existingPolicyNames.has(waterPolicyName)) {
            const requiredDevices = [
                `${farm_name}-主泵`,
                `${farm_name}-主管道压力计`,
                `${farm_name}-主管道流量计`
            ]

            try {
                const deviceList = await call_remote('/device_management/list_device', {
                    farm_name: farm_name,
                    pageNo: 0
                }, token)
                const existingDevices = deviceList?.devices || []
                const existingDeviceNames = new Set(existingDevices.map(d => d.device_name))

                const missingDevices = requiredDevices.filter(name => !existingDeviceNames.has(name))
                if (missingDevices.length > 0) {
                    throw new Error(`缺少必要设备：${missingDevices.join('、')}。请先配置这些设备，设备名称格式必须为"${farm_name}-设备名"`)
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
            } catch (e) {
                if (e?.err_msg && e.err_msg.includes('缺少必要设备')) {
                    throw new Error(e.err_msg + `。请先配置以下设备（设备名称格式必须为"${farm_name}-设备名"）：\n1. ${farm_name}-主泵\n2. ${farm_name}-主管道压力计\n3. ${farm_name}-主管道流量计`)
                }
                throw e
            }
        }

        // 检查并创建总策略
        const globalPolicyName = `${farm_name}-总策略`
        if (!existingPolicyNames.has(globalPolicyName)) {
            try {
                await call_remote('/config/init_global_policy', {
                    farm_name: farm_name,
                    start_hour: 8
                }, token)
            } catch (e) {
                throw e
            }
        }

        // 检查并创建施肥策略（可选，但建议创建）
        const fertPolicyName = `${farm_name}-施肥`
        if (!existingPolicyNames.has(fertPolicyName)) {
            const requiredFertDevices = [
                `${farm_name}-施肥泵`,
                `${farm_name}-施肥流量计`,
                `${farm_name}-施肥液位计`
            ]

            try {
                const deviceList = await call_remote('/device_management/list_device', {
                    farm_name: farm_name,
                    pageNo: 0
                }, token)
                const existingDevices = deviceList?.devices || []
                const existingDeviceNames = new Set(existingDevices.map(d => d.device_name))

                const missingDevices = requiredFertDevices.filter(name => !existingDeviceNames.has(name))
                if (missingDevices.length > 0) {
                    throw new Error(`缺少必要设备：${missingDevices.join('、')}。请先配置这些设备，设备名称格式必须为"${farm_name}-设备名"`)
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
                if (e?.err_msg && e.err_msg.includes('缺少必要设备')) {
                    throw new Error(e.err_msg + `。请先配置以下设备（设备名称格式必须为"${farm_name}-设备名"）：\n1. ${farm_name}-施肥泵\n2. ${farm_name}-施肥流量计\n3. ${farm_name}-施肥液位计`)
                }
                throw e
            }
        }
    } catch (e) {
        if (e?.err_msg && e.err_msg.includes('缺少必要设备')) {
            throw e
        }
        throw e
    }
}

// 取消
const handleCancel = async () => {
    try {
        await ElMessageBox.confirm(
            '确定要取消吗？未保存的配置将丢失。',
            '确认取消',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )
        router.push('/center')
    } catch {
        // 用户取消
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

    if (system_flow <= 0 ||
        laying_spacing <= 0 ||
        dripper_spacing <= 0 ||
        dripper_flow <= 0) {
        return 0
    }

    const denominator = (667 / laying_spacing / dripper_spacing) * dripper_flow

    if (denominator === 0 || !isFinite(denominator)) {
        return 0
    }

    const result = (system_flow * 1000 / denominator) * coefficient

    return result > 0 && isFinite(result) ? result : 0
}

// 更新面积参数
const updateAreaParam = async (paramName, value) => {
    const currentFarm = localStorage.getItem('selectedFarm') || '默认农场'
    try {
        const params = { [paramName]: value }
        await call_remote('/resource/set_farm_area_params', {
            farm_name: currentFarm,
            ...params
        })

        farmAreaParams.value[paramName] = value
    } catch (error) {
        console.error('更新参数失败:', error)
        ElMessage.error('更新参数失败')
    }
}

// 初始化
// 加载方案列表
const loadSchemes = async () => {
    try {
        const token = localStorage.getItem('auth_token')
        const response = await policy_lib.list_schemes(token)
        if (response && response.schemes) {
            schemes.value = response.schemes
            // 如果没有选择方案且有方案，默认选择第一个
            if (!selectedSchemeId.value && schemes.value.length > 0) {
                selectedSchemeId.value = schemes.value[0].id
            }
        }
    } catch (error) {
        console.error('加载方案列表失败:', error)
        ElMessage.error('加载方案列表失败')
    }
}

// 显示创建方案对话框
const showCreateSchemeDialog = () => {
    newSchemeName.value = ''
    newSchemeDescription.value = ''
    createSchemeDialogVisible.value = true
}

// 创建方案
const createScheme = async () => {
    if (!newSchemeName.value || !newSchemeName.value.trim()) {
        ElMessage.warning('请输入方案名称')
        return
    }

    try {
        const token = localStorage.getItem('auth_token')
        const response = await policy_lib.add_scheme(newSchemeName.value.trim(), newSchemeDescription.value.trim(), token)
        if (response && response.result) {
            ElMessage.success('方案创建成功')
            createSchemeDialogVisible.value = false
            await loadSchemes()
            // 选择新创建的方案
            if (response.scheme_id) {
                selectedSchemeId.value = response.scheme_id
            }
        }
    } catch (error) {
        console.error('创建方案失败:', error)
        ElMessage.error(error.err_msg || '创建方案失败')
    }
}

// 辅助函数：加载方案数据
const loadSchemeData = async (schemeNameParam) => {
        const targetScheme = schemes.value.find(s => s.name === schemeNameParam)
    if (!targetScheme) return
        
            selectedSchemeId.value = targetScheme.id
            schemeName.value = schemeNameParam
            
            try {
                const token = localStorage.getItem('auth_token')
                const response = await call_remote('/policy/get_scheme_content', { scheme_name: schemeNameParam }, token)
                
                if (response && response.content) {
                    const parsedGroups = parseGroupsFromSchemeContent(response.content)
                    
                    // 彻底清空，防止被运行时数据污染
                    wateringGroups.value = []
                    fertConfigs.value = {}
                    selectedValveDevices.value = {}
                    
                    // 填充方案数据
                    parsedGroups.forEach(group => {
                        const groupName = group.name
                        wateringGroups.value.push({
                            name: groupName,
                            area: group.area || 0,
                            isCopied: false,
                            configKey: groupName
                        })
                        fertConfigs.value[groupName] = group.fertConfig
                        selectedValveDevices.value[groupName] = group.valves || []
                    })
                    
                    wizardStep.value = 2
                    saveInitialFertConfigs()
                    ElMessage.success(`已加载方案 "${schemeNameParam}" 的配置`)
                }
            } catch (error) {
                console.error('解析方案内容失败:', error)
                ElMessage.error('加载方案内容失败')
            }
    }

// 辅助函数：加载农场参数
const loadFarmParams = async () => {
    try {
        const currentFarm = localStorage.getItem('selectedFarm') || '默认农场'
        const paramsResponse = await call_remote('/resource/get_farm_area_params', {
            farm_name: currentFarm
        })
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

onMounted(async () => {
    // 1. 先加载基础元数据
    await loadSchemes()
    await loadValveDevices()

    // 2. 根据进入方式加载数据
    if (route.query.scheme_name) {
        await loadSchemeData(route.query.scheme_name)
    } else {
        await loadExistingGroups()
    }

    // 3. 加载农场参数
    await loadFarmParams()
})
</script>

<style scoped>
.policy-wizard-page {
    padding: 0;
    background-color: #f5f5f5;
    min-height: 100vh;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    /* 隐藏滚动条 */
    scrollbar-width: none;
    /* Firefox */
    -ms-overflow-style: none;
    /* IE and Edge */
}

.policy-wizard-page::-webkit-scrollbar {
    display: none;
    /* Chrome, Safari, Opera */
}

.wizard-card {
    width: 100%;
    height: 100%;
    margin: 0;
    display: flex;
    flex-direction: column;
    border-radius: 0;
}

.wizard-card :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.header-icon {
    font-size: 24px;
    color: #409EFF;
}

.title {
    font-size: 20px;
    font-weight: 600;
    color: #303133;
}

.policy-wizard {
    padding: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.wizard-steps {
    margin-bottom: 40px;
}

.wizard-step-content {
    margin: 30px 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
}

.fert-config {
    flex: 1;
    overflow-y: auto;
    padding-right: 10px;
    max-height: calc(100vh - 400px);
}

.group-fert-config {
    margin-bottom: 24px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
}

.scheme-selection {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 20px;
}

.scheme-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    font-size: 16px;
    font-weight: 600;
}

.scheme-list {
    max-height: 400px;
    overflow-y: auto;
}

.scheme-radio-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.scheme-radio-item {
    width: 100%;
    margin: 0;
    padding: 12px;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    transition: all 0.3s;
}

.scheme-radio-item:hover {
    border-color: #409eff;
    background-color: #f0f9ff;
}

.scheme-item-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.scheme-name {
    font-size: 15px;
    font-weight: 500;
    color: #303133;
}

.scheme-description {
    font-size: 13px;
    color: #909399;
}

.no-schemes {
    padding: 40px 0;
    text-align: center;
}




.watering-groups-config {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 20px;
}

.groups-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    font-weight: 600;
    color: #303133;
}

.header-buttons {
    display: flex;
    gap: 8px;
}

.existing-groups-section {
    margin-bottom: 20px;
    padding: 16px;
    background: linear-gradient(135deg, #e3f2fd 0%, #f5f7fa 100%);
    border-radius: 8px;
    border: 1px solid #b3d8ff;
}

.existing-groups-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-weight: 600;
    color: #303133;
    font-size: 14px;
}

.groups-count {
    color: #409eff;
    font-size: 12px;
    font-weight: 500;
}

.existing-groups-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.existing-group-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.existing-group-btn {
    transition: all 0.3s ease;
}

.existing-group-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.group-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: white;
}

.group-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 6px;
    margin-bottom: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.group-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.unit {
    color: #909399;
    font-size: 14px;
}

.device-allocation {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
}

.group-switcher {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
}

.group-counter {
    font-size: 16px;
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
    overflow: hidden;
    min-height: 0;
}

.group-device-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.group-device-header h4 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
}

.valve-selection-list-container {
    background: white;
    border-radius: 8px;
    padding: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
}

.valve-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.info-text {
    color: #606266;
    font-size: 14px;
}

.list-actions {
    display: flex;
    gap: 8px;
}

.valve-list-content {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    /* 隐藏滚动条 */
    scrollbar-width: none;
    /* Firefox */
    -ms-overflow-style: none;
    /* IE and Edge */
}

.valve-list-content::-webkit-scrollbar {
    display: none;
    /* Chrome, Safari, Opera */
}

.valve-checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.valve-list-item {
    padding: 12px;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    transition: all 0.2s;
}

.valve-list-item:hover {
    border-color: #409EFF;
    background-color: #f0f9ff;
}

.valve-list-item.selected {
    border-color: #409EFF;
    background-color: #ecf5ff;
}

.valve-item-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.valve-item-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.valve-name {
    font-weight: 600;
    color: #303133;
}

.valve-label {
    font-size: 12px;
    color: #909399;
}

.valve-item-meta {
    display: flex;
    align-items: center;
    gap: 8px;
}

.no-devices-warning {
    margin-top: 16px;
}

.fert-method {
    margin-bottom: 20px;
}

.fert-method label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #606266;
}

.fert-params,
.time-params {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 16px;
}

.param-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.param-item label {
    font-weight: 500;
    color: #606266;
    min-width: 100px;
}

.param-unit {
    color: #909399;
    min-width: 70px;
    font-size: 13px;
    text-align: left;
}

.wizard-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #e4e7ed;
}

.view-group-btn {
    margin-left: 8px;
}

.recommended-area {
    margin-left: 10px;
    padding: 4px 8px;
    background: #f0f9ff;
    border: 1px solid #b3d8ff;
    border-radius: 4px;
    font-size: 12px;
    color: #409eff;
    cursor: pointer;
    transition: all 0.2s;
}

.recommended-area.has-recommendation {
    background: #e6f7ff;
    border-color: #409eff;
    color: #1890ff;
}

.recommended-area:hover {
    background: #bae7ff;
    border-color: #1890ff;
}

/* Popover样式 */
:deep(.group-detail-popover) {
    max-height: 600px;
    overflow-y: auto;
    padding: 0;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    /* 隐藏滚动条 */
    scrollbar-width: none;
    /* Firefox */
    -ms-overflow-style: none;
    /* IE and Edge */
}

:deep(.group-detail-popover)::-webkit-scrollbar {
    display: none;
    /* Chrome, Safari, Opera */
}

.group-detail-popover-content {
    padding: 0;
    background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%);
}

.group-detail-popover-content>.detail-section:first-of-type {
    margin-top: 0;
}

.popover-header {
    margin-bottom: 20px;
    padding: 20px 24px 16px;
    background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
    border-radius: 12px 12px 0 0;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.popover-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    letter-spacing: 0.5px;
}

.detail-section {
    margin-bottom: 24px;
    padding: 16px 20px;
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.3s ease;
}

.detail-section:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
}

.detail-section:last-child {
    margin-bottom: 0;
}

.section-title {
    margin: 0 0 16px 0;
    font-size: 15px;
    font-weight: 700;
    color: #303133;
    padding-bottom: 10px;
    border-bottom: 2px solid #409eff;
    display: flex;
    align-items: center;
}

.section-title::before {
    content: '';
    width: 4px;
    height: 16px;
    background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
    border-radius: 2px;
    margin-right: 8px;
}

.detail-row {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    padding: 10px 12px;
    background: #f8f9fa;
    border-radius: 6px;
    font-size: 14px;
    transition: all 0.2s ease;
}

.detail-row:hover {
    background: #f0f9ff;
    transform: translateX(2px);
    box-shadow: 0 2px 4px rgba(64, 158, 255, 0.1);
}

.detail-row:last-child {
    margin-bottom: 0;
}

.detail-label {
    min-width: 120px;
    color: #606266;
    font-weight: 600;
    flex-shrink: 0;
    display: flex;
    align-items: center;
}

.detail-value {
    color: #303133;
    flex: 1;
    font-weight: 500;
    text-align: right;
    padding-left: 12px;
}

.valves-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 16px;
    padding: 12px;
    background: linear-gradient(135deg, #ecf5ff 0%, #f0f9ff 100%);
    border-radius: 8px;
    border: 1px solid #b3d8ff;
}

.valve-tag {
    margin: 0;
    padding: 6px 14px;
    font-size: 13px;
    font-weight: 600;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
    transition: all 0.2s ease;
}

.valve-tag:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3);
}

.no-data {
    color: #909399;
    font-style: italic;
    font-size: 14px;
    padding: 12px;
    text-align: center;
    background: #f5f7fa;
    border-radius: 6px;
    border: 1px dashed #d3d4d6;
    margin-bottom: 12px;
}

/* 面积参数Popover样式 */
:deep(.area-params-popover) {
    max-width: 400px;
}

.area-params-content {
    padding: 0;
}

.params-header {
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e4e7ed;
}

.params-header h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
}

.params-formula {
    margin-bottom: 16px;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 4px;
}

.params-formula p {
    margin: 4px 0;
    font-size: 12px;
    color: #606266;
}

.formula-text {
    font-family: 'Monaco', 'Menlo', monospace;
    color: #409eff;
    font-weight: 500;
}

.params-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
}

.params-list .param-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.param-label {
    font-size: 13px;
    color: #606266;
    font-weight: 500;
    min-width: 80px;
}

.params-result {
    padding-top: 12px;
    border-top: 1px solid #e4e7ed;
    text-align: center;
}

.params-result p {
    margin: 0;
    font-size: 14px;
    color: #303133;
}

.params-result strong {
    color: #409eff;
    font-size: 16px;
}

/* 地图显示相关样式 */
.display-mode-tabs {
    margin-right: 12px;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.valve-selection-map-container {
    margin-top: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 800px;
}

.valve-selection-map {
    width: 100%;
    flex: 1;
    min-height: 750px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e4e7ed;
}

.selected-valves-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 6px;
}

/* 设备标记样式 */
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
}

:deep(.device-marker:hover) {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    border-color: #409eff;
}

:deep(.device-marker.selected),
:deep(.device-marker.valve-selected) {
    background: rgba(64, 158, 255, 0.9);
    border-color: #409eff;
    box-shadow: 0 4px 16px rgba(64, 158, 255, 0.4);
}

:deep(.device-marker .marker-icon) {
    width: 32px;
    height: 32px;
    margin-right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}

:deep(.device-marker .marker-icon img) {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

:deep(.device-marker .marker-name) {
    font-size: 12px;
    font-weight: 600;
    color: #303133;
    white-space: nowrap;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
}

:deep(.device-marker.selected .marker-name),
:deep(.device-marker.valve-selected .marker-name) {
    color: #ffffff;
}

/* 全屏地图样式 */
.fullscreen-map-dialog :deep(.el-dialog__body) {
    padding: 0;
}

.fullscreen-map-container {
    position: relative;
    width: 100%;
    height: 85vh;
}

.fullscreen-valve-map {
    width: 100%;
    height: 100%;
}

.fullscreen-map-info {
    position: absolute;
    top: 16px;
    left: 16px;
    background: rgba(255, 255, 255, 0.95);
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    gap: 24px;
    font-size: 14px;
    color: #303133;
    z-index: 1000;
}

.fullscreen-map-info span {
    font-weight: 500;
}
</style>
