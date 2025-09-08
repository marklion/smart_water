<template>
    <div class="policy-template-config-view">
        <PolicyStatsOverview ref="statsRef" />

        <el-card class="config-list-card" shadow="hover">
            <template #header>
                <div class="card-header">
                    <span class="title">策略配置</span>
                    <div class="header-actions">
                        <el-button type="primary" @click="refreshData" :icon="Refresh">
                            刷新
                        </el-button>
                    </div>
                </div>
            </template>

            <PageContent :fetch_func="loadPolicyData" :params="{}" content_name="policies" total_name="total">
                <template #default="{ content }">
                    <el-table :data="content" style="width: 100%" stripe row-key="name" class="config-table">
                        <el-table-column type="expand">
                            <template #default="props">
                                <div class="policy-details">
                                    <div class="policy-detail-header">
                                        <h4>策略详情</h4>
                                        <el-tag type="info" size="small">
                                            {{ props.row.name }}
                                        </el-tag>
                                    </div>
                                    <div class="policy-info">
                                        <div class="info-row">
                                            <div class="info-label">
                                                <el-icon>
                                                    <DataLine />
                                                </el-icon>
                                                数据源
                                            </div>
                                            <div class="info-content">
                                                <div v-if="props.row.sources && props.row.sources.length > 0"
                                                    class="tags-container">
                                                    <el-tag v-for="source in props.row.sources" :key="source.name"
                                                        type="success" size="small" effect="light" class="info-tag">
                                                        {{ source.name }}
                                                        <span class="tag-detail">({{ source.device }})</span>
                                                    </el-tag>
                                                </div>
                                                <span v-else class="no-data">暂无数据源</span>
                                            </div>
                                        </div>

                                        <div class="info-row">
                                            <div class="info-label">
                                                <el-icon>
                                                    <Tools />
                                                </el-icon>
                                                动作集
                                            </div>
                                            <div class="info-content">
                                                <div v-if="props.row.actions && props.row.actions.length > 0"
                                                    class="tags-container">
                                                    <el-tag v-for="action in props.row.actions" :key="action.name"
                                                        type="warning" size="small" effect="light" class="info-tag">
                                                        {{ action.name }}
                                                        <span class="tag-detail">({{ action.device }})</span>
                                                    </el-tag>
                                                </div>
                                                <span v-else class="no-data">暂无动作集</span>
                                            </div>
                                        </div>

                                        <div class="info-row">
                                            <div class="info-label">
                                                <el-icon>
                                                    <Edit />
                                                </el-icon>
                                                变量
                                            </div>
                                            <div class="info-content">
                                                <div v-if="props.row.variables && props.row.variables.length > 0"
                                                    class="tags-container">
                                                    <el-tag v-for="variable in props.row.variables" :key="variable.name"
                                                        type="info" size="small" effect="light" class="info-tag">
                                                        {{ variable.name }}
                                                        <span class="tag-detail">({{ variable.type }})</span>
                                                    </el-tag>
                                                </div>
                                                <span v-else class="no-data">暂无变量</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="name" label="策略名称" width="400" show-overflow-tooltip>
                            <template #default="scope">
                                <div class="policy-name">
                                    <el-icon color="#409EFF" style="margin-right: 8px;">
                                        <Document />
                                    </el-icon>
                                    {{ scope.row.name }}
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="states_count" label="状态" width="100" align="center">
                            <template #default="scope">
                                <el-tag type="info" size="small">{{ scope.row.states_count || 0 }}</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="sources_count" label="数据源" width="100" align="center">
                            <template #default="scope">
                                <el-tag type="success" size="small">{{ scope.row.sources_count || 0 }}</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="actions_count" label="动作" width="100" align="center">
                            <template #default="scope">
                                <el-tag type="warning" size="small">{{ scope.row.actions_count || 0 }}</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="variables_count" label="变量" width="100" align="center">
                            <template #default="scope">
                                <el-tag type="danger" size="small">{{ scope.row.variables_count || 0 }}</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="created_time" label="创建时间" width="160">
                            <template #default="scope">
                                {{ formatTime(scope.row.created_time) }}
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="120">
                            <template #default="scope">
                                <el-button size="small" type="primary" @click="showStatesDrawer(scope.row)"
                                    :icon="Setting">
                                    状态列表
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </template>
            </PageContent>
        </el-card>

        <!-- 状态列表弹窗 -->
        <div v-if="statesDialogVisible" class="fixed-dialog-overlay" @click="handleOverlayClick">
            <div class="fixed-dialog" @click.stop>
                <!-- 弹窗头部 -->
                <div class="fixed-dialog-header">
                    <div class="header-content">
                        <div class="policy-badge">
                            <el-icon>
                                <Document />
                            </el-icon>
                            <span>策略</span>
                        </div>
                        <div class="policy-title">{{ currentPolicy?.name }}</div>
                        <div class="policy-subtitle">状态机配置详情</div>
                    </div>
                    <el-button type="info" size="small" @click="closeDialog" :icon="Close" class="close-btn">
                        关闭
                    </el-button>
                </div>

                <!-- 弹窗内容 -->
                <div class="fixed-dialog-body" v-loading="stateLoading[currentPolicy?.name]">
                    <div v-if="currentPolicy && stateData[currentPolicy.name] && stateData[currentPolicy.name].length > 0"
                        class="states-scroll-container">
                        <div v-for="state in stateData[currentPolicy.name]" :key="state.name" class="state-item">
                            <!-- 状态标题 -->
                            <div class="state-title-section">
                                <div class="state-title">{{ state.name }}</div>
                            </div>

                            <!-- 动作区域 -->
                            <div class="state-section">
                                <div class="section-header">
                                    <el-icon class="section-icon">
                                        <VideoPlay />
                                    </el-icon>
                                    <span class="section-name">动作</span>
                                </div>
                                <div class="three-columns">
                                    <div class="column">
                                        <div class="column-title">进入</div>
                                        <div class="tags-area">
                                            <el-tag v-for="action in state.enter_actions"
                                                :key="action.device + action.action" size="small" type="primary"
                                                class="action-tag">
                                                {{ action.device }}:{{ action.action }}
                                            </el-tag>
                                        </div>
                                    </div>
                                    <div class="column">
                                        <div class="column-title">持续</div>
                                        <div class="tags-area">
                                            <el-tag v-for="action in state.do_actions"
                                                :key="action.device + action.action" size="small" type="success"
                                                class="action-tag">
                                                {{ action.device }}:{{ action.action }}
                                            </el-tag>
                                        </div>
                                    </div>
                                    <div class="column">
                                        <div class="column-title">离开</div>
                                        <div class="tags-area">
                                            <el-tag v-for="action in state.exit_actions"
                                                :key="action.device + action.action" size="small" type="warning"
                                                class="action-tag">
                                                {{ action.device }}:{{ action.action }}
                                            </el-tag>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 变量赋值区域 -->
                            <div class="state-section">
                                <div class="section-header">
                                    <el-icon class="section-icon">
                                        <Edit />
                                    </el-icon>
                                    <span class="section-name">变量赋值</span>
                                </div>
                                <div class="three-columns">
                                    <div class="column">
                                        <div class="column-title">进入</div>
                                        <div class="tags-area">
                                            <el-tag v-for="assignment in state.enter_variable_assignments"
                                                :key="assignment.variable_name" size="small" type="primary" effect="light"
                                                class="variable-tag">
                                                {{ assignment.variable_name }}: {{ assignment.expression }}
                                            </el-tag>
                                        </div>
                                    </div>
                                    <div class="column">
                                        <div class="column-title">持续</div>
                                        <div class="tags-area">
                                            <el-tag v-for="assignment in state.hold_variable_assignments"
                                                :key="assignment.variable_name" size="small" type="success" effect="light"
                                                class="variable-tag">
                                                {{ assignment.variable_name }}: {{ assignment.expression }}
                                            </el-tag>
                                        </div>
                                    </div>
                                    <div class="column">
                                        <div class="column-title">离开</div>
                                        <div class="tags-area">
                                            <el-tag v-for="assignment in state.exit_variable_assignments"
                                                :key="assignment.variable_name" size="small" type="warning" effect="light"
                                                class="variable-tag">
                                                {{ assignment.variable_name }}: {{ assignment.expression }}
                                            </el-tag>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 状态转移区域 -->
                            <div class="state-section transition-section">
                                <div class="section-header">
                                    <el-icon class="section-icon">
                                        <Switch />
                                    </el-icon>
                                    <span class="section-name">状态转移</span>
                                </div>
                                <div class="transition-grid">
                                    <template v-for="transformer in state.transformers" :key="transformer.name">
                                        <div v-for="(rule, index) in transformer.rules"
                                            :key="`${transformer.name}-${index}`" class="transition-item">
                                            <div class="priority-number">{{ index + 1 }}</div>
                                            <div class="transition-info">
                                                <div class="transition-condition">{{ rule.expression }}</div>
                                                <div class="transition-target">
                                                    <el-icon>
                                                        <Right />
                                                    </el-icon>
                                                    {{ rule.target_state }}
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                    <div v-if="!state.transformers || state.transformers.length === 0 || !state.transformers.some(t => t.rules && t.rules.length > 0)"
                                        class="no-transitions">
                                        暂无转移规则
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else-if="currentPolicy && !stateLoading[currentPolicy.name]" class="empty-content">
                        <el-empty description="暂无状态数据" :image-size="120">
                            <el-button type="primary" @click="loadStatesData(currentPolicy.name)">重新加载</el-button>
                        </el-empty>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Document, Setting, VideoPlay, Switch, Right, DataLine, Tools, Edit, Close } from '@element-plus/icons-vue'
