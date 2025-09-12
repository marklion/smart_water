import fetch from 'node-fetch';

const WEATHER_CONFIG = {
    appid: '81915193',
    appsecret: 'Jpmg6Qza',
    unescape: '1',
    baseUrl: 'https://v1.yiketianqi.com/free',
    defaultCity: '呼和浩特'
};

let weatherCache = {
    today: { data: null, timestamp: 0 },
    weekly: { data: null, timestamp: 0 }
};

let apiCallStats = {
    today: { count: 0, date: new Date().toDateString() },
    weekly: { count: 0, date: new Date().toDateString() }
};

const DAILY_API_LIMIT = {
    today: 50,  
    weekly: 20
};

const getCacheDuration = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 22) {
        return 2 * 60 * 60 * 1000; // 2小时
    }
    else {
        return 6 * 60 * 60 * 1000; // 6小时
    }
};

// 检查缓存是否有效
function isCacheValid(cacheItem) {
    if (!cacheItem.data) return false;
    
    const cacheDuration = getCacheDuration();
    const isValid = (Date.now() - cacheItem.timestamp) < cacheDuration;
    
    if (!isValid) {
        console.log('缓存已过期，需要重新获取天气数据');
    } else {
        const remainingTime = Math.round((cacheDuration - (Date.now() - cacheItem.timestamp)) / 1000 / 60);
        console.log(`使用缓存数据，剩余有效时间: ${remainingTime}分钟`);
    }
    
    return isValid;
}

function checkApiLimit(apiType) {
    const today = new Date().toDateString();
    const stats = apiCallStats[apiType];
    
    // 如果是新的一天，重置计数器
    if (stats.date !== today) {
        stats.count = 0;
        stats.date = today;
        console.log(`${apiType} API调用计数器已重置（新的一天）`);
    }

    if (stats.count >= DAILY_API_LIMIT[apiType]) {
        console.warn(`${apiType} API今日调用次数已达上限 (${stats.count}/${DAILY_API_LIMIT[apiType]})`);
        return false;
    }
    
    return true;
}

function recordApiCall(apiType) {
    const today = new Date().toDateString();
    const stats = apiCallStats[apiType];
    
    if (stats.date !== today) {
        stats.count = 1;
        stats.date = today;
    } else {
        stats.count++;
    }
    
    console.log(`${apiType} API调用次数: ${stats.count}/${DAILY_API_LIMIT[apiType]} (今日剩余: ${DAILY_API_LIMIT[apiType] - stats.count})`);
}

function getApiStats() {
    const today = new Date().toDateString();
    return {
        today: {
            count: apiCallStats.today.date === today ? apiCallStats.today.count : 0,
            limit: DAILY_API_LIMIT.today,
            remaining: DAILY_API_LIMIT.today - (apiCallStats.today.date === today ? apiCallStats.today.count : 0)
        },
        weekly: {
            count: apiCallStats.weekly.date === today ? apiCallStats.weekly.count : 0,
            limit: DAILY_API_LIMIT.weekly,
            remaining: DAILY_API_LIMIT.weekly - (apiCallStats.weekly.date === today ? apiCallStats.weekly.count : 0)
        }
    };
}

// 获取今日天气
async function getTodayWeather(city = WEATHER_CONFIG.defaultCity) {
    const cacheKey = `today_${city}`;
    
    // 检查缓存
    if (isCacheValid(weatherCache.today)) {
        return weatherCache.today.data;
    }
    
    // 检查API调用次数限制
    if (!checkApiLimit('today')) {
        console.warn('今日天气API调用次数已达上限，返回缓存数据');
        if (weatherCache.today.data) {
            return weatherCache.today.data;
        } else {
            throw new Error('API调用次数已达上限且无缓存数据');
        }
    }
    
    try {
        const url = `${WEATHER_CONFIG.baseUrl}/day?appid=${WEATHER_CONFIG.appid}&appsecret=${WEATHER_CONFIG.appsecret}&unescape=${WEATHER_CONFIG.unescape}&city=${encodeURIComponent(city)}`;
        console.log('请求今日天气:', url);
        
        // 记录API调用
        recordApiCall('today');
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('今日天气API响应:', data);
        
        if (data && data.city) {
            // 缓存数据
            weatherCache.today = {
                data: data,
                timestamp: Date.now()
            };
            return data;
        } else {
            throw new Error(data.errmsg || '今日天气数据格式错误');
        }
    } catch (error) {
        console.error('获取今日天气失败:', error);
        throw error;
    }
}

