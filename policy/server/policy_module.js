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

// 扫描周期配置，默认为0（不扫描）
let scan_period_ms = 0
// 扫描定时器
let scan_timer = null
// 策略运行状态存储
const policy_runtime_states = new Map()


// 常量定义 - 减少重复代码
const ACTION_FIELD_SCHEMA = {
    device: { type: String, mean: '设备名称', example: '阀门1' },
    action: { type: String, mean: '动作名称', example: '开启' }
};

const ACTION_PARAMS_SCHEMA = {
    device: { type: String, mean: '设备名称', example: '阀门1', have_to: true },
    action: { type: String, mean: '动作名称', example: '开启', have_to: true }
};

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

function validateVariableExists(policy, variable_name) {
    if (!policy.sources || policy.sources.length === 0) {
        throw { err_msg: `策略 ${policy.name} 中没有定义任何数据源，无法使用变量 ${variable_name}` };
    }
    
    const sourceExists = policy.sources.some(source => source.name === variable_name);
    if (!sourceExists) {
        throw { err_msg: `变量 ${variable_name} 在策略 ${policy.name} 的数据源中不存在` };
    }
}

// 辅助函数：根据触发类型获取动作列表名称
function getActionListName(trigger) {
    const actionListMap = {
        'enter': 'enter_actions',
        'do': 'do_actions', 
        'exit': 'exit_actions'
    };
    
    const listName = actionListMap[trigger];
    if (!listName) {
        throw { err_msg: '无效的触发类型，必须是 enter, do, 或 exit' };
    }
    return listName;
}

// 辅助函数：获取并验证动作列表
function getActionList(state, trigger, shouldExist = false) {
    const listName = getActionListName(trigger);
    const actionList = state[listName];
    
    if (shouldExist && !actionList) {
        throw { err_msg: '动作不存在' };
    }
    
    return actionList;
}

// 辅助函数：根据触发类型获取赋值表达式列表名称
function getAssignmentListName(trigger) {
    const assignmentListMap = {
        'enter': 'enter_assignments',
        'do': 'do_assignments', 
        'exit': 'exit_assignments'
    };
    
    const listName = assignmentListMap[trigger];
    if (!listName) {
        throw { err_msg: '无效的触发类型，必须是 enter, do, 或 exit' };
    }
    return listName;
}

