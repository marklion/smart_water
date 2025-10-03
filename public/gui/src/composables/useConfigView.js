import { ref, onMounted } from 'vue'

/**
 * 配置视图通用逻辑
 * @param {Function} loadDataFunc - 数据加载函数
 */
export function useConfigView(loadDataFunc) {
    const statsRef = ref(null)
    const searchRef = ref(null)
    const pageContentRef = ref(null)
    
    // 搜索相关状态
    const searchParams = ref({
        searchText: '',
        filters: {}
    })

    // 刷新数据
    const refreshData = () => {
        if (statsRef.value) {
            statsRef.value.refresh()
        }
        // 重置搜索参数
        searchParams.value = { searchText: '', filters: {} }
        if (searchRef.value) {
            searchRef.value.reset()
        }
        // 刷新页面内容
        if (pageContentRef.value) {
            pageContentRef.value.reload()
        }
    }

    // 搜索事件处理
    const onSearch = (params) => {
        searchParams.value = params
        if (pageContentRef.value) {
            pageContentRef.value.reload()
        }
    }

    // 搜索重置事件处理
    const onSearchReset = () => {
        searchParams.value = { searchText: '', filters: {} }
        if (pageContentRef.value) {
            pageContentRef.value.reload()
        }
    }

    // 如果提供了数据加载函数，在组件挂载时执行
    if (loadDataFunc) {
        onMounted(() => {
            loadDataFunc()
        })
    }

    return {
        statsRef,
        searchRef,
        pageContentRef,
        searchParams,
        refreshData,
        onSearch,
        onSearchReset
    }
}
