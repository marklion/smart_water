import test_utils from "../../public/lib/test_utils.js";
import { print_test_log, start_server, close_server } from "../../public/lib/test_utils.js";
let cli;
beforeAll(async () => {
    print_test_log('state run test begin', true);
    cli = await test_utils('npm run dev_cli');
    await start_server();
    await cli.run_cmd('clear');
});

afterAll(async () => {
    await cli.run_cmd('clear');
    await cli.close();
    await close_server();
    print_test_log('state run test end', true);
});
describe('状态机运行测试', () => {
    test('状态进入测试', async () => {
        expect(1).toBe(1);
    })
});