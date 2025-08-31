<template>
    <div class="device-management">
        <el-tabs v-model="activeTab" type="card">
            <el-tab-pane label="驱动列表" name="drivers">
                <PageContent content_name="drivers" :fetch_func="fetch_driver_list" v-slot="data">
                    <el-table :data="data.content" stripe style="width: 100%">
                        <el-table-column prop="name" label="驱动名称" />
                        <el-table-column prop="config_method" label="配置方法" />
                        <el-table-column prop="capability" label="能力集" />
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

                <PageContent :key="deviceListKey" content_name="devices" :fetch_func="fetch_device_list" v-slot="data">
                    <el-table :data="data.content" stripe style="width: 100%">
                        <el-table-column prop="device_name" label="设备名称" />
                        <el-table-column prop="driver_name" label="驱动名称" />
                        <el-table-column prop="config_key" label="配置" />
                        <el-table-column prop="capability" label="能力集" />
                        <el-table-column prop="farm_name" label="所属农场" />
                        <el-table-column prop="block_name" label="所属区块" />
                    </el-table>
                </PageContent>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import device_management_lib from '../lib/device_management_lib';
import PageContent from '@/components/PageContent.vue';

const activeTab = ref('devices');
const farmFilter = ref('');
const blockFilter = ref('');
const deviceListKey = ref(0);


async function fetch_driver_list(params, pageNo) {
    return await device_management_lib.get_driver_list('abc', pageNo);
}


async function fetch_device_list(params, pageNo) {
    return await device_management_lib.list_device(pageNo, farmFilter.value, blockFilter.value, 'abc');
}


function refreshDeviceList() {
    deviceListKey.value++;
}
</script>

<style lang="scss" scoped>
.device-management {
    padding: 20px;
}

.device-controls {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
}
</style>
