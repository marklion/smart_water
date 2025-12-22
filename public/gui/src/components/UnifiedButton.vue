<template>
  <el-button
    :type="buttonType"
    :icon="icon"
    :loading="loading"
    :size="size"
    :disabled="disabled"
    :circle="circle"
    :round="round"
    :plain="plain"
    :class="buttonClass"
    @click="handleClick"
  >
    <slot>{{ text }}</slot>
  </el-button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // 按钮类型：query(查询), reset(重置), export(导出), refresh(刷新), primary(主要), success(成功), warning(警告), danger(危险), info(信息), default(默认)
  variant: {
    type: String,
    default: 'query',
    validator: (value) => ['query', 'reset', 'export', 'refresh', 'primary', 'success', 'warning', 'danger', 'info', 'default'].includes(value)
  },
  // Element Plus 的 type 属性
  type: {
    type: String,
    default: null
  },
  // 图标
  icon: {
    type: [String, Object],
    default: null
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 按钮大小
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['large', 'default', 'small'].includes(value)
  },
  // 禁用状态
  disabled: {
    type: Boolean,
    default: false
  },
  // 圆形按钮
  circle: {
    type: Boolean,
    default: false
  },
  // 圆角按钮
  round: {
    type: Boolean,
    default: false
  },
  // 朴素按钮
  plain: {
    type: Boolean,
    default: false
  },
  // 按钮文本（如果使用插槽则不需要）
  text: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['click'])

// 根据 variant 确定 Element Plus 的 type
const buttonType = computed(() => {
  if (props.type) {
    return props.type
  }
  
  switch (props.variant) {
    case 'query':
      return 'primary'
    case 'export':
      return 'success'
    case 'refresh':
      return 'primary'
    case 'reset':
      return 'default'
    default:
      return props.variant
  }
})

// 根据 variant 确定样式类
const buttonClass = computed(() => {
  return `unified-btn unified-btn-${props.variant}`
})

// 处理点击事件
const handleClick = (event) => {
  emit('click', event)
}
</script>

<style scoped>
/* 统一按钮基础样式 */
.unified-btn {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

/* 默认大小保持原来的 padding */
.unified-btn :deep(.el-button) {
  padding: 10px 20px;
}

/* 查询按钮样式 */
.unified-btn-query {
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.unified-btn-query:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

/* 重置按钮样式 */
.unified-btn-reset {
  transition: all 0.3s ease;
}

.unified-btn-reset:hover {
  transform: translateY(-2px);
  background-color: #f5f7fa;
}

/* 导出按钮样式 */
.unified-btn-export {
  box-shadow: 0 2px 6px rgba(103, 194, 58, 0.3);
}

.unified-btn-export:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.4);
}

/* 主要按钮样式 */
.unified-btn-primary {
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.unified-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

/* 成功按钮样式 */
.unified-btn-success {
  box-shadow: 0 2px 6px rgba(103, 194, 58, 0.3);
}

.unified-btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.4);
}

/* 警告按钮样式 */
.unified-btn-warning {
  box-shadow: 0 2px 6px rgba(230, 162, 60, 0.3);
}

.unified-btn-warning:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.4);
}

/* 危险按钮样式 */
.unified-btn-danger {
  box-shadow: 0 2px 6px rgba(245, 108, 108, 0.3);
}

.unified-btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.4);
}

/* 信息按钮样式 */
.unified-btn-info {
  box-shadow: 0 2px 6px rgba(144, 147, 153, 0.3);
}

.unified-btn-info:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(144, 147, 153, 0.4);
}

/* 刷新按钮样式 */
.unified-btn-refresh {
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.unified-btn-refresh:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

/* 默认按钮样式 */
.unified-btn-default {
  transition: all 0.3s ease;
}

.unified-btn-default:hover {
  transform: translateY(-2px);
  background-color: #f5f7fa;
}

/* 圆形按钮特殊样式 - 保持原有样式 */
.unified-btn :deep(.el-button.is-circle) {
  padding: 0;
}

</style>

