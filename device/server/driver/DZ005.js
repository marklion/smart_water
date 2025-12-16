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
        let device_data = await gdac.post('/openapi/deviceCommand/pipePressure', {
            deviceSN: deviceSN
        });
        let pressure_key = 'rightPipePressure';
        if (config.is_left) {
            pressure_key = 'leftPipePressure';
        }
        let pressure_str = device_data[pressure_key];
        let is_online = pressure_str !== '' && pressure_str !== null && pressure_str !== undefined;
        let pressure = is_online ? parseFloat(pressure_str) : null;
        let basic_info = await gdac.get('/openapi/device/query', { deviceSN: deviceSN });
        let bv = 0;
        if (basic_info.list.length == 1) {
            bv = basic_info.list[0].detail?.batteryVoltage || 0;
        }
        let ret = {
            online: is_online,
            pressure: pressure,
            batteryVoltage: bv,
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
            ret.push({ text: '电池电压', func: 'battery_voltage' })
            return ret;
        },
        shutdown: async function () {
            await this.close();
        },
        is_online: async function () {
            return this.m_info.online;
        },
        battery_voltage: async function () {
            return this.m_info.batteryVoltage;
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