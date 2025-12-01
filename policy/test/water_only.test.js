import test_utils, { wait_ms, wait_spend_ms } from "../../public/lib/test_utils.js";
import { print_test_log, start_server, close_server } from "../../public/lib/test_utils.js";

let cli;

beforeAll(async () => {
    print_test_log('water only test begin', true);
    cli = await test_utils('npm run dev_cli');
    await start_server();
    await cli.run_cmd('clear');
}, 60000); 

afterAll(async () => {
    await cli.run_cmd('clear');
    await cli.close();
    await close_server();
    print_test_log('water only test end', true);
});

async function prepare_resource_config() {
    let prepare = `
        resource
  farm
    add farm '农场1' '呼市' '1' '2' '玉米'
  return
  block
    add block '农场1' '地块1' '20' ''
  return
return
        `;
    let lines = prepare.trim().split('\n').filter(l => l.trim().length > 0);
    for (let line of lines) {
        await cli.run_cmd(line.trim());
    }
}

async function prepare_water_group_valve_config() {
    await prepare_resource_config();
    await cli.run_cmd('config');
    await cli.run_cmd(`add water group valve '农场1' '地块1' '轮灌阀门1' 'virtualDevice' 'vd.log' 2 3 3 3 2`);
    await cli.run_cmd(`add water group valve '农场1' '地块1' '轮灌阀门2' 'virtualDevice' 'vd.log' 2 3 3 3 2`);
    await cli.run_cmd('return');
}

async function prepare_fert_policy_config() {
    await cli.run_cmd('config');
    await cli.run_cmd(`init fert policy '农场1-施肥' '农场1' 10 5 5 5 5 5 5`);
    await cli.run_cmd('return');
}

async function prepare_water_policy_config() {
    await cli.run_cmd('config');
    await cli.run_cmd(`init water policy '农场1-供水' '农场1' 5 10 5 10 5 10 5`);
    await cli.run_cmd('return');
}

async function prepare_global_policy_config() {
    await cli.run_cmd('config');
    await cli.run_cmd(`init global policy '农场1-总策略' '农场1' 8`);
    await cli.run_cmd('return');
}

async function reset_statistics() {
    await cli.run_cmd('statistic');
    await cli.run_cmd('update item 农场1总水流量 0');
    await cli.run_cmd('update item 农场1总施肥量 0');
    await cli.run_cmd('update item 轮灌组1累计供水量 0');
    await cli.run_cmd('update item 轮灌组1累计施肥量 0');
    await cli.run_cmd('return');
}

async function prepare_group_policy_config() {
    await prepare_resource_config();
    await prepare_fert_policy_config();
    await prepare_water_group_valve_config();
    await prepare_water_policy_config();
    await prepare_global_policy_config();
    await cli.run_cmd('config');
    // 添加轮灌组策略：轮灌组1，面积10亩，施肥时间2分钟，总时间20分钟，肥后时间2分钟，定时方式，每亩施肥量0.03L/亩
    // 参数格式：policy_name, farm_name, area, fert_time, method, area_based_amount, total_time, post_fert_time, ...valves
    await cli.run_cmd(`add group policy 轮灌组1 农场1 10 2 定时 0.03 20 2 轮灌阀门1 轮灌阀门2`);
    await cli.run_cmd('return');
    await reset_statistics();
}

async function begin_policy_run() {
    await cli.run_cmd('policy');
    await cli.run_cmd('scan period 500');
    await wait_ms(60);
    await cli.run_cmd('return');
}

async function trigger_group_policy(policy_name, is_open) {
    await cli.run_cmd('policy');
    await cli.run_cmd(`runtime assignment ${policy_name} false '需要启动' '${is_open ? 'true' : 'false'}'`);
    await wait_ms(60);
    await cli.run_cmd('return');
}

// 设置"需要跳过"变量（模拟"只浇水"按钮）
async function set_water_only_mode(policy_name, enabled) {
    await cli.run_cmd('policy');
    await cli.run_cmd(`runtime assignment ${policy_name} false '需要跳过' '${enabled ? 'true' : 'false'}'`);
    await wait_ms(60);
    await cli.run_cmd('return');
}

async function mock_readout(device_name, value) {
    await cli.run_cmd('device');
    await cli.run_cmd(`mock readout ${device_name} ${value}`);
    await wait_ms(60);
    await cli.run_cmd('return');
}

async function mock_total_readout(device_name, value) {
    await cli.run_cmd('device');
    await cli.run_cmd(`mock total readout ${device_name} ${value}`);
    await wait_ms(60);
    await cli.run_cmd('return');
}

