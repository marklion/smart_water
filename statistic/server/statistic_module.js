import fs from 'fs';
import path from 'path';
import moment from 'moment';
async function get_file_by_item(item) {
    const name = path.basename(String(item));
    const filePath = path.join(process.cwd(), `st_${name}.txt`);
    let handle;
    try {
        handle = await fs.promises.open(filePath, 'r+'); // 读写权限（文件必须存在）
    } catch (err) {
        if (err.code === 'ENOENT') {
            handle = await fs.promises.open(filePath, 'w+'); // 不存在则创建并可读写
        } else {
            throw err;
        }
    }
    return handle;
}
export default {
    name: 'statistic',
    description: '统计管理',
    methods: {
        update_item: {
            name: '更新统计项',
            description: '更新某个统计项的值',
            is_write: true,
            is_get_api: false,
            params: {
                item_name: { type: String, mean: '统计项名称', example: 'total_water_usage', have_to: true },
                value: { type: String, mean: '统计值', example: 'abc', have_to: true }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                let content = `${moment().format('YYYY-MM-DD HH:mm:ss')}==${body.value}==\n`;
                let fileHandle = await get_file_by_item(body.item_name);
                await fileHandle.appendFile(content, 'utf8');
                await fileHandle.close();
                return { result: true };
            }
        },
        list_items: {
            name: '列出统计项',
            description: '列出有哪些统计项',
            is_write: false,
            is_get_api: true,
            params: {
            },
            result: {
                items: {
                    type: Array, mean: '统计项列表', explain: {
                        item_name: { type: String, mean: '统计项名称', example: 'total_water_usage' },
                        last_value: { type: String, mean: '最新统计值', example: 'abc' },
                        last_update: { type: String, mean: '最后更新时间', example: '2024-01-01 12:00:00' }
                    }
                }
            },
            func: async function (body, token) {
                let items = [];
                let pageNo = body.pageNo || 0;
                const files = await fs.promises.readdir(process.cwd());
                let cur_page_files = files.slice(pageNo * 20, (pageNo + 1) * 20);
                for (let file of cur_page_files) {
                    if (file.endsWith('.txt') && file.startsWith('st_')) {
                        const item_name = path.basename(file, '.txt');
                        const fileHandle = await fs.promises.open(path.join(process.cwd(), file), 'r');
                        const data = await fileHandle.readFile('utf8');
                        await fileHandle.close();
                        const lines = data.trim().split('\n').filter(l => l.trim().length > 0);
                        if (lines.length > 0) {
                            const lastLine = lines[lines.length - 1];
                            const parts = lastLine.split('==');
                            if (parts.length >= 3) {
                                items.push({
                                    item_name: item_name,
                                    last_update: parts[0],
                                    last_value: parts[1]
                                });
                            }
                        }
                    }
                }
                return { items: items, total: files.length };
            }
        },
    }
}