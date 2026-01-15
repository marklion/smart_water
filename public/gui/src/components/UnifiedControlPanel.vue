<template>
    <div class="unified-control-panel">
        <!-- 紧急控制 -->
        <div class="emergency-section">
            <div class="section-header">
                <el-icon class="section-icon">
                    <Warning />
                </el-icon>
                <span class="section-title">设备控制</span>
            </div>
            <UnifiedButton variant="danger" @click="showEmergencyStopDialog" class="emergency-stop-btn"
                :loading="emergencyStopLoading" :icon="Warning">
                紧急停止
            </UnifiedButton>
        </div>

        <div class="control-divider"></div>

        <!-- 策略控制 -->
        <div class="policy-section">
            <div class="section-header">
                <el-icon class="section-icon">
                    <Monitor />
                </el-icon>
                <span class="section-title">方案控制</span>
            </div>

            <div class="policy-controls">
                <!-- 控制按钮组 -->
                <div class="control-buttons-group">
                    <UnifiedButton variant="success" @click="showPolicyConfigWizard" :icon="Setting">
                        策略程序设定
                    </UnifiedButton>
                    <UnifiedButton variant="info" @click="showSchemeDialog" plain :icon="Setting">
                        查看所有方案
                    </UnifiedButton>
                    <UnifiedButton variant="primary" @click="runSchemeNow" :loading="runNowLoading"
                        :disabled="!selectedSchemeId || isRunning" :icon="VideoPlay">
                        立即运行
                    </UnifiedButton>
                    <UnifiedButton variant="warning" @click="showScheduleDialog" :disabled="!selectedSchemeId || isRunning"
                        :icon="Clock">
                        定时运行
                    </UnifiedButton>
                    <UnifiedButton variant="danger" @click="stopScheme" :loading="stopSchemeLoading"
                        :disabled="!selectedSchemeId" :icon="VideoPause">
                        停止
                    </UnifiedButton>
                </div>
                <!-- 显示定时运行时间 -->
                <div v-if="nextRunTime" class="schedule-time-info">
                    <el-icon class="schedule-icon">
                        <Clock />
                    </el-icon>
                    <span class="schedule-text">定时运行：{{ nextRunTime }}</span>
                    <el-icon class="cancel-icon" @click="cancelScheduledRun">
                        <Close />
                    </el-icon>
                </div>
            </div>
        </div>

        <!-- 紧急停止对话框 -->
        <el-dialog v-model="emergencyStopDialogVisible" title="紧急停止" width="600px" :close-on-click-modal="false"
            :close-on-press-escape="false" append-to-body>
            <div class="emergency-stop-content">
                <div class="emergency-warning">
                    <el-icon size="24" color="#f56c6c">
                        <Warning />
                    </el-icon>
                    <span>请选择需要执行急停的地块：</span>
                </div>

                <el-checkbox-group v-model="selectedBlocks" class="block-selection">
                    <el-checkbox v-for="block in availableBlocks" :key="block.id" :label="block.id"
                        class="block-checkbox">
                        {{ block.name }}
                    </el-checkbox>
                </el-checkbox-group>

                <div class="emergency-actions">
                    <UnifiedButton variant="default" @click="cancelEmergencyStop">
                        取消
                    </UnifiedButton>
                    <UnifiedButton variant="danger" @click="executeEmergencyStop"
                        :loading="emergencyStopLoading">
                        执行急停
                    </UnifiedButton>
                </div>
            </div>
        </el-dialog>

        <!-- 方案选择对话框 -->
        <el-dialog v-model="schemeDialogVisible" title="选择方案" width="520px" append-to-body class="scheme-select-dialog">
            <div class="scheme-dialog-content">
                <div class="scheme-list">
                    <div v-for="scheme in schemeList" :key="scheme.name || scheme.filename" class="scheme-item"
                        :class="{ 'is-selected': String(tempSelectedSchemeId) === String(scheme.name) }"
                        @click="selectSchemeInDialog(scheme.name)">
                        <div class="scheme-item-content">
                            <div class="scheme-main-info">
                                <div class="scheme-info">
                                    <el-icon class="scheme-icon">
                                        <Setting />
                                    </el-icon>
                                    <span class="scheme-name">{{ scheme.name }}</span>
                                </div>
                                <div class="scheme-actions">
                                    <UnifiedButton size="small" variant="primary" plain @click.stop="editSchemeGroups(scheme)"
                                        class="edit-groups-btn" :icon="Edit">
                                        编辑轮灌组
                                    </UnifiedButton>
                                    <el-icon v-if="String(tempSelectedSchemeId) === String(scheme.name)"
                                        class="check-icon">
                                        <CircleCheck />
                                    </el-icon>
                                </div>
                            </div>
                            <div v-if="scheme.wateringGroups && scheme.wateringGroups.length > 0" class="scheme-groups">
                                <span class="groups-label">轮灌组：</span>
                                <div class="groups-tags">
                                    <el-tag v-for="group in scheme.wateringGroups" :key="group" size="small" type="info"
                                        class="group-tag">
                                        {{ group }}
                                    </el-tag>
                                </div>
                            </div>
                            <div v-else-if="scheme.wateringGroupsLoading" class="scheme-groups loading">
                                <span class="groups-label">轮灌组：</span>
                                <span class="loading-text">加载中...</span>
                            </div>
                            <div v-else class="scheme-groups loading">
                                <span class="groups-label">轮灌组：</span>
                                <span class="loading-text">暂无轮灌组</span>
                            </div>
                        </div>
                    </div>
                    <div v-if="schemeList.length === 0" class="empty-schemes">
                        <el-empty description="暂无方案，请先创建方案" :image-size="100" />
                    </div>
                </div>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <UnifiedButton variant="default" @click="schemeDialogVisible = false">
                        取消
                    </UnifiedButton>
                    <UnifiedButton variant="primary" @click="applyScheme" :disabled="!tempSelectedSchemeId"
                        :loading="applySchemeLoading">
                        应用
                    </UnifiedButton>
                </div>
            </template>
        </el-dialog>

        <!-- 定时运行对话框 -->
        <el-dialog v-model="scheduleDialogVisible" title="定时运行设置" width="450px" append-to-body>
            <div class="schedule-form">
                <el-form label-width="100px">
                    <el-form-item label="运行时间">
                        <el-date-picker v-model="scheduledTime" type="datetime" placeholder="选择日期和时间"
                            format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DD HH:mm" style="width: 100%;" />
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <UnifiedButton variant="default" @click="scheduleDialogVisible = false">
                    取消
                </UnifiedButton>
                <UnifiedButton variant="primary" @click="setScheduledRun" :loading="scheduleLoading">
                    确定
                </UnifiedButton>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, inject, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Monitor, VideoPlay, VideoPause, Clock, Setting, Warning, CircleCheck, Edit, Close } from '@element-plus/icons-vue'
