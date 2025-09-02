import create_cli from '../../public/lib/test_utils.js';

describe('Web CLI 用户管理测试', () => {
    let cli;

    beforeAll(async () => {
        cli = await create_cli('node public/cli/index.js');
    });

    afterAll(async () => {
        await cli.close();
    });

    test('应该能进入web模块并创建用户', async () => {
        await cli.run_cmd('web', 'sw_cli> web> ');
        const result = await cli.run_cmd('user testuser testpass123', 'sw_cli> web> ');
        expect(result).toContain('用户 "testuser" 创建成功');
    });

    test('应该能删除单个用户', async () => {
        const result = await cli.run_cmd('del user testuser', 'sw_cli> web> ');
        expect(result).toContain('用户 "testuser" 删除成功');
    });

    test('应该能使用undo命令删除所有用户', async () => {
        // 创建几个用户
        await cli.run_cmd('user user1 pass123456', 'sw_cli> web> ');
        await cli.run_cmd('user user2 pass123456', 'sw_cli> web> ');
        
        // 使用undo命令删除所有用户
        const result = await cli.run_cmd('undo user', 'sw_cli> web> ');
        expect(result).toMatch(/已删除\s+\d+\s+个用户/);
        
        // 验证用户已被删除
        const bdrResult = await cli.run_cmd('bdr', 'sw_cli> web> ');
        expect(bdrResult.trim()).toBe('');
    });

    test('密码太短应该返回错误', async () => {
        const result = await cli.run_cmd('user shortpass short', 'sw_cli> web> ');
        expect(result).toContain('密码长度不能少于6位');
    });

    test('应该能保存和恢复配置', async () => {
        // 创建一些用户
        await cli.run_cmd('user saveuser1 pass123456', 'sw_cli> web> ');
        await cli.run_cmd('user saveuser2 pass123456', 'sw_cli> web> ');
        await cli.run_cmd('return', 'sw_cli> ');
        
        // 保存配置
        await cli.run_cmd('save test_web_config.txt', 'sw_cli> ');
        
        // 清除配置
        await cli.run_cmd('clear', 'sw_cli> ');
        
        // 验证配置已清除
        await cli.run_cmd('web', 'sw_cli> web> ');
        const emptyResult = await cli.run_cmd('bdr', 'sw_cli> web> ');
        expect(emptyResult.trim()).toBe('');
        await cli.run_cmd('return', 'sw_cli> ');
        
        // 恢复配置
        await cli.run_cmd('restore test_web_config.txt', 'sw_cli> ');
        
        // 验证配置已恢复
        await cli.run_cmd('web', 'sw_cli> web> ');
        const restoredResult = await cli.run_cmd('bdr', 'sw_cli> web> ');
        expect(restoredResult).toContain('user saveuser1');
        expect(restoredResult).toContain('user saveuser2');
        await cli.run_cmd('return', 'sw_cli> ');
    });

    test('清理配置', async () => {
        await cli.run_cmd('clear', 'sw_cli> ');
    });
});
