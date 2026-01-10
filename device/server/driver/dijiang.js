import modbus_wrapper from "./modbus_wrapper.js";

export default async function (config_string) {
    let config = JSON.parse(config_string);
    let get_flow = async function () {
        let ret = {
            online: true,
            flow: 0,
        }
        let connection = await modbus_wrapper.fetchSerialConnection(config.serial_path, config.baud_rate, config.device_id);
        await connection.lock.acquire();
        try {
            let resp = await connection.client.readHoldingRegisters(9, 3);
            ret.flow = resp.data[0] * 65536 + resp.data[1] + resp.data[2] / 100;
        } catch (error) {
            ret.online = false;
        } finally {
            connection.lock.release();
        }
        return ret;
    };
    let ret = {
        m_info: {},
        m_readout_array: [],
        readout: async function () {
            return this.m_info.flow;
        },
        ava_readout: async function () {
            if (this.m_readout_array.length == 0) {
                return config.expect_flow || 0;
            }
            else {
                let sum = 0;
                for (let val of this.m_readout_array) {
                    sum += val;
                }
                return sum / this.m_readout_array.length;
            }
        },
        set_key_const_value: async function (value) {
            value = Number(value).toFixed(2);
            const [integerPart, decimalPart] = value.split('.');
            const buffer = Buffer.alloc(6);
            buffer.writeUInt32BE(parseInt(integerPart), 0);
            buffer.writeUInt16BE(parseInt(decimalPart), 4);
            let connection = await modbus_wrapper.fetchSerialBufferedConnection(config.serial_path, config.baud_rate, config.device_id);
            await connection.lock.acquire();
            try {
                await connection.client.writeRegisters(6, buffer);
            } catch (error) {
                console.log(error);
                this.m_info.online = false;
            } finally {
                connection.lock.release();
            }
        },
        status_map: function () {
            let ret = [];
            ret.push({ text: '当前流量值', func: 'readout' });
            return ret;
        },
        shutdown: async function () {
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
            ret.m_info = await get_flow();
            let cur_flow = ret.m_info.flow;
            if (cur_flow > 0) {
                ret.m_readout_array.push(cur_flow);
                if (ret.m_readout_array.length > 4) {
                    ret.m_readout_array.shift();
                }
            }
        } catch (error) {
            console.error('Error fetching device info:', error);
        }
    }, config.poll_interval || 2000);
    return ret;
}