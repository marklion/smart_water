import test_utils from "../../public/lib/test_utils.js";
import { print_test_log, start_server, close_server } from "../../public/lib/test_utils.js";
import moment from "moment";
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
        await cli.run_cmd('clear');
        await cli.run_cmd(`add device d1 'virtualDevice' 'd1_device.log' 1 2`);
        await cli.run_cmd(`add device d2 'virtualDevice' 'd2_device.log' 1 2`);
    })
    afterEach(async () => {
        await cli.run_cmd('clear');
        await cli.run_cmd('return');
    })
    get_device_info = async (device_name) => {
        result = await cli.run_cmd('list device');
        let infos = result.split('------------------------');
        let ret = '';
        for (let info of infos) {
            info = info.split('\n').filter(line => line.trim().length > 0).join('\n');
            let top1 = info.split('\n')[0];
            if (top1.startsWith(device_name + ' - ')) {
                ret = info;
                break;
            }
        }
        return ret;
    };
    test('打开阀门', async () => {
        let result = await cli.run_cmd('open d1');
        expect(result).toContain('设备 d1 打开成功');
        let info = await get_device_info('d1');
        expect(info).toContain('- 开关是否打开: true');
    })
    test('关闭阀门', async () => {
        let result = await cli.run_cmd('close d2');
        expect(result).toContain('设备 d2 关闭成功');
        let info = await get_device_info('d2');
        expect(info).toContain('- 开关是否打开: false');
    })
    test('读取设备读数', async () => {
        await cli.run_cmd('mock readout d1 30');
        let readout = await cli.run_cmd('readout d1');
        expect(readout).toContain('30');
        await cli.run_cmd(`mock readout d1 -- -90.1`);
        readout = await cli.run_cmd('readout d1');
        expect(readout).toContain('-90.1');
        let info = await get_device_info('d1');
        expect(info).toContain('- 当前仪表读数: -90.1');
    })
    test('急停设备', async ()=>{
        await cli.run_cmd('open d1');
        await cli.run_cmd('open d2');
        let res = await get_device_info('d1');
        expect(res).toContain('- 开关是否打开: true');
        res = await get_device_info('d2');
        expect(res).toContain('- 开关是否打开: true');
        await cli.run_cmd('shutdown device d1');
        res = await get_device_info('d1');
        expect(res).toContain('- 开关是否打开: false');
        res = await get_device_info('d2');
        expect(res).toContain('- 开关是否打开: true');
    });
    test('设备在线状态查询', async () => {
        let online_status = await get_device_info('d1');
        const sec = moment().second();
        if (sec >= 20 && sec <= 40) {
            expect(online_status).toContain('(离线)');
        }
        else {
            expect(online_status).toContain('(在线)');
        }
    });
});