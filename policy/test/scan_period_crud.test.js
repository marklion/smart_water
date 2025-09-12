// 简化的扫描周期测试 - 直接测试模块功能，避免CLI依赖
import policyModule from '../server/policy_module.js';

describe('策略扫描周期功能测试', () => {
    test('设置和获取扫描周期', async () => {
        // 设置扫描周期
        let result = await policyModule.methods.set_scan_period.func({ period_ms: 5000 });
        expect(result.result).toBe(true);
        
        // 获取当前值
        result = await policyModule.methods.get_scan_period.func({});
        expect(result.period_ms).toBe(5000);
        
        // 停止扫描
        result = await policyModule.methods.set_scan_period.func({ period_ms: 0 });
        expect(result.result).toBe(true);
    });

    test('参数验证 - 负数应该报错', async () => {
        await expect(
            policyModule.methods.set_scan_period.func({ period_ms: -100 })
        ).rejects.toMatchObject({ err_msg: '扫描周期不能为负数' });
    });

    test('强制停止功能', async () => {
        // 设置扫描周期
        let result = await policyModule.methods.set_scan_period.func({ period_ms: 1000 });
        expect(result.result).toBe(true);
        
        // 强制停止
        result = await policyModule.methods.force_stop_scan.func({});
        expect(result.result).toBe(true);
        
        // 验证已停止
        const periodResult = await policyModule.methods.get_scan_period.func({});
        expect(periodResult.period_ms).toBe(0);
    });
});