// 辅助函数：获取并验证赋值表达式列表
function getAssignmentList(state, trigger, shouldExist = false) {
    const listName = getAssignmentListName(trigger);
    const assignmentList = state[listName];
    
    if (shouldExist && !assignmentList) {
        throw { err_msg: '赋值表达式不存在' };
    }
    
    return assignmentList;
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
                    enter_actions: [],
                    do_actions: [],
                    exit_actions: [],
                    enter_assignments: [],
                    do_assignments: [],
                    exit_assignments: []
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
                        name: { type: String, mean: '状态名称', example: 's1' },
                        enter_actions: { 
                            type: Array, 
                            mean: '进入动作列表', 
                            explain: {
                                device: { type: String, mean: '设备名称', example: '阀门1' },
                                action: { type: String, mean: '动作名称', example: '开启' }
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
                                action: { type: String, mean: '动作名称', example: '开启' }
                            }
                        },
                        enter_assignments: {
                            type: Array,
                            mean: '进入状态赋值表达式列表',
                            explain: {
                                variable_name: { type: String, mean: '变量名', example: 'temp' },
                                expression: { type: String, mean: '赋值表达式', example: 's.temperature' }
                            }
                        },
                        do_assignments: {
                            type: Array,
                            mean: '状态内赋值表达式列表',
                            explain: {
                                variable_name: { type: String, mean: '变量名', example: 'temp' },
                                expression: { type: String, mean: '赋值表达式', example: 's.temperature' }
                            }
                        },
                        exit_assignments: {
                            type: Array,
                            mean: '离开状态赋值表达式列表',
                            explain: {
                                variable_name: { type: String, mean: '变量名', example: 'temp' },
                                expression: { type: String, mean: '赋值表达式', example: 's.temperature' }
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
                // 直接返回完整的状态信息，包括actions和assignments
                let result = getPaginatedResult(policy.states, body.pageNo);
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
                            explain: ACTION_FIELD_SCHEMA
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
                            explain: ACTION_FIELD_SCHEMA
                        },
                        exit_actions: { 
                            type: Array, 
                            mean: '离开动作列表', 
                            explain: ACTION_FIELD_SCHEMA
                        },
                        enter_assignments: {
                            type: Array,
                            mean: '进入状态赋值表达式列表',
                            explain: {
                                variable_name: { type: String, mean: '变量名', example: 'temp' },
                                expression: { type: String, mean: '赋值表达式', example: 's.temperature + 10' }
                            }
                        },
                        do_assignments: {
                            type: Array,
                            mean: '状态内赋值表达式列表',
                            explain: {
                                variable_name: { type: String, mean: '变量名', example: 'temp' },
                                expression: { type: String, mean: '赋值表达式', example: 's.temperature + 10' }
                            }
                        },
                        exit_assignments: {
                            type: Array,
                            mean: '离开状态赋值表达式列表',
                            explain: {
                                variable_name: { type: String, mean: '变量名', example: 'temp' },
                                expression: { type: String, mean: '赋值表达式', example: 's.temperature + 10' }
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
                ...ACTION_PARAMS_SCHEMA
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true, have_to: true }
            },
            func: async function (body, token) {
                let policy = validatePolicyExists(body.policy_name);
                let state = validateStateExists(policy, body.state_name);
                
                let actionListName = getActionListName(body.trigger);
                let actionList = ensureArrayExists(state, actionListName);
                addItemIfNotExists(actionList, {
                    device: body.device,
                    action: body.action
                }, action => action.device === body.device && action.action === body.action);
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
                ...ACTION_PARAMS_SCHEMA
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                let policy = validatePolicyExists(body.policy_name);
                let state = validateStateExists(policy, body.state_name);
                
                let actionList = getActionList(state, body.trigger, true);
                
                let actionRemoved = findAndRemoveFromArray(actionList, 
                    a => a.device === body.device && a.action === body.action);
                
                if (!actionRemoved) {
                    throw { err_msg: '动作不存在' };
                }
                
                return { result: true };
            }
        },
        add_assignment: {
            name: '添加赋值表达式',
            description: '添加策略内或跨策略赋值表达式',
            is_write: true,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
                state_name: { type: String, mean: '状态名称', example: 's1', have_to: true },
                trigger: { type: String, mean: '触发类型', example: 'enter', have_to: true },
                variable_name: { type: String, mean: '变量名', example: 'temp', have_to: true },
                expression: { type: String, mean: '赋值表达式', example: 's.temperature + 10', have_to: true },
                target_policy_name: { type: String, mean: '目标策略名称', example: '策略2', have_to: false }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                let policy = validatePolicyExists(body.policy_name);
                let state = validateStateExists(policy, body.state_name);
                
                // 如果是跨策略赋值，不验证变量存在性
                if (body.target_policy_name) {
                    // 跨策略赋值逻辑
                    let assignmentList = ensureArrayExists(state, getAssignmentListName(body.trigger));
                    
                    // 检查是否已存在相同变量名的赋值表达式
                    let existingAssignment = assignmentList.find(
                        a => a.variable_name === body.variable_name && a.target_policy_name === body.target_policy_name
                    );
                    
                    if (existingAssignment) {
                        throw { err_msg: `变量 ${body.variable_name} 的跨策略赋值表达式已存在` };
                    }
                    
                    assignmentList.push({
                        variable_name: body.variable_name,
                        expression: body.expression,
                        target_policy_name: body.target_policy_name
                    });
                } else {
                    // 策略内赋值逻辑
                    validateVariableExists(policy, body.variable_name);
                    
                    let assignmentList = ensureArrayExists(state, getAssignmentListName(body.trigger));
                    
                    // 检查是否已存在相同变量名的赋值表达式
                    let existingAssignment = assignmentList.find(
                        a => a.variable_name === body.variable_name
                    );
                    
                    if (existingAssignment) {
                        throw { err_msg: `变量 ${body.variable_name} 的赋值表达式已存在` };
                    }
                    
                    assignmentList.push({
                        variable_name: body.variable_name,
                        expression: body.expression
                    });
                }
                
                return { result: true };
            }
        },
        del_assignment: {
            name: '删除赋值表达式',
            description: '删除策略内或跨策略赋值表达式',
            is_write: true,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
                state_name: { type: String, mean: '状态名称', example: 's1', have_to: true },
                trigger: { type: String, mean: '触发类型', example: 'enter', have_to: true },
                variable_name: { type: String, mean: '变量名', example: 'temp', have_to: true },
                target_policy_name: { type: String, mean: '目标策略名称', example: '策略2', have_to: false }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                let policy = validatePolicyExists(body.policy_name);
                let state = validateStateExists(policy, body.state_name);
                
                let assignmentList = getAssignmentList(state, body.trigger, true);
                
                let assignmentRemoved;
                if (body.target_policy_name) {
                    // 跨策略赋值删除
                    assignmentRemoved = findAndRemoveFromArray(assignmentList, 
                        a => a.variable_name === body.variable_name && a.target_policy_name === body.target_policy_name);
                } else {
                    // 策略内赋值删除
                    assignmentRemoved = findAndRemoveFromArray(assignmentList, 
                        a => a.variable_name === body.variable_name);
                }
                
                if (!assignmentRemoved) {
                    throw { err_msg: '赋值表达式不存在' };
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
        set_scan_period: {
            name: '设置扫描周期',
            description: '设置策略扫描周期，0表示不扫描',
            is_write: true,
            is_get_api: false,
            params: {
                period_ms: { type: Number, mean: '扫描周期（毫秒）', example: 5000, have_to: true }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                if (body.period_ms < 0) {
                    throw { err_msg: '扫描周期不能为负数' };
                }
                
                if (scan_timer) {
                    clearInterval(scan_timer);
                    scan_timer = null;
                }
                scan_period_ms = body.period_ms;
                if (scan_period_ms > 0) {
                    scan_timer = setInterval(scanAndExecutePolicies, scan_period_ms);
                }
                
                return { result: true };
            }
        },
        get_scan_period: {
            name: '获取扫描周期',
            description: '获取当前策略扫描周期配置',
            is_write: false,
            is_get_api: true,
            params: {},
            result: {
                period_ms: { type: Number, mean: '扫描周期（毫秒）', example: 5000 }
            },
            func: async function (body, token) {
                return { period_ms: scan_period_ms };
            }
        },
        force_stop_scan: {
            name: '强制停止扫描',
            description: '强制停止所有策略扫描定时器',
            is_write: true,
            is_get_api: false,
            params: {},
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                if (scan_timer) {
                    clearInterval(scan_timer);
                    scan_timer = null;
                }
                scan_period_ms = 0;
                return { result: true };
            }
        },
    }
}

