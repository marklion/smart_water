import cli_utils from '../../public/lib/cli_utils.js';
import policy_detail_cli from './policy_detail_cli.js';
import policy_lib from '../lib/policy_lib.js';
import state_cli from './state_cli.js';
export default {
    command: 'policy',
    name: '策略管理',
    _vorpalInstance: null,
    install: function (parent_prompt) {
        let prompt = parent_prompt + 'policy> ';
        let ins = this;
        const vorpal = cli_utils.create_vorpal();
        this._vorpalInstance = vorpal;
        vorpal.delimiter(prompt);
        vorpal.command('policy <name>', '创建/进入策略')
            .action(async function (args) {
                try {
                    const result = await policy_lib.add_policy(args.name);
                    if (result && result.result) {
                        this.log(`已创建策略: ${args.name}`);
                        // 创建新的视图实例
                        const newVorpal = cli_utils.create_vorpal();
                        // 注册状态命令
                        state_cli.policy_name = args.name;
                        cli_utils.add_sub_cli(newVorpal, state_cli, `sw_cli> policy-${args.name}>`);
                        newVorpal.delimiter(`sw_cli> policy-${args.name}>`);

                        // 添加返回命令
                        newVorpal.command('return', '返回上一级视图')
                            .action(function() {
                                newVorpal.hide();
                                vorpal.show();
                                vorpal.delimiter('sw_cli> policy>');
                                return vorpal;
                            });

                        // 添加 bdr 命令
                        newVorpal.command('bdr', '列出所有配置')
                            .action(async function (args) {
                                try {
                                    const states = await policy_lib.list_states(args.name);
                                    let output = [`policy ${args.name}`];
                                    if (states && states.states) {
                                        for (const state of states.states) {
                                            const stateDetail = await policy_lib.get_state(args.name, state.name);
                                            if (stateDetail && stateDetail.state) {
                                                output.push(`  state ${stateDetail.state.name}`);
                                                if (stateDetail.state.enter_actions) {
                                                    for (const action of stateDetail.state.enter_actions) {
                                                        output.push(`    enter action ${action.device} ${action.action}`);
                                                    }
                                                }
                                                output.push('  return');
                                            }
                                        }
                                    }
                                    output.push('return');
                                    this.log(output.join('\n'));
                                } catch (err) {
                                    this.log('Error:', err.err_msg || '未知错误');
                                }
                            });

                        // 隐藏当前视图，显示新视图
                        vorpal.hide();
                        newVorpal.show();
                    } else {
                        this.log('创建策略失败');
                    }
                } catch (err) {
                    this.log('Error:', err.err_msg || err.message || '未知错误');
                }
            });
        vorpal.command('bdr', '列出所有配置')
            .action(async function (args) {
                try {
                    this.log((await ins.make_bdr()).join('\n'));
                } catch (err) {
                    this.log('Error:', err.err_msg || '未知错误');
                }
            });
        return vorpal;
    },
    make_bdr: async function () {
        let ret = [];
        // 获取所有策略
        let pageNo = 0;
        let policies = [];
        while (true) {
            const result = await policy_lib.list_policy(pageNo);
            if (!result.policies || result.policies.length === 0) {
                break;
            }
            policies = policies.concat(result.policies);
            pageNo++;
        }

        // 遍历每个策略，获取其状态和动作
        for (const policy of policies) {
            ret.push(`policy ${policy.name}`);
            const states = await policy_lib.list_states(policy.name);
            if (states && states.states) {
                for (const state of states.states) {
                    const stateDetail = await policy_lib.get_state(policy.name, state.name);
                    if (stateDetail && stateDetail.state) {
                        ret.push(`  state ${stateDetail.state.name}`);
                        if (stateDetail.state.enter_actions) {
                            for (const action of stateDetail.state.enter_actions) {
                                ret.push(`    enter action ${action.device} ${action.action}`);
                            }
                        }
                        ret.push('  return');
                    }
                }
            }
            ret.push('return');
        }
        return ret;
    },
}