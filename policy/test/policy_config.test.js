import test_utils from "../../public/lib/test_utils.js";
import { print_test_log, start_server, close_server, call_api } from "../../public/lib/test_utils.js";
let cli;
beforeAll(async () => {
    print_test_log('policy config begin', true);
    cli = await test_utils('npm run dev_cli');
    await start_server();
    await cli.run_cmd('clear');
});

afterAll(async () => {
    await cli.run_cmd('clear');
    await cli.close();
    await close_server();
    print_test_log('policy config end', true);
});
describe('策略配置测试', () => {
    test('策略关联农场', async () => {
        await cli.run_cmd('resource')
        await cli.run_cmd('farm')
        for (let i = 1; i <= 31; i++) {
            await cli.run_cmd(`add farm 'farm_${i}' a 1 2`);
        }
        await cli.run_cmd('return')
        await cli.run_cmd('return')
        await cli.run_cmd('policy')
        for (let i = 1; i <= 31; i++) {
            await cli.run_cmd(`policy policy_${i}`);
            if (i % 2 != 0) {
                await cli.run_cmd(`match farm 'farm_${i}'`);
            }
            await cli.run_cmd('return');
        }
        let resp = await call_api('/policy/list_policy', { pageNo: 0, farm_name: 'farm_1' });
        expect(resp.policies.length).toBe(1);
        expect(resp.policies[0].name).toBe('policy_1');
        resp = await call_api('/policy/list_policy', { pageNo: 0, farm_name: 'farm_29' });
        expect(resp.policies.length).toBe(1);
        expect(resp.policies[0].name).toBe('policy_29');
        resp = await call_api('/policy/list_policy', { pageNo: 0, farm_name: 'farm_18' });
        expect(resp.policies.length).toBe(0);
    })
});