import PageContent from '../../public/gui/src/components/PageContent.vue'
import PolicyStatsOverview from './PolicyStatsOverview.vue'
import policy_lib from '../lib/policy_lib.js'

const statsRef = ref(null)

const stateData = ref({})
const stateLoading = ref({})

const statesDialogVisible = ref(false)
const currentPolicy = ref(null)

// 数据加载函数 - 使用真实API
const loadPolicyData = async (params, pageNo = 0) => {
    try {
        const token = localStorage.getItem('auth_token')
        const result = await policy_lib.list_policy(pageNo, token)

        // 为每个策略加载详细信息
        if (result.policies && result.policies.length > 0) {
            for (let policy of result.policies) {
                try {
                    // 获取状态列表
                    const statesResult = await policy_lib.list_states(policy.name, 0, token)
                    policy.states_count = statesResult.total || 0

                    // 获取数据源列表
                    const sourcesResult = await policy_lib.list_sources(policy.name, 0, token)
                    policy.sources_count = sourcesResult.total || 0
                    policy.sources = sourcesResult.sources || [] // 保存完整的数据源信息

                    // 计算准确的动作和变量数量，同时收集详细信息
                    let actionsCount = 0
                    let variablesCount = 0
                    let allActions = []
                    let allVariables = []
                    
                    if (statesResult.states && statesResult.states.length > 0) {
                        for (const state of statesResult.states) {
                            try {
                                const stateDetail = await policy_lib.get_state(policy.name, state.name, token)
                                const stateData = stateDetail.state
                                const enterActions = stateData.enter_actions || []
                                const doActions = stateData.do_actions || []
                                const exitActions = stateData.exit_actions || []
                                actionsCount += enterActions.length + doActions.length + exitActions.length
                                
                                // 收集动作信息
                                enterActions.forEach(action => allActions.push({ name: `${action.device}:${action.action}`, type: '进入', state: state.name }))
                                doActions.forEach(action => allActions.push({ name: `${action.device}:${action.action}`, type: '状态内', state: state.name }))
                                exitActions.forEach(action => allActions.push({ name: `${action.device}:${action.action}`, type: '离开', state: state.name }))
                                
                                const enterAssignments = stateData.enter_assignments || []
                                const doAssignments = stateData.do_assignments || []
                                const exitAssignments = stateData.exit_assignments || []
                                variablesCount += enterAssignments.length + doAssignments.length + exitAssignments.length
                                
                                // 收集变量信息
                                enterAssignments.forEach(assignment => allVariables.push({ name: assignment.variable_name, type: '进入', expression: assignment.expression, state: state.name }))
                                doAssignments.forEach(assignment => allVariables.push({ name: assignment.variable_name, type: '状态内', expression: assignment.expression, state: state.name }))
                                exitAssignments.forEach(assignment => allVariables.push({ name: assignment.variable_name, type: '离开', expression: assignment.expression, state: state.name }))
                                
                            } catch (error) {
                                console.error(`获取状态 ${state.name} 详情失败:`, error)
                            }
                        }
                    }
                    
                    policy.actions_count = actionsCount
                    policy.variables_count = variablesCount
                    policy.created_time = policy.created_time || new Date().toISOString()

                    // 设置动作和变量数组（用于展开详情显示）
                    policy.actions = allActions
                    policy.variables = allVariables

                } catch (error) {
                    console.error(`加载策略${policy.name}详情失败:`, error)
                    // 设置默认值
                    policy.states_count = 0
                    policy.sources_count = 0
                    policy.actions_count = 0
                    policy.variables_count = 0
                    policy.created_time = new Date().toISOString()
                    policy.sources = []
                    policy.actions = []
                    policy.variables = []
                }
            }
        }

        return result
    } catch (error) {
        console.error('加载策略失败:', error)
        return { policies: [], total: 0 }
    }
}


