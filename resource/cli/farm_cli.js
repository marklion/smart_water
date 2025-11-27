import cli_utils from '../../public/lib/cli_utils.js';
import resource_lib from '../lib/resource_lib.js';
export default {
    command: 'farm',
    name: '农场管理',
    _vorpalInstance: null,
    install: function (parent_prompt) {
        let prompt = parent_prompt + 'farm> ';
        let ins = this;
        const vorpal = cli_utils.create_vorpal();
        this._vorpalInstance = vorpal;
        cli_utils.make_undo_cmd(vorpal,
            'add farm <name> <location> <longitude> <latitude> [info]',
            '添加一个农场',
            '删除所有农场',
            async (cmd_this, args) => {
                let name = args.name;
                let location = args.location;
                let longitude = Number.parseFloat(args.longitude);
                let latitude = Number.parseFloat(args.latitude);
                let info = args.info || '';
                let result = await resource_lib.add_farm(name, location, longitude, latitude, info);
                if (result.result) {
                    return `农场 ${name} 添加成功`;
                } else {
                    return `农场 ${name} 添加失败`;
                }
            }, async (cmd_this, args) => {
                let farms = await resource_lib.get_all_farms();
                for (let farm of farms) {
                    await resource_lib.del_farm(farm.name);
                }
                return '所有农场已删除';
            });
        cli_utils.make_common_cmd(vorpal, 'del farm <name>', '删除一个农场', async (cmd_this, args) => {
            let name = args.name;
            let result = await resource_lib.del_farm(name);
            if (result.result) {
                return `农场 ${name} 删除成功`;
            } else {
                return `农场 ${name} 删除失败`;
            }
        });
        cli_utils.make_undo_cmd(vorpal,
            'set area params <farm_name> <system_flow> <laying_spacing> <dripper_spacing> <dripper_flow> <coefficient>',
            '设置农场建议亩数计算参数',
            '撤销操作 - 清除农场建议亩数计算参数',
            async (cmd_this, args) => {
                let farm_name = args.farm_name;
                let params = {
                    system_flow: parseFloat(args.system_flow),
                    laying_spacing: parseFloat(args.laying_spacing),
                    dripper_spacing: parseFloat(args.dripper_spacing),
                    dripper_flow: parseFloat(args.dripper_flow),
                    coefficient: parseFloat(args.coefficient)
                };
                let result = await resource_lib.set_farm_area_params(farm_name, params, ins.token);
                if (result.result) {
                    return `农场 ${farm_name} 的建议亩数计算参数设置成功`;
                } else {
                    return `农场 ${farm_name} 的建议亩数计算参数设置失败`;
                }
            },
            async (cmd_this, args) => {
                let farms = await resource_lib.get_all_farms();
                let params = {
                    system_flow: 1,
                    laying_spacing: 0,
                    dripper_spacing: 0,
                    dripper_flow: 0,
                    coefficient: 0.9
                };
                for (let farm of farms) {
                    await resource_lib.set_farm_area_params(farm.name, params, ins.token);
                }
                return '所有农场的建议亩数计算参数已清除';
            });
        cli_utils.make_undo_cmd(vorpal,
            'realtime <farm_name> <label> <device_name> <data_type>',
            '添加实时数据配置',
            '删除所有实时数据配置',
            async (cmd_this, args) => {
                let farm_name = args.farm_name;
                let label = args.label;
                let device_name = args.device_name;
                let data_type = args.data_type;
                
                // 验证data_type
                if (data_type !== 'readout' && data_type !== 'total_readout') {
                    return `错误：data_type必须是 'readout' 或 'total_readout'`;
                }
                
                let result = await resource_lib.add_realtime(farm_name, label, device_name, data_type, ins.token);
                // call_remote 返回的是 result.result，所以这里 result 已经是布尔值了
                if (result) {
                    return `实时数据配置 "${label}" 添加成功`;
                } else {
                    return `实时数据配置 "${label}" 添加失败`;
                }
            },
            async (cmd_this, args) => {
                let farms = await resource_lib.get_all_farms();
                for (let farm of farms) {
                    let configs = await resource_lib.get_all_realtime_configs(farm.name);
                    for (let config of configs) {
                        await resource_lib.del_realtime(farm.name, config.label, ins.token);
                    }
                }
                return '所有实时数据配置已删除';
            });
        cli_utils.make_common_cmd(vorpal, 'del realtime <farm_name> <label>', '删除实时数据配置', async (cmd_this, args) => {
            let farm_name = args.farm_name;
            let label = args.label;
            let result = await resource_lib.del_realtime(farm_name, label, ins.token);
            // call_remote 返回的是 result.result，所以这里 result 已经是布尔值了
            if (result) {
                return `实时数据配置 "${label}" 删除成功`;
            } else {
                return `实时数据配置 "${label}" 删除失败`;
            }
        });
        cli_utils.make_common_cmd(vorpal, 'list realtime [farm_name]', '列出实时数据配置', async (cmd_this, args) => {
            let farm_name = args.farm_name;
            let configs = await resource_lib.get_all_realtime_configs(farm_name);
            if (configs.length === 0) {
                return '没有找到实时数据配置';
            }
            let output = '实时数据配置列表：\n';
            for (let config of configs) {
                output += `  农场: ${config.farm_name}, 显示名称: ${config.label}, 设备: ${config.device_name}, 数据类型: ${config.data_type}\n`;
            }
            return output;
        });
        vorpal.delimiter(prompt)
        return vorpal;
    },
    make_bdr: async function (view_name) {
        let ret = []
        // 通过API获取farms数组
        let allFarms = await resource_lib.get_all_farms();
        
        // 如果指定了view_name，只处理该农场（虽然farm_cli通常不这样用，但为了安全起见）
        if (view_name) {
            let farm = allFarms.find(f => f.name === view_name);
            if (farm) {
                ret.push(`add farm '${farm.name}' '${farm.location}' '${farm.longitude || ''}' '${farm.latitude || ''}' '${farm.info || ''}'`);
                // 显示农场的面积参数配置信息 - 直接从farm对象获取，不需要调用接口
                if (farm.system_flow !== undefined || farm.laying_spacing !== undefined || farm.dripper_spacing !== undefined || farm.dripper_flow !== undefined || farm.coefficient !== undefined) {
                    let system_flow = farm.system_flow !== undefined ? farm.system_flow : 1;
                    let laying_spacing = farm.laying_spacing || 0;
                    let dripper_spacing = farm.dripper_spacing || 0;
                    let dripper_flow = farm.dripper_flow || 0;
                    let coefficient = farm.coefficient !== undefined ? farm.coefficient : 0.9;
                    let formatParam = (val) => {
                        if (val === undefined || val === null) return val;
                        return val.toString();
                    };
                    let coefficient_str = (coefficient === 1 || coefficient === 1.0) ? '1.0' : formatParam(coefficient);
                    ret.push(`set area params '${farm.name}' '${formatParam(system_flow)}' '${formatParam(laying_spacing)}' '${formatParam(dripper_spacing)}' '${formatParam(dripper_flow)}' '${coefficient_str}'`);
                }
                // 显示农场的实时数据配置 - 直接从farm对象获取，不需要调用接口
                if (farm.realtime_configs && farm.realtime_configs.length > 0) {
                    for (let config of farm.realtime_configs) {
                        ret.push(`realtime '${farm.name}' '${config.label}' '${config.device_name}' '${config.data_type}'`);
                    }
                }
            }
        } else {
            // 处理所有农场
            for (let farm of allFarms) {
                ret.push(`add farm '${farm.name}' '${farm.location}' '${farm.longitude || ''}' '${farm.latitude || ''}' '${farm.info || ''}'`);
                // 显示农场的面积参数配置信息 - 直接从farm对象获取，不需要调用接口
                if (farm.system_flow !== undefined || farm.laying_spacing !== undefined || farm.dripper_spacing !== undefined || farm.dripper_flow !== undefined || farm.coefficient !== undefined) {
                    let system_flow = farm.system_flow !== undefined ? farm.system_flow : 1;
                    let laying_spacing = farm.laying_spacing || 0;
                    let dripper_spacing = farm.dripper_spacing || 0;
                    let dripper_flow = farm.dripper_flow || 0;
                    let coefficient = farm.coefficient !== undefined ? farm.coefficient : 0.9;
                    let formatParam = (val) => {
                        if (val === undefined || val === null) return val;
                        return val.toString();
                    };
                    let coefficient_str = (coefficient === 1 || coefficient === 1.0) ? '1.0' : formatParam(coefficient);
                    ret.push(`set area params '${farm.name}' '${formatParam(system_flow)}' '${formatParam(laying_spacing)}' '${formatParam(dripper_spacing)}' '${formatParam(dripper_flow)}' '${coefficient_str}'`);
                }
                // 显示农场的实时数据配置 - 直接从farm对象获取，不需要调用接口
                if (farm.realtime_configs && farm.realtime_configs.length > 0) {
                    for (let config of farm.realtime_configs) {
                        ret.push(`realtime '${farm.name}' '${config.label}' '${config.device_name}' '${config.data_type}'`);
                    }
                }
            }
        }
        // farm_cli 没有子 CLI，不需要处理子 CLI
        // 只在顶层调用（view_name 为 undefined）时才处理子 CLI
        if (view_name === undefined && this._vorpalInstance) {
            ret = ret.concat(await cli_utils.make_sub_bdr(this._vorpalInstance));
        }
        return ret;
    },
}