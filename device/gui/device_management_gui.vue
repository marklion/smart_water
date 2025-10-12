<template>
    <div class="device-management-view">
        <StatsOverview ref="statsRef" />

        <el-card class="config-list-card" shadow="hover">
            <template #header>
                <div class="card-header">
                    <span class="title">设备配置详情</span>
                    <div class="header-actions">
                        <SearchComponent ref="searchRef" :search-placeholder="'搜索设备名称、驱动...'" @search="onSearch"
                            @reset="onSearchReset" class="search-component" />
                        <el-button type="primary" @click="refreshData" :icon="Refresh">
                            刷新
                        </el-button>
                    </div>
                </div>
            </template>

            <el-tabs v-model="activeTab" type="card" class="config-tabs">
                <el-tab-pane label="驱动列表" name="drivers">
                    <PageContent content_name="drivers" :fetch_func="fetch_driver_list" :params="driverSearchParams"
                        ref="driverPageContentRef" v-slot="data">
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
                    <PageContent :key="deviceListKey" content_name="devices" :fetch_func="fetch_device_list"
                        :params="deviceSearchParams" ref="devicePageContentRef" v-slot="data">
                        <el-table :data="data.content" stripe style="width: 100%" class="config-table">
                            <el-table-column prop="device_name" label="设备名称" width="220">
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
                            <el-table-column prop="coordinates" label="坐标位置" width="200">
                                <template #default="scope">
                                    <div class="coordinates-display">
                                        <div v-if="scope.row.longitude && scope.row.latitude" class="coordinate-values">
                                            <div class="coordinate-item">
                                                <span class="coordinate-label">经度:</span>
                                                <span class="coordinate-value">{{ scope.row.longitude.toFixed(6)
                                                    }}</span>
                                            </div>
                                            <div class="coordinate-item">
                                                <span class="coordinate-label">纬度:</span>
                                                <span class="coordinate-value">{{ scope.row.latitude.toFixed(6)
                                                    }}</span>
                                            </div>
                                        </div>
                                        <div v-else class="no-coordinates">
                                            <el-tag type="warning" size="small">未设置坐标</el-tag>
                                        </div>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="120" fixed="right">
                                <template #default="scope">
                                    <el-button type="primary" size="small" @click="editDevice(scope.row)">
                                        编辑
                                    </el-button>
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
import { ElMessage } from 'element-plus';
import device_management_lib from '../lib/device_management_lib';
import PageContent from '../../public/gui/src/components/PageContent.vue';
import StatsOverview from '../../resource/gui/StatsOverview.vue';
import SearchComponent from '../../public/gui/src/components/SearchComponent.vue';
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
const searchRef = ref(null);
const driverPageContentRef = ref(null);
const devicePageContentRef = ref(null);


// 驱动搜索参数
const driverSearchParams = ref({
    searchText: '',
    filters: {}
});

// 设备搜索参数
const deviceSearchParams = ref({
    searchText: '',
    filters: {}
});

async function fetch_driver_list(params, pageNo) {
    const result = await device_management_lib.get_driver_list('abc', pageNo);
    let drivers = result.drivers || [];

    // 应用搜索和筛选
    if (params && params.searchText) {
        const searchText = params.searchText.toLowerCase();
        drivers = drivers.filter(driver =>
            driver.name.toLowerCase().includes(searchText) ||
            (driver.config_method && driver.config_method.toLowerCase().includes(searchText)) ||
            (driver.capability && driver.capability.toLowerCase().includes(searchText))
        );
    }

    return {
        drivers: drivers,
        total: drivers.length
    };
}

async function fetch_device_list(params, pageNo) {
    const result = await device_management_lib.list_device(pageNo, farmFilter.value, blockFilter.value, 'abc');
    let devices = result.devices || [];

    // 应用搜索
    if (params && params.searchText) {
        const searchText = params.searchText.toLowerCase();
        devices = devices.filter(device =>
            device.device_name.toLowerCase().includes(searchText) ||
            (device.farm_name && device.farm_name.toLowerCase().includes(searchText)) ||
            (device.block_name && device.block_name.toLowerCase().includes(searchText))
        );
    }

    return {
        devices: devices,
        total: devices.length
    };
}

function refreshDeviceList() {
    deviceListKey.value++;
}

function refreshData() {
    refreshDeviceList();
    if (statsRef.value) {
        statsRef.value.refresh();
    }
    // 重置搜索参数
    driverSearchParams.value = { searchText: '', filters: {} };
    deviceSearchParams.value = { searchText: '', filters: {} };
    if (searchRef.value) {
        searchRef.value.reset();
    }
    // 刷新页面内容
    if (driverPageContentRef.value) {
        driverPageContentRef.value.reload();
    }
    if (devicePageContentRef.value) {
        devicePageContentRef.value.reload();
    }
}

// 搜索事件处理
const onSearch = (params) => {
    console.log('搜索参数:', params, '当前标签:', activeTab.value);
    if (activeTab.value === 'drivers') {
        driverSearchParams.value = params;
        if (driverPageContentRef.value) {
            driverPageContentRef.value.reload();
        }
    } else if (activeTab.value === 'devices') {
        deviceSearchParams.value = params;
        if (devicePageContentRef.value) {
            devicePageContentRef.value.reload();
        }
    }
};

// 搜索重置事件处理
const onSearchReset = () => {
    console.log('重置搜索');
    driverSearchParams.value = { searchText: '', filters: {} };
    deviceSearchParams.value = { searchText: '', filters: {} };
    farmFilter.value = '';
    blockFilter.value = '';

    if (activeTab.value === 'drivers' && driverPageContentRef.value) {
        driverPageContentRef.value.reload();
    } else if (activeTab.value === 'devices' && devicePageContentRef.value) {
        devicePageContentRef.value.reload();
    }
};



// 编辑设备
const editDevice = (device) => {
    console.log('编辑设备:', device);
    // 这里可以打开设备编辑对话框
    ElMessage.info('设备编辑功能开发中...');
};

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
    flex-wrap: wrap;
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
/* 坐标显示样式 */
.coordinates-display {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.coordinate-values {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.coordinate-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
}

.coordinate-label {
    font-weight: 500;
    color: #606266;
    min-width: 35px;
}

.coordinate-value {
    color: #303133;
    font-family: 'Courier New', monospace;
    background: #f5f7fa;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #e4e7ed;
}

.no-coordinates {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .coordinate-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }
    
    .coordinate-label {
        min-width: auto;
    }
}
</style>
