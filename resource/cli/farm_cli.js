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
        vorpal.delimiter(prompt)
        return vorpal;
    },
    make_bdr: async function () {
        let ret = []
        let farms = await resource_lib.get_all_farms()
        for (let farm of farms) {
            ret.push(`add farm '${farm.name}' '${farm.location}' '${farm.longitude || ''}' '${farm.latitude || ''}' '${farm.info || ''}'`);
        }
        if (this._vorpalInstance) {
            ret = ret.concat(await cli_utils.make_sub_bdr(this._vorpalInstance));
        }
        return ret;
    },
}