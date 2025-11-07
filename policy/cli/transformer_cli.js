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
        cli_utils.make_undo_cmd(vorpal, 'rule <is_constant> <target_state> <expression>', '创建一个状态转移条件 (is_constant: true=常量/false=字符串)', '删除所有转移规则',
            async (cmd_this, args) => {
                const isConstant = args.is_constant === 'true';
                const expression = String(args.expression);
                await policy_lib.add_transformer_rule(
                    ins.state_view.policy_view.cur_view_name,
                    ins.state_view.cur_view_name,
                    ins.cur_view_name,
                    args.target_state,
                    expression,
                    isConstant
                );
                return `已添加转移规则: 当条件满足时转移到状态 ${args.target_state} (${isConstant ? '常量' : '字符串'})`;
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
        cli_utils.make_undo_cmd(vorpal, 'statistic <target_state> <item_name> <expresstion> [is_increment]', '指定统计项赋值条件','删除所有统计项',
            async (cmd_this, args) => {
                await policy_lib.add_transformer_statistic_item(
                    ins.state_view.policy_view.cur_view_name,
                    ins.state_view.cur_view_name,
                    ins.cur_view_name,
                    args.target_state,
                    args.item_name,
                    args.expresstion,
                    args.is_increment === 'true'
                );
                return `已设置统计项: ${args.item_name} 在状态 ${args.target_state} 下的赋值条件为 ${args.expresstion}`;
            }, async (cmd_this, args) => {
                const resp = await policy_lib.get_transformer(
                    ins.state_view.policy_view.cur_view_name,
                    ins.state_view.cur_view_name,
                    ins.cur_view_name
                );
                let deletedCount = 0;
                if (resp.transformer && resp.transformer.statistic_items) {
                    for (const item of resp.transformer.statistic_items) {
                        await policy_lib.del_transformer_statistic_item(
                            ins.state_view.policy_view.cur_view_name,
                            ins.state_view.cur_view_name,
                            ins.cur_view_name,
                            item.target_state,
                            item.item_name,
                        );
                        deletedCount++;
                    }
                }
                return `已删除 ${deletedCount} 个统计项`;
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
                const isConstant = rule.is_constant || false;
                ret.push(`rule '${isConstant}' '${rule.target_state}' '${rule.expression}'`);
            }
        }
        if (resp.transformer && resp.transformer.statistic_items) {
            for (const item of resp.transformer.statistic_items) {
                ret.push(`statistic '${item.target_state}' '${item.item_name}' '${item.expression}' '${item.is_increment}'`);
            }
        }
        return ret;
    }
}
