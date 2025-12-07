import cli_utils from '../../public/lib/cli_utils.js';
import policy_lib from '../lib/policy_lib.js';
import transformer_cli from './transformer_cli.js';

// 常量定义
const TRIGGER_NAMES = {
    'enter': '进入状态时',
    'do': '在状态内',
    'exit': '离开状态时'
};

const ACTION_NAMES = {
    'enter': '进入动作',
    'do': '状态内动作',
    'exit': '离开动作'
};

const ASSIGNMENT_NAMES = {
    'enter': '进入赋值',
    'do': '状态内赋值',
    'exit': '离开赋值'
};

const ACTION_TYPES = ['enter', 'do', 'exit'];

// 辅助函数：创建动作命令
function createActionCommand(vorpal, ins, trigger) {
    cli_utils.make_undo_cmd(
        vorpal,
        `${trigger} action <device> <action>`,
        `${ACTION_NAMES[trigger]} - 添加${TRIGGER_NAMES[trigger]}执行的动作`,
        `撤销操作 - 删除所有${ACTION_NAMES[trigger]}`,
        async (cmd_this, args) => {
            await policy_lib.add_state_action(ins.policy_view.cur_view_name, ins.cur_view_name, trigger, args.device, args.action);
            return `已添加${ACTION_NAMES[trigger]}: 设备 ${args.device} 执行 ${args.action}`;
        },
        async (cmd_this, args) => {
            const resp = await policy_lib.get_state(ins.policy_view.cur_view_name, ins.cur_view_name);
            let deletedCount = 0;
            const actionsKey = `${trigger}_actions`;
            if (resp.state && resp.state[actionsKey]) {
                for (const action of resp.state[actionsKey]) {
                    await policy_lib.del_state_action(
                        ins.policy_view.cur_view_name,
                        ins.cur_view_name,
                        trigger,
                        action.device,
                        action.action
                    );
                    deletedCount++;
                }
            }
            return `已删除 ${deletedCount} 个${ACTION_NAMES[trigger]}`;
        }
    );
}

// 辅助函数：创建删除动作命令
function createDelActionCommand(vorpal, ins, trigger) {
    cli_utils.make_common_cmd(
        vorpal,
        `del ${trigger} <device> <action>`,
        `删除${ACTION_NAMES[trigger]} - 移除指定设备和动作`,
        async (cmd_this, args) => {
            await policy_lib.del_state_action(ins.policy_view.cur_view_name, ins.cur_view_name, trigger, args.device, args.action);
            return `已删除${ACTION_NAMES[trigger]}: 设备 ${args.device} 执行 ${args.action}`;
        }
    );
}

// 辅助函数：创建赋值表达式命令
function createAssignmentCommand(vorpal, ins, trigger) {
    cli_utils.make_undo_cmd(
        vorpal,
        `${trigger} assignment <is_constant> <variable_name> <expression>`,
        `${ASSIGNMENT_NAMES[trigger]} - 添加${TRIGGER_NAMES[trigger]}赋值表达式 (is_constant: true=常量/false=字符串)`,
        `撤销操作 - 删除所有${ASSIGNMENT_NAMES[trigger]}`,
        async (cmd_this, args) => {
            const isConstant = args.is_constant === 'true';
            // 服务器端总是期望字符串类型的 expression 参数
            const expression = String(args.expression);
            await policy_lib.add_assignment(ins.policy_view.cur_view_name, ins.cur_view_name, trigger, args.variable_name, expression, null, isConstant);
            return `已添加${ASSIGNMENT_NAMES[trigger]}: 变量 ${args.variable_name} = ${expression} (${isConstant ? '常量' : '字符串'})`;
        },
        async (cmd_this, args) => {
            const resp = await policy_lib.get_state(ins.policy_view.cur_view_name, ins.cur_view_name);
            let deletedCount = 0;
            const assignmentsKey = `${trigger}_assignments`;
            if (resp.state && resp.state[assignmentsKey]) {
                for (const assignment of resp.state[assignmentsKey]) {
                    if (!assignment.target_policy_name) {
                        await policy_lib.del_assignment(
                            ins.policy_view.cur_view_name,
                            ins.cur_view_name,
                            trigger,
                            assignment.variable_name
                        );
                        deletedCount++;
                    }
                }
            }
            return `已删除 ${deletedCount} 个${ASSIGNMENT_NAMES[trigger]}`;
        }
    );
}

// 辅助函数：创建删除赋值表达式命令
function createDelAssignmentCommand(vorpal, ins, trigger) {
    cli_utils.make_common_cmd(
        vorpal,
        `del ${trigger} assignment <variable_name>`,
        `删除${ASSIGNMENT_NAMES[trigger]} - 移除指定变量的赋值表达式`,
        async (cmd_this, args) => {
            await policy_lib.del_assignment(ins.policy_view.cur_view_name, ins.cur_view_name, trigger, args.variable_name);
            return `已删除${ASSIGNMENT_NAMES[trigger]}: 变量 ${args.variable_name}`;
        }
    );
}

