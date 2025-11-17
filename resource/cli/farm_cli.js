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
        vorpal.delimiter(prompt)
        return vorpal;
    },
    make_bdr: async function () {
        let ret = []
        let farms = await resource_lib.get_all_farms()
        for (let farm of farms) {
            ret.push(`add farm '${farm.name}' '${farm.location}' '${farm.longitude || ''}' '${farm.latitude || ''}' '${farm.info || ''}'`);
            // 显示农场的面积参数配置信息
            let areaParams = await resource_lib.get_farm_area_params(farm.name, undefined);
            if (areaParams && (areaParams.system_flow || areaParams.laying_spacing || areaParams.dripper_spacing || areaParams.dripper_flow || areaParams.coefficient !== undefined)) {
                let system_flow = areaParams.system_flow || 1;
                let laying_spacing = areaParams.laying_spacing || 0;
                let dripper_spacing = areaParams.dripper_spacing || 0;
                let dripper_flow = areaParams.dripper_flow || 0;
                let coefficient = areaParams.coefficient !== undefined ? areaParams.coefficient : 0.9;
                ret.push(`农场 ${farm.name} 的建议亩数计算参数: 系统流量=${system_flow}, 铺设间距=${laying_spacing}, 滴头间距=${dripper_spacing}, 滴头流量=${dripper_flow}, 系数=${coefficient}`);
            }
        }
        if (this._vorpalInstance) {
            ret = ret.concat(await cli_utils.make_sub_bdr(this._vorpalInstance));
        }
        return ret;
    },
}