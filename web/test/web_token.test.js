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
        
        // 创建测试用户
        try {
            await callAPI('/auth/add_user', CONFIG.TEST_USER);
        } catch (error) {
            // 用户可能已存在，忽略错误
        }
    }, 60000);

    afterAll(async () => {
    });

    async function callAPI(endpoint, data = {}, token = null) {
        const url = `${CONFIG.SERVER_URL}${CONFIG.API_BASE}${endpoint}`;
        const headers = { 'Content-Type': 'application/json' };
        
        if (token) {
            headers['token'] = token;
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
        const result = await callAPI('/auth/login', CONFIG.TEST_USER);
        
        expect(result.success).toBe(true);
        expect(result.data.result).toBeDefined();
        expect(result.data.result.token).toBeDefined();
        
        authToken = result.data.result.token;
        expect(typeof authToken).toBe('string');
        expect(authToken.length).toBeGreaterThan(0);
    });

    test('有效Token访问应该成功', async () => {
        const result = await callAPI('/auth/list_users', {}, authToken);
        expect(result.success).toBe(true);
        expect(result.data.result).toBeDefined();
        expect(typeof result.data.result.total).toBe('number');
    });

    test('本地请求不需要Token应该成功', async () => {
        const result = await callAPI('/auth/list_users');
        expect(result.success).toBe(true);
        expect(result.data.result).toBeDefined();
    });

    test('无效Token应该被拒绝（本地请求除外）', async () => {
        const result = await callAPI('/auth/list_users', {}, 'invalid_token');
        expect(result.success).toBe(true); // 本地请求会成功
    });
});