// 辅助函数：创建跨策略变量赋值命令
function createCrossPolicyAssignmentCommand(vorpal, ins, trigger) {
    cli_utils.make_undo_cmd(
        vorpal,
        `${trigger} crossAssignment <is_constant> <policy_name> <variable_name> <expression>`,
        `跨策略${ASSIGNMENT_NAMES[trigger]} - 添加${TRIGGER_NAMES[trigger]}跨策略变量赋值 (is_constant: true=常量/false=字符串)`,
        `撤销操作 - 删除所有跨策略${ASSIGNMENT_NAMES[trigger]}`,
        async (cmd_this, args) => {
            const isConstant = args.is_constant === 'true';
            // 服务器端总是期望字符串类型的 expression 参数
            const expression = String(args.expression);
            await policy_lib.add_assignment(
                ins.policy_view.cur_view_name,
                ins.cur_view_name,
                trigger,
                args.variable_name,
                expression,
                args.policy_name,
                isConstant
            );
            return `已添加跨策略${ASSIGNMENT_NAMES[trigger]}: 策略 ${args.policy_name} 的变量 ${args.variable_name} = ${expression} (${isConstant ? '常量' : '字符串'})`;
        },
        async (cmd_this, args) => {
            const resp = await policy_lib.get_state(ins.policy_view.cur_view_name, ins.cur_view_name);
            let deletedCount = 0;
            const assignmentsKey = `${trigger}_assignments`;
            if (resp.state && resp.state[assignmentsKey]) {
                for (const assignment of resp.state[assignmentsKey]) {
                    if (assignment.target_policy_name) {
                        await policy_lib.del_assignment(
                            ins.policy_view.cur_view_name,
                            ins.cur_view_name,
                            trigger,
                            assignment.variable_name,
                            assignment.target_policy_name
                        );
                        deletedCount++;
                    }
                }
            }
            return `已删除 ${deletedCount} 个跨策略${ASSIGNMENT_NAMES[trigger]}`;
        }
    );
}

// 辅助函数：创建删除跨策略变量赋值命令
function createDelCrossPolicyAssignmentCommand(vorpal, ins, trigger) {
    cli_utils.make_common_cmd(
        vorpal,
        `del ${trigger} crossAssignment <policy_name> <variable_name>`,
        `删除跨策略${ASSIGNMENT_NAMES[trigger]} - 移除指定策略和变量的赋值`,
        async (cmd_this, args) => {
            await policy_lib.del_assignment(
                ins.policy_view.cur_view_name,
                ins.cur_view_name,
                trigger,
                args.variable_name,
                args.policy_name
            );
            return `已删除跨策略${ASSIGNMENT_NAMES[trigger]}: 策略 ${args.policy_name} 的变量 ${args.variable_name}`;
        }
    );
}

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

        // 创建所有动作相关命令
        ACTION_TYPES.forEach(actionType => {
            createActionCommand(vorpal, ins, actionType);
            createDelActionCommand(vorpal, ins, actionType);
        });

        // 创建所有赋值表达式相关命令
        ACTION_TYPES.forEach(actionType => {
            createAssignmentCommand(vorpal, ins, actionType);
            createDelAssignmentCommand(vorpal, ins, actionType);
        });

        // 创建所有跨策略变量赋值相关命令
        ACTION_TYPES.forEach(actionType => {
            createCrossPolicyAssignmentCommand(vorpal, ins, actionType);
            createDelCrossPolicyAssignmentCommand(vorpal, ins, actionType);
        });
        cli_utils.make_undo_cmd(vorpal,
            'warning <warning_template>', '设置状态告警模板', '撤销告警标记',
            async (cmd_this, args) => {
                await policy_lib.set_state_warning(ins.policy_view.cur_view_name, ins.cur_view_name, args.warning_template);
                cmd_this.log("已设置告警模板");
            }, async (cmd_this, args) => {
                await policy_lib.set_state_warning(ins.policy_view.cur_view_name, ins.cur_view_name, "");
                cmd_this.log("已撤销告警");
            });

        transformer_cli.state_view = ins;
        cli_utils.add_sub_cli(vorpal, transformer_cli, prompt);

        return vorpal;
    },
    enter_view_hook: async function (args) {
        await policy_lib.add_state(this.policy_view.cur_view_name, args.view_name);
        let prompt = this.prompt_prefix + args.view_name + '>';

        this._vorpalInstance.delimiter(prompt);
        this.cur_view_name = args.view_name;
        return `已进入状态视图: ${prompt.slice(0, -2)}`;
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
            // 使用常量定义处理所有动作类型
            ACTION_TYPES.forEach(actionType => {
                const actionsKey = `${actionType}_actions`;
                if (resp.state[actionsKey]) {
                    resp.state[actionsKey].forEach(action => {
                        ret.push(`${actionType} action '${action.device}' '${action.action}'`);
                    });
                }
            });

            // 处理所有赋值表达式类型
            ACTION_TYPES.forEach(actionType => {
                const assignmentsKey = `${actionType}_assignments`;
                if (resp.state[assignmentsKey]) {
                    resp.state[assignmentsKey].forEach(assignment => {
                        const isConstant = assignment.is_constant ? 'true' : 'false';
                        if (!assignment.target_policy_name) {
                            ret.push(`${actionType} assignment '${isConstant}' '${assignment.variable_name}' '${assignment.expression}'`);
                        }
                        else {
                            ret.push(`${actionType} crossAssignment '${isConstant}' '${assignment.target_policy_name}' '${assignment.variable_name}' '${assignment.expression}'`);
                        }
                    });
                }
            });

            // 显示告警模板
            if (resp.state.warning_template) {
                ret.push(`warning '${resp.state.warning_template}'`);
            }
        }

        if (this._vorpalInstance) {
            this.cur_view_name = view_name;
            // 状态转移配置
            let sub_bdr = await cli_utils.make_sub_bdr(this._vorpalInstance);
            if (sub_bdr.length > 0) {
                ret = ret.concat(sub_bdr);
            }
        }

        return ret;
    }
}
