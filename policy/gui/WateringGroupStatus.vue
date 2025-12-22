<template>
    <div class="watering-group-status">
        <div class="header-section">
            <h3 class="section-title">
                <el-icon>
                    <DataLine />
                </el-icon>
                轮灌组运行状态
            </h3>
            <UnifiedButton variant="refresh" size="small" :icon="Refresh" @click="refresh">
                刷新
            </UnifiedButton>
        </div>

        <div class="watering-groups-table">
            <el-table :data="irrigationGroups" border :loading="loading" empty-text="暂无轮灌组数据"
                :row-class-name="tableRowClassName">
                <el-table-column prop="name" label="轮灌组" width="220" align="left">
                    <template #default="{ row }">
                        <div class="group-name-with-button">
                            <span class="group-name" :title="row.name">{{ row.name }}</span>
                            <!-- 只浇水模式：仅作状态展示，不再提供点击切换 -->
                            <el-tag v-if="waterOnlyMode[row.name]" type="success" size="small"
                                class="water-only-tag-inline">
                                只浇水
                            </el-tag>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="area" label="面积/亩" width="100" align="center" />
                <el-table-column prop="method" label="灌溉方式" width="100" align="center" />
                <el-table-column prop="fert_rate" label="施肥率(L/亩)" width="120" align="center" />
                <el-table-column prop="total_water" label="总用水量(L)" width="120" align="center" />
                <el-table-column prop="total_fert" label="总施肥量(L)" width="120" align="center" />
                <el-table-column prop="minute_left" label="剩余时间(分)" width="120" align="center" />

                <el-table-column prop="cur_state" label="当前状态" width="120" align="center">
                    <template #default="{ row }">
                        <el-tag :type="getStatusTagType(row.cur_state)" size="default" effect="dark" round>
                            {{ row.cur_state || '未知' }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column prop="valves" label="阀门" width="240" align="left">
                    <template #default="{ row }">
                        <template v-if="row.valves && row.valves !== '-'">
                            <el-tag v-for="(valve, idx) in parseValves(row.valves)" :key="idx" size="small"
                                style="margin-right:4px; margin-bottom:2px;">
                                {{ valve }}
                            </el-tag>
                        </template>
                        <span v-else>-</span>
                    </template>
                </el-table-column>

                <el-table-column label="操作" width="200" align="center" fixed="right">
                    <template #default="{ row }">
                        <div class="action-buttons">
                            <div class="action-buttons-row">
                                <UnifiedButton size="small" variant="success" @click="handleQuickAction(row.name, '启动')"
                                    :loading="quickActionLoading[`${row.name}-启动`]">
                                    启动
                                </UnifiedButton>
                                <UnifiedButton size="small" variant="warning" @click="handleQuickAction(row.name, '跳过')"
                                    :loading="quickActionLoading[`${row.name}-跳过`]">
                                    跳过
                                </UnifiedButton>
                            </div>
                            <UnifiedButton size="small" variant="danger" @click="handleQuickAction(row.name, '停止')"
                                :loading="quickActionLoading[`${row.name}-停止`]" class="stop-button">
                                停止
                            </UnifiedButton>
                        </div>
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, inject, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { DataLine, Refresh } from '@element-plus/icons-vue'
import UnifiedButton from '../../public/gui/src/components/UnifiedButton.vue'
import call_remote from '../../public/lib/call_remote.js'

// 接收父组件传递的农场参数
const props = defineProps({
    farmName: {
        type: String,
        default: null
    }
})

// 从 MainLayout 获取当前选择的方案
const injectedSelectedSchemeId = inject('selectedSchemeId', ref(''))
const injectedCurrentSchemeName = inject('currentSchemeName', ref(''))

// 当前方案中的轮灌组列表
const schemeWateringGroups = ref([])

// 响应式数据
const irrigationGroups = ref([])
const loading = ref(false)
const quickActionLoading = ref({})
const waterOnlyMode = ref({}) // 跟踪每个轮灌组的"只浇水"状态（只读展示）
const schemes = ref([]) // 方案列表
const selectedSchemeId = computed(() => injectedSelectedSchemeId.value || '')
const restoreLoading = ref(false) // 恢复方案加载状态
const startLoading = ref(false) // 启动加载状态
const stopLoading = ref(false) // 停止加载状态

// 解析方案文件内容，提取轮灌组信息
const parseWateringGroups = (content) => {
    const groups = new Set()
    // 查找 "所有轮灌组" 的初始化，支持多种格式
    // 格式1: init assignment 'false' '所有轮灌组' '["轮灌组1"]'
    // 格式2: init assignment 'false' '所有轮灌组' '["轮灌组1", "轮灌组2"]'
    // 使用 [^\]]+ 避免回溯，限制匹配到第一个 ] 为止
    const allGroupsMatch = content.match(/所有轮灌组[^[]*\[([^\]]+)\]/)
    if (allGroupsMatch) {
        const groupsStr = allGroupsMatch[1]
        // 匹配引号内的字符串
        const groupNames = groupsStr.match(/"([^"]+)"/g)
        if (groupNames) {
            groupNames.forEach(name => {
                const cleanName = name.replace(/"/g, '')
                if (cleanName) {
                    groups.add(cleanName)
                }
            })
        }
    }
    // 如果没有找到，查找所有 policy '轮灌组X' 的定义
    if (groups.size === 0) {
        const policyMatches = content.matchAll(/policy\s+'([^']+)'/g)
        for (const match of policyMatches) {
            const policyName = match[1]
            if (policyName.includes('轮灌组') || policyName.includes('组')) {
                groups.add(policyName)
            }
        }
    }
    return Array.from(groups).sort()
}

