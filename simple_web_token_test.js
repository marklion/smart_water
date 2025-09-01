import axios from 'axios';

// 配置
const CONFIG = {
    SERVER_URL: 'http://localhost:47147',
    API_BASE: '/api/v1',
    TEST_USER: {
        username: 'admin',
        password: 'admin123'
    }
};

function success(msg) { console.log('✅', msg); }
function error(msg) { console.log('❌', msg); }
function info(msg) { console.log('ℹ️ ', msg); }
function step(msg) { console.log('\n🔸', msg); }

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

// 1. 用户登录获取Token
async function getToken() {
    step('用户登录获取Token');
    const result = await callAPI('/auth/login', CONFIG.TEST_USER);
    
    if (result.success && result.data.result?.token) {
        const token = result.data.result.token;
        success(`登录成功，Token: ${token.substring(0, 20)}...`);
        return token;
    } else {
        error(`登录失败: ${result.error}`);
        return null;
    }
}

async function testAuthModule(token) {
    step('测试认证模块');

    const noTokenResult = await callAPI('/auth/list_users');
    if (!noTokenResult.success) {
        success('无Token访问被正确拒绝');
    } else {
        error('无Token访问应该被拒绝');
    }

    const withTokenResult = await callAPI('/auth/list_users', {}, token);
    if (withTokenResult.success) {
        success(`有Token访问成功，用户数: ${withTokenResult.data.result.total}`);
    } else {
        error(`有Token访问失败: ${withTokenResult.error}`);
    }
}

async function testDeviceModule(token) {
    step('测试设备管理模块');

    const noTokenResult = await callAPI('/device_management/list_driver');
    if (!noTokenResult.success) {
        success('无Token访问驱动列表被正确拒绝');
    } else {
        error('无Token访问应该被拒绝');
    }

    const withTokenResult = await callAPI('/device_management/list_driver', {}, token);
    if (withTokenResult.success) {
        success(`有Token访问成功，驱动数: ${withTokenResult.data.result.total}`);
    } else {
        error(`有Token访问失败: ${withTokenResult.error}`);
    }
}

async function testResourceModule(token) {
    step('测试资源管理模块');

    const noTokenResult = await callAPI('/resource/list_farm');
    if (!noTokenResult.success) {
        success('无Token访问农场列表被正确拒绝');
    } else {
        error('无Token访问应该被拒绝');
    }

    const withTokenResult = await callAPI('/resource/list_farm', {}, token);
    if (withTokenResult.success) {
        success(`有Token访问成功，农场数: ${withTokenResult.data.result.total}`);
    } else {
        error(`有Token访问失败: ${withTokenResult.error}`);
    }
}

async function testPolicyModule(token) {
    step('测试策略管理模块');

    const noTokenResult = await callAPI('/policy/list_policy');
    if (!noTokenResult.success) {
        success('无Token访问策略列表被正确拒绝');
    } else {
        error('无Token访问应该被拒绝');
    }

    const withTokenResult = await callAPI('/policy/list_policy', {}, token);
    if (withTokenResult.success) {
        success(`有Token访问成功，策略数: ${withTokenResult.data.result.total}`);
    } else {
        error(`有Token访问失败: ${withTokenResult.error}`);
    }
}

async function testInvalidToken() {
    step('测试无效Token');
    
    const invalidTokenResult = await callAPI('/auth/list_users', {}, 'invalid_token_123');
    if (!invalidTokenResult.success) {
        success('无效Token被正确拒绝');
    } else {
        error('无效Token应该被拒绝');
    }
}

// 主测试函数
async function main() {
    console.log('Web端Token验证测试');
    
    try {
        step('检查服务器连接');
        try {
            const response = await axios.get(`${CONFIG.SERVER_URL}`);
            success('服务器连接正常');
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                error('服务器连接失败，请启动服务器: npm run start_server');
                return;
            } else {
                success('服务器运行中');
            }
        }

        const token = await getToken();
        if (!token) {
            return;
        }
        await testAuthModule(token);
        await testDeviceModule(token);
        await testResourceModule(token);
        await testPolicyModule(token);
        await testInvalidToken();
        
        console.log('\n🎉 Token验证测试完成！\n');
        
    } catch (error) {
        error(`测试失败: ${error.message}`);
    }
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
`);
    process.exit(0);
}

// 启动测试
main();
