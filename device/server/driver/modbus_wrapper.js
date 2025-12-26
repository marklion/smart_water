import ModbusRTU from "modbus-serial";

// 简单的异步锁实现
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
            this.pools.set(key, {
                client: client,
                lock: new AsyncLock()
            });
        }
        return this.pools.get(key);
    }
    
}

export default new ModbusTcpConnection();