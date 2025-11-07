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
        cli_utils.make_common_cmd(vorpal, 'init water policy <farm_name> <flow_warning_low_limit> <flow_warning_high_limit> <pressure_warning_low_limit> <pressure_warning_high_limit> <pressure_shutdown_low_limit> <pressure_shutdown_high_limit> <flow_check_interval> <pressure_warning_check_interval> <pressure_shutdown_check_interval>',
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
                pressure_warning_check_interval: args.pressure_warning_check_interval,
                pressure_shutdown_check_interval: args.pressure_shutdown_check_interval
            });
            if (result.result) {
                return `供水策略初始化成功`;
            } else {
                return `供水策略初始化失败`;
            }
        });
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