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

        cli_utils.make_undo_cmd(vorpal,
            'source <name> <device> <data_type>',
            '添加一个数据源',
            '删除所有数据源',
            async (cmd_this, args) => {
                await policy_lib.add_source(ins.cur_view_name, args.name, args.device, args.data_type);
                return `数据源 ${args.name} 添加成功`;
            },
            async (cmd_this, args) => {
                // 删除所有数据源
                let pageNo = 0;
                while (true) {
                    let resp = await policy_lib.list_sources(ins.cur_view_name, pageNo);
                    if (resp.sources.length == 0) {
                        break;
                    }
                    for (let source of resp.sources) {
                        await policy_lib.del_source(ins.cur_view_name, source.name);
                    }
                    pageNo++;
                }
                return '所有数据源已删除';
            });

        cli_utils.make_common_cmd(vorpal, 'del source <name>', '删除一个数据源', async (cmd_this, args) => {
            let name = args.name;
            await policy_lib.del_source(ins.cur_view_name, name);
            return `数据源 ${name} 删除成功`;
        });

        cli_utils.make_undo_cmd(vorpal,
            'init state <state_name>',
            '设置策略的初始状态',
            '撤销操作 - 清除初始状态设置',
            async (cmd_this, args) => {
                await policy_lib.set_init_state(ins.cur_view_name, args.state_name);
                return `策略 ${ins.cur_view_name} 的初始状态已设置为: ${args.state_name}`;
            },
            async (cmd_this, args) => {
                // 清除初始状态设置（通过设置为null或空字符串）
                // 注意：这里我们需要一个清除初始状态的方法，暂时通过重新设置来实现
                return `初始状态设置已清除，将使用第一个状态作为初始状态`;
            }
        );

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
        try {
            const result = await policy_lib.del_policy(args.view_name);
            if (!result) {
                return `Error: 策略 ${args.view_name} 不存在`;
            }
            return `策略 ${args.view_name} 已删除`;
        } catch (error) {
            return `Error: ${error.err_msg || `策略 ${args.view_name} 删除失败`}`;
        }
    },
    make_bdr: async function (view_name) {
        let ret = [];
        try {
            // 显示初始状态配置
            try {
                let initStateResp = await policy_lib.get_init_state(view_name);
                if (initStateResp.init_state) {
                    ret.push(`init state ${initStateResp.init_state}`);
                }
            } catch (err) {
                // 忽略获取初始状态时的错误
            }

            let pageNo = 0;
            let total = 0;
            do {
                let resp = await policy_lib.list_sources(view_name, pageNo);
                if (resp.sources.length == 0) {
                    break;
                }
                ret = ret.concat(resp.sources.map(source =>
                    `source '${source.name}' '${source.device}' '${source.data_type}'`
                ));
                total = resp.total;
                pageNo++;
            } while (pageNo * 20 < total);
        } catch (err) {
        }
        if (this._vorpalInstance) {
            this.cur_view_name = view_name;
            ret = ret.concat(await cli_utils.make_sub_bdr(this._vorpalInstance));
        }
        return ret;
    },
}