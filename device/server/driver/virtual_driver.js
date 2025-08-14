import fs from 'fs';
import moment from 'moment';

export default async function (log_file_path) {
    let ret = {
        log_file: log_file_path,
        read_last_line:async function() {
            return new Promise((resolve, reject) => {
                fs.readFile(log_file_path, 'utf8', (err, data) => {
                    if (err) {
                        reject(err);
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
                fs.appendFile(log_file_path, log_entry + '\n', (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        },
        open: async function () {
            await this.write_log('打开阀门');
        },
        close: async function () {
            await this.write_log('关闭阀门');
        },
        readout: async function () {
            let lastLine = await this.read_last_line();
            lastLine = lastLine.replace(/\[.*?\]\s*/, '');
            return parseFloat(lastLine);
        },
        mock_readout: async function (value) {
            await this.write_log(`${value}`)
        }
    }
    return ret;
}