const refreshData = () => {
    if (statsRef.value) {
        statsRef.value.refresh()
    }
    // 强制刷新页面内容
    window.location.reload()
}

const formatTime = (timeStr) => {
    if (!timeStr) return '-'
    return new Date(timeStr).toLocaleString('zh-CN')
}


const loadStatesData = async (policyName) => {
    if (stateData.value[policyName]) {
        return
    }

    stateLoading.value[policyName] = true
    try {
        const token = localStorage.getItem('auth_token')
        const statesResult = await policy_lib.list_states(policyName, 0, token)
        const states = statesResult.states || []

        // 为每个状态获取详细信息
        const stateDetails = []
        for (const state of states) {
            try {
                const stateDetail = await policy_lib.get_state(policyName, state.name, token)
                const processedState = {
                    name: stateDetail.state.name,
                    enter_actions: stateDetail.state.enter_actions || [],
                    do_actions: stateDetail.state.do_actions || [],
                    exit_actions: stateDetail.state.exit_actions || [],
                    enter_variable_assignments: stateDetail.state.enter_assignments || [],
                    hold_variable_assignments: stateDetail.state.do_assignments || [],
                    exit_variable_assignments: stateDetail.state.exit_assignments || [],
                    transformers: stateDetail.state.transformers || []
                }

                console.log(`状态 ${processedState.name} 的转换器:`, processedState.transformers)

                stateDetails.push(processedState)
            } catch (error) {
                console.error(`获取状态 ${state.name} 详情失败:`, error)
                // 如果获取详情失败，使用基本信息
                stateDetails.push({
                    name: state.name,
                    enter_actions: [],
                    do_actions: [],
                    exit_actions: [],
                    enter_variable_assignments: [],
                    hold_variable_assignments: [],
                    exit_variable_assignments: [],
                    transformers: []
                })
            }
        }

        stateData.value[policyName] = stateDetails
        console.log('状态数据已加载:', stateData.value[policyName])
    } catch (error) {
        console.error('加载状态数据失败:', error)
        stateData.value[policyName] = []
    } finally {
        stateLoading.value[policyName] = false
    }
}

