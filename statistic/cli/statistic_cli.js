import cli_utils from '../../public/lib/cli_utils.js';
import statistic_lib from '../lib/statistic_lib.js';
export default {
    command: 'statistic',
    name: '统计管理',
    _vorpalInstance: null,
    install: function (parent_prompt) {
        let prompt = parent_prompt + 'statistic> ';
        const vorpal = cli_utils.create_vorpal();
        this._vorpalInstance = vorpal;
        cli_utils.make_display_cmd(vorpal, 'list items', '列出当前的统计项', async (cmd_this, args, pageNo) => {
            let items = (await statistic_lib.list_items(pageNo, this.token)).items;
            if (items.length > 0) {
                cmd_this.log(items.map(item => `${item.item_name} - ${item.last_value} - ${item.last_update}`).join('\n'));
            } else {
                cmd_this.log('暂无统计项');
            }
            return items.length;
        });
        vorpal.delimiter(prompt)
        return vorpal;
    },
    make_bdr: async function () {
        let ret = []
        return ret;
    },
}