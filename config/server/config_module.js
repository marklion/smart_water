import fetch from 'node-fetch';

// 高德地图API配置
const AMAP_CONFIG = {
    key: '1cf464a131ce91dfd0e56d28bd80d786',
    geocodeUrl: 'https://restapi.amap.com/v3/geocode/geo'
};

// 系统配置管理模块
const SYSTEM_CONFIG = {
    // 地图默认中心点配置
    map: {
        defaultCenter: {
            lng: 111.670801,  // 默认呼和浩特市经度
            lat: 40.818311    // 默认呼和浩特市纬度
        },
        defaultZoom: 15,
        defaultCityName: '呼和浩特'  // 记录城市名称
    },
    // 天气预报配置
    weather: {
        defaultCity: '呼和浩特'
    }
};

// 通过城市名获取经纬度（使用高德地图地理编码API）
async function getCityLocation(cityName) {
    try {
        const url = `${AMAP_CONFIG.geocodeUrl}?key=${AMAP_CONFIG.key}&address=${encodeURIComponent(cityName)}`;
        console.log(`正在查询城市坐标: ${cityName}`);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
            const location = data.geocodes[0].location;
            const [lng, lat] = location.split(',').map(parseFloat);
            
            console.log(`城市 ${cityName} 的坐标: 经度${lng}, 纬度${lat}`);
            
            return {
                lng,
                lat,
                cityName: data.geocodes[0].formatted_address || cityName
            };
        } else {
            throw new Error(`未找到城市"${cityName}"的坐标信息`);
        }
    } catch (error) {
        console.error('获取城市坐标失败:', error);
        throw new Error(`获取城市坐标失败: ${error.message}`);
    }
}

