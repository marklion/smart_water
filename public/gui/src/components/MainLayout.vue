<template>
    <el-container class="main-layout">
        <!-- 顶部导航栏 -->
        <el-header class="app-header">
            <div class="header-left">
                <div class="header-title">
                    <img src="/logo.png" alt="Logo" class="system-logo" />
                    <span class="title-text">智能灌溉管理系统</span>
                </div>
            </div>

            <div class="header-tools">
                <!-- 用户信息 -->
                <div v-if="username" class="user-info">
                    <el-dropdown @command="handleCommand">
                        <span class="user-dropdown">
                            <el-avatar :size="32" :icon="UserFilled" class="user-avatar"></el-avatar>
                            <span class="username">{{ username }}</span>
                            <el-icon class="el-icon--right">
                                <arrow-down />
                            </el-icon>
                        </span>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item command="profile" :icon="User">
                                    个人中心
                                </el-dropdown-item>
                                <el-dropdown-item divided command="logout" :icon="SwitchButton">
                                    退出登录
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
            </div>
        </el-header>

        <el-container class="app-body">
            <!-- 顶部菜单栏 (水平模式) -->
            <el-header height="auto" class="menu-header">
                <MenuBar mode="horizontal" :collapsed="false" />
            </el-header>

            <!-- 主内容区域 -->
            <el-main class="content-main">
                <el-scrollbar>
                    <router-view />
                </el-scrollbar>
            </el-main>
        </el-container>
        
        <!-- 底部技术支持信息 -->
        <el-footer v-if="!isDashboard" class="app-footer">
            <div class="tech-support">
                <el-avatar :size="16" :src="logoSrc" class="company-logo"></el-avatar>
                <div class="company-info">
                    <el-text size="small" type="info">北京卓创微朗科技有限公司提供技术支持</el-text>
                </div>
            </div>
            <div class="company-address">
                <el-text size="small" type="info">北京市海淀区高梁桥斜街42号111号</el-text>
            </div>
        </el-footer>
    </el-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
    UserFilled,
    User,
    SwitchButton,
    ArrowDown
} from '@element-plus/icons-vue'
import MenuBar from './MenuBar.vue'

const router = useRouter()
const route = useRoute()

const logoSrc = '/产品 LOGO.jpeg'
const username = ref('')

// 判断是否为数据大屏页面
const isDashboard = computed(() => {
    return route.path === '/dashboard' || route.path === '/web/dashboard'
})

onMounted(() => {
    const storedUsername = localStorage.getItem('username')
    if (storedUsername) {
        username.value = storedUsername
    }
})

const handleCommand = (command) => {
    switch (command) {
        case 'profile':
            // 跳转到个人中心页面
            router.push('/profile')
            break
        case 'logout':
            logout()
            break
    }
}

const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('username')
    router.push('/login')
}
</script>

<style scoped>
.main-layout {
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

.app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    border-bottom: 1px solid var(--el-border-color);
    background: var(--el-bg-color);
    box-shadow: var(--el-box-shadow-light);
}

.header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.header-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.system-logo {
    height: 32px;
    width: auto;
    margin-right: 8px;
}

.title-text {
    font-size: 20px;
    font-weight: 700;
    color: var(--el-color-primary);
    margin: 0;
}

.tech-support {
    display: flex;
    align-items: center;
    gap: 8px;
}

.company-info {
    display: flex;
    align-items: center;
}

.company-address {
    font-size: 12px;
    opacity: 0.8;
}

.app-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 24px;
    border-top: 1px solid var(--el-border-color);
    background: var(--el-bg-color);
    box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.1);
    gap: 4px;
}

.header-tools {
    display: flex;
    align-items: center;
    gap: 16px;
}

.user-info {
    display: flex;
    align-items: center;
}

.user-dropdown {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: var(--el-border-radius-base);
    transition: background-color 0.3s;
}

.user-dropdown:hover {
    background-color: var(--el-color-primary-light-9);
}

.user-avatar {
    background: var(--el-color-primary);
}

.username {
    font-size: 14px;
    color: var(--el-text-color-primary);
    font-weight: 500;
}

.app-body {
    flex: 1;
    overflow: hidden;
}

.menu-header {
    border-bottom: 1px solid var(--el-border-color);
    background: var(--el-bg-color);
    padding: 0;
}

.content-main {
    background: var(--el-bg-color-page);
    padding: 0;
    overflow: hidden;
}

.content-main .el-scrollbar {
    height: 100%;
}

.content-main :deep(.el-scrollbar__view) {
    padding: 24px;
    min-height: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .app-header {
        padding: 0 16px;
    }

    .header-title {
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
    }

    .title-text {
        font-size: 16px;
    }

    .tech-support {
        font-size: 11px;
    }

    .username {
        display: none;
    }
}

@media (max-width: 480px) {
    .tech-support {
        display: none;
    }

    .header-tools {
        gap: 8px;
    }
}
</style>