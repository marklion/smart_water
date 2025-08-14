import fs from 'fs';
import moment from 'moment';

export default async function (log_file_path) {
    let ret = {
        log_file: log_file_path,
        cur_readout: 0,
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
            return this.cur_readout;
        },
        mock_readout: async function (value) {
            this.cur_readout = value;
        }
    }
    return ret;
}