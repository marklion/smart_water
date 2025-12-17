import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'smart_water_secret_key_2024';
const JWT_EXPIRES_IN = '7d';

let users = [];
const ALLOWED_ROLES = ['farmer', 'engineer'];



function verifyPassword(password, hash) {
    return password === hash;
}

function generateToken(username) {
    return jwt.sign({ username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // 验证 token 后，检查用户是否仍然存在
        if (decoded && decoded.username) {
            const userExists = users.find(u => u.username === decoded.username);
            if (!userExists) {
                // 用户已被删除，token 无效
                return null;
            }
        }
        return decoded;
    } catch (error) {
        return null;
    }
}

export default {
    name: 'auth',
    methods: {
        login: {
            is_write: false,
            need_rbac: false,
            name: '用户登录',
            description: '用户登录接口，返回JWT令牌用于后续请求验证',
            params: {
                username: { type: String, have_to: true, mean: '用户名', example: 'admin' },
                password: { type: String, have_to: true, mean: '密码', example: 'password123' }
            },
            result: {
                token: { type: String, mean: 'JWT令牌', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                username: { type: String, mean: '用户名', example: 'admin' },
                role: { type: String, mean: '角色', example: 'farmer' },
                expires_in: { type: String, mean: '过期时间', example: '7d' }
            },
            func: async function(params) {
                const { username, password } = params;
                const usernameStr = String(username || '');
                const passwordStr = String(password || '');
                if (!usernameStr || !passwordStr) {
                    throw { err_msg: '用户名和密码不能为空' };
                }
                const user = users.find(u => u.username === usernameStr);

                if (!user) {
                    throw { err_msg: '用户不存在' };
                }
                if (!verifyPassword(passwordStr, user.password)) {
                    throw { err_msg: '密码错误' };
                }
                const roleVal = user.role || 'farmer';
                const token = generateToken(usernameStr);
                return {
                    token: token,
                    username: usernameStr,
                    role: roleVal,
                    expires_in: JWT_EXPIRES_IN
                };
            },
        },
        add_user: {
            is_write: true,
            need_rbac: false,
            name: '添加用户',
            description: '添加新用户',
            params: {
                username: { type: String, have_to: true, mean: '用户名', example: 'admin' },
                password: { type: String, have_to: true, mean: '密码', example: 'password123' },
                role: { type: String, have_to: true, mean: '角色', example: 'farmer' }
            },
            result: {
                success: { type: Boolean, mean: '是否成功', example: true },
                username: { type: String, mean: '用户名', example: 'admin' },
                role: { type: String, mean: '角色', example: 'farmer' }
            },
            func: async function(params) {
                const { username, password, role } = params;
                const usernameStr = String(username || '');
                const passwordStr = String(password || '');
                const roleStr = String(role || '');
                if (!usernameStr || !passwordStr || !roleStr) {
                    throw { err_msg: '用户名、密码和角色不能为空' };
                }
                if (usernameStr.length < 3) {
                    throw { err_msg: '用户名长度不能少于3位' };
                }
                if (passwordStr.length < 3) {
                    throw { err_msg: '密码长度不能少于3位' };
                }
                if (!ALLOWED_ROLES.includes(roleStr)) {
                    throw { err_msg: 'role参数必须是 farmer 或 engineer' };
                }
                if (users.find(u => u.username === usernameStr)) {
                    throw { err_msg: '用户已存在' };
                }
                users.push({
                    username: usernameStr,
                    password: passwordStr,
                    role: roleStr,
                    created_at: new Date().toISOString()
                });

                return {
                    success: true,
                    username: usernameStr,
                    role: roleStr
                };
            }
        },

        del_user: {
            is_write: true,
            need_rbac: false,
            name: '删除用户',
            description: '删除用户',
            params: {
                username: { type: String, have_to: true, mean: '用户名', example: 'admin' }
            },
            result: {
                success: { type: Boolean, mean: '是否成功', example: true },
                username: { type: String, mean: '用户名', example: 'admin' }
            },
            func: async function(params) {
                const { username } = params;
                const usernameStr = String(username || '');
                if (!usernameStr) {
                    throw { err_msg: '用户名不能为空' };
                }
                const userIndex = users.findIndex(u => u.username === usernameStr);

                if (userIndex === -1) {
                    throw { err_msg: '用户不存在' };
                }
                users.splice(userIndex, 1);
                return {
                    success: true,
                    username: usernameStr
                };
            }
        },
        list_users: {
            is_write: false,
            need_rbac: false,
            name: '列出所有用户',
            description: '获取所有用户列表',
            params: {},
            result: {
                users: {
                    type: Array,
                    mean: '用户列表',
                    example: [{ username: 'admin', created_at: '2024-01-01T00:00:00.000Z' }],
                    explain: {
                        username: { type: String, mean: '用户名', example: 'admin' },
                        password: { type: String, mean: '密码', example: 'aaa' },
                        role: { type: String, mean: '角色', example: 'farmer' },
                        created_at: { type: String, mean: '创建时间', example: '2024-01-01T00:00:00.000Z' }
                    }
                },
                total: { type: Number, mean: '用户总数', example: 1 }
            },
            func: async function(params) {
                const userList = users.map(user => ({
                    username: user.username,
                    password: user.password,
                    role: user.role,
                    created_at: user.created_at
                }));

                return {
                    users: userList,
                    total: userList.length
                };
            }
        }
    },
    verifyToken,
    generateToken
};
