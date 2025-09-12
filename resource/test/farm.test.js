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

describe('农场管理测试', () => {
    beforeEach(async () => {
        await cli.run_cmd('resource')
        await cli.run_cmd('farm')
        // 清空所有现有农场
        let existing_farms = await cli.run_cmd('bdr');
        if (existing_farms.trim()) {
            let farm_lines = existing_farms.split('\n').filter(line => line.trim().startsWith('add farm'));
            for (let line of farm_lines) {
                let match = line.match(/add farm '([^']+)'/);
                if (match) {
                    await cli.run_cmd(`del farm ${match[1]}`);
                }
            }
        }
    })
    
    afterEach(async () => {
        await cli.run_cmd('clear')
        await cli.run_cmd('return')
        await cli.run_cmd('return')
    })

    test('增加农场', async () => {
        // 添加农场
        await cli.run_cmd("add farm '测试农场1' '北京' '这是一个测试农场'");
        await cli.run_cmd("add farm '测试农场2' '上海'");
        
        let bdr = await cli.run_cmd('bdr');
        expect(bdr).toContain("add farm '测试农场1' '北京' '这是一个测试农场'");
        expect(bdr).toContain("add farm '测试农场2' '上海' ''");
        expect(bdr.split('\n').length).toBe(2);
    })

    test('删除农场', async () => {
        // 先添加农场
        await cli.run_cmd("add farm '测试农场1' '北京' '测试信息'");
        await cli.run_cmd("add farm '测试农场2' '上海'");
        
        // 删除一个农场
        await cli.run_cmd("del farm '测试农场1'");
        
        let bdr = await cli.run_cmd('bdr');
        expect(bdr).not.toContain('测试农场1');
        expect(bdr).toContain('测试农场2');
        expect(bdr.split('\n').length).toBe(1);
    })


    test('农场列表查询', async () => {
        // 添加多个农场
        await cli.run_cmd("add farm '农场A' '北京' '信息A'");
        await cli.run_cmd("add farm '农场B' '上海' '信息B'");
        await cli.run_cmd("add farm '农场C' '广州'");
        
        let bdr = await cli.run_cmd('bdr');
        let lines = bdr.split('\n').filter(line => line.trim());
        
        expect(lines.length).toBe(3);
        expect(bdr).toContain('农场A');
        expect(bdr).toContain('农场B');
        expect(bdr).toContain('农场C');
    })

    test('分页功能', async () => {
        // 添加25个农场（超过默认分页大小20）
        for (let i = 1; i <= 25; i++) {
            await cli.run_cmd(`add farm '农场${i}' '位置${i}' '信息${i}'`);
        }
        
        let bdr = await cli.run_cmd('bdr');
        let lines = bdr.split('\n').filter(line => line.trim());
        
        // 验证所有农场都被添加了
        expect(lines.length).toBe(25);
        expect(bdr).toContain('农场1');
        expect(bdr).toContain('农场25');
    })

    test('保存和恢复', async () => {
        // 添加一些农场
        await cli.run_cmd("add farm '保存测试农场1' '北京' '测试保存'");
        await cli.run_cmd("add farm '保存测试农场2' '上海' '测试保存2'");
        
        let cur_bdr = await cli.run_cmd('bdr');
        
        // 保存配置
        await cli.save_config();
        
        // 清空配置
        await cli.clear_config();
        let clear_bdr = await cli.run_cmd('bdr');
        expect(clear_bdr).toEqual('');
        
        // 恢复配置
        await cli.restore_config();
        let restore_bdr = await cli.run_cmd('bdr');
        expect(restore_bdr).toEqual(cur_bdr);
        expect(restore_bdr).toContain('保存测试农场1');
        expect(restore_bdr).toContain('保存测试农场2');
    })
});