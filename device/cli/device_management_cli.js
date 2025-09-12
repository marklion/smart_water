import cli_utils from '../../public/lib/cli_utils.js';
import device_management_lib from '../lib/device_management_lib.js';
async function get_all_devices(token) {
    let devices = [];
    let pageNo = 0;
    while (true) {
        let result = await device_management_lib.list_device(pageNo, null, null, token);
        if (result.devices.length === 0) {
            break;
        }
        devices = devices.concat(result.devices);
        pageNo++;
    }
    return devices;
}
export default {
    command: 'device',
    name: '设备管理',
    _vorpalInstance: null,
    install: function (parent_prompt) {
        let prompt = parent_prompt + 'device> ';
        let ins = this;
        const vorpal = cli_utils.create_vorpal();
        this._vorpalInstance = vorpal;
        cli_utils.make_display_cmd(vorpal, 'list driver', '列出当前系统支持的驱动', async (cmd_this, args, pageNo) => {
            let drivers = (await device_management_lib.get_driver_list(this.token, pageNo)).drivers;
            if (drivers.length > 0) {
                cmd_this.log(drivers.map(driver => `${driver.name} - ${driver.config_method} - ${driver.capability}`).join('\n'));
            }
            return drivers.length;
        });
        cli_utils.make_undo_cmd(vorpal, 'add device <device_name> <driver_name> <config_key> [farm_name] [block_name]', '添加一个设备', '删除所有设备',
            async (cmd_this, args) => {
                let result = await device_management_lib.add_device(args.device_name, args.driver_name, args.config_key, args.farm_name, args.block_name, this.token);
                if (result.result) {
                    return `设备 ${args.device_name} 添加成功`;
                } else {
                    return `设备 ${args.device_name} 添加失败`;
                }
            }, async (cmd_this, args) => {
                let devices = await get_all_devices(this.token);
                for (let device of devices) {
                    await device_management_lib.del_device(device.device_name, this.token);
                }
                return '所有设备已删除';
            });
        cli_utils.make_common_cmd(vorpal, 'del device <device_name>', '删除一个设备', async (cmd_this, args) => {
            let result = await device_management_lib.del_device(args.device_name, this.token);
            if (result.result) {
                return `设备 ${args.device_name} 删除成功`;
            } else {
                return `设备 ${args.device_name} 删除失败`;
            }
        });
        cli_utils.make_display_cmd(vorpal, 'list device [farm_name] [block_name]', '列出设备', async (cmd_this, args, pageNo) => {
            let devices = (await device_management_lib.list_device(pageNo, args.farm_name, args.block_name, this.token)).devices;
            if (devices.length > 0) {
                cmd_this.log(devices.map(device => `${device.device_name} - ${device.driver_name} (${device.config_key}) : ${device.capability}`).join('\n'));
            } else if (pageNo === 0) {
                // 只在第一页时显示无设备信息
                cmd_this.log('没有找到设备');
            }
            return devices.length;
        });
        cli_utils.make_common_cmd(vorpal, 'open <device_name>', '打开阀门', async (cmd_this, args)=>{
            await device_management_lib.open_device(args.device_name, this.token);
            return `设备 ${args.device_name} 打开成功`;
        })
        cli_utils.make_common_cmd(vorpal, 'close <device_name>', '关闭阀门', async (cmd_this, args)=>{
            await device_management_lib.close_device(args.device_name, this.token);
            return `设备 ${args.device_name} 关闭成功`;
        })
        cli_utils.make_common_cmd(vorpal, 'readout <device_name>', '读取设备读数', async (cmd_this, args) => {
            let resp = await device_management_lib.readout_device(args.device_name, this.token);
            if (resp!== null) {
                return `设备 ${args.device_name} 当前读数为: ${resp.readout}`;
            } else {
                return `设备 ${args.device_name} 读取失败`;
            }
        });
        cli_utils.make_common_cmd(vorpal, 'mock readout <device_name> <value>', '模拟设备读数', async (cmd_this, args) => {
            await device_management_lib.mock_readout(args.device_name, parseFloat(args.value), this.token);
            return `设备 ${args.device_name} 模拟读数为: ${args.value}`;
        });
        vorpal.delimiter(prompt)
        vorpal.command('bdr', '列出所有配置')
            .action(async function (args) {
                try {
                    this.log((await ins.make_bdr()).join('\n'));
                } catch (err) {
                    this.log('Error:', err.err_msg || '未知错误');
                }
            });
        return vorpal;
    },
    make_bdr: async function () {
        let ret = []
        let devices = await get_all_devices(this.token);
        for (let device of devices) {
            ret.push(`add device '${device.device_name}' '${device.driver_name}' '${device.config_key}' '${device.farm_name || ''}' '${device.block_name || ''}'`);
        }
        if (this._vorpalInstance) {
            ret = ret.concat(await cli_utils.make_sub_bdr(this._vorpalInstance));
        }
        return ret;
    },
}