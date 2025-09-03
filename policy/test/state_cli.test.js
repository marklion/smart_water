import test_utils from "../../public/lib/test_utils.js";
import { print_test_log, start_server, close_server } from "../../public/lib/test_utils.js";

let cli;

// 常量定义 - 与CLI保持一致
const ACTION_NAMES = {
    'enter': '进入动作',
    'do': '状态内动作',
    'exit': '离开动作'
};

const ASSIGNMENT_NAMES = {
    'enter': '进入赋值',
    'do': '状态内赋值',
    'exit': '离开赋值'
};

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

// 辅助函数：测试添加动作并验证结果
async function testAddAction(cli, actionType, device, action) {
    const result = await cli.run_cmd(`${actionType} action ${device} ${action}`);
    expect(result).toContain(`已添加${ACTION_NAMES[actionType]}: 设备 ${device} 执行 ${action}`);
    return result;
}

// 辅助函数：测试删除动作并验证结果
async function testDelAction(cli, actionType, device, action) {
    const result = await cli.run_cmd(`del ${actionType} ${device} ${action}`);
    expect(result).toContain(`已删除${ACTION_NAMES[actionType]}: 设备 ${device} 执行 ${action}`);
    return result;
}

// 辅助函数：批量添加动作
async function addMultipleActions(cli, actions) {
    const results = [];
    for (const {type, device, action} of actions) {
        const result = await testAddAction(cli, type, device, action);
        results.push(result);
    }
    return results;
}

// 辅助函数：批量删除动作
async function delMultipleActions(cli, actions) {
    const results = [];
    for (const {type, device, action} of actions) {
        const result = await testDelAction(cli, type, device, action);
        results.push(result);
    }
    return results;
}

// 辅助函数：测试添加赋值表达式并验证结果
async function testAddAssignment(cli, assignmentType, variableName, expression) {
    const result = await cli.run_cmd(`${assignmentType} assignment ${variableName} ${expression}`);
    expect(result).toContain(`已添加${ASSIGNMENT_NAMES[assignmentType]}: 变量 ${variableName} = ${expression}`);
    return result;
}

// 辅助函数：测试删除赋值表达式并验证结果
async function testDelAssignment(cli, assignmentType, variableName) {
    const result = await cli.run_cmd(`del ${assignmentType} assignment ${variableName}`);
    expect(result).toContain(`已删除${ASSIGNMENT_NAMES[assignmentType]}: 变量 ${variableName}`);
    return result;
}

// 辅助函数：批量添加赋值表达式
async function addMultipleAssignments(cli, assignments) {
    const results = [];
    for (const {type, variable, expression} of assignments) {
        const result = await testAddAssignment(cli, type, variable, expression);
        results.push(result);
    }
    return results;
}

// 辅助函数：批量删除赋值表达式
async function delMultipleAssignments(cli, assignments) {
    const results = [];
    for (const {type, variable} of assignments) {
        const result = await testDelAssignment(cli, type, variable);
        results.push(result);
    }
    return results;
}

beforeAll(async () => {
    print_test_log('state CLI test begin', true);
    cli = await test_utils('npm run dev_cli');
    await start_server();
    await cli.run_cmd('clear');
});

