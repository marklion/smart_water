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
        m_is_opened:false,
        mock_value: null, // 存储模拟值
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
            await this.write_log('打开阀门');
            this.m_is_opened = true;
            return { status: 'opened', message: '阀门已成功打开' };
        },
        close: async function () {
            await this.write_log('关闭阀门');
            this.m_is_opened = false;
            return { status: 'closed', message: '阀门已成功关闭' };
        },
        readout: async function () {
            // 如果有模拟值，优先返回模拟值
            if (this.mock_value !== null) {
                const deviceType = this.getDeviceType();
                const unit = this.getUnit();
                const details = `当前${deviceType}: ${this.mock_value}${unit}`;
                await this.write_log(`[读取] ${details}`);
                return this.mock_value;
            }
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
            this.mock_value = value; // 存储模拟值
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
        },
        is_opened:async function() {
            return this.m_is_opened;
        },
        status_map:function() {
            let ret = [];
            ret.push({text:'开关是否打开', func:'is_opened'});
            ret.push({text:'当前仪表读数', func:'readout'});
            return ret;
        },
        shutdown:async function() {
            await this.write_log('设备急停');
            this.m_is_opened = false;
        },
    }
    return ret;
}