<template>
    <div class="stats-overview-container">
        <el-row :gutter="24" class="stats-overview">
            <el-col :span="6">
                <div class="stat-card stat-card-primary">
                    <div class="stat-background">
                        <div class="stat-pattern"></div>
                    </div>
                    <div class="stat-content">
                        <div class="stat-icon">
                            <el-icon size="36" color="white">
                                <Document />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-number">{{ totalPolicies }}</div>
                            <div class="stat-label">策略总数</div>
                            <div class="stat-desc">可用的策略数量</div>
                        </div>
                    </div>
                </div>
            </el-col>

            <el-col :span="6">
                <div class="stat-card stat-card-success">
                    <div class="stat-background">
                        <div class="stat-pattern"></div>
                    </div>
                    <div class="stat-content">
                        <div class="stat-icon">
                            <el-icon size="36" color="white">
                                <VideoPlay />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-number">{{ totalActions }}</div>
                            <div class="stat-label">动作总数</div>
                            <div class="stat-desc">所有策略的动作数量</div>
                        </div>
                    </div>
                </div>
            </el-col>

            <el-col :span="6">
                <div class="stat-card stat-card-warning">
                    <div class="stat-background">
                        <div class="stat-pattern"></div>
                    </div>
                    <div class="stat-content">
                        <div class="stat-icon">
                            <el-icon size="36" color="white">
                                <DataLine />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-number">{{ totalSources }}</div>
                            <div class="stat-label">数据源总数</div>
                            <div class="stat-desc">所有策略的数据源数量</div>
                        </div>
                    </div>
                </div>
            </el-col>

            <el-col :span="6">
                <div class="stat-card stat-card-danger">
                    <div class="stat-background">
                        <div class="stat-pattern"></div>
                    </div>
                    <div class="stat-content">
                        <div class="stat-icon">
                            <el-icon size="36" color="white">
                                <Setting />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-number">{{ totalStates }}</div>
                            <div class="stat-label">状态总数</div>
                            <div class="stat-desc">所有策略的状态数量</div>
                        </div>
                    </div>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
    Document,
    VideoPlay,
    DataLine,
    Setting
} from '@element-plus/icons-vue'
import policy_lib from '../lib/policy_lib.js'

// 响应式数据
const totalPolicies = ref(0)
const totalActions = ref(0)
const totalSources = ref(0)
const totalStates = ref(0)

// 加载统计数据
const loadStatsData = async () => {
    try {
        const token = localStorage.getItem('auth_token')

        // 获取策略总数
        const policiesResult = await policy_lib.list_policy(0, token)
        totalPolicies.value = policiesResult.total || 0

        // 计算状态总数、动作总数、数据源总数
        let statesCount = 0
        let actionsCount = 0
        let sourcesCount = 0

        if (policiesResult.policies && policiesResult.policies.length > 0) {
            for (const policy of policiesResult.policies) {
                try {
                    // 获取状态数量
                    const statesResult = await policy_lib.list_states(policy.name, 0, token)
                    statesCount += statesResult.total || 0

                    // 获取数据源数量
                    const sourcesResult = await policy_lib.list_sources(policy.name, 0, token)
                    sourcesCount += sourcesResult.total || 0

                    // 计算动作数量（遍历每个状态获取动作）
                    if (statesResult.states && statesResult.states.length > 0) {
                        for (const state of statesResult.states) {
                            try {
                                const stateDetail = await policy_lib.get_state(policy.name, state.name, token)
                                const enterActions = stateDetail.state.enter_actions || []
                                const doActions = stateDetail.state.do_actions || []
                                const exitActions = stateDetail.state.exit_actions || []
                                actionsCount += enterActions.length + doActions.length + exitActions.length
                            } catch (error) {
                                console.error(`获取状态 ${state.name} 动作失败:`, error)
                            }
                        }
                    }
                } catch (error) {
                    console.error(`获取策略 ${policy.name} 信息失败:`, error)
                }
            }
        }

        totalStates.value = statesCount
        totalActions.value = actionsCount
        totalSources.value = sourcesCount

    } catch (error) {
        console.error('加载策略统计数据失败:', error)
        // 设置默认值
        totalPolicies.value = 0
        totalActions.value = 0
        totalSources.value = 0
        totalStates.value = 0
    }
}

// 刷新统计数据
const refreshStatsData = async () => {
    await loadStatsData()
}

// 暴露刷新方法给父组件
const refresh = () => {
    refreshStatsData()
}

defineExpose({
    refresh
})

onMounted(() => {
    loadStatsData()
})
</script>

<style scoped>
.stats-overview-container {
    margin-bottom: 30px;
}

.stats-overview {
    margin-bottom: 20px;
}

.stat-card {
    position: relative;
    height: 140px;
    border-radius: 20px;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-card:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.stat-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
}

.stat-pattern {
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    animation: rotate 20s linear infinite;
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.stat-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 100%;
    padding: 4px 24px;
    color: white;
    gap: 20px;
}

.stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
    flex-shrink: 0;
}

.stat-card:hover .stat-icon {
    transform: scale(1.1);
    background: rgba(255, 255, 255, 0.3);
}

.stat-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    text-align: right;
}

.stat-number {
    font-size: 36px;
    font-weight: 800;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    line-height: 1;
    color: white;
    margin: 0;
}

.stat-label {
    font-size: 16px;
    font-weight: 600;
    opacity: 1;
    color: white;
    margin: 0;
}

.stat-desc {
    font-size: 12px;
    opacity: 0.9;
    line-height: 1.4;
    color: white;
    margin: 0;
}

/* 主题色彩 */
.stat-card-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card-success {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.stat-card-warning {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card-danger {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

/* 响应式设计 */
@media (max-width: 768px) {
    .stats-overview .el-col {
        margin-bottom: 16px;
    }

    .stat-content {
        padding: 16px;
        gap: 12px;
    }

    .stat-icon {
        width: 50px;
        height: 50px;
    }

    .stat-number {
        font-size: 24px;
    }

    .stat-label {
        font-size: 14px;
    }

    .stat-desc {
        font-size: 11px;
    }
}

/* 加载动画 */
.stat-card {
    animation: fadeInUp 0.6s ease-out;
}

.stat-card:nth-child(1) {
    animation-delay: 0.1s;
}

.stat-card:nth-child(2) {
    animation-delay: 0.2s;
}

.stat-card:nth-child(3) {
    animation-delay: 0.3s;
}

.stat-card:nth-child(4) {
    animation-delay: 0.4s;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
