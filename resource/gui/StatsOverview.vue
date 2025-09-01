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
                                <House />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-number">{{ totalFarms }}</div>
                            <div class="stat-label">农场总数</div>
                            <div class="stat-desc">已接入智慧管理系统</div>
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
                                <Grid />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-number">{{ totalBlocks }}</div>
                            <div class="stat-label">地块总数</div>
                            <div class="stat-desc">精细化管理的农田单元</div>
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
                                <Location />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-number">{{ uniqueLocations }}</div>
                            <div class="stat-label">不同位置</div>
                            <div class="stat-desc">覆盖的地理区域</div>
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
                                <DataLine />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-number">{{ avgBlocksPerFarm }}</div>
                            <div class="stat-label">平均地块数</div>
                            <div class="stat-desc">农场管理效率指标</div>
                        </div>
                    </div>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import { onMounted } from 'vue'
import {
    House,
    Grid,
    Location,
    DataLine
} from '@element-plus/icons-vue'
import { useStatsStore } from '../../public/gui/src/composables/useStatsStore.js'

// 使用全局状态
const {
    totalFarms,
    totalBlocks,
    uniqueLocations,
    avgBlocksPerFarm,
    loadStatsData,
    refreshStatsData
} = useStatsStore()

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
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
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
    .stats-title {
        font-size: 24px;
    }
    
    .stat-card {
        height: 140px;
        margin-bottom: 16px;
    }
    
    .stat-number {
        font-size: 28px;
    }
    
    .stat-icon {
        width: 50px;
        height: 50px;
    }
}

/* 加载动画 */
.stat-card {
    animation: fadeInUp 0.6s ease-out;
}

.stat-card:nth-child(1) { animation-delay: 0.1s; }
.stat-card:nth-child(2) { animation-delay: 0.2s; }
.stat-card:nth-child(3) { animation-delay: 0.3s; }
.stat-card:nth-child(4) { animation-delay: 0.4s; }

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
