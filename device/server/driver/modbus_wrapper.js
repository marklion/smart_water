import ModbusRTU from "modbus-serial";
class AsyncLock {
    constructor() {
        this.queue = [];
        this.locked = false;
    }

    async acquire() {
        return new Promise((resolve) => {
            if (!this.locked) {
                this.locked = true;
                resolve();
            } else {
                this.queue.push(resolve);
            }
        });
    }

    release() {
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            next();
        } else {
            this.locked = false;
        }
    }
}

class ModbusConnectionManager {
    constructor() {
        this.tcpPools = new Map();
        this.serialPools = new Map(); 
    }
    
    async fetchTcpConnection(ip, port, device_id) {
        let key = `${ip}:${port}:${device_id}`;
        if (!this.tcpPools.has(key)) {
            const client = new ModbusRTU();
            await client.connectTCP(ip, { port: port });
            client.setID(device_id);
            this.tcpPools.set(key, {
                client: client,
                lock: new AsyncLock()
            });
        }
        return this.tcpPools.get(key);
    }
    
    async fetchSerialConnection(serial_path, baud_rate, device_id) {
        let key = `${serial_path}:${baud_rate}:${device_id}`;
        if (!this.serialPools.has(key)) {
            const client = new ModbusRTU();
            await client.connectRTU(serial_path, { baudRate: baud_rate || 9600 });
            client.setID(device_id);
            this.serialPools.set(key, {
                client: client,
                lock: new AsyncLock()
            });
        }
        return this.serialPools.get(key);
    }

    async fetchSerialBufferedConnection(serial_path, baud_rate, device_id) {
        let key = `${serial_path}:${baud_rate}:${device_id}:buffered`;
        if (!this.serialPools.has(key)) {
            const client = new ModbusRTU();
            await client.connectRTUBuffered(serial_path, { baudRate: baud_rate || 9600 });
            client.setID(device_id);
            this.serialPools.set(key, {
                client: client,
                lock: new AsyncLock()
            });
        }
        return this.serialPools.get(key);
    }
}

const manager = new ModbusConnectionManager();

export default {
    fetchConnection: manager.fetchTcpConnection.bind(manager),
    fetchTcpConnection: manager.fetchTcpConnection.bind(manager),
    fetchSerialConnection: manager.fetchSerialConnection.bind(manager),
    fetchSerialBufferedConnection: manager.fetchSerialBufferedConnection.bind(manager),
};