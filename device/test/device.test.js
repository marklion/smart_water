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

describe('设备操作', () => {
    beforeEach(async () => {
        await cli.run_cmd('device');
        await cli.run_cmd('clear', 'device> ');
        await cli.run_cmd(`add device d1 'virtualDevice' 'd1_device.log' 1 2`, 'device> ');
        await cli.run_cmd(`add device d2 'virtualDevice' 'd2_device.log' 1 2`, 'device> ');
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