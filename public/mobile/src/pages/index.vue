<template>
<div>
    这里是主页
    {{ content_on_page }}
</div>
</template>

<script setup>
import { ref } from 'vue'
let content_on_page = ref("欢迎使用移动端页面")
</script>

<style lang="scss" scoped>

</style>
