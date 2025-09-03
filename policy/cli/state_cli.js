import cli_utils from '../../public/lib/cli_utils.js';
import policy_lib from '../lib/policy_lib.js';
import transformer_cli from './transformer_cli.js';

// 辅助函数：创建动作命令
function createActionCommand(vorpal, ins, trigger, actionType) {
    const triggerNames = {
        'enter': '进入状态时',
        'do': '在状态内',
        'exit': '离开状态时'
    };
    
    const actionNames = {
        'enter': '进入动作',
        'do': '状态内动作', 
        'exit': '离开动作'
    };
    
    cli_utils.make_undo_cmd(
        vorpal, 
        `${trigger} action <device> <action>`, 
        `【${actionNames[trigger]}】添加${triggerNames[trigger]}执行的动作`, 
        `【撤销操作】删除所有${actionNames[trigger]}`,
        async (cmd_this, args) => {
            await policy_lib.add_state_action(ins.policy_view.cur_view_name, ins.cur_view_name, trigger, args.device, args.action);
            return `已添加${actionNames[trigger]}: 设备 ${args.device} 执行 ${args.action}`;
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
            return `已删除 ${deletedCount} 个${actionNames[trigger]}`;
        }
    );
}

// 辅助函数：创建删除动作命令
function createDelActionCommand(vorpal, ins, trigger) {
    const actionNames = {
        'enter': '进入动作',
        'do': '状态内动作',
        'exit': '离开动作'
    };
    
    cli_utils.make_undo_cmd(
        vorpal,
        `del ${trigger} <device> <action>`,
        `【删除${actionNames[trigger]}】移除指定设备和动作`,
        `【撤销删除】恢复已删除的${actionNames[trigger]}`,
        async (cmd_this, args) => {
            await policy_lib.del_state_action(ins.policy_view.cur_view_name, ins.cur_view_name, trigger, args.device, args.action);
            return `已删除${actionNames[trigger]}: 设备 ${args.device} 执行 ${args.action}`;
        },
        async (cmd_this, args) => {
            await policy_lib.add_state_action(ins.policy_view.cur_view_name, ins.cur_view_name, trigger, args.device, args.action);
            return `已恢复${actionNames[trigger]}: 设备 ${args.device} 执行 ${args.action}`;
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

        // 创建所有动作命令
        createActionCommand(vorpal, ins, 'enter');
        createActionCommand(vorpal, ins, 'do');
        createActionCommand(vorpal, ins, 'exit');

        transformer_cli.state_view = ins;
        cli_utils.add_sub_cli(vorpal, transformer_cli, prompt);

        // 创建所有删除动作命令
        createDelActionCommand(vorpal, ins, 'enter');
        createDelActionCommand(vorpal, ins, 'do');
        createDelActionCommand(vorpal, ins, 'exit');

        // 添加 bdr 命令
        vorpal.command('bdr', '【查看配置】列出所有状态动作配置')
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
            // 使用循环处理所有动作类型，减少重复代码
            const actionTypes = ['enter', 'do', 'exit'];
            for (const actionType of actionTypes) {
                const actionsKey = `${actionType}_actions`;
                if (resp.state[actionsKey]) {
                    for (const action of resp.state[actionsKey]) {
                        ret.push(`  ${actionType} action ${action.device} ${action.action}`);
                    }
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
