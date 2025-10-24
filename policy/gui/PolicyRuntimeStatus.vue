<template>
  <div class="policy-runtime-status">
    <h3 class="section-title">
      <el-icon>
        <Monitor />
      </el-icon>
      策略运行时状态
    </h3>

    <div class="policies-grid" v-if="policies.length > 0">
      <div v-for="policy in policies" :key="policy.name" class="policy-card" @click="selectPolicyForRuntime(policy)"
        :class="{ 'selected': selectedPolicy?.name === policy.name }">
        <div class="policy-header">
          <h4 class="policy-name">{{ policy.name }}</h4>
          <el-tag :type="getPolicyStatusType(policy)" size="small">
            {{ getPolicyStatusText(policy) }}
          </el-tag>
        </div>
        <div class="policy-info">
          <div class="info-item">
            <span class="label">关联农场:</span>
            <span class="value">{{ policy.farm_name || '未关联' }}</span>
          </div>
          <div class="info-item">
            <span class="label">初始化变量:</span>
            <span class="value">{{ policy.init_variables?.length || 0 }} 个</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 选中策略的运行时状态 -->
    <div v-if="selectedPolicy && selectedPolicyRuntime" class="runtime-details">
      <div class="subsection-header">
        <h4 class="subsection-title">策略运行时状态 - {{ selectedPolicy.name }}</h4>
        <div class="refresh-controls">
          <el-button size="small" @click="handleManualRefresh" :loading="isAutoRefreshing">
            手动刷新
          </el-button>
          <div class="refresh-status">
            <el-icon v-if="isAutoRefreshing" class="is-loading">
              <Loading />
            </el-icon>
            <span class="refresh-text">{{ isAutoRefreshing ? '刷新中...' : '自动刷新' }}</span>
          </div>
        </div>
      </div>

      <div class="runtime-info">
        <!-- 当前状态 -->
        <el-descriptions :column="2" border class="runtime-descriptions">
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStateStatusType(selectedPolicyRuntime?.current_state)" size="large">
              {{ getStateDisplayText(selectedPolicyRuntime?.current_state) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="运行时间">
            {{ selectedPolicyRuntime?.runtime || '未知' }}
          </el-descriptions-item>
          <el-descriptions-item label="执行次数">
            {{ selectedPolicyRuntime?.execution_count || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="最后执行时间">
            {{ formatTime(selectedPolicyRuntime?.last_execution_time) }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 变量信息 -->
        <div v-if="selectedPolicyRuntime?.variables" class="variables-section">
          <h5 class="subsection-title">运行时变量</h5>
          <el-descriptions :column="2" border class="variables-descriptions">
            <el-descriptions-item v-for="(value, key) in selectedPolicyRuntime.variables" :key="key" :label="key">
              <div class="variable-edit-container">
                <el-input v-if="editingVariable === key" v-model="editingValue" @blur="saveVariable(key)"
                  @keyup.enter="saveVariable(key)" @keyup.escape="cancelEdit" ref="editInput" size="small"
                  class="edit-input" placeholder="输入新值" />
                <div v-else class="variable-value-display" @click="startEdit(key, value)">
                  {{ value }}
                </div>
                <div class="variable-actions">
                  <el-button v-if="editingVariable === key" type="primary" size="small" @click="saveVariable(key)"
                    :loading="assignmentLoading" icon="Check" />
                  <el-button v-if="editingVariable === key" size="small" @click="cancelEdit" icon="Close" />
                  <el-button v-else type="text" size="small" @click="startEdit(key, value)" icon="Edit" />
                </div>
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </div>

    <div v-else-if="selectedPolicy" class="no-runtime-data">
      <el-empty description="暂无运行时数据" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Monitor, Loading } from '@element-plus/icons-vue'
import call_remote from '../../public/lib/call_remote.js'

// 接收父组件传递的农场参数
const props = defineProps({
  farmName: {
    type: String,
    default: null
  }
})

// 响应式数据
const policies = ref([])
const selectedPolicy = ref(null)
const selectedPolicyRuntime = ref(null)
const wateringGroupPolicies = ref([]) // 轮灌组中的策略名称列表

// 内联编辑相关数据
const editingVariable = ref(null)
const editingValue = ref('')
const assignmentLoading = ref(false)
const editInput = ref(null)

// 自动刷新相关
const autoRefreshTimer = ref(null)
const isAutoRefreshing = ref(false)

// 获取轮灌组中的策略名称列表
const loadWateringGroupPolicies = async () => {
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
              console.warn(`获取策略 ${group.name} 的农场信息失败:`, error)
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
      }
      
      // 提取策略名称列表
      wateringGroupPolicies.value = filteredGroups.map(group => group.name)
    } else {
      wateringGroupPolicies.value = []
    }
  } catch (error) {
    console.error('获取轮灌组策略列表失败:', error)
    wateringGroupPolicies.value = []
  }
}

const loadPolicies = async () => {
  try {
    // 先获取轮灌组中的策略名称列表
    await loadWateringGroupPolicies()
    
    const params = { pageNo: 0 }
    // 如果有农场参数，则按农场筛选策略
    if (props.farmName) {
      params.farm_name = props.farmName
    }
    const response = await call_remote('/policy/list_policy', params)
    
    // 过滤掉轮灌组中已显示的策略
    const allPolicies = response.policies || []
    policies.value = allPolicies.filter(policy => 
      !wateringGroupPolicies.value.includes(policy.name)
    )
  } catch (error) {
    console.error('加载策略列表失败:', error)
    ElMessage.error('加载策略列表失败')
  }
}

// 选择策略查看运行时状态
const selectPolicyForRuntime = async (policy) => {
  // 停止之前的自动刷新
  stopAutoRefresh()
  
  selectedPolicy.value = policy
  await loadPolicyRuntime(policy.name)
  
  // 开始新的自动刷新
  startAutoRefresh()
}

// 获取策略运行时状态
const loadPolicyRuntime = async (policyName) => {
  try {
    const result = await call_remote('/policy/get_policy_runtime', { policy_name: policyName })

    // 解析变量数据
    let variables = {}
    if (result.variables) {
      try {
        variables = JSON.parse(result.variables)
      } catch (e) {
        console.warn('解析变量数据失败:', e)
      }
    }

    selectedPolicyRuntime.value = {
      ...result,
      variables
    }
  } catch (error) {
    console.error('获取策略运行时状态失败:', error)
    ElMessage.error('获取策略运行时状态失败')
    selectedPolicyRuntime.value = null
  }
}

// 获取策略状态类型
const getPolicyStatusType = (policy) => {
  return 'success'
}

// 获取策略状态文本 - 使用实际状态数据
const getPolicyStatusText = (policy) => {
  // 如果有选中的策略运行时状态，使用其状态
  if (selectedPolicyRuntime.value && selectedPolicyRuntime.value.current_state) {
    return selectedPolicyRuntime.value.current_state
  }
  // 否则返回默认状态
  return '未运行'
}

// 获取状态显示文本 - 直接显示原始状态，不做映射
const getStateDisplayText = (state) => {
  if (!state) return '未运行'
  return state
}

// 获取状态标签类型 - 简化逻辑
const getStateStatusType = (state) => {
  if (!state) return 'info'
  
  // 只有明确的运行状态才显示为成功（绿色）
  if (state === 'work' || state === 'running' || state === 'active') {
    return 'success'
  }
  
  // 其他所有状态都显示为信息（灰色）
  return 'info'
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '未知'
  return new Date(timestamp).toLocaleString()
}

// 开始编辑变量
const startEdit = (variableName, currentValue) => {
  editingVariable.value = variableName
  editingValue.value = currentValue
  // 等待DOM更新后聚焦输入框
  nextTick(() => {
    if (editInput.value && editInput.value.length > 0) {
      editInput.value[0].focus()
    }
  })
}

// 取消编辑
const cancelEdit = () => {
  editingVariable.value = null
  editingValue.value = ''
}

// 保存变量
const saveVariable = async (variableName) => {
  if (!selectedPolicy.value) {
    ElMessage.error('请先选择策略')
    return
  }

  if (editingValue.value === '') {
    ElMessage.warning('变量值不能为空')
    return
  }

  try {
    assignmentLoading.value = true

    // 调用运行时赋值API
    const result = await call_remote('/policy/runtime_assignment', {
      policy_name: selectedPolicy.value.name,
      variable_name: variableName,
      expression: String(editingValue.value), // 确保expression是字符串类型
      is_constant: false // 默认为动态表达式
    })

    if (result.result) {
      ElMessage.success('变量赋值成功')

      // 退出编辑模式
      editingVariable.value = null
      editingValue.value = ''

      // 重新加载策略运行时状态以显示更新后的变量
      await loadPolicyRuntime(selectedPolicy.value.name)
    }
  } catch (error) {
    console.error('变量赋值失败:', error)
    ElMessage.error(error.err_msg || '变量赋值失败')
  } finally {
    assignmentLoading.value = false
  }
}

// 自动刷新策略运行时状态
const startAutoRefresh = () => {
  if (autoRefreshTimer.value) {
    clearInterval(autoRefreshTimer.value)
  }
  
  autoRefreshTimer.value = setInterval(async () => {
    if (selectedPolicy.value && !isAutoRefreshing.value) {
      isAutoRefreshing.value = true
      try {
        await loadPolicyRuntime(selectedPolicy.value.name)
      } catch (error) {
        console.warn('自动刷新策略运行时状态失败:', error)
      } finally {
        isAutoRefreshing.value = false
      }
    }
  }, 5000) // 每5秒刷新一次
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (autoRefreshTimer.value) {
    clearInterval(autoRefreshTimer.value)
    autoRefreshTimer.value = null
  }
}

// 刷新数据
const refresh = async () => {
  await loadPolicies()
  if (selectedPolicy.value) {
    loadPolicyRuntime(selectedPolicy.value.name)
  }
}

// 监听农场参数变化
watch(() => props.farmName, async (newFarmName) => {
  if (newFarmName) {
    // 农场切换时重新加载策略列表
    await loadPolicies()
    // 清空当前选中的策略
    selectedPolicy.value = null
    selectedPolicyRuntime.value = null
  }
}, { immediate: false })

// 暴露方法给父组件
defineExpose({
  refresh
})

onMounted(() => {
  loadPolicies()
})

// 组件卸载时清理定时器
onUnmounted(() => {
  stopAutoRefresh()
})

// 处理手动刷新
const handleManualRefresh = () => {
  if (selectedPolicy.value && !isAutoRefreshing.value) {
    loadPolicyRuntime(selectedPolicy.value.name)
  }
}
</script>

<style scoped>
.policy-runtime-status {
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
  flex-shrink: 0;
}

.subsection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0 12px 0;
  flex-shrink: 0;
}

