<template>
    <div class="search-component">
        <div class="search-filters">
            <!-- 搜索框 -->
            <el-input v-model="searchText" :placeholder="searchPlaceholder" clearable @input="onSearchTextChange"
                @clear="onClear" @keyup.enter="onSearch" class="search-input" size="default" />
            <!-- 搜索按钮 -->
            <el-button type="primary" :icon="Search" @click="onSearch" size="default" class="search-button">
                搜索
            </el-button>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { Search } from '@element-plus/icons-vue'

const props = defineProps({
    // 搜索框占位符
    searchPlaceholder: {
        type: String,
        default: '请输入搜索内容'
    },
    // 搜索延迟时间（毫秒）
    debounceTime: {
        type: Number,
        default: 500
    }
})

const emit = defineEmits(['search', 'reset'])

// 搜索文本
const searchText = ref('')

let searchTimeout = null

// 搜索文本变化处理（防抖）
const onSearchTextChange = () => {
    if (searchTimeout) {
        clearTimeout(searchTimeout)
    }
    searchTimeout = setTimeout(() => {
        onSearch()
    }, props.debounceTime)
}

// 执行搜索
const onSearch = () => {
    const searchParams = {
        searchText: searchText.value,
        filters: {}
    }
    emit('search', searchParams)
}

// 重置搜索
const onReset = () => {
    searchText.value = ''
    emit('reset')
}

// 清空搜索框
const onClear = () => {
    onSearch()
}

// 暴露方法供父组件调用
defineExpose({
    reset: onReset,
    getSearchParams: () => ({
        searchText: searchText.value,
        filters: {}
    })
})
</script>

<style scoped>
.search-component {
    display: flex;
    align-items: center;
}

.search-filters {
    display: flex;
    align-items: center;
    gap: 8px;
}

.search-input {
    width: 200px;
    min-width: 180px;
}

.search-button {
    flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .search-input {
        width: 150px;
        min-width: 120px;
    }
}
</style>
