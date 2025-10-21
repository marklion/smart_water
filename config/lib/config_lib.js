import call_remote from '../../public/lib/call_remote.js';

export default {
    // 获取地图默认中心点
    get_map_center: async function () {
        return await call_remote('/config/get_map_center', {});
    },
    
    // 设置地图默认中心点
    set_map_center: async function (lng, lat) {
        return await call_remote('/config/set_map_center', { lng, lat });
    },
    
    // 获取地图默认缩放级别
    get_map_zoom: async function () {
        return await call_remote('/config/get_map_zoom', {});
    },
    
    // 设置地图默认缩放级别
    set_map_zoom: async function (zoom) {
        return await call_remote('/config/set_map_zoom', { zoom });
    },
    
    // 获取天气预报默认城市
    get_weather_city: async function () {
        return await call_remote('/config/get_weather_city', {});
    },
    
    // 设置天气预报默认城市
    set_weather_city: async function (city, skipValidation = false) {
        return await call_remote('/config/set_weather_city', { city, skip_validation: skipValidation });
    },
    
    // 通过城市名设置地图中心点
    set_map_center_by_city: async function (city) {
        return await call_remote('/config/set_map_center_by_city', { city });
    },
    
    // 获取地图默认城市名
    get_map_city: async function () {
        return await call_remote('/config/get_map_city', {});
    }
};

