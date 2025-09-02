import { 
    ensureArrayExists, 
    getPaginatedResult, 
    findAndRemoveFromArray, 
    addItemIfNotExists, 
    mapArrayToNameOnly, 
    mapArrayToFields,
    validateItemExists,
    validateNestedItemExists,
    findAndRemoveByName,
    validateArrayExists
} from '../../public/server/common_utils.js';

const policy_array = []

// 公共验证函数
function validatePolicyExists(policy_name) {
    return validateItemExists(policy_array, policy_name, '策略');
}

function validateStateExists(policy, state_name) {
    return validateNestedItemExists(policy, 'states', state_name, '状态');
}

function validateTransformerExists(state, transformer_name) {
    return validateNestedItemExists(state, 'transformers', transformer_name, '转换器');
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
                    addItemIfNotExists(policy_array, {
                        name: body.name,
                        states: []
                    }, policy => policy.name === body.name);
                    return { result: true };
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
                let result = getPaginatedResult(policy_array, body.pageNo);
                return {
                    policies: result.items,
                    total: result.total,
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
                if (findAndRemoveByName(policy_array, body.name)) {
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
                let states = ensureArrayExists(policy, 'states');
                addItemIfNotExists(states, {
                    name: body.state_name,
                    enter_actions: []
                }, s => s.name === body.state_name);
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
                let states = mapArrayToNameOnly(policy.states);
                let result = getPaginatedResult(states, body.pageNo);
                return {
                    states: result.items,
                    total: result.total,
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
                let policy = validatePolicyExists(body.policy_name);
                validateStateExists(policy, body.state_name);
                findAndRemoveFromArray(policy.states, s => s.name === body.state_name);
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
                        },
                        do_actions: { 
                            type: Array, 
                            mean: '状态内动作列表', 
                            explain: {
                                device: { type: String, mean: '设备名称', example: '阀门1' },
                                action: { type: String, mean: '动作名称', example: '开启' }
                            }
                        },
                        exit_actions: { 
                            type: Array, 
                            mean: '离开动作列表', 
                            explain: {
                                device: { type: String, mean: '设备名称', example: '阀门1' },
                                action: { type: String, mean: '动作名称', example: '关闭' }
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
        del_state: {
            name: '删除状态',
            description: '删除策略中的一个状态',
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
                let state = policy.states ? policy.states.find(s => s.name === body.state_name) : null;
                if (!state) {
                    throw { err_msg: '状态不存在' };
                }
                return { state };
            }
        },
        del_state: {
            name: '删除状态',
            description: '删除策略中的一个状态',
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
                    throw { err_msg: '状态不存在' };
                }
                let index = policy.states.findIndex(s => s.name === body.state_name);
                if (index !== -1) {
                    policy.states.splice(index, 1);
                    return { result: true };
                } else {
                    throw { err_msg: '状态不存在' };
                }
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
                let enterActions = ensureArrayExists(state, 'enter_actions');
                addItemIfNotExists(enterActions, {
                    device: body.device,
                    action: body.action
                }, action => action.device === body.device && action.action === body.action);
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
                findAndRemoveFromArray(state.enter_actions, action => 
                    action.device === body.device && action.action === body.action
                );
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
                let policy = validatePolicyExists(body.policy_name);
                let state = validateStateExists(policy, body.state_name);
                let transformers = ensureArrayExists(state, 'transformers');
                addItemIfNotExists(transformers, {
                    name: body.transformer_name,
                    rules: []
                }, t => t.name === body.transformer_name);
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
                let policy = validatePolicyExists(body.policy_name);
                let state = validateStateExists(policy, body.state_name);
                let transformers = mapArrayToNameOnly(state.transformers);
                let result = getPaginatedResult(transformers, body.pageNo);
                return {
                    transformers: result.items,
                    total: result.total,
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
                let policy = validatePolicyExists(body.policy_name);
                let state = validateStateExists(policy, body.state_name);
                validateTransformerExists(state, body.transformer_name);
                findAndRemoveFromArray(state.transformers, t => t.name === body.transformer_name);
                return { result: true };
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
                let policy = validatePolicyExists(body.policy_name);
                let state = validateStateExists(policy, body.state_name);
                let transformer = validateTransformerExists(state, body.transformer_name);
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
                let policy = validatePolicyExists(body.policy_name);
                let state = validateStateExists(policy, body.state_name);
                let transformer = validateTransformerExists(state, body.transformer_name);
                let rules = ensureArrayExists(transformer, 'rules');
                rules.push({
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
                let policy = validatePolicyExists(body.policy_name);
                let state = validateStateExists(policy, body.state_name);
                let transformer = validateTransformerExists(state, body.transformer_name);
                if (!transformer.rules) {
                    return { result: true };
                }
                findAndRemoveFromArray(transformer.rules, rule => 
                    rule.target_state === body.target_state
                );
                return { result: true };
            }
        },
        del_state_action: {
            name: '删除状态动作',
            description: '删除状态中的一个动作',
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
                
                // 根据触发类型决定操作的动作列表
                let actionList;
                if (body.trigger === 'enter') {
                    actionList = state.enter_actions;
                } else if (body.trigger === 'do') {
                    actionList = state.do_actions;
                } else if (body.trigger === 'exit') {
                    actionList = state.exit_actions;
                } else {
                    throw { err_msg: '无效的触发类型，必须是 enter, do, 或 exit' };
                }
                
                if (!actionList) {
                    throw { err_msg: '动作不存在' };
                }
                
                let index = actionList.findIndex(a => a.device === body.device && a.action === body.action);
                if (index !== -1) {
                    actionList.splice(index, 1);
                    return { result: true };
                } else {
                    throw { err_msg: '动作不存在' };
                }
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
                let policy = validatePolicyExists(body.policy_name);
                let sources = ensureArrayExists(policy, 'sources');
                addItemIfNotExists(sources, {
                    name: body.name,
                    device: body.device,
                    data_type: body.data_type
                }, s => s.name === body.name);
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
                let policy = validatePolicyExists(body.policy_name);
                let sources = mapArrayToFields(policy.sources, ['name', 'device', 'data_type']);
                let result = getPaginatedResult(sources, body.pageNo);
                return {
                    sources: result.items,
                    total: result.total,
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
                let policy = validatePolicyExists(body.policy_name);
                let sources = validateArrayExists(policy, 'sources', '数据源');
                findAndRemoveFromArray(sources, s => s.name === body.name);
                return { result: true };
            }
        },
    }
}