// 加载当前方案中的轮灌组列表
const loadSchemeWateringGroups = async () => {
    if (!selectedSchemeId.value) {
        schemeWateringGroups.value = []
        return
    }

    try {
        const response = await call_remote('/policy/get_scheme_content', {
            scheme_name: selectedSchemeId.value
        })
        if (response && response.content) {
            schemeWateringGroups.value = parseWateringGroups(response.content)
        } else {
            schemeWateringGroups.value = []
        }
    } catch (error) {
        schemeWateringGroups.value = []
    }
}

// 加载方案列表
const loadSchemes = async () => {
    try {
        const response = await call_remote('/policy/list_schemes', {})
        if (response && response.schemes) {
            schemes.value = response.schemes
        }
    } catch (error) {
        // 加载方案列表失败
    }
}

// 处理方案切换
const handleSchemeChange = () => {
    loadWateringGroups()
}

// 恢复方案配置
const handleRestoreScheme = async () => {
    if (!selectedSchemeId.value) return

    restoreLoading.value = true
    try {
        await call_remote('/policy/restore_scheme', { scheme_id: selectedSchemeId.value })
        ElMessage.success(`已加载方案: ${selectedSchemeId.value}`)
        loadWateringGroups()
    } catch (error) {
        ElMessage.error(error.err_msg || '加载方案失败')
    } finally {
        restoreLoading.value = false
    }
}

// 启动方案（设置总策略的"需要启动"变量为true）
const handleStartScheme = async () => {
    if (!selectedSchemeId.value) return

    startLoading.value = true
    try {
        // 设置总策略的"需要启动"变量为true
        const totalPolicyName = `${selectedSchemeId.value}-总策略`
        await call_remote('/policy/set_vars', {
            policy_name: totalPolicyName,
            vars: { '需要启动': 'true' }
        })
        ElMessage.success(`方案 ${selectedSchemeId.value} 已启动`)
        loadWateringGroups()
    } catch (error) {
        ElMessage.error(error.err_msg || '启动方案失败')
    } finally {
        startLoading.value = false
    }
}

// 停止方案
const handleStopScheme = async () => {
    if (!selectedSchemeId.value) return

    stopLoading.value = true
    try {
        // 设置总策略的"需要启动"变量为false
        const totalPolicyName = `${selectedSchemeId.value}-总策略`
        await call_remote('/policy/set_vars', {
            policy_name: totalPolicyName,
            vars: { '需要启动': 'false' }
        })
        ElMessage.success(`方案 ${selectedSchemeId.value} 已停止`)
        loadWateringGroups()
    } catch (error) {
        ElMessage.error(error.err_msg || '停止方案失败')
    } finally {
        stopLoading.value = false
    }
}

