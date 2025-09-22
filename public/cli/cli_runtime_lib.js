import cli_utils from '../lib/cli_utils.js';
import device_cli from '../../device/cli/device_management_cli.js';
import resource_cli from '../../resource/cli/resource_cli.js';
import policy_cli from '../../policy/cli/policy_cli.js';
import web_cli from '../../web/cli/web_cli.js';
import call_remote from '../lib/call_remote.js';
import events from 'events';
let g_vorpal = undefined;
let default_config_file = 'sw_cli_config.txt';
async function make_bdr() {
    let ret = [];
    let sys_name = (await call_remote('/get_sys_name', {})).sys_name;
    ret.push(`set_sys_name '${sys_name}'`);
    ret = ret.concat(await cli_utils.make_sub_bdr(g_vorpal));
    return ret;
}
function get_vorpal() {
    if (!g_vorpal) {
        events.defaultMaxListeners = 1000;
        const vorpal = cli_utils.create_vorpal();
        const prompt = 'sw_cli> ';
        vorpal.command('bdr', '列出所有配置')
            .action(async function (args) {
                try {
                    this.log((await make_bdr()).join('\n'));
                } catch (err) {
                    this.log('Error:', err.err_msg || '未知错误');
                }
            });
        vorpal.command('set_sys_name <sys_name>', '设置系统名称')
            .action(async function (args) {
                try {
                    await call_remote('/set_sys_name', { sys_name: args.sys_name });
                    this.log('系统名称已设置为：' + args.sys_name);
                } catch (err) {
                    this.log('Error:', err.err_msg || '未知错误');
                }
            });
        cli_utils.add_sub_cli(vorpal, device_cli, prompt);
        cli_utils.add_sub_cli(vorpal, resource_cli, prompt);
        cli_utils.add_sub_cli(vorpal, policy_cli, prompt);
        cli_utils.add_sub_cli(vorpal, web_cli, prompt);
        vorpal.delimiter(prompt);
        g_vorpal = vorpal;
    }
    return g_vorpal;
}
export default {
    run_inactive: function () {
        let ins = this;
        const vorpal = get_vorpal();
        vorpal.command('save [filename]', '保存当前配置到文件')
            .action(async function (args) {
                try {
                    await ins.save_config(args.filename);
                } catch (err) {
                    this.log('Error:', err.err_msg || '未知错误');
                }
            });
        vorpal.command('clear', '清除当前配置')
            .action(async function (args) {
                try {
                    await cli_utils.clear_config(vorpal);
                    this.log('当前配置已清除');
                } catch (err) {
                    this.log('Error:', err.err_msg || '未知错误');
                }
            });
        vorpal.command('restore [filename]', '从文件恢复配置')
            .action(async function (args) {
                try {
                    await cli_utils.clear_config(vorpal);
                    await ins.restore_config(args.filename);
                } catch (err) {
                    this.log('Error:', err.err_msg || '未知错误');
                }
            });
        vorpal.command('restart', '重启服务器')
            .action(async function (args) {
                try {
                    await call_remote('/restart', {});
                    this.log('服务器已重启');
                } catch (err) {
                    this.log('Error:', err.err_msg || '未知错误');
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
    do_config: async function (vorpal, command) {
        let next_vorpal = await vorpal.execSync(command);
        // 等待命令执行完成
        await new Promise(resolve => setTimeout(resolve, 200));
        // 如果命令返回了新的vorpal实例，使用新的；否则保持当前的
        if (next_vorpal && next_vorpal !== vorpal) {
            return next_vorpal;
        }
        return vorpal;
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
        let commands = content.split('\n').filter(line => line.trim() !== '');
        let vorpal = get_vorpal();

        while (vorpal !== get_vorpal()) {
            try {
                vorpal = await vorpal.execSync('return');
            } catch (e) {
                break;
            }
        }
        
        for (let command of commands) {
            try {
                if (!command.trim()) {
                    continue;
                }
                vorpal = await this.do_config(vorpal, command);
            } catch (error) {
                console.log(`恢复命令失败: ${command}, 错误: ${error.message}`);
            }
        }
        let root_vorpal = get_vorpal();
        let max_attempts = 10; // 防止无限循环
        let attempts = 0;
        
        while (vorpal !== root_vorpal && attempts < max_attempts) {
            try {
                vorpal = await vorpal.execSync('return');
                attempts++;
                // 如果返回的是根vorpal实例，使用它
                if (vorpal === root_vorpal) {
                    break;
                }
            } catch (e) {
                // 如果无法返回，直接使用根vorpal实例
                vorpal = root_vorpal;
                break;
            }
        }

        vorpal = root_vorpal;
    },
    destroy: function () {
        let sub_clies = g_vorpal.sub_clies;
        for (let sub_cli of sub_clies) {
            if (sub_cli._vorpalInstance) {
                sub_cli._vorpalInstance.hide();
                delete sub_cli._vorpalInstance;
            }
        }
        g_vorpal.sub_clies = [];
        g_vorpal.hide();
        g_vorpal = undefined;
    }
}
