import ModbusRTU from "modbus-serial";

export default async function (config_string) {
    let config = JSON.parse(config_string);
    let get_flow = async function () {
        let ret = {
            online: true,
            flow: 0,
        }
        const client = new ModbusRTU();
        await client.connectTCP(config.ip, { port: config.port });
        try {
            client.setID(config.device_id);
            let resp = await client.readHoldingRegisters(9, 3);
            ret.flow = resp.data[0] * 65536 + resp.data[1] + resp.data[2] / 100;
        } catch (error) {
            console.log(`get flow via modbus error =:${JSON.stringify(error)}`);
            ret.online = false;
        }
        client.close();
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