// 删除模拟状态数据，使用真实API数据

// 查看状态详情
const viewStateDetail = (policyName, stateName) => {
    ElMessage.info(`查看状态详情: ${policyName} - ${stateName}`)
}

// 显示状态对话框
const showStatesDrawer = (policy) => {
    currentPolicy.value = policy
    statesDialogVisible.value = true
    // 禁用页面滚动
    document.body.style.overflow = 'hidden'
    // 加载状态数据
    loadStatesData(policy.name)
}

// 关闭对话框
const handleDialogClose = (done) => {
    currentPolicy.value = null
    done()
}

// 关闭自定义弹窗
const closeDialog = () => {
    statesDialogVisible.value = false
    currentPolicy.value = null
    document.body.style.overflow = 'auto'
}

// 点击遮罩关闭
const handleOverlayClick = () => {
    closeDialog()
}

onMounted(() => {
    console.log('PolicyTemplateConfigSimple mounted')
})
</script>

<style scoped>
.policy-template-config-view {
    padding: 20px;
    background-color: #f5f5f5;
    min-height: 100vh;
}

.config-list-card {
    margin-top: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.title {
    font-size: 18px;
    font-weight: bold;
    color: #303133;
}

.header-actions {
    display: flex;
    gap: 10px;
}

.config-table {
    margin-top: 0;
}

/* 移除卡片内容的内边距，让表格顶满 */
.config-list-card :deep(.el-card__body) {
    padding: 0 !important;
}

/* 确保PageContent组件也没有内边距 */
.config-list-card :deep(.page-content) {
    padding: 0 !important;
    margin: 0 !important;
}

/* 移除所有可能影响表格顶满的内外边距 */
.config-list-card :deep(.el-table) {
    margin: 0 !important;
    border-radius: 0 !important;
    border: none !important;
}

.config-list-card :deep(.el-table__header-wrapper) {
    margin: 0 !important;
}

.config-list-card :deep(.el-table__body-wrapper) {
    margin: 0 !important;
}

/* 优化表格边框样式 */
.config-list-card :deep(.el-table td),
.config-list-card :deep(.el-table th) {
    border: none !important;
}

.config-list-card :deep(.el-table::before) {
    display: none;
}

.config-list-card :deep(.el-table--border) {
    border: none !important;
}

.config-list-card :deep(.el-table--border::after) {
    display: none;
}

/* 保持斑马纹效果但移除边框 */
.config-list-card :deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
    background-color: #fafafa;
}

