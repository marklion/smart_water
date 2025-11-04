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
import warning_lib from '../../warning/lib/warning_lib.js';
import evaluator from '../lib/ast_expression_evaluator.js';
import policy_lib from '../lib/policy_lib.js';
import deviceModule, { get_driver } from '../../device/server/device_management_module.js';
import resource_lib from '../../resource/lib/resource_lib.js';
import statistic_lib from '../../statistic/lib/statistic_lib.js';
import cli_runtime from '../../public/cli/cli_runtime_lib.js';
let default_config_file = 'sw_cli_config.txt';
const policy_array = []

// 辅助函数：获取传感器数据
async function getSensorData() {
    // 返回空对象，避免运行时错误
    return {};
}

// 辅助函数：获取设备状态
async function getDeviceStatus() {
    // 返回空对象，避免运行时错误
    return {};
}

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

function make_watering_group_matrix_data(is_req) {
    let ret = {
        type: Array, mean: '轮灌组矩阵', explain: {
            key_name: { type: String, mean: '轮灌组变量名', example: 'group_id' },
            value_name: { type: String, mean: '轮灌组变量值', example: 'group_1' }
        }
    }
    if (is_req) {
        ret.have_to = false;
        ret.explain.key_name.have_to = true;
        ret.explain.value_name.have_to = true;
    }
    return ret;
}

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

