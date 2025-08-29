import cli_utils from '../../public/lib/cli_utils.js';
import policy_lib from '../lib/policy_lib.js';
import state_cli from './state_cli.js';

export default {
    command: 'policy',
    name: '创建/进入策略',
    _vorpalInstance: null,
    install: function (parent_prompt) {
        let prompt = parent_prompt + 'policy-';
        let ins = this;
        const vorpal = cli_utils.create_vorpal();
        this._vorpalInstance = vorpal;
        this.prompt_prefix = prompt;

        // 注册状态命令
        state_cli.policy_name = this.cur_view_name;
        cli_utils.add_sub_cli(vorpal, state_cli, prompt);
        state_cli.policy_view = ins;

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
        await policy_lib.add_policy(args.view_name);
        let prompt = this.prompt_prefix + args.view_name + '>';

        this._vorpalInstance.delimiter(prompt);
        this.cur_view_name = args.view_name;
        return `已进入策略视图: ${prompt}`;
    },
    get_all_views: async function () {
        let ret = []
        let pageNo = 0;
        while (true) {
            let resp = await policy_lib.list_policy(pageNo)
            if (resp.policies.length == 0) {
                break;
            }
            ret = ret.concat(resp.policies.map(policy => policy.name));
            pageNo++;
        }
        return ret;
    },
    undo_hook: async function (args) {
        await policy_lib.del_policy(args.view_name);
        return `策略 ${args.view_name} 已删除`;
    },
    make_bdr: async function (view_name) {
        let ret = [];
        if (this._vorpalInstance) {
            this.cur_view_name = view_name;
            ret = ret.concat(await cli_utils.make_sub_bdr(this._vorpalInstance));
        }
        return ret;
    },
}