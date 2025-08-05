<template>
  <div class="default-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ pageTitle }}</span>
        </div>
      </template>

      <div class="page-content">
        <el-empty
          :description="pageDescription"
          :image-size="200"
        >
          <el-button type="primary">开始使用</el-button>
        </el-empty>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const pageTitle = computed(() => {
  return route.name || '页面'
})

const pageDescription = computed(() => {
  const descriptions = {
    '首页': '欢迎使用智能水务管理系统',
    '设备配置': '在这里可以配置和管理各种设备',
    '策略配置': '在这里可以配置各种策略规则',
    '用户管理': '在这里可以管理系统用户',
    '权限管理': '在这里可以配置用户权限',
    '数据监控': '在这里可以监控系统数据',
    '告警管理': '在这里可以管理系统告警'
  }
  return descriptions[route.name] || `${route.name}功能正在开发中...`
})
</script>

<style scoped>
.default-page {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.page-content {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
