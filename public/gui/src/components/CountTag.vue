<template>
    <el-tag :type="type" size="small" :effect="effect">
        <el-icon v-if="showIcon && icon" style="margin-right: 4px;">
            <component :is="icon" />
        </el-icon>
        {{ count }}{{ suffix }}
    </el-tag>
</template>

<script setup>
defineProps({
    count: {
        type: [String, Number],
        required: true
    },
    type: {
        type: String,
        default: 'info'
    },
    effect: {
        type: String,
        default: 'dark'
    },
    icon: {
        type: [String, Object],
        default: null
    },
    showIcon: {
        type: Boolean,
        default: false
    },
    suffix: {
        type: String,
        default: ''
    }
})
</script>
