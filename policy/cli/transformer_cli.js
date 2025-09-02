import cli_utils from '../../public/lib/cli_utils.js';
import policy_lib from '../lib/policy_lib.js';

export default {
    command: 'transformer',
    name: '创建/进入转换器',
    _vorpalInstance: null,
    install: function (parent_prompt) {
        let prompt = parent_prompt + 'transformer-';
        let ins = this;
        const vorpal = cli_utils.create_vorpal();
        this._vorpalInstance = vorpal;
        this.prompt_prefix = prompt;

        // 添加 rule 命令
        cli_utils.make_undo_cmd(vorpal, 'rule <target_state> <expression>', '创建一个状态转移条件', '删除所有转移规则',
            async (cmd_this, args) => {
                await policy_lib.add_transformer_rule(
                    ins.state_view.policy_view.cur_view_name, 
                    ins.state_view.cur_view_name, 
                    ins.cur_view_name, 
                    args.target_state, 
                    args.expression
                );
                return `已添加转移规则: 当条件满足时转移到状态 ${args.target_state}`;
            }, 
            async (cmd_this, args) => {
                const resp = await policy_lib.get_transformer(
                    ins.state_view.policy_view.cur_view_name, 
                    ins.state_view.cur_view_name, 
                    ins.cur_view_name
                );
                let deletedCount = 0;
                if (resp.transformer && resp.transformer.rules) {
                    for (const rule of resp.transformer.rules) {
                        await policy_lib.del_transformer_rule(
                            ins.state_view.policy_view.cur_view_name, 
                            ins.state_view.cur_view_name, 
                            ins.cur_view_name, 
                            rule.target_state
                        );
                        deletedCount++;
                    }
                }
                return `已删除 ${deletedCount} 个转移规则`;
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
        await policy_lib.add_transformer(this.state_view.policy_view.cur_view_name, this.state_view.cur_view_name, args.view_name);
        let prompt = this.prompt_prefix + args.view_name + '>';

        this._vorpalInstance.delimiter(prompt);
        this.cur_view_name = args.view_name;
        return `已进入转换器视图: ${prompt}`;
    },
    get_all_views: async function () {
        let ret = []
        let pageNo = 0;
        while (true) {
            let resp = await policy_lib.list_transformers(this.state_view.policy_view.cur_view_name, this.state_view.cur_view_name, pageNo)
            if (resp.transformers.length == 0) {
                break;
            }
            ret = ret.concat(resp.transformers.map(transformer => transformer.name));
            pageNo++;
        }
        return ret;
    },
    undo_hook: async function (args) {
        await policy_lib.del_transformer(this.state_view.policy_view.cur_view_name, this.state_view.cur_view_name, args.view_name);
        return `转换器 ${args.view_name} 已删除`;
    },
    make_bdr: async function (view_name) {
        let ret = [];
        const resp = await policy_lib.get_transformer(this.state_view.policy_view.cur_view_name, this.state_view.cur_view_name, view_name);
        if (resp.transformer && resp.transformer.rules) {
            for (const rule of resp.transformer.rules) {
                ret.push(`  rule ${rule.target_state} '${rule.expression}'`);
            }
        }
        return ret;
    }
}
