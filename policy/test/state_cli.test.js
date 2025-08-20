import test_utils from "../../public/lib/test_utils.js";
import { print_test_log, start_server, close_server } from "../../public/lib/test_utils.js";

let cli;

beforeAll(async () => {
    print_test_log('state CLI test begin', true);
    cli = await test_utils('npm run dev_cli');
    await start_server();
    await cli.run_cmd('clear');
});

afterAll(async () => {
    await cli.run_cmd('clear');
    await cli.close();
    await close_server();
    print_test_log('state CLI test end', true);
});

describe('状态 CLI 测试', () => {
    beforeEach(async () => {
        // 清空所有配置
        await cli.run_cmd('clear');
        // 进入策略管理
        await cli.run_cmd('policy');
    });

    afterEach(async () => {
        // 返回到根视图
        await cli.run_cmd('return');
        // 清空配置
        await cli.run_cmd('clear');
    });

    test('基本功能：创建策略、状态和动作', async () => {
        // 创建策略abc并进入策略视图
        // sw_cli> policy> policy abc
        await cli.run_cmd('policy abc');
        
        // 创建状态s1并进入状态视图
        // sw_cli> policy> policy-abc>state s1
        await cli.run_cmd('state s1');
        
        // 添加进入动作
        // sw_cli> policy> policy-abc> state-s1>enter action 阀门1 开启
        let result = await cli.run_cmd('enter action 阀门1 开启');
        expect(result).toContain('已添加进入动作: 设备 阀门1 执行 开启');
        
        // sw_cli> policy> policy-abc> state-s1>enter action 阀门2 关闭
        result = await cli.run_cmd('enter action 阀门2 关闭');
        expect(result).toContain('已添加进入动作: 设备 阀门2 执行 关闭');
        
        // 返回到策略视图
        await cli.run_cmd('return');
        
        // 返回到策略管理视图
        await cli.run_cmd('return');
        
        // 查看bdr配置输出
        // sw_cli> policy>bdr
        let bdr = await cli.run_cmd('bdr');
        expect(bdr).toContain('policy abc');
        expect(bdr).toContain('state s1');
        expect(bdr).toContain('enter action 阀门1 开启');
        expect(bdr).toContain('enter action 阀门2 关闭');
        expect(bdr).toContain('return');
    });
});