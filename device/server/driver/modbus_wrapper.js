import ModbusRTU from "modbus-serial";
class ModbusTcpConnection {
    constructor() {
        this.pools = new Map(); // 支持多个连接池
    }
    async fetchConnection(ip, port, device_id) {
        let key = `${ip}:${port}:${device_id}`;
        if (!this.pools.has(key)) {
            const client = new ModbusRTU();
            await client.connectTCP(ip, { port: port });
            client.setID(device_id);
            this.pools.set(key, client);
        }
        return this.pools.get(key);
    }
}

export default new ModbusTcpConnection();