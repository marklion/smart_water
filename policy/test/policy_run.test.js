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
    await cli.run_cmd('policy');
    await cli.run_cmd(`scan period '80'`)
    await cli.run_cmd('return');
    await wait_ms(400);
    while (turn > 0) {
      await check_lgz1_state('kongxian');
      await wait_ms(5100);
      await check_lgz1_state('zhengzaikaifa');
      await cli.run_cmd('device');
      await cli.run_cmd('mock readout llj 5');
      await cli.run_cmd('return');
      await wait_ms(2100);
      await check_lgz1_state('gongzuo');
      await wait_ms(6100);
      await check_lgz1_state('zhengzaiguanfa');
      await cli.run_cmd('device');
      await cli.run_cmd('mock readout llj 3');
      await cli.run_cmd('return');
      await wait_ms(2100);
      turn -= 1;
    }
  }, 40000);
});

describe('策略变量赋值测试', () => {
  const test_config = `
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
  policy 'test_policy'
    source 'll' 'llj' 'readout'
    source 'yl' 'ylb' 'readout'
    state 'state1'
      enter action 'fm' 'close'
      transformer 'next'
        rule 'false' 'state2' 'prs.variables.get("test_var") > 10'
      return
    return
    state 'state2'
      do action 'fm' 'open'
      transformer 'next'
        rule 'false' 'state1' 'prs.variables.get("test_var") < 5'
      return
    return
    init state 'state1'
  return
return
web
return
    `

  beforeEach(async () => {
    await cli.run_cmd('clear');
    for (const line of test_config.trim().split('\n')) {
      await cli.run_cmd(line.trim());
    }
  });

  afterEach(async () => {
    await cli.clear_config();
  });

  test('init assignment - 初始化变量赋值测试', async () => {
    // 测试初始化变量赋值
    await cli.run_cmd('policy');
    await cli.run_cmd('policy test_policy');

    // 添加初始化变量赋值
    let result = await cli.run_cmd('init assignment true test_var 15');
    expect(result).toContain('初始化变量赋值已设置: test_var = 15');

    // 添加另一个初始化变量赋值
    result = await cli.run_cmd('init assignment false test_string "hello world"');
    expect(result).toContain('初始化变量赋值已设置: test_string = hello world');

    // 尝试添加重复的变量名，应该失败
    try {
      result = await cli.run_cmd('init assignment true test_var 20');
      // 如果命令没有抛出异常，检查返回结果
      expect(result).toContain('已存在');
    } catch (error) {
      // 期望抛出异常
      expect(error.message).toContain('已存在');
    }

    await cli.run_cmd('return');
  }, 10000);

  test('runtime assignment - 运行时变量赋值测试', async () => {
    // 测试运行时变量赋值
    await cli.run_cmd('policy');

    // 先创建一个简单的策略
    await cli.run_cmd('policy test_policy');
    await cli.run_cmd('source ll llj readout');
    await cli.run_cmd('source yl ylb readout');
    await cli.run_cmd('state state1');
    await cli.run_cmd('return');
    await cli.run_cmd('init state state1');
    await cli.run_cmd('return');
    await cli.run_cmd('return');

    // 确保在policy模块下执行runtime assignment
    await cli.run_cmd('policy');

    // 添加运行时变量赋值（常量）
    let result = await cli.run_cmd('runtime assignment test_policy true test_var 25');
    expect(result).toContain('运行时变量赋值已设置: test_var = 25');

    // 添加运行时变量赋值（字符串）
    result = await cli.run_cmd('runtime assignment test_policy false test_string "runtime value"');
    expect(result).toContain('运行时变量赋值已设置: test_string = runtime value');

    // 测试动态表达式赋值
    result = await cli.run_cmd('runtime assignment test_policy false dynamic_var "Date.now()"');
    expect(result).toContain('运行时变量赋值已设置: dynamic_var = Date.now()');

    await cli.run_cmd('return');
  }, 10000);

  test('变量赋值验证 - 检查赋值后的变量值', async () => {
    // 先设置一些运行时变量
    await cli.run_cmd('policy');

    // 设置运行时变量
    await cli.run_cmd('runtime assignment test_policy true test_var 30');
    await cli.run_cmd('runtime assignment test_policy false test_string "verification test"');

    // 检查策略运行时状态
    let runtime_result = await cli.run_cmd('list policy test_policy');
    expect(runtime_result).toContain('变量:');
    expect(runtime_result).toContain('test_var');
    expect(runtime_result).toContain('test_string');

    // 验证变量值是否正确
    const variablesMatch = runtime_result.match(/变量:({.*})/);
    if (variablesMatch) {
      const variables = JSON.parse(variablesMatch[1]);
      expect(variables.test_var).toBe(30);
      expect(variables.test_string).toBe('verification test');
    }

    await cli.run_cmd('return');
  }, 10000);

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