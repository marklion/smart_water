import cli_utils from '../../public/lib/cli_utils.js';
import resource_lib from '../lib/resource_lib.js';
async function get_all_blocks() {
    let blocks = [];
    let pageNo = 0;
    while (true) {
        let result = await resource_lib.list_block(undefined, pageNo);
        if (result.blocks.length === 0) {
            break;
        }
        blocks = blocks.concat(result.blocks);
        pageNo++;
    }
    return blocks;
}
export default {
    command: 'block',
    name: '地块管理',
    _vorpalInstance: null,
    install: function (parent_prompt) {
        let prompt = parent_prompt + 'block> ';
        let ins = this;
        const vorpal = cli_utils.create_vorpal();
        this._vorpalInstance = vorpal;
        cli_utils.make_undo_cmd(vorpal,
            'add block <farm_name> <block_name> <block_area> [info]',
            '添加一个地块',
            '删除所有地块',
            async (cmd_this, args) => {
                let farm_name = args.farm_name;
                let block_name = args.block_name;
                let area = args.block_area;
                let info = args.info || '';
                let result = await resource_lib.add_block(farm_name, block_name, area, info);
                if (result.result) {
                    return `地块 ${block_name} 添加成功`;
                } else {
                    return `地块 ${block_name} 添加失败`;
                }
            }, async (cmd_this, args) => {
                let blocks = await get_all_blocks();
                for (let block of blocks) {
                    await resource_lib.del_block(block.farm_name, block.name);
                }
                return '所有地块已删除';
            })
        cli_utils.make_common_cmd(vorpal, 'del block <farm_name> <block_name>', '删除一个地块', async (cmd_this, args) => {
            let farm_name = args.farm_name;
            let block_name = args.block_name;
            let result = await resource_lib.del_block(farm_name, block_name);
            if (result.result) {
                return `地块 ${block_name} 删除成功`;
            } else {
                return `地块 ${block_name} 删除失败`;
            }
        });
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
        let blocks = await get_all_blocks()
        for (let block of blocks) {
            ret.push(`add block '${block.farm_name}' '${block.name}' '${block.info || ''}'`);
        }
        if (this._vorpalInstance) {
            ret = ret.concat(await cli_utils.make_sub_bdr(this._vorpalInstance));
        }
        return ret;
    },
}