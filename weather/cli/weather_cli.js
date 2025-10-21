import cli_utils from '../../public/lib/cli_utils.js';
import weather_lib from '../lib/weather_lib.js';

export default {
    command: 'weather',
    name: '天气查询',
    _vorpalInstance: null,
    install: function (parent_prompt) {
        let prompt = parent_prompt + 'weather> ';
        const vorpal = cli_utils.create_vorpal();
        this._vorpalInstance = vorpal;
        
        // 获取今日天气
        cli_utils.make_common_cmd(vorpal, 'get today [city]', '获取今日天气', async (cmd_this, args) => {
            let city = args.city;
            let result = await weather_lib.get_today_weather(city);
            let data = result.weather_data;
            return `城市: ${data.city}
            日期: ${data.date} ${data.week}
            天气: ${data.wea}
            温度: ${data.tem}°C (最高: ${data.tem_day}°C, 最低: ${data.tem_night}°C)
            风向风速: ${data.win} ${data.win_speed}
            湿度: ${data.humidity}
            气压: ${data.pressure}hPa
            空气质量: ${data.air}
            更新时间: ${data.update_time}`;
        });

        // 获取未来天气
        cli_utils.make_common_cmd(vorpal, 'get future [city]', '获取未来6天天气预报', async (cmd_this, args) => {
            let city = args.city;
            let result = await weather_lib.get_future_weather(city);
            let data = result.future_weather;
            let output = '未来6天天气预报:\n';
            data.forEach((day, index) => {
                output += `\n${index + 1}. ${day.date}
                天气: ${day.wea}
                温度: ${day.tem_day}°C / ${day.tem_night}°C
                风向风速: ${day.win} ${day.win_speed}\n`;
            });
            return output;
        });

        // 清除缓存
        cli_utils.make_common_cmd(vorpal, 'clear cache', '清除天气缓存', async (cmd_this, args) => {
            let result = await weather_lib.clear_cache();
            if (result.result) {
                return '天气缓存已清除';
            } else {
                return '清除缓存失败';
            }
        });

        // 查看API统计
        cli_utils.make_common_cmd(vorpal, 'show api stats', '查看API调用统计', async (cmd_this, args) => {
            let result = await weather_lib.get_api_stats();
            let stats = result.api_stats;
            return `API调用统计 (今日):
            今日天气API:
            已调用: ${stats.today_count} 次
            限制: ${stats.today_limit} 次
            剩余: ${stats.today_remaining} 次

            未来天气API:
            已调用: ${stats.weekly_count} 次
            限制: ${stats.weekly_limit} 次
            剩余: ${stats.weekly_remaining} 次`;
                    });

        vorpal.delimiter(prompt);
        return vorpal;
    },
    make_bdr: async function () {
        // 天气查询不需要保存配置，配置已移到config模块
        return [];
    },
}

