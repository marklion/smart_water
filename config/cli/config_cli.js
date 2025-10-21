import cli_utils from '../../public/lib/cli_utils.js';
import config_lib from '../lib/config_lib.js';

export default {
    command: 'config',
    name: '系统配置',
    _vorpalInstance: null,
    install: function (parent_prompt) {
        let prompt = parent_prompt + 'config> ';
        const vorpal = cli_utils.create_vorpal();
        this._vorpalInstance = vorpal;
        
        // 查看地图默认中心点
        cli_utils.make_common_cmd(vorpal, 'show map center', '查看地图默认中心点', async (cmd_this, args) => {
            let centerResult = await config_lib.get_map_center();
            let cityResult = await config_lib.get_map_city();
            return `地图默认中心点:
城市: ${cityResult.city}
经度: ${centerResult.center.lng}
纬度: ${centerResult.center.lat}`;
        });
        
        // 通过城市名设置地图中心点（推荐）
        cli_utils.make_common_cmd(vorpal, 'set map city <city>', '通过城市名设置地图中心点', async (cmd_this, args) => {
            let city = args.city;
            let result = await config_lib.set_map_center_by_city(city);
            if (result.result) {
                return `地图默认中心点已设置为: ${result.cityName}
经度: ${result.center.lng}
纬度: ${result.center.lat}`;
            } else {
                return `设置地图中心点失败`;
            }
        });
        
        // 手动设置地图默认中心点（高级）
        cli_utils.make_common_cmd(vorpal, 'set map center <lng> <lat>', '手动设置地图中心点坐标', async (cmd_this, args) => {
            let lng = parseFloat(args.lng);
            let lat = parseFloat(args.lat);
            
            if (isNaN(lng) || isNaN(lat)) {
                return '错误: 经纬度必须是有效的数字';
            }
            
            let result = await config_lib.set_map_center(lng, lat);
            if (result.result) {
                return `地图默认中心点已设置为:
经度: ${lng}
纬度: ${lat}`;
            } else {
                return `设置地图中心点失败`;
            }
        });
        
        // 查看地图默认缩放级别
        cli_utils.make_common_cmd(vorpal, 'show map zoom', '查看地图默认缩放级别', async (cmd_this, args) => {
            let result = await config_lib.get_map_zoom();
            return `地图默认缩放级别: ${result.zoom}`;
        });
        
        // 设置地图默认缩放级别
        cli_utils.make_common_cmd(vorpal, 'set map zoom <zoom>', '设置地图默认缩放级别', async (cmd_this, args) => {
            let zoom = parseInt(args.zoom);
            
            if (isNaN(zoom)) {
                return '错误: 缩放级别必须是有效的数字';
            }
            
            let result = await config_lib.set_map_zoom(zoom);
            if (result.result) {
                return `地图默认缩放级别已设置为: ${zoom}`;
            } else {
                return `设置地图缩放级别失败`;
            }
        });
        
        // 查看天气预报默认城市
        cli_utils.make_common_cmd(vorpal, 'show weather city', '查看天气预报默认城市', async (cmd_this, args) => {
            let result = await config_lib.get_weather_city();
            return `天气预报默认城市: ${result.city}`;
        });
        
        // 设置天气预报默认城市
        cli_utils.make_common_cmd(vorpal, 'set weather city <city>', '设置天气预报默认城市（建议使用地级市）', async (cmd_this, args) => {
            let city = args.city;
            cmd_this.log('正在验证城市名...');
            let result = await config_lib.set_weather_city(city);
            if (result.result) {
                let msg = `天气预报默认城市已设置为: ${city}`;
                if (result.warning) {
                    msg += `\n\n${result.warning}`;
                }
                return msg;
            } else {
                return `设置天气预报默认城市失败`;
            }
        });
        
        vorpal.delimiter(prompt);
        return vorpal;
    },
    make_bdr: async function () {
        let ret = [];
        // 获取当前配置
        try {
            let mapCityResult = await config_lib.get_map_city();
            let zoomResult = await config_lib.get_map_zoom();
            let weatherCityResult = await config_lib.get_weather_city();
            
            // 优先使用城市名设置（更直观）
            if (mapCityResult.city) {
                ret.push(`set map city '${mapCityResult.city}'`);
            }
            if (zoomResult.zoom) {
                ret.push(`set map zoom ${zoomResult.zoom}`);
            }
            if (weatherCityResult.city) {
                ret.push(`set weather city '${weatherCityResult.city}'`);
            }
        } catch (err) {
            // 忽略错误
        }
        return ret;
    },
}

