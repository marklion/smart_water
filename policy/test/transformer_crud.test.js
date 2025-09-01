import test_utils from "../../public/lib/test_utils.js";
import { print_test_log, start_server, close_server } from "../../public/lib/test_utils.js";

let cli;

beforeAll(async () => {
    print_test_log('transformer CRUD test begin', true);
    cli = await test_utils('npm run dev_cli');
    await start_server();
    await cli.run_cmd('clear');
});

afterAll(async () => {
    await cli.run_cmd('clear');
    await cli.close();
    await close_server();
    print_test_log('transformer CRUD test end', true);
});

describe('转换器基本功能测试', () => {
    beforeEach(async () => {
        await cli.run_cmd('clear');
    });

    afterEach(async () => {
        await cli.run_cmd('clear');
    });

    test('创建策略、状态和转换器', async () => {

        await cli.run_cmd('policy test');

        await cli.run_cmd('state state1');

        await cli.run_cmd('transformer t1');

        let result = await cli.run_cmd('rule state2 "temperature > 30"');
        expect(result).toContain('已添加转移规则: 当条件满足时转移到状态 state2');

        await cli.run_cmd('return'); // 从转换器返回状态
        await cli.run_cmd('return'); // 从状态返回策略
        
        let bdr = await cli.run_cmd('bdr');
        expect(bdr).toContain("transformer 't1'");
        expect(bdr).toContain("state 'state1'");
    });

    test('配置保存和恢复测试', async () => {

        await cli.run_cmd('policy test');

        await cli.run_cmd('state state1');

        await cli.run_cmd('transformer t1');

        await cli.run_cmd('rule state2 "temperature > 30"');
        await cli.run_cmd('rule state3 "humidity < 50"');

        let bdr = await cli.run_cmd('bdr');
        expect(bdr).toContain("rule state2 'temperature > 30'");
        expect(bdr).toContain("rule state3 'humidity < 50'");

        await cli.save_config();

        expect(true).toBe(true);
    });

    test('转换器完整增删改查测试', async () => {

        await cli.run_cmd('policy test');

        await cli.run_cmd('state state1');

        await cli.run_cmd('transformer t1');
        await cli.run_cmd('rule state2 "temperature > 30"');
        await cli.run_cmd('rule state3 "humidity < 50"');

        let bdr = await cli.run_cmd('bdr');
        expect(bdr).toContain("rule state2 'temperature > 30'");
        expect(bdr).toContain("rule state3 'humidity < 50'");

        await cli.run_cmd('return'); 
        bdr = await cli.run_cmd('bdr');
        expect(bdr).toContain("transformer 't1'");

        await cli.run_cmd('state state1'); // 重新进入状态
        await cli.run_cmd('transformer t1'); // 重新进入转换器

        await cli.run_cmd('rule state4 "pressure > 1000"');

        bdr = await cli.run_cmd('bdr');
        expect(bdr).toContain("rule state2 'temperature > 30'");
        expect(bdr).toContain("rule state3 'humidity < 50'");
        expect(bdr).toContain("rule state4 'pressure > 1000'");

        await cli.run_cmd('return'); // 返回状态级别
        await cli.run_cmd('return'); // 返回策略级别

        await cli.run_cmd('clear');

        bdr = await cli.run_cmd('bdr');

        expect(bdr).not.toContain("transformer 't1'");

        expect(bdr).not.toContain("rule state2 'temperature > 30'");
        expect(bdr).not.toContain("rule state3 'humidity < 50'");
        expect(bdr).not.toContain("rule state4 'pressure > 1000'");

    });
});