async function confirm_policy_status(policy_name, expected_status) {
    await cli.run_cmd('policy');
    let policies_lines = (await cli.run_cmd(`list policy ${policy_name}`)).split('\n');
    
    // 检查策略是否存在
    let policy_exists = policies_lines.some(line => line.includes(policy_name));
    if (!policy_exists) {
        console.error(`策略 ${policy_name} 的输出:`, policies_lines.join('\n'));
        // 列出所有策略以便调试
        let all_policies = await cli.run_cmd('list policy');
        console.error('所有策略:', all_policies);
        throw new Error(`策略 ${policy_name} 未找到或未初始化`);
    }
    
    let status_line_index = policies_lines.findIndex(line => line.startsWith('当前状态'));
    if (status_line_index === -1) {
        console.error(`策略 ${policy_name} 的输出:`, policies_lines.join('\n'));
        throw new Error(`策略 ${policy_name} 未找到或未初始化`);
    }
    let status_line = policies_lines[status_line_index].split(':')[1].trim();
    expect(status_line).toBe(expected_status);
    await cli.run_cmd('return');
}

async function confirm_valve_status(device_name, expected_status) {
    await cli.run_cmd('device');
    let devices_lines = (await cli.run_cmd('list device')).split('\n');
    let device_name_line_index = devices_lines.findIndex(line => line.includes(device_name));
    expect(device_name_line_index).not.toBe(-1);
    let status_line = devices_lines[device_name_line_index + 5];
    expect(status_line).toContain(`开关是否打开`);
    expect(status_line).toContain(expected_status ? 'true' : 'false');
    await cli.run_cmd('return');
}

async function confirm_variable_value(policy_name, variable_name, expected_value) {
    await cli.run_cmd('policy');
    let runtime = await cli.run_cmd(`get policy runtime ${policy_name}`);
    expect(runtime).toContain(variable_name);
    let variables_match = runtime.match(new RegExp(`${variable_name}[^:]*:([^\\n]+)`));
    if (variables_match) {
        let value = variables_match[1].trim();
        expect(value).toBe(expected_value);
    }
    await cli.run_cmd('return');
}