import UnifiedButton from './UnifiedButton.vue'
import call_remote from '../../../lib/call_remote.js'

const router = useRouter()

const props = defineProps({
    devices: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits(['openWizard', 'deviceClick'])

// 紧急控制相关
const emergencyStopDialogVisible = ref(false)
const selectedBlocks = ref([])
const availableBlocks = ref([])
const emergencyStopLoading = ref(false)

// 方案相关 - 从 MainLayout 注入，如果没有则使用本地 ref
const injectedCurrentSchemeName = inject('currentSchemeName', null)
const injectedSelectedSchemeId = inject('selectedSchemeId', null)

// 使用注入的 ref 或创建本地的 ref
const currentSchemeName = injectedCurrentSchemeName || ref('')
// 如果注入的 selectedSchemeId 为空，尝试从本地存储恢复
let initialSchemeId = ''
if (injectedSelectedSchemeId) {
    initialSchemeId = injectedSelectedSchemeId.value || ''
} else {
    try {
        initialSchemeId = localStorage.getItem('selectedSchemeId') || ''
    } catch (error) {
        initialSchemeId = ''
    }
}
const selectedSchemeId = injectedSelectedSchemeId || ref(initialSchemeId)

const schemeList = ref([])
const schemeDialogVisible = ref(false)
const tempSelectedSchemeId = ref('') // 临时选中的方案ID（用于对话框）
const applySchemeLoading = ref(false)
const runNowLoading = ref(false)
const stopSchemeLoading = ref(false)
const scheduleDialogVisible = ref(false)
const scheduledTime = ref('')
const scheduleLoading = ref(false)
const isRunning = ref(false) // 方案是否正在运行
const nextRunTime = ref('') // 下次运行时间
let runningStatusTimer = null // 运行状态定时器

// 解析方案文件内容，提取轮灌组信息
const parseWateringGroups = (content) => {
    const groups = new Set()
    // 优先使用 "所有轮灌组" 列表（允许任意命名，不再强制包含“组”字）
    const allGroupsMatch = content.match(/所有轮灌组[^[]*\[([^\]]+)\]/)
    if (allGroupsMatch) {
        const groupsStr = allGroupsMatch[1]
        const groupNames = groupsStr.match(/"([^"]+)"/g)
        if (groupNames) {
            groupNames.forEach(name => {
                const cleanName = name.replace(/"/g, '').trim()
                if (cleanName) groups.add(cleanName)
            })
        }
    }
    // 兜底：从 policy 名称提取，排除明显的非轮灌组策略
    if (groups.size === 0) {
        const policyMatches = content.matchAll(/policy\s+'([^']+)'/g)
        const excludeKeywords = ['总策略', '供水', '施肥', '搅拌']
        for (const match of policyMatches) {
            const policyName = match[1]
            if (!excludeKeywords.some(k => policyName.includes(k))) {
                groups.add(policyName)
            }
        }
    }
    return Array.from(groups).sort()
}

// 从方案内容中解析农场名称
const parseFarmName = (content) => {
    // 查找总策略名称，格式：policy '农场X-总策略'
    const totalPolicyMatch = content.match(/policy\s+'([^']+-总策略)'/)
    if (totalPolicyMatch) {
        const totalPolicyName = totalPolicyMatch[1]
        // 提取农场名称（去掉"-总策略"后缀）
        const farmName = totalPolicyName.replace('-总策略', '')
        return farmName
    }
    // 如果没有找到，尝试从设备配置中查找
    const farmMatch = content.match(/add\s+farm\s+'([^']+)'/)
    if (farmMatch) {
        return farmMatch[1]
    }
    return null
}

