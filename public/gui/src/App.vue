<script setup>
// App.vue 现在只需要作为顶层路由容器
</script>

<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<style scoped>
.app-container {
  height: 100vh;
  width: 100%;
}
</style>
