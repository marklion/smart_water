import test_utils from "../../public/lib/test_utils.js";
import { print_test_log, start_server, close_server } from "../../public/lib/test_utils.js";
let cli;
beforeAll(async () => {
    print_test_log('device curd test begin', true)
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
    beforeEach(async ()=>{
        await cli.run_cmd('device');
        await cli.run_cmd('clear');
    })
    afterEach(async ()=>{
        await cli.run_cmd('return');
    })
    test('单独增删设备', async () => {
        await cli.run_cmd(`add device abc '虚拟设备' 'abc_device.log' '["open"]' f1 b1`)
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
            await cli.run_cmd(`add device abc${i} '虚拟设备' 'abc_device.log' '["open"]' f${i} b1`)
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