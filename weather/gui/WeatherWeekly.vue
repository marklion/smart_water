<template>
    <div class="weather-weekly-container">
        <div class="weather-horizontal-layout">
            <!-- 今天天气 -->
            <div class="today-weather" 
                 :class="currentWeather ? getWeatherTheme(currentWeather.wea, currentWeather.wea_img) : ''">
                <div class="today-header">
                    <span>今日天气</span>
                    <span class="update-time" v-if="updateTime">{{ updateTime }}</span>
                </div>
                <div class="today-content">
                    <div class="today-main">
                        <img :src="getCurrentWeatherIcon()" :alt="currentWeather?.wea || '天气'" class="today-icon" />
                        <div class="today-info">
                            <div class="today-temp">{{ currentWeather?.tem || '--' }}°</div>
                            <div class="today-desc">{{ currentWeather?.wea || '多云' }}</div>
                            <div class="today-city">{{ currentWeather?.city || '呼和浩特' }}</div>
                        </div>
                    </div>
                    <div class="today-details">
                        <div class="detail-row">
                            <span>{{ currentWeather?.tem_day || '--' }}° / {{ currentWeather?.tem_night || '--' }}°</span>
                        </div>
                        <div class="detail-row">
                            <span>{{ currentWeather?.win || '--' }} {{ currentWeather?.win_speed || '--' }}</span>
                        </div>
                        <div class="detail-row">
                            <span>湿度 {{ currentWeather?.humidity || '--' }}</span>
                        </div>
                        <div class="detail-row">
                            <span>气压 {{ currentWeather?.pressure || '--' }}hPa</span>
                        </div>
                        <div class="detail-row">
                            <span>空气质量 {{ currentWeather?.air || '--' }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 未来6天天气 -->
            <div class="future-weather">
                <div class="future-list">
                    <div v-for="(day, index) in weeklyData" :key="index" 
                         class="future-item"
                         :class="getWeatherTheme(day.wea, day.wea_img)">
                        <div class="future-date">{{ formatShortDate(day.date) }}</div>
                        <img :src="getWeatherIcon(day.wea_img)" :alt="day.wea" class="future-icon" />
                        <div class="future-temp">
                            <span class="temp-high">{{ day.tem_day }}°</span>
                            <span class="temp-low">{{ day.tem_night }}°</span>
                        </div>
                        <div class="future-desc">{{ day.wea }}</div>
                        <div class="future-wind">
                            <div class="wind-info">{{ day.win }}</div>
                            <div class="wind-speed">{{ day.win_speed }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import call_remote from '../../public/lib/call_remote.js'

const weeklyData = ref([])
const currentWeather = ref(null)
const loading = ref(false)
let autoRefreshTimer = null

// 天气图标映射 - 支持中文描述和英文代码
const weatherIconMap = {
    // 英文代码映射
    'qing': 'Weather_sun.png',
    'yin': 'Weather_cloudy_dark.png',
    'yu': 'Weather_raining.png',
    'yun': 'Weather_cloudy.png',
    'bingbao': 'Weather_snow.png',
    'wu': 'Weather_clouds.png',
    'shachen': 'Weather_wind.png',
    'lei': 'Weather_lightning.png',
    'xue': 'Weather_snowing.png',
    'xiayu': 'Weather_raining_day.png',
    'zhongyu': 'Weather_raining.png',
    'dayu': 'Weather_raining_dark_cloud.png',
    'xiaoyu': 'Weather_raining_day.png',
    'zhenyu': 'Weather_cloudy_raining_day.png',
    'leizhenyu': 'Weather_thunderstorm.png',

    // 中文描述映射
    '晴': 'Weather_sun.png',
    '多云': 'Weather_cloudy.png',
    '阴': 'Weather_cloudy_dark.png',
    '小雨': 'Weather_raining_day.png',
    '中雨': 'Weather_raining.png',
    '大雨': 'Weather_raining_dark_cloud.png',
    '阵雨': 'Weather_cloudy_raining_day.png',
    '雷阵雨': 'Weather_thunderstorm.png',
    '雪': 'Weather_snowing.png',
    '小雪': 'Weather_snowing_day.png',
    '中雪': 'Weather_snowing.png',
    '大雪': 'Weather_snowing_dark_cloud.png',
    '雾': 'Weather_clouds.png',
    '雷电': 'Weather_lightning.png',
    '冰雹': 'Weather_snow.png',
    '沙尘暴': 'Weather_wind.png',

    'default': 'Weather_sun.png'
}

const getWeatherIcon = (weatherImg, weatherDesc = null) => {
    let iconFile = weatherIconMap[weatherImg]
    if (!iconFile && weatherDesc) {
        iconFile = weatherIconMap[weatherDesc]
    }
    iconFile = iconFile || weatherIconMap.default
    return `/weatherIcon/PNG/${iconFile}`
}

const getCurrentWeatherIcon = () => {
    if (!currentWeather.value) return `/weatherIcon/PNG/${weatherIconMap.default}`
    return getWeatherIcon(currentWeather.value.wea_img, currentWeather.value.wea)
}

// 格式化日期显示
const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
}

// 格式化短日期显示
const formatShortDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    if (date.toDateString() === tomorrow.toDateString()) {
        return '明天'
    }
    
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return `周${weekdays[date.getDay()]}`
}

