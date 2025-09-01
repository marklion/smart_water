<template>
    <div class="device-management-view">
        <StatsOverview ref="statsRef" />

        <el-card class="config-list-card" shadow="hover">
            <template #header>
                <div class="card-header">
                    <span class="title">设备配置详情</span>
                    <div class="header-actions">
                        <el-button type="primary" @click="refreshData" :icon="Refresh">
                            刷新
                        </el-button>
                    </div>
                </div>
            </template>

            <el-tabs v-model="activeTab" type="card" class="config-tabs">
                <el-tab-pane label="驱动列表" name="drivers">
                    <PageContent content_name="drivers" :fetch_func="fetch_driver_list" v-slot="data">
                        <el-table :data="data.content" stripe style="width: 100%" class="config-table">
                            <el-table-column prop="name" label="驱动名称" width="200">
                                <template #default="scope">
                                    <div class="driver-name">
                                        <el-icon color="#409EFF" style="margin-right: 8px;">
                                            <Setting />
                                        </el-icon>
                                        {{ scope.row.name }}
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column prop="config_method" label="配置方法" min-width="150" />
                            <el-table-column prop="capability" label="能力集" min-width="200" show-overflow-tooltip />
                        </el-table>
                    </PageContent>
                </el-tab-pane>

                <el-tab-pane label="设备列表" name="devices">
                    <div class="device-controls">
                        <el-input v-model="farmFilter" placeholder="按农场筛选" style="width: 200px;" clearable
                            @input="refreshDeviceList" />
                        <el-input v-model="blockFilter" placeholder="按区块筛选" style="width: 200px; margin-left: 10px;"
                            clearable @input="refreshDeviceList" />
                        <el-button @click="refreshDeviceList" style="margin-left: 10px;">
                            刷新列表
                        </el-button>
                    </div>

                    <PageContent :key="deviceListKey" content_name="devices" :fetch_func="fetch_device_list"
                        v-slot="data">
                        <el-table :data="data.content" stripe style="width: 100%" class="config-table">
                            <el-table-column prop="device_name" label="设备名称" width="180">
                                <template #default="scope">
                                    <div class="device-name">
                                        <el-icon color="#67C23A" style="margin-right: 8px;">
                                            <Monitor />
                                        </el-icon>
                                        {{ scope.row.device_name }}
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column prop="driver_name" label="驱动名称" width="150" />
                            <el-table-column prop="config_key" label="配置" min-width="120" />
                            <el-table-column prop="capability" label="能力集" min-width="150" show-overflow-tooltip />
                            <el-table-column prop="farm_name" label="所属农场" width="150">
                                <template #default="scope">
                                    <div class="farm-name">
                                        <el-icon color="#409EFF" style="margin-right: 8px;">
                                            <House />
                                        </el-icon>
                                        {{ scope.row.farm_name }}
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column prop="block_name" label="所属区块" width="150">
                                <template #default="scope">
                                    <div class="block-name">
                                        <el-icon color="#E6A23C" style="margin-right: 8px;">
                                            <Grid />
                                        </el-icon>
                                        {{ scope.row.block_name }}
                                    </div>
                                </template>
                            </el-table-column>
                        </el-table>
                    </PageContent>
                </el-tab-pane>
            </el-tabs>
        </el-card>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import device_management_lib from '../lib/device_management_lib';
import PageContent from '../../public/gui/src/components/PageContent.vue';
import StatsOverview from '../../resource/gui/StatsOverview.vue';
import {
    Refresh,
    Setting,
    Monitor,
    House,
    Grid
} from '@element-plus/icons-vue';

const activeTab = ref('devices');
const farmFilter = ref('');
const blockFilter = ref('');
const deviceListKey = ref(0);
const statsRef = ref(null);

async function fetch_driver_list(params, pageNo) {
    return await device_management_lib.get_driver_list('abc', pageNo);
}

async function fetch_device_list(params, pageNo) {
    return await device_management_lib.list_device(pageNo, farmFilter.value, blockFilter.value, 'abc');
}

function refreshDeviceList() {
    deviceListKey.value++;
}

function refreshData() {
    refreshDeviceList();
    if (statsRef.value) {
        statsRef.value.refresh();
    }
}
</script>

<style scoped>
.device-management-view {
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

.config-tabs {
    margin-top: 20px;
}

.device-controls {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
}

.config-table {
    margin-top: 20px;
}

.driver-name,
.device-name,
.farm-name,
.block-name {
    display: flex;
    align-items: center;
    font-weight: 500;
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

    .device-controls {
        flex-direction: column;
        gap: 8px;
        align-items: stretch;
    }

    .device-controls .el-input {
        width: 100% !important;
        margin-left: 0 !important;
    }
}
</style>
