<template>
    <div class="block-config-view">
        <StatsOverview ref="statsRef" />

        <el-card class="config-list-card" shadow="hover">
            <template #header>
                <div class="card-header">
                    <span class="title">地块配置详情</span>
                    <div class="header-actions">
                        <el-button type="primary" @click="refreshData" :icon="Refresh">
                            刷新
                        </el-button>
                    </div>
                </div>
            </template>

            <PageContent :fetch_func="loadBlocksData" :params="{}" content_name="blocks" total_name="total">
                <template #default="{ content }">
                    <el-table :data="content" style="width: 100%" stripe row-key="id"
                        class="config-table">
                        <el-table-column prop="farm_name" label="所属农场" width="180">
                            <template #default="scope">
                                <div class="farm-name">
                                    <el-icon color="#409EFF" style="margin-right: 8px;">
                                        <House />
                                    </el-icon>
                                    {{ scope.row.farm_name }}
                                </div>
                            </template>
                        </el-table-column>

                        <el-table-column prop="name" label="地块名称" width="180">
                            <template #default="scope">
                                <div class="block-name">
                                    <el-icon color="#67C23A" style="margin-right: 8px;">
                                        <Grid />
                                    </el-icon>
                                    {{ scope.row.name }}
                                </div>
                            </template>
                        </el-table-column>

                        <el-table-column prop="area" label="面积(亩)" width="100" align="center">
                            <template #default="scope">
                                <el-tag type="success" size="small">
                                    {{ scope.row.area || 0 }}
                                </el-tag>
                            </template>
                        </el-table-column>



                        <el-table-column prop="info" label="描述信息" min-width="200" show-overflow-tooltip />

                        <el-table-column label="农场位置" width="200" show-overflow-tooltip>
                            <template #default="scope">
                                <div class="farm-location">
                                    <el-icon color="#E6A23C" style="margin-right: 8px;">
                                        <Location />
                                    </el-icon>
                                    {{ getFarmLocation(scope.row.farm_name) }}
                                </div>
                            </template>
                        </el-table-column>

                        <el-table-column label="配置状态" width="120" align="center">
                            <template #default="scope">
                                <el-tag type="success" size="small">
                                    <el-icon style="margin-right: 4px;">
                                        <Check />
                                    </el-icon>
                                    已启用
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
    Grid,
    Location,
    Check
} from '@element-plus/icons-vue'
import axios from 'axios'
import PageContent from './PageContent.vue'
import StatsOverview from './StatsOverview.vue'



const farms = ref([])
const statsRef = ref(null)





const loadFarms = async () => {
    try {
        const response = await axios.post('/api/v1/resource/list_farm', {
            pageNo: 0
        })
        if (response.data.err_msg === '') {
            farms.value = response.data.result.farms || []
        }
    } catch (error) {
        console.error('加载农场列表失败:', error)
    }
}





const loadBlocksData = async (params, pageNo) => {
    try {
        const response = await axios.post('/api/v1/resource/list_block', {
            pageNo: pageNo
        })
        if (response.data.err_msg === '') {
            return {
                blocks: response.data.result.blocks || [],
                total: response.data.result.total || 0
            }
        } else {
            ElMessage.error(response.data.err_msg || '加载地块列表失败')
            return { blocks: [], total: 0 }
        }
    } catch (error) {
        console.error('加载地块列表失败:', error)
        ElMessage.error('加载地块列表失败')
        return { blocks: [], total: 0 }
    }
}



const getFarmLocation = (farmName) => {
    const farm = farms.value.find(f => f.name === farmName)
    return farm ? farm.location : '未知位置'
}



const refreshData = () => {
    loadFarms()
    if (statsRef.value) {
        statsRef.value.refresh()
    }
}

onMounted(() => {
    loadFarms()
})
</script>

<style scoped>
.block-config-view {
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
.block-name,
.farm-location {
    display: flex;
    align-items: center;
    font-weight: 500;
}

.area-value {
    font-weight: 500;
    color: #67C23A;
}



.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
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

    .header-actions .el-input,
    .header-actions .el-select {
        width: 100% !important;
    }


}
</style>
