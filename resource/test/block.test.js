import test_utils from "../../public/lib/test_utils";
import {print_test_log, start_server, close_server} from "../../public/lib/test_utils.js";
let cli;

beforeAll(async () => {
    print_test_log('block test begin', true);
    cli = await test_utils('npm run dev_cli');
    await start_server()
    await cli.run_cmd('clear');
})

afterAll(async () => {
    await cli.run_cmd('clear');
    await cli.run_cmd('save');
    await cli.close();
    await close_server();
    print_test_log('block test end', true);
})

describe('地块配置测试', () => {
    let farm_configs = [
        { name: 'test_farm1', location: 'location1', info: 'info1' },
        { name: 'test_farm2', location: 'location2', info: 'info2' }
    ];
    
    let block_configs = [
        { farm_name: 'test_farm1', name: 'block1', area: 10, info: 'block_info1' },
        { farm_name: 'test_farm1', name: 'block2', area: 20, info: 'block_info2' },
        { farm_name: 'test_farm2', name: 'block3', area: 15, info: 'block_info3' },
        { farm_name: 'test_farm2', name: 'block4', area: 25, info: 'block_info4' }
    ];

    beforeEach(async () => {
        await cli.run_cmd('resource');

        await cli.run_cmd('farm');
        for (const farm of farm_configs) {
            await cli.run_cmd(`add farm '${farm.name}' '${farm.location}' '${farm.info}'`);
        }
        await cli.run_cmd('return');

        await cli.run_cmd('block');
        for (const block of block_configs) {
            await cli.run_cmd(`add block '${block.farm_name}' '${block.name}' '${block.area}' '${block.info}'`);
        }
    })

    afterEach(async () => {
        await cli.run_cmd('clear')
        await cli.run_cmd('return')
        await cli.run_cmd('return')
    })

    test('增删地块', async () => {
        let bdr = await cli.run_cmd('bdr');
        expect(bdr.split('\n').length).toBe(4);
        expect(bdr).toContain('block1');
        expect(bdr).toContain('block2');
        expect(bdr).toContain('block3');
        expect(bdr).toContain('block4');

        await cli.run_cmd('del block test_farm1 block1');
        bdr = await cli.run_cmd('bdr');
        expect(bdr.split('\n').length).toBe(3);
        expect(bdr).not.toContain('block1');
        expect(bdr).toContain('block2');
    })

    test('地块面积属性处理', async () => {
        await cli.run_cmd('add block test_farm1 block5 30 block_info5');
        let bdr = await cli.run_cmd('bdr');
        expect(bdr).toContain('block5');
        expect(bdr).toContain('30');

        await cli.run_cmd('add block test_farm1 block6 0 block_info6');
        bdr = await cli.run_cmd('bdr');
        expect(bdr).toContain('block6');
        expect(bdr).toContain('0');
    })

    test('BDR命令正确性', async () => {
        let bdr = await cli.run_cmd('bdr');
        let lines = bdr.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
            if (line.startsWith('add block')) {
                expect(line).toContain("'test_farm");
                expect(line).toContain("'block");
                expect(line).toContain("'");
            }
        }

        const block1Line = lines.find(line => line.includes('block1'));
        expect(block1Line).toContain('10'); // 面积应该是10
        expect(block1Line).toContain('block_info1'); // 信息应该正确
    })

    test('地块信息更新', async () => {
        await cli.run_cmd('add block test_farm1 block1 15 updated_info');
        let bdr = await cli.run_cmd('bdr');
        expect(bdr).toContain('15');
        expect(bdr).toContain('updated_info');
    })


    test('保存和恢复详细验证', async () => {
        await cli.run_cmd('add block test_farm1 block7 35 block_info7');
        await cli.run_cmd('add block test_farm2 block8 40 block_info8');

        await cli.save_config();

        let saved_bdr = await cli.run_cmd('bdr');
        expect(saved_bdr).toContain('block7');
        expect(saved_bdr).toContain('block8');
        expect(saved_bdr).toContain('35');
        expect(saved_bdr).toContain('40');

        await cli.clear_config();
        let cleared_bdr = await cli.run_cmd('bdr');
        expect(cleared_bdr).toEqual('');

        await cli.restore_config();
        let restored_bdr = await cli.run_cmd('bdr');

        expect(restored_bdr).toContain('block1');
        expect(restored_bdr).toContain('block2');
        expect(restored_bdr).toContain('block3');
        expect(restored_bdr).toContain('block4');
        expect(restored_bdr).toContain('block7');
        expect(restored_bdr).toContain('block8');

        expect(restored_bdr).toContain('10');
        expect(restored_bdr).toContain('20');
        expect(restored_bdr).toContain('15');
        expect(restored_bdr).toContain('25');
        expect(restored_bdr).toContain('35');
        expect(restored_bdr).toContain('40');

        expect(restored_bdr).toContain('test_farm1');
        expect(restored_bdr).toContain('test_farm2');
    });

    test('地块列表查询', async () => {
        await cli.run_cmd('return');
        await cli.run_cmd('resource');
        await cli.run_cmd('block');
        let output = await cli.run_cmd('bdr');

        expect(output).toContain('block1');
        expect(output).toContain('block2');
        expect(output).toContain('block3');
        expect(output).toContain('block4');

        expect(output).toContain('test_farm1');
        expect(output).toContain('test_farm2');
    });
});
