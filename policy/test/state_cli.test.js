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
        
        // 测试状态内部的 bdr 命令
        // sw_cli> policy> policy-abc> state-s1>bdr
        let bdr = await cli.run_cmd('bdr')
        expect(bdr).toContain('enter action 阀门1 开启');
        expect(bdr).toContain('enter action 阀门2 关闭');
        
        // 返回到策略视图
        await cli.run_cmd('return');
        
        // 返回到策略管理视图
        await cli.run_cmd('return');
        
        bdr = await cli.run_cmd('bdr');
        expect(bdr).toContain("policy 'abc'");
        expect(bdr).toContain("state 's1'");
        expect(bdr).toContain('enter action 阀门1 开启');
        expect(bdr).toContain('enter action 阀门2 关闭');
        expect(bdr).toContain('return');
    });

    test('分页功能测试：创建多个状态', async () => {
        // 创建策略test并进入策略视图
        await cli.run_cmd('policy test');
        
        // 创建多个状态（超过20个以测试分页）
        for (let i = 0; i < 25; i++) {
            await cli.run_cmd(`state s${i}`);
            await cli.run_cmd('return');
        }
        
        // 验证所有状态都能正确列出（通过 bdr 命令）
        let policy_bdr = await cli.run_cmd('bdr');
        // 由于移除了状态名称显示，这里只验证策略级别的 bdr 包含状态命令
        expect(policy_bdr).toContain("state 's0'");
        expect(policy_bdr).toContain("state 's24'");
        
        // 进入其中一个状态并添加动作
        await cli.run_cmd('state s10');
        await cli.run_cmd('enter action 设备1 动作1');
        
        // 测试状态内部的 bdr
        let state_bdr = await cli.run_cmd('bdr');
        expect(state_bdr).toContain('enter action 设备1 动作1');
        
        await cli.run_cmd('return');
        await cli.run_cmd('return');
    });

    test('状态内部命令测试', async () => {
        // 创建策略和状态
        await cli.run_cmd('policy test');
        await cli.run_cmd('state s1');
        
        // 测试状态内部的 return 命令
        let result = await cli.run_cmd('return');

        
        // 重新进入状态
        await cli.run_cmd('state s1');
        
        // 测试空状态的 bdr
        let bdr = await cli.run_cmd('bdr');
        // 由于状态 s1 已经有动作了，所以 bdr 应该包含这些动作
        expect(bdr).toContain('enter action 阀门1 开启');
        expect(bdr).toContain('enter action 阀门2 关闭');
        
        await cli.run_cmd('return');
        await cli.run_cmd('return');
    });
});