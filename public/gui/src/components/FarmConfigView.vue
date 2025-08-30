<template>
    <div class="farm-config-view">
        <StatsOverview ref="statsRef" />

        <el-card class="config-list-card" shadow="hover">
            <template #header>
                <div class="card-header">
                    <span class="title">农场配置详情</span>
                    <div class="header-actions">
                        <el-button type="primary" @click="refreshData" :icon="Refresh">
                            刷新
                        </el-button>
                    </div>
                </div>
            </template>

            <PageContent :fetch_func="loadFarmsData" :params="{}" content_name="farms" total_name="total">
                <template #default="{ content }">
                    <el-table :data="content" style="width: 100%" v-loading="loading" stripe :default-expand-all="false"
                        row-key="name" class="config-table">
                        <el-table-column type="expand">
                            <template #default="props">
                                <div class="block-config-details">
                                    <div class="block-header">
                                        <h4>地块配置信息1</h4>
                                        <el-tag type="info" size="small">
                                            共 {{ props.row.blocks ? props.row.blocks.length : 0 }} 个地块
                                        </el-tag>
                                    </div>

                                    <div v-if="props.row.blocks && props.row.blocks.length > 0" class="blocks-grid">
                                        <div v-for="block in props.row.blocks" :key="block.name" class="block-item">
                                            <div class="block-header">
                                                <el-tag type="success" size="small">{{ block.name }}</el-tag>
                                                <el-tag type="warning" size="small" style="margin-left: 8px;">
                                                    {{ block.area || 0 }}亩
                                                </el-tag>
                                            </div>
                                            <div class="block-info">
                                                <div class="info-item">
                                                    <span class="label">描述：</span>
                                                    <span class="value">{{ block.info || '暂无描述' }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div v-else class="no-blocks">
                                        <el-empty description="暂无地块配置" :image-size="60" />
                                    </div>
                                </div>
                            </template>
                        </el-table-column>

                        <el-table-column prop="name" label="农场名称" width="180">
                            <template #default="scope">
                                <div class="farm-name">
                                    <el-icon color="#409EFF" style="margin-right: 8px;">
                                        <House />
                                    </el-icon>
                                    {{ scope.row.name }}
                                </div>
                            </template>
                        </el-table-column>

                        <el-table-column prop="location" label="位置" width="150">
                            <template #default="scope">
                                <div class="farm-location">
                                    <el-icon color="#E6A23C" style="margin-right: 8px;">
                                        <Location />
                                    </el-icon>
                                    {{ scope.row.location }}
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="info" label="描述信息" min-width="150" show-overflow-tooltip />

                        <el-table-column label="地块数量" width="120" align="center">
                            <template #default="scope">
                                <el-tag type="info" size="small">
                                    {{ scope.row.blocks ? scope.row.blocks.length : 0 }}
                                </el-tag>
                            </template>
                        </el-table-column>

                        <el-table-column label="配置状态" width="120" align="center">
                            <template #default="scope">
                                <el-tag type="success" size="small">
                                    <el-icon style="margin-right: 4px;">
                                        <Check />
                                    </el-icon>
                                    已配置
                                </el-tag>
                            </template>
                        </el-table-column>
                    </el-table>
                </template>
            </PageContent>
        </el-card>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
    Refresh,
    House,
    Location,
    Check
} from '@element-plus/icons-vue'
import axios from 'axios'
import PageContent from './PageContent.vue'
import StatsOverview from './StatsOverview.vue'


const statsRef = ref(null)

const loadFarmsData = async (params, pageNo) => {
    try {
        const response = await axios.post('/api/v1/resource/list_farm', {
            pageNo: pageNo
        })
        if (response.data.err_msg === '') {
            const farmsData = response.data.result.farms || []
            // 为每个农场加载地块数据
            for (let farm of farmsData) {
                const blockResponse = await axios.post('/api/v1/resource/list_block', {
                    farm_name: farm.name,
                    pageNo: 0
                })
                if (blockResponse.data.err_msg === '') {
                    farm.blocks = blockResponse.data.result.blocks || []
                }
            }
            return {
                farms: farmsData,
                total: response.data.result.total || 0
            }
        } else {
            ElMessage.error(response.data.err_msg || '加载农场列表失败')
            return { farms: [], total: 0 }
        }
    } catch (error) {
        console.error('加载农场列表失败:', error)
        ElMessage.error('加载农场列表失败')
        return { farms: [], total: 0 }
    }
}




const refreshData = () => {
    if (statsRef.value) {
        statsRef.value.refresh()
    }
}

onMounted(() => {
    loadFarmsData()
})
</script>

<style scoped>
.farm-config-view {
    padding: 20px;
    background-color: #f5f7fa;
    min-height: 100vh;
}

.config-list-card {
    margin-bottom: 20px;
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
    gap: 12px;
    align-items: center;
}

.config-table {
    margin-top: 20px;
}

.farm-name,
.farm-location {
    display: flex;
    align-items: center;
    font-weight: 500;
}

.block-config-details {
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
    margin: 10px;
}

.block-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.block-header h4 {
    margin: 0;
    color: #606266;
    font-size: 16px;
    font-weight: 600;
}

.blocks-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
}

.block-item {
    background: white;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    padding: 16px;
    transition: all 0.3s ease;
}

.block-item:hover {
    border-color: #409eff;
    box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
}

.block-item .block-header {
    margin-bottom: 12px;
}

.block-info .info-item {
    margin-bottom: 8px;
}

.block-info .label {
    color: #909399;
    font-size: 13px;
    margin-right: 8px;
}

.block-info .value {
    color: #606266;
    font-size: 13px;
}

.no-blocks {
    padding: 40px;
    text-align: center;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
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

/* 响应式设计 */
@media (max-width: 768px) {
    .stats-overview .el-col {
        margin-bottom: 16px;
    }

    .header-actions {
        flex-direction: column;
        gap: 8px;
    }

    .header-actions .el-input {
        width: 100% !important;
    }

    .blocks-grid {
        grid-template-columns: 1fr;
    }
}
</style>