// 辅助函数：按方案过滤轮灌组
const filterGroupsByScheme = (groups, responseGroups) => {
    if (!selectedSchemeId.value || schemeWateringGroups.value.length === 0) {
        return groups
    }

    const schemeGroupNames = new Set(schemeWateringGroups.value)
    const filtered = groups.filter(group => schemeGroupNames.has(group.name))

    if (filtered.length === 0 && responseGroups.length > 0) {
        console.warn(`方案 ${selectedSchemeId.value} 中的轮灌组名称与API返回的不匹配，使用API返回的数据`)
        return responseGroups
    }

    return filtered
}

// 辅助函数：按农场过滤轮灌组
const filterGroupsByFarm = async (groups, responseGroups) => {
    if (!props.farmName) {
        return groups
    }

    const policyFarmMatches = await Promise.all(
        groups.map(async (group) => {
            try {
                const farmMatch = await call_remote('/policy/get_matched_farm', {
                    policy_name: group.name
                })
                return { group, farmName: farmMatch.farm_name }
            } catch (error) {
                return { group, farmName: null }
            }
        })
    )

    let filtered = policyFarmMatches
        .filter(item => item.farmName === props.farmName)
        .map(item => item.group)

    if (filtered.length === 0) {
        filtered = responseGroups
        if (selectedSchemeId.value && schemeWateringGroups.value.length > 0) {
            filtered = filtered.filter(group =>
                schemeWateringGroups.value.includes(group.name)
            )
        }
    }

    return filtered
}

// 辅助函数：转换轮灌组数据格式
const transformGroups = (groups) => {
    return groups.map(group => ({
        name: group.name || '未命名',
        area: group.area ?? '-',
        method: group.method || '-',
        fert_rate: group.fert_rate ?? '-',
        total_water: group.total_water ?? '-',
        total_fert: group.total_fert ?? '-',
        minute_left: group.minute_left ?? '-',
        cur_state: group.cur_state || '未知',
        valves: group.valves || '-'
    }))
}

// 加载轮灌组数据
const loadWateringGroups = async () => {
    loading.value = true
    try {
        if (selectedSchemeId.value) {
            await loadSchemeWateringGroups()
        } else {
            schemeWateringGroups.value = []
        }

        const params = { pageNo: 0 }
        if (selectedSchemeId.value) {
            params.scheme_id = selectedSchemeId.value
        }

        const response = await call_remote('/policy/list_watering_groups', params)

        if (!response?.groups) {
            irrigationGroups.value = []
            return
        }

        let filteredGroups = response.groups
        filteredGroups = filterGroupsByScheme(filteredGroups, response.groups)
        filteredGroups = await filterGroupsByFarm(filteredGroups, response.groups)

            if (filteredGroups.length === 0 && selectedSchemeId.value && schemeWateringGroups.value.length > 0) {
                ElMessage.warning({
                    message: `方案"${selectedSchemeId.value}"中包含 ${schemeWateringGroups.value.length} 个轮灌组，但当前没有加载的轮灌组数据。请先应用方案。`,
                    duration: 5000
                })
            }

        irrigationGroups.value = transformGroups(filteredGroups)
            await loadWaterOnlyStates()
    } catch (error) {
        ElMessage.error('加载轮灌组数据失败')
        irrigationGroups.value = []
    } finally {
        loading.value = false
    }
}

