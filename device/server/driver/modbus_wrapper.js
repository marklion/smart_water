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
        let key = `${ip}:${port}`;
        if (!this.tcpPools.has(key)) {
            const client = new ModbusRTU();
            await client.connectTCP(ip, { port: port });
            this.tcpPools.set(key, {
                client: client,
                lock: new AsyncLock(),
                unlock:function()
                {
                    this.lock.release();
                }
            });
        }
        
        let ret = this.tcpPools.get(key);
        await ret.lock.acquire();
        ret.client.setID(device_id);
        return ret;
    }
    
    async fetchSerialConnection(serial_path, baud_rate, device_id) {
        let key = `${serial_path}`;
        if (!this.serialPools.has(key)) {
            const client = new ModbusRTU();
            await client.connectRTUBuffered(serial_path, { 
                baudRate: baud_rate || 9600,
                dataBits: 8,
                parity: 'none',
                stopBits: 1,
                flowControl: 'none',
                rtscts: false,
                xon: false,
                xoff: false,
                xany: false,
                bufferSize: 128,
             });
            this.serialPools.set(key, {
                client: client,
                lock: new AsyncLock(),
                unlock:function()
                {
                    this.lock.release();
                }
            });
        }
        
        let ret = this.serialPools.get(key);
        await ret.lock.acquire();
        ret.client.setID(device_id);
        return ret;
    }
}

const manager = new ModbusConnectionManager();

export default {
    fetchConnection: manager.fetchTcpConnection.bind(manager),
    fetchTcpConnection: manager.fetchTcpConnection.bind(manager),
    fetchSerialConnection: manager.fetchSerialConnection.bind(manager),
};