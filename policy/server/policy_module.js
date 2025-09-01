const policy_array = []

// 公共验证函数
function validatePolicyExists(policy_name) {
    let policy = policy_array.find(p => p.name === policy_name);
    if (!policy) {
        throw { err_msg: '策略不存在' };
    }
    return policy;
}

function validateStateExists(policy, state_name) {
    let state = policy.states ? policy.states.find(s => s.name === state_name) : null;
    if (!state) {
        throw { err_msg: '状态不存在' };
    }
    return state;
}

function validateTransformerExists(state, transformer_name) {
    let transformer = state.transformers ? state.transformers.find(t => t.name === transformer_name) : null;
    if (!transformer) {
        throw { err_msg: '转换器不存在' };
    }
    return transformer;
}

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
                let policy = validatePolicyExists(body.policy_name);
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
                let policy = validatePolicyExists(body.policy_name);
                let states = policy.states ? policy.states.map(s => ({ name: s.name })) : [];
                let current_page_content = states.slice(body.pageNo * 20, (body.pageNo + 1) * 20);
                return {
                    states: current_page_content,
                    total: states.length,
                };
            }
        },
        del_state: {
            name: '删除状态',
            description: '从策略中删除一个状态',
            is_write: true,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
                state_name: { type: String, mean: '状态名称', example: 's1', have_to: true }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true, have_to: true }
            },
            func: async function (body, token) {
                let policy = policy_array.find(p => p.name === body.policy_name);
                if (!policy) {
                    throw { err_msg: '策略不存在' };
                }
                if (!policy.states) {
                    return { result: true };
                }
                // 找到并删除匹配的状态
                let index = policy.states.findIndex(state => state.name === body.state_name);
                if (index !== -1) {
                    policy.states.splice(index, 1);
                }
                return { result: true };
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
                        },
                        transformers: { 
                            type: Array, 
                            mean: '转换器列表', 
                            explain: {
                                name: { type: String, mean: '转换器名称', example: 't1' },
                                rules: { 
                                    type: Array, 
                                    mean: '转移规则列表', 
                                    explain: {
                                        target_state: { type: String, mean: '目标状态', example: 's2' },
                                        expression: { type: String, mean: '转移条件表达式', example: 's.cur_pressure <= 40' }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            func: async function (body, token) {
                let policy = validatePolicyExists(body.policy_name);
                let state = validateStateExists(policy, body.state_name);
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
                let policy = validatePolicyExists(body.policy_name);
                let state = validateStateExists(policy, body.state_name);
                if (!state.enter_actions) {
                    state.enter_actions = [];
                }
                // 检查是否已存在相同的动作，避免重复添加
                let existingAction = state.enter_actions.find(action => 
                    action.device === body.device && action.action === body.action
                );
                if (!existingAction) {
                    state.enter_actions.push({
                        device: body.device,
                        action: body.action
                    });
                }
                return { result: true };
            }
        },
        del_state_action: {
            name: '删除状态动作',
            description: '从状态中删除一个动作',
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
                let policy = validatePolicyExists(body.policy_name);
                let state = validateStateExists(policy, body.state_name);
                if (!state.enter_actions) {
                    return { result: true };
                }
                // 找到并删除匹配的动作
                let index = state.enter_actions.findIndex(action => 
                    action.device === body.device && action.action === body.action
                );
                if (index !== -1) {
                    state.enter_actions.splice(index, 1);
                }
                return { result: true };
            }
        },
        add_transformer: {
            name: '添加转换器',
            description: '向状态添加一个转换器',
            is_write: true,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
                state_name: { type: String, mean: '状态名称', example: 's1', have_to: true },
                transformer_name: { type: String, mean: '转换器名称', example: 't1', have_to: true }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
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
                if (!state.transformers) {
                    state.transformers = [];
                }
                let existingTransformer = state.transformers.find(t => t.name === body.transformer_name);
                if (!existingTransformer) {
                    state.transformers.push({
                        name: body.transformer_name,
                        rules: []
                    });
                }
                return { result: true };
            }
        },
        list_transformers: {
            name: '列出转换器',
            description: '列出状态的所有转换器',
            is_write: false,
            is_get_api: true,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
                state_name: { type: String, mean: '状态名称', example: 's1', have_to: true }
            },
            result: {
                transformers: { 
                    type: Array, 
                    mean: '转换器列表', 
                    explain: {
                        name: { type: String, mean: '转换器名称', example: 't1' }
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
                let transformers = state.transformers ? state.transformers.map(t => ({ name: t.name })) : [];
                let current_page_content = transformers.slice(body.pageNo * 20, (body.pageNo + 1) * 20);
                return {
                    transformers: current_page_content,
                    total: transformers.length,
                };
            }
        },
        del_transformer: {
            name: '删除转换器',
            description: '删除一个转换器',
            is_write: true,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
                state_name: { type: String, mean: '状态名称', example: 's1', have_to: true },
                transformer_name: { type: String, mean: '转换器名称', example: 't1', have_to: true }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
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
                if (!state.transformers) {
                    throw { err_msg: '转换器不存在' };
                }
                let index = state.transformers.findIndex(t => t.name === body.transformer_name);
                if (index !== -1) {
                    state.transformers.splice(index, 1);
                    return { result: true };
                } else {
                    throw { err_msg: '转换器不存在' };
                }
            }
        },
        get_transformer: {
            name: '获取转换器',
            description: '获取转换器的详细信息',
            is_write: false,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
                state_name: { type: String, mean: '状态名称', example: 's1', have_to: true },
                transformer_name: { type: String, mean: '转换器名称', example: 't1', have_to: true }
            },
            result: {
                transformer: { 
                    type: Object, 
                    mean: '转换器信息', 
                    explain: {
                        name: { type: String, mean: '转换器名称', example: 't1'},
                        rules: { 
                            type: Array, 
                            mean: '转移规则列表', 
                            explain: {
                                target_state: { type: String, mean: '目标状态', example: 's2' },
                                expression: { type: String, mean: '转移条件表达式', example: 's.cur_pressure <= 40' }
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
                let transformer = state.transformers ? state.transformers.find(t => t.name === body.transformer_name) : null;
                if (!transformer) {
                    throw { err_msg: '转换器不存在' };
                }
                return { transformer };
            }
        },
        add_transformer_rule: {
            name: '添加转换器规则',
            description: '向转换器添加一个转移规则',
            is_write: true,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
                state_name: { type: String, mean: '状态名称', example: 's1', have_to: true },
                transformer_name: { type: String, mean: '转换器名称', example: 't1', have_to: true },
                target_state: { type: String, mean: '目标状态', example: 's2', have_to: true },
                expression: { type: String, mean: '转移条件表达式', example: 's.cur_pressure <= 40', have_to: true }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
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
                let transformer = state.transformers ? state.transformers.find(t => t.name === body.transformer_name) : null;
                if (!transformer) {
                    throw { err_msg: '转换器不存在' };
                }
                if (!transformer.rules) {
                    transformer.rules = [];
                }
                transformer.rules.push({
                    target_state: body.target_state,
                    expression: body.expression
                });
                return { result: true };
            }
        },
        del_transformer_rule: {
            name: '删除转换器规则',
            description: '从转换器中删除一个转移规则',
            is_write: true,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
                state_name: { type: String, mean: '状态名称', example: 's1', have_to: true },
                transformer_name: { type: String, mean: '转换器名称', example: 't1', have_to: true },
                target_state: { type: String, mean: '目标状态', example: 's2', have_to: true }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
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
                let transformer = state.transformers ? state.transformers.find(t => t.name === body.transformer_name) : null;
                if (!transformer) {
                    throw { err_msg: '转换器不存在' };
                }
                if (!transformer.rules) {
                    return { result: true };
                }
                // 找到并删除匹配的规则
                let index = transformer.rules.findIndex(rule => 
                    rule.target_state === body.target_state
                );
                if (index !== -1) {
                    transformer.rules.splice(index, 1);
                }
                return { result: true };
            }
        },
        add_source: {
            name: '添加数据源',
            description: '向策略添加一个数据源',
            is_write: true,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
                name: { type: String, mean: '数据源名称', example: '温度传感器1', have_to: true },
                device: { type: String, mean: '设备名称', example: '传感器1', have_to: true },
                data_type: { type: String, mean: '数据类型', example: 'temperature', have_to: true }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                let policy = policy_array.find(p => p.name === body.policy_name);
                if (!policy) {
                    throw { err_msg: '策略不存在' };
                }
                if (!policy.sources) {
                    policy.sources = [];
                }
                let existingSource = policy.sources.find(s => s.name === body.name);
                if (!existingSource) {
                    policy.sources.push({
                        name: body.name,
                        device: body.device,
                        data_type: body.data_type
                    });
                }
                return { result: true };
            }
        },
        list_sources: {
            name: '列出数据源',
            description: '列出策略的所有数据源',
            is_write: false,
            is_get_api: true,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
            },
            result: {
                sources: { 
                    type: Array, 
                    mean: '数据源列表', 
                    explain: {
                        name: { type: String, mean: '数据源名称', example: '温度传感器1' },
                        device: { type: String, mean: '设备名称', example: '传感器1' },
                        data_type: { type: String, mean: '数据类型', example: 'temperature' }
                    }
                }
            },
            func: async function (body, token) {
                let policy = policy_array.find(p => p.name === body.policy_name);
                if (!policy) {
                    throw { err_msg: '策略不存在' };
                }
                let sources = policy.sources ? policy.sources.map(s => ({ 
                    name: s.name, 
                    device: s.device, 
                    data_type: s.data_type 
                })) : [];
                let current_page_content = sources.slice(body.pageNo * 20, (body.pageNo + 1) * 20);
                return {
                    sources: current_page_content,
                    total: sources.length,
                };
            }
        },
        del_source: {
            name: '删除数据源',
            description: '删除策略中的一个数据源',
            is_write: true,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
                name: { type: String, mean: '数据源名称', example: '温度传感器1', have_to: true }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                let policy = policy_array.find(p => p.name === body.policy_name);
                if (!policy) {
                    throw { err_msg: '策略不存在' };
                }
                if (!policy.sources) {
                    throw { err_msg: '数据源不存在' };
                }
                let index = policy.sources.findIndex(s => s.name === body.name);
                if (index !== -1) {
                    policy.sources.splice(index, 1);
                    return { result: true };
                } else {
                    throw { err_msg: '数据源不存在' };
                }
            }
        },
    }
}