// 获取总策略名称并验证存在性
const getTotalPolicyName = async (schemeName) => {
    let totalPolicyName = null

    try {
        // 首先尝试从方案内容中解析
        const response = await call_remote('/policy/get_scheme_content', { scheme_name: schemeName })
        if (response && response.content) {
            const farmName = parseFarmName(response.content)
            if (farmName) {
                totalPolicyName = `${farmName}-总策略`
            }
        }
    } catch (error) {
        console.warn('获取方案内容失败:', error)
    }

    // 如果无法从方案中获取，尝试从设备中获取农场名称
    if (!totalPolicyName && props.devices && props.devices.length > 0) {
        const farmName = props.devices[0].farmName || props.devices[0].farm_name
        if (farmName) {
            totalPolicyName = `${farmName}-总策略`
        }
    }

    // 如果都失败了，抛出错误提示用户
    if (!totalPolicyName) {
        throw { err_msg: '无法确定总策略名称，请确保已选择方案或设备' }
    }

    // 验证策略是否存在（通过尝试获取运行时状态）
    try {
        await call_remote('/policy/get_policy_runtime', {
            policy_name: totalPolicyName
        })
        return totalPolicyName
    } catch (error) {
        // 如果策略不存在，提供更详细的错误信息
        throw {
            err_msg: `总策略 "${totalPolicyName}" 不存在，请先应用方案或确保方案已正确加载`
        }
    }
}

