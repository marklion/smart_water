import call_remote from '../../public/lib/call_remote.js';

export default {
    // 获取今日天气
    get_today_weather: async function (city) {
        return await call_remote('/weather/get_today_weather', { city });
    },
    
    // 获取未来天气
    get_future_weather: async function (city) {
        return await call_remote('/weather/get_future_weather', { city });
    },
    
    // 清除缓存
    clear_cache: async function () {
        return await call_remote('/weather/clear_cache', {});
    },
    
    // 获取API统计
    get_api_stats: async function () {
        return await call_remote('/weather/get_api_stats', {});
    }
};

