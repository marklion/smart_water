import axios from 'axios';
import { start_server, close_server } from '../../public/lib/test_utils.js';

// 配置
const CONFIG = {
    SERVER_URL: 'http://localhost:47147',
    API_BASE: '/api/v1',
    TEST_USER: {
        username: process.env.TEST_USERNAME || 'testuser',
        password: process.env.TEST_PASSWORD || 'testpass123456'
    }
};

describe('Web Token 验证测试', () => {
    let authToken = null;

    beforeAll(async () => {
        await start_server();
        // 等待服务器启动
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
            await callAPI('/auth/del_user', { username: CONFIG.TEST_USER.username }, null, true);
        } catch (error) {
            // 用户不存在时会报错，忽略
        }
        
        try {
            const result = await callAPI('/auth/add_user', CONFIG.TEST_USER, null, true);
            if (!result.success) {
                console.log('创建测试用户失败:', result.error);
            }
        } catch (error) {
            console.log('创建测试用户异常:', error);
        }
    }, 60000);

    afterAll(async () => {
        await close_server();
    });

    async function callAPI(endpoint, data = {}, token = null, isCliRequest = false) {
        const url = `${CONFIG.SERVER_URL}${CONFIG.API_BASE}${endpoint}`;
        const headers = { 'Content-Type': 'application/json' };
        
        if (token) {
            headers['token'] = token;
        }
        
        // 如果是 CLI 请求，添加特殊标识
        if (isCliRequest) {
            headers['X-Request-Source'] = 'cli';
        }
        
        try {
            const response = await axios.post(url, data, { headers, timeout: 5000 });
            return {
                success: !response.data.err_msg,
                data: response.data,
                error: response.data.err_msg
            };
        } catch (error) {
            if (error.response) {
                return {
                    success: false,
                    error: error.response.data?.err_msg || '请求失败'
                };
            } else if (error.code === 'ECONNREFUSED') {
                return {
                    success: false,
                    error: '连接被拒绝，请确保服务器正在运行'
                };
            } else {
                return {
                    success: false,
                    error: error.message
                };
            }
        }
    }

    test('应该能够成功登录并获取Token', async () => {
        // 登录接口不需要 token，应该成功
        const result = await callAPI('/auth/login', CONFIG.TEST_USER);
        if (!result.success) {
            console.log('登录失败，错误信息:', result.error);
            console.log('测试用户配置:', CONFIG.TEST_USER);
            console.log('完整响应:', result);
        }
        
        expect(result.success).toBe(true);
        expect(result.data.result).toBeDefined();
        expect(result.data.result.token).toBeDefined();
        
        authToken = result.data.result.token;
        expect(typeof authToken).toBe('string');
        expect(authToken.length).toBeGreaterThan(0);
    });

    test('有效Token访问应该成功', async () => {
        // 使用有效 token 访问需要认证的接口
        const result = await callAPI('/auth/list_users', {}, authToken, false);
        expect(result.success).toBe(true);
        expect(result.data.result).toBeDefined();
        expect(typeof result.data.result.total).toBe('number');
    });

    test('本地请求不需要Token应该成功', async () => {
        const result = await callAPI('/auth/list_users', {}, null, false);
        expect(result.success).toBe(true);
        expect(result.data.result).toBeDefined();
    });

    test('无效Token应该被拒绝（本地请求除外）', async () => {
        const result = await callAPI('/auth/list_users', {}, 'invalid_token', false);
        expect(result.success).toBe(true); // 本地请求会成功
    });
});
