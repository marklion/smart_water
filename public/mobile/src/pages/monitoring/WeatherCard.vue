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

// 获取天气图标
const getWeatherIcon = () => {
  if (!todayWeather.value) return '/weatherIcon/PNG/Weather_sun.png'
  
  const weatherIconMap = {
    'qing': 'Weather_sun.png',
    'yin': 'Weather_cloudy_dark.png',
    'yu': 'Weather_raining.png',
    'yun': 'Weather_cloudy.png',
    'xue': 'Weather_snowing.png',
    '晴': 'Weather_sun.png',
    '多云': 'Weather_cloudy.png',
    '阴': 'Weather_cloudy_dark.png',
    '小雨': 'Weather_raining_day.png',
    '中雨': 'Weather_raining.png',
    '大雨': 'Weather_raining_dark_cloud.png',
    '雪': 'Weather_snowing.png',
    'default': 'Weather_sun.png'
  }
  
  const weaImg = todayWeather.value.wea_img || todayWeather.value.wea || ''
  const iconFile = weatherIconMap[weaImg] || weatherIconMap[todayWeather.value.wea] || weatherIconMap.default
  return `/weatherIcon/PNG/${iconFile}`
}

// 获取天气主题样式类
const getWeatherThemeClass = () => {
  if (!todayWeather.value) return ''
  
  const wea = todayWeather.value.wea || ''
  if (wea.includes('雨') || wea.includes('雷')) {
    return 'weather-rainy'
  } else if (wea.includes('雪')) {
    return 'weather-snowy'
  } else if (wea.includes('晴')) {
    return 'weather-sunny'
  } else if (wea.includes('云') || wea.includes('阴')) {
    return 'weather-cloudy'
  }
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
  background: linear-gradient(135deg, #ff9a56 0%, #ffad56 50%, #ffc356 100%);
}

.weather-card.weather-cloudy {
  background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
}

.weather-card.weather-rainy {
  background: linear-gradient(135deg, #6c5ce7 0%, #5f3dc4 100%);
}

.weather-card.weather-snowy {
  background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%);
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

