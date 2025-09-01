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

        
        // 重新进入状态并添加一些动作
        await cli.run_cmd('state s1');
        await cli.run_cmd('enter action 水泵1 启动');
        await cli.run_cmd('enter action 传感器1 读取');
        
        // 测试有动作的状态的 bdr
        let bdr = await cli.run_cmd('bdr');
        // 现在状态 s1 有动作了，所以 bdr 应该包含这些动作
        expect(bdr).toContain('enter action 水泵1 启动');
        expect(bdr).toContain('enter action 传感器1 读取');
        
        await cli.run_cmd('return');
        await cli.run_cmd('return');
    });

    test('Undo功能测试：删除状态和动作', async () => {
        // 创建策略和状态
        await cli.run_cmd('policy undo_test');
        await cli.run_cmd('state s1');
        await cli.run_cmd('enter action 阀门1 开启');
        await cli.run_cmd('enter action 阀门2 关闭');
        
        // 验证动作已添加
        let bdr = await cli.run_cmd('bdr');
        expect(bdr).toContain('enter action 阀门1 开启');
        expect(bdr).toContain('enter action 阀门2 关闭');
        
        // 测试undo enter action命令（删除所有进入动作）
        let result = await cli.run_cmd('undo enter action');
        expect(result).toContain('已删除 2 个进入动作');

        bdr = await cli.run_cmd('bdr');
        expect(bdr).not.toContain('enter action 阀门1 开启');
        expect(bdr).not.toContain('enter action 阀门2 关闭');

        await cli.run_cmd('return');

        await cli.run_cmd('state s2');
        await cli.run_cmd('return');

        bdr = await cli.run_cmd('bdr');
        expect(bdr).toContain("state 's1'");
        expect(bdr).toContain("state 's2'");
        
        // 测试删除单个状态
        let undo_result = await cli.run_cmd('undo state s1');
        expect(undo_result).toContain('状态 s1 已删除');
        
        // 验证状态s1已被删除，s2仍存在
        bdr = await cli.run_cmd('bdr');
        expect(bdr).not.toContain("state 's1'");
        expect(bdr).toContain("state 's2'");
        
        await cli.run_cmd('return');
    });

    test('保存和恢复配置测试', async () => {
        // 先返回到根目录并清空所有配置
        await cli.run_cmd('return');
        await cli.run_cmd('clear');

        await cli.run_cmd('policy');
        await cli.run_cmd('policy save_restore_test');
        await cli.run_cmd('state initial_state');
        await cli.run_cmd('enter action 初始设备 初始动作');
        await cli.run_cmd('return');
        await cli.run_cmd('return');
        await cli.run_cmd('return');

        let initial_bdr = await cli.run_cmd('bdr');
        expect(initial_bdr).toContain("policy 'save_restore_test'");
        expect(initial_bdr).toContain("state 'initial_state'");
        expect(initial_bdr).toContain('enter action 初始设备 初始动作');
        
        // 保存配置到临时文件
        await cli.run_cmd('save test_state_config.txt');

        await cli.run_cmd('clear');
        await cli.run_cmd('policy');
        await cli.run_cmd('policy modified_policy');
        await cli.run_cmd('state modified_state');
        await cli.run_cmd('enter action 修改设备 修改动作');
        await cli.run_cmd('return');
        await cli.run_cmd('return');
        await cli.run_cmd('return');

        let modified_bdr = await cli.run_cmd('bdr');
        expect(modified_bdr).toContain("policy 'modified_policy'");
        expect(modified_bdr).toContain("state 'modified_state'");
        expect(modified_bdr).toContain('enter action 修改设备 修改动作');
        expect(modified_bdr).not.toContain("policy 'save_restore_test'");
        expect(modified_bdr).not.toEqual(initial_bdr);

        await cli.run_cmd('restore test_state_config.txt');

        let restored_bdr = await cli.run_cmd('bdr');
        expect(restored_bdr).toContain("policy 'save_restore_test'");
        expect(restored_bdr).toContain("state 'initial_state'");
        expect(restored_bdr).toContain('enter action 初始设备 初始动作');
        expect(restored_bdr).not.toContain("policy 'modified_policy'");
        expect(restored_bdr).not.toContain("state 'modified_state'");
        expect(restored_bdr).not.toContain('enter action 修改设备 修改动作');
        
        // 重新进入policy视图为后续测试做准备
        await cli.run_cmd('policy');
    });

});