async function scanAndExecutePolicies() {
    try {
        console.log(`[${new Date().toISOString()}] 执行策略扫描，当前扫描周期: ${scan_period_ms}ms`);
        for (const policy of policy_array) {
            await processPolicyExecution(policy);
        }
    } catch (error) {
        console.error('策略扫描执行出错:', error);
    }
}

async function processPolicyExecution(policy) {
    if (!policy.states || policy.states.length === 0) {
        return;
    }
    let runtimeState = policy_runtime_states.get(policy.name);
    if (!runtimeState) {
        runtimeState = {
            current_state: policy.states[0].name,
            variables: new Map(),
            last_execution_time: Date.now(),
            start_time: Date.now(),
            execution_count: 0
        };
        policy_runtime_states.set(policy.name, runtimeState);
        console.log(`策略 ${policy.name} 初始化，进入状态: ${runtimeState.current_state}`);
        await executeStateActions(policy, policy.states[0], 'enter', runtimeState);
    }
    runtimeState.execution_count = (runtimeState.execution_count || 0) + 1;
    runtimeState.last_execution_time = Date.now();
    const runtimeMinutes = Math.floor((Date.now() - runtimeState.start_time) / 60000);
    runtimeState.runtime = `${runtimeMinutes}分钟`;
    const currentState = policy.states.find(s => s.name === runtimeState.current_state);
    if (!currentState) {
        console.error(`策略 ${policy.name} 的当前状态 ${runtimeState.current_state} 不存在`);
        return;
    }
    console.log(`策略 ${policy.name} 执行第${runtimeState.execution_count}次，当前状态: ${runtimeState.current_state}，运行时间: ${runtimeState.runtime}`);
    await executeStateActions(policy, currentState, 'do', runtimeState);
    await checkStateTransitions(policy, currentState, runtimeState);
}