// 检查方案是否正在运行
const checkRunningStatus = async () => {
    if (!selectedSchemeId.value) {
        isRunning.value = false
        nextRunTime.value = ''
        return
    }

    try {
        const totalPolicyName = await getTotalPolicyName(selectedSchemeId.value)
        const runtimeResponse = await call_remote('/policy/get_policy_runtime', {
            policy_name: totalPolicyName
        })

        if (runtimeResponse && runtimeResponse.variables) {
            const variables = JSON.parse(runtimeResponse.variables)
            // 检查"需要启动"变量是否为true
            isRunning.value = variables['需要启动'] === true || variables['需要启动'] === 'true'
            
            // 获取下次启动时间
            const nextStartTime = variables['下次启动时间']
            if (nextStartTime && nextStartTime !== '' && nextStartTime !== '""' && nextStartTime !== 0 && nextStartTime !== '0') {
                // 处理时间戳（数字）或字符串格式
                let date
                if (typeof nextStartTime === 'number' || (typeof nextStartTime === 'string' && /^\d+$/.test(nextStartTime.replace(/"/g, '')))) {
                    const timestamp = typeof nextStartTime === 'number' ? nextStartTime : parseInt(nextStartTime.replace(/"/g, ''))
                    date = new Date(timestamp)
                } else {
                    const timeStr = nextStartTime.replace(/"/g, '')
                    date = new Date(timeStr)
                }
                if (!isNaN(date.getTime())) {
                    nextRunTime.value = date.toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                } else {
                    nextRunTime.value = ''
                }
            } else {
                nextRunTime.value = ''
            }
        } else {
            isRunning.value = false
            nextRunTime.value = ''
        }
    } catch (error) {
        // 如果获取失败，假设未运行
        console.warn('检查运行状态失败:', error)
        isRunning.value = false
        nextRunTime.value = ''
    }
}

// 获取方案详情（包括轮灌组）
const getSchemeDetails = async (schemeName) => {
    try {
        // 尝试通过API获取方案内容
        const response = await call_remote('/policy/get_scheme_content', { scheme_name: schemeName })
        if (response && response.content) {
            return parseWateringGroups(response.content)
        }
    } catch (error) {
        // 如果API不存在，尝试其他方式
        console.warn('获取方案详情失败:', error)
    }
    return []
}

// 从本地存储加载选中的方案
const loadSelectedSchemeFromStorage = () => {
    try {
        const savedSchemeId = localStorage.getItem('selectedSchemeId')
        if (savedSchemeId) {
            return savedSchemeId
        }
    } catch (error) {
        console.warn('从本地存储加载方案失败:', error)
    }
    return null
}

// 保存选中的方案到本地存储
const saveSelectedSchemeToStorage = (schemeId) => {
    try {
        if (schemeId) {
            localStorage.setItem('selectedSchemeId', schemeId)
        } else {
            localStorage.removeItem('selectedSchemeId')
        }
    } catch (error) {
        console.warn('保存方案到本地存储失败:', error)
    }
}

// 辅助函数：恢复保存的方案选择
const restoreSavedScheme = (schemeList) => {
            const savedSchemeId = loadSelectedSchemeFromStorage()
    if (savedSchemeId && schemeList.find(s => s.name === savedSchemeId)) {
                selectedSchemeId.value = savedSchemeId
                currentSchemeName.value = savedSchemeId
        return true
    }
    return false
}

// 辅助函数：设置默认方案
const setDefaultScheme = (schemeList) => {
    if (schemeList.length === 0) return
    
                if (!selectedSchemeId.value) {
        selectedSchemeId.value = schemeList[0].name
        currentSchemeName.value = schemeList[0].name
        saveSelectedSchemeToStorage(schemeList[0].name)
                } else {
        const currentScheme = schemeList.find(s => s.name === selectedSchemeId.value)
                    if (currentScheme) {
                        currentSchemeName.value = currentScheme.name
                        saveSelectedSchemeToStorage(selectedSchemeId.value)
                    } else {
            selectedSchemeId.value = schemeList[0].name
            currentSchemeName.value = schemeList[0].name
            saveSelectedSchemeToStorage(schemeList[0].name)
                    }
                }
            }

// 加载方案列表
const loadSchemeList = async () => {
    try {
        const response = await call_remote('/policy/list_schemes', {})
        if (!response?.schemes) return

        schemeList.value = response.schemes.map(scheme => ({
            ...scheme,
            wateringGroups: [],
            wateringGroupsLoading: false
        }))

        if (!restoreSavedScheme(schemeList.value)) {
            // 若有名为“测试1”的方案，优先默认选择它，避免空方案卡加载
            const testScheme = schemeList.value.find(s => s.name === '测试1')
            if (testScheme) {
                selectedSchemeId.value = testScheme.name
                currentSchemeName.value = testScheme.name
                saveSelectedSchemeToStorage(testScheme.name)
            } else {
                setDefaultScheme(schemeList.value)
            }
        }
    } catch (error) {
        console.error('加载方案列表失败:', error)
    }
}

// 显示方案选择对话框
const showSchemeDialog = async () => {
    // 初始化临时选中值为当前选中的方案
    tempSelectedSchemeId.value = selectedSchemeId.value ? String(selectedSchemeId.value) : ''
    schemeDialogVisible.value = true

    // 每次打开弹窗时都重新加载所有方案的轮灌组信息，确保显示最新数据
    for (const scheme of schemeList.value) {
        scheme.wateringGroupsLoading = true
        try {
            scheme.wateringGroups = await getSchemeDetails(scheme.name)
        } catch (e) {
            console.error(`加载方案 ${scheme.name} 的轮灌组失败:`, e)
            scheme.wateringGroups = []
        } finally {
            scheme.wateringGroupsLoading = false
        }
    }
}

// 在对话框中选择方案（单选）
const selectSchemeInDialog = (schemeId) => {
    if (!schemeId) return
    // 确保只选中一个方案 - 直接赋值，覆盖之前的选择
    tempSelectedSchemeId.value = String(schemeId)
}

// 应用选中的方案
const applyScheme = async () => {
    if (!tempSelectedSchemeId.value) {
        ElMessage.warning('请先选择一个方案')
        return
    }

    applySchemeLoading.value = true
    try {
        // 获取农场名称（用于同步当前方案到后端）
        let farmName = null
        try {
            // 优先从方案内容中解析农场名称
            const response = await call_remote('/policy/get_scheme_content', { scheme_name: tempSelectedSchemeId.value })
            if (response && response.content) {
                farmName = parseFarmName(response.content)
            }
        } catch (e) {
            console.warn('从方案内容解析农场名称失败:', e)
        }
        
        // 如果无法从方案中获取，尝试从设备中获取
        if (!farmName && props.devices && props.devices.length > 0) {
            farmName = props.devices[0].farmName || props.devices[0].farm_name
        }

        // 恢复方案配置
        await call_remote('/policy/restore_scheme', { 
            scheme_id: tempSelectedSchemeId.value,
            farm_name: farmName || undefined
        })

        // 同步当前方案到后端（用于 PC / mobile 跨端同步）
        if (farmName) {
            try {
                await call_remote('/policy/set_current_scheme', {
                    farm_name: farmName,
                    scheme_id: tempSelectedSchemeId.value
                })
            } catch (e) {
                console.warn('同步当前方案到后端失败:', e)
            }
        }

        // 更新当前选中的方案
        selectedSchemeId.value = tempSelectedSchemeId.value
        const selectedScheme = schemeList.value.find(s => s.name === tempSelectedSchemeId.value)
        if (selectedScheme) {
            currentSchemeName.value = selectedScheme.name
        }

        // 保存到本地存储
        saveSelectedSchemeToStorage(tempSelectedSchemeId.value)

        // 检查新方案的运行状态
        await checkRunningStatus()

        ElMessage.success(`已应用方案: ${currentSchemeName.value}`)
        schemeDialogVisible.value = false
    } catch (error) {
        ElMessage.error(error.err_msg || '应用方案失败')
    } finally {
        applySchemeLoading.value = false
    }
}

// 立即运行方案
const runSchemeNow = async () => {
    if (!selectedSchemeId.value || isRunning.value) return

    runNowLoading.value = true
    try {
        // 获取总策略名称
        const totalPolicyName = await getTotalPolicyName(selectedSchemeId.value)
        await call_remote('/policy/runtime_assignment', {
            policy_name: totalPolicyName,
            variable_name: '需要启动',
            expression: 'true',
            is_constant: true
        })
        isRunning.value = true // 设置运行状态
        ElMessage.success(`方案 ${selectedSchemeId.value} 已启动`)
    } catch (error) {
        ElMessage.error(error.err_msg || '启动方案失败')
    } finally {
        runNowLoading.value = false
    }
}

// 停止方案
const stopScheme = async () => {
    if (!selectedSchemeId.value) return

    stopSchemeLoading.value = true
    try {
        // 获取总策略名称
        const totalPolicyName = await getTotalPolicyName(selectedSchemeId.value)
        await call_remote('/policy/runtime_assignment', {
            policy_name: totalPolicyName,
            variable_name: '需要启动',
            expression: 'false',
            is_constant: true
        })
        isRunning.value = false // 清除运行状态
        ElMessage.success(`方案 ${selectedSchemeId.value} 已停止`)
    } catch (error) {
        ElMessage.error(error.err_msg || '停止方案失败')
    } finally {
        stopSchemeLoading.value = false
    }
}

// 显示定时运行对话框
const showScheduleDialog = () => {
    scheduledTime.value = ''
    scheduleDialogVisible.value = true
}

// 设置定时运行
const setScheduledRun = async () => {
    if (!selectedSchemeId.value || !scheduledTime.value) {
        ElMessage.warning('请选择运行时间')
        return
    }

    scheduleLoading.value = true
    try {
        // 将日期时间字符串转换为时间戳（数字）
        const timestamp = new Date(scheduledTime.value).getTime()
        if (isNaN(timestamp)) {
            ElMessage.warning('时间格式错误')
            return
        }
        // 获取总策略名称
        const totalPolicyName = await getTotalPolicyName(selectedSchemeId.value)
        await call_remote('/policy/runtime_assignment', {
            policy_name: totalPolicyName,
            variable_name: '下次启动时间',
            expression: String(timestamp), // 使用时间戳（数字字符串）
            is_constant: true
        })
        ElMessage.success(`已设置定时运行: ${scheduledTime.value}`)
        scheduleDialogVisible.value = false
        // 设置后立即刷新状态
        await checkRunningStatus()
    } catch (error) {
        ElMessage.error(error.err_msg || '设置定时运行失败')
    } finally {
        scheduleLoading.value = false
    }
}

// 撤销定时运行
const cancelScheduledRun = async () => {
    if (!selectedSchemeId.value) {
        return
    }

    try {
        // 获取总策略名称
        const totalPolicyName = await getTotalPolicyName(selectedSchemeId.value)
        await call_remote('/policy/runtime_assignment', {
            policy_name: totalPolicyName,
            variable_name: '下次启动时间',
            expression: '""',
            is_constant: true
        })
        ElMessage.success('已撤销定时运行')
        // 立即刷新状态
        await checkRunningStatus()
    } catch (error) {
        ElMessage.error(error.err_msg || '撤销定时运行失败')
    }
}

// 显示策略配置向导
const showPolicyConfigWizard = () => {
    emit('openWizard')
}

// 编辑方案的轮灌组
const editSchemeGroups = (scheme) => {
    // 关闭方案选择对话框
    schemeDialogVisible.value = false
    // 跳转到策略向导页面，并传递方案名称
    router.push({
        path: '/policy_wizard',
        query: {
            scheme_name: scheme.name
        }
    })
}

// 紧急停止相关
const showEmergencyStopDialog = async () => {
    try {
        await loadAvailableBlocks()
        emergencyStopDialogVisible.value = true
        selectedBlocks.value = []
    } catch (error) {
        console.error('加载地块列表失败:', error)
        ElMessage.error('加载地块列表失败')
    }
}

const loadAvailableBlocks = async () => {
    try {
        const blockSet = new Set()
        props.devices.forEach(device => {
            if (device.blockName || device.block_name) {
                blockSet.add(device.blockName || device.block_name)
            }
        })

        availableBlocks.value = Array.from(blockSet).map(blockName => ({
            id: blockName,
            name: blockName
        }))
    } catch (error) {
        console.error('加载地块列表失败:', error)
        availableBlocks.value = []
    }
}

const cancelEmergencyStop = () => {
    emergencyStopDialogVisible.value = false
    selectedBlocks.value = []
}

const executeEmergencyStop = async () => {
    if (selectedBlocks.value.length === 0) {
        ElMessage.warning('请选择至少一个地块')
        return
    }

    emergencyStopLoading.value = true
    try {
        const currentFarm = props.devices.length > 0 ? (props.devices[0].farmName || props.devices[0].farm_name) : '默认农场'

        const response = await call_remote('/device_management/emergency_stop', {
            farm_name: currentFarm,
            block_names: selectedBlocks.value
        })

        if (response.result) {
            const stoppedCount = response.stopped_devices ? response.stopped_devices.length : 0
            const failedCount = response.failed_devices ? response.failed_devices.length : 0

            if (failedCount === 0) {
                ElMessage.success(`急停操作成功，已停止 ${stoppedCount} 个设备`)
            } else {
                ElMessage.warning(`急停操作部分成功：成功 ${stoppedCount} 个，失败 ${failedCount} 个设备`)
            }

            emergencyStopDialogVisible.value = false
            selectedBlocks.value = []

            emit('deviceClick', null)
        } else {
            ElMessage.error('急停操作执行失败')
        }
    } catch (error) {
        console.error('执行急停失败:', error)
        ElMessage.error(error.err_msg || '执行急停失败')
    } finally {
        emergencyStopLoading.value = false
    }
}

// 启动定时刷新运行状态
const startRunningStatusTimer = () => {
    // 清除已有定时器
    if (runningStatusTimer) {
        clearInterval(runningStatusTimer)
    }
    // 每5秒检查一次运行状态
    runningStatusTimer = setInterval(async () => {
        if (selectedSchemeId.value) {
            await checkRunningStatus()
        }
    }, 5000)
}

// 停止定时刷新运行状态
const stopRunningStatusTimer = () => {
    if (runningStatusTimer) {
        clearInterval(runningStatusTimer)
        runningStatusTimer = null
    }
}

// 监听方案切换，检查运行状态
watch(selectedSchemeId, async (newSchemeId) => {
    if (newSchemeId) {
        await checkRunningStatus()
        // 重新启动定时器
        startRunningStatusTimer()
    } else {
        isRunning.value = false
        stopRunningStatusTimer()
    }
}, { immediate: true })

onMounted(async () => {
    await loadSchemeList()
    // 加载方案列表后检查运行状态
    if (selectedSchemeId.value) {
        await checkRunningStatus()
        // 启动定时刷新
        startRunningStatusTimer()
    }
})

onUnmounted(() => {
    // 组件卸载时清除定时器
    stopRunningStatusTimer()
})
</script>

<style scoped>
.unified-control-panel {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 10000;
    display: flex;
    background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
    border-radius: 16px;
    border: 2px solid rgba(255, 255, 255, 0.8);
    box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.12),
        0 2px 8px rgba(0, 0, 0, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    min-width: 750px;
    max-width: 1000px;
    pointer-events: auto;
}

.unified-control-panel:hover {
    border-color: rgba(64, 158, 255, 0.3);
    box-shadow:
        0 12px 40px rgba(0, 0, 0, 0.15),
        0 4px 12px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.emergency-section {
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 20px;
    flex: 0 0 auto;
    min-width: 160px;
}

.policy-section {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
    position: relative;
    z-index: 10001;
    pointer-events: auto;
    min-width: 0;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
}

.section-icon {
    font-size: 18px;
    color: #409eff;
}

.section-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.control-divider {
    width: 1px;
    background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.08), transparent);
    margin: 16px 8px;
    align-self: stretch;
    flex-shrink: 0;
}

.unified-btn {
    height: 36px;
    font-size: 14px;
    font-weight: 600;
}

.emergency-stop-btn {
    width: auto !important;
    min-width: 120px;
    padding: 0 20px;
    flex-shrink: 0;
}

.policy-controls {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    width: 100%;
    gap: 12px;
}

.schedule-time-info {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%);
    border-radius: 8px;
    border-left: 3px solid #ffc107;
    font-size: 12px;
    color: #856404;
    width: 100%;
}

.schedule-time-info .schedule-icon {
    font-size: 14px;
    color: #ffc107;
    flex-shrink: 0;
}

.schedule-time-info .schedule-text {
    font-weight: 500;
    flex: 1;
}

.schedule-time-info .cancel-icon {
    font-size: 14px;
    color: #909399;
    cursor: pointer;
    flex-shrink: 0;
    padding: 2px;
    border-radius: 4px;
    transition: all 0.2s;
}

.schedule-time-info .cancel-icon:hover {
    color: #f56c6c;
    background: rgba(245, 108, 108, 0.1);
}

.control-buttons-group {
    display: flex;
    flex-direction: row;
    gap: 10px;
    width: auto;
    flex-wrap: wrap;
    align-items: center;
}

.control-buttons-group :deep(.unified-btn) {
    width: auto;
    min-width: 100px;
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0 18px;
}

.schedule-form {
    padding: 10px 0;
}

.scheme-dialog-content {
    padding: 8px 0;
}

.scheme-list {
    max-height: 450px;
    overflow-y: auto;
    padding: 4px 0;
}

.scheme-item {
    padding: 16px 20px;
    margin-bottom: 12px;
    border: 2px solid #e4e7ed;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    user-select: none;
    position: relative;
    z-index: 1;
    pointer-events: auto;
}

.scheme-item:hover {
    border-color: #409eff;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.scheme-item.is-selected {
    border-color: #409eff;
    background: linear-gradient(135deg, #ecf5ff 0%, #d4edff 100%);
    box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
}

.scheme-item-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.scheme-main-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.scheme-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.edit-groups-btn {
    font-size: 12px;
    padding: 4px 12px;
    height: 28px;
}

.scheme-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.scheme-icon {
    font-size: 20px;
    color: #409eff;
}

.scheme-item.is-selected .scheme-icon {
    color: #409eff;
}

.scheme-name {
    font-size: 15px;
    font-weight: 500;
    color: #303133;
    letter-spacing: 0.3px;
}

.scheme-item.is-selected .scheme-name {
    color: #409eff;
    font-weight: 600;
}

.check-icon {
    color: #409eff;
    font-size: 22px;
    font-weight: bold;
}

.scheme-groups {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
    padding-left: 32px;
}

.groups-label {
    font-size: 13px;
    color: #909399;
    font-weight: 500;
    white-space: nowrap;
}

.groups-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    flex: 1;
}

.group-tag {
    margin: 0;
}

.scheme-groups.loading .loading-text {
    font-size: 13px;
    color: #c0c4cc;
    font-style: italic;
}

.empty-schemes {
    padding: 60px 20px;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.emergency-stop-content {
    padding: 10px 0;
}

.emergency-warning {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    font-size: 16px;
    color: #f56c6c;
    font-weight: 600;
}

.block-selection {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 300px;
    overflow-y: auto;
    margin-bottom: 20px;
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
