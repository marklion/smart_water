import test_utils from "../../public/lib/test_utils.js";
import { print_test_log, start_server, close_server } from "../../public/lib/test_utils.js";

let cli;

beforeAll(async () => {
    print_test_log('source CRUD test begin', true);
    cli = await test_utils('npm run dev_cli');
    await start_server();
    await cli.run_cmd('clear');
});

afterAll(async () => {
    await cli.run_cmd('clear');
    await cli.close();
    await close_server();
    print_test_log('source CRUD test end', true);
});

describe('数据源增删改查测试', () => {
    beforeEach(async () => {
        await cli.run_cmd('clear');
        await cli.run_cmd('policy');
    });

    afterEach(async () => {
        await cli.run_cmd('return');
        await cli.run_cmd('clear');
    });

    test('基本功能：创建数据源', async () => {
        await cli.run_cmd('policy test');
        
        let result = await cli.run_cmd('source 温度传感器1 传感器1 temperature');
        expect(result).toContain('数据源 温度传感器1 添加成功');
        
        result = await cli.run_cmd('source 湿度传感器1 传感器2 humidity');
        expect(result).toContain('数据源 湿度传感器1 添加成功');
        
        let bdr = await cli.run_cmd('bdr');
        expect(bdr).toContain('source 温度传感器1 传感器1 temperature');
        expect(bdr).toContain('source 湿度传感器1 传感器2 humidity');
    });

    test('删除数据源功能', async () => {
        await cli.run_cmd('policy test');
        
        await cli.run_cmd('source 温度传感器1 传感器1 temperature');
        await cli.run_cmd('source 湿度传感器1 传感器2 humidity');
        
        let bdr = await cli.run_cmd('bdr');
        expect(bdr).toContain('source 温度传感器1 传感器1 temperature');
        expect(bdr).toContain('source 湿度传感器1 传感器2 humidity');
        
        let result = await cli.run_cmd('undo source');
        expect(result).toContain('所有数据源已删除');
        
        bdr = await cli.run_cmd('bdr');
        expect(bdr).not.toContain('source 温度传感器1 传感器1 temperature');
        expect(bdr).not.toContain('source 湿度传感器1 传感器2 humidity');
        
        bdr = await cli.run_cmd('bdr');
        expect(bdr).not.toContain('source 温度传感器1 传感器1 temperature');
        expect(bdr).not.toContain('source 湿度传感器1 传感器2 humidity');
    });

    test('分页功能测试：创建多个数据源', async () => {
        await cli.run_cmd('policy test');
        
        for (let i = 0; i < 25; i++) {
            await cli.run_cmd(`source 传感器${i} 设备${i} 类型${i}`);
        }
        
        let bdr = await cli.run_cmd('bdr');
        expect(bdr).toContain('source 传感器0 设备0 类型0');
        expect(bdr).toContain('source 传感器24 设备24 类型24');
        
        expect(bdr).toContain('source 传感器10 设备10 类型10');
        expect(bdr).toContain('source 传感器20 设备20 类型20');
    });

    test('错误处理：删除不存在的数据源', async () => {
        await cli.run_cmd('policy test');
        
        let result = await cli.run_cmd('undo source');
        expect(result).toContain('所有数据源已删除');
    });

    test('错误处理：创建重复的数据源', async () => {
        await cli.run_cmd('policy test');
        
        await cli.run_cmd('source 温度传感器1 传感器1 temperature');
        
        let result = await cli.run_cmd('source 温度传感器1 传感器1 temperature');
        expect(result).toContain('数据源 温度传感器1 添加成功');
        
        let bdr = await cli.run_cmd('bdr');
        let count = (bdr.match(/source 温度传感器1/g) || []).length;
        expect(count).toBe(1);
    });
    //1.配置若干数据源
    //2.await cli.save_config()
    //3.await cli.save_config()
    //4.bdr一下看看配置是不是如愿清空了
    //5.await cli.restore_config()
    //6.bdr一下看看配置是不是如愿回来了

    test('配置保存和恢复测试', async () => {
        await cli.run_cmd('policy test');

        await cli.run_cmd('source 温度传感器1 传感器1 temperature');
        await cli.run_cmd('source 湿度传感器1 传感器2 humidity');
        await cli.run_cmd('source 压力传感器1 传感器3 pressure');

        let bdr = await cli.run_cmd('bdr');
        expect(bdr).toContain('source 温度传感器1 传感器1 temperature');
        expect(bdr).toContain('source 湿度传感器1 传感器2 humidity');
        expect(bdr).toContain('source 压力传感器1 传感器3 pressure');

        await cli.save_config();

        await cli.run_cmd('clear');

        bdr = await cli.run_cmd('bdr');
        expect(bdr).not.toContain('source 温度传感器1 传感器1 temperature');
        expect(bdr).not.toContain('source 湿度传感器1 传感器2 humidity');
        expect(bdr).not.toContain('source 压力传感器1 传感器3 pressure');

        await cli.restore_config();

        bdr = await cli.run_cmd('bdr');
        expect(bdr).toContain('source 温度传感器1 传感器1 temperature');
        expect(bdr).toContain('source 湿度传感器1 传感器2 humidity');
        expect(bdr).toContain('source 压力传感器1 传感器3 pressure');
    });

    test('多次保存配置测试', async () => {
        await cli.run_cmd('policy test');

        await cli.run_cmd('source 温度传感器1 传感器1 temperature');
        await cli.save_config();

        await cli.run_cmd('source 湿度传感器1 传感器2 humidity');
        await cli.save_config();

        await cli.run_cmd('clear');

        let bdr = await cli.run_cmd('bdr');
        expect(bdr).not.toContain('source 温度传感器1 传感器1 temperature');
        expect(bdr).not.toContain('source 湿度传感器1 传感器2 humidity');

        await cli.restore_config();

        bdr = await cli.run_cmd('bdr');
        expect(bdr).toContain('source 温度传感器1 传感器1 temperature');
        expect(bdr).toContain('source 湿度传感器1 传感器2 humidity');
    });

});
