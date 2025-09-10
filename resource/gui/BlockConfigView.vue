<template>
    <div class="block-config-view">
        <StatsOverview ref="statsRef" />

        <el-card class="config-list-card" shadow="hover">
            <template #header>
                <div class="card-header">
                    <span class="title">地块配置详情</span>
                    <div class="header-actions">
                        <SearchComponent ref="searchRef" :search-placeholder="'搜索地块名称、农场...'" @search="onSearch"
                            @reset="onSearchReset" class="search-component" />
                        <el-button type="primary" @click="refreshData" :icon="Refresh">
                            刷新
                        </el-button>
                    </div>
                </div>
            </template>

            <PageContent :fetch_func="loadBlocksData" :params="searchParams" content_name="blocks" total_name="total"
                ref="pageContentRef">
                <template #default="{ content }">
                    <el-table :data="content" style="width: 100%" stripe row-key="id" class="config-table">
                        <el-table-column prop="farm_name" label="所属农场" width="180">
                            <template #default="scope">
                                <IconNameColumn :name="scope.row.farm_name" :icon="House" icon-color="#409EFF" />
                            </template>
                        </el-table-column>

                        <el-table-column prop="name" label="地块名称" width="180">
                            <template #default="scope">
                                <IconNameColumn :name="scope.row.name" :icon="Grid" icon-color="#67C23A" />
                            </template>
                        </el-table-column>

                        <el-table-column prop="area" label="面积(亩)" width="100" align="center">
                            <template #default="scope">
                                <CountTag :count="scope.row.area || 0" type="success" suffix="亩" />
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
import PageContent from '../../public/gui/src/components/PageContent.vue'
import StatsOverview from './StatsOverview.vue'
import SearchComponent from '../../public/gui/src/components/SearchComponent.vue'
import IconNameColumn from '../../public/gui/src/components/IconNameColumn.vue'
import CountTag from '../../public/gui/src/components/CountTag.vue'
import { useConfigView } from '../../public/gui/src/composables/useConfigView.js'



const farms = ref([])

// 先定义loadFarms函数
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

// 使用通用配置视图逻辑
const {
    statsRef,
    searchRef,
    pageContentRef,
    searchParams,
    refreshData: baseRefreshData,
    onSearch: baseOnSearch,
    onSearchReset: baseOnSearchReset
} = useConfigView(loadFarms)







const loadBlocksData = async (params, pageNo) => {
    try {
        const response = await axios.post('/api/v1/resource/list_block', {
            pageNo: pageNo
        })
        if (response.data.err_msg === '') {
            let blocksData = response.data.result.blocks || []

            // 应用搜索
            if (params && params.searchText) {
                const searchText = params.searchText.toLowerCase()
                blocksData = blocksData.filter(block =>
                    block.name.toLowerCase().includes(searchText) ||
                    (block.farm_name && block.farm_name.toLowerCase().includes(searchText)) ||
                    (block.info && block.info.toLowerCase().includes(searchText))
                )
            }

            return {
                blocks: blocksData,
                total: blocksData.length
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



// 自定义刷新逻辑，包含loadFarms
const refreshData = () => {
    loadFarms()
    baseRefreshData()
}

// 使用基础搜索逻辑
const onSearch = baseOnSearch
const onSearchReset = baseOnSearchReset
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
    flex-wrap: wrap;
}

.search-component {
    flex-shrink: 0;
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
