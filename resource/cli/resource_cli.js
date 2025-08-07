import cli_utils from '../../public/lib/cli_utils.js';
import farm_cli from './farm_cli.js';
import block_cli from './block_cli.js';
export default {
    command: 'resource',
    name: '资源管理',
    _vorpalInstance: null,
    install: function (parent_prompt) {
        let prompt = parent_prompt + 'resource> ';
        let ins = this;
        const vorpal = cli_utils.create_vorpal();
        this._vorpalInstance = vorpal;
        cli_utils.add_sub_cli(vorpal, farm_cli, prompt);
        cli_utils.add_sub_cli(vorpal, block_cli, prompt);
        vorpal.delimiter(prompt)
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
        let ret = []
        if (this._vorpalInstance) {
            ret = ret.concat(await cli_utils.make_sub_bdr(this._vorpalInstance));
        }
        return ret;
    },
}