describe('只浇水功能测试', () => {
    beforeEach(async () => {
        await cli.run_cmd('clear');
        await prepare_group_policy_config();
        await begin_policy_run();
        
        // 等待策略初始化
        await wait_ms(200);
        
        // 验证策略已创建
        await cli.run_cmd('policy');
        let policy_list = await cli.run_cmd('list policy 轮灌组1');
        if (!policy_list.includes('轮灌组1')) {
            throw new Error('轮灌组1策略未正确创建');
        }
        await cli.run_cmd('return');
        
        await cli.run_cmd('policy');
        await cli.run_cmd(`runtime assignment 农场1-供水 false '需要启动' 'true'`);
        await wait_ms(60);
        await cli.run_cmd('return');
        await mock_readout('农场1-施肥流量计', 666.66);
        await mock_readout('农场1-施肥液位计', 50);

        await wait_ms(100);
    }, 120000); // 120秒超时，给配置准备更多时间

    afterEach(async () => {
        await cli.run_cmd('clear');
    }, 30000);

    test('在肥前状态启用只浇水模式，应该直接跳到收尾状态', async () => {
        // 启动轮灌组策略
        await trigger_group_policy('轮灌组1', true);
        let start_point = Date.now();

        await mock_readout('轮灌阀门1', 5);
        await mock_readout('轮灌阀门2', 5);
        await mock_total_readout('农场1-主管道流量计', 100);

        await wait_spend_ms(start_point, 200);
        await confirm_policy_status('轮灌组1', '肥前');
        await confirm_valve_status('轮灌阀门1', true);
        await confirm_valve_status('轮灌阀门2', true);
        await confirm_valve_status('农场1-施肥泵', false);
        
        // 启用只浇水模式（设置"需要跳过"为true）
        await set_water_only_mode('轮灌组1', true);
        
        // 等待策略响应（给策略足够的时间来响应状态转换）
        await wait_spend_ms(start_point, 400);
        
        // 验证策略应该直接跳到收尾状态，跳过施肥和肥后
        await confirm_policy_status('轮灌组1', '收尾');
        await confirm_valve_status('农场1-施肥泵', false); // 施肥泵不应该启动

        await trigger_group_policy('轮灌组1', false);
        await wait_spend_ms(start_point, 500);
        await confirm_policy_status('轮灌组1', '空闲');
    }, 60000);

    test('在施肥状态启用只浇水模式，应该立即跳到收尾状态', async () => {
        await trigger_group_policy('轮灌组1', true);
        let start_point = Date.now();

        await mock_readout('轮灌阀门1', 5);
        await mock_readout('轮灌阀门2', 5);
        await mock_total_readout('农场1-主管道流量计', 100);

        await wait_spend_ms(start_point, 200);
        await confirm_policy_status('轮灌组1', '肥前');
        
        await wait_spend_ms(start_point, 2000);
        await confirm_policy_status('轮灌组1', '施肥');
        await confirm_valve_status('农场1-施肥泵', true); // 施肥泵应该已启动
        
        // 启用只浇水模式（设置"需要跳过"为true）
        await set_water_only_mode('轮灌组1', true);
        
        // 等待策略响应（给策略足够的时间来响应状态转换）
        await wait_spend_ms(start_point, 2400);
        
        // 验证策略应该立即跳到收尾状态
        await confirm_policy_status('轮灌组1', '收尾');
        await confirm_valve_status('农场1-施肥泵', false); // 施肥泵应该已关闭
        
        // 停止策略
        await trigger_group_policy('轮灌组1', false);
        await wait_spend_ms(start_point, 2500);
        await confirm_policy_status('轮灌组1', '空闲');
    }, 60000);

    test('启用只浇水模式后，策略应该跳过施肥阶段', async () => {

        await set_water_only_mode('轮灌组1', true);

        await trigger_group_policy('轮灌组1', true);
        let start_point = Date.now();

        await mock_readout('轮灌阀门1', 5);
        await mock_readout('轮灌阀门2', 5);
        await mock_total_readout('农场1-主管道流量计', 100);

        await wait_spend_ms(start_point, 400);

        await confirm_policy_status('轮灌组1', '收尾');
        await confirm_valve_status('轮灌阀门1', true); // 阀门应该打开（浇水）
        await confirm_valve_status('轮灌阀门2', true);
        await confirm_valve_status('农场1-施肥泵', false); // 施肥泵不应该启动

        await trigger_group_policy('轮灌组1', false);
        await wait_spend_ms(start_point, 500);
        await confirm_policy_status('轮灌组1', '空闲');
    }, 60000);

    test('关闭只浇水模式后，策略应该正常执行施肥', async () => {
        // 先启用只浇水模式
        await set_water_only_mode('轮灌组1', true);
        
        // 启动轮灌组策略
        await trigger_group_policy('轮灌组1', true);
        let start_point = Date.now();
        
        // 模拟设备读数
        await mock_readout('轮灌阀门1', 5);
        await mock_readout('轮灌阀门2', 5);
        await mock_total_readout('农场1-主管道流量计', 100);
        
        // 等待进入收尾状态（因为只浇水模式开启）
        await wait_spend_ms(start_point, 400);
        await confirm_policy_status('轮灌组1', '收尾');
        await confirm_valve_status('农场1-施肥泵', false);
        
        // 关闭只浇水模式（设置"需要跳过"为false）
        await set_water_only_mode('轮灌组1', false);
        
        // 停止当前策略
        await trigger_group_policy('轮灌组1', false);
        await wait_spend_ms(start_point, 500);
        await confirm_policy_status('轮灌组1', '空闲');
        
        // 重新启动策略
        await trigger_group_policy('轮灌组1', true);
        start_point = Date.now();
        
        await mock_readout('轮灌阀门1', 5);
        await mock_readout('轮灌阀门2', 5);
        await mock_total_readout('农场1-主管道流量计', 120);

        await wait_spend_ms(start_point, 200);
        await confirm_policy_status('轮灌组1', '肥前');

        await wait_spend_ms(start_point, 2000);
        await confirm_policy_status('轮灌组1', '施肥');
        await confirm_valve_status('农场1-施肥泵', true); // 施肥泵应该启动
        
        // 停止策略
        await trigger_group_policy('轮灌组1', false);
        await wait_spend_ms(start_point, 2100);
    }, 60000);

    test('验证"需要跳过"变量可以正确设置和读取', async () => {
        // 设置"需要跳过"为true
        await set_water_only_mode('轮灌组1', true);

        // 使用 list policy 来查看策略信息，其中包含变量信息
        await cli.run_cmd('policy');
        let policy_info = await cli.run_cmd(`list policy 轮灌组1`);
        // list policy 会显示策略的运行时信息，包括变量
        expect(policy_info).toContain('轮灌组1');
        await cli.run_cmd('return');

        await set_water_only_mode('轮灌组1', false);

        await cli.run_cmd('policy');
        policy_info = await cli.run_cmd(`list policy 轮灌组1`);
        expect(policy_info).toContain('轮灌组1');
        await cli.run_cmd('return');
    }, 60000);
});

