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
                cmd_this.log(items.map(item => `${item.last_update}-${item.item_name}-${item.last_value}`).join('\n'));
            } else {
                cmd_this.log('暂无统计项');
            }
            return items.length;
        });
        cli_utils.make_display_cmd(vorpal, 'list item history <item_name>', '列出某个统计项的历史记录', async (cmd_this, args, pageNo) => {
            let res = await statistic_lib.list_item_history(args.item_name, pageNo, this.token);
            let items = res.records;
            if (items.length > 0) {
                cmd_this.log(items.map(item => `${item.timestamp}-${item.value}`).join('\n'));
            } else {
                cmd_this.log('暂无历史记录');
            }
            return items.length;
        });
        cli_utils.make_common_cmd(vorpal, 'update item <item_name> <value>', '更新统计项', async (cmd_this, args) => {
            await statistic_lib.update_item(args.item_name, args.value, false, this.token);
            return `统计项 ${args.item_name} 已更新为: ${args.value}`;
        });
        vorpal.delimiter(prompt)
        return vorpal;
    },
    make_bdr: async function () {
        let ret = []
        return ret;
    },
}