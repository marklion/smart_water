<template>
    <div class="watering-group-status">
        <h3 class="section-title">
            <el-icon>
                <DataLine />
            </el-icon>
            轮灌组运行状态
        </h3>

        <div class="watering-groups-table">
            <el-table :data="irrigationGroups" stripe border :loading="loading" empty-text="暂无轮灌组数据"
                :row-class-name="tableRowClassName">
                <el-table-column prop="name" label="轮灌组" width="150" align="left" show-overflow-tooltip />
                <el-table-column prop="area" label="面积/亩" width="100" align="center" />
                <el-table-column prop="method" label="灌溉方式" width="100" align="center" />
                <el-table-column prop="fert_rate" label="施肥率(L/亩)" width="120" align="center" />
                <el-table-column prop="total_water" label="总用水量(L)" width="120" align="center" />
                <el-table-column prop="total_fert" label="总施肥量(L)" width="120" align="center" />
                <el-table-column prop="minute_left" label="剩余时间(分)" width="120" align="center" />

                <el-table-column prop="cur_state" label="当前状态" width="120" align="center">
                    <template #default="{ row }">
                        <el-tag :type="getStatusTagType(row.cur_state)" size="default" effect="dark" round>
                            {{ row.cur_state || '未知' }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column prop="valves" label="阀门" width="240" align="left">
                    <template #default="{ row }">
                        <template v-if="row.valves && row.valves !== '-'">
                            <el-tag
                                v-for="(valve, idx) in parseValves(row.valves)"
                                :key="idx"
                                size="small"
                                style="margin-right:4px; margin-bottom:2px;"
                            >
                                {{ valve }}
                            </el-tag>
                        </template>
                        <span v-else>-</span>
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { DataLine } from '@element-plus/icons-vue'
import call_remote from '../../public/lib/call_remote.js'

// 接收父组件传递的农场参数
const props = defineProps({
  farmName: {
    type: String,
    default: null
  }
})

// 响应式数据
const irrigationGroups = ref([])
const loading = ref(false)

// 加载轮灌组数据
const loadWateringGroups = async () => {
    loading.value = true
    try {
        const response = await call_remote('/policy/list_watering_groups', { pageNo: 0 })
        if (response && response.groups) {
            let filteredGroups = response.groups
            
            // 如果有农场参数，则按农场筛选轮灌组
            if (props.farmName) {
                // 获取所有策略的农场匹配信息
                const policyFarmMatches = await Promise.all(
                    response.groups.map(async (group) => {
                        try {
                            const farmMatch = await call_remote('/policy/get_matched_farm', { 
                                policy_name: group.name 
                            })
                            return {
                                group,
                                farmName: farmMatch.farm_name
                            }
                        } catch (error) {
                            return {
                                group,
                                farmName: null
                            }
                        }
                    })
                )
                
                // 筛选出匹配指定农场的轮灌组
                filteredGroups = policyFarmMatches
                    .filter(item => item.farmName === props.farmName)
                    .map(item => item.group)

                // 若按农场过滤后为空，则回退展示全部轮灌组，避免列表空白
                if (filteredGroups.length === 0) {
                    filteredGroups = response.groups
                }
            }
            
            irrigationGroups.value = filteredGroups.map(group => ({
                name: group.name || '未命名',
                area: group.area ?? '-',
                method: group.method || '-',
                fert_rate: group.fert_rate ?? '-',
                total_water: group.total_water ?? '-',
                total_fert: group.total_fert ?? '-',
                minute_left: group.minute_left ?? '-',
                cur_state: group.cur_state || '未知',
                valves: group.valves || '-'
            }))
        } else {
            irrigationGroups.value = []
        }
    } catch (error) {
        console.error('加载轮灌组数据失败:', error)
        ElMessage.error('加载轮灌组数据失败')
        irrigationGroups.value = []
    } finally {
        loading.value = false
    }
}

// 表格行样式类名
const tableRowClassName = ({ row }) => {
    const status = row.cur_state || row.status
    if (status && (status.includes('执行中') || status.includes('灌溉中') || status.includes('running'))) {
        return 'success-row'
    } else if (status && (status.includes('暂停') || status.includes('warning'))) {
        return 'warning-row'
    }
    return ''
}

// Element Plus标签类型
const getStatusTagType = (status) => {
    switch (status) {
        case '执行中':
        case '灌溉中':
            return 'success'  // 绿色
        case '执行完成':
            return 'primary'  // 蓝色
        case '排队中':
        case '待机状态':
            return 'warning'  // 橙色
        case '暂停':
            return 'danger'   // 红色
        default:
            return 'info'     // 灰色
    }
}

// 解析阀门字符串：将 "阀门1" "阀门2" 格式转换为数组
const parseValves = (valveStr) => {
    if (!valveStr || valveStr === '-' || typeof valveStr !== 'string') {
        return []
    }
    // 匹配所有引号内的字符串
    const matches = valveStr.match(/"([^"]+)"/g)
    if (matches) {
        return matches.map(m => m.slice(1, -1)) // 移除引号
    }
    // 如果没有引号，尝试按空格分割（兼容旧格式）
    return valveStr.split(/\s+/).filter(v => v && v.trim())
}

// 监听农场参数变化
watch(() => props.farmName, (newFarmName) => {
    if (newFarmName) {
        // 农场切换时重新加载轮灌组数据
        loadWateringGroups()
    }
}, { immediate: false })

// 刷新数据
const refresh = () => {
    loadWateringGroups()
}

// 暴露数据和方法给父组件
defineExpose({
    irrigationGroups,
    refresh
})

onMounted(() => {
    loadWateringGroups()
})
</script>

<style scoped>
.watering-group-status {
    padding: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 20px 0;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
}

.watering-groups-table {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.watering-groups-table :deep(.el-table) {
    flex: 1;
}

/* 表格行样式 */
:deep(.success-row) {
    background-color: #f0f9ff;
}

:deep(.warning-row) {
    background-color: #fef3e2;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .watering-groups-table {
        overflow-x: auto;
    }
}
</style>
