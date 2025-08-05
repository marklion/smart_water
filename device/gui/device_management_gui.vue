<template>
    <PageContent content_name="drivers" :fetch_func="fetch_driver_list" v-slot="data">
        <el-table :data="data.content" stripe style="width: 100%">
            <el-table-column prop="name" label="Name" />
            <el-table-column prop="config_method" label="Config Method" />
        </el-table>
    </PageContent>
</template>

<script setup>
import device_management_lib from '../lib/device_management_lib'
import PageContent from '@/components/PageContent.vue';

async function fetch_driver_list(params, pageNo) {
    return await device_management_lib.get_driver_list('abc', pageNo);
}
</script>

<style lang="scss" scoped></style>
