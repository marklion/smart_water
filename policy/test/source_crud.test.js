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
    test('错误处理：创建重复的数据源', async () => {
        await cli.run_cmd('policy test');

        await cli.run_cmd('source 温度传感器1 传感器1 temperature');

        let result = await cli.run_cmd('source 温度传感器1 传感器1 temperature');
        expect(result).toContain('数据源 温度传感器1 添加成功');

        let bdr = await cli.run_cmd('bdr');
        let count = (bdr.match(/source '温度传感器1'/g) || []).length;
        expect(count).toBe(1);
    });
});
