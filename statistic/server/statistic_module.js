import fs from 'fs';
import path from 'path';
import moment from 'moment';
import XLSX from 'xlsx';
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
                const parseTime = (str) => {
                    if (!str) return NaN;
                    const m = moment(str, 'YYYY-MM-DD HH:mm:ss', true);
                    if (m.isValid()) return m.valueOf();
                    const d = new Date(str);
                    return isNaN(d.getTime()) ? NaN : d.getTime();
                };
                try {
                    const data = await fs.promises.readFile(filePath, 'utf8');
                    const lines = data.trim().split('\n').filter(l => l.trim().length > 0);

                    let allRecords = [];
                    for (let line of lines) {
                        const parts = line.split('==');
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
                    

                    if (start_date || end_date) {
                        const startTime = start_date ? parseTime(start_date) : 0;
                        const endTime = end_date ? parseTime(end_date) : Infinity;
                        
                        allRecords = allRecords.filter(record => {
                            const recordTime = parseTime(record.timestamp);
                            if (isNaN(recordTime)) {
                                console.warn('Invalid timestamp:', record.timestamp);
                                return false;
                            }
                            return recordTime >= startTime && recordTime <= endTime;
                        });
                    }
                    
                    // 分页处理
                    const total = allRecords.length;
                    const startIndex = pageNo * 20;
                    const endIndex = (pageNo + 1) * 20;
                    const pageRecords = allRecords.slice(startIndex, endIndex);

                    records = pageRecords.map(r => ({
                        timestamp: r.timestamp,
                        value: r.value
                    }));
                    
                    return { records: records, total: total };
                } catch (err) {
                    console.error('read stat file error', filePath, err && err.message);
                    return { records: [], total: 0 };
                }
            }
        },
        export_item_history_excel: {
            name: '导出统计项历史记录Excel',
            description: '导出某个统计项的历史记录为Excel文件',
            is_write: false,
            is_get_api: false,
            is_file_download: true, // 标记为文件下载接口
            params: {
                item_name: { type: String, mean: '统计项名称', example: 'total_water_usage', have_to: true },
                start_date: { type: String, mean: '开始日期时间', example: '2024-01-01 00:00:00', have_to: false },
                end_date: { type: String, mean: '结束日期时间', example: '2024-01-31 23:59:59', have_to: false },
                item_label: { type: String, mean: '统计项显示名称', example: '主管流量', have_to: false },
                unit: { type: String, mean: '单位', example: 'L/h', have_to: false },
            },
            result: {
                
            },
            func: async function (body, token, res) {
                const item_name = body.item_name;
                const start_date = body.start_date;
                const end_date = body.end_date;
                const item_label = body.item_label || item_name;
                const unit = body.unit || '';
                const parseTime = (str) => {
                    if (!str) return NaN;
                    const m = moment(str, 'YYYY-MM-DD HH:mm:ss', true);
                    if (m.isValid()) return m.valueOf();
                    const d = new Date(str);
                    return isNaN(d.getTime()) ? NaN : d.getTime();
                };
                
                const filePath = await get_file_by_item(item_name);
                try {
                    const data = await fs.promises.readFile(filePath, 'utf8');
                    const lines = data.trim().split('\n').filter(l => l.trim().length > 0);
                    
                    // 解析所有记录
                    let allRecords = [];
                    for (let line of lines) {
                        const parts = line.split('==');
                        for (let i = 0; i < parts.length - 1; i += 2) {
                            const timestamp = parts[i].trim();
                            const value = parts[i + 1].trim();
                            if (timestamp && value) {
                                allRecords.push({
                                    timestamp: timestamp,
                                    value: value
                                });
                            }
                        }
                    }
                    
                    // 按时间正序排列
                    allRecords.sort((a, b) => {
                        return new Date(a.timestamp) - new Date(b.timestamp);
                    });
                    
                    // 如果有日期范围参数，进行筛选
                    if (start_date || end_date) {
                        const startTime = start_date ? parseTime(start_date) : 0;
                        const endTime = end_date ? parseTime(end_date) : Infinity;
                        
                        allRecords = allRecords.filter(record => {
                            const recordTime = parseTime(record.timestamp);
                            if (isNaN(recordTime)) {
                                console.warn('Invalid timestamp:', record.timestamp);
                                return false;
                            }
                            return recordTime >= startTime && recordTime <= endTime;
                        });
                    }
                    
                    // 准备导出数据
                    const exportData = allRecords.map((row, index) => ({
                        '序号': index + 1,
                        '时间': row.timestamp,
                        '数值': parseFloat(row.value).toFixed(2),
                        '单位': unit
                    }));

                    const wb = XLSX.utils.book_new();

                    const ws = XLSX.utils.json_to_sheet(exportData);

                    ws['!cols'] = [
                        { wch: 8 },  // 序号
                        { wch: 20 }, // 时间
                        { wch: 15 }, // 数值
                        { wch: 10 }  // 单位
                    ];
                    
                    // 添加工作表到工作簿
                    XLSX.utils.book_append_sheet(wb, ws, '历史数据');
                    
                    // 生成文件名
                    const dateStr = moment().format('YYYYMMDD');
                    const safeLabel = item_label.replace(/[\/\\?*|":<>]/g, '_'); // 替换文件名中的非法字符
                    const fileName = `${safeLabel}_${dateStr}.xlsx`;
                    
                    // 生成Excel文件缓冲区
                    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
                    
                    // 设置响应头
                    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
                    res.setHeader('Content-Length', excelBuffer.length);
                    
                    // 返回文件流
                    return excelBuffer;
                } catch (err) {
                    console.error('导出Excel失败:', filePath, err && err.message);
                    throw new Error('导出Excel失败: ' + (err.message || '未知错误'));
                }
            }
        },
    }
}