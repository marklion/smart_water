<template>
  <div class="menu-container">
    <!-- 菜单 -->
    <el-menu :default-active="activeIndex" :mode="mode" router class="menu-bar" :collapse="isCollapsed"
      @select="handleSelect">
      <template v-for="item in menuItems" :key="item.path || item.title">
        <!-- 顶级菜单项（无子菜单） -->
        <el-menu-item v-if="!item.children" :index="item.path" :disabled="!item.path">
          <el-icon v-if="item.icon">
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>

        <!-- 有子菜单的项目 -->
        <el-sub-menu v-else :index="item.title">
          <template #title>
            <el-icon v-if="item.icon">
              <component :is="item.icon" />
            </el-icon>
            <span>{{ item.title }}</span>
          </template>

          <el-menu-item v-for="child in item.children" :key="child.path" :index="child.path">
            <el-icon v-if="child.icon">
              <component :is="child.icon" />
            </el-icon>
            <span>{{ child.title }}</span>
          </el-menu-item>
        </el-sub-menu>
      </template>
    </el-menu>

    <!-- 右侧插槽内容 -->
    <div v-if="mode === 'horizontal'" class="menu-right-slot">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import router from '../router'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 注册所有 Element Plus 图标
import { getCurrentInstance } from 'vue'
const app = getCurrentInstance()
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.appContext.app.component(key, component)
}

// Props
const props = defineProps({
  mode: {
    type: String,
    default: 'vertical' // 'horizontal' | 'vertical'
  },
  collapsed: {
    type: Boolean,
    default: false
  }
})

// 响应式数据
const route = useRoute()
const activeIndex = ref(route.path)
const isCollapsed = ref(props.collapsed)

// 监听路由变化
onMounted(() => {
  activeIndex.value = route.path
})

// 监听路由变化，确保刷新页面后也能正确显示当前路径
watch(() => route.path, (newPath) => {
  activeIndex.value = newPath
}, { immediate: true })

// 计算菜单项
const menuItems = computed(() => {
  const routes = router.getRoutes()
  const role = localStorage.getItem('user_role') || 'farmer'
  const menuMap = new Map()
  const topLevelItems = []

  // 处理所有路由
  routes.forEach(route => {
    if (!route.name || route.meta.hidden) return

    // 角色过滤：如果路由限定角色且当前角色不在允许列表中，则不显示在菜单中
    if (route.meta && Array.isArray(route.meta.allowedRoles) && !route.meta.allowedRoles.includes(role)) {
      return
    }

    const parent = route.meta?.parent
    const icon = route.meta?.icon

    if (!parent) {
      // 顶级菜单项
      topLevelItems.push({
        title: route.name,
        path: route.path,
        icon: icon
      })
    } else {
      // 子菜单项
      if (!menuMap.has(parent)) {
        menuMap.set(parent, {
          title: parent,
          children: [],
          icon: getParentIcon(parent)
        })
      }

      menuMap.get(parent).children.push({
        title: route.name,
        path: route.path,
        icon: icon
      })
    }
  })

  // 过滤掉没有可见子项的父级菜单（例如 farmer 看不到配置中心）
  const groupedMenus = Array.from(menuMap.values()).filter(group => group.children.length > 0)

  // 合并顶级菜单和父级菜单
  const result = [...topLevelItems, ...groupedMenus]

  // 排序：首页在前，其他按字母排序
  return result.sort((a, b) => {
    if (a.title === '首页') return -1
    if (b.title === '首页') return 1
    return a.title.localeCompare(b.title)
  })
})

// 获取父级菜单的图标
function getParentIcon(parentName) {
  const iconMap = {
    '配置中心': 'Setting',
    '监控中心': 'Monitor',
    '数据管理': 'DataLine',
    '报表中心': 'PieChart'
  }
  return iconMap[parentName] || 'Folder'
}

// 处理菜单选择
function handleSelect(index) {
  activeIndex.value = index
}

// 暴露给父组件的方法
defineExpose({
  toggleCollapse: () => {
    isCollapsed.value = !isCollapsed.value
  }
})
</script>

<style scoped>
.menu-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.menu-container:has(.menu-right-slot) {
  flex-direction: row;
  align-items: center;
}

.menu-right-slot {
  display: flex;
  align-items: center;
  margin-left: auto;
  padding: 0 16px;
  height: 100%;
}

.menu-bar {
  height: 100%;
  border-right: solid 1px var(--el-menu-border-color);
  flex: 1;
}

.menu-bar.el-menu--horizontal {
  border-right:none;
  border-bottom: solid 1px var(--el-menu-border-color);
}

.el-menu--collapse {
  width: 64px;
}

.el-menu-item,
.el-sub-menu__title {
  height: 50px;
  line-height: 50px;
}

.el-icon {
  margin-right: 8px;
  width: 16px;
  height: 16px;
}

.el-menu--collapse .el-icon {
  margin-right: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .menu-right-slot {
    padding: 0 12px;
  }
}

@media (max-width: 480px) {
  .menu-right-slot {
    padding: 0 8px;
  }
}
</style>
