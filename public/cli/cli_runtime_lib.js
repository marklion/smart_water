import cli_utils from '../lib/cli_utils.js';
import device_cli from '../../device/cli/device_management_cli.js';
import resource_cli from '../../resource/cli/resource_cli.js';
import policy_cli from '../../policy/cli/policy_cli.js';
import web_cli from '../../web/cli/web_cli.js';
import warning_cli from '../../warning/cli/warning_cli.js';
import statistic_cli from '../../statistic/cli/statistic_cli.js';
import config_cli from '../../config/cli/config_cli.js';
import call_remote from '../lib/call_remote.js';
import events from 'events';
let g_vorpal = undefined;
let default_config_file = 'sw_cli_config.txt';
async function make_bdr() {
    let ret = [];
    let sys_name = (await call_remote('/get_sys_name', {})).sys_name;
    ret.push(`set_sys_name '${sys_name}'`);
    ret = ret.concat(await cli_utils.make_sub_bdr(get_vorpal()));
    return ret;
}
function get_vorpal() {
    if (!g_vorpal) {
        events.defaultMaxListeners = 1000;
        const vorpal = cli_utils.create_vorpal();
        const prompt = 'sw_cli> ';
        cli_utils.make_common_cmd(vorpal, 'bdr', '列出所有配置', async (cmd_this, args) => {
            let cmd_ret = '';
            try {
                cmd_ret = (await make_bdr()).join('\n');
            } catch (err) {
                cmd_ret = 'Error: ' + (err.err_msg || '未知错误');
            }
            return cmd_ret;
        });
        cli_utils.make_undo_cmd(vorpal, 'set_sys_name <sys_name>', '设置系统名称', '清除系统名称', async (cmd_this, args) => {
            await call_remote('/set_sys_name', { sys_name: args.sys_name });
            cmd_this.log('系统名称已设置为：' + args.sys_name);
        }, async (cmd_this, args) => {
            await call_remote('/set_sys_name', { sys_name: 'no_name' });
            cmd_this.log('系统名称已清除');
        });

        cli_utils.add_sub_cli(vorpal, device_cli, prompt);
        cli_utils.add_sub_cli(vorpal, resource_cli, prompt);
        cli_utils.add_sub_cli(vorpal, policy_cli, prompt);
        cli_utils.add_sub_cli(vorpal, web_cli, prompt);
        cli_utils.add_sub_cli(vorpal, warning_cli, prompt);
        cli_utils.add_sub_cli(vorpal, statistic_cli, prompt);
        cli_utils.add_sub_cli(vorpal, config_cli, prompt);
        vorpal.delimiter(prompt);
        g_vorpal = vorpal;
    }
    return g_vorpal;
}
export default {
    gothrough_vp: function (vp) {
        let ret = [];
        let cmds = vp.commands;
        for (let cmd of cmds) {
            let tmp_cmd = {
                cmd: cmd._name,
                desp: cmd._description,
                args: []
            };
            let args = cmd._args;
            for (let arg of args) {
                tmp_cmd.args.push({
                    name: arg.name,
                    required: arg.required,
                })
            }
            ret.push(tmp_cmd);
        }
        if (vp.sub_clies) {
            for (let sub_cli of vp.sub_clies) {
                let sub_vp = sub_cli._vorpalInstance;
                let tmp_cmd = {
                    cmd: sub_cli.command,
                    desp: '进入 ' + sub_cli.name,
                    sub_cmds: this.gothrough_vp(sub_vp)
                }
                ret.push(tmp_cmd);
            }
        }

        return ret;
    },
    generate_cmd_tree: function () {
        let vp = get_vorpal();
        return this.gothrough_vp(vp);
    },
    run_inactive: function () {
        let ins = this;
        const vorpal = get_vorpal();
        cli_utils.make_common_cmd(vorpal, 'save [filename]', '保存当前配置到文件', async (cmd_this, args) => {
            try {
                await ins.save_config(args.filename);
            } catch (err) {
                return 'Error: ' + (err.err_msg || '未知错误');
            }
        });
        cli_utils.make_common_cmd(vorpal, 'clear', '清除当前配置', async (cmd_this, args) => {
            let cmd_ret = '';
            try {
                await cli_utils.clear_config(vorpal);
                cmd_ret = '当前配置已清除';
            } catch (err) {
                cmd_ret = 'Error: ' + (err.err_msg || '未知错误');
            }
            return cmd_ret;
        });
        cli_utils.make_common_cmd(vorpal, 'restore [filename]', '从文件恢复配置', async (cmd_this, args) => {
            try {
                await cli_utils.clear_config(vorpal);
                await ins.restore_config(args.filename);
            } catch (err) {
                return 'Error: ' + (err.err_msg || '未知错误');
            }
        });

        vorpal.show();
    },
    save_config: async function (filename) {
        if (!filename) {
            filename = default_config_file;
        }
        let all_config = await make_bdr();
        const fs = await import('fs');
        fs.writeFileSync(filename, '');
        for (let single_config of all_config) {
            fs.appendFileSync(filename, single_config + '\n');
        }
    },
    do_config: async function (vorpal, command, care_error) {
        if (!vorpal) {
            vorpal = get_vorpal();
        }
        return await cli_utils.do_config(vorpal, command, care_error);
    },
    do_config_batch: async function (commands, care_error = false) {
        await this.save_config('tmp_config_for_restore.txt');
        let vorpal = get_vorpal();
        try {
            let lines = commands.split('\n').filter(line => line.trim() !== '');
            for (let line of lines) {
                vorpal = await this.do_config(vorpal, line, care_error);
            }
        }
        catch (err) {
            await cli_utils.clear_config(get_vorpal());
            await this.restore_config('tmp_config_for_restore.txt');
            throw err;
        }
    },
    restore_config: async function (filename) {
        if (!filename) {
            filename = default_config_file;
        }
        const fs = await import('fs');
        if (!fs.existsSync(filename)) {
            throw new Error(`配置文件 ${filename} 不存在`);
        }
        let content = fs.readFileSync(filename, 'utf-8');
        await this.do_config_batch(content);
    },
    destroy: function () {
        let vp = get_vorpal();
        let sub_clies = vp.sub_clies;
        for (let sub_cli of sub_clies) {
            if (sub_cli._vorpalInstance) {
                sub_cli._vorpalInstance.hide();
                delete sub_cli._vorpalInstance;
            }
        }
        vp.sub_clies = [];
        vp.hide();
        g_vorpal = undefined;
    }
}
