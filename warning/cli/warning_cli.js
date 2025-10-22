import cli_utils from '../../public/lib/cli_utils.js';
import warning_lib from '../lib/warning_lib.js';
export default {
    command: 'warning',
    name: '告警管理',
    _vorpalInstance: null,
    install: function (parent_prompt) {
        let prompt = parent_prompt + 'warning> ';
        let ins = this;
        const vorpal = cli_utils.create_vorpal();
        this._vorpalInstance = vorpal;
        cli_utils.make_display_cmd(vorpal, 'list warnings', '列出当前的告警', async (cmd_this, args, pageNo) => {
            let result = await warning_lib.list_warnings(pageNo, this.token);
            let warnings = result.warnings;
            if (warnings.length > 0) {
                cmd_this.log(warnings.map(warning => `${warning.content}`).join('\n'));
                cmd_this.log(`\n共 ${result.total} 条告警，显示最新 ${warnings.length} 条`);
            } else {
                cmd_this.log('暂无告警');
            }
            return warnings.length;
        });
        vorpal.delimiter(prompt)
        return vorpal;
    },
    make_bdr: async function () {
        let ret = []
        return ret;
    },
}