// 根据天气状况获取主题样式
const getWeatherTheme = (weatherDesc, weatherCode) => {
    // 优先根据中文描述判断
    if (weatherDesc) {
        if (weatherDesc.includes('雨') || weatherDesc.includes('雷')) {
            return 'weather-rainy'
        } else if (weatherDesc.includes('雪') || weatherDesc.includes('冰')) {
            return 'weather-snowy'
        } else if (weatherDesc.includes('阴') || weatherDesc.includes('雾')) {
            return 'weather-cloudy'
        } else if (weatherDesc.includes('晴')) {
            return 'weather-sunny'
        } else if (weatherDesc.includes('多云')) {
            return 'weather-partly-cloudy'
        }
    }
    
    // 备用：根据英文代码判断
    if (weatherCode) {
        if (['yu', 'lei', 'leizhenyu', 'xiayu', 'zhongyu', 'dayu', 'zhenyu'].includes(weatherCode)) {
            return 'weather-rainy'
        } else if (['xue'].includes(weatherCode)) {
            return 'weather-snowy'
        } else if (['yin', 'wu'].includes(weatherCode)) {
            return 'weather-cloudy'
        } else if (['qing'].includes(weatherCode)) {
            return 'weather-sunny'
        } else if (['yun'].includes(weatherCode)) {
            return 'weather-partly-cloudy'
        }
    }
    
    // 默认主题
    return 'weather-default'
}

// 更新时间
const updateTime = computed(() => {
    if (!currentWeather.value?.update_time) return ''
    return `更新于 ${currentWeather.value.update_time}`
})

// 获取今日天气数据（实时温度）- 调用后端接口
const fetchTodayWeather = async () => {
    try {
        const result = await call_remote('/weather/get_today_weather', { city: '呼和浩特' })
        console.log('后端今日天气响应:', result)

        if (result.weather_data) {
            currentWeather.value = result.weather_data
            console.log('今日天气数据加载成功')
            console.log('今日天气数据字段:', Object.keys(result.weather_data))
            console.log('tem_day:', result.weather_data.tem_day)
            console.log('tem_night:', result.weather_data.tem_night)
            ElMessage.success('今日天气数据获取成功')
        } else {
            throw new Error('今日天气数据获取失败')
        }
    } catch (error) {
        console.error('获取今日天气失败:', error)
        // 使用演示数据
        currentWeather.value = generateTodayDemoData()
        ElMessage.warning('今日天气使用演示数据')
    }
}

// 获取未来6天天气数据 - 调用后端接口
const fetchWeeklyWeather = async () => {
    try {
        const result = await call_remote('/weather/get_future_weather', { city: '呼和浩特' })
        console.log('后端未来天气响应:', result)

        if (result.future_weather && Array.isArray(result.future_weather)) {
            weeklyData.value = result.future_weather
            console.log('未来天气数据加载成功，共', result.future_weather.length, '天')
            ElMessage.success('未来天气预报数据获取成功')
        } else {
            throw new Error('未来天气数据获取失败')
        }
    } catch (error) {
        console.error('获取未来天气失败:', error)
        // 使用演示数据
        weeklyData.value = generateFutureDemoData()
        ElMessage.warning('未来天气使用演示数据')
    }
}

// 获取所有天气数据
const fetchAllWeatherData = async () => {
    loading.value = true

    try {
        // 并行获取今日和未来天气数据
        await Promise.all([
            fetchTodayWeather(),
            fetchWeeklyWeather()
        ])
    } finally {
        loading.value = false
    }
}