async function executeStateActions(policy, state, trigger, runtimeState) {
    try {
        // 执行赋值表达式
        const assignmentListName = getAssignmentListName(trigger);
        const assignments = state[assignmentListName];
        if (assignments && assignments.length > 0) {
            for (const assignment of assignments) {
                try {
                    const value = await evaluateAssignmentExpression(assignment.expression, runtimeState);
                    runtimeState.variables.set(assignment.variable_name, value);
                    console.log(`策略 ${policy.name} 状态 ${state.name} ${trigger} 赋值: ${assignment.variable_name} = ${value}`);
                } catch (error) {
                    console.error(`赋值表达式执行失败: ${assignment.variable_name} = ${assignment.expression}`, error);
                }
            }
        }
        
        // 执行动作
        const actionListName = getActionListName(trigger);
        const actions = state[actionListName];
        if (actions && actions.length > 0) {
            for (const action of actions) {
                try {
                    console.log(`策略 ${policy.name} 状态 ${state.name} ${trigger} 执行动作: 设备=${action.device}, 动作=${action.action}`);
                    await executeDeviceAction(action.device, action.action);
                } catch (error) {
                    console.error(`动作执行失败: 设备=${action.device}, 动作=${action.action}`, error);
                }
            }
        }
    } catch (error) {
        console.error(`执行状态动作失败: 策略=${policy.name}, 状态=${state.name}, 触发=${trigger}`, error);
    }
}

async function checkStateTransitions(policy, currentState, runtimeState) {
    if (!currentState.transformers || currentState.transformers.length === 0) {
        return;
    }
    for (const transformer of currentState.transformers) {
        if (!transformer.rules || transformer.rules.length === 0) {
            continue;
        }
        for (const rule of transformer.rules) {
            try {
                console.log(`策略 ${policy.name} 检查转换条件: ${rule.expression} -> ${rule.target_state}`);
                const shouldTransition = await evaluateTransitionExpression(rule.expression, runtimeState);
                if (shouldTransition) {
                    await performStateTransition(policy, currentState, rule.target_state, runtimeState);
                    return;
                }
            } catch (error) {
                console.error(`转换条件检查失败: ${rule.expression}`, error);
            }
        }
    }
}

async function performStateTransition(policy, fromState, toStateName, runtimeState) {
    const toState = policy.states.find(s => s.name === toStateName);
    if (!toState) {
        console.error(`目标状态 ${toStateName} 不存在`);
        return;
    }
    console.log(`策略 ${policy.name} 状态转换: ${fromState.name} -> ${toStateName}`);
    await executeStateActions(policy, fromState, 'exit', runtimeState);
    runtimeState.current_state = toStateName;
    runtimeState.last_execution_time = Date.now();
    await executeStateActions(policy, toState, 'enter', runtimeState);
}

async function executeDeviceAction(device, action) {
    try {
        const deviceModule = await import('../../device/server/device_management_module.js');
        let methodName;
        let params = { device_name: device };
        const actionLower = action.toLowerCase();
        if (actionLower.includes('打开') || actionLower.includes('开启') || actionLower.includes('open')) {
            methodName = 'open_device';
        } else if (actionLower.includes('关闭') || actionLower.includes('close')) {
            methodName = 'close_device';
        } else if (actionLower.includes('读取') || actionLower.includes('检查') || actionLower.includes('启动') || 
                   actionLower.includes('监测') || actionLower.includes('read') || actionLower.includes('check')) {
            methodName = 'readout_device';
        } else if (actionLower.includes('模拟') || actionLower.includes('mock')) {
            methodName = 'mock_readout';
            params.value = 1;
        } else {
            throw new Error(`未知的动作: ${action}`);
        }
        const result = await deviceModule.default.methods[methodName].func(params);
        console.log(`设备动作执行成功: ${device} -> ${action}`, result);
        return result;
    } catch (error) {
        console.error(`设备动作执行异常: ${device} -> ${action}`, error);
        throw error;
    }
}

