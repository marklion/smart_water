<template>
    <el-container class="main-layout">
        <!-- 顶部导航栏 -->
        <el-header v-if="!shouldHideHeader" class="app-header">
            <div class="header-left">
                <div class="header-title">
                    <img src="/logo.png" alt="Logo" class="system-logo" />
                    <span class="title-text">{{ systemName }}</span>
                </div>
            </div>

            <div class="header-tools">
                <!-- 时间显示 -->
                <div class="time-display-container">
                    <div class="time-display">{{ currentTime }}</div>
                </div>

                <!-- 城市切换器 -->
                <div class="city-switcher-container" v-if="showCitySwitcher">
                    <span class="selector-label">切换城市：</span>
                    <el-input v-model="cityInput" placeholder="输入城市名，如：北京" class="city-input" size="default" clearable
                        @keyup.enter="handleCityChange" style="width: 150px;" />
                    <el-button type="primary" size="default" @click="handleCityChange" :loading="cityChanging">
                        切换
                    </el-button>
                </div>

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
            <el-header v-if="!shouldHideMenu" height="auto" class="menu-header">
                <MenuBar mode="horizontal" :collapsed="false">
                    <template #right>
                        <!-- 农场选择器 -->
                        <div class="farm-selector-container" v-if="showFarmSelector">
                            <span class="selector-label">选择农场：</span>
                            <el-select v-model="selectedFarm" class="farm-select-main" size="default"
                                @change="onFarmChange">
                                <el-option v-for="farm in farmList" :key="farm.id" :label="farm.name"
                                    :value="farm.id" />
                            </el-select>
                        </div>

                        <div class="date-info">
                            <div class="date-display">{{ currentDate }} {{ currentSolarTerm }}</div>
                        </div>
                    </template>
                </MenuBar>
            </el-header>

            <!-- 主内容区域 -->
            <el-main class="content-main">
                <router-view />
            </el-main>
        </el-container>

        <!-- 底部技术支持信息 -->
        <el-footer v-if="!isDashboard && !shouldHideMenu" class="app-footer">
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
import { ref, onMounted, computed, shallowRef, provide } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
    UserFilled,
    User,
    SwitchButton,
    ArrowDown
} from '@element-plus/icons-vue'
import MenuBar from './MenuBar.vue'
import call_remote from '../../../lib/call_remote.js'
import { getCityLocation, saveMapCenterToStorage } from '../config/mapConfig.js'

const router = useRouter()
const route = useRoute()

const logoSrc = '/产品 LOGO.jpeg'
const username = ref('')
const currentTime = ref('')
const currentDate = ref('')
const currentSolarTerm = ref('')
const systemName = ref('智能灌溉管理系统')

// 农场选择相关
const selectedFarm = ref('')
const farmList = shallowRef([])
const showFarmSelector = computed(() => route.name === '监控中心')

// 城市切换相关
const cityInput = ref('')
const cityChanging = ref(false)
const currentCity = ref('')
const showCitySwitcher = computed(() => route.name === '监控中心')

// 城市变化相关的响应式数据
const cityChangeData = ref({
    city: '',
    location: null,
    timestamp: null
})

// 提供城市变化数据给子组件
provide('cityChangeData', cityChangeData)

// 24节气数据
const solarTerms = [
    { name: '小寒', date: '01-06' },
    { name: '大寒', date: '01-20' },
    { name: '立春', date: '02-04' },
    { name: '雨水', date: '02-19' },
    { name: '惊蛰', date: '03-06' },
    { name: '春分', date: '03-21' },
    { name: '清明', date: '04-05' },
    { name: '谷雨', date: '04-20' },
    { name: '立夏', date: '05-06' },
    { name: '小满', date: '05-21' },
    { name: '芒种', date: '06-06' },
    { name: '夏至', date: '06-22' },
    { name: '小暑', date: '07-07' },
    { name: '大暑', date: '07-23' },
    { name: '立秋', date: '08-08' },
    { name: '处暑', date: '08-23' },
    { name: '白露', date: '09-08' },
    { name: '秋分', date: '09-23' },
    { name: '寒露', date: '10-08' },
    { name: '霜降', date: '10-24' },
    { name: '立冬', date: '11-08' },
    { name: '小雪', date: '11-23' },
    { name: '大雪', date: '12-07' },
    { name: '冬至', date: '12-22' }
]

// 获取当前节气
const getCurrentSolarTerm = (date) => {
    // 找到最接近的节气
    let closestTerm = solarTerms[0]
    let minDiff = Infinity

    for (const term of solarTerms) {
        const termDate = new Date(`${date.getFullYear()}-${term.date}`)
        const diff = Math.abs(date - termDate)

        if (diff < minDiff) {
            minDiff = diff
            closestTerm = term
        }
    }

    return closestTerm.name
}

// 判断是否为数据大屏页面
const isDashboard = computed(() => {
    return route.path === '/dashboard' || route.path === '/web/dashboard'
})

// 判断是否应该隐藏标题栏
const shouldHideHeader = computed(() => {
    return route.meta?.hideHeader === true || route.meta?.hideLayout === true
})

