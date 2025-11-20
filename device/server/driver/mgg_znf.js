import mqtt from 'async-mqtt';
async function start_mqtt_client(broker_url, username, password, outlet) {
    let ret = {};
    try {
        // 连接到 MQTT 代理
        const client = await mqtt.connectAsync(broker_url, {
            username: username,
            password: password
        });
        // 订阅主题
        await client.subscribe('devices/attributes/#');
        await client.subscribe('devices/telemetry');
        await client.subscribe(`devices/command/response/#`);
        let cur_cmd_msg_id = 0;

        // 监听消息
        client.on('message', async (topic, message) => {
            if (topic.startsWith('devices/attributes/')) {
                let message_id = topic.split('/')[2];
                await client.publish(`devices/attributes/response/${username}/${message_id}`, JSON.stringify({
                    result: 0,
                    errcode: '',
                    ts: parseInt(Date.now() / 1000),
                    message: ''
                }));
            }
            else if (topic.startsWith('devices/telemetry')) {
                ret.pressure = 10;
            }
            else if (topic.startsWith('devices/command/response/')) {
                let message_id = parseInt(topic.split('/')[3]);
                cur_cmd_msg_id = message_id;
            }
        });
        ret.valve_opt = async function (is_open) {
            let message_id = Date.now();
            await client.publish(`devices/command/${username}/${message_id}`, JSON.stringify({
                method: 'oneControl',
                params: {
                    outlet: outlet,
                    valveOpen: is_open ? 100 : 0
                }
            }));
            await new Promise((resolve, reject) => {
                let check_count = 0;
                let checkResponse = () => {
                    check_count += 1;
                    if (check_count > 20) {
                        reject(new Error('Response timeout'));
                        return;
                    }
                    if (cur_cmd_msg_id === message_id) {
                        resolve();
                    } else {
                        setTimeout(checkResponse, 100);
                    }
                };
                checkResponse();
            });
        };
    } catch (error) {
        console.error('错误:', error);
    }
    return ret;
}
export default async function (config_string) {
    let config = JSON.parse(config_string);
    let outlet = config.outlet;
    let mqtt_handler = await start_mqtt_client(config.broker_url, config.username, config.password, outlet);

    let ret = {
        m_is_opened_total_count: 0,
        m_is_online: true,

        open: async function () {
            this.m_is_opened_total_count += 1;
            if (this.m_is_opened_total_count > 0) {
                try {
                    await mqtt_handler.valve_opt(true);
                    this.m_is_online = true
                } catch (error) {
                    this.m_is_online = false;
                }
            }
        },
        close: async function () {
            this.m_is_opened_total_count -= 1;
            if (this.m_is_opened_total_count <= 0) {
                try {
                    await mqtt_handler.valve_opt(false);
                    this.m_is_online = true;
                } catch (error) {
                    this.m_is_online = false;
                }
            }
        },
        readout: async function () {
            return mqtt_handler.pressure;
        },
        is_opened: async function () {
            return this.m_is_opened_total_count > 0;
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
            return this.m_is_online;
        },
        destroy: async function () {
        },
    }
    return ret;
}