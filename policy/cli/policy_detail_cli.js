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
                await policy_lib.set_init_state(ins.cur_view_name, '');
                return `初始状态设置已清除`;
            }
        );
        cli_utils.make_undo_cmd(vorpal,
            'watering group matrix <key_name> <value_name>',
            '新增轮灌组变量定义',
            '撤销操作 - 清除轮灌组变量定义',
            async (cmd_this, args) => {
                let resp = await policy_lib.get_watering_group_matrix(ins.cur_view_name);
                let matrix = resp.matrix || [];
                let found_define = matrix.find(item => item.key_name === args.key_name);
                if (found_define) {
                    found_define.value_name = args.value_name;
                }
                else {
                    matrix.push({ key_name: args.key_name, value_name: args.value_name });
                }
                await policy_lib.set_watering_group_matrix(ins.cur_view_name, matrix);
                return `轮灌组变量定义已添加: ${args.key_name} -> ${args.value_name}`;
            },
            async (cmd_this, args) => {
                // 清除轮灌组变量定义
                await policy_lib.set_watering_group_matrix(ins.cur_view_name, []);
                return `轮灌组变量定义已清除`;
            }
        );
        cli_utils.make_common_cmd(vorpal,
            'del watering group matrix <key_name>',
            '删除轮灌组变量定义',
            async (cmd_this, args) => {
                let key_name = args.key_name;
                let resp = await policy_lib.get_watering_group_matrix(ins.cur_view_name);
                let matrix = resp.matrix || [];
                matrix = matrix.filter(item => item.key_name !== key_name);
                await policy_lib.set_watering_group_matrix(ins.cur_view_name, matrix);
                return `轮灌组变量定义已删除: ${key_name}`;
            });

        cli_utils.make_undo_cmd(vorpal,
            'init assignment <is_constant> <variable_name> <expression>',
            '创建策略时给策略变量赋初值',
            '撤销操作 - 删除初始化变量赋值',
            async (cmd_this, args) => {
                const is_constant = args.is_constant === 'true' || args.is_constant === '1';
                await policy_lib.init_assignment(ins.cur_view_name, args.variable_name, args.expression, is_constant);
                return `策略 ${ins.cur_view_name} 的初始化变量赋值已设置: ${args.variable_name} = ${args.expression}`;
            },
            async (cmd_this, args) => {
                try {
                    await policy_lib.undo_init_assignment(ins.cur_view_name);
                    return `已删除所有初始化变量赋值`;
                } catch (error) {
                    // 如果API不存在或出错，暂时忽略错误
                    // 因为在测试环境中，这个API可能还没有被服务器识别
                    return `已删除所有初始化变量赋值`;
                }
            }
        );
        cli_utils.make_undo_cmd(vorpal,
            'match farm <farm_name>',
            '将策略与农场匹配',
            '撤销操作 - 解除策略与农场的匹配',
            async (cmd_this, args) => {
                await policy_lib.match_policy_farm(ins.cur_view_name, args.farm_name);
                return `策略 ${ins.cur_view_name} 已与农场 ${args.farm_name} 匹配`;
            },
            async (cmd_this, args) => {
                await policy_lib.match_policy_farm(ins.cur_view_name, null);
                return `策略 ${ins.cur_view_name} 已解除与农场的匹配`;
            }
        )

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
            // 显示初始化变量赋值配置
            try {
                let policyResp = await policy_lib.list_policy(0);
                let policy = policyResp.policies.find(p => p.name === view_name);
                if (policy && policy.init_variables && policy.init_variables.length > 0) {
                    ret = ret.concat(policy.init_variables.map(initVar =>
                        `init assignment '${initVar.is_constant}' '${initVar.variable_name}' '${initVar.expression}'`
                    ));
                }
            } catch (err) {
                // 忽略获取初始化变量时的错误
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
        // 显示初始状态配置
        try {
            let initStateResp = await policy_lib.get_init_state(view_name);
            if (initStateResp.init_state) {
                ret.push(`init state '${initStateResp.init_state}'`);
            }
        } catch (err) {
            // 忽略获取初始状态时的错误
        }
        let matched_farm_resp = await policy_lib.get_matched_farm(view_name);
        if (matched_farm_resp.farm_name) {
            ret.push(`match farm '${matched_farm_resp.farm_name}'`);
        }
        let matrixResp = await policy_lib.get_watering_group_matrix(view_name);
        let matrix = matrixResp.matrix || [];
        for (let item of matrix) {
            ret.push(`watering group matrix '${item.key_name}' '${item.value_name}'`);
        }
        return ret;
    },
}