import test_utils from "../../public/lib/test_utils.js";
import { print_test_log, start_server, close_server, wait_ms } from "../../public/lib/test_utils.js";

let cli;

beforeAll(async () => {
  print_test_log('policy run', true);
  cli = await test_utils('npm run dev_cli');
  await start_server();
  await cli.run_cmd('clear');
});

afterAll(async () => {
  await cli.run_cmd('clear');
  await cli.close();
  await close_server();
  print_test_log('policy run end', true);
});
describe('简单多状态策略运行', () => {
  const simple_config = `
set_sys_name 'no_name'
device
  add device 'fm' 'virtualDevice' 'fm.log' '2' '3'
  add device 'ylb' 'virtualDevice' 'ylb.log' '2' '3'
  add device 'llj' 'virtualDevice' 'llj.log' '2' '3'
return
resource
  farm
  return
  block
  return
return
policy
  scan period '800'
  policy 'lgz1'
    source 'll' 'llj' 'readout'
    source 'yl' 'ylb' 'readout'
    state 'kongxian'
      enter action 'fm' 'close'
      enter assignment 'false' 'req_gap' '5000'
      enter assignment 'false' 'wait_start' 'Date.now()'
      enter assignment 'false' 'manual_reset' 'false'
      enter assignment 'false' 'req_water' '6000'
      transformer 'timeup'
        rule 'false' 'zhengzaikaifa' '(Date.now() - prs.variables.get("wait_start")) > prs.variables.get("req_gap")'
      return
    return
    state 'zhengzaikaifa'
      do action 'fm' 'open'
      enter assignment 'false' 'delay_start' 'Date.now()'
      transformer 'next'
        rule 'false' 'error' 'Date.now() - prs.variables.get("delay_start") > 2000 && (await prs.getSource("ll")) < 4'
        rule 'false' 'gongzuo' 'Date.now() - prs.variables.get("delay_start") > 2000 && (await prs.getSource("ll")) > 4'
      return
    return
    state 'zhengzaiguanfa'
      do action 'fm' 'close'
      enter assignment 'false' 'delay_start' 'Date.now()'
      transformer 'next'
        rule 'false' 'error' 'Date.now() - prs.variables.get("delay_start") > 2000 && (await prs.getSource("ll")) > 4'
        rule 'false' 'kongxian' 'Date.now() - prs.variables.get("delay_start") > 2000 && (await prs.getSource("ll")) < 4'
      return
    return
    state 'gongzuo'
      enter assignment 'false' 'water_start' 'Date.now()'
      transformer 'end'
        rule 'false' 'zhengzaiguanfa' 'Date.now() - prs.variables.get("water_start") > prs.variables.get("req_water")'
      return
    return
    state 'error'
      do action 'fm' 'close'
      transformer 'revert'
        rule 'false' 'kongxian' 'prs.variables.get("manual_reset") == true'
      return
    return
    init state 'kongxian'
  return
return
web
return
    `
  beforeEach(async () => {
    await cli.run_cmd('clear');
    for (const line of simple_config.trim().split('\n')) {
      await cli.run_cmd(line.trim());
    }
  });
  afterEach(async () => {
    await cli.clear_config();
  });
  async function check_lgz1_state(expected_state) {
    await cli.run_cmd('policy');
    let cur_state = await cli.run_cmd('list policy lgz1')
    expect(cur_state).toContain(`当前状态:${expected_state}`);
    await cli.run_cmd('return');
  }
  test('正常运行两圈', async () => {
    let turn = 2;
    while (turn > 0) {
      await check_lgz1_state('kongxian');
      await wait_ms(6000);
      await check_lgz1_state('zhengzaikaifa');
      await cli.run_cmd('device');
      await cli.run_cmd('mock readout llj 5');
      await cli.run_cmd('return');
      await wait_ms(1500);
      await check_lgz1_state('gongzuo');
      await wait_ms(6500);
      await check_lgz1_state('zhengzaiguanfa');
      await cli.run_cmd('device');
      await cli.run_cmd('mock readout llj 3');
      await cli.run_cmd('return');
      await wait_ms(1500);
      turn -= 1;
    }
  }, 40000);
});

describe('多策略运行', () => {
  const config = `
set_sys_name 'no_name'
device
return
resource
  farm
  return
  block
  return
return
policy
  policy 'p2'
    state 'manual'
      do crossAssignment 'false' 'p1' 'should_move' 'true'
    return
    init state 'manual'
  return
  policy 'p1'
    state 'empty'
      enter assignment 'false' 'should_move' 'false'
      transformer 'next'
        rule 'false' 'work' 'prs.variables.get("should_move") == true'
      return
    return
    state 'work'
      enter assignment 'false' 'should_move' 'false'
      transformer 'next'
        rule 'false' 'empty' 'prs.variables.get("should_move") == true'
      return
    return
    init state 'empty'
  return
  policy 'lgz1'
    state 'empty'
      enter assignment 'false' 'area' '40'
      enter assignment 'false' 'method' '"apple"'
      enter assignment 'false' 'fr' '12'
      enter assignment 'false' 'tw' '11'
      enter assignment 'false' 'tf' '34'
      enter assignment 'false' 'ml' '90'
      enter assignment 'false' 'wv' '"wfm1"'
      enter assignment 'false' 'fv' '"ffm1"'
    return
    init state 'empty'
    watering group matrix 'area' 'area'
    watering group matrix 'method' 'method'
    watering group matrix 'fert_rate' 'fr'
    watering group matrix 'total_water' 'tw'
    watering group matrix 'total_fert' 'tf'
    watering group matrix 'minute_left' 'ml'
    watering group matrix 'fert_valve' 'fv'
    watering group matrix 'water_valve' 'wv'
  return
return
web
return
    `
  beforeEach(async () => {
    await cli.run_cmd('clear');
    for (const line of config.trim().split('\n')) {
      await cli.run_cmd(line.trim());
    }
    await cli.run_cmd('policy');
    await cli.run_cmd('scan period 450');
  });
  afterEach(async () => {
    await cli.run_cmd('return');
    await cli.clear_config();
  });
  async function check_p1_state(expected_state) {
    let cur_state = await cli.run_cmd('list policy p1')
    expect(cur_state).toContain(`当前状态:${expected_state}`);
  }
  test('跨策略变量赋值', async () => {
    await wait_ms(480);
    await check_p1_state('empty');
    await wait_ms(500);
    await check_p1_state('work');
    await wait_ms(500);
    await check_p1_state('empty');
  })
  test('轮灌组变量获取', async () => {
    await wait_ms(1080);
    let resp = await cli.run_cmd('list watering groups');
    expect(resp).toContain('lgz1|40|apple|12|11|34|90|wfm1|ffm1|empty');
  });
})