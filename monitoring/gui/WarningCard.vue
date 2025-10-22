<template>
  <el-card class="warning-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span class="card-title">系统告警</span>
        <el-badge :value="warningData.total" :max="99" class="warning-badge" />
      </div>
    </template>

    <div class="warning-list">
      <el-scrollbar height="300px" v-if="warningData.warnings.length > 0">
        <div class="warning-item" v-for="(warning, index) in warningData.warnings" :key="index">
          <div class="warning-icon">
            <el-icon :size="16" color="#f56c6c">
              <Warning />
            </el-icon>
          </div>
          <div class="warning-content">
            <div class="warning-text">{{ warning.content }}</div>
          </div>
        </div>
      </el-scrollbar>
      <el-empty v-else description="暂无告警信息" :image-size="80" />
    </div>
  </el-card>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { Warning } from '@element-plus/icons-vue'
import call_remote from '../../public/lib/call_remote.js'

// 告警数据
const warningData = reactive({
  warnings: [],
  total: 0
})

// 加载告警数据
const loadWarningData = async () => {
  try {
    const response = await call_remote('/warning/list_warnings', { pageNo: 0 })
    if (response) {
      warningData.warnings = response.warnings || []
      warningData.total = response.total || 0
    }
  } catch (error) {
    console.error('加载告警数据失败:', error)
    warningData.warnings = []
    warningData.total = 0
  }
}

// 刷新告警数据
const refresh = async () => {
  await loadWarningData()
}

// 暴露方法给父组件
defineExpose({
  refresh
})

// 组件挂载时加载数据
onMounted(() => {
  loadWarningData()
})
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  color: #2d3748;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 1;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 18px;
  font-weight: bold;
}

.card-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 24px;
  right: 24px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.5px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.warning-card {
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
  min-height: 350px;
}

.warning-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
  opacity: 0.8;
}

.warning-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.08),
    0 4px 12px rgba(0, 0, 0, 0.04);
  border-color: rgba(102, 126, 234, 0.2);
}

.warning-badge {
  margin-left: auto;
}

.warning-list {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.warning-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  margin-bottom: 8px;
  background: linear-gradient(145deg, #ffffff, #fef5f5);
  border-radius: 8px;
  border-left: 3px solid #f56c6c;
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.1);
  transition: all 0.2s ease;
}

.warning-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.2);
  background: linear-gradient(145deg, #fef5f5, #fff0f0);
}

.warning-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(245, 108, 108, 0.1);
  border-radius: 50%;
  margin-right: 12px;
}

.warning-content {
  flex: 1;
  min-width: 0;
}

.warning-text {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* 响应式告警文字 */
@media (min-width: 1600px) {
  .warning-text {
    font-size: 14px;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .warning-text {
    font-size: 13px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .warning-text {
    font-size: 13px;
  }
}

@media (max-width: 767px) {
  .warning-text {
    font-size: 12px;
  }
  
  .warning-item {
    padding: 10px;
  }
}
</style>