afterAll(async () => {
    try {
        await cli.run_cmd('clear');
        await cli.close();
        await close_server();
    } catch (error) {
        console.log('清理过程中出现错误，但不影响测试结果:', error.message);
    }
    print_test_log('state CLI test end', true);
}, 60000); // 增加超时时间到60秒

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
        
        // 添加一些动作
        await cli.run_cmd('enter action 水泵1 启动');
        await cli.run_cmd('enter action 传感器1 读取');
        
        // 测试有动作的状态的 bdr
        await verifyBdrContains(cli, [
            'enter action 水泵1 启动',
            'enter action 传感器1 读取'
        ]);
        
        // 测试状态内部的 return 命令
        let result = await cli.run_cmd('return');
        
        // 验证返回到策略级别后，重新进入状态
        await cli.run_cmd('state s1');
        
        // 验证动作仍然存在
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
        
        // 批量添加动作
        await addMultipleActions(cli, [
            {type: 'do', device: '水泵1', action: '运行'},
            {type: 'do', device: '传感器1', action: '监测'},
            {type: 'exit', device: '阀门1', action: '关闭'},
            {type: 'exit', device: '灯光1', action: '关灯'},
            {type: 'enter', device: '开关1', action: '启动'}
        ]);
        
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
        
        // 定义测试动作
        const testActions = [
            {type: 'enter', device: '设备1', action: '动作1'},
            {type: 'do', device: '设备2', action: '动作2'},
            {type: 'exit', device: '设备3', action: '动作3'}
        ];
        
        // 批量添加动作
        await addMultipleActions(cli, testActions);
        
        // 验证动作已添加
        await verifyBdrContains(cli, [
            'enter action 设备1 动作1',
            'do action 设备2 动作2',
            'exit action 设备3 动作3'
        ]);
        
        // 批量删除动作
        await delMultipleActions(cli, testActions);
        
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
        // 确保从干净状态开始
        await cli.run_cmd('clear');

        // 创建初始配置
        await setupPolicyState(cli, 'save_restore_test', 'initial_state');
        await cli.run_cmd('enter action 初始设备 初始动作');
        
        // 返回到根级别
        await returnToRoot(cli);

        let initial_bdr = await cli.run_cmd('bdr');
        expect(initial_bdr).toContain("policy 'save_restore_test'");
        expect(initial_bdr).toContain("state 'initial_state'");
        expect(initial_bdr).toContain('enter action 初始设备 初始动作');
        
        // 保存配置到默认文件（需要在根级别）
        await cli.run_cmd('return'); // 确保在根级别
        await cli.run_cmd('save sw_cli_config.txt');

        // 清空并创建修改后的配置
        await cli.run_cmd('clear');
        await setupPolicyState(cli, 'modified_policy', 'modified_state');
        await cli.run_cmd('enter action 修改设备 修改动作');
        await returnToRoot(cli);

        let modified_bdr = await cli.run_cmd('bdr');
        expect(modified_bdr).toContain("policy 'modified_policy'");
        expect(modified_bdr).toContain("state 'modified_state'");
        expect(modified_bdr).toContain('enter action 修改设备 修改动作');
        expect(modified_bdr).not.toContain("policy 'save_restore_test'");
        expect(modified_bdr).not.toEqual(initial_bdr);

        // 恢复配置（需要在根级别）
        await cli.run_cmd('return'); // 确保在根级别
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

    test('赋值表达式基本功能测试', async () => {
        // 创建策略和状态
        await setupPolicyState(cli, 'assignment_test', 's1');
        
        // 添加进入状态赋值表达式（不包含空格的表达式）
        let result = await cli.run_cmd('enter assignment temp s.temperature');
        expect(result).toContain('已添加进入赋值: 变量 temp = s.temperature');
        
        // 添加状态内赋值表达式
        result = await cli.run_cmd('do assignment pressure s.pressure');
        expect(result).toContain('已添加状态内赋值: 变量 pressure = s.pressure');
        
        // 添加离开状态赋值表达式
        result = await cli.run_cmd('exit assignment humidity s.humidity');
        expect(result).toContain('已添加离开赋值: 变量 humidity = s.humidity');
        
        // 测试状态内部的 bdr 命令
        await verifyBdrContains(cli, [
            'enter assignment temp s.temperature',
            'do assignment pressure s.pressure',
            'exit assignment humidity s.humidity'
        ]);
        
        // 返回到根视图
        await returnToRoot(cli);
        
        // 验证策略级别的配置
        await verifyBdrContains(cli, [
            "policy 'assignment_test'",
            "state 's1'",
            'enter assignment temp s.temperature',
            'do assignment pressure s.pressure',
            'exit assignment humidity s.humidity'
        ]);
    });

    test('赋值表达式批量操作测试', async () => {
        // 创建策略和状态
        await setupPolicyState(cli, 'batch_assignment_test', 's1');
        
        // 定义测试赋值表达式（不包含空格）
        const testAssignments = [
            {type: 'enter', variable: 'temp1', expression: 's.sensor1'},
            {type: 'enter', variable: 'temp2', expression: 's.sensor2'},
            {type: 'do', variable: 'pressure', expression: 's.pressure_sensor'},
            {type: 'do', variable: 'flow', expression: 's.flow_rate'},
            {type: 'exit', variable: 'result1', expression: 'temp1'},
            {type: 'exit', variable: 'result2', expression: 'pressure'}
        ];
        
        // 批量添加赋值表达式
        await addMultipleAssignments(cli, testAssignments);
        
        // 验证所有赋值表达式都在 bdr 中显示
        await verifyBdrContains(cli, [
            'enter assignment temp1 s.sensor1',
            'enter assignment temp2 s.sensor2',
            'do assignment pressure s.pressure_sensor',
            'do assignment flow s.flow_rate',
            'exit assignment result1 temp1',
            'exit assignment result2 pressure'
        ]);
        
        await returnToRoot(cli);
        
        // 在策略级别验证配置
        await verifyBdrContains(cli, [
            "policy 'batch_assignment_test'",
            "state 's1'",
            'enter assignment temp1 s.sensor1',
            'enter assignment temp2 s.sensor2',
            'do assignment pressure s.pressure_sensor',
            'do assignment flow s.flow_rate',
            'exit assignment result1 temp1',
            'exit assignment result2 pressure'
        ]);
    });

    test('del assignment 命令功能测试', async () => {
        // 创建策略和状态
        await setupPolicyState(cli, 'del_assignment_test', 's1');
        
        // 定义测试赋值表达式（不包含空格）
        const testAssignments = [
            {type: 'enter', variable: 'var1', expression: 's.value1'},
            {type: 'do', variable: 'var2', expression: 's.value2'},
            {type: 'exit', variable: 'var3', expression: 's.value3'}
        ];
        
        // 批量添加赋值表达式
        await addMultipleAssignments(cli, testAssignments);
        
        // 验证赋值表达式已添加
        await verifyBdrContains(cli, [
            'enter assignment var1 s.value1',
            'do assignment var2 s.value2',
            'exit assignment var3 s.value3'
        ]);
        
        // 批量删除赋值表达式
        await delMultipleAssignments(cli, testAssignments);
        
        // 验证所有赋值表达式都已删除
        await verifyBdrNotContains(cli, [
            'enter assignment var1 s.value1',
            'do assignment var2 s.value2',
            'exit assignment var3 s.value3'
        ]);
        
        await returnToRoot(cli);
    });

    test('赋值表达式 undo 功能测试', async () => {
        // 创建策略和状态
        await setupPolicyState(cli, 'undo_assignment_test', 's1');
        
        // 添加多个 enter assignment（不包含空格）
        await cli.run_cmd('enter assignment temp1 s.temperature1');
        await cli.run_cmd('enter assignment temp2 s.temperature2');
        await cli.run_cmd('enter assignment temp3 s.temperature3');
        
        // 添加多个 do assignment
        await cli.run_cmd('do assignment pressure1 s.pressure1');
        await cli.run_cmd('do assignment pressure2 s.pressure2');
        
        // 添加多个 exit assignment
        await cli.run_cmd('exit assignment result1 temp1');
        await cli.run_cmd('exit assignment result2 temp3');
        
        // 验证赋值表达式已添加
        await verifyBdrContains(cli, [
            'enter assignment temp1 s.temperature1',
            'enter assignment temp2 s.temperature2',
            'enter assignment temp3 s.temperature3',
            'do assignment pressure1 s.pressure1',
            'do assignment pressure2 s.pressure2',
            'exit assignment result1 temp1',
            'exit assignment result2 temp3'
        ]);
        
        // 测试 undo enter assignment（删除所有进入赋值表达式）
        let result = await cli.run_cmd('undo enter assignment');
        expect(result).toContain('已删除 3 个进入赋值');
        
        // 验证 enter assignment 已被删除，但其他类型仍存在
        await verifyBdrNotContains(cli, [
            'enter assignment temp1 s.temperature1',
            'enter assignment temp2 s.temperature2',
            'enter assignment temp3 s.temperature3'
        ]);
        await verifyBdrContains(cli, [
            'do assignment pressure1 s.pressure1',
            'do assignment pressure2 s.pressure2',
            'exit assignment result1 temp1',
            'exit assignment result2 temp3'
        ]);
        
        // 测试 undo do assignment（删除所有状态内赋值表达式）
        result = await cli.run_cmd('undo do assignment');
        expect(result).toContain('已删除 2 个状态内赋值');
        
        // 验证 do assignment 也已被删除
        await verifyBdrNotContains(cli, [
            'do assignment pressure1 s.pressure1',
            'do assignment pressure2 s.pressure2'
        ]);
        await verifyBdrContains(cli, [
            'exit assignment result1 temp1',
            'exit assignment result2 temp3'
        ]);
        
        // 测试 undo exit assignment（删除所有离开赋值表达式）
        result = await cli.run_cmd('undo exit assignment');
        expect(result).toContain('已删除 2 个离开赋值');
        
        // 验证所有赋值表达式都已被删除
        await verifyBdrNotContains(cli, [
            'exit assignment result1 temp1',
            'exit assignment result2 temp3'
        ]);
        
        await returnToRoot(cli);
    });

    test('赋值表达式与动作混合配置测试', async () => {
        // 创建策略和状态
        await setupPolicyState(cli, 'mixed_config_test', 's1');
        
        // 添加动作和赋值表达式混合配置（不包含空格）
        await cli.run_cmd('enter action 水泵1 启动');
        await cli.run_cmd('enter assignment temp s.temperature');
        await cli.run_cmd('do action 传感器1 读取');
        await cli.run_cmd('do assignment pressure s.pressure');
        await cli.run_cmd('exit assignment result temp');
        await cli.run_cmd('exit action 水泵1 关闭');
        
        // 验证混合配置在 bdr 中正确显示
        await verifyBdrContains(cli, [
            'enter action 水泵1 启动',
            'enter assignment temp s.temperature',
            'do action 传感器1 读取',
            'do assignment pressure s.pressure',
            'exit assignment result temp',
            'exit action 水泵1 关闭'
        ]);
        
        // 删除部分配置
        await cli.run_cmd('del enter 水泵1 启动');
        await cli.run_cmd('del do assignment pressure');
        
        // 验证删除后的配置
        await verifyBdrNotContains(cli, [
            'enter action 水泵1 启动',
            'do assignment pressure s.pressure'
        ]);
        await verifyBdrContains(cli, [
            'enter assignment temp s.temperature',
            'do action 传感器1 读取',
            'exit assignment result temp',
            'exit action 水泵1 关闭'
        ]);
        
        await returnToRoot(cli);
        
        // 在策略级别验证最终配置
        await verifyBdrContains(cli, [
            "policy 'mixed_config_test'",
            "state 's1'",
            'enter assignment temp s.temperature',
            'do action 传感器1 读取',
            'exit assignment result temp',
            'exit action 水泵1 关闭'
        ]);
    });

    test('赋值表达式重复变量名检测测试', async () => {
        // 创建策略和状态
        await setupPolicyState(cli, 'duplicate_var_test', 's1');
        
        // 添加第一个赋值表达式（不包含空格）
        let result = await cli.run_cmd('enter assignment temp s.temperature');
        expect(result).toContain('已添加进入赋值: 变量 temp = s.temperature');
        
        // 尝试添加相同变量名的赋值表达式，应该失败
        result = await cli.run_cmd('enter assignment temp s.temperature2');
        expect(result).toContain('变量 temp 的赋值表达式已存在');
        
        // 验证只有第一个赋值表达式存在
        await verifyBdrContains(cli, ['enter assignment temp s.temperature']);
        await verifyBdrNotContains(cli, ['enter assignment temp s.temperature2']);
        
        // 但可以在不同类型中使用相同变量名
        result = await cli.run_cmd('do assignment temp s.pressure');
        expect(result).toContain('已添加状态内赋值: 变量 temp = s.pressure');
        
        result = await cli.run_cmd('exit assignment temp s.humidity');
        expect(result).toContain('已添加离开赋值: 变量 temp = s.humidity');
        
        // 验证不同类型中的相同变量名都存在
        await verifyBdrContains(cli, [
            'enter assignment temp s.temperature',
            'do assignment temp s.pressure',
            'exit assignment temp s.humidity'
        ]);
        
        await returnToRoot(cli);
    });

});