// 判断是否应该隐藏导航栏
const shouldHideMenu = computed(() => {
    return route.meta?.hideMenu === true || route.meta?.hideLayout === true
})

// 更新时间
const updateTime = () => {
    const now = new Date()

    // 格式化时间 HH:MM:SS
    const timeString = now.toLocaleTimeString('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    })
    currentTime.value = timeString
}

// 获取系统名称
const getSystemName = async () => {
    try {
        const response = await fetch('/api/v1/get_sys_name', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        const data = await response.json()
        if (data.err_msg === '' && data.result.sys_name && data.result.sys_name !== 'no name') {
            systemName.value = data.result.sys_name
        }
    } catch (error) {
        console.error('获取系统名称失败:', error)
    }
}

// 更新日期和节气
const updateDateInfo = () => {
    const now = new Date()

    // 格式化日期 年/月/日 星期X
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekDay = weekDays[now.getDay()]
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const dateString = `${year}/${month}/${day}`
    currentDate.value = `${dateString} ${weekDay}`

    // 获取当前节气
    currentSolarTerm.value = getCurrentSolarTerm(now)
}

// 加载农场列表
const loadFarmList = async () => {
    try {
        const response = await call_remote('/resource/list_farm', {})

        if (response && response.farms && Array.isArray(response.farms) && response.farms.length > 0) {
            farmList.value = response.farms.map((farm) => ({
                id: farm.name,
                name: farm.name,
                info: farm.info,
                location: farm.location,
                longitude: farm.longitude,
                latitude: farm.latitude
            }))
            selectedFarm.value = farmList.value[0].id

            // 暴露农场列表到全局，供 DefaultPage 使用
            window.farmList = farmList.value

            // 保存到 localStorage
            localStorage.setItem('selectedFarm', selectedFarm.value)

            // 只有在监控中心页面才触发初始农场数据加载事件
            if (route.name === '监控中心') {
                // 延迟触发，确保 DefaultPage 已经准备好
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('farmChanged', { detail: { farmId: selectedFarm.value } }))
                }, 100)
            }
        } else {
            farmList.value = []
            window.farmList = []
        }
    } catch (error) {
        console.error('加载农场列表失败:', error)
        farmList.value = []
        window.farmList = []
    }
}

// 农场切换处理
const onFarmChange = async (farmId) => {
    // 保存到 localStorage
    localStorage.setItem('selectedFarm', farmId)

    // 触发全局事件，通知监控中心页面农场已切换
    window.dispatchEvent(new CustomEvent('farmChanged', { detail: { farmId } }))
}

// 处理城市切换
const handleCityChange = async () => {
    const city = (cityInput.value || '').trim()
    if (!city) {
        ElMessage.warning('请输入城市名称')
        return
    }

    cityChanging.value = true
    try {
        // 1. 获取城市坐标
        const cityLocation = await getCityLocation(city)

        // 2. 保存到 localStorage
        saveMapCenterToStorage(cityLocation)
        localStorage.setItem('weather_selected_city', city)
        currentCity.value = city

        // 3. 更新响应式数据，通知子组件城市已切换
        cityChangeData.value = {
            city,
            location: cityLocation,
            timestamp: Date.now()
        }

        // 4. 可选：保存到后端
        try {
            await call_remote('/config/set_weather_city', { city })
        } catch (error) {
            console.warn('后端保存城市失败:', error)
        }

        ElMessage.success(`已切换到 ${city}，地图已定位`)
    } catch (error) {
        console.error('城市切换失败:', error)
        ElMessage.error('未能找到该城市，请检查城市名称')
    } finally {
        cityChanging.value = false
    }
}

onMounted(() => {
    const storedUsername = localStorage.getItem('username')
    if (storedUsername) {
        username.value = storedUsername
    }

    // 获取系统名称
    getSystemName()

    // 初始化时间和日期信息
    updateTime()
    updateDateInfo()

    // 加载农场列表
    loadFarmList()

    // 加载保存的城市
    const savedCity = localStorage.getItem('weather_selected_city')
    if (savedCity) {
        currentCity.value = savedCity
    }

    // 每秒更新一次时间
    setInterval(updateTime, 1000)

    // 每分钟更新一次日期信息
    setInterval(updateDateInfo, 60000)
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
    height: 50px;
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
    padding: 2px 24px;
    border-top: 1px solid var(--el-border-color);
    background: var(--el-bg-color);
    box-shadow: none;
    gap: 1px;
    height: 40px;
}

.header-tools {
    display: flex;
    align-items: center;
    gap: 16px;
}

/* Header 中的城市切换器样式 */
.header-tools .city-switcher-container {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: linear-gradient(135deg,
            rgba(64, 158, 255, 0.08) 0%,
            rgba(64, 158, 255, 0.12) 100%);
    border-radius: 8px;
    border: 1px solid rgba(64, 158, 255, 0.2);
    box-shadow:
        0 2px 8px rgba(64, 158, 255, 0.1),
        0 1px 2px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.header-tools .city-switcher-container:hover {
    transform: translateY(-1px);
    box-shadow:
        0 4px 12px rgba(64, 158, 255, 0.15),
        0 2px 4px rgba(0, 0, 0, 0.08);
    border-color: rgba(64, 158, 255, 0.3);
}

.header-tools .selector-label {
    font-size: 14px;
    font-weight: 600;
    color: #409eff;
    white-space: nowrap;
}

.header-tools .city-input {
    min-width: 100px;
}

.time-display-container {
    display: flex;
    align-items: center;
    padding: 12px 24px;
    background: linear-gradient(145deg,
            rgba(64, 158, 255, 0.1) 0%,
            rgba(64, 158, 255, 0.05) 50%,
            rgba(64, 158, 255, 0.15) 100%);
    border-radius: 16px;
    border: 1px solid rgba(64, 158, 255, 0.2);
    box-shadow:
        0 8px 32px rgba(64, 158, 255, 0.15),
        0 2px 8px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.time-display-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent);
    transition: left 0.6s ease;
}

.time-display-container:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow:
        0 12px 40px rgba(64, 158, 255, 0.25),
        0 4px 16px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
    border-color: rgba(64, 158, 255, 0.3);
}

