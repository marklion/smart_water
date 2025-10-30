import ModbusRTU from "modbus-serial";

export default async function (config_string) {
    let config = JSON.parse(config_string);
    let get_flow = async function () {
        let ret = {
            online: true,
            flow: 0,
        }
        try {
            const client = new ModbusRTU();
            await client.connectTCP(config.ip, { port: config.port });
            client.setID(config.device_id);
            let resp = await client.readHoldingRegisters(9, 3);
            ret.flow = resp.data[0] * 65536 + resp.data[1] + resp.data[2] / 100;
            client.close();
        } catch (error) {
            console.log(`get flow via modbus error =:${JSON.stringify(error)}`);
            ret.online = false;
        }
        return ret;
    };
    let ret = {
        m_info: {},
        readout: async function () {
            return this.m_info.flow;
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
        } catch (error) {
            console.error('Error fetching device info:', error);
        }
    }, config.poll_interval || 2000);
    return ret;
}