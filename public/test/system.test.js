import test_utils from "../lib/test_utils.js";
import {print_test_log,  start_server, close_server } from "../lib/test_utils.js";
import fs from 'fs';
let cli;
beforeAll(async () => {
    print_test_log('=======start system test======');
    cli = await test_utils('npm run dev_cli');
    await start_server();
})
afterAll(async () => {
    await cli.close();
    fs.unlinkSync('tmp_config.txt');
    await close_server();
    print_test_log('=======stop system test.=======');
})

test("根目录命令测试", async () => {
    let help_output = await cli.run_cmd('help');
    expect(help_output).toContain('bdr');
    expect(help_output).toContain('save');
    expect(help_output).toContain('clear');
    expect(help_output).toContain('restore');
});
test('保存恢复测试', async ()=>{
    let cur_bdr = await cli.run_cmd('bdr');
    await cli.run_cmd('set_sys_name test_sys');
    let new_bdr = await cli.run_cmd('bdr');
    expect(new_bdr).not.toEqual(cur_bdr);
    cur_bdr = new_bdr;
    await cli.run_cmd('save tmp_config.txt');
    await cli.run_cmd('restore tmp_config.txt');
    new_bdr = await cli.run_cmd('bdr');

    expect(new_bdr).toEqual(cur_bdr);
})