// 生成今日天气演示数据 - 根据实际API数据结构
const generateTodayDemoData = () => {
    return {
        nums: 5,
        cityid: "101080101",
        city: "呼和浩特",
        date: "2025-09-11",
        week: "星期四",
        update_time: "14:40",
        wea: "晴",
        wea_img: "qing",
        tem: "26",          // 实时温度
        tem_day: "27",      // 最高温度
        tem_night: "14",    // 最低温度
        win: "西风",
        win_speed: "1级",
        win_meter: "5km/h",
        air: "43",
        pressure: "894",
        humidity: "57%"
    }
}

// 生成未来6天演示数据 - 一周接口格式
const generateFutureDemoData = () => {
    const weathers = ['小雨', '小雨', '多云转晴', '晴转多云', '小雨转多云', '多云转晴']
    const weatherCodes = ['yu', 'yu', 'yun', 'yun', 'yun', 'yun']
    const today = new Date()

    return Array.from({ length: 6 }, (_, index) => {
        const date = new Date(today)
        date.setDate(today.getDate() + index + 1) // 从明天开始

        return {
            date: date.toISOString().split('T')[0],
            wea: weathers[index],
            wea_img: weatherCodes[index],
            tem_day: (26 - index * 1).toString(),
            tem_night: (14 - Math.floor(index / 2)).toString(),
            win: ['西南风', '南风', '西南风', '西南风', '南风', '西北风'][index],
            win_speed: ['3-4级转<3级', '3-4级转<3级', '3-4级转<3级', '<3级', '<3级', '<3级'][index]
        }
    })
}

// 设置智能刷新 - 配合后端缓存策略，减少API调用
const setupAutoRefresh = () => {
    if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer)
    }

    // 智能刷新策略：根据时间段调整刷新频率
    const getRefreshInterval = () => {
        const hour = new Date().getHours();

        // 白天(6-22点): 每30分钟刷新一次
        if (hour >= 6 && hour <= 22) {
            return 30 * 60 * 1000; // 30分钟
        }
        // 夜间(22-6点): 每2小时刷新一次
        else {
            return 2 * 60 * 60 * 1000; // 2小时
        }
    };

    const refresh = () => {
        console.log('自动刷新天气数据...')
        fetchAllWeatherData()

        // 重新设置定时器，适应时间段变化
        setupAutoRefresh()
    };

    const interval = getRefreshInterval();
    console.log(`设置自动刷新间隔: ${interval / 1000 / 60}分钟`)

    autoRefreshTimer = setTimeout(refresh, interval)
}

onMounted(() => {
    console.log('天气组件已挂载')
    fetchAllWeatherData()
    setupAutoRefresh()
})

onUnmounted(() => {
    if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer)
        autoRefreshTimer = null
        console.log('一周天气自动刷新定时器已清除')
    }
})
</script>

<style scoped>
.weather-weekly-container {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 16px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.weather-horizontal-layout {
    display: flex;
    gap: 16px;
    align-items: stretch;
    height: 200px;
}

/* 今日天气 */
.today-weather {
    flex: 0 0 300px;
    border-radius: 12px;
    padding: 16px;
    color: white;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

/* 今日天气默认背景（如果没有数据时使用） */
.today-weather:not([class*="weather-"]) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 移除今日天气背景动画，保持简洁 */

.today-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 600;
}

.update-time {
    font-size: 10px;
    opacity: 0.8;
    font-weight: normal;
}

.today-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.today-main {
    display: flex;
    align-items: center;
    gap: 12px;
}

.today-icon {
    width: 80px;
    height: 80px;
    object-fit: contain;
}

.today-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.today-temp {
    font-size: 42px;
    font-weight: 800;
    line-height: 1;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.today-desc {
    font-size: 16px;
    opacity: 0.9;
    font-weight: 500;
}

.today-city {
    font-size: 12px;
    opacity: 0.8;
    font-weight: 400;
}

.today-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex-shrink: 0;
}

.detail-row {
    font-size: 13px;
    opacity: 0.9;
    white-space: nowrap;
    font-weight: 500;
    text-align: right;
}

/* 未来天气 */
.future-weather {
    flex: 1;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    align-items: center;
}

.future-list {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
    width: 100%;
    height: 100%;
}

.future-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    padding: 8px 6px;
    border-radius: 8px;
    transition: all 0.3s ease;
    text-align: center;
    height: 100%;
    min-width: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    color: white;
}

