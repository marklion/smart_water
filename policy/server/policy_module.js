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

import deviceModule, { get_driver } from '../../device/server/device_management_module.js';

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


// 设备操作接口 - 直接使用已导入的模块
async function getDriverFunction() {
    return get_driver;
}

// 验证设备存在性和动作能力
async function validateDeviceAction(device_name, action) {
    try {
        // 获取设备列表
        const deviceResult = await deviceModule.methods.list_device.func({ pageNo: 0 });

        if (!deviceResult || !deviceResult.devices) {
            throw { err_msg: '无法获取设备列表' };
        }

        const deviceInfo = deviceResult.devices.find(d => d.device_name === device_name);
        if (!deviceInfo) {
            throw { err_msg: `设备 ${device_name} 不存在` };
        }

        // 解析设备能力
        let capabilities = [];
        try {
            capabilities = JSON.parse(deviceInfo.capability);
        } catch (e) {
            throw { err_msg: `设备 ${device_name} 的能力配置无效` };
        }

        // 直接检查动作是否在设备能力中
        if (!capabilities.includes(action)) {
            throw { err_msg: `设备 ${device_name} 不支持动作 ${action}，设备支持的能力: ${capabilities.join(', ')}` };
        }

        return true;
    } catch (error) {
        if (error.err_msg) {
            throw error;
        }
        throw { err_msg: `验证设备动作失败: ${error.message}` };
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
                        name: { type: String, mean: '策略名称', example: '策略1' },
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
        del_policy: {
            name: '删除策略',
            description: '删除一个策略',
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
                    // 先验证策略是否存在
                    validatePolicyExists(body.name);

                    if (findAndRemoveByName(policy_array, body.name)) {
                        return { result: true };
                    } else {
                        throw {
                            err_msg: '策略删除失败',
                        }
                    }
                } catch (error) {
                    // 确保异常被正确抛出
                    throw error;
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
                                        expression: { type: String, mean: '转移条件表达式', example: 's.cur_pressure <= 40' },
                                        is_constant: { type: Boolean, mean: '是否为常量表达式', example: true }
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

                const removed = findAndRemoveFromArray(policy.states, s => s.name === body.state_name);
                if (!removed) {
                    throw { err_msg: '状态删除失败' };
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
                        name: { type: String, mean: '状态名称', example: 's1' },
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
                                        expression: { type: String, mean: '转移条件表达式', example: 's.cur_pressure <= 40' },
                                        is_constant: { type: Boolean, mean: '是否为常量表达式', example: true }
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
                                expression: { type: String, mean: '赋值表达式', example: 's.temperature + 10' },
                                is_constant: { type: Boolean, mean: '是否为常量表达式', example: true },
                                target_policy_name: { type: String, mean: '目标策略名称', example: '策略2' },
                            }
                        },
                        do_assignments: {
                            type: Array,
                            mean: '状态内赋值表达式列表',
                            explain: {
                                variable_name: { type: String, mean: '变量名', example: 'temp' },
                                expression: { type: String, mean: '赋值表达式', example: 's.temperature + 10' },
                                is_constant: { type: Boolean, mean: '是否为常量表达式', example: true },
                                target_policy_name: { type: String, mean: '目标策略名称', example: '策略2' },
                            }
                        },
                        exit_assignments: {
                            type: Array,
                            mean: '离开状态赋值表达式列表',
                            explain: {
                                variable_name: { type: String, mean: '变量名', example: 'temp' },
                                expression: { type: String, mean: '赋值表达式', example: 's.temperature + 10' },
                                is_constant: { type: Boolean, mean: '是否为常量表达式', example: true },
                                target_policy_name: { type: String, mean: '目标策略名称', example: '策略2' },
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

                // 验证设备存在性和动作能力
                await validateDeviceAction(body.device, body.action);

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

                const removed = findAndRemoveFromArray(state.transformers, t => t.name === body.transformer_name);
                if (!removed) {
                    throw { err_msg: '转换器删除失败' };
                }
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
                expression: { type: String, mean: '转移条件表达式', example: 's.cur_pressure <= 40', have_to: true },
                is_constant: { type: Boolean, mean: '是否为常量表达式', example: true, have_to: false }
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
                    expression: body.expression,
                    is_constant: body.is_constant || false
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
                    throw { err_msg: '转换器规则列表不存在' };
                }

                // 验证规则是否存在
                const ruleExists = transformer.rules.some(rule => rule.target_state === body.target_state);
                if (!ruleExists) {
                    throw { err_msg: `转换器规则不存在: 目标状态 ${body.target_state}` };
                }

                const removed = findAndRemoveFromArray(transformer.rules, rule =>
                    rule.target_state === body.target_state
                );

                if (!removed) {
                    throw { err_msg: '转换器规则删除失败' };
                }
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

                // 验证设备是否存在
                await validateDeviceAction(body.device, body.action);

                let actionList = getActionList(state, body.trigger, true);

                // 验证动作是否存在
                const actionExists = actionList.some(a => a.device === body.device && a.action === body.action);
                if (!actionExists) {
                    throw { err_msg: `动作不存在: 设备 ${body.device} 执行 ${body.action}` };
                }

                let actionRemoved = findAndRemoveFromArray(actionList,
                    a => a.device === body.device && a.action === body.action);

                if (!actionRemoved) {
                    throw { err_msg: '动作删除失败' };
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
                target_policy_name: { type: String, mean: '目标策略名称', example: '策略2', have_to: false },
                is_constant: { type: Boolean, mean: '是否为常量表达式', example: true, have_to: false }
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
                        target_policy_name: body.target_policy_name,
                        is_constant: body.is_constant || false
                    });
                } else {
                    // 策略内赋值逻辑
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
                        expression: body.expression,
                        is_constant: body.is_constant || false
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

                // 验证赋值表达式是否存在
                let assignmentExists;
                if (body.target_policy_name) {
                    // 跨策略赋值验证
                    assignmentExists = assignmentList.some(a =>
                        a.variable_name === body.variable_name && a.target_policy_name === body.target_policy_name);
                } else {
                    // 策略内赋值验证
                    assignmentExists = assignmentList.some(a => a.variable_name === body.variable_name);
                }

                if (!assignmentExists) {
                    const assignmentType = body.target_policy_name ? '跨策略赋值表达式' : '赋值表达式';
                    throw { err_msg: `${assignmentType}不存在: 变量 ${body.variable_name}` };
                }

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
                    throw { err_msg: '赋值表达式删除失败' };
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

                // 验证数据源是否存在
                const sourceExists = sources.some(s => s.name === body.name);
                if (!sourceExists) {
                    throw { err_msg: `数据源 ${body.name} 不存在` };
                }

                const removed = findAndRemoveFromArray(sources, s => s.name === body.name);
                if (!removed) {
                    throw { err_msg: '数据源删除失败' };
                }
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
        set_init_state: {
            name: '设置初始状态',
            description: '为策略设置初始状态，而不是第一个状态',
            is_write: true,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
                state_name: { type: String, mean: '初始状态名称', example: 's1', have_to: true }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                let policy = validatePolicyExists(body.policy_name);
                validateStateExists(policy, body.state_name);

                // 设置初始状态
                policy.init_state = body.state_name;

                return { result: true };
            }
        },
        get_init_state: {
            name: '获取初始状态',
            description: '获取策略的初始状态配置',
            is_write: false,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true }
            },
            result: {
                init_state: { type: String, mean: '初始状态名称', example: 's1' }
            },
            func: async function (body, token) {
                let policy = validatePolicyExists(body.policy_name);
                return { init_state: policy.init_state || null };
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
        // 确定初始状态：必须使用设置的初始状态
        let initialStateName;
        let initialState;

        if (policy.init_state) {
            initialStateName = policy.init_state;
            initialState = policy.states.find(s => s.name === policy.init_state);
            if (!initialState) {
                console.error(`策略 ${policy.name} 的初始状态 ${policy.init_state} 不存在，策略无法启动`);
                return; // 如果初始状态不存在，直接返回，不启动策略
            }
        } else {
            console.error(`策略 ${policy.name} 没有设置初始状态，策略无法启动`);
            return; // 如果没有设置初始状态，直接返回，不启动策略
        }

        runtimeState = {
            current_state: initialStateName,
            variables: new Map(),
            last_execution_time: Date.now(),
            start_time: Date.now(),
            execution_count: 0,
            is_first_execution: true, // 标记是否为第一次执行
            // 策略执行逻辑：先检查状态转换，需要转换就直接结束当前周期
            executePolicyCycle: async function(policy, currentState) {
                console.log(`策略 ${policy.name} 执行第${this.execution_count}次，当前状态: ${this.current_state}，运行时间: ${this.runtime}`);

                // 如果是第一次执行，先执行初始状态的enter动作
                if (this.is_first_execution) {
                    console.log(`策略 ${policy.name} 第一次执行，执行初始状态 ${this.current_state} 的enter动作`);
                    await executeStateActions(policy, currentState, 'enter', this);
                    this.is_first_execution = false;
                }

                // 先检查是否需要状态转换，如果需要转换就直接转换并结束当前执行周期
                const transitionResult = await checkStateTransitions(policy, currentState, this);
                if (transitionResult) {
                    // 发生了状态转换，直接结束当前策略的执行周期（就像到晚饭时间不饿就直接跳过今天）
                    return true; // 返回 true 表示发生了状态转换，需要结束当前周期
                }

                // 没有状态转换，继续执行当前状态的 do 动作
                await executeStateActions(policy, currentState, 'do', this);
                return false; // 返回 false 表示没有状态转换，正常执行完成
            },
            // 获取数据源读数的函数
            getSource: async function(sourceName) {
                try {
                    // 验证数据源是否存在
                    if (!policy.sources || policy.sources.length === 0) {
                        throw new Error(`策略 ${policy.name} 中没有定义任何数据源`);
                    }

                    const source = policy.sources.find(s => s.name === sourceName);
                    if (!source) {
                        throw new Error(`数据源 ${sourceName} 在策略 ${policy.name} 中不存在`);
                    }

                    // 获取设备读数
                    const getDriver = await getDriverFunction();
                    const driver = await getDriver(source.device, 'readout');
                    const readout = await driver.readout();
                    const deviceData = { readout };

                    if (deviceData && deviceData.readout !== undefined) {
                        console.log(`获取数据源 ${sourceName} 的读数: ${deviceData.readout}`);
                        return deviceData.readout;
                    } else {
                        console.warn(`数据源 ${sourceName} 的读数获取失败，返回默认值 0`);
                        return 0;
                    }
                } catch (error) {
                    console.error(`获取数据源 ${sourceName} 读数失败:`, error.message);
                    return 0; // 出错时返回默认值 0
                }
            }
        };
        policy_runtime_states.set(policy.name, runtimeState);
        console.log(`策略 ${policy.name} 初始化，进入状态: ${runtimeState.current_state}`);
        await executeStateActions(policy, initialState, 'enter', runtimeState);
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

    // 使用封装的策略执行逻辑（吃饭形式）
    const hasTransition = await runtimeState.executePolicyCycle(policy, currentState);
    if (hasTransition) {
        // 发生了状态转换，直接结束当前策略的执行周期
        return;
    }
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
        return false; // 没有转换器，返回 false 表示没有发生状态转换
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
                    return true; // 发生了状态转换，返回 true
                }
            } catch (error) {
                console.error(`转换条件检查失败: ${rule.expression}`, error);
            }
        }
    }
    return false; // 没有满足转换条件，返回 false 表示没有发生状态转换
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
        const getDriver = await getDriverFunction();
        let result;

        if (action === 'open') {
            const driver = await getDriver(device, 'open');
            result = await driver.open();
        } else if (action === 'close') {
            const driver = await getDriver(device, 'close');
            result = await driver.close();
        } else if (action === 'readout') {
            const driver = await getDriver(device, 'readout');
            const readout = await driver.readout();
            result = { readout };
        } else if (action === 'mock_readout') {
            const driver = await getDriver(device, 'mock_readout');
            result = await driver.mock_readout(1);
        } else {
            throw new Error(`未知的动作: ${action}`);
        }

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
            getSource: runtimeState.getSource.bind(runtimeState), // 添加 getSource 函数
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
            getSource: runtimeState.getSource.bind(runtimeState), // 添加 getSource 函数
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
        // 获取设备列表
        const result = await deviceModule.methods.list_device.func({});
        const sensors = {};

        if (result && result.devices) {
            const getDriver = await getDriverFunction();
            for (const device of result.devices) {
                try {
                    const driver = await getDriver(device.device_name, 'readout');
                    const readout = await driver.readout();
                    sensors[device.device_name] = readout;
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
        // 获取设备列表
        const result = await deviceModule.methods.list_device.func({});
        const devices = {};

        if (result && result.devices) {
            const getDriver = await getDriverFunction();
            for (const device of result.devices) {
                try {
                    const driver = await getDriver(device.device_name, 'readout');
                    const readout = await driver.readout();
                    devices[device.device_name] = readout > 0 ? 1 : 0;
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