const tableRowClassName = ({ row }) => {
    // 统一清洗状态，去除首尾空格，避免因空格/大小写导致样式不一致
    const statusRaw = row.cur_state || row.status || ''
    const status = statusRaw.toString().trim()
    const statusLower = status.toLowerCase()

    // 运行中：绿色
    if (
        statusLower.includes('执行中') ||
        statusLower.includes('灌溉中') ||
        statusLower.includes('运行中') ||
        statusLower.includes('running') ||
        statusLower.includes('working')
    ) {
        return 'running-row'
    }

    // 完成/结束：深绿
    if (
        statusLower.includes('完成') ||
        statusLower.includes('结束') ||
        statusLower.includes('done') ||
        statusLower.includes('finished') ||
        statusLower.includes('执行完成')
    ) {
        return 'completed-row'
    }

    // 排队/待机/准备中：与空闲同色（灰色），避免出现中间行不同色
    if (
        statusLower.includes('排队') ||
        statusLower.includes('等待') ||
        statusLower.includes('待机') ||
        statusLower.includes('准备') ||
        statusLower.includes('queued') ||
        statusLower.includes('waiting') ||
        statusLower.includes('ready')
    ) {
        return 'idle-row'
    }

    // 暂停/异常/故障：红色
    if (
        statusLower.includes('暂停') ||
        statusLower.includes('异常') ||
        statusLower.includes('故障') ||
        statusLower.includes('error') ||
        statusLower.includes('failed') ||
        statusLower.includes('中断') ||
        statusLower.includes('停止')
    ) {
        return 'paused-row'
    }

    // 空闲或未知：灰色
    if (statusLower.includes('空闲') || statusLower.includes('idle') || status === '未知' || status === '') {
        return 'idle-row'
    }

    // 其他状态：蓝色
    return 'active-row'
}

// Element Plus标签类型
const getStatusTagType = (status) => {
    switch (status) {
        case '执行中':
        case '灌溉中':
            return 'success'  // 绿色
        case '执行完成':
            return 'primary'  // 蓝色
        case '排队中':
        case '待机状态':
            return 'warning'  // 橙色
        case '暂停':
            return 'danger'   // 红色
        default:
            return 'info'     // 灰色
    }
}

// 解析阀门字符串：将 "阀门1" "阀门2" 格式转换为数组
const parseValves = (valveStr) => {
    if (!valveStr || valveStr === '-' || typeof valveStr !== 'string') {
        return []
    }
    // 匹配所有引号内的字符串
    const matches = valveStr.match(/"([^"]+)"/g)
    if (matches) {
        return matches.map(m => m.slice(1, -1)) // 移除引号
    }
    // 如果没有引号，尝试按空格分割（兼容旧格式）
    return valveStr.split(/\s+/).filter(v => v && v.trim())
}

// 监听农场参数变化
watch(() => props.farmName, (newFarmName) => {
    if (newFarmName) {
        // 农场切换时重新加载轮灌组数据
        loadWateringGroups()
    }
}, { immediate: false })

// 监听方案变化
watch(selectedSchemeId, (newSchemeId, oldSchemeId) => {
    if (newSchemeId !== oldSchemeId) {
        // 方案切换时重新加载轮灌组数据
        loadWateringGroups()
    }
}, { immediate: false })

// 刷新数据
const refresh = () => {
    loadWateringGroups()
}

// 处理快速操作
const handleQuickAction = async (policyName, actionName) => {
    const loadingKey = `${policyName}-${actionName}`
    try {
        quickActionLoading.value[loadingKey] = true
        const result = await call_remote('/policy/do_quick_action', {
            policy_name: policyName,
            action_name: actionName
        })
        if (result.result) {
            ElMessage.success(`快速操作 ${actionName} 执行成功`)
            // 重新加载轮灌组数据
            await loadWateringGroups()
        }
    } catch (error) {
        ElMessage.error(error.err_msg || `执行快速操作 ${actionName} 失败`)
    } finally {
        quickActionLoading.value[loadingKey] = false
    }
}

// 加载每个轮灌组的"是否浇水"状态
const loadWaterOnlyStates = async () => {
    for (const group of irrigationGroups.value) {
        try {
            const runtimeResult = await call_remote('/policy/get_policy_runtime', {
                policy_name: group.name
            })
            if (runtimeResult && runtimeResult.variables) {
                let variables = {}
                try {
                    variables = JSON.parse(runtimeResult.variables)
                } catch (e) {
                    // 解析变量数据失败
                }
                // 如果"是否只浇水"为true，则"只浇水"按钮应该被选中
                waterOnlyMode.value[group.name] = variables['是否只浇水'] === true
            }
        } catch (error) {
            waterOnlyMode.value[group.name] = false
        }
    }
}

// 暴露数据和方法给父组件
defineExpose({
    irrigationGroups,
    refresh
})

