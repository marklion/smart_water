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
        await cli.run_cmd(`add device abc '虚拟设备' 'abc_device.log' f1 b1`, 'device> ')
        let list_resp = await cli.run_cmd('list device', 'device> ')
        expect(list_resp).toContain('abc');
        list_resp = await cli.run_cmd('list device f1 b1', 'device> ')
        expect(list_resp).toContain('abc');
        await cli.run_cmd('del device abc', 'device> ');
        let bdr = await cli.run_cmd('bdr', 'device> ');
        expect(bdr).not.toContain('abc');
    });
    test('配置恢复', async () => {
        for (let i = 0; i < 22; i++) {
            await cli.run_cmd(`add device abc${i} '虚拟设备' 'abc_device.log' f${i} b1`, 'device> ')
        }
        let list_resp = await cli.run_cmd('list device f1', 'device> ');
        expect(list_resp).toContain('abc1');
        expect(list_resp).not.toContain('abc0');
        list_resp = await cli.run_cmd('list device \'\' b1', 'device> ');
        expect(list_resp).toContain('abc3');
        expect(list_resp).toContain('abc1');
        await cli.save_config();
        await cli.clear_config();
        let bdr = await cli.run_cmd('bdr', 'device> ');
        expect(bdr).not.toContain('abc0');
        expect(bdr).not.toContain('abc21');
        await cli.restore_config();
        list_resp = await cli.run_cmd('list device \'\' b1', 'device> ');
        expect(list_resp).toContain('abc21');
        expect(list_resp).toContain('abc0');
        list_resp = await cli.run_cmd('list device f1', 'device> ');
        expect(list_resp).toContain('abc1');
        expect(list_resp).not.toContain('abc0');
    })
})

// 移除日志文件相关的函数，因为GitHub上不会上传device/log文件夹

describe('设备操作', () => {
    beforeEach(async () => {
        await cli.run_cmd('device');
        await cli.run_cmd('clear', 'device> ');
        await cli.run_cmd(`add device d1 '虚拟设备' 'd1_device.log'`, 'device> ');
        await cli.run_cmd(`add device d2 '虚拟设备' 'd2_device.log'`, 'device> ');
    })
    afterEach(async () => {
        await cli.run_cmd('clear', 'device> ');
        await cli.run_cmd('return');
    })
    test('打开阀门', async () => {
        let result = await cli.run_cmd('open d1', 'device> ');
        expect(result).toContain('设备 d1 打开成功');
    })
    test('关闭阀门', async () => {
        let result = await cli.run_cmd('close d2', 'device> ');
        expect(result).toContain('设备 d2 关闭成功');
    })
    test('读取设备读数', async () => {
        await cli.run_cmd('mock readout d1 30', 'device> ');
        let readout = await cli.run_cmd('readout d1', 'device> ');
        expect(readout).toContain('30');
        await cli.run_cmd(`mock readout d1 -- -90.1`, 'device> ');
        readout = await cli.run_cmd('readout d1', 'device> ');
        expect(readout).toContain('-90.1');
    })
});