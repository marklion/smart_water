<template>
    <el-table-column :prop="prop" :label="label" :width="width" :min-width="minWidth" :align="align"
        :show-overflow-tooltip="showOverflowTooltip" :fixed="fixed" :type="type">
        <template #default="scope" v-if="!type">
            <slot :row="scope.row" :$index="scope.$index">
                <!-- 默认显示：带图标的名称 -->
                <div v-if="showIcon" class="column-content">
                    <el-icon :color="iconColor" style="margin-right: 8px;">
                        <component :is="icon" />
                    </el-icon>
                    {{ getValue(scope.row) }}
                </div>
                <!-- 标签显示 -->
                <el-tag v-else-if="showTag" :type="tagType" size="small" :effect="tagEffect">
                    <el-icon v-if="tagIcon" style="margin-right: 4px;">
                        <component :is="tagIcon" />
                    </el-icon>
                    {{ getValue(scope.row) }}
                </el-tag>
                <!-- 普通文本 -->
                <span v-else>{{ getValue(scope.row) }}</span>
            </slot>
        </template>

        <!-- 展开行内容 -->
        <template #default="props" v-if="type === 'expand'">
            <slot name="expand" :row="props.row"></slot>
        </template>
    </el-table-column>
</template>

<script setup>
const props = defineProps({
    prop: String,
    label: String,
    width: [String, Number],
    minWidth: [String, Number],
    align: {
        type: String,
        default: 'left'
    },
    showOverflowTooltip: {
        type: Boolean,
        default: false
    },
    fixed: [String, Boolean],
    type: String, // 'expand', 'selection', 'index'

    // 图标相关
    showIcon: {
        type: Boolean,
        default: false
    },
    icon: [String, Object],
    iconColor: {
        type: String,
        default: '#409EFF'
    },

    // 标签相关
    showTag: {
        type: Boolean,
        default: false
    },
    tagType: {
        type: String,
        default: 'info'
    },
    tagEffect: {
        type: String,
        default: 'dark'
    },
    tagIcon: [String, Object],

    // 数据获取
    defaultValue: {
        type: [String, Number],
        default: ''
    }
})

const getValue = (row) => {
    if (props.prop) {
        return row[props.prop] || props.defaultValue
    }
    return props.defaultValue
}
</script>

<style scoped>
.column-content {
    display: flex;
    align-items: center;
    font-weight: 500;
}
</style>
