<script setup>
import { ref } from 'vue';
import MenuBar from './components/MenuBar.vue'

const menuMode = ref('horizontal') // 'horizontal' | 'vertical'
const isMenuCollapsed = ref(false)

</script>

<template>
  <div class="app-container">
    <!-- 头部工具栏 -->
    <div class="app-header">
      <div class="header-title">智能水务管理系统</div>
      <div class="header-tools">
      </div>
    </div>

    <!-- 菜单和内容区域 -->
    <div class="app-body" :class="{ 'horizontal-layout': menuMode === 'horizontal' }">
      <!-- 菜单栏 -->
      <div
        class="menu-container"
        :class="{
          'vertical-menu': menuMode === 'vertical',
          'horizontal-menu': menuMode === 'horizontal',
          'collapsed': isMenuCollapsed && menuMode === 'vertical'
        }"
      >
        <MenuBar
          :mode="menuMode"
          :collapsed="isMenuCollapsed && menuMode === 'vertical'"
        />
      </div>

      <!-- 主内容区域 -->
      <div class="content-container">
        <router-view />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  height: 98vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-header {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0; /* 防止头部被压缩 */
}

.header-title {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
}

.header-tools {
  display: flex;
  gap: 10px;
}

.app-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0; /* 确保flex子元素可以正确缩放 */
}

/* 水平布局时body为垂直排列 */
.app-body.horizontal-layout {
  flex-direction: column;
}

.menu-container {
  background: #fff;
  flex-shrink: 0; /* 防止菜单被压缩 */
}

/* 垂直菜单样式 */
.menu-container.vertical-menu {
  width: 240px;
  transition: width 0.3s;
  border-right: 1px solid #e4e7ed;
}

.menu-container.vertical-menu.collapsed {
  width: 64px;
}

/* 水平菜单样式 */
.menu-container.horizontal-menu {
  width: 100%;
  height: auto;
  border-bottom: 1px solid #e4e7ed;
}

.content-container {
  flex: 1;
  padding: 20px;
  background: #f5f5f5;
  overflow-y: auto;
  min-height: 0; /* 确保内容区域可以正确滚动 */
}

</style>
