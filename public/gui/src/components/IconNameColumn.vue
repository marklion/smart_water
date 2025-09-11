<template>
    <div class="icon-name-column">
        <el-icon :color="iconColor" style="margin-right: 8px;">
            <component :is="icon" />
        </el-icon>
        {{ name }}
    </div>
</template>

<script setup>
defineProps({
    name: {
        type: String,
        required: true
    },
    icon: {
        type: [String, Object],
        required: true
    },
    iconColor: {
        type: String,
        default: '#409EFF'
    }
})
</script>

<style scoped>
.icon-name-column {
    display: flex;
    align-items: center;
    font-weight: 500;
}
</style>
