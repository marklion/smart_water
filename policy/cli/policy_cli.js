import cli_utils from '../../public/lib/cli_utils.js';
import policy_detail_cli from './policy_detail_cli.js';
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
        vorpal.command('bdr', '列出所有配置')
            .action(async function (args) {
                try {
                    this.log((await ins.make_bdr()).join('\n'));
                } catch (err) {
                    this.log('Error:', err.err_msg || '未知错误');
                }
            });
        cli_utils.make_undo_cmd(
            vorpal,
            'scan period <period_ms>',
            '扫描周期配置，默认是0，0表示不扫描',
            '撤销操作 - 停止策略扫描',
            async (cmd_this, args) => {
                const policy_lib = (await import('../lib/policy_lib.js')).default;
                const period_ms = parseInt(args.period_ms);
                if (isNaN(period_ms) || period_ms < 0) {
                    return '错误: 扫描周期必须是非负整数';
                }
                const result = await policy_lib.set_scan_period(period_ms);
                if (result.result) {
                    if (period_ms === 0) {
                        return '扫描周期已设置为0，策略扫描已停止';
                    } else {
                        return `扫描周期已设置为 ${period_ms} 毫秒`;
                    }
                } else {
                    return '设置扫描周期失败';
                }
            },
            async (cmd_this, args) => {
                const policy_lib = (await import('../lib/policy_lib.js')).default;
                const result = await policy_lib.set_scan_period(0);
                if (result.result) {
                    return '已停止策略扫描';
                } else {
                    return '停止策略扫描失败';
                }
            }
        );
        return vorpal;
    },
    make_bdr: async function () {
        let ret = []
        if (this._vorpalInstance) {
            ret = ret.concat(await cli_utils.make_sub_bdr(this._vorpalInstance));
        }
        return ret;
    },
}