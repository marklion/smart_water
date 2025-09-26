<script setup>
// App.vue 现在只需要作为顶层路由容器
</script>

<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<style>
/* 全局样式 - 固定浏览器滚动条 */
html, body {
  height: 100%;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

#app {
  height: 100vh;
  overflow: hidden;
}
</style>

<style scoped>
.app-container {
  height: 100vh;
  width: 100%;
  overflow: hidden;
}
</style>