.time-display-container:hover::before {
    left: 100%;
}

.time-display {
    font-size: 20px;
    font-weight: 800;
    color: #1e40af;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace;
    letter-spacing: 3px;
    text-shadow:
        0 2px 4px rgba(0, 0, 0, 0.1),
        0 0 20px rgba(30, 64, 175, 0.3);
    position: relative;
    z-index: 1;
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
    overflow: auto;
    /* 隐藏滚动条 */
    scrollbar-width: none;
    /* Firefox */
    -ms-overflow-style: none;
    /* IE and Edge */
}

.content-main::-webkit-scrollbar {
    display: none;
    /* Chrome, Safari, Opera */
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

    .time-display-container {
        padding: 8px 16px;
        border-radius: 12px;
    }

    .time-display {
        font-size: 16px;
        letter-spacing: 2px;
    }

    .date-info {
        padding: 6px 12px;
        border-radius: 10px;
    }

    .date-display {
        font-size: 14px;
    }

    /* 移动端城市切换器样式 */
    .header-tools .city-switcher-container {
        padding: 4px 8px;
        gap: 6px;
    }

    .header-tools .selector-label {
        font-size: 12px;
    }

    .header-tools .city-input {
        min-width: 80px;
        width: 80px;
    }
}

@media (max-width: 480px) {
    .tech-support {
        display: none;
    }

    .header-tools {
        gap: 8px;
    }

    .time-display-container {
        padding: 6px 12px;
        border-radius: 10px;
    }

    .time-display {
        font-size: 14px;
        letter-spacing: 1.5px;
    }

    .date-info {
        padding: 4px 8px;
        border-radius: 8px;
    }

    .date-display {
        font-size: 12px;
    }
}

/* 农场选择器和城市切换器样式 */
.farm-selector-container,
.city-switcher-container {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-right: 16px;
    padding: 6px 12px;
    background: linear-gradient(135deg,
            rgba(64, 158, 255, 0.08) 0%,
            rgba(64, 158, 255, 0.12) 100%);
    border-radius: 8px;
    border: 1px solid rgba(64, 158, 255, 0.2);
    box-shadow:
        0 2px 8px rgba(64, 158, 255, 0.1),
        0 1px 2px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.farm-selector-container:hover,
.city-switcher-container:hover {
    transform: translateY(-1px);
    box-shadow:
        0 4px 12px rgba(64, 158, 255, 0.15),
        0 2px 4px rgba(0, 0, 0, 0.08);
    border-color: rgba(64, 158, 255, 0.3);
}

.selector-label {
    font-size: 14px;
    font-weight: 600;
    color: #409eff;
    white-space: nowrap;
}

.farm-select-main {
    min-width: 120px;
}

.city-input {
    min-width: 100px;
}

/* 日期信息样式 */
.date-info {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    background: linear-gradient(135deg,
            rgba(16, 185, 129, 0.08) 0%,
            rgba(16, 185, 129, 0.12) 100%);
    border-radius: 12px;
    border: 1px solid rgba(16, 185, 129, 0.2);
    box-shadow:
        0 4px 20px rgba(16, 185, 129, 0.1),
        0 1px 4px rgba(0, 0, 0, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(8px);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.date-info::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg,
            transparent,
            rgba(255, 255, 255, 0.15),
            transparent);
    transition: left 0.5s ease;
}

.date-info:hover {
    transform: translateY(-1px);
    box-shadow:
        0 6px 25px rgba(16, 185, 129, 0.15),
        0 2px 8px rgba(0, 0, 0, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    border-color: rgba(16, 185, 129, 0.3);
}

.date-info:hover::before {
    left: 100%;
}

.date-display {
    font-size: 16px;
    font-weight: 700;
    color: #059669;
    white-space: nowrap;
    font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    text-shadow:
        0 1px 2px rgba(0, 0, 0, 0.1),
        0 0 10px rgba(5, 150, 105, 0.2);
    position: relative;
    z-index: 1;
    letter-spacing: 0.5px;
}
</style>