import test_utils from "../../public/lib/test_utils.js";
import { print_test_log, start_server, close_server, wait_ms } from "../../public/lib/test_utils.js";

let cli;

beforeAll(async () => {
  print_test_log('quick action test begin', true);
  cli = await test_utils('npm run dev_cli');
  await start_server();
  await cli.run_cmd('clear');
});

afterAll(async () => {
  await cli.run_cmd('clear');
  await cli.close();
  await close_server();
  print_test_log('quick action test end', true);
});

describe('快速操作测试', () => {
  const adc_policy_config = `
set_sys_name 'no_name'
device
  add device 'adc_device' 'virtualDevice' 'all_device_log.log' '2' '3'
return
resource
  farm
  return
  block
  return
return
policy
  policy 'adc_policy'
    init assignment 'false' '需要启动' 'false'
    state '空闲'
      enter action 'adc_device' 'close'
      transformer 'next'
        rule 'false' '工作' 'prs.variables.get("需要启动") == true'
      return
    return
    state '工作'
      enter action 'adc_device' 'open'
      transformer 'next'
        rule 'false' '空闲' 'prs.variables.get("需要启动") == false'
      return
    return
    init state '空闲'
  return
return
web
return
  `;

  beforeEach(async () => {
    await cli.run_cmd('clear');
    for (const line of adc_policy_config.trim().split('\n')) {
      await cli.run_cmd(line.trim());
    }
  });

  afterEach(async () => {
    await cli.clear_config();
  });

  test('快速操作添加和执行', async () => {
    // 添加快速操作
    await cli.run_cmd('policy');
    await cli.run_cmd('policy adc_policy');
    await cli.run_cmd("quick action false '启动' 'prs.variables.set(\"需要启动\", true)'");
    await cli.run_cmd('return');
    await cli.run_cmd('return');
    
    // 启动策略扫描
    await cli.run_cmd('policy');
    await cli.run_cmd('scan period 100');
    await wait_ms(200);
    
    // 验证初始状态
    let runtime = await cli.run_cmd('list policy adc_policy');
    expect(runtime).toContain('当前状态:空闲');
    
    // 执行快速操作
    let result = await cli.run_cmd('do quick action adc_policy 启动');
    expect(result).toContain('快速操作 启动 已执行');
    
    // 验证状态变化
    await wait_ms(300);
    runtime = await cli.run_cmd('list policy adc_policy');
    expect(runtime).toContain('当前状态:工作');
    
    await cli.run_cmd('return');
  }, 15000);
});