export default {
    name: 'config',
    description: '系统配置管理',
    methods: {
        get_map_center: {
            name: '获取地图默认中心点',
            description: '获取地图的默认中心点坐标',
            is_write: false,
            is_get_api: true,
            params: {},
            result: {
                center: {
                    type: Object,
                    mean: '地图中心点坐标',
                    explain: {
                        lng: { type: Number, mean: '经度', example: 111.670801 },
                        lat: { type: Number, mean: '纬度', example: 40.818311 }
                    }
                }
            },
            func: async function (body, token) {
                try {
                    return { center: SYSTEM_CONFIG.map.defaultCenter };
                } catch (error) {
                    throw { err_msg: error.message };
                }
            }
        },
        set_map_center: {
            name: '设置地图默认中心点',
            description: '设置地图的默认中心点坐标',
            is_write: true,
            is_get_api: false,
            params: {
                lng: { type: Number, mean: '经度', example: 116.397428, have_to: true },
                lat: { type: Number, mean: '纬度', example: 39.90923, have_to: true }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                try {
                    const { lng, lat } = body;
                    
                    // 验证经纬度范围
                    if (typeof lng !== 'number' || typeof lat !== 'number') {
                        throw new Error('经纬度必须是数字类型');
                    }
                    
                    if (lng < -180 || lng > 180) {
                        throw new Error('经度范围必须在-180到180之间');
                    }
                    
                    if (lat < -90 || lat > 90) {
                        throw new Error('纬度范围必须在-90到90之间');
                    }
                    
                    SYSTEM_CONFIG.map.defaultCenter = { lng, lat };
                    console.log(`地图默认中心点已设置为: 经度${lng}, 纬度${lat}`);
                    return { result: true };
                } catch (error) {
                    throw { err_msg: error.message };
                }
            }
        },
        get_map_zoom: {
            name: '获取地图默认缩放级别',
            description: '获取地图的默认缩放级别',
            is_write: false,
            is_get_api: true,
            params: {},
            result: {
                zoom: { type: Number, mean: '缩放级别', example: 15 }
            },
            func: async function (body, token) {
                try {
                    return { zoom: SYSTEM_CONFIG.map.defaultZoom };
                } catch (error) {
                    throw { err_msg: error.message };
                }
            }
        },
        set_map_zoom: {
            name: '设置地图默认缩放级别',
            description: '设置地图的默认缩放级别',
            is_write: true,
            is_get_api: false,
            params: {
                zoom: { type: Number, mean: '缩放级别(3-18)', example: 15, have_to: true }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                try {
                    const { zoom } = body;
                    
                    if (typeof zoom !== 'number' || zoom < 3 || zoom > 18) {
                        throw new Error('缩放级别必须是3-18之间的数字');
                    }
                    
                    SYSTEM_CONFIG.map.defaultZoom = zoom;
                    console.log(`地图默认缩放级别已设置为: ${zoom}`);
                    return { result: true };
                } catch (error) {
                    throw { err_msg: error.message };
                }
            }
        },
        get_weather_city: {
            name: '获取天气预报默认城市',
            description: '获取天气预报的默认城市',
            is_write: false,
            is_get_api: true,
            params: {},
            result: {
                city: { type: String, mean: '默认城市名称', example: '呼和浩特' }
            },
            func: async function (body, token) {
                try {
                    return { city: SYSTEM_CONFIG.weather.defaultCity };
                } catch (error) {
                    throw { err_msg: error.message };
                }
            }
        },
        set_weather_city: {
            name: '设置天气预报默认城市',
            description: '设置天气预报的默认城市，建议使用地级市或以上城市名（如"呼和浩特"而不是"土默特左旗"）',
            is_write: true,
            is_get_api: false,
            params: {
                city: { type: String, mean: '城市名称', example: '北京', have_to: true },
                skip_validation: { type: Boolean, mean: '跳过验证', example: false, have_to: false }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true },
                warning: { type: String, mean: '警告信息', example: '', have_to: false }
            },
            func: async function (body, token) {
                try {
                    const city = body.city;
                    const skipValidation = body.skip_validation || false;
                    
                    if (!city || typeof city !== 'string' || city.trim() === '') {
                        throw new Error('城市名称不能为空');
                    }
                    
                    let warning = '';
                    
                    // 如果不跳过验证，尝试验证城市名是否可用
                    if (!skipValidation) {
                        try {
                            // 动态导入weather模块来验证城市
                            const weatherModule = (await import('../../weather/server/weather_module.js')).default;
                            await weatherModule.methods.get_today_weather.func({ city: city.trim() }, null);
                            console.log(`城市 ${city.trim()} 验证成功`);
                        } catch (error) {
                            // 如果验证失败，给出警告但仍然允许设置
                            warning = `警告: 天气API可能不支持"${city.trim()}"。建议使用地级市或以上城市名（如"呼和浩特"、"北京"等）。如果您确定要使用此城市名，配置已保存。`;
                            console.warn(warning);
                        }
                    }
                    
                    SYSTEM_CONFIG.weather.defaultCity = city.trim();
                    console.log(`天气预报默认城市已设置为: ${SYSTEM_CONFIG.weather.defaultCity}`);
                    
                    return { 
                        result: true,
                        warning: warning
                    };
                } catch (error) {
                    throw { err_msg: error.message };
                }
            }
        },
        set_map_center_by_city: {
            name: '通过城市名设置地图中心点',
            description: '通过城市名称自动查询并设置地图中心点坐标',
            is_write: true,
            is_get_api: false,
            params: {
                city: { type: String, mean: '城市名称', example: '北京', have_to: true }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true },
                center: {
                    type: Object,
                    mean: '设置后的中心点坐标',
                    explain: {
                        lng: { type: Number, mean: '经度', example: 116.397428 },
                        lat: { type: Number, mean: '纬度', example: 39.90923 }
                    }
                },
                cityName: { type: String, mean: '城市全名', example: '北京市' }
            },
            func: async function (body, token) {
                try {
                    const city = body.city;
                    if (!city || typeof city !== 'string' || city.trim() === '') {
                        throw new Error('城市名称不能为空');
                    }
                    
                    // 通过城市名获取经纬度
                    const location = await getCityLocation(city.trim());
                    
                    // 设置地图中心点
                    SYSTEM_CONFIG.map.defaultCenter = {
                        lng: location.lng,
                        lat: location.lat
                    };
                    SYSTEM_CONFIG.map.defaultCityName = city.trim();
                    
                    console.log(`地图默认中心点已设置为: ${city} (经度${location.lng}, 纬度${location.lat})`);
                    
                    return {
                        result: true,
                        center: SYSTEM_CONFIG.map.defaultCenter,
                        cityName: location.cityName
                    };
                } catch (error) {
                    throw { err_msg: error.message };
                }
            }
        },
        get_map_city: {
            name: '获取地图默认城市名',
            description: '获取地图默认中心点对应的城市名称',
            is_write: false,
            is_get_api: true,
            params: {},
            result: {
                city: { type: String, mean: '城市名称', example: '呼和浩特' }
            },
            func: async function (body, token) {
                try {
                    return { city: SYSTEM_CONFIG.map.defaultCityName || '呼和浩特' };
                } catch (error) {
                    throw { err_msg: error.message };
                }
            }
        }
    }
};

