import cli_utils from '../../public/lib/cli_utils.js';
import policy_lib from '../lib/policy_lib.js';
import transformer_cli from './transformer_cli.js';

export default {
    command: 'state',
    name: '创建/进入状态',
    _vorpalInstance: null,
    install: function (parent_prompt) {
        let prompt = parent_prompt + 'state-';
        let ins = this;
        const vorpal = cli_utils.create_vorpal();
        this._vorpalInstance = vorpal;
        this.prompt_prefix = prompt;

        cli_utils.make_undo_cmd(vorpal, 'enter action <device> <action>', '添加进入状态时的动作', '删除所有进入动作',
            async (cmd_this, args) => {
                await policy_lib.add_state_action(ins.policy_view.cur_view_name, ins.cur_view_name, 'enter', args.device, args.action);
                return `已添加进入动作: 设备 ${args.device} 执行 ${args.action}`;
            },
            async (cmd_this, args) => {
                const resp = await policy_lib.get_state(ins.policy_view.cur_view_name, ins.cur_view_name);
                let deletedCount = 0;
                if (resp.state && resp.state.enter_actions) {
                    for (const action of resp.state.enter_actions) {
                        await policy_lib.del_state_action(
                            ins.policy_view.cur_view_name, 
                            ins.cur_view_name, 
                            'enter', 
                            action.device, 
                            action.action
                        );
                        deletedCount++;
                    }
                }
                return `已删除 ${deletedCount} 个进入动作`;
            });

        transformer_cli.state_view = ins;
        cli_utils.add_sub_cli(vorpal, transformer_cli, prompt);

        // 添加在状态内执行的动作命令
        vorpal.command('do action <device> <action>', '添加在状态内执行的动作')
            .action(async function (args) {
                try {
                    await policy_lib.add_state_action(ins.policy_view.cur_view_name, ins.cur_view_name, 'do', args.device, args.action);
                    this.log(`已添加状态内动作: 设备 ${args.device} 执行 ${args.action}`);
                } catch (err) {
                    this.log('Error:', err.err_msg || '未知错误');
                }
            });

        // 添加离开状态时的动作命令
        vorpal.command('exit action <device> <action>', '添加离开状态时执行的动作')
            .action(async function (args) {
                try {
                    await policy_lib.add_state_action(ins.policy_view.cur_view_name, ins.cur_view_name, 'exit', args.device, args.action);
                    this.log(`已添加离开动作: 设备 ${args.device} 执行 ${args.action}`);
                } catch (err) {
                    this.log('Error:', err.err_msg || '未知错误');
                }
            });

        // 删除状态内动作命令
        vorpal.command('del do <device> <action>', '删除在状态内执行的动作')
            .action(async function (args) {
                try {
                    await policy_lib.del_state_action(ins.policy_view.cur_view_name, ins.cur_view_name, 'do', args.device, args.action);
                    this.log(`已删除状态内动作: 设备 ${args.device} 执行 ${args.action}`);
                } catch (err) {
                    this.log('Error:', err.err_msg || '未知错误');
                }
            });

        // 删除离开动作命令
        vorpal.command('del exit <device> <action>', '删除离开状态时执行的动作')
            .action(async function (args) {
                try {
                    await policy_lib.del_state_action(ins.policy_view.cur_view_name, ins.cur_view_name, 'exit', args.device, args.action);
                    this.log(`已删除离开动作: 设备 ${args.device} 执行 ${args.action}`);
                } catch (err) {
                    this.log('Error:', err.err_msg || '未知错误');
                }
            });

        // 添加 bdr 命令
        vorpal.command('bdr', '列出所有配置')
            .action(async function (args) {
                try {
                    this.log((await ins.make_bdr(ins.cur_view_name)).join('\n'));
                } catch (err) {
                    this.log('Error:', err.err_msg || '未知错误');
                }
            });

        return vorpal;
    },
    enter_view_hook: async function (args) {
        await policy_lib.add_state(this.policy_view.cur_view_name, args.view_name);
        let prompt = this.prompt_prefix + args.view_name + '>';

        this._vorpalInstance.delimiter(prompt);
        this.cur_view_name = args.view_name;
        return `已进入状态视图: ${prompt}`;
    },
    get_all_views: async function () {
        let ret = []
        let pageNo = 0;
        while (true) {
            let resp = await policy_lib.list_states(this.policy_view.cur_view_name, pageNo)
            if (resp.states.length == 0) {
                break;
            }
            ret = ret.concat(resp.states.map(state => state.name));
            pageNo++;
        }
        return ret;
    },
    undo_hook: async function (args) {
        await policy_lib.del_state(this.policy_view.cur_view_name, args.view_name);
        return `状态 ${args.view_name} 已删除`;
    },
    make_bdr: async function (view_name) {
        let ret = [];
        const resp = await policy_lib.get_state(this.policy_view.cur_view_name, view_name);
        if (resp.state) {
            if (resp.state.enter_actions) {
                for (const action of resp.state.enter_actions) {
                    ret.push(`  enter action ${action.device} ${action.action}`);
                }
            }
            if (resp.state.do_actions) {
                for (const action of resp.state.do_actions) {
                    ret.push(`  do action ${action.device} ${action.action}`);
                }
            }
            if (resp.state.exit_actions) {
                for (const action of resp.state.exit_actions) {
                    ret.push(`  exit action ${action.device} ${action.action}`);
                }
            }
        }

        if (this._vorpalInstance) {
            this.cur_view_name = view_name;
            let sub_bdr = await cli_utils.make_sub_bdr(this._vorpalInstance);
            ret = ret.concat(sub_bdr);
        }
        
        return ret;
    }
}
