const policy_array = []
export default {
    name: 'policy',
    description: '策略管理',
    methods: {
        add_policy: {
            name: '添加策略',
            description: '添加一个新的策略',
            is_write: true,
            is_get_api: false,
            params: {
                name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                try {
                    let existingPolicy = policy_array.find(policy => policy.name === body.name);
                    if (!existingPolicy) {
                        policy_array.push({
                            name: body.name,
                            states: []
                        });
                        return { result: true };
                    } else {
                        return { result: true }; // 如果策略已存在，也返回成功
                    }
                } catch (error) {
                    throw {
                        err_msg: error.message || '创建策略失败'
                    };
                }
            },
        },
        list_policy: {
            name: '列出策略',
            description: '列出所有策略',
            is_write: false,
            is_get_api: true,
            params: {
            },
            result: {
                policies: {
                    type: Array, mean: '策略列表', explain: {
                        name: { type: String, mean: '策略名称', example: '策略1'},
                    }
                }
            },
            func: async function (body, token) {
                let current_page_content = policy_array.slice(body.pageNo * 20, (body.pageNo + 1) * 20);
                return {
                    policies: current_page_content,
                    total: policy_array.length,
                }
            },
        },
        del_policy:{
            name:'删除策略',
            description: '删除一个策略',
            is_write: true,
            is_get_api: false,
            params: {
                name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true}
            },
            func: async function (body, token) {
                let index = policy_array.findIndex(policy => policy.name === body.name);
                if (index !== -1) {
                    policy_array.splice(index, 1);
                    return { result: true };
                } else {
                    throw {
                        err_msg:'策略不存在',
                    }
                }
            },
        },
        add_state: {
            name: '添加状态',
            description: '向策略添加一个新的状态',
            is_write: true,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
                state_name: { type: String, mean: '状态名称', example: 's1', have_to: true }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                let policy = policy_array.find(p => p.name === body.policy_name);
                if (!policy) {
                    throw { err_msg: '策略不存在' };
                }
                if (!policy.states) {
                    policy.states = [];
                }
                let existingState = policy.states.find(s => s.name === body.state_name);
                if (!existingState) {
                    policy.states.push({
                        name: body.state_name,
                        enter_actions: []
                    });
                }
                return { result: true };
            }
        },
        list_states: {
            name: '列出状态',
            description: '列出策略的所有状态',
            is_write: false,
            is_get_api: true,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
            },
            result: {
                states: { 
                    type: Array, 
                    mean: '状态列表', 
                    explain: {
                        name: { type: String, mean: '状态名称', example: 's1' }
                    }
                }
            },
            func: async function (body, token) {
                let policy = policy_array.find(p => p.name === body.policy_name);
                if (!policy) {
                    throw { err_msg: '策略不存在' };
                }
                let states = policy.states ? policy.states.map(s => ({ name: s.name })) : [];
                let current_page_content = states.slice(body.pageNo * 20, (body.pageNo + 1) * 20);
                return {
                    states: current_page_content,
                    total: states.length,
                };
            }
        },
        get_state: {
            name: '获取状态',
            description: '获取状态的详细信息',
            is_write: false,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
                state_name: { type: String, mean: '状态名称', example: 's1', have_to: true }
            },
            result: {
                state: { 
                    type: Object, 
                    mean: '状态信息', 
                    explain: {
                        name: { type: String, mean: '状态名称', example: 's1'},
                        enter_actions: { 
                            type: Array, 
                            mean: '进入动作列表', 
                            explain: {
                                device: { type: String, mean: '设备名称', example: '阀门1' },
                                action: { type: String, mean: '动作名称', example: '开启' }
                            }
                        }
                    }
                }
            },
            func: async function (body, token) {
                let policy = policy_array.find(p => p.name === body.policy_name);
                if (!policy) {
                    throw { err_msg: '策略不存在' };
                }
                let state = policy.states ? policy.states.find(s => s.name === body.state_name) : null;
                if (!state) {
                    throw { err_msg: '状态不存在' };
                }
                return { state };
            }
        },
        add_state_action: {
            name: '添加状态动作',
            description: '向状态添加一个动作',
            is_write: true,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
                state_name: { type: String, mean: '状态名称', example: 's1', have_to: true },
                trigger: { type: String, mean: '触发类型', example: 'enter', have_to: true },
                device: { type: String, mean: '设备名称', example: '阀门1', have_to: true },
                action: { type: String, mean: '动作名称', example: '开启', have_to: true }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true, have_to: true }
            },
            func: async function (body, token) {
                let policy = policy_array.find(p => p.name === body.policy_name);
                if (!policy) {
                    throw { err_msg: '策略不存在' };
                }
                let state = policy.states ? policy.states.find(s => s.name === body.state_name) : null;
                if (!state) {
                    throw { err_msg: '状态不存在' };
                }
                if (!state.enter_actions) {
                    state.enter_actions = [];
                }
                state.enter_actions.push({
                    device: body.device,
                    action: body.action
                });
                return { result: true };
            }
        },
    }
}