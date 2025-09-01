import { ref, computed } from 'vue'
import axios from 'axios'

// 全局状态
const allFarms = ref([])
const isDataLoaded = ref(false)

// 计算属性
const totalFarms = computed(() => allFarms.value.length)

const totalBlocks = computed(() => {
    return allFarms.value.reduce((sum, farm) => {
        return sum + (farm.blocks ? farm.blocks.length : 0)
    }, 0)
})

const uniqueLocations = computed(() => {
    const locations = new Set(allFarms.value.map(farm => farm.location))
    return locations.size
})

const avgBlocksPerFarm = computed(() => {
    if (totalFarms.value === 0) return 0
    return Math.round((totalBlocks.value / totalFarms.value) * 10) / 10
})

// 加载统计数据
const loadStatsData = async () => {
    // 如果数据已经加载过，直接返回
    if (isDataLoaded.value) {
        return allFarms.value
    }
    
    try {
        const response = await axios.post('/api/v1/resource/list_farm', {
            pageNo: 0
        })
        if (response.data.err_msg === '') {
            const farmsData = response.data.result.farms || []
            // 为每个农场加载地块数据
            for (let farm of farmsData) {
                const blockResponse = await axios.post('/api/v1/resource/list_block', {
                    farm_name: farm.name,
                    pageNo: 0
                })
                if (blockResponse.data.err_msg === '') {
                    farm.blocks = blockResponse.data.result.blocks || []
                }
            }
            allFarms.value = farmsData
            isDataLoaded.value = true
            return farmsData
        }
    } catch (error) {
        console.error('加载统计数据失败:', error)
        return []
    }
}

// 刷新数据
const refreshStatsData = async () => {
    isDataLoaded.value = false
    return await loadStatsData()
}

// 获取数据
const getStatsData = () => {
    return allFarms.value
}

// 检查数据是否已加载
const isLoaded = () => {
    return isDataLoaded.value
}



export function useStatsStore() {
    return {
        // 状态
        allFarms,
        isDataLoaded,
        
        // 计算属性
        totalFarms,
        totalBlocks,
        uniqueLocations,
        avgBlocksPerFarm,
        
        // 方法
        loadStatsData,
        refreshStatsData,
        getStatsData,
        isLoaded
    }
}