.config-list-card :deep(.el-table__body tr:hover > td) {
    background-color: #f5f7fa !important;
}

/* 隐藏表格滚动条 */
:deep(.el-table__body-wrapper)::-webkit-scrollbar {
    display: none;
}

:deep(.el-table__body-wrapper) {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

:deep(.el-scrollbar__bar.is-horizontal) {
    display: none !important;
}

.policy-name {
    display: flex;
    align-items: center;
}

.description-text {
    color: #606266;
    line-height: 1.4;
}

/* 策略详情展开区域样式 */
.policy-details {
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
    margin: 10px;
}

.policy-detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.policy-detail-header h4 {
    margin: 0;
    color: #606266;
    font-size: 16px;
    font-weight: 600;
}

.policy-info {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.info-row {
    display: flex;
    align-items: flex-start;
    padding: 8px 0;
    border-bottom: 1px solid #f0f2f5;
}

.info-row:last-child {
    border-bottom: none;
}

.info-label {
    color: #409EFF;
    font-size: 13px;
    font-weight: 500;
    min-width: 90px;
    margin-right: 16px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
}

.info-label .el-icon {
    font-size: 14px;
}

.info-content {
    color: #606266;
    font-size: 13px;
    line-height: 1.4;
    flex: 1;
}

.tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.info-tag {
    border-radius: 6px;
    font-weight: 500;
}

.tag-detail {
    color: #909399;
    font-size: 11px;
    margin-left: 4px;
}

.no-data {
    color: #c0c4cc;
    font-style: italic;
}

/* 表格展开行的样式 */
:deep(.el-table__expanded-cell) {
    padding: 0 !important;
}

:deep(.el-table__expand-icon) {
    color: #409EFF;
}

:deep(.el-table__expand-icon:hover) {
    color: #66b1ff;
}

/* 对话框内容样式 */
.dialog-content {
    height: 70vh;
    overflow: hidden;
}

.states-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* 状态卡片样式 */
.state-card {
    background: #ffffff;
    border: 1px solid #e4e7ed;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    overflow: hidden;
    margin-bottom: 16px;
}

.state-card:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
}

.state-card:last-child {
    margin-bottom: 0;
}

/* 状态卡片头部 */
.state-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    border-bottom: 1px solid #e4e7ed;
}

.state-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.state-icon {
    color: #409eff;
    font-size: 18px;
}

.state-name {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

/* 状态内容区域 */
.state-content {
    padding: 20px;
}

/* 区域标题样式 */
.section-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f0f2f5;
}

/* 自定义固定弹窗样式 */
.fixed-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.fixed-dialog {
    width: 90vw;
    height: 85vh;
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.fixed-dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 32px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    flex-shrink: 0;
}

.header-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.policy-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    opacity: 0.9;
}

.policy-title {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
}

.policy-subtitle {
    font-size: 14px;
    opacity: 0.8;
}

