<template>
  <view class="weather-wrapper">
    <view class="weather-card" :class="getWeatherThemeClass()">
      <view class="weather-card-overlay"></view>
      <view class="weather-content">
        <view class="weather-header">
          <text class="weather-title">今日天气</text>
          <view v-if="weatherUpdateTime" class="weather-update">
            <text class="update-text">{{ weatherUpdateTime }}</text>
          </view>
        </view>
        
        <view class="weather-body" v-if="todayWeather">
          <view class="weather-main-section">
            <view class="weather-icon-container">
              <image :src="getWeatherIcon()" class="weather-icon" mode="aspectFit" />
            </view>
            <view class="weather-primary-info">
              <text class="weather-temperature">{{ todayWeather.tem || '--' }}°</text>
              <text class="weather-condition">{{ todayWeather.wea || '未知' }}</text>
              <text class="weather-location">{{ todayWeather.city || '未知' }}</text>
            </view>
          </view>
          
          <view class="weather-details-section">
            <view class="weather-detail-item">
              <text class="detail-label">温度范围</text>
              <text class="detail-value">{{ (todayWeather.tem_day || '--') }}° / {{ (todayWeather.tem_night || '--') }}°</text>
            </view>
            <view class="weather-detail-item">
              <text class="detail-label">风力</text>
              <text class="detail-value">{{ (todayWeather.win || '--') }} {{ (todayWeather.win_speed || '--') }}</text>
            </view>
            <view class="weather-detail-item">
              <text class="detail-label">湿度</text>
              <text class="detail-value">{{ (todayWeather.humidity || '--') }}%</text>
            </view>
            <view class="weather-detail-item">
              <text class="detail-label">气压</text>
              <text class="detail-value">{{ (todayWeather.pressure || '--') }}hPa</text>
            </view>
            <view class="weather-detail-item">
              <text class="detail-label">空气质量</text>
              <text class="detail-value">{{ todayWeather.air || todayWeather.air_level || '--' }}</text>
            </view>
          </view>
        </view>
        
        <view v-else class="weather-loading">
          <text class="loading-text">加载天气数据中...</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import call_remote from '../../../../lib/call_remote.js'

const todayWeather = ref(null)
const weatherUpdateTime = ref('')

// 加载当日天气预报
const loadTodayWeather = async () => {
  try {
    const result = await call_remote('/weather/get_today_weather', {})
    console.log('天气预报接口返回:', result)
    
    let weatherData = null
    
    if (result) {
      if (result.weather_data) {
        weatherData = result.weather_data
      } else if (result.tem || result.wea || result.city) {
        weatherData = result
      }
    }
    
    if (weatherData) {
      todayWeather.value = weatherData
      weatherUpdateTime.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
      console.log('天气预报数据已加载:', todayWeather.value)
    } else {
      console.warn('天气预报数据结构不匹配:', result)
      todayWeather.value = null
    }
  } catch (error) {
    console.error('加载天气预报失败:', error)
    todayWeather.value = null
  }
}

// 天气图标映射 - 支持中文描述和英文代码（与PC端保持一致）
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

// 获取天气图标
const getWeatherIcon = () => {
  if (!todayWeather.value) return `/static/weatherIcon/PNG/${weatherIconMap.default}`
  
  const weaImg = todayWeather.value.wea_img || ''
  const weaDesc = todayWeather.value.wea || ''
  
  // 优先使用英文代码，如果没有则使用中文描述
  let iconFile = weatherIconMap[weaImg]
  if (!iconFile && weaDesc) {
    iconFile = weatherIconMap[weaDesc]
  }
  iconFile = iconFile || weatherIconMap.default
  
  return `/static/weatherIcon/PNG/${iconFile}`
}

// 获取天气主题样式类（与PC端保持一致）
const getWeatherThemeClass = () => {
  if (!todayWeather.value) return 'weather-default'
  
  const weatherDesc = todayWeather.value.wea || ''
  const weatherCode = todayWeather.value.wea_img || ''
  
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
    } else if (['xue', 'bingbao'].includes(weatherCode)) {
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

onMounted(() => {
  loadTodayWeather()
})
</script>

<style lang="scss" scoped>
.weather-wrapper {
  padding: 32rpx;
}

.weather-card {
  background: linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%);
  border-radius: 32rpx;
  padding: 40rpx;
  color: white;
  box-shadow: 
    0 16rpx 64rpx rgba(0, 0, 0, 0.15),
    0 8rpx 32rpx rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  min-height: 360rpx;
}

.weather-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-radius: 32rpx;
  pointer-events: none;
}

.weather-card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-radius: 32rpx;
  pointer-events: none;
  z-index: 1;
}

.weather-content {
  position: relative;
  z-index: 2;
}

.weather-card.weather-sunny {
  background: linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%);
}

.weather-card.weather-partly-cloudy {
  background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
}

.weather-card.weather-cloudy {
  background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%);
}

.weather-card.weather-rainy {
  background: linear-gradient(135deg, #00b894 0%, #00a085 100%);
}

.weather-card.weather-snowy {
  background: linear-gradient(135deg, #e17055 0%, #d63031 100%);
}

.weather-card.weather-default {
  background: linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%);
}

.weather-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.weather-title {
  font-size: 36rpx;
  font-weight: 700;
  color: white;
  text-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.2);
}

.weather-update {
  background: rgba(255, 255, 255, 0.2);
  padding: 8rpx 16rpx;
  border-radius: 24rpx;
  backdrop-filter: blur(20rpx);
}

.update-text {
  font-size: 22rpx;
  color: white;
  opacity: 0.9;
}

.weather-body {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.weather-main-section {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.weather-icon-container {
  position: relative;
}

.weather-icon {
  width: 128rpx;
  height: 128rpx;
  filter: drop-shadow(0 8rpx 16rpx rgba(0, 0, 0, 0.2));
}

.weather-primary-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  flex: 1;
}

.weather-temperature {
  font-size: 72rpx;
  font-weight: 800;
  line-height: 1;
  text-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.3);
  color: white;
}

.weather-condition {
  font-size: 32rpx;
  font-weight: 600;
  color: white;
  opacity: 0.95;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
}

.weather-location {
  font-size: 24rpx;
  color: white;
  opacity: 0.85;
}

.weather-details-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  margin-top: 8rpx;
}

.weather-detail-item {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20rpx);
  border-radius: 20rpx;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.detail-label {
  font-size: 22rpx;
  color: white;
  opacity: 0.9;
  font-weight: 500;
}

.detail-value {
  font-size: 28rpx;
  color: white;
  font-weight: 700;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
}

.weather-loading {
  padding: 60rpx 0;
  text-align: center;
}

.loading-text {
  font-size: 28rpx;
  color: white;
  opacity: 0.8;
}
</style>

