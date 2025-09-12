import fs from 'fs';
import path from 'path';
import moment from 'moment';

export default async function (log_file_path) {
    // 如果传入的是相对路径或简单文件名，则使用统一的日志目录
    let actual_log_path = log_file_path;
    if (!path.isAbsolute(log_file_path) && !log_file_path.includes('/')) {
        // 简单文件名，使用统一日志目录
        const logDir = path.join(process.cwd(), 'device', 'log');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        actual_log_path = path.join(logDir, log_file_path);
    }
    
    let ret = {
        log_file: actual_log_path,
        read_last_line:async function() {
            return new Promise((resolve, reject) => {
                fs.readFile(actual_log_path, 'utf8', (err, data) => {
                    if (err) {
                        if (err.code === 'ENOENT') {
                            // 文件不存在，创建文件并写入默认值
                            this.write_log('0').then(() => {
                                resolve('0');
                            }).catch(reject);
                        } else {
                            reject(err);
                        }
                    } else {
                        const lines = data.trim().split('\n');
                        const lastLine = lines[lines.length - 1];
                        resolve(lastLine);
                    }
                });
            });
        },
        write_log: async function (text) {
            return new Promise((resolve, reject) => {
                let timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
                let log_entry = `[${timestamp}] ${text}`;
                fs.appendFile(actual_log_path, log_entry + '\n', (err) => {
                    if (err) {
                        if (err.code === 'ENOENT') {
                            // 文件不存在，先创建目录（如果不存在）
                            const dir = actual_log_path.substring(0, actual_log_path.lastIndexOf('/'));
                            if (dir && !fs.existsSync(dir)) {
                                fs.mkdirSync(dir, { recursive: true });
                            }
                            // 再次尝试写入
                            fs.appendFile(actual_log_path, log_entry + '\n', (err2) => {
                                if (err2) {
                                    reject(err2);
                                } else {
                                    resolve();
                                }
                            });
                        } else {
                            reject(err);
                        }
                    } else {
                        resolve();
                    }
                });
            });
        },
        open: async function () {
            const status = '开启';
            const details = '设备状态: 阀门已打开，开始工作';
            await this.write_log(`[操作] ${status} - ${details}`);
            return { status: 'opened', message: '阀门已成功打开' };
        },
        close: async function () {
            const status = '关闭';
            const details = '设备状态: 阀门已关闭，停止工作';
            await this.write_log(`[操作] ${status} - ${details}`);
            return { status: 'closed', message: '阀门已成功关闭' };
        },
        readout: async function () {
            let lastLine = await this.read_last_line();
            lastLine = lastLine.replace(/\[.*?\]\s*/, '');
            const value = parseFloat(lastLine) || 0;
            
            // 记录读取操作
            const deviceType = this.getDeviceType();
            const unit = this.getUnit();
            const details = `当前${deviceType}: ${value}${unit}`;
            await this.write_log(`[读取] ${details}`);
            
            return value;
        },
        mock_readout: async function (value) {
            const deviceType = this.getDeviceType();
            const unit = this.getUnit();
            const details = `模拟${deviceType}: ${value}${unit}`;
            await this.write_log(`[模拟] ${details}`);
            return { status: 'mocked', value: value, message: `已设置模拟值为 ${value}${unit}` };
        },
        getDeviceType: function() {
            const fileName = this.log_file.split('/').pop().replace('.log', '');
            if (fileName.includes('流量计')) return '流量';
            if (fileName.includes('阀门')) return '阀门状态';
            return '设备状态';
        },
        getUnit: function() {
            const fileName = this.log_file.split('/').pop().replace('.log', '');
            if (fileName.includes('流量计')) return 'L/min';
            if (fileName.includes('阀门')) return '';
            return '';
        }
    }
    return ret;
}