.close-btn {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.3);
}

.fixed-dialog-body {
    flex: 1;
    background: #f8fafc;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

/* 对话框头部样式 */
.dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 32px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.header-left {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.policy-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    opacity: 0.9;
}

.policy-name {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
}

.policy-subtitle {
    font-size: 14px;
    opacity: 0.8;
}

.header-right .el-button {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
}

.header-right .el-button:hover {
    background: rgba(255, 255, 255, 0.3);
}

/* 状态滚动容器 */
.states-scroll-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 20px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 16px;
    align-content: start;
    grid-auto-rows: auto;
}

/* 自定义滚动条样式 */
.states-scroll-container::-webkit-scrollbar {
    width: 8px;
}

.states-scroll-container::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
}

.states-scroll-container::-webkit-scrollbar-thumb {
    background: #c1c9d2;
    border-radius: 4px;
}

.states-scroll-container::-webkit-scrollbar-thumb:hover {
    background: #a1a9b2;
}

/* 状态项样式 */
.state-item {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    overflow: visible;
    transition: all 0.2s ease;
    height: auto;
}

.state-item:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
}

.state-title-section {
    padding: 16px 20px;
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    border-bottom: 1px solid #e2e8f0;
    text-align: center;
}

.state-title {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
}

.state-section {
    padding: 16px 20px;
    border-bottom: 1px solid #f1f5f9;
}

.state-section:last-child {
    border-bottom: none;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
}

.section-icon {
    color: #3b82f6;
    font-size: 16px;
}

.section-name {
    font-size: 14px;
    font-weight: 500;
    color: #475569;
}

.three-columns {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
}

.column {
    text-align: center;
}

.column-title {
    font-size: 12px;
    color: #64748b;
    margin-bottom: 8px;
    font-weight: 500;
}

.tags-area {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-height: auto;
}

.action-tag,
.variable-tag {
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 4px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 状态转移样式 */
.transition-section {
    background: #fafbfc;
}

.transition-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.transition-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    transition: all 0.2s ease;
}

.transition-item:hover {
    background: #f8fafc;
    border-color: #3b82f6;
}

.priority-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border-radius: 50%;
    font-weight: 600;
    font-size: 12px;
    flex-shrink: 0;
}

.transition-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.transition-condition {
    font-size: 11px;
    color: #475569;
    font-family: 'Monaco', 'Menlo', monospace;
    background: #f1f5f9;
    padding: 4px 8px;
    border-radius: 4px;
    border-left: 2px solid #3b82f6;
}

.transition-target {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 500;
    color: #059669;
}

.transition-target .el-icon {
    color: #3b82f6;
    font-size: 12px;
}

.no-transitions {
    text-align: center;
    padding: 20px;
    color: #94a3b8;
    font-style: italic;
    font-size: 12px;
}

.empty-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* 紧凑状态头部 */
.compact-state-header {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border-bottom: 1px solid #e2e8f0;
}

.state-name {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
}


/* 紧凑区域 */
.compact-section {
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
}

.compact-section:last-child {
    border-bottom: none;
}

.compact-section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 15px;
    font-weight: 500;
    color: #475569;
}

.compact-section-title .el-icon {
    color: #3b82f6;
    font-size: 16px;
}

/* 紧凑网格 */
.compact-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
}

.compact-column {
    text-align: center;
}

.column-label {
    font-size: 13px;
    color: #64748b;
    margin-bottom: 6px;
    font-weight: 500;
}

.tag-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-height: 40px;
}

.mini-tag {
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 转移标签区域 */
.transition-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: center;
}

.mini-transition-tag {
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
}

/* 删除旧的表格样式 */

/* 转移区域特殊样式 */
.transition-section {
    background: #fefefe;
}

/* 清理不再需要的样式 */

.empty-state {
    text-align: center;
    padding: 40px 0;
}

:deep(.el-table--small) {
    font-size: 13px;
}

/* 对话框中的空状态样式 */
.dialog-content .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 40vh;
    text-align: center;
}

/* 响应式优化 */
@media (max-width: 768px) {
    :deep(.el-dialog) {
        width: 95% !important;
    }

    .state-card {
        margin-bottom: 12px;
    }

    .state-content {
        padding: 16px;
    }
}
</style>
