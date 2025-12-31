import ModbusRTU from "modbus-serial";

export default async function (config_string) {
    let config = JSON.parse(config_string);
    let get_level_info = async function () {
        let ret = {
            online: true,
            level: 0,
        }
        const client = new ModbusRTU();
        await client.connectRTU(config.serial_path, { baudRate: config.baud_rate || 9600 });
        try {
            client.setID(config.device_id);
            let resp = await client.readHoldingRegisters(0, 1);
            let raw_value = resp.data[0];
            let multiplier = config.multiplier || 100;
            ret.level = raw_value / multiplier;
        } catch (error) {
            console.log(`get level info via modbus error: ${JSON.stringify(error)}`);
            ret.online = false;
        }
        client.close();
        return ret;
    };
    
    let ret = {
        m_info: {},
        readout: async function () {
            return this.m_info.level;
        },
        status_map: function () {
            let ret = [];
            ret.push({ text: '当前液位值', func: 'readout' });
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
            ret.m_info = await get_level_info();
        } catch (error) {
            console.error('Error fetching device info:', error);
        }
    }, config.poll_interval || 2000);
    
    return ret;
}

