import ModbusRTU from "modbus-serial";

export default async function (config_string) {
    let config = JSON.parse(config_string);
    let get_flow_info = async function () {
        let ret = {
            online: true,
            flow: 0,
            total_flow: 0,
        }
        const client = new ModbusRTU();
        await client.connectRTU(config.serial_path, { baudRate: config.baud_rate || 9600 });
        try {
            client.setID(config.device_id);
            let resp = await client.readHoldingRegisters(0, 2);
            ret.flow = resp.buffer.readFloatBE();
            resp = await client.readHoldingRegisters(0x13, 2);
            ret.total_flow = resp.buffer.readUint32BE() / 100;
        } catch (error) {
            console.log(`get flow_info via modbus error =:${JSON.stringify(error)}`);
            ret.online = false;
        }
        client.close();
        return ret;
    };
    let ret = {
        m_info: {},
        readout: async function () {
            return this.m_info.flow;
        },
        total_readout: async function () {
            return this.m_info.total_flow;
        },
        status_map: function () {
            let ret = [];
            ret.push({ text: '当前流量值', func: 'readout' });
            ret.push({ text: '累计流量值', func: 'total_readout' });
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
            ret.m_info = await get_flow_info();
        } catch (error) {
            console.error('Error fetching device info:', error);
        }
    }, config.poll_interval || 2000);
    return ret;
}