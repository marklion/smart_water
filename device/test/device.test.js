import test_utils from "../../public/lib/test_utils.js";
import fs from 'fs';
import { print_test_log, start_server, close_server } from "../../public/lib/test_utils.js";
let cli;
beforeAll(async () => {
    print_test_log('device CRUD test begin', true)
    cli = await test_utils('npm run dev_cli');
    await start_server()
    await cli.run_cmd('clear');
})
afterAll(async () => {
    await cli.run_cmd('clear');
    await cli.run_cmd('save');
    await cli.close();
    await close_server();
    print_test_log('device curd test end', true)
})

describe('设备增删', () => {
    beforeEach(async () => {
        await cli.run_cmd('device');
        await cli.run_cmd('clear');
    })
    afterEach(async () => {
        await cli.run_cmd('return');
    })
    test('单独增删设备', async () => {
        await cli.run_cmd(`add device abc '虚拟设备' 'abc_device.log' f1 b1`)
        let list_resp = await cli.run_cmd('list device')
        expect(list_resp).toContain('abc');
        list_resp = await cli.run_cmd('list device f1 b1')
        expect(list_resp).toContain('abc');
        await cli.run_cmd('del device abc');
        let bdr = await cli.run_cmd('bdr');
        expect(bdr).not.toContain('abc');
    });
    test('配置恢复', async () => {
        for (let i = 0; i < 22; i++) {
            await cli.run_cmd(`add device abc${i} '虚拟设备' 'abc_device.log' f${i} b1`)
        }
        let list_resp = await cli.run_cmd('list device f1');
        expect(list_resp).toContain('abc1');
        expect(list_resp).not.toContain('abc0');
        list_resp = await cli.run_cmd('list device \'\' b1');
        expect(list_resp).toContain('abc3');
        expect(list_resp).toContain('abc1');
        await cli.save_config();
        await cli.clear_config();
        let bdr = await cli.run_cmd('bdr');
        expect(bdr).not.toContain('abc0');
        expect(bdr).not.toContain('abc21');
        await cli.restore_config();
        list_resp = await cli.run_cmd('list device \'\' b1');
        expect(list_resp).toContain('abc21');
        expect(list_resp).toContain('abc0');
        list_resp = await cli.run_cmd('list device f1');
        expect(list_resp).toContain('abc1');
        expect(list_resp).not.toContain('abc0');
    })
})

async function get_device_log(log_path) {
    let lastLine = '';
    // 如果传入的是简单文件名，则使用device/log目录
    let actual_log_path = log_path;
    if (!log_path.includes('/')) {
        actual_log_path = `device/log/${log_path}`;
    }
    
    lastLine = await new Promise((resolve, reject) => {
        fs.readFile(actual_log_path, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            }
            const lines = data.trim().split('\n');
            lastLine = lines[lines.length - 1];
            resolve(lastLine);
        });
    });
    return lastLine;
}
async function clear_device_logs(log_path) {
    // 如果传入的是简单文件名，则使用device/log目录
    let actual_log_path = log_path;
    if (!log_path.includes('/')) {
        actual_log_path = `device/log/${log_path}`;
    }
    
    return new Promise((resolve, reject) => {
        fs.writeFile(actual_log_path, '', (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

describe('设备操作', () => {
    beforeEach(async () => {
        await cli.run_cmd('device');
        await cli.run_cmd('clear');
        await cli.run_cmd(`add device d1 '虚拟设备' 'd1_device.log'`);
        await cli.run_cmd(`add device d2 '虚拟设备' 'd2_device.log'`);
        await clear_device_logs('d1_device.log');
        await clear_device_logs('d2_device.log');
    })
    afterEach(async () => {
        await cli.run_cmd('clear');
        await cli.run_cmd('return');
    })
    test('打开阀门', async () => {
        await cli.run_cmd('open d1');
        let log = await get_device_log('d1_device.log');
        expect(log).toContain('打开阀门');
        log = await get_device_log('d2_device.log');
        expect(log).not.toContain('打开阀门');
    })
    test('关闭阀门', async () => {
        await cli.run_cmd('close d2');
        let log = await get_device_log('d2_device.log');
        expect(log).toContain('关闭阀门');
        log = await get_device_log('d1_device.log');
        expect(log).not.toContain('关闭阀门');
    })
    test('读取设备读数', async () => {
        await cli.run_cmd('mock readout d1 30');
        let readout = await cli.run_cmd('readout d1');
        expect(readout).toContain('30');
        await cli.run_cmd(`mock readout d1 -- -90.1`);
        readout = await cli.run_cmd('readout d1');
        expect(readout).toContain('-90.1');
    })
});