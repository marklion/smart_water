<template>
  <el-card class="info-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span class="card-title">{{ title }}</span>
        <div class="header-actions" v-if="$slots.actions">
          <slot name="actions"></slot>
        </div>
      </div>
    </template>

    <div class="info-grid">
      <div v-for="item in infoItems" :key="item.key" class="info-item" :class="{ 'highlight': item.highlight }">
        <div class="info-label">{{ item.label }}</div>
        <div class="info-value" :class="item.valueClass">
          {{ item.value }}
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'

// 定义props
const props = defineProps({
  title: {
    type: String,
    default: '基本信息'
  },
  data: {
    type: Object,
    required: true
  },
  items: {
    type: Array,
    default: () => [
      { key: 'waterGroupCount', label: '轮灌组数量', valueClass: '' },
      { key: 'farmArea', label: '农场面积', valueClass: '' },
      { key: 'cropName', label: '作物名称', valueClass: '' },
      { key: 'totalDevices', label: '设备总数量', valueClass: '' },
      { key: 'onlineDevices', label: '在线设备', valueClass: 'online' },
      { key: 'offlineDevices', label: '离线设备', valueClass: 'offline' }
    ]
  }
})

// 计算属性：处理信息项
const infoItems = computed(() => {
  return props.items.map(item => ({
    key: item.key,
    label: item.label,
    value: props.data[item.key] || '-',
    valueClass: item.valueClass || '',
    highlight: item.highlight || false
  }))
})

// 暴露方法给父组件
defineExpose({
  // 可以添加一些方法，比如刷新数据等
})
</script>

<style scoped>
.info-card {
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
}

.info-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
  opacity: 0.8;
}

.info-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.08),
    0 4px 12px rgba(0, 0, 0, 0.04);
  border-color: rgba(102, 126, 234, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

/* 响应式信息网格 */
@media (min-width: 1600px) {
  .info-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 10px;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .info-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .info-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 6px;
  }
}

@media (max-width: 767px) {
  .info-grid {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 6px;
  }
}

.info-item {
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 8px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  text-align: center;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
}

.info-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
}

.info-item:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border-color: rgba(102, 126, 234, 0.2);
}

.info-item.highlight {
  background: linear-gradient(145deg, #e6f7ff, #f0f9ff);
  border-color: rgba(64, 158, 255, 0.3);
}

.info-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  font-weight: 500;
}

.info-value {
  font-size: 18px;
  font-weight: 700;
  color: #409eff;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* 响应式信息值字体 */
@media (min-width: 1600px) {
  .info-value {
    font-size: 20px;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .info-value {
    font-size: 18px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .info-value {
    font-size: 16px;
  }
}

@media (max-width: 767px) {
  .info-value {
    font-size: 14px;
  }
}

.info-value.online {
  color: #67c23a;
}

.info-value.offline {
  color: #f56c6c;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .info-item {
    padding: 6px 10px;
  }

  .card-header {
    padding: 8px 12px;
  }

  .card-title {
    font-size: 16px;
  }
}

@media (max-width: 480px) {

  .info-item,
  .data-item {
    padding: 6px 8px;
  }
}
</style>
