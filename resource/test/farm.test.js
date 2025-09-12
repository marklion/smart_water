import test_utils from "../../public/lib/test_utils";
import {print_test_log, start_server, close_server} from "../../public/lib/test_utils.js";
let cli;
beforeAll(async () => {
    print_test_log('farm test begin', true);
    cli = await test_utils('npm run dev_cli');
    await start_server()
    await cli.run_cmd('clear');
})
afterAll(async () => {
    await cli.run_cmd('clear');
    await cli.run_cmd('save');
    await cli.close();
    await close_server();
    print_test_log('farm test end', true);
})

describe('配置测试', () => {
    let farm_configs = [];
    for (let i = 0; i < 22; i++) {
        farm_configs.push({
            name: `farm${i}`,
            location: `location${i}`,
            info: (i % 2) ? `info${i}` : undefined
        })
    }
    beforeEach(async () => {
        await cli.run_cmd('resource')
        await cli.run_cmd('farm')
        for (const farm of farm_configs) {
            await cli.run_cmd(`add farm '${farm.name}' '${farm.location}' ${farm.info ? `'${farm.info}'` : ''}`, 'resource> farm> ');
        }
    })
    afterEach(async () => {
        await cli.run_cmd('clear', 'resource> farm> ')
        await cli.run_cmd('return')
        await cli.run_cmd('return')
    })

    test('增删农场', async () => {
        let bdr = await cli.run_cmd('bdr', 'resource> farm> ');
        expect(bdr.split('\n').length).toBe(22);
        expect(bdr).toContain('farm13');
        expect(bdr).not.toContain('info18');
        await cli.run_cmd('del farm farm10', 'resource> farm> ');
        bdr = await cli.run_cmd('bdr', 'resource> farm> ');
        expect(bdr.split('\n').length).toBe(21);
        expect(bdr).not.toContain('info10');
    })
    test('保存和恢复', async () => {
        let cur_bdr = await cli.run_cmd('bdr', 'resource> farm> ');
        await cli.save_config();
        await cli.clear_config();
        let clear_bdr = await cli.run_cmd('bdr', 'resource> farm> ');
        expect(clear_bdr).toEqual('');
        await cli.restore_config();
        let restore_bdr = await cli.run_cmd('bdr', 'resource> farm> ');
        expect(restore_bdr).toEqual(cur_bdr);
    });
});