/* 基于天气状况的动态背景 */
.weather-sunny {
    background: linear-gradient(135deg, #f7b733 0%, #fc4a1a 100%); /* 橙黄色 - 阳光明媚 */
}

.weather-partly-cloudy {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* 蓝紫色 - 多云 */
}

.weather-cloudy {
    background: linear-gradient(135deg, #757f9a 0%, #d7dde8 100%); /* 灰色系 - 阴天 */
}

.weather-rainy {
    background: linear-gradient(135deg, #4b79a1 0%, #283e51 100%); /* 深蓝灰 - 雨天 */
}

.weather-snowy {
    background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%); /* 浅蓝白 - 雪天 */
    color: #333 !important; /* 雪天背景较浅，使用深色文字 */
}

.weather-snowy .future-date,
.weather-snowy .temp-high,
.weather-snowy .future-desc,
.weather-snowy .wind-info {
    color: #333 !important;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}

.weather-snowy .temp-low,
.weather-snowy .wind-speed {
    color: #666 !important;
}

/* 今日天气雪天主题文字颜色 */
.today-weather.weather-snowy {
    color: #333 !important;
}

.today-weather.weather-snowy .today-header,
.today-weather.weather-snowy .today-temp,
.today-weather.weather-snowy .today-desc,
.today-weather.weather-snowy .today-city,
.today-weather.weather-snowy .detail-row {
    color: #333 !important;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}

.today-weather.weather-snowy .update-time {
    color: #666 !important;
}

.weather-default {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); /* 默认绿色 */
}

/* 移除未来天气背景动画，保持简洁 */

.future-item:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.future-date {
    font-size: 12px;
    font-weight: 600;
    color: white;
    line-height: 1;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.future-icon {
    width: 32px;
    height: 32px;
    object-fit: contain;
    flex-shrink: 0;
}

.future-temp {
    display: flex;
    flex-direction: column;
    gap: 2px;
    line-height: 1;
}

.temp-high {
    font-size: 16px;
    font-weight: 700;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.temp-low {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
}

.future-desc {
    font-size: 11px;
    color: white;
    line-height: 1.1;
    font-weight: 500;
    word-break: break-all;
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: 0.9;
}

.future-wind {
    display: flex;
    flex-direction: column;
    gap: 1px;
    line-height: 1;
}

.wind-info {
    font-size: 10px;
    color: white;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: 0.9;
}

.wind-speed {
    font-size: 9px;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* 响应式设计 */
@media (max-width: 1200px) {
    .future-list {
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
    }

    .future-item {
        padding: 8px 6px;
        gap: 6px;
    }

    .future-icon {
        width: 28px;
        height: 28px;
    }
}

@media (max-width: 768px) {
    .weather-weekly-container {
        padding: 12px;
    }

    .weather-horizontal-layout {
        flex-direction: column;
        gap: 12px;
    }

    .today-weather {
        flex: none;
    }

    .today-content {
        flex-direction: column;
        gap: 12px;
    }

    .today-main {
        justify-content: center;
    }

    .today-details {
        flex-direction: row;
        justify-content: space-around;
        gap: 12px;
    }

    .future-list {
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
    }

    .future-item {
        padding: 8px 4px;
        gap: 4px;
    }

    .future-icon {
        width: 24px;
        height: 24px;
    }

    .today-icon {
        width: 40px;
        height: 40px;
    }

    .today-temp {
        font-size: 28px;
    }
}

@media (max-width: 480px) {
    .future-list {
        grid-template-columns: repeat(2, 1fr);
    }

    .today-details {
        flex-direction: column;
        gap: 4px;
    }

    .detail-row {
        text-align: center;
    }
}

/* 加载动画 */
.future-item {
    animation: fadeInUp 0.5s ease-out;
}

.future-item:nth-child(1) {
    animation-delay: 0.1s;
}

.future-item:nth-child(2) {
    animation-delay: 0.2s;
}

.future-item:nth-child(3) {
    animation-delay: 0.3s;
}

.future-item:nth-child(4) {
    animation-delay: 0.4s;
}

.future-item:nth-child(5) {
    animation-delay: 0.5s;
}

.future-item:nth-child(6) {
    animation-delay: 0.6s;
}

.today-weather {
    animation: fadeInLeft 0.6s ease-out;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeInLeft {
    from {
        opacity: 0;
        transform: translateX(-30px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}

/* 移除旋转动画，保持页面简洁 */
</style>
