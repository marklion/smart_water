import cli_utils from '../../public/lib/cli_utils.js';
import policy_detail_cli from './policy_detail_cli.js';
import policy_lib from '../lib/policy_lib.js';
export default {
    command: 'policy',
    name: '策略管理',
    _vorpalInstance: null,
    install: function (parent_prompt) {
        let prompt = parent_prompt + 'policy> ';
        let ins = this;
        const vorpal = cli_utils.create_vorpal();
        this._vorpalInstance = vorpal;
        cli_utils.add_sub_cli(vorpal, policy_detail_cli, prompt);
        vorpal.delimiter(prompt)
        cli_utils.make_undo_cmd(
            vorpal,
            'scan period <period_ms>',
            '扫描周期配置，默认是0，0表示不扫描',
            '撤销操作 - 停止策略扫描',
            async (cmd_this, args) => {
                const period_ms = parseInt(args.period_ms);
                if (isNaN(period_ms) || period_ms < 0) {
                    throw { err_msg: '扫描周期必须是非负整数' }
                }
                const result = await policy_lib.set_scan_period(period_ms);
                if (result.result) {
                    if (period_ms === 0) {
                        return '扫描周期已设置为0，策略扫描已停止';
                    } else {
                        return `扫描周期已设置为 ${period_ms} 毫秒`;
                    }
                } else {
                    throw { err_msg: '设置扫描周期失败' }
                }
            },
            async (cmd_this, args) => {
                const result = await policy_lib.set_scan_period(0);
                if (result.result) {
                    return '已停止策略扫描';
                } else {
                    return '停止策略扫描失败';
                }
            }
        );
        cli_utils.make_display_cmd(vorpal, 'list policy <policy_name>', '列出策略状态', async (cmd_this, args, pageNo) => {
            let result = await policy_lib.get_policy_runtime(args.policy_name);
            cmd_this.log(`变量:${result.variables}`);
            cmd_this.log(`当前状态:${result.current_state}`);

            return 0;
        });
        
        cli_utils.make_common_cmd(vorpal, 'runtime assignment <policy_name> <is_constant> <variable_name> <expression>', '直接给某个策略的某个变量赋值', async (cmd_this, args) => {
            const is_constant = args.is_constant === 'true' || args.is_constant === '1';
            await policy_lib.runtime_assignment(args.policy_name, args.variable_name, args.expression, is_constant);
            return `策略 ${args.policy_name} 的运行时变量赋值已设置: ${args.variable_name} = ${args.expression}`;
        });
        cli_utils.make_display_cmd(vorpal, 'list watering groups', '列出所有轮灌组运行状态', async (cmd_this, args, pageNo) => {
            let result = await policy_lib.list_watering_groups(pageNo);
            let lines = result.groups;
            for (let line of lines) {
                cmd_this.log(`${line.name}|${line.area}|${line.method}|${line.fert_rate}|${line.total_water}|${line.total_fert}|${line.minute_left}|${line.water_valve}|${line.fert_valve}|${line.cur_state}`);
            }
            return lines.length;
        });
        return vorpal;
    },
    make_bdr: async function () {
        let ret = []
        if (this._vorpalInstance) {
            let scan_period = await policy_lib.get_scan_period();
            if (scan_period.period_ms != 0) {
                ret.push(`scan period '${scan_period.period_ms}'`);
            }
            ret = ret.concat(await cli_utils.make_sub_bdr(this._vorpalInstance));
        }
        return ret;
    },
}