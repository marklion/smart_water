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
    try {
        let selfurl = config.selfurl;
        if (!selfurl || selfurl.trim() === '') {
            throw new Error('回调URL（selfurl）是必填项，不能为空');
        }
        let callbackServices = [{
            pushUrl: selfurl
        }];
        if (config.callback_url) {
            callbackServices.push({
                pushUrl: config.callback_url
            });
        }
        let subscribeData = [{
            deviceSN: deviceSN,
            events: {
                pressureAlarmEnable: config.pressureAlarmEnable !== false
            },
            callbackServices: callbackServices
        }];
        await gdac.post('/openapi/hooks/subscribe/create', subscribeData);
    } catch (error) {
        console.error('Error setting callback subscribe:', error);
        throw error;
    }
    
    // 在初始化时设置压力告警阈值（只需设置一次，不需要每次打开阀门时都设置）
    if (config.pressure_alarm_config) {
        try {
            let alarmData = {
                deviceSN: deviceSN
            };
            
            // 根据is_left自动判断设置左管道还是右管道的告警阈值
            if (config.is_left) {
                // 左侧阀门：只设置左管道的告警阈值
                if (config.pressure_alarm_config.leftPipePressureGreaterThan !== undefined) {
                    alarmData.leftPipePressureGreaterThan = config.pressure_alarm_config.leftPipePressureGreaterThan;
                }
                if (config.pressure_alarm_config.leftPipePressureLessThan !== undefined) {
                    alarmData.leftPipePressureLessThan = config.pressure_alarm_config.leftPipePressureLessThan;
                }
            } else {
                // 右侧阀门：只设置右管道的告警阈值
                if (config.pressure_alarm_config.rightPipePressureGreaterThan !== undefined) {
                    alarmData.rightPipePressureGreaterThan = config.pressure_alarm_config.rightPipePressureGreaterThan;
                }
                if (config.pressure_alarm_config.rightPipePressureLessThan !== undefined) {
                    alarmData.rightPipePressureLessThan = config.pressure_alarm_config.rightPipePressureLessThan;
                }
            }
            
            console.log('setAlarmData (init):', JSON.stringify(alarmData));
            await gdac.post('/openapi/deviceCommand/pipePressure/setAlarm', alarmData);
        } catch (error) {
            console.error('Error setting pressure alarm during initialization:', error);
            // 告警阈值设置失败不影响设备初始化，只记录错误
        }
    }   
    // 存储设备的基础信息（在线状态、电池电压等，这些对所有阀门配置都相同）
    let device_base_info = {
        online: false,
        batteryVoltage: 0,
        leftPressure: null,
        rightPressure: null,
        last_update_time: 0  // 上次更新时间戳
    };
    
    let ret = {
        m_last_threshold: '0',
        m_info: {},

        refresh_info: async function () {
            const now = Date.now();
            try {
                let basic_info = await gdac.get('/openapi/device/query', { deviceSN: deviceSN });
                let bv = 0;
                let is_online = false;
                
                // 只使用设备基础信息中的在线状态字段
                if (basic_info.list.length == 1) {
                    let device_detail = basic_info.list[0].detail || {};
                    bv = device_detail.batteryVoltage || 0;
                    
                    // 检查设备基础信息中是否有在线状态字段
                    if (device_detail.online !== undefined) {
                        is_online = !!device_detail.online;
                        console.log(`Device ${deviceSN} online status from detail.online:`, is_online);
                    } else if (device_detail.status !== undefined) {
                        // 如果有status字段，检查是否为在线状态
                        is_online = device_detail.status === 'online' || device_detail.status === 1 || device_detail.status === '1';
                        console.log(`Device ${deviceSN} online status from detail.status:`, device_detail.status, '->', is_online);
                    } else if (device_detail.isOnline !== undefined) {
                        is_online = !!device_detail.isOnline;
                        console.log(`Device ${deviceSN} online status from detail.isOnline:`, is_online);
                    } else {
                        // 如果没有明确的在线状态字段，记录详细信息以便调试
                        console.log(`Device ${deviceSN} detail (no online status field found):`, JSON.stringify(device_detail));
                        // 默认设置为false，因为无法确定在线状态
                        is_online = false;
                    }
                } else {
                    console.log(`Device ${deviceSN} not found in basic_info.list, length:`, basic_info.list.length);
                    is_online = false;
                }
                
                let device_data = await gdac.post('/openapi/deviceCommand/pipePressure', {
                    deviceSN: deviceSN
                });
                let left_pressure_str = device_data.leftPipePressure || '';
                let right_pressure_str = device_data.rightPipePressure || '';
                let left_pressure = null;
                let right_pressure = null;
                if (left_pressure_str !== '' && left_pressure_str !== null && left_pressure_str !== undefined) {
                    let parsed = parseFloat(left_pressure_str);
                    if (!isNaN(parsed)) {
                        left_pressure = parsed;
                    }
                }
                if (right_pressure_str !== '' && right_pressure_str !== null && right_pressure_str !== undefined) {
                    let parsed = parseFloat(right_pressure_str);
                    if (!isNaN(parsed)) {
                        right_pressure = parsed;
                    }
                }
                
                console.log(`Device ${deviceSN} final online status:`, is_online, `(pressure: left=${left_pressure}, right=${right_pressure})`);

                device_base_info.online = is_online;
                device_base_info.batteryVoltage = bv;
                device_base_info.leftPressure = left_pressure;
                device_base_info.rightPressure = right_pressure;
                device_base_info.last_update_time = now;

                this.m_info = {
                    online: is_online,
                    pressure: config.is_left ? left_pressure : right_pressure,
                    batteryVoltage: bv
                };
            } catch (error) {
                console.error('Error fetching device info:', error);
                device_base_info.online = false;
                device_base_info.batteryVoltage = 0;
                device_base_info.leftPressure = null;
                device_base_info.rightPressure = null;
                device_base_info.last_update_time = now;
                this.m_info = {
                    online: false,
                    pressure: null,
                    batteryVoltage: 0
                };
            }
        },

        open: async function () {
            try {
                console.log(`Opening valve for device ${deviceSN}, threshold: ${open_threshold}`);
                let result = await gdac.post('/openapi/deviceCommand/valve', {
                    deviceSN: deviceSN,
                    rawData: open_threshold,
                });
                console.log(`Valve open command sent successfully for device ${deviceSN}, result:`, result);
                this.m_last_threshold = open_threshold;
            } catch (error) {
                console.error(`Error opening valve for device ${deviceSN}:`, error);
                throw error;
            }
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
                try {
                    console.log(`Closing valve for device ${deviceSN}`);
                    let result = await gdac.post('/openapi/deviceCommand/valve', {
                        deviceSN: deviceSN,
                        rawData: '0',
                    });
                    console.log(`Valve close command sent successfully for device ${deviceSN}, result:`, result);
                    this.m_last_threshold = '0';
                } catch (error) {
                    console.error(`Error closing valve for device ${deviceSN}:`, error);
                    throw error;
                }
            }
        },
        readout: async function () {
            if (device_base_info.last_update_time === 0) {
                await this.refresh_info();
            }
            return config.is_left ? device_base_info.leftPressure : device_base_info.rightPressure;
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
            if (device_base_info.last_update_time === 0) {
                await this.refresh_info();
            }
            return device_base_info.online || false;
        },
        battery_voltage: async function () {
            return device_base_info.batteryVoltage || 0;
        },
        destroy: async function () {
        },
    }
    return ret;
}