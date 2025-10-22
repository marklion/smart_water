import fs from 'fs';
import path from 'path';
import moment from 'moment';

// 统计文件目录（可通过环境变量 STAT_FILE_DIR 覆盖），默认使用当前工作目录保持向后兼容
const STAT_DIR = process.env.STAT_FILE_DIR || process.cwd();

function sanitize_item_name(item) {
    let name = String(item || '');
    // 取 basename 防止目录穿越
    name = path.basename(name);
    // 仅保留字母数字、下划线和连接符，其他字符替换为下划线
    name = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    // 限制长度以防滥用
    if (name.length > 64) name = name.slice(0, 64);
    if (!name) name = 'default';
    return name;
}

// 返回用于存放统计的文件绝对路径，并确保目录存在
async function get_file_by_item(item) {
    const name = sanitize_item_name(item);
    const filePath = path.join(STAT_DIR, `st_${name}.txt`);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    return filePath;
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
                const filePath = await get_file_by_item(body.item_name);
                // 使用 appendFile，底层会创建文件（我们已确保目录存在）并进行追加，避免手动 open/close
                await fs.promises.appendFile(filePath, content, 'utf8');
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
                const files = (await fs.promises.readdir(STAT_DIR)).filter(f => f.startsWith('st_') && f.endsWith('.txt'));
                // 只分页文件名列表，避免一次性处理所有文件
                let cur_page_files = files.slice(pageNo * 20, (pageNo + 1) * 20);
                for (let file of cur_page_files) {
                    const item_name = path.basename(file, '.txt');
                    const filePath = path.join(STAT_DIR, file);
                    try {
                        const data = await fs.promises.readFile(filePath, 'utf8');
                        const lines = data.trim().split('\n').filter(l => l.trim().length > 0);
                        if (lines.length > 0) {
                            const lastLine = lines[lines.length - 1];
                            const parts = lastLine.split('==');
                            if (parts.length >= 3) {
                                items.push({
                                    item_name: item_name.slice(3), // 去掉前缀 st_
                                    last_update: parts[0],
                                    last_value: parts[1]
                                });
                            }
                        }
                    } catch (err) {
                        // 忽略单个文件读取错误，继续列出其他文件
                        console.error('read stat file error', filePath, err && err.message);
                    }
                }
                return { items: items, total: files.length };
            }
        },
        list_item_history:{
            name: '列出统计项历史记录',
            description: '列出某个统计项的历史记录',
            is_write: false,
            is_get_api: true,
            params: {
                item_name: { type: String, mean: '统计项名称', example: 'total_water_usage', have_to: true },
            },
            result: {
                records: {
                    type: Array, mean: '统计记录列表', explain: {
                        timestamp: { type: String, mean: '时间戳', example: '2024-01-01 12:00:00' },
                        value: { type: String, mean: '统计值', example: 'abc' }
                    }
                },
            },
            func: async function (body, token) {
                let records = [];
                let pageNo = body.pageNo || 0;
                const item_name = body.item_name;
                const filePath = await get_file_by_item(item_name);
                try {
                    const data = await fs.promises.readFile(filePath, 'utf8');
                    const lines = data.trim().split('\n').filter(l => l.trim().length > 0);
                    lines.reverse();
                    // 只分页记录列表，避免一次性处理所有记录
                    let cur_page_lines = lines.slice(pageNo * 20, (pageNo + 1) * 20);
                    for (let line of cur_page_lines) {
                        const parts = line.split('==');
                        if (parts.length >= 3) {
                            records.push({
                                timestamp: parts[0],
                                value: parts[1]
                            });
                        }
                    }
                    return { records: records, total: lines.length };
                } catch (err) {
                    // 如果文件不存在或读取错误，返回空记录列表
                    console.error('read stat file error', filePath, err && err.message);
                    return { records: [], total: 0 };
                }
            }
        },
    }
}