// 获取一周天气
async function getWeeklyWeather(city = WEATHER_CONFIG.defaultCity) {
    const cacheKey = `weekly_${city}`;
    
    // 检查缓存
    if (isCacheValid(weatherCache.weekly)) {
        return weatherCache.weekly.data;
    }
    
    // 检查API调用次数限制
    if (!checkApiLimit('weekly')) {
        console.warn('一周天气API调用次数已达上限，返回缓存数据');
        if (weatherCache.weekly.data) {
            return weatherCache.weekly.data;
        } else {
            throw new Error('API调用次数已达上限且无缓存数据');
        }
    }
    
    try {
        const url = `${WEATHER_CONFIG.baseUrl}/week?appid=${WEATHER_CONFIG.appid}&appsecret=${WEATHER_CONFIG.appsecret}&unescape=${WEATHER_CONFIG.unescape}&city=${encodeURIComponent(city)}`;
        console.log('请求一周天气:', url);

        recordApiCall('weekly');
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('一周天气API响应:', data);
        
        if (data && data.data && Array.isArray(data.data)) {
            // 去掉第一天（今天），只返回未来6天
            const futureData = {
                ...data,
                data: data.data.slice(1)
            };
            
            // 缓存数据
            weatherCache.weekly = {
                data: futureData,
                timestamp: Date.now()
            };
            return futureData;
        } else {
            throw new Error(data.errmsg || '一周天气数据格式错误');
        }
    } catch (error) {
        console.error('获取一周天气失败:', error);
        throw error;
    }
}
async function getCompleteWeather(city = WEATHER_CONFIG.defaultCity) {
    try {
        const [todayData, weeklyData] = await Promise.all([
            getTodayWeather(city),
            getWeeklyWeather(city)
        ]);
        
        return {
            today: todayData,
            future: weeklyData.data,
            city: todayData.city,
            update_time: todayData.update_time
        };
    } catch (error) {
        console.error('获取完整天气数据失败:', error);
        throw error;
    }
}
function clearWeatherCache() {
    weatherCache = {
        today: { data: null, timestamp: 0 },
        weekly: { data: null, timestamp: 0 }
    };
    console.log('天气缓存已清除');
}
export default {
    name: 'weather',
    description: '天气管理',
    methods: {
        get_today_weather: {
            name: '获取今日天气',
            description: '获取指定城市的今日实时天气数据',
            is_write: false,
            is_get_api: false,
            params: {
                city: { type: String, mean: '城市名称', example: '呼和浩特', have_to: false }
            },
            result: {
                weather_data: { 
                    type: Object, 
                    mean: '今日天气数据',
                    explain: {
                        city: { type: String, mean: '城市名称', example: '呼和浩特' },
                        tem: { type: String, mean: '实时温度', example: '25.8' },
                        wea: { type: String, mean: '天气状况', example: '多云' },
                        humidity: { type: String, mean: '湿度', example: '41%' },
                        win: { type: String, mean: '风向', example: '西南风' },
                        win_speed: { type: String, mean: '风速', example: '<3级' },
                        win_meter: { type: String, mean: '风速', example: '5km/h' },
                        air: { type: String, mean: '空气质量', example: '43' },
                        pressure: { type: String, mean: '气压', example: '894' },
                        tem_day: { type: String, mean: '最高温度', example: '27' },
                        tem_night: { type: String, mean: '最低温度', example: '14' },
                    }
                }
            },
            func: async function (body, token) {
                try {
                    const city = body.city || WEATHER_CONFIG.defaultCity;
                    const data = await getTodayWeather(city);
                    return { weather_data: data };
                } catch (error) {
                    throw { err_msg: error.message };
                }
            }
        },
        get_future_weather: {
            name: '获取未来天气',
            description: '获取指定城市的未来6天天气预报数据',
            is_write: false,
            is_get_api: false,
            params: {
                city: { type: String, mean: '城市名称', example: '呼和浩特', have_to: false }
            },
            result: {
                future_weather: { 
                    type: Array, 
                    mean: '未来6天天气数据',
                    explain: {
                        date: { type: String, mean: '日期', example: '2025-09-11' },
                        wea: { type: String, mean: '天气状况', example: '小雨' },
                        tem_day: { type: String, mean: '最高温度', example: '26' },
                        tem_night: { type: String, mean: '最低温度', example: '14' },
                        win: { type: String, mean: '风向', example: '西南风' },
                        win_speed: { type: String, mean: '风速', example: '3-4级转<3级' }
                    }
                }
            },
            func: async function (body, token) {
                try {
                    const city = body.city || WEATHER_CONFIG.defaultCity;
                    const data = await getWeeklyWeather(city);
                    return { future_weather: data.data };
                } catch (error) {
                    throw { err_msg: error.message };
                }
            }
        },
        get_complete_weather: {
            name: '获取完整天气数据',
            description: '获取指定城市的今日实时天气和未来6天预报数据',
            is_write: false,
            is_get_api: false,
            params: {
                city: { type: String, mean: '城市名称', example: '呼和浩特', have_to: false }
            },
            result: {
                complete_weather: { 
                    type: Object, 
                    mean: '完整天气数据',
                    explain: {
                        today: { type: String, mean: '今日天气JSON字符串', example: '{}' },
                        future: { type: String, mean: '未来6天天气JSON字符串', example: '[]' },
                        city: { type: String, mean: '城市名称', example: '呼和浩特' },
                        update_time: { type: String, mean: '更新时间', example: '2025-09-10 18:16:06' }
                    }
                }
            },
            func: async function (body, token) {
                try {
                    const city = body.city || WEATHER_CONFIG.defaultCity;
                    const data = await getCompleteWeather(city);
                    return { complete_weather: data };
                } catch (error) {
                    throw { err_msg: error.message };
                }
            }
        },
        clear_cache: {
            name: '清除天气缓存',
            description: '清除天气数据缓存，强制重新获取数据',
            is_write: true,
            is_get_api: false,
            params: {
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                try {
                    clearWeatherCache();
                    return { result: true };
                } catch (error) {
                    throw { err_msg: error.message };
                }
            }
        },
        get_api_stats: {
            name: '获取API调用统计',
            description: '获取今日天气API调用次数统计',
            is_write: false,
            is_get_api: true,
            params: {
            },
            result: {
                api_stats: {
                    type: Object,
                    mean: 'API调用统计',
                    explain: {
                        today_count: { type: Number, mean: '今日天气API调用次数', example: 5 },
                        today_limit: { type: Number, mean: '今日天气API调用上限', example: 50 },
                        today_remaining: { type: Number, mean: '今日天气API剩余次数', example: 45 },
                        weekly_count: { type: Number, mean: '一周天气API调用次数', example: 2 },
                        weekly_limit: { type: Number, mean: '一周天气API调用上限', example: 20 },
                        weekly_remaining: { type: Number, mean: '一周天气API剩余次数', example: 18 }
                    }
                }
            },
            func: async function (body, token) {
                try {
                    const stats = getApiStats();
                    return { 
                        api_stats: {
                            today_count: stats.today.count,
                            today_limit: stats.today.limit,
                            today_remaining: stats.today.remaining,
                            weekly_count: stats.weekly.count,
                            weekly_limit: stats.weekly.limit,
                            weekly_remaining: stats.weekly.remaining
                        }
                    };
                } catch (error) {
                    throw { err_msg: error.message };
                }
            }
        }
    }
};
