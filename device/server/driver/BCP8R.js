import modbus_wrapper from "./modbus_wrapper.js";

export default async function (config_string) {
    let config = JSON.parse(config_string);
    let get_pressure_info = async function () {
        let ret = {
            online: true,
            pressure:0,
        }
        let connection = await modbus_wrapper.fetchSerialConnection(config.serial_path, config.baud_rate, config.device_id);
        await connection.lock.acquire();
        try {
            let resp = await connection.client.readHoldingRegisters(3, 1);
            let pow = resp.buffer.readUint16BE();
            resp = await connection.client.readHoldingRegisters(4, 1);
            let pressure = resp.buffer.readInt16BE();
            pressure = pressure / Math.pow(10, pow);
            ret.pressure = pressure;
        } catch (error) {
            console.log(`get pressure via modbus error =:${JSON.stringify(error)}`);
            ret.online = false;
        } finally {
            connection.lock.release();
        }
        return ret;
    };
    let ret = {
        m_info: {},
        readout: async function () {
            return this.m_info.pressure;
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
            ret.m_info = await get_pressure_info();
        } catch (error) {
            console.error('Error fetching device info:', error);
        }
    }, config.poll_interval || 2000);
    return ret;
}