async function evaluateAssignmentExpression(expression, runtimeState) {
    try {
        // 导入安全的 AST 表达式求值器
        const evaluator = (await import('../lib/ast_expression_evaluator.js')).default;
        
        // 简化的上下文，只包含基本数据
        const context = {
            ...Object.fromEntries(runtimeState.variables),
            sensors: await getSensorData(),
            devices: await getDeviceStatus(),
            Date: Date,
            Math: Math,
            abs: Math.abs,
            max: Math.max,
            min: Math.min,
            round: Math.round,
            floor: Math.floor,
            ceil: Math.ceil,
            sqrt: Math.sqrt,
            pow: Math.pow,
            sin: Math.sin,
            cos: Math.cos,
            tan: Math.tan,
            log: Math.log,
            exp: Math.exp
        };
        
        // 使用安全的 AST 求值器
        const result = evaluator.evaluate(expression, context);
        return result;
    } catch (error) {
        console.error(`赋值表达式求值失败: ${expression}`, error);
        return null;
    }
}

async function evaluateTransitionExpression(expression, runtimeState) {
    try {
        // 导入安全的 AST 表达式求值器
        const evaluator = (await import('../lib/ast_expression_evaluator.js')).default;
        
        // 简化的上下文，只包含基本数据
        const context = {
            ...Object.fromEntries(runtimeState.variables),
            sensors: await getSensorData(),
            devices: await getDeviceStatus(),
            Date: Date,
            Math: Math,
            abs: Math.abs,
            max: Math.max,
            min: Math.min,
            round: Math.round,
            floor: Math.floor,
            ceil: Math.ceil
        };
        
        // 使用安全的 AST 求值器
        const result = evaluator.evaluate(expression, context);
        console.log(`表达式求值: ${expression} = ${result}`);
        return Boolean(result);
    } catch (error) {
        console.error(`表达式求值失败: ${expression}`, error);
        return false;
    }
}

async function getSensorData() {
    try {
        const deviceModule = await import('../../device/server/device_management_module.js');
        const result = await deviceModule.default.methods.list_device.func({});
        const sensors = {};
        if (result && result.devices) {
            for (const device of result.devices) {
                try {
                    const deviceData = await deviceModule.default.methods.readout_device.func({
                        device_name: device.device_name
                    });
                    if (deviceData && deviceData.readout !== undefined) {
                        sensors[device.device_name] = deviceData.readout;
                    }
                } catch (deviceError) {
                    console.warn(`获取设备 ${device.device_name} 数据失败:`, deviceError.message);
                    sensors[device.device_name] = 0;
                }
            }
        }
        return sensors;
    } catch (error) {
        console.error('获取传感器数据失败:', error);
        return {};
    }
}

async function getDeviceStatus() {
    try {
        const deviceModule = await import('../../device/server/device_management_module.js');
        const result = await deviceModule.default.methods.list_device.func({});
        const devices = {};
        if (result && result.devices) {
            for (const device of result.devices) {
                try {
                    const deviceData = await deviceModule.default.methods.readout_device.func({
                        device_name: device.device_name
                    });
                    if (deviceData && deviceData.readout !== undefined) {
                        devices[device.device_name] = deviceData.readout > 0 ? 1 : 0;
                    }
                } catch (deviceError) {
                    console.warn(`获取设备 ${device.device_name} 状态失败:`, deviceError.message);
                    devices[device.device_name] = 0;
                }
            }
        }
        return devices;
    } catch (error) {
        console.error('获取设备状态失败:', error);
        return {};
    }
}