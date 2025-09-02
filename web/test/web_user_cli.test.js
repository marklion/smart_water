import test_utils from "../../public/lib/test_utils.js";
import {print_test_log, start_server, close_server} from "../../public/lib/test_utils.js";

let cli;

beforeAll(async () => {
    print_test_log('web user test begin', true);
    cli = await test_utils('npm run dev_cli');
    await start_server();
    await cli.run_cmd('clear');
});

afterAll(async () => {
    await cli.run_cmd('clear');
    await cli.close();
    await close_server();
    print_test_log('web user test end', true);
});

describe('Web CLI 用户管理测试', () => {
    beforeEach(async () => {
        await cli.run_cmd('web');
    });

    afterEach(async () => {
        await cli.run_cmd('undo user');
        await cli.run_cmd('return');
    });

    test('应该能创建用户', async () => {
        const result = await cli.run_cmd('user testuser testpass123');
        expect(result).toContain('用户 "testuser" 创建成功');
    });

    test('应该能删除单个用户', async () => {
        await cli.run_cmd('user testuser testpass123');
        const result = await cli.run_cmd('del user testuser');
        expect(result).toContain('用户 "testuser" 删除成功');
    });

    test('应该能使用undo命令删除所有用户', async () => {
        // 创建几个用户
        await cli.run_cmd('user user1 pass123456');
        await cli.run_cmd('user user2 pass123456');
        
        // 使用undo命令删除所有用户
        const result = await cli.run_cmd('undo user');
        expect(result).toMatch(/已删除\s+\d+\s+个用户/);
        
        // 验证用户已被删除
        const bdrResult = await cli.run_cmd('bdr');
        expect(bdrResult.trim()).toBe('');
    });

    test('密码太短应该返回错误', async () => {
        const result = await cli.run_cmd('user shortpass short');
        expect(result).toContain('密码长度不能少于6位');
    });

    test('应该能保存和恢复配置', async () => {
        // 创建一些用户
        await cli.run_cmd('user saveuser1 pass123456');
        await cli.run_cmd('user saveuser2 pass123456');
        
        // 获取当前配置
        let cur_bdr = await cli.run_cmd('bdr');
        await cli.run_cmd('return'); // 退出web模块
        await cli.save_config();
        await cli.clear_config();
        
        // 验证配置已清除 - 进入web模块检查
        await cli.run_cmd('web');
        let clear_bdr = await cli.run_cmd('bdr');
        expect(clear_bdr).toEqual('');
        await cli.run_cmd('return'); // 退出web模块
        
        // 恢复配置
        await cli.restore_config();
        
        // 进入web模块验证恢复
        await cli.run_cmd('web');
        let restore_bdr = await cli.run_cmd('bdr');
        expect(restore_bdr).toContain('user saveuser1');
        expect(restore_bdr).toContain('user saveuser2');
        await cli.run_cmd('return');
    });

    test('清理配置', async () => {
        await cli.run_cmd('clear');
    });

});
