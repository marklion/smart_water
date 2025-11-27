import cli_utils from '../../public/lib/cli_utils.js';
import config_lib from '../lib/config_lib.js';
export default {
    command: 'config',
    name: '配置管理',
    _vorpalInstance: null,
    install: function (parent_prompt) {
        let prompt = parent_prompt + 'config> ';
        const vorpal = cli_utils.create_vorpal();
        this._vorpalInstance = vorpal;
        cli_utils.make_common_cmd(vorpal, 'add water group valve <farm_name> <block_name> <valve_name> <driver_name> <valve_config_key> <latitude> <longitude> <open_pressure_low_limit> <close_pressure_high_limit> <pressure_check_interval>', '添加一个轮灌组用的阀门', async (cmd_this, args) => {
            let result = await config_lib.add_water_group_valve({
                farm_name: args.farm_name,
                block_name: args.block_name,
                valve_name: args.valve_name,
                driver_name: args.driver_name,
                valve_config_key: args.valve_config_key,
                latitude: args.latitude,
                longitude: args.longitude,
                open_pressure_low_limit: args.open_pressure_low_limit,
                close_pressure_high_limit: args.close_pressure_high_limit,
                pressure_check_interval: args.pressure_check_interval
            });
            if (result.result) {
                return `${args.valve_name} 添加成功`;
            } else {
                return `${args.valve_name} 添加失败`;
            }
        });
        cli_utils.make_common_cmd(vorpal, 'init water policy <farm_name> <flow_warning_low_limit> <flow_warning_high_limit> <pressure_warning_low_limit> <pressure_warning_high_limit> <pressure_shutdown_low_limit> <pressure_shutdown_high_limit> <flow_check_interval> <pressure_shutdown_check_interval>',
            '初始化供水策略',
            async (cmd_this, args) => {
                let result = await config_lib.init_water_policy({
                    farm_name: args.farm_name,
                    flow_warning_low_limit: args.flow_warning_low_limit,
                    flow_warning_high_limit: args.flow_warning_high_limit,
                    pressure_warning_low_limit: args.pressure_warning_low_limit,
                    pressure_warning_high_limit: args.pressure_warning_high_limit,
                    pressure_shutdown_low_limit: args.pressure_shutdown_low_limit,
                    pressure_shutdown_high_limit: args.pressure_shutdown_high_limit,
                    flow_check_interval: args.flow_check_interval,
                    pressure_shutdown_check_interval: args.pressure_shutdown_check_interval
                });
                if (result.result) {
                    return `供水策略初始化成功`;
                } else {
                    return `供水策略初始化失败`;
                }
            });
        cli_utils.make_common_cmd(vorpal, 'init fert policy <farm_name> <flow_expected_value> <flow_warning_max_offset> <flow_check_interval> <level_warning_limit> <level_shutdown_limit> <level_check_interval>',
            '初始化施肥策略',
            async (cmd_this, args) => {
                let result = await config_lib.init_fert_policy({
                    farm_name: args.farm_name,
                    flow_expected_value: args.flow_expected_value,
                    flow_warning_max_offset: args.flow_warning_max_offset,
                    flow_check_interval: args.flow_check_interval,
                    level_warning_limit: args.level_warning_limit,
                    level_shutdown_limit: args.level_shutdown_limit,
                    level_check_interval: args.level_check_interval
                });
                if (result.result) {
                    return `施肥策略初始化成功`;
                } else {
                    return `施肥策略初始化失败`;
                }
            });
        cli_utils.make_common_cmd(vorpal, 'init fert mixing policy <farm_name> [start_interval] [duration] [mixing_pump_name]',
            '快速配置肥料搅拌策略',
            async (cmd_this, args) => {
                let config = {
                    farm_name: args.farm_name
                };
                if (args.start_interval) {
                    config.start_interval = args.start_interval;
                }
                if (args.duration) {
                    config.duration = args.duration;
                }
                if (args.mixing_pump_name) {
                    config.mixing_pump_name = args.mixing_pump_name;
                }
                let result = await config_lib.init_fert_mixing_policy(config);
                if (result.result) {
                    return `肥料搅拌策略初始化成功`;
                } else {
                    return `肥料搅拌策略初始化失败`;
                }
            });
        cli_utils.make_common_cmd(vorpal, 'add group policy <policy_name> <farm_name> <total_time> <post_fert_time> <method> <fert_time> <area_based_amount> <area> [wgv_array...]',
            '添加轮灌组施肥策略',
            async (cmd_this, args) => {
                let wgv_array = args.wgv_array.map((val) => { return { name: val }; });
                let result = await config_lib.add_group_policy({
                    policy_name: args.policy_name,
                    farm_name: args.farm_name,
                    wgv_array: wgv_array,
                    total_time: args.total_time,
                    post_fert_time: args.post_fert_time,
                    method: args.method,
                    fert_time: args.fert_time,
                    area_based_amount: args.area_based_amount,
                    area: args.area,
                });
                if (result.result) {
                    return `轮灌组施肥策略 ${args.policy_name} 添加成功`;
                } else {
                    return `轮灌组施肥策略 ${args.policy_name} 添加失败`;
                }
            }
        );
        cli_utils.make_common_cmd(vorpal, 'init global policy <start_hour> <farm_name>',
            '初始化全局策略',
            async (cmd_this, args) => {
                let result = await config_lib.init_global_policy({
                    start_hour: args.start_hour,
                    farm_name: args.farm_name
                });
                if (result.result) {
                    return `全局策略初始化成功`;
                } else {
                    return `全局策略初始化失败`;
                }
            }
        )
        vorpal.delimiter(prompt)
        return vorpal;
    },
    make_bdr: async function () {
        let ret = []
        if (this._vorpalInstance) {
            ret = ret.concat(await cli_utils.make_sub_bdr(this._vorpalInstance));
        }
        return ret;
    },
}