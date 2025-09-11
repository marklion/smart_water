<template>
    <div :class="viewClass">
        <!-- 统计概览组件 -->
        <component :is="statsComponent" ref="statsRef" v-if="statsComponent" />

        <!-- 配置列表卡片 -->
        <el-card class="config-list-card" shadow="hover">
            <template #header>
                <div class="card-header">
                    <span class="title">{{ title }}</span>
                    <div class="header-actions">
                        <slot name="header-actions">
                            <el-button type="primary" @click="handleRefresh" :icon="Refresh">
                                刷新
                            </el-button>
                        </slot>
                    </div>
                </div>
            </template>

            <PageContent :fetch_func="fetchFunc" :params="params" :content_name="contentName" :total_name="totalName"
                ref="pageContentRef">
                <template #default="{ content }">
                    <el-table :data="content" :style="tableStyle" stripe :row-key="rowKey"
                        :default-expand-all="defaultExpandAll" class="config-table">
                        <slot name="table-columns" :data="content"></slot>
                    </el-table>
                </template>
            </PageContent>
        </el-card>

        <!-- 额外内容插槽 -->
        <slot name="extra-content"></slot>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import PageContent from './PageContent.vue'

const props = defineProps({
    title: {
        type: String,
        required: true
    },
    viewClass: {
        type: String,
        default: 'base-config-view'
    },
    statsComponent: {
        type: [String, Object],
        default: null
    },
    fetchFunc: {
        type: Function,
        required: true
    },
    params: {
        type: Object,
        default: () => ({})
    },
    contentName: {
        type: String,
        default: 'content'
    },
    totalName: {
        type: String,
        default: 'total'
    },
    tableStyle: {
        type: String,
        default: 'width: 100%'
    },
    rowKey: {
        type: String,
        default: 'id'
    },
    defaultExpandAll: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['refresh'])

const statsRef = ref(null)
const pageContentRef = ref(null)

const handleRefresh = () => {
    if (statsRef.value && statsRef.value.refresh) {
        statsRef.value.refresh()
    }
    emit('refresh')
}

// 暴露方法给父组件
defineExpose({
    statsRef,
    pageContentRef,
    refresh: handleRefresh
})
</script>

<style scoped>
.base-config-view {
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
    .header-actions {
        flex-direction: column;
        gap: 8px;
    }
}
</style>
