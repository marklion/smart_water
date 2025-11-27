import test_utils, { wait_ms, wait_spend_ms } from "../../public/lib/test_utils.js";
import { print_test_log, start_server, close_server } from "../../public/lib/test_utils.js";
let cli;
beforeAll(async () => {
    print_test_log('water group valve quick config test begin', true)
    cli = await test_utils('npm run dev_cli');
    await start_server()
    await cli.run_cmd('clear');
})
afterAll(async () => {
    await cli.run_cmd('clear');
    await cli.run_cmd('save');
    await cli.close();
    await close_server();
    print_test_log('water group valve quick config test end', true)
})

async function prepare_resource_config() {
    let prepare = `
        resource
  farm
    add farm '农场1' '呼市' '1' '2' '玉米'
    add farm '农场2' '呼市' '1' '2' '番茄'
  return
  block
    add block '农场1' '地块1' '20' ''
    add block '农场1' '地块2' '20' ''
    add block '农场2' '地块3' '20' ''
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
    await cli.run_cmd(`add water group valve '农场1' '地块2' '轮灌阀门3' 'virtualDevice' 'vd.log' 2 3 3 3 2`);
    await cli.run_cmd(`add water group valve '农场2' '地块1' '轮灌阀门4' 'virtualDevice' 'vd.log' 2 3 3 3 2`);
    await cli.run_cmd('return');
}

async function begin_policy_run() {
    await cli.run_cmd('policy');
    await cli.run_cmd('scan period 50');
    await wait_ms(60);
    await cli.run_cmd('return');
}

async function trigger_valve_open(wgv_name) {
    await cli.run_cmd('policy');
    await cli.run_cmd(`runtime assignment ${wgv_name} false '需要启动' 'true'`);
    await wait_ms(60);
    await cli.run_cmd('return');
}
async function trigger_valve_close(wgv_name) {
    await cli.run_cmd('policy');
    await cli.run_cmd(`runtime assignment ${wgv_name} false '需要启动' 'false'`);
    await wait_ms(60);
    await cli.run_cmd('return');
}
async function trigger_valve_reset(wgv_name) {
    await cli.run_cmd('policy');
    await cli.run_cmd(`runtime assignment ${wgv_name} false '需要重置' 'true'`);
    await wait_ms(60);
    await cli.run_cmd('return');
}

async function mock_readout(wgv_name, pressure) {
    await cli.run_cmd('device');
    await cli.run_cmd(`mock readout ${wgv_name} ${pressure}`);
    await wait_ms(60);
    await cli.run_cmd('return');
}
async function mock_total_readout(wgv_name, pressure) {
    await cli.run_cmd('device');
    await cli.run_cmd(`mock total readout ${wgv_name} ${pressure}`);
    await wait_ms(60);
    await cli.run_cmd('return');
}

async function confirm_valve_status(wgv_name, expected_status) {
    await cli.run_cmd('device');
    let devices_lines = (await cli.run_cmd('list device')).split('\n');
    let device_name_line_index = devices_lines.findIndex(line => line.includes(wgv_name));
    expect(device_name_line_index).not.toBe(-1);
    let status_line = devices_lines[device_name_line_index + 5];
    expect(status_line).toContain(`开关是否打开`);
    expect(status_line).toContain(expected_status ? 'true' : 'false');

    await cli.run_cmd('return');
}

async function confirm_warning(expected_warning) {
    await cli.run_cmd('warning');
    let warnings_lines = (await cli.run_cmd('list warnings')).split('\n');
    let focus_line = warnings_lines[0];
    expect(focus_line).toContain(expected_warning);
    await cli.run_cmd('return');
}

async function confirm_policy_status(wgv_name, expected_status) {
    await cli.run_cmd('policy');
    let policies_lines = (await cli.run_cmd(`list policy ${wgv_name}`)).split('\n');
    let status_line_index = policies_lines.findIndex(line => line.startsWith('当前状态'));
    if (status_line_index === -1) {
        // 如果找不到"当前状态"行，输出所有行以便调试
        console.error(`策略 ${wgv_name} 的输出:`, policies_lines.join('\n'));
        throw new Error(`策略 ${wgv_name} 未找到或未初始化`);
    }
    let status_line = policies_lines[status_line_index].split(':')[1].trim();
    expect(status_line).toBe(expected_status);
    await cli.run_cmd('return');
}

describe('轮灌阀门快速配置和验证', () => {
    beforeEach(async () => {
        await cli.run_cmd('clear');
        await prepare_water_group_valve_config();
        await begin_policy_run();
    })
    afterEach(async () => {
        await cli.run_cmd('clear');
    })
    test('添加轮灌阀门并验证策略可以开启和关闭', async () => {
        await trigger_valve_open('轮灌阀门1');
        await trigger_valve_open('轮灌阀门3');
        let start_point = Date.now();
        await wait_spend_ms(start_point, 1000);
        await mock_readout('轮灌阀门1', 5);
        await mock_readout('轮灌阀门2', 2);
        await mock_readout('轮灌阀门3', 5);
        await wait_spend_ms(start_point, 2000);
        await confirm_valve_status('轮灌阀门1', true);
        await confirm_valve_status('轮灌阀门3', true);
        await confirm_valve_status('轮灌阀门2', false);
        await trigger_valve_close('轮灌阀门3');
        start_point = Date.now();
        await wait_spend_ms(start_point, 1000);
        await mock_readout('轮灌阀门1', 5);
        await mock_readout('轮灌阀门2', 2);
        await mock_readout('轮灌阀门3', 2);
        await wait_spend_ms(start_point, 2000);
        await confirm_valve_status('轮灌阀门1', true);
        await confirm_valve_status('轮灌阀门3', false);
        await confirm_valve_status('轮灌阀门2', false);
    });
    test('关阀状态下压力太大', async () => {
        let start_point = Date.now();
        await mock_readout('轮灌阀门1', 5);
        await wait_spend_ms(start_point, 1000);
        await confirm_policy_status('轮灌阀门1', '关阀')
        await wait_spend_ms(start_point, 2000);
        await confirm_policy_status('轮灌阀门1', '异常')
        await confirm_warning('轮灌阀门1压力异常')
    });
    test('开阀状态下压力太小,手动恢复', async () => {
        await trigger_valve_open('轮灌阀门2');
        let start_point = Date.now();
        await mock_readout('轮灌阀门2', 2);
        await wait_spend_ms(start_point, 1000);
        await confirm_policy_status('轮灌阀门2', '开阀')
        await wait_spend_ms(start_point, 2000);
        await confirm_policy_status('轮灌阀门2', '异常')
        await trigger_valve_reset('轮灌阀门2');
        await confirm_policy_status('轮灌阀门2', '关阀')
        await confirm_valve_status('轮灌阀门2', false);
    });
});

async function reset_statistics() {
    await cli.run_cmd('statistic');
    await cli.run_cmd('update item 农场1总水流量 0');
    await cli.run_cmd('update item 农场1总施肥量 0');
    await cli.run_cmd('update item 轮灌组1累计供水量 0');
    await cli.run_cmd('update item 轮灌组2累计供水量 0');
    await cli.run_cmd('update item 轮灌组1累计施肥量 0');
    await cli.run_cmd('update item 轮灌组2累计施肥量 0');
    await cli.run_cmd('return');
}

async function prepare_water_policy_config() {
    let prepare = `
  device
    add device '农场1-主泵' 'virtualDevice' 'vd.log' '1' '2' '农场1'
    add device '农场1-主管道流量计' 'virtualDevice' 'vd.log' '1' '2' '农场1'
    add device '农场1-主管道压力计' 'virtualDevice' 'vd.log' '1' '2' '农场1'
  return
    `;
    await prepare_resource_config();
    for (let line of prepare.trim().split('\n').filter(l => l.trim().length > 0)) {
        await cli.run_cmd(line.trim());
    }
    await cli.run_cmd('config');
    await cli.run_cmd(`init water policy '农场1' 10 100 5 50 2 100 2 1`);
    await cli.run_cmd('return');
    await reset_statistics();
}

async function trigger_water_policy(is_open) {
    await cli.run_cmd('policy');
    await cli.run_cmd(`runtime assignment 农场1-供水 false '需要启动' '${is_open ? 'true' : 'false'}'`);
    await wait_ms(60);
    await cli.run_cmd('return');
}
async function reset_water_policy() {
    await cli.run_cmd('policy');
    await cli.run_cmd(`runtime assignment 农场1-供水 false '需要重置' 'true'`);
    await wait_ms(60);
    await cli.run_cmd('return');
}
async function get_statistics(item_name) {
    let ret = [];
    await cli.run_cmd('statistic');
    let resp = await cli.run_cmd('list item history ' + item_name);
    let lines = resp.split('\n').filter(l => l.trim().length > 0);
    await cli.run_cmd('return');
    for (let line of lines) {
        ret.push(parseFloat(line.split('-').pop()));
    }
    return ret;
}

async function sim_water_policy_run(is_open) {
    if (is_open) {
        await trigger_water_policy(true);
        await mock_readout('农场1-主管道流量计', 50);
        await mock_readout('农场1-主管道压力计', 25);
    }
    else {
        await trigger_water_policy(false);
        await mock_readout('农场1-主管道流量计', 1);
        await mock_readout('农场1-主管道压力计', 1);
    }
}

describe('供水策略快速配置和验证', () => {
    beforeEach(async () => {
        await cli.run_cmd('clear');
        await prepare_water_policy_config();
        await begin_policy_run();
    });
    afterEach(async () => {
        await cli.run_cmd('clear');
    })
    test('供水策略正常转两轮', async () => {
        await mock_total_readout('农场1-主管道流量计', 80);
        await sim_water_policy_run(true);
        let start_point = Date.now();
        await wait_spend_ms(start_point, 2000);
        await mock_total_readout('农场1-主管道流量计', 90);
        await confirm_valve_status('农场1-主泵', true);
        await sim_water_policy_run(false);
        await confirm_valve_status('农场1-主泵', false);
        start_point = Date.now();
        await wait_spend_ms(start_point, 2000);
        await sim_water_policy_run(true);
        await mock_total_readout('农场1-主管道流量计', 110);
        await confirm_valve_status('农场1-主泵', true);
        await sim_water_policy_run(false);
        await confirm_valve_status('农场1-主泵', false);
        let statistics = await get_statistics('农场1总水流量');
        expect(statistics.length).toBeGreaterThanOrEqual(1);
        expect(statistics[0]).toEqual(30);
        expect(statistics[1]).toEqual(10);
    });
    test('工作时压力和流量异常告警', async () => {
        await trigger_water_policy(true);
        let start_point = Date.now();
        await mock_readout('农场1-主管道流量计', 50);
        await mock_readout('农场1-主管道压力计', 4.2);
        await wait_spend_ms(start_point, 2050);
        await confirm_valve_status('农场1-主泵', true);
        await confirm_warning(`压力异常:4.2`)
        await mock_readout('农场1-主管道压力计', 25);
        await mock_readout('农场1-主管道流量计', 101);
        await wait_spend_ms(start_point, 4100);
        await confirm_valve_status('农场1-主泵', true);
        await confirm_warning(`流量异常:101`)
        await mock_readout('农场1-主管道流量计', 20);
        await mock_readout('农场1-主管道压力计', 52);
        await wait_spend_ms(start_point, 6150);
        await confirm_valve_status('农场1-主泵', true);
        await confirm_warning(`压力异常:52`)
    });
    test('工作时压力变化很多', async () => {
        await trigger_water_policy(true);
        let start_point = Date.now();
        await mock_readout('农场1-主管道流量计', 50);
        await mock_readout('农场1-主管道压力计', 1.2);
        await wait_spend_ms(start_point, 500);
        await confirm_valve_status('农场1-主泵', true);
        await wait_spend_ms(start_point, 1000);
        await confirm_valve_status('农场1-主泵', false);
        await confirm_policy_status('农场1-供水', '异常停机');
        await reset_water_policy();
        await confirm_policy_status('农场1-供水', '空闲');
        await confirm_valve_status('农场1-主泵', false);
        await trigger_water_policy(true);
        start_point = Date.now();
        await mock_readout('农场1-主管道压力计', 112);
        await wait_spend_ms(start_point, 1000);
        await confirm_policy_status('农场1-供水', '异常停机');
    });
});
async function prepare_fert_policy_config() {
    let prepare = `
  device
    add device '农场1-施肥泵' 'virtualDevice' 'vd.log' '1' '2' '农场1'
    add device '农场1-施肥流量计' 'virtualDevice' 'vd.log' '1' '2' '农场1'
    add device '农场1-施肥液位计' 'virtualDevice' 'vd.log' '1' '2' '农场1'
  return
    `;
    await prepare_resource_config();
    for (let line of prepare.trim().split('\n').filter(l => l.trim().length > 0)) {
        await cli.run_cmd(line.trim());
    }
    await cli.run_cmd('config');
    await cli.run_cmd(`init fert policy '农场1' 20 5 1 30 10 1`);
    await cli.run_cmd('return');
    await reset_statistics();
}
async function trigger_fert_policy(is_open) {
    await cli.run_cmd('policy');
    await cli.run_cmd(`runtime assignment 农场1-施肥 false '需要启动' '${is_open ? 'true' : 'false'}'`);
    await wait_ms(60);
    await cli.run_cmd('return');
}
async function reset_fert_policy() {
    await cli.run_cmd('policy');
    await cli.run_cmd(`runtime assignment 农场1-施肥 false '需要重置' 'true'`);
    await wait_ms(60);
    await cli.run_cmd('return');
}
describe('施肥策略快速配置和验证', () => {
    beforeEach(async () => {
        await cli.run_cmd('clear');
        await prepare_fert_policy_config();
        await begin_policy_run();
    });
    afterEach(async () => {
        await cli.run_cmd('clear');
    });
    test('施肥策略正常转两轮', async () => {
        await trigger_fert_policy(true);
        let start_point = Date.now();
        await mock_readout('农场1-施肥流量计', 24);
        await mock_readout('农场1-施肥液位计', 50);
        await wait_spend_ms(start_point, 1010);
        await confirm_valve_status('农场1-施肥泵', true);
        await trigger_fert_policy(false);
        start_point = Date.now();
        await confirm_valve_status('农场1-施肥泵', false);
        await mock_readout('农场1-施肥流量计', 1);
        await wait_spend_ms(start_point, 1010);
        await trigger_fert_policy(true);
        start_point = Date.now();
        await mock_readout('农场1-施肥流量计', 18);
        await confirm_valve_status('农场1-施肥泵', true);
        await wait_spend_ms(start_point, 1010);
        await trigger_fert_policy(false);
        await confirm_valve_status('农场1-施肥泵', false);
        let statistics = await get_statistics('农场1总施肥量');
        expect(statistics.length).toBeGreaterThanOrEqual(2);
        expect(statistics[0]).toBeCloseTo(0.7, 1);
        expect(statistics[1]).toBeCloseTo(0.4, 1);
    });
    test('施肥时液位和流量告警', async () => {
        await trigger_fert_policy(true);
        let start_point = Date.now();
        await mock_readout('农场1-施肥流量计', 20);
        await mock_readout('农场1-施肥液位计', 20);
        await wait_spend_ms(start_point, 1010);
        await confirm_valve_status('农场1-施肥泵', true);
        await confirm_warning('施肥液位异常:20');
        await mock_readout('农场1-施肥液位计', 40);
        await mock_readout('农场1-施肥流量计', 26);
        start_point = Date.now();
        await wait_spend_ms(start_point, 1010);
        await confirm_valve_status('农场1-施肥泵', true);
        await confirm_warning('施肥流量异常:26');
        await mock_readout('农场1-施肥流量计', 14);
        start_point = Date.now();
        await wait_spend_ms(start_point, 1010);
        await confirm_valve_status('农场1-施肥泵', true);
        await confirm_warning('施肥流量异常:14');
    });
    test('施肥时液位变化过大', async () => {
        await trigger_fert_policy(true);
        let start_point = Date.now();
        await mock_readout('农场1-施肥流量计', 20);
        await mock_readout('农场1-施肥液位计', 9);
        await wait_spend_ms(start_point, 500);
        await confirm_valve_status('农场1-施肥泵', true);
        await wait_spend_ms(start_point, 1000);
        await confirm_valve_status('农场1-施肥泵', false);
        await confirm_policy_status('农场1-施肥', '异常停机');
        await reset_fert_policy();
        await confirm_policy_status('农场1-施肥', '空闲');
        await confirm_valve_status('农场1-施肥泵', false);
        await trigger_fert_policy(true);
        start_point = Date.now();
        await mock_readout('农场1-施肥液位计', 31);
        await wait_spend_ms(start_point, 1000);
        await confirm_valve_status('农场1-施肥泵', true);
    });
});

async function prepare_group_policy_config() {
    await prepare_resource_config();
    await prepare_fert_policy_config();
    await prepare_water_group_valve_config();
    await prepare_water_policy_config();
    await prepare_global_policy_config();
    await cli.run_cmd('config');
    await cli.run_cmd(`add group policy 轮灌组1 农场1 0.07 0.02 定时 0.03 20 20 轮灌阀门1 轮灌阀门2`);
    await cli.run_cmd(`add group policy 轮灌组2 农场1 0.07 0.02 定量 0 20 1 轮灌阀门3`);
    await cli.run_cmd('return');
    await reset_statistics();
}

async function trigger_group_policy(policy_name, is_open) {
    await cli.run_cmd('policy');
    await cli.run_cmd(`runtime assignment ${policy_name} false '需要启动' '${is_open ? 'true' : 'false'}'`);
    await wait_ms(60);
    await cli.run_cmd('return');
}

async function group_run_once(begin_total, end_total) {
    await mock_total_readout('农场1-主管道流量计', begin_total);
    await trigger_group_policy('轮灌组1', true);
    let start_point = Date.now();
    await mock_readout('轮灌阀门1', 5);
    await mock_readout('轮灌阀门2', 5);
    await mock_readout('轮灌阀门3', 2);
    await wait_spend_ms(start_point, 60);
    await confirm_policy_status('轮灌组1', '肥前');
    await confirm_valve_status('轮灌阀门1', true);
    await confirm_valve_status('轮灌阀门2', true);
    await confirm_valve_status('轮灌阀门3', false);
    await confirm_valve_status('农场1-施肥泵', false);
    await wait_spend_ms(start_point, 1560);
    start_point = Date.now();
    await confirm_policy_status('轮灌组1', '施肥');
    await confirm_valve_status('农场1-施肥泵', true);
    await confirm_valve_status('轮灌阀门1', true);
    await confirm_valve_status('轮灌阀门2', true);
    await wait_spend_ms(start_point, 1820);
    start_point = Date.now();
    await confirm_policy_status('轮灌组1', '肥后');
    await confirm_valve_status('农场1-施肥泵', false);
    await confirm_valve_status('轮灌阀门1', true);
    await confirm_valve_status('轮灌阀门2', true);
    await mock_total_readout('农场1-主管道流量计', end_total);
    await wait_spend_ms(start_point, 1560);
    await confirm_policy_status('轮灌组1', '收尾');
    await confirm_valve_status('农场1-施肥泵', false);
    await confirm_valve_status('轮灌阀门1', true);
    await confirm_valve_status('轮灌阀门2', true);
    await trigger_group_policy('轮灌组1', false);
    await confirm_policy_status('轮灌组1', '空闲');
    await confirm_valve_status('农场1-施肥泵', false);
    await confirm_valve_status('轮灌阀门1', false);
    await confirm_valve_status('轮灌阀门2', false);
    await mock_readout('轮灌阀门1', 2);
    await mock_readout('轮灌阀门2', 2);
    await mock_readout('轮灌阀门3', 2);
    await trigger_group_policy('轮灌组2', true);
    start_point = Date.now();
    await mock_readout('轮灌阀门1', 2);
    await mock_readout('轮灌阀门2', 2);
    await mock_readout('轮灌阀门3', 5);
    await confirm_policy_status('轮灌组2', '肥前');
    await confirm_valve_status('轮灌阀门1', false);
    await confirm_valve_status('轮灌阀门2', false);
    await confirm_valve_status('轮灌阀门3', true);
    await confirm_valve_status('农场1-施肥泵', false);
    await wait_spend_ms(start_point, 1560);
    await confirm_policy_status('轮灌组2', '施肥');
    await confirm_valve_status('农场1-施肥泵', true);
    await confirm_valve_status('轮灌阀门3', true);
    await wait_spend_ms(start_point, 3250);
    start_point = Date.now();
    await confirm_policy_status('轮灌组2', '肥后');
    await confirm_valve_status('农场1-施肥泵', false);
    await confirm_valve_status('轮灌阀门3', true);
    await wait_spend_ms(start_point, 1560);
    await confirm_policy_status('轮灌组2', '收尾');
    await confirm_valve_status('农场1-施肥泵', false);
    await confirm_valve_status('轮灌阀门3', true);
    await trigger_group_policy('轮灌组2', false);
    await confirm_policy_status('轮灌组2', '空闲');
    await confirm_valve_status('农场1-施肥泵', false);
    await confirm_valve_status('轮灌阀门3', false);
    await mock_readout('轮灌阀门1', 2);
    await mock_readout('轮灌阀门2', 2);
    await mock_readout('轮灌阀门3', 2);
}

async function prepare_global_policy_config() {
    await prepare_resource_config();
    await cli.run_cmd('config');
    await cli.run_cmd('init global policy 4 农场1');
    await cli.run_cmd('return');
    await reset_statistics();
}

async function trigger_global_policy(is_open) {
    await cli.run_cmd('policy');
    await cli.run_cmd(`runtime assignment 农场1-总策略 false '需要启动' '${is_open ? 'true' : 'false'}'`);
    await wait_ms(60);
    await cli.run_cmd('return');
}
async function reset_global_policy(is_open) {
    await cli.run_cmd('policy');
    await cli.run_cmd(`runtime assignment 农场1-总策略 false '需要重置' '${is_open ? 'true' : 'false'}'`);
    await wait_ms(60);
    await cli.run_cmd('return');
}

describe('总策略快速配置和验证', () => {
    beforeEach(async () => {
        await cli.run_cmd('clear');
        await prepare_group_policy_config();
        await mock_readout('农场1-主管道流量计', 50);
        await mock_readout('农场1-主管道压力计', 25);
        await mock_readout('农场1-施肥流量计', 666.66);
        await mock_readout('农场1-施肥液位计', 50);
        await begin_policy_run();
    });
    test('手动触发总策略', async () => {
        await trigger_global_policy(true);
        let start_point = Date.now();
        await mock_readout('轮灌阀门1', 5);
        await mock_readout('轮灌阀门2', 5);
        await mock_readout('轮灌阀门3', 2);
        await confirm_policy_status('农场1-总策略', '工作');
        await confirm_valve_status('轮灌阀门1', true);
        await confirm_valve_status('轮灌阀门2', true);
        await confirm_valve_status('轮灌阀门3', false);
        await wait_spend_ms(start_point, 4650);
        await confirm_policy_status('农场1-总策略', '工作');
        await confirm_policy_status('轮灌组1', '空闲');
        start_point = Date.now();
        await confirm_valve_status('轮灌阀门1', false);
        await confirm_valve_status('轮灌阀门2', false);
        await confirm_valve_status('轮灌阀门3', true);
        await mock_readout('轮灌阀门1', 2);
        await mock_readout('轮灌阀门2', 2);
        await mock_readout('轮灌阀门3', 5);
        await wait_spend_ms(start_point, 4450);
        await confirm_valve_status('轮灌阀门1', false);
        await confirm_valve_status('轮灌阀门2', false);
        await confirm_valve_status('轮灌阀门3', false);
    });
    test('总策略过程中有跳过', async () => {
        await trigger_global_policy(true);
        await wait_ms(100); // 等待策略状态更新
        let start_point = Date.now();
        await mock_readout('轮灌阀门1', 5);
        await mock_readout('轮灌阀门2', 5);
        await mock_readout('轮灌阀门3', 2);
        await wait_ms(100); // 等待状态更新
        await confirm_policy_status('农场1-总策略', '工作');
        await confirm_valve_status('轮灌阀门1', true);
        await confirm_valve_status('轮灌阀门2', true);
        await confirm_valve_status('轮灌阀门3', false);
        await wait_spend_ms(start_point, 1650);
        await mock_readout('轮灌阀门2', 2);
        await wait_spend_ms(start_point, 3750);
        await mock_readout('轮灌阀门3', 5);
        await confirm_policy_status('农场1-总策略', '工作');
        await confirm_policy_status('轮灌组1', '空闲');
        start_point = Date.now();
        await confirm_valve_status('轮灌阀门1', false);
        await confirm_valve_status('轮灌阀门3', true);
        await mock_readout('轮灌阀门1', 2);
        await wait_spend_ms(start_point, 4250);
        await confirm_policy_status('农场1-总策略', '空闲');
        await confirm_valve_status('轮灌阀门1', false);
        await confirm_valve_status('轮灌阀门3', false);
    });
    afterEach(async () => {
        await cli.run_cmd('clear');
    });
});

describe('轮灌组策略快速配置和验证', () => {
    beforeEach(async () => {
        await cli.run_cmd('clear');
        await prepare_group_policy_config();
        await cli.run_cmd('save sample.txt');
        await begin_policy_run();
        await sim_water_policy_run(true);
        await mock_readout('农场1-施肥流量计', 666.66);
        await mock_readout('农场1-施肥液位计', 50);
    });
    afterEach(async () => {
        await cli.run_cmd('clear');
    });
    test('轮灌组策略正常转两轮', async () => {
        await group_run_once(80, 110);
        await group_run_once(120, 130);
        let statistics = await get_statistics('轮灌组1累计供水量');
        expect(statistics.length).toBeGreaterThanOrEqual(2);
        expect(statistics[0]).toBe(40);
        expect(statistics[1]).toBe(30);
    });
    test('轮灌组策略被跳过', async () => {
        await trigger_group_policy('轮灌组2', true);
        let start_point = Date.now();
        await mock_readout('轮灌阀门1', 2);
        await mock_readout('轮灌阀门2', 2);
        await mock_readout('轮灌阀门3', 5);
        await wait_spend_ms(start_point, 1560);
        await confirm_policy_status('轮灌组2', '施肥');
        await confirm_valve_status('农场1-施肥泵', true);
        await confirm_valve_status('轮灌阀门3', true);
        await wait_spend_ms(start_point, 1800);
        await mock_readout('轮灌阀门3', 2);
        start_point = Date.now();
        await confirm_policy_status('轮灌组2', '施肥');
        await wait_spend_ms(start_point, 2000);
        await confirm_policy_status('轮灌组2', '收尾');
        await confirm_policy_status('轮灌阀门3', '异常');
        await confirm_valve_status('农场1-施肥泵', false);
        await trigger_group_policy('轮灌组2', false);
        await trigger_valve_reset('轮灌阀门3');
        await group_run_once(120, 130);
    });
});

async function prepare_fert_mixing_policy_config(start_interval, duration, mixing_pump_name) {
    const pump_name = mixing_pump_name || '农场1-搅拌泵';
    let prepare = `
  device
    add device '${pump_name}' 'virtualDevice' 'vd.log' '1' '2' '农场1'
  return
    `;
    await prepare_resource_config();
    for (let line of prepare.trim().split('\n').filter(l => l.trim().length > 0)) {
        await cli.run_cmd(line.trim());
    }
    await cli.run_cmd('config');
    const parts = [`init fert mixing policy '农场1'`];
    if (start_interval !== undefined) parts.push(String(start_interval));
    if (duration !== undefined) parts.push(String(duration));
    if (mixing_pump_name !== undefined) parts.push(`'${mixing_pump_name}'`);
    await cli.run_cmd(parts.join(' '));
    await cli.run_cmd('return');
}

async function trigger_fert_mixing_policy(is_open) {
    await cli.run_cmd('policy');
    await cli.run_cmd(`runtime assignment 农场1-搅拌 false '需要启动' '${is_open ? 'true' : 'false'}'`);
    await wait_ms(60);
    await cli.run_cmd('return');
}

async function setup_fert_mixing_test(start_interval, duration, mixing_pump_name) {
    await cli.run_cmd('clear');
    await prepare_fert_mixing_policy_config(start_interval, duration, mixing_pump_name);
    await begin_policy_run();
}

async function confirm_mixing_state(is_active, mixing_pump_name = '农场1-搅拌泵') {
    await confirm_policy_status('农场1-搅拌', is_active ? '搅拌' : '空闲');
    await confirm_valve_status(mixing_pump_name, is_active);
}

async function change_mixing_state_and_confirm(is_start, mixing_pump_name = '农场1-搅拌泵') {
    await trigger_fert_mixing_policy(is_start);
    const start_point = Date.now();
    await wait_spend_ms(start_point, 60);
    await confirm_mixing_state(is_start, mixing_pump_name);
    return start_point;
}

describe('肥料搅拌策略快速配置和验证', () => {
    beforeEach(async () => {
        await setup_fert_mixing_test(0.033333, 0.016666);
    }, 120000); // 120秒超时
    afterEach(async () => {
        await cli.run_cmd('clear');
    }, 120000); // 120秒超时
    test('手动启动和停止搅拌', async () => {
        await wait_ms(500); // 等待策略扫描周期执行，确保策略已初始化
        await confirm_mixing_state(false);
        await change_mixing_state_and_confirm(true);
        await change_mixing_state_and_confirm(false);
    });
    test('搅拌持续时间自动停止', async () => {
        const start_point = await change_mixing_state_and_confirm(true);
        await wait_spend_ms(start_point, 1200);
        await confirm_mixing_state(false);
    }, 120000);
    test('定时自动启动搅拌', async () => {
        await confirm_mixing_state(false);
        const start_point = Date.now();
        await wait_spend_ms(start_point, 2060);
        await confirm_mixing_state(true);
        await wait_spend_ms(start_point, 3060);
        await confirm_mixing_state(false);
    }, 120000);
    test('搅拌过程中手动停止', async () => {
        await confirm_mixing_state(false);
        const start_point = Date.now();
        await wait_spend_ms(start_point, 2060);
        await confirm_mixing_state(true);
        await trigger_fert_mixing_policy(false);
        await wait_spend_ms(start_point, 2160);
        await confirm_mixing_state(false);
    });
});