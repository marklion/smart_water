import test_utils from "../../public/lib/test_utils.js";
import { print_test_log, start_server, close_server } from "../../public/lib/test_utils.js";

let cli;

// 测试辅助函数
async function setupPolicyState(cli, policyName, stateName) {
    await cli.run_cmd('policy');
    await cli.run_cmd(`policy ${policyName}`);
    await cli.run_cmd(`state ${stateName}`);
}

async function verifyBdrContains(cli, expectedItems) {
    let bdr = await cli.run_cmd('bdr');
    expectedItems.forEach(item => {
        expect(bdr).toContain(item);
    });
}

async function verifyBdrNotContains(cli, unexpectedItems) {
    let bdr = await cli.run_cmd('bdr');
    unexpectedItems.forEach(item => {
        expect(bdr).not.toContain(item);
    });
}

async function returnToRoot(cli) {
    await cli.run_cmd('return');
    await cli.run_cmd('return');
}

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
        await setupPolicyState(cli, 'abc', 's1');
        
        // 添加进入动作
        let result = await cli.run_cmd('enter action 阀门1 开启');
        expect(result).toContain('已添加进入动作: 设备 阀门1 执行 开启');
        
        result = await cli.run_cmd('enter action 阀门2 关闭');
        expect(result).toContain('已添加进入动作: 设备 阀门2 执行 关闭');
        
        // 测试状态内部的 bdr 命令
        await verifyBdrContains(cli, [
            'enter action 阀门1 开启',
            'enter action 阀门2 关闭'
        ]);
        
        // 返回到根视图
        await returnToRoot(cli);
        
        // 验证策略级别的配置
        await verifyBdrContains(cli, [
            "policy 'abc'",
            "state 's1'",
            'enter action 阀门1 开启',
            'enter action 阀门2 关闭',
            'return'
        ]);
    });

    test('分页功能测试：创建多个状态', async () => {
        // 创建策略test并进入策略视图
        await setupPolicyState(cli, 'test', 's0');
        
        // 创建多个状态（超过20个以测试分页）
        for (let i = 1; i < 25; i++) {
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
        await verifyBdrContains(cli, ['enter action 设备1 动作1']);
        
        await cli.run_cmd('return');
        await cli.run_cmd('return');
    });

    test('状态内部命令测试', async () => {
        // 创建策略和状态
        await setupPolicyState(cli, 'test', 's1');
        
        // 测试状态内部的 return 命令
        let result = await cli.run_cmd('return');

        
        // 重新进入状态并添加一些动作
        await cli.run_cmd('state s1');
        await cli.run_cmd('enter action 水泵1 启动');
        await cli.run_cmd('enter action 传感器1 读取');
        
        // 测试有动作的状态的 bdr
        await verifyBdrContains(cli, [
            'enter action 水泵1 启动',
            'enter action 传感器1 读取'
        ]);
        
        await cli.run_cmd('return');
        await cli.run_cmd('return');
    });

    test('do action 和 exit action 功能测试', async () => {
        // 创建策略和状态
        await setupPolicyState(cli, 'action_test', 's1');
        
        // 测试添加 do action
        let result = await cli.run_cmd('do action 水泵1 运行');
        expect(result).toContain('已添加状态内动作: 设备 水泵1 执行 运行');
        
        result = await cli.run_cmd('do action 传感器1 监测');
        expect(result).toContain('已添加状态内动作: 设备 传感器1 执行 监测');
        
        // 测试添加 exit action
        result = await cli.run_cmd('exit action 阀门1 关闭');
        expect(result).toContain('已添加离开动作: 设备 阀门1 执行 关闭');
        
        result = await cli.run_cmd('exit action 灯光1 关灯');
        expect(result).toContain('已添加离开动作: 设备 灯光1 执行 关灯');
        
        // 同时添加 enter action 以测试完整配置
        await cli.run_cmd('enter action 开关1 启动');
        
        // 验证所有动作都在 bdr 中显示
        await verifyBdrContains(cli, [
            'enter action 开关1 启动',
            'do action 水泵1 运行',
            'do action 传感器1 监测',
            'exit action 阀门1 关闭',
            'exit action 灯光1 关灯'
        ]);
        
        await returnToRoot(cli);
        
        // 在策略级别验证配置
        await verifyBdrContains(cli, [
            "policy 'action_test'",
            "state 's1'",
            'enter action 开关1 启动',
            'do action 水泵1 运行',
            'do action 传感器1 监测',
            'exit action 阀门1 关闭',
            'exit action 灯光1 关灯'
        ]);
    });

    test('del action 命令功能测试', async () => {
        // 创建策略和状态
        await setupPolicyState(cli, 'del_test', 's1');
        
        // 添加各种类型的动作
        await cli.run_cmd('enter action 设备1 动作1');
        await cli.run_cmd('do action 设备2 动作2');
        await cli.run_cmd('exit action 设备3 动作3');
        
        // 验证动作已添加
        await verifyBdrContains(cli, [
            'enter action 设备1 动作1',
            'do action 设备2 动作2',
            'exit action 设备3 动作3'
        ]);
        
        // 测试删除 enter action
        let result = await cli.run_cmd('del enter 设备1 动作1');
        expect(result).toContain('已删除进入动作: 设备 设备1 执行 动作1');
        
        // 测试删除 do action
        result = await cli.run_cmd('del do 设备2 动作2');
        expect(result).toContain('已删除状态内动作: 设备 设备2 执行 动作2');
        
        // 测试删除 exit action
        result = await cli.run_cmd('del exit 设备3 动作3');
        expect(result).toContain('已删除离开动作: 设备 设备3 执行 动作3');
        
        // 验证所有动作都已删除
        await verifyBdrNotContains(cli, [
            'enter action 设备1 动作1',
            'do action 设备2 动作2',
            'exit action 设备3 动作3'
        ]);
        
        await returnToRoot(cli);
    });

    test('action undo 功能完整测试', async () => {
        // 创建策略和状态
        await setupPolicyState(cli, 'undo_action_test', 's1');
        
        // 添加多个 do action
        await cli.run_cmd('do action 水泵1 启动');
        await cli.run_cmd('do action 水泵2 启动');
        await cli.run_cmd('do action 传感器1 监测');
        
        // 添加多个 exit action
        await cli.run_cmd('exit action 阀门1 关闭');
        await cli.run_cmd('exit action 阀门2 关闭');
        
        // 验证动作已添加
        await verifyBdrContains(cli, [
            'do action 水泵1 启动',
            'do action 水泵2 启动',
            'do action 传感器1 监测',
            'exit action 阀门1 关闭',
            'exit action 阀门2 关闭'
        ]);
        
        // 测试 undo do action（删除所有状态内动作）
        let result = await cli.run_cmd('undo do action');
        expect(result).toContain('已删除 3 个状态内动作');
        
        // 验证 do action 已被删除，但 exit action 仍存在
        await verifyBdrNotContains(cli, [
            'do action 水泵1 启动',
            'do action 水泵2 启动',
            'do action 传感器1 监测'
        ]);
        await verifyBdrContains(cli, [
            'exit action 阀门1 关闭',
            'exit action 阀门2 关闭'
        ]);
        
        // 测试 undo exit action（删除所有离开动作）
        result = await cli.run_cmd('undo exit action');
        expect(result).toContain('已删除 2 个离开动作');
        
        // 验证 exit action 也已被删除
        await verifyBdrNotContains(cli, [
            'exit action 阀门1 关闭',
            'exit action 阀门2 关闭'
        ]);
        
        await returnToRoot(cli);
    });

    test('del action 基本功能测试', async () => {
        // 创建策略和状态
        await setupPolicyState(cli, 'del_basic_test', 's1');
        
        // 添加一些动作
        await cli.run_cmd('enter action 设备1 动作1');
        await cli.run_cmd('do action 设备2 动作2');
        await cli.run_cmd('exit action 设备3 动作3');
        
        // 验证动作已添加
        await verifyBdrContains(cli, [
            'enter action 设备1 动作1',
            'do action 设备2 动作2',
            'exit action 设备3 动作3'
        ]);
        
        // 删除动作
        let result = await cli.run_cmd('del enter 设备1 动作1');
        expect(result).toContain('已删除进入动作: 设备 设备1 执行 动作1');
        
        result = await cli.run_cmd('del do 设备2 动作2');
        expect(result).toContain('已删除状态内动作: 设备 设备2 执行 动作2');
        
        result = await cli.run_cmd('del exit 设备3 动作3');
        expect(result).toContain('已删除离开动作: 设备 设备3 执行 动作3');
        
        // 验证动作已被删除
        await verifyBdrNotContains(cli, [
            'enter action 设备1 动作1',
            'do action 设备2 动作2',
            'exit action 设备3 动作3'
        ]);
        
        await returnToRoot(cli);
    });

    test('Undo功能测试：删除状态和动作', async () => {
        // 创建策略和状态
        await setupPolicyState(cli, 'undo_test', 's1');
        await cli.run_cmd('enter action 阀门1 开启');
        await cli.run_cmd('enter action 阀门2 关闭');
        
        // 验证动作已添加
        await verifyBdrContains(cli, [
            'enter action 阀门1 开启',
            'enter action 阀门2 关闭'
        ]);
        
        // 测试undo enter action命令（删除所有进入动作）
        let result = await cli.run_cmd('undo enter action');
        expect(result).toContain('已删除 2 个进入动作');

        await verifyBdrNotContains(cli, [
            'enter action 阀门1 开启',
            'enter action 阀门2 关闭'
        ]);

        await cli.run_cmd('return');

        await cli.run_cmd('state s2');
        await cli.run_cmd('return');

        await verifyBdrContains(cli, ["state 's1'", "state 's2'"]);
        
        // 测试删除单个状态
        let undo_result = await cli.run_cmd('undo state s1');
        expect(undo_result).toContain('状态 s1 已删除');
        
        // 验证状态s1已被删除，s2仍存在
        await verifyBdrNotContains(cli, ["state 's1'"]);
        await verifyBdrContains(cli, ["state 's2'"]);
        
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
        
        // 保存配置到默认文件
        await cli.run_cmd('save sw_cli_config.txt');

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

        await cli.run_cmd('restore sw_cli_config.txt');

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