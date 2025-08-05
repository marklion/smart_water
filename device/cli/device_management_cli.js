import cli_utils from '../../public/lib/cli_utils.js';
import device_management_lib from '../lib/device_management_lib.js';
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
                cmd_this.log(drivers.map(driver => `${driver.name} - ${driver.config_method}`).join('\n'));
            }
            return drivers.length;
        });
        vorpal.delimiter(prompt)
        vorpal.command('bdr', '列出所有配置')
            .action(async function (args) {
                this.log((await ins.make_bdr()).join('\n'));
            });
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