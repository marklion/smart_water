import axios from 'axios';
async function get_device_api_caller(config) {
    let base_url = 'https://iot-test.dz-ai.com';
    let token = config.token;
    return {
        proc_resp: async function (resp) {
            let ret = '';
            if (resp.data.code == 0 || resp.data.code == 2010) {
                ret = resp.data.data;
            }
            else {
                throw { err_msg: resp.data.msg };
            }
            return ret;
        },
        get: async function (path, params) {
            let real_path = base_url + path;
            for (let k in params) {
                real_path += (real_path.indexOf('?') == -1 ? '?' : '&') + k + '=' + params[k];
            }
            let resp = await axios.get(real_path, { headers: { 'x-access-token': token } });
            return await this.proc_resp(resp);
        },
        post: async function (path, data) {
            let real_path = base_url + path;
            let resp = await axios.post(real_path, data, { headers: { 'x-access-token': token } });
            return await this.proc_resp(resp);
        }
    }
}
export default async function (config_string) {
    let config = JSON.parse(config_string);
    let gdac = await get_device_api_caller(config);
    let deviceSN = config.device_sn;
    let open_threshold = '100'
    if (config.is_left) {
        open_threshold = '-100'
    }
    let info_get_func = async function () {
        let device_data = await gdac.get('/openapi/device/query', {
            deviceSN: deviceSN
        });
        let real_device = device_data.list[0];
        let pressure_key = 'rightPipePressure';
        if (config.is_left) {
            pressure_key = 'leftPipePressure';
        }
        let ret = {
            online: real_device.online,
            pressure: parseFloat(real_device.detail[pressure_key])
        }
        return ret;
    };
    let ret = {
        m_last_threshold: '0',
        m_info: {},

        open: async function () {
            await gdac.post('/openapi/deviceCommand/valve', {
                deviceSN: deviceSN,
                rawData: open_threshold,
            });
            this.m_last_threshold = open_threshold;
        },
        close: async function () {
            let already_close = false;
            if (config.is_left) {
                already_close = (this.m_last_threshold == '100');
            }
            else {
                already_close = (this.m_last_threshold == '-100');
            }
            if (!already_close) {
                await gdac.post('/openapi/deviceCommand/valve', {
                    deviceSN: deviceSN,
                    rawData: '0',
                });
                this.m_last_threshold = '0';
            }
        },
        readout: async function () {
            return this.m_info.pressure;
        },
        is_opened: async function () {
            return this.m_last_threshold == open_threshold;
        },
        status_map: function () {
            let ret = [];
            ret.push({ text: '阀门是否打开', func: 'is_opened' });
            ret.push({ text: '当前压力值', func: 'readout' });
            return ret;
        },
        shutdown: async function () {
            await this.close();
        },
        is_online: async function () {
            return this.m_info.online;
        },
        destroy: async function () {
            clearInterval(this.m_timer);
        },
    }
    ret.m_timer = setInterval(async () => {
        try {
            ret.m_info = await info_get_func();
        } catch (error) {
            console.error('Error fetching device info:', error);
        }
    }, config.poll_interval || 2000);
    return ret;
}