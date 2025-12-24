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

// 当前方案中的轮灌组列表
const schemeWateringGroups = ref([])

// 响应式数据
const irrigationGroups = ref([])
const loading = ref(false)
const quickActionLoading = ref({})
const waterOnlyMode = ref({}) // 跟踪每个轮灌组的"只浇水"状态（只读展示）
const selectedSchemeId = computed(() => injectedSelectedSchemeId.value || '')

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


// 辅助函数：按方案过滤轮灌组
const filterGroupsByScheme = (groups, responseGroups) => {
    if (!selectedSchemeId.value || schemeWateringGroups.value.length === 0) {
        return groups
    }

    const schemeGroupNames = new Set(schemeWateringGroups.value)
    const filtered = groups.filter(group => schemeGroupNames.has(group.name))

    if (filtered.length === 0 && responseGroups.length > 0) {
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

const inferSchemeIdFromGroups = (groups) => {
    if (!Array.isArray(groups) || groups.length === 0) return null
    const schemeIds = Array.from(new Set(groups.map(g => g.scheme_id).filter(id => id && String(id).trim() !== '')))
    return schemeIds.length === 1 ? String(schemeIds[0]) : null
}

// 加载轮灌组数据
const loadWateringGroups = async () => {
    loading.value = true
    try {
        // 先拉取当前所有轮灌组运行数据（不按方案过滤），用于推断当前已加载的方案
        const response = await call_remote('/policy/list_watering_groups', { pageNo: 0 })

        if (!response?.groups) {
            irrigationGroups.value = []
            schemeWateringGroups.value = []
            return
        }

        const allGroups = response.groups

        // 如果后端已有唯一的 scheme_id，与当前选择不一致，则自动切换到该方案，实现 PC / mobile 互相应用后的同步
        const inferredSchemeId = inferSchemeIdFromGroups(allGroups)
        if (inferredSchemeId && selectedSchemeId.value !== inferredSchemeId) {
            injectedSelectedSchemeId.value = inferredSchemeId
        }

        // 根据（可能更新后的）方案ID加载方案中的轮灌组列表
        if (selectedSchemeId.value) {
            await loadSchemeWateringGroups()
        } else {
            schemeWateringGroups.value = []
        }

        let filteredGroups = allGroups
        filteredGroups = filterGroupsByScheme(filteredGroups, allGroups)
        filteredGroups = await filterGroupsByFarm(filteredGroups, allGroups)

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
    // 统一清洗状态，去除首尾空格
    const statusRaw = row.cur_state || row.status || ''
    const status = statusRaw.toString().trim()
    
    // 根据固定状态返回对应的CSS类名
    if (status === '空闲') {
        return 'status-idle'
    } else if (status === '浇水') {
        return 'status-watering'
    } else if (status === '肥前') {
        return 'status-pre-fert'
    } else if (status === '施肥') {
        return 'status-fertilizing'
    } else if (status === '肥后') {
        return 'status-post-fert'
    } else if (status === '收尾') {
        return 'status-finishing'
    }
    
    // 未知状态默认灰色
    return 'status-idle'
}

// Element Plus标签类型
const getStatusTagType = (status) => {
    if (!status) return 'info'
    const statusTrimmed = status.toString().trim()
    
    switch (statusTrimmed) {
        case '空闲':
            return 'info'      // 灰色
        case '浇水':
            return 'primary'   // 蓝色
        case '肥前':
            return 'warning'   // 橙色
        case '施肥':
            return ''          // 紫色（自定义）
        case '肥后':
            return 'success'   // 绿色
        case '收尾':
            return 'success'   // 绿色
        default:
            return 'info'      // 灰色
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

onMounted(() => {
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

/* 表格行样式 - 根据固定状态显示不同背景颜色 */

/* 1. 空闲状态 - 银灰色渐变（待机状态，科技感） */
:deep(.status-idle) {
    background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%) !important;
    transition: all 0.3s ease;
    border-left: 4px solid #475569;
    color: #ffffff !important;
}

:deep(.status-idle:hover) {
    background: linear-gradient(135deg, #64748b 0%, #475569 100%) !important;
    box-shadow: 0 3px 8px rgba(71, 85, 105, 0.35);
    transform: translateY(-0.5px);
}

/* 2. 浇水状态 - 蓝色/青色渐变（水相关，科技感） */
:deep(.status-watering) {
    background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%) !important;
    color: #ffffff !important;
    transition: all 0.3s ease;
    border-left: 4px solid #0e7490;
}

:deep(.status-watering:hover) {
    background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%) !important;
    box-shadow: 0 4px 12px rgba(8, 145, 178, 0.4);
    transform: translateY(-1px);
}

/* 3. 肥前状态 - 黄色/橙色渐变（准备阶段，科技感） */
:deep(.status-pre-fert) {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
    color: #ffffff !important;
    transition: all 0.3s ease;
    border-left: 4px solid #b45309;
}

:deep(.status-pre-fert:hover) {
    background: linear-gradient(135deg, #d97706 0%, #b45309 100%) !important;
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.4);
    transform: translateY(-1px);
}

/* 4. 施肥状态 - 紫色/粉紫色渐变（施肥阶段，科技感） */
:deep(.status-fertilizing) {
    background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%) !important;
    color: #ffffff !important;
    transition: all 0.3s ease;
    border-left: 4px solid #7e22ce;
}

:deep(.status-fertilizing:hover) {
    background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%) !important;
    box-shadow: 0 4px 12px rgba(147, 51, 234, 0.4);
    transform: translateY(-1px);
}

/* 5. 肥后状态 - 绿色渐变（冲洗阶段，科技感） */
:deep(.status-post-fert) {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
    color: #ffffff !important;
    transition: all 0.3s ease;
    border-left: 4px solid #047857;
}

:deep(.status-post-fert:hover) {
    background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);
    transform: translateY(-1px);
}

/* 6. 收尾状态 - 深绿色/青色渐变（完成状态，科技感） */
:deep(.status-finishing) {
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%) !important;
    color: #ffffff !important;
    transition: all 0.3s ease;
    border-left: 4px solid #0f766e;
}

:deep(.status-finishing:hover) {
    background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%) !important;
    box-shadow: 0 4px 12px rgba(13, 148, 136, 0.4);
    transform: translateY(-1px);
}