onMounted(async () => {
    await loadSchemes()
    loadWateringGroups()
})
</script>

<style scoped>
.watering-group-status {
    padding: 0;
    /* 在 Tab 中由父容器控制高度，这里占满可用空间即可，保证与“农场地图”和“所有设备”一致 */
    height: 100%;
    display: flex;
    flex-direction: column;
}

.header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
}

.scheme-control {
    display: flex;
    align-items: center;
    gap: 10px;
}

.watering-groups-table {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.watering-groups-table :deep(.el-table) {
    flex: 1;
}

/* 关闭 Element Plus 默认行 hover 亮色背景，避免变白看不清 */
:deep(.el-table__body tr:hover > td) {
    background-color: inherit !important;
    color: inherit !important;
}

/* 表格行样式 - 根据状态显示不同背景颜色 */
/* 空闲状态 - 绿色（与完成状态同色系） */
:deep(.idle-row) {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
    transition: all 0.3s ease;
    border-left: 4px solid #047857;
    color: #ffffff !important;
}

:deep(.idle-row:hover) {
    background: linear-gradient(135deg, #0ea769 0%, #0b8f58 100%) !important;
    box-shadow: 0 3px 8px rgba(4, 120, 87, 0.35);
    transform: translateY(-0.5px);
}

/* 非空闲状态（工作、准备、执行中等）- 深蓝色 */
:deep(.active-row) {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
    color: #ffffff !important;
    transition: all 0.3s ease;
    border-left: 4px solid #1d4ed8;
}

:deep(.active-row:hover) {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
    transform: translateY(-1px);
}

/* 运行过（已完成）- 深绿色 */
:deep(.completed-row) {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
    color: #ffffff !important;
    transition: all 0.3s ease;
    border-left: 4px solid #047857;
}

:deep(.completed-row:hover) {
    background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);
    transform: translateY(-1px);
}

/* 确保文字在深色背景上清晰可见 */
:deep(.active-row td),
:deep(.completed-row td) {
    color: #ffffff !important;
}

:deep(.active-row .el-tag),
:deep(.completed-row .el-tag) {
    background-color: rgba(255, 255, 255, 0.2) !important;
    border-color: rgba(255, 255, 255, 0.3) !important;
    color: #ffffff !important;
}

/* 确保条纹表格的斑马纹效果与状态颜色协调 */
:deep(.el-table--striped .idle-row.el-table__row--striped) {
    background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%) !important;
}

:deep(.el-table--striped .idle-row.el-table__row--striped:hover) {
    background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%) !important;
}

:deep(.el-table--striped .active-row.el-table__row--striped) {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
    color: #ffffff !important;
}

:deep(.el-table--striped .active-row.el-table__row--striped:hover) {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
}

:deep(.el-table--striped .completed-row.el-table__row--striped) {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
    color: #ffffff !important;
}

:deep(.el-table--striped .completed-row.el-table__row--striped:hover) {
    background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
}

/* 按钮在深色背景上的样式优化 */
:deep(.active-row .el-button),
:deep(.completed-row .el-button) {
    border-color: rgba(255, 255, 255, 0.5) !important;
}

:deep(.active-row .el-button--success),
:deep(.completed-row .el-button--success) {
    background-color: rgba(16, 185, 129, 0.9) !important;
    border-color: #10b981 !important;
}

:deep(.active-row .el-button--warning),
:deep(.completed-row .el-button--warning) {
    background-color: rgba(245, 158, 11, 0.9) !important;
    border-color: #f59e0b !important;
}

:deep(.active-row .el-button--danger),
:deep(.completed-row .el-button--danger) {
    background-color: rgba(239, 68, 68, 0.9) !important;
    border-color: #ef4444 !important;
}

.action-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
}

.action-buttons-row {
    display: flex;
    gap: 8px;
    width: 100%;
}

.action-buttons-row :deep(.unified-btn) {
    flex: 1;
}

.group-name-with-button {
    display: flex;
    align-items: center;
    gap: 8px;
}

.group-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.water-only-button-inline {
    flex-shrink: 0;
}

.stop-button {
    width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .watering-groups-table {
        overflow-x: auto;
    }
}
</style>