.refresh-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.subsection-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #606266;
}

.refresh-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #909399;
}

.refresh-status .is-loading {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.refresh-text {
  font-size: 12px;
  color: #909399;
}

.policies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  flex-shrink: 0;
}

.policy-card {
  background: white;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.policy-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
  transform: translateY(-2px);
}

.policy-card.selected {
  border-color: #409eff;
  background: #f0f9ff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.policy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.policy-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.policy-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item .label {
  font-size: 14px;
  color: #909399;
}

.info-item .value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.runtime-details {
  margin-top: 24px;
  padding: 24px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
}

.runtime-descriptions {
  margin-bottom: 20px;
}

.variables-section {
  margin-top: 24px;
}

.variables-descriptions {
  margin-top: 12px;
}

.variable-edit-container {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.variable-value-display {
  flex: 1;
  font-family: 'Courier New', monospace;
  background: #f5f7fa;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.variable-value-display:hover {
  background: #e6f7ff;
  border-color: #409eff;
  color: #409eff;
}

.edit-input {
  flex: 1;
}

.variable-actions {
  display: flex;
  gap: 4px;
}

.variable-actions .el-button {
  padding: 4px 8px;
  min-width: auto;
}

.variable-value {
  font-family: 'Courier New', monospace;
  background: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
}

.no-runtime-data {
  text-align: center;
  padding: 40px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .policies-grid {
    grid-template-columns: 1fr;
  }

  .policy-card {
    padding: 16px;
  }
}
</style>