/* 确保文字在深色背景上清晰可见 */
:deep(.status-watering td),
:deep(.status-pre-fert td),
:deep(.status-fertilizing td),
:deep(.status-post-fert td),
:deep(.status-finishing td),
:deep(.status-idle td) {
    color: #ffffff !important;
}

:deep(.status-watering .el-tag),
:deep(.status-pre-fert .el-tag),
:deep(.status-fertilizing .el-tag),
:deep(.status-post-fert .el-tag),
:deep(.status-finishing .el-tag),
:deep(.status-idle .el-tag) {
    background-color: rgba(255, 255, 255, 0.2) !important;
    border-color: rgba(255, 255, 255, 0.3) !important;
    color: #ffffff !important;
}


/* 按钮在深色背景上的样式优化 */
:deep(.status-watering .el-button),
:deep(.status-pre-fert .el-button),
:deep(.status-fertilizing .el-button),
:deep(.status-post-fert .el-button),
:deep(.status-finishing .el-button),
:deep(.status-idle .el-button) {
    border-color: rgba(255, 255, 255, 0.5) !important;
}

:deep(.status-watering .el-button--success),
:deep(.status-pre-fert .el-button--success),
:deep(.status-fertilizing .el-button--success),
:deep(.status-post-fert .el-button--success),
:deep(.status-finishing .el-button--success),
:deep(.status-idle .el-button--success) {
    background-color: rgba(16, 185, 129, 0.9) !important;
    border-color: #10b981 !important;
}

:deep(.status-watering .el-button--warning),
:deep(.status-pre-fert .el-button--warning),
:deep(.status-fertilizing .el-button--warning),
:deep(.status-post-fert .el-button--warning),
:deep(.status-finishing .el-button--warning),
:deep(.status-idle .el-button--warning) {
    background-color: rgba(245, 158, 11, 0.9) !important;
    border-color: #f59e0b !important;
}

:deep(.status-watering .el-button--danger),
:deep(.status-pre-fert .el-button--danger),
:deep(.status-fertilizing .el-button--danger),
:deep(.status-post-fert .el-button--danger),
:deep(.status-finishing .el-button--danger),
:deep(.status-idle .el-button--danger) {
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