// 解析并按顺序执行策略模板（templateSm）中的命令
async function applyTemplateSm(templateSm) {
    if (!templateSm || typeof templateSm !== 'string') return;
    const lines = templateSm.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let vp = null;
    for (const line of lines) {
        try {
            console.log(line);
            vp = await cli_runtime.do_config(vp, line);
        } catch (e) {
            console.log(e);
        }
    }
    try {
        await cli_runtime.save_config(default_config_file);
    } catch (e) {
        console.log('save_config failed:', e);
    }
    return vp;
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
function getWaterGroupVariable(matrix, key_name, runtime_state) {
    let ret = null;
    for (let item of matrix) {
        if (item.key_name === key_name && runtime_state) {
            ret = runtime_state.variables.get(item.value_name);
            break;
        }
    }

    return ret;
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
                name: { type: String, mean: '策略名称', example: '策略1', have_to: true }
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
                farm_name: { type: String, mean: '关联农场名称', example: '农场1', have_to: false },
            },
            result: {
                policies: {
                    type: Array, mean: '策略列表', explain: {
                        name: { type: String, mean: '策略名称', example: '策略1' },
                        farm_name: { type: String, mean: '关联农场名称', example: '农场1' },
                        init_variables: {
                            type: Array, mean: '初始化变量列表', explain: {
                                variable_name: { type: String, mean: '变量名', example: 'temp' },
                                expression: { type: String, mean: '赋值表达式', example: '25' },
                                is_constant: { type: Boolean, mean: '是否为常量表达式', example: true }
                            }
                        }
                    }
                }
            },
            func: async function (body, token) {
                let filtered_policies = policy_array.filter(policy => {
                    if (body.farm_name)
                        return policy.farm_name === body.farm_name;
                    else
                        return true;
                });
                let result = getPaginatedResult(filtered_policies, body.pageNo);
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
                        policy_runtime_states.delete(body.name);
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
                        warning_template: { type: String, mean: '告警模板', example: '温度过高' },
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
                                expression: { type: String, mean: '转移条件表达式', example: 's.cur_pressure <= 40' },
                                is_constant: { type: Boolean, mean: '是否为常量表达式', example: true }
                            }
                        },
                        statistic_items: {
                            type: Array,
                            mean: '统计项列表',
                            explain: {
                                item_name: { type: String, mean: '统计项名称', example: 'total_watered_volume' },
                                expression: { type: String, mean: '统计项表达式', example: 's.watered_volume + 100' },
                                target_state: { type: String, mean: '目标状态', example: 's2' }
                            }
                        },
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
        add_transformer_statistic_item:{
            name: '添加转换器统计项',
            description: '向转换器添加一个统计项',
            is_write: true,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
                state_name: { type: String, mean: '状态名称', example: 's1', have_to: true },
                transformer_name: { type: String, mean: '转换器名称', example: 't1', have_to: true },
                target_state: { type: String, mean: '目标状态', example: 's2', have_to: true },
                item_name: { type: String, mean: '统计项名称', example: 'total_watered_volume', have_to: true },
                expression: { type: String, mean: '统计项表达式', example: 's.watered_volume + 100', have_to: true }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                let policy = validatePolicyExists(body.policy_name);
                let state = validateStateExists(policy, body.state_name);
                let transformer = validateTransformerExists(state, body.transformer_name);
                let statistic_items = ensureArrayExists(transformer, 'statistic_items');
                addItemIfNotExists(statistic_items, {
                    item_name: body.item_name,
                    expression: body.expression,
                    target_state: body.target_state,
                }, item => item.item_name === body.item_name && item.target_state === body.target_state);
                return { result: true };
            }
        },
        del_transformer_statistic_item:{
            name: '删除转换器统计项',
            description: '从转换器中删除一个统计项',
            is_write: true,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
                state_name: { type: String, mean: '状态名称', example: 's1', have_to: true },
                transformer_name: { type: String, mean: '转换器名称', example: 't1', have_to: true },
                item_name: { type: String, mean: '统计项名称', example: 'total_watered_volume', have_to: true },
                target_state: { type: String, mean: '目标状态', example: 's2', have_to: true },
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                let policy = validatePolicyExists(body.policy_name);
                let state = validateStateExists(policy, body.state_name);
                let transformer = validateTransformerExists(state, body.transformer_name);
                let statistic_items = ensureArrayExists(transformer, 'statistic_items');
                let itemRemoved = findAndRemoveFromArray(statistic_items,
                    item => item.item_name === body.item_name && item.target_state === body.target_state);
                if (!itemRemoved) {
                    throw { err_msg: '统计项删除失败' };
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
                if (body.state_name) {
                    validateStateExists(policy, body.state_name);
                }
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
        init_assignment: {
            name: '初始化策略变量赋值',
            description: '创建策略时给策略变量赋初值',
            is_write: true,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
                variable_name: { type: String, mean: '变量名', example: 'temp', have_to: true },
                expression: { type: String, mean: '赋值表达式', example: '25', have_to: true },
                is_constant: { type: Boolean, mean: '是否为常量表达式', example: true, have_to: false }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                try {
                    let policy = validatePolicyExists(body.policy_name);

                    // 确保策略有初始化变量存储
                    if (!policy.init_variables) {
                        policy.init_variables = [];
                    }

                    // 检查是否已存在相同变量名的初始化赋值
                    const existingAssignment = policy.init_variables.find(
                        a => a.variable_name === body.variable_name
                    );

                    if (existingAssignment) {
                        throw { err_msg: `变量 ${body.variable_name} 的初始化赋值已存在` };
                    }

                    // 添加初始化变量赋值
                    policy.init_variables.push({
                        variable_name: body.variable_name,
                        expression: body.expression,
                        is_constant: body.is_constant || false
                    });

                    return { result: true };
                } catch (error) {
                    throw {
                        err_msg: error.err_msg || '初始化变量赋值失败'
                    };
                }
            }
        },
        undo_init_assignment: {
            name: '删除所有初始化变量赋值',
            description: '删除策略的所有初始化变量赋值',
            is_write: true,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                try {
                    // 查找策略，如果不存在则直接返回成功（可能已被删除）
                    let policy = policy_array.find(p => p.name === body.policy_name);
                    if (!policy) {
                        return { result: true };
                    }

                    // 清空初始化变量数组
                    policy.init_variables = [];

                    return { result: true };
                } catch (error) {
                    throw {
                        err_msg: error.err_msg || '删除初始化变量赋值失败'
                    };
                }
            }
        },
        runtime_assignment: {
            name: '运行时策略变量赋值',
            description: '直接给某个策略的某个变量赋值',
            is_write: true,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
                variable_name: { type: String, mean: '变量名', example: 'temp', have_to: true },
                expression: { type: String, mean: '赋值表达式', example: '30', have_to: true },
                is_constant: { type: Boolean, mean: '是否为常量表达式', example: true, have_to: false }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                try {
                    // 验证策略是否存在
                    validatePolicyExists(body.policy_name);

                    // 获取或创建策略的运行时状态
                    let runtimeState = policy_runtime_states.get(body.policy_name);
                    if (!runtimeState) {
                        // 如果策略还没有运行时状态，创建一个基本的运行时状态
                        runtimeState = {
                            current_state: null,
                            variables: new Map(),
                            last_execution_time: Date.now(),
                            start_time: Date.now(),
                            execution_count: 0,
                            is_first_execution: true
                        };
                        policy_runtime_states.set(body.policy_name, runtimeState);
                    }

                    // 计算表达式的值
                    let value;
                    if (body.is_constant) {
                        // 如果是常量表达式，直接解析
                        const numericValue = parseFloat(body.expression);
                        if (!isNaN(numericValue)) {
                            value = numericValue;
                        } else {
                            // 如果不是数字，尝试作为字符串处理
                            value = body.expression;
                        }
                    } else {
                        // 如果是动态表达式，先检查是否是简单的字符串字面量
                        if (body.expression.startsWith('"') && body.expression.endsWith('"') && body.expression.length > 2) {
                            // 如果是字符串字面量，直接使用
                            value = body.expression.slice(1, -1);
                        } else if (body.expression.includes('=') || body.expression.includes(' ')) {
                            // 如果包含赋值符号或空格，作为字符串处理（避免求值失败）
                            value = body.expression;
                        } else {
                            // 否则使用表达式求值器
                            try {
                                const evaluator = (await import('../lib/ast_expression_evaluator.js')).default;
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
                                value = await evaluator.evaluate(body.expression, context);
                            } catch (evalError) {
                                console.error(`表达式求值失败: ${body.expression}`, evalError);
                                throw { err_msg: `表达式求值失败: ${evalError.message}` };
                            }
                        }
                    }

                    // 设置变量值
                    runtimeState.variables.set(body.variable_name, value);
                    console.log(`策略 ${body.policy_name} 运行时变量赋值: ${body.variable_name} = ${value}`);

                    return { result: true };
                } catch (error) {
                    throw {
                        err_msg: error.err_msg || '运行时变量赋值失败'
                    };
                }
            }
        },
        get_policy_runtime: {
            name: '获取策略运行时状态',
            description: '获取策略的运行时状态信息',
            is_write: false,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true }
            },
            result: {
                current_state: { type: String, mean: '当前状态名称', example: 's1' },
                variables: { type: String, mean: '变量映射表', example: '{ temp: 25, humidity: 60 }' },
            },
            func: async function (body, token) {
                let ret = {};
                let runtimeState = policy_runtime_states.get(body.policy_name);
                if (runtimeState) {
                    ret.current_state = runtimeState.current_state;
                    // 将 Map 转换为普通对象后再序列化
                    ret.variables = JSON.stringify(Object.fromEntries(runtimeState.variables));
                }
                else {
                    throw { err_msg: `策略 ${body.policy_name} 的运行时状态不存在` };
                }

                return ret;
            }
        },
        set_state_warning: {
            name: '设置状态告警标记',
            description: '为策略状态设置或清除告警标记',
            is_write: true,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
                state_name: { type: String, mean: '状态名称', example: 's1', have_to: true },
                warning_template: { type: String, mean: '告警模板', example: '温度过高', have_to: false },
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                let policy = validatePolicyExists(body.policy_name);
                let state = validateStateExists(policy, body.state_name);
                if (body.warning_template) {
                    state.warning_template = body.warning_template;
                }
                else {
                    delete state.warning_template;
                }

                return { result: true };
            }
        },
        set_watering_group_matrix: {
            name: '设置轮灌组矩阵',
            description: '为策略设置轮灌组矩阵',
            is_write: true,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
                matrix: make_watering_group_matrix_data(true),
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                let policy = validatePolicyExists(body.policy_name);
                policy.watering_group_matrix = body.matrix;
                return { result: true };
            },
        },
        get_watering_group_matrix: {
            name: '获取轮灌组矩阵',
            description: '获取策略的轮灌组矩阵',
            is_write: false,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
            },
            result: {
                matrix: make_watering_group_matrix_data(false),
            },
            func: async function (body, token) {
                let policy = validatePolicyExists(body.policy_name);
                return { matrix: policy.watering_group_matrix || [] };
            },
        },
        list_watering_groups: {
            name: '列出轮灌组',
            description: '列出策略的所有轮灌组',
            is_write: false,
            is_get_api: true,
            params: {},
            result: {
                groups: {
                    type: Array, mean: '轮灌组列表', explain: {
                        name: { type: String, mean: '轮灌组名称', example: '组1' },
                        area: { type: Number, mean: '轮灌组面积', example: 100 },
                        method: { type: String, mean: '轮灌组灌溉方式', example: '滴灌' },
                        fert_rate: { type: Number, mean: '轮灌组施肥率(L/亩)', example: 1.5 },
                        total_water: { type: Number, mean: '轮灌组总用水量(L)', example: 5000 },
                        total_fert: { type: Number, mean: '轮灌组总施肥量(L)', example: 50 },
                        minute_left: { type: Number, mean: '轮灌组剩余分钟数', example: 30 },
                        cur_state: { type: String, mean: '轮灌组当前状态', example: '灌溉中' },
                        valves: { type: String, mean: '阀门设备名称（多个阀门用空格分隔的引号字符串）', example: '"阀门1" "阀门2"' },
                    }
                }
            },
            func: async function (body, token) {
                let groups = [];
                for (let policy of policy_array) {
                    if (policy.watering_group_matrix) {
                        let policy_runtime = policy_runtime_states.get(policy.name);
                        let valves_value = getWaterGroupVariable(policy.watering_group_matrix, 'valves', policy_runtime);
                        
                        // 如果没有 valves 键，尝试使用 water_valve 和 fert_valve 合并
                        if (!valves_value || valves_value === '-') {
                            const water_valve = getWaterGroupVariable(policy.watering_group_matrix, 'water_valve', policy_runtime);
                            const fert_valve = getWaterGroupVariable(policy.watering_group_matrix, 'fert_valve', policy_runtime);
                            
                            if (water_valve || fert_valve) {
                                // 去除引号并合并，格式：water_valve|fert_valve
                                const waterStr = water_valve ? String(water_valve).replace(/^"|"$/g, '') : '';
                                const fertStr = fert_valve ? String(fert_valve).replace(/^"|"$/g, '') : '';
                                
                                if (waterStr && fertStr) {
                                    valves_value = `${waterStr}|${fertStr}`;
                                } else if (waterStr) {
                                    valves_value = waterStr;
                                } else if (fertStr) {
                                    valves_value = fertStr;
                                }
                            }
                        }
                        
                        groups.push({
                            name: policy.name,
                            area: getWaterGroupVariable(policy.watering_group_matrix, 'area', policy_runtime),
                            method: getWaterGroupVariable(policy.watering_group_matrix, 'method', policy_runtime),
                            fert_rate: getWaterGroupVariable(policy.watering_group_matrix, 'fert_rate', policy_runtime),
                            total_water: getWaterGroupVariable(policy.watering_group_matrix, 'total_water', policy_runtime),
                            total_fert: getWaterGroupVariable(policy.watering_group_matrix, 'total_fert', policy_runtime),
                            minute_left: getWaterGroupVariable(policy.watering_group_matrix, 'minute_left', policy_runtime),
                            valves: valves_value || '-',
                            cur_state: policy_runtime ? policy_runtime.current_state : '未知',
                        });
                    }
                }
                let ret = {
                    groups: groups.slice(body.pageNo * 20, (body.pageNo + 1) * 20),
                    total: groups.length,
                }
                return ret;
            },
        },
        apply_wizard_groups: {
            name: '应用向导生成的轮灌组',
            description: '删除既有轮灌组策略，按向导JSON创建并初始化策略',
            is_write: true,
            is_get_api: false,
            params: {
                groups: {
                    type: Array, mean: '轮灌组配置数组', have_to: true, explain: {
                        name: { type: String, mean: '组名', example: 'l1', have_to: true },
                        area: { type: Number, mean: '面积(亩)', example: 23, have_to: true },
                        valves: { type: Array, mean: '阀门名称列表', example: ['v1','v2'], have_to: true, explain: {
                            item: { type: String, mean: '阀门名称', example: 'v1' }
                        } },
                        method: { type: String, mean: '施肥方式 AreaBased/Total/Time', example: 'AreaBased', have_to: true },
                        AB_fert: { type: Number, mean: '亩定量(L/亩)', example: 10, have_to: false },
                        total_fert: { type: Number, mean: '总定量(L)', example: 500, have_to: false },
                        fert_time: { type: Number, mean: '定时(小时)', example: 0.6, have_to: false },
                        pre_fert_time: { type: Number, mean: '肥前时间(小时)', example: 0, have_to: false },
                        post_fert_time: { type: Number, mean: '肥后时间(小时)', example: 0, have_to: false },
                    }
                },
                farm_name: { type: String, mean: '默认绑定的农场名称', example: '科技农场', have_to: false }
            },
            result: {
                result: { type: Boolean, mean: '是否成功', example: true }
            },
            func: async function (body, token) {
                // 1) 删除既有的“轮灌组策略”（约定：含有 watering_group_matrix 定义的策略）
                const toDelete = [];
                for (const p of policy_array) {
                    if (p.watering_group_matrix && p.watering_group_matrix.length > 0) {
                        toDelete.push(p.name);
                    }
                }
                for (const name of toDelete) {
                    try {
                        await policy_lib.del_policy(name, token);
                    } catch (e) {
                        // 兜底处理，避免残留
                        const removed = findAndRemoveByName(policy_array, name);
                        if (removed) {
                            policy_runtime_states.delete(name);
                        }
                    }
                }

                // 2) 创建并初始化新的策略
                const methodMap = {
                    AreaBased: '亩定量',
                    Total: '总定量',
                    Time: '定时'
                };

                for (const g of (body.groups || [])) {
                    // 通过 lib 创建策略
                    await policy_lib.add_policy(g.name, token);
                    const policy = validatePolicyExists(g.name);

                    

                    // 计算施肥率 fert_rate
                    let fert_rate = 0;
                    if (g.method === 'AreaBased') {
                        fert_rate = Number(g.AB_fert || 0);
                    } else if (g.method === 'Total') {
                        if (g.area > 0) fert_rate = Number((Number(g.total_fert || 0) / Number(g.area)).toFixed(2));
                    } else if (g.method === 'Time') {
                        if (g.fert_time > 0) fert_rate = Number((Number(g.area) / Number(g.fert_time)).toFixed(1));
                    }

                    // 拼接阀门名（以空格分隔的字符串数组字面量）: "v1" "v2"
                    const valvesExpr = (g.valves || []).map(v => `"${v}"`).join(' ');

					// 初始化变量（通过 lib 设置）
					await policy_lib.init_assignment(g.name, 'area', String(g.area), true, token);
					await policy_lib.init_assignment(g.name, 'method', `"${methodMap[g.method] || g.method}"`, false, token);
                    await policy_lib.init_assignment(g.name, 'fert_rate', String(fert_rate), true, token);
                    await policy_lib.init_assignment(g.name, 'fert_time', String(g.fert_time), true, token);
					await policy_lib.init_assignment(g.name, 'total_water', '0', true, token);
					await policy_lib.init_assignment(g.name, 'total_fert', '0', true, token);
					await policy_lib.init_assignment(g.name, 'minute_left', '0', true, token);
					await policy_lib.init_assignment(g.name, 'valves', valvesExpr || '""', true, token);
                    const preMs = Math.max(0, Number(g.pre_fert_time || 0)) * 3600000;
                    const fertMs = Math.max(0, Number(g.fert_time || 0)) * 3600000;
                    const postMs = Math.max(0, Number(g.post_fert_time || 0)) * 3600000;
					await policy_lib.init_assignment(g.name, 'pre_ms', String(preMs), true, token);
					await policy_lib.init_assignment(g.name, 'fert_ms', String(fertMs), true, token);
					await policy_lib.init_assignment(g.name, 'post_ms', String(postMs), true, token);

                    // 定义轮灌组矩阵：运行时变量与展示字段的映射（通过 lib 设置）
                    const matrix = [
                        { key_name: 'area', value_name: 'area' },
                        { key_name: 'method', value_name: 'method' },
                        { key_name: 'fert_rate', value_name: 'fert_rate' },
                        { key_name: 'total_water', value_name: 'total_water' },
                        { key_name: 'total_fert', value_name: 'total_fert' },
                        { key_name: 'minute_left', value_name: 'minute_left' },
                        { key_name: 'valves', value_name: 'valves' },
                    ];  
                    try { await policy_lib.set_watering_group_matrix(g.name, matrix, token); } catch (e) { policy.watering_group_matrix = matrix; }

                    // 绑定默认农场（如果传入）
                    if (body.farm_name) {
                        try { await policy_lib.match_policy_farm(g.name, body.farm_name, token); } catch (e) { policy.farm_name = body.farm_name; }
                    }
                    const farmLine = body.farm_name ? `\n                        match farm '${body.farm_name}'` : '';
                    const closeActions = (g.valves || []).map(v => `\n                        enter action '${v}' 'close'`).join('');
                    const openActions = (g.valves || []).map(v => `\n                        enter action '${v}' 'open'`).join('');
 					const templateSm = `policy
                        policy '${g.name}'
                        init assignment 'false' 'pre_ms' '${preMs}'
                        init assignment 'false' 'post_ms' '${postMs}'
                        init assignment 'false' '启动开关' 'false'
                        init assignment 'false' '需要跳过' 'false'
                        source 'flow_cumulative' '主管道流量计' 'total_readout'
                        state '空闲'${closeActions}
                        exit assignment 'false' '主管道流量累计值' 'await prs.getSource("flow_cumulative")'
                        transformer 'next'
                            rule 'false' '肥前' 'prs.variables.get("启动开关") == true'
                        return
                        return
                        state '肥前'${openActions}
                        enter crossAssignment 'false' '主策略' '${g.name}已启动' 'true'
                        do assignment 'false' 'tw' 'await prs.getSource("flow_cumulative") - prs.variables.get("主管道流量累计值")'
                        enter assignment 'false' 'enter_time' 'Date.now()'
                        transformer 'timeup'
                            rule 'false' '施肥' 'Date.now() - prs.variables.get("enter_time") > prs.variables.get("pre_ms")'
                            rule 'false' '收尾' 'prs.variables.get("需要跳过") == true'
                        return
                        return
                        state '施肥'
                        enter crossAssignment 'false' '施肥策略' '启动开关' 'true'
                        enter assignment 'false' 'enter_time' 'Date.now()'
                        exit crossAssignment 'false' '施肥策略' '启动开关' 'false'
                        do assignment 'false' 'tw' 'await prs.getSource("flow_cumulative") - prs.variables.get("主管道流量累计值")'
                        do assignment 'false' 'tf' 'prs.variables.get("fr")*((Date.now() - prs.variables.get("enter_time"))/1000)'
                        transformer 'timeup'
                            rule 'false' '肥后' 'Date.now() - prs.variables.get("enter_time") > prs.variables.get("fert_ms")'
                            rule 'false' '收尾' 'prs.variables.get("需要跳过") == true'
                            statistic '肥后' '${g.name}累计施肥量' 'prs.variables.get("tf")'
                            statistic '收尾' '${g.name}累计施肥量' 'prs.variables.get("tf")'
                        return
                        return
                        state '肥后'
                        exit action '主管道流量计' 'readout'
                        enter assignment 'false' 'enter_time' 'Date.now()'
                        do assignment 'false' 'tw' 'await prs.getSource("flow_cumulative") - prs.variables.get("主管道流量累计值")'
                        transformer 'timeup'
                            rule 'false' '收尾' 'Date.now() - prs.variables.get("enter_time") > prs.variables.get("post_ms")'
                            rule 'false' '收尾' 'prs.variables.get("需要跳过") == true'
                            statistic '收尾' '${g.name}累计供水量' 'tw'
                        return
                        return
                        state '收尾'
                        enter crossAssignment 'false' '主策略' '${g.name}已启动' 'false'
                        transformer 'next'
                            rule 'false' '空闲' 'prs.variables.get("启动开关") == false'
                        return
                        return
                        init state '空闲'${farmLine}
                    return`;
					// 将模板保存到策略对象，供后续下发/解析
					policy.template_sm = templateSm;
					// 逐行执行模板命令以落地配置
					try { await applyTemplateSm(templateSm); } catch (e) {}
                    
                    // 手动触发一次策略执行以初始化运行时状态
                    try {
                        await processPolicyExecution(policy);
                    } catch (e) {
                        console.error(`初始化策略 ${g.name} 运行时状态失败:`, e);
                    }
                }

                // 3) 
                return { result: true };
            }
        },
        match_policy_farm: {
            name: '匹配策略农场',
            description: '匹配农场和策略',
            is_write: false,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
                farm_name: { type: String, mean: '农场名称', example: '农场1', have_to: false },
            },
            result: {
                result: { type: Boolean, mean: '匹配结果', example: true }
            },
            func: async function (body, token) {
                let policy = validatePolicyExists(body.policy_name);
                if (policy) {
                    let all_farms = (await resource_lib.get_all_farms()).map(farm => farm.name);
                    if (body.farm_name) {
                        if (all_farms.includes(body.farm_name)) {
                            policy.farm_name = body.farm_name;
                        } else {
                            throw { err_msg: `农场 ${body.farm_name} 不存在` };
                        }
                    }
                    else {
                        policy.farm_name = null;
                    }
                }
                else {
                    throw { err_msg: `策略 ${body.policy_name} 不存在` };
                }

                return { result: true };
            }
        },
        get_matched_farm: {
            name: '获取匹配农场',
            description: '获取策略匹配的农场',
            is_write: false,
            is_get_api: false,
            params: {
                policy_name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
            },
            result: {
                farm_name: { type: String, mean: '农场名称', example: '农场1' }
            },
            func: async function (body, token) {
                let policy = validatePolicyExists(body.policy_name);
                return { farm_name: policy.farm_name || '' };
            }
        }
    }
};

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
            executePolicyCycle: async function (policy, currentState) {
                console.log(`策略 ${policy.name} 执行第${this.execution_count}次，当前状态: ${this.current_state}，运行时间: ${this.runtime}`);
                for (let variable of this.variables) {
                    console.log(`  变量 ${variable}`);
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
            getSource: async function (sourceName) {
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
                    const driver = await get_driver(source.device, 'readout');
                    const readout = await driver.readout();
                    const deviceData = { readout };

                    if (deviceData && deviceData.readout !== undefined) {
                        console.log(`获取数据源 ${sourceName} 的读数: ${deviceData.readout} (类型: ${typeof deviceData.readout})`);
                        // 确保返回数字类型
                        const numericValue = parseFloat(deviceData.readout);
                        console.log(`转换后的数值: ${numericValue} (类型: ${typeof numericValue})`);
                        return numericValue;
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

        // 应用初始化变量赋值
        if (policy.init_variables && policy.init_variables.length > 0) {
            for (const initVar of policy.init_variables) {
                try {
                    let value;
                    if (initVar.is_constant) {
                        // 如果是常量表达式，直接解析
                        const numericValue = parseFloat(initVar.expression);
                        if (!isNaN(numericValue)) {
                            value = numericValue;
                        } else {
                            // 如果不是数字，检查是否是多个引号字符串（如 "v1" "v2"）
                            // 如果是多个引号字符串，保留原始格式（用于 valves 等）
                            if (initVar.variable_name === 'valves') {
                                // valves 变量始终保留原始格式（带引号）
                                value = initVar.expression;
                            } else if (initVar.expression.includes('"') && initVar.expression.split('"').length > 3) {
                                // 多个引号字符串，保留原始格式
                                value = initVar.expression;
                            } else if (initVar.expression.startsWith('"') && initVar.expression.endsWith('"')) {
                                // 单个引号字符串，移除引号
                                value = initVar.expression.slice(1, -1);
                            } else {
                                // 普通字符串，直接使用
                                value = initVar.expression;
                            }
                        }
                    } else {
                        // 如果是动态表达式，使用表达式求值器
                        try {
                            const evaluator = (await import('../lib/ast_expression_evaluator.js')).default;
                            const context = {
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
                            value = await evaluator.evaluate(initVar.expression, context);
                        } catch (evalError) {
                            console.error(`初始化变量表达式求值失败: ${initVar.expression}`, evalError);
                            value = initVar.expression; // 出错时使用原始表达式
                        }
                    }
                    runtimeState.variables.set(initVar.variable_name, value);
                    console.log(`策略 ${policy.name} 初始化变量赋值: ${initVar.variable_name} = ${value}`);
                } catch (error) {
                    console.error(`初始化变量赋值失败: ${initVar.variable_name}`, error);
                }
            }
        }

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
                    let rs = runtimeState;
                    if (assignment.target_policy_name) {
                        // 跨策略赋值
                        let targetRuntimeState = policy_runtime_states.get(assignment.target_policy_name);
                        if (targetRuntimeState) {
                            rs = targetRuntimeState;
                        }
                    }
                    if (rs) {
                        rs.variables.set(assignment.variable_name, value);
                        console.log(`策略 ${policy.name} 状态 ${state.name} ${trigger} 赋值: ${assignment.variable_name} = ${value}`);
                    }
                    else {
                        console.error(`目标策略 ${assignment.target_policy_name} 的运行时状态不存在，无法赋值变量 ${assignment.variable_name}`);
                    }
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
        if (trigger == 'enter' && state.warning_template) {
            //产生告警
            let content = await evaluateAssignmentExpression(state.warning_template, runtimeState);
            await warning_lib.generate_warning(content);
        }
    } catch (error) {
        console.error(`执行状态动作失败: 策略=${policy.name}, 状态=${state.name}, 触发=${trigger}`, error);
    }
}

async function executeStatisticUpdate(target_state, transformer, runtimeState) {
    if (transformer.statistic_items) {
        let statistic_item = transformer.statistic_items.find(s => s.target_state === target_state);
        if (statistic_item) {
            let value = await evaluateAssignmentExpression(statistic_item.expression, runtimeState);
            await statistic_lib.update_item(statistic_item.item_name, String(value));
        }
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
                    await executeStatisticUpdate(rule.target_state, transformer, runtimeState);
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
        let result;

        if (action === 'open') {
            const driver = await get_driver(device, 'open');
            result = await driver.open();
        } else if (action === 'close') {
            const driver = await get_driver(device, 'close');
            result = await driver.close();
        } else if (action === 'readout') {
            const driver = await get_driver(device, 'readout');
            const readout = await driver.readout();
            result = { readout };
        } else if (action === 'mock_readout') {
            const driver = await get_driver(device, 'mock_readout');
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
        // 简化的上下文，只包含基本数据
        const context = {
            getSource: runtimeState.getSource.bind(runtimeState), // 添加 getSource 函数
            prs: runtimeState,
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
            exp: Math.exp,
            print: console.log
        };

        // 使用安全的 AST 求值器
        console.log(`表达式求值: ${expression}`);
        const result = await await evaluator.evaluate(expression, context);
        console.log(`表达式求值结果: ${result} (类型: ${typeof result})`);
        return result;
    } catch (error) {
        console.error(`赋值表达式求值失败: ${expression}`, error);
        return null;
    }
}

async function evaluateTransitionExpression(expression, runtimeState) {
    try {
        // 简化的上下文，只包含基本数据
        const context = {
            getSource: runtimeState.getSource.bind(runtimeState), // 添加 getSource 函数
            prs: runtimeState,
            Date: Date,
            Math: Math,
            abs: Math.abs,
            max: Math.max,
            min: Math.min,
            round: Math.round,
            floor: Math.floor,
            ceil: Math.ceil,
            print: console.log
        };

        // 使用安全的 AST 求值器
        const result = await evaluator.evaluate(expression, context);
        console.log(`表达式求值: ${expression} = ${result}`);
        return Boolean(result);
    } catch (error) {
        console.error(`表达式求值失败: ${expression}`, error);
        return false;
    }
}