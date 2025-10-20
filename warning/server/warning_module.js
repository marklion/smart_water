import fs from 'fs';
import path from 'path';
export default {
    name: 'warning',
    description: '告警管理',
    methods: {
        generate_warning: {
            name: '生成告警',
            description: '生成一条新的告警',
            is_write: true,
            is_get_api: false,
            params: {
                content: { type: String, mean: '告警内容', example: '水位过高', have_to: true }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                try {
                    const filePath = path.join(process.cwd(), 'warning.log');
                    const timestamp = new Date().toLocaleString();
                    const newLine = `${timestamp} ${body.content}\n`;
                    await fs.promises.appendFile(filePath, newLine, 'utf8');
                    return { result: true };
                } catch (err) {
                    console.error('Failed to write warning:', err);
                    return { result: false };
                }
            },
        },
        list_warnings: {
            name: '列出告警',
            description: '列出所有告警',
            is_write: false,
            is_get_api: true,
            params: {},
            result: {
                warnings: {
                    type: Array, mean: '告警列表', explain: {
                        content: { type: String, mean: '告警内容', example: '水位过高' }
                    }
                },
            },
            func: async function (body, token) {
                let warnings = [];
                let total = 0;
                try {
                    const filePath = path.join(process.cwd(), 'warning.log');
                    const data = await fs.promises.readFile(filePath, 'utf8').catch(err => {
                        if (err.code === 'ENOENT') return '';
                        throw err;
                    });
                    const lines = data.split(/\r?\n/).filter(l => l.trim().length > 0);
                    lines.reverse();
                    total = lines.length;
                    const lastLines = lines.slice(body.pageNo * 20, (body.pageNo + 1) * 20)
                    warnings = lastLines.map(content => ({ content }));
                } catch (err) {
                    console.error('Failed to read warnings:', err);
                }
                return { warnings, total };
            },
        }
    }
};