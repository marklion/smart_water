import test_utils, { wait_ms } from "../../public/lib/test_utils.js";
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

async function prepare_water_group_valve_config() {
    let prepare = `
        resource
  farm
    add farm '农场1' '呼市' '1' '2' '玉米'
  return
  block
    add block '农场1' '地块1' '20' ''
    add block '农场1' '地块2' '20' ''
  return
return
        `;
    let lines = prepare.trim().split('\n').filter(l => l.trim().length > 0);
    for (let line of lines) {
        await cli.run_cmd(line.trim());
    }
    await cli.run_cmd('config');
    await cli.run_cmd(`add water group valve '农场1' '地块1' '轮灌阀门1' 'virtualDevice' 'vd.log' 2 3 3 3 2`);
    await cli.run_cmd(`add water group valve '农场1' '地块1' '轮灌阀门2' 'virtualDevice' 'vd.log' 2 3 3 3 2`);
    await cli.run_cmd(`add water group valve '农场1' '地块2' '轮灌阀门3' 'virtualDevice' 'vd.log' 2 3 3 3 2`);
    await cli.run_cmd('return');
}

async function begin_policy_run() {
    await cli.run_cmd('policy');
    await cli.run_cmd('scan period 20');
    await wait_ms(30);
    await cli.run_cmd('return');
}

async function trigger_valve_open(wgv_name) {
    await cli.run_cmd('policy');
    await cli.run_cmd(`runtime assignment ${wgv_name} false '需要启动' 'true'`);
    await wait_ms(30);
    await cli.run_cmd('return');
}
async function trigger_valve_reset(wgv_name) {
    await cli.run_cmd('policy');
    await cli.run_cmd(`runtime assignment ${wgv_name} false '需要重置' 'true'`);
    await wait_ms(30);
    await cli.run_cmd('return');
}

async function mock_pressure(wgv_name, pressure) {
    await cli.run_cmd('device');
    await cli.run_cmd(`mock readout ${wgv_name} ${pressure}`);
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
    expect(status_line_index).not.toBe(-1);
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
    test('添加轮灌阀门并验证策略可以开启', async () => {
        await trigger_valve_open('轮灌阀门1');
        await trigger_valve_open('轮灌阀门3');
        await confirm_valve_status('轮灌阀门1', true);
        await confirm_valve_status('轮灌阀门3', true);
        await confirm_valve_status('轮灌阀门2', false);
    });
    test('关阀状态下压力太大', async () => {
        await mock_pressure('轮灌阀门1', 5);
        await wait_ms(1000);
        await confirm_policy_status('轮灌阀门1', '关阀')
        await wait_ms(1000);
        await confirm_policy_status('轮灌阀门1', '异常')
        await confirm_warning('轮灌阀门1压力异常')
    });
    test('开阀状态下压力太小,手动恢复', async () => {
        await trigger_valve_open('轮灌阀门2');
        await mock_pressure('轮灌阀门2', 2);
        await wait_ms(1000);
        await confirm_policy_status('轮灌阀门2', '开阀')
        await wait_ms(1000);
        await confirm_policy_status('轮灌阀门2', '异常')
        await trigger_valve_reset('轮灌阀门2');
        await confirm_policy_status('轮灌阀门2', '关阀')
        await confirm_valve_status('轮灌阀门2', false);
    });
});