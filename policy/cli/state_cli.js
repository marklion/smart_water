import cli_utils from '../../public/lib/cli_utils.js';
import policy_lib from '../lib/policy_lib.js';

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

        // 添加进入动作命令
        vorpal.command('enter action <device> <action>', '添加进入状态时的动作')
            .action(async function (args) {
                try {
                    await policy_lib.add_state_action(ins.policy_name, ins.cur_view_name, 'enter', args.device, args.action);
                    this.log(`已添加进入动作: 设备 ${args.device} 执行 ${args.action}`);
                } catch (err) {
                    this.log('Error:', err.err_msg || '未知错误');
                }
            });

        return vorpal;
    },
    enter_view_hook: async function (args) {
        await policy_lib.add_state(this.policy_name, args.view_name);
        let prompt = this.prompt_prefix + args.view_name + '>';

        this._vorpalInstance.delimiter(prompt);
        this.cur_view_name = args.view_name;
        return `已进入状态视图: ${prompt}`;
    },
    get_all_views: async function () {
        return await policy_lib.list_states(this.policy_name);
    },
    undo_hook: async function (args) {
        await policy_lib.del_state(this.policy_name, args.view_name);
        return `状态 ${args.view_name} 已删除`;
    },
    make_bdr: async function () {
        let ret = [];
        const state = await policy_lib.get_state(this.policy_name, this.cur_view_name);
        if (state) {
            ret.push(`  state ${this.cur_view_name}`);
            if (state.enter_actions) {
                for (const action of state.enter_actions) {
                    ret.push(`    enter action ${action.device} ${action.action}`);
                }
            }
            ret.push('  return');
        }
        return ret;
    }
}
