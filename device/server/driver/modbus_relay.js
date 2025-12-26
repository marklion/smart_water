import modbus_wrapper from "./modbus_wrapper.js";
export default async function (config_string) {
    let config = JSON.parse(config_string);
    let set_relay = async function (is_on) {
        let ret = true;
        let connection = await modbus_wrapper.fetchConnection(config.ip, config.port, config.device_id);
        await connection.lock.acquire();
        try {
            await connection.client.writeCoil(config.relay_address, is_on);
        } catch (error) {
            console.log(`set coil error =:${JSON.stringify(error)}`);
            ret = false;
        } finally {
            connection.lock.release();
        }
        return ret;
    };
    let ret = {
        m_is_opened: false,
        m_is_online: true,
        open: async function () {
            this.m_is_opened = true;
        },
        close: async function () {
            this.m_is_opened = false;
        },
        is_opened: async function () {
            return this.m_is_opened;
        },
        status_map: function () {
            let ret = [];
            ret.push({ text: '阀门是否打开', func: 'is_opened' });
            return ret;
        },
        shutdown: async function () {
            await this.close();
        },
        is_online: async function () {
            return this.m_is_online;
        },
        destroy: async function () {
            clearInterval(this.m_timer);
        },
    }
    ret.m_timer = setInterval(async () => {
        try {
            ret.m_is_online = await set_relay(ret.m_is_opened);
        } catch (error) {
            console.error('Error set relay:', error);
        }
    }, config.poll_interval || 2000);
    return ret;
}