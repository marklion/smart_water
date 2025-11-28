import fs from 'fs';
import path from 'path';
import moment from 'moment';
import statistic_lib from '../lib/statistic_lib.js';

// 统计文件目录（可通过环境变量 STAT_FILE_DIR 覆盖），默认使用当前工作目录保持向后兼容
const STAT_DIR = process.env.STAT_FILE_DIR || process.cwd();

// 返回用于存放统计的文件绝对路径，并确保目录存在
async function get_file_by_item(item) {
    const name = item;
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
                value: { type: String, mean: '统计值', example: 'abc', have_to: true },
                is_increment: { type: Boolean, mean: '是否为增量更新', example: false, have_to: false }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                let value_to_store = parseFloat(body.value);
                if (body.is_increment) {
                    let last_value = 0;
                    let resp = await statistic_lib.list_all_items(token);
                    let existing_item = resp.find(i => i.item_name === body.item_name);
                    if (existing_item) {
                        last_value = parseFloat(existing_item.last_value) || 0;
                    }
                    value_to_store = parseFloat(body.value) + last_value;
                }

                let content = `${moment().format('YYYY-MM-DD HH:mm:ss')}==${value_to_store.toFixed(2)}==\n`;
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
        list_item_history: {
            name: '列出统计项历史记录',
            description: '列出某个统计项的历史记录',
            is_write: false,
            is_get_api: true,
            params: {
                item_name: { type: String, mean: '统计项名称', example: 'total_water_usage', have_to: true },
                start_date: { type: String, mean: '开始日期时间', example: '2024-01-01 00:00:00', have_to: false },
                end_date: { type: String, mean: '结束日期时间', example: '2024-01-31 23:59:59', have_to: false },
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
                const start_date = body.start_date;
                const end_date = body.end_date;
                const filePath = await get_file_by_item(item_name);
                try {
                    const data = await fs.promises.readFile(filePath, 'utf8');
                    const lines = data.trim().split('\n').filter(l => l.trim().length > 0);
                    
                    // 解析所有记录（每行可能有多个 timestamp==value 对）
                    let allRecords = [];
                    for (let line of lines) {
                        const parts = line.split('==');
                        // 每行格式：timestamp==value==timestamp==value==...
                        // 所以 parts 应该是 [timestamp, value, timestamp, value, ...]
                        for (let i = 0; i < parts.length - 1; i += 2) {
                            const timestamp = parts[i].trim();
                            const value = parts[i + 1].trim();
                            if (timestamp && value) {
                                allRecords.push({
                                    timestamp: timestamp,
                                    value: value,
                                    line: line // 保存原始行用于排序
                                });
                            }
                        }
                    }
                    
                    // 按时间倒序排列（最新的在前，用于获取最新值）
                    allRecords.sort((a, b) => {
                        return new Date(b.timestamp) - new Date(a.timestamp);
                    });
                    
                    // 如果有日期范围参数，进行筛选
                    if (start_date || end_date) {
                        const startTime = start_date ? new Date(start_date).getTime() : 0;
                        const endTime = end_date ? new Date(end_date).getTime() : Date.now();
                        
                        allRecords = allRecords.filter(record => {
                            try {
                                const recordTime = new Date(record.timestamp).getTime();
                                return recordTime >= startTime && recordTime <= endTime;
                            } catch (e) {
                                console.warn('Invalid timestamp:', record.timestamp);
                                return false;
                            }
                        });
                    }
                    
                    // 分页处理
                    const total = allRecords.length;
                    const startIndex = pageNo * 20;
                    const endIndex = (pageNo + 1) * 20;
                    const pageRecords = allRecords.slice(startIndex, endIndex);
                    
                    // 只返回 timestamp 和 value
                    records = pageRecords.map(r => ({
                        timestamp: r.timestamp,
                        value: r.value
                    }));
                    
                    return { records: records, total: total };
                } catch (err) {
                    // 如果文件不存在或读取错误，返回空记录列表
                    console.error('read stat file error', filePath, err && err.message);
                    return { records: [], total: 0 };
                }
            }
        },
    }
}