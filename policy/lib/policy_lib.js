import call_remote from '../../public/lib/call_remote.js';
export default {
    add_policy: async function (name, is_irrigation_group, token) {
        return await call_remote('/policy/add_policy', { name, is_irrigation_group }, token);
    },
    list_policy: async function (pageNo, token) {
        return await call_remote('/policy/list_policy', { pageNo }, token);
    },
    del_policy: async function (name, token) {
        return await call_remote('/policy/del_policy', { name }, token);
    },
    add_state: async function (policy_name, state_name, token) {
        return await call_remote('/policy/add_state', { policy_name, state_name }, token);
    },
    list_states: async function (policy_name, pageNo, token) {
        return await call_remote('/policy/list_states', { policy_name, pageNo }, token);
    },
    del_state: async function (policy_name, state_name, token) {
        return await call_remote('/policy/del_state', { policy_name, state_name }, token);
    },
    get_state: async function (policy_name, state_name, token) {
        return await call_remote('/policy/get_state', { policy_name, state_name }, token);
    },
    add_state_action: async function (policy_name, state_name, trigger, device, action, token) {
        return await call_remote('/policy/add_state_action', {
            policy_name,
            state_name,
            trigger,
            device,
            action
        }, token);
    },
    del_state_action: async function (policy_name, state_name, trigger, device, action, token) {
        return await call_remote('/policy/del_state_action', {
            policy_name,
            state_name,
            trigger,
            device,
            action
        }, token);
    },
    add_transformer: async function (policy_name, state_name, transformer_name, token) {
        return await call_remote('/policy/add_transformer', {
            policy_name,
            state_name,
            transformer_name
        }, token);
    },
    list_transformers: async function (policy_name, state_name, pageNo, token) {
        return await call_remote('/policy/list_transformers', {
            policy_name,
            state_name,
            pageNo
        }, token);
    },
    del_transformer: async function (policy_name, state_name, transformer_name, token) {
        return await call_remote('/policy/del_transformer', {
            policy_name,
            state_name,
            transformer_name
        }, token);
    },
    get_transformer: async function (policy_name, state_name, transformer_name, token) {
        return await call_remote('/policy/get_transformer', {
            policy_name,
            state_name,
            transformer_name
        }, token);
    },
    add_transformer_rule: async function (policy_name, state_name, transformer_name, target_state, expression, is_constant = false, token) {
        return await call_remote('/policy/add_transformer_rule', {
            policy_name,
            state_name,
            transformer_name,
            target_state,
            expression,
            is_constant
        }, token);
    },
    del_transformer_rule: async function (policy_name, state_name, transformer_name, target_state, token) {
        return await call_remote('/policy/del_transformer_rule', {
            policy_name,
            state_name,
            transformer_name,
            target_state
        }, token);
    },
    add_source: async function (policy_name, name, device, data_type, token) {
        return await call_remote('/policy/add_source', {
            policy_name,
            name,
            device,
            data_type
        }, token);
    },
    list_sources: async function (policy_name, pageNo, token) {
        return await call_remote('/policy/list_sources', { policy_name, pageNo }, token);
    },
    del_source: async function (policy_name, name, token) {
        return await call_remote('/policy/del_source', { policy_name, name }, token);
    },
    add_assignment: async function (policy_name, state_name, trigger, variable_name, expression, target_policy_name = null, is_constant = false, token) {
        const params = {
            policy_name,
            state_name,
            trigger,
            variable_name,
            expression,
            is_constant
        };

        // 如果是跨策略赋值，添加target_policy_name参数
        if (target_policy_name) {
            params.target_policy_name = target_policy_name;
        }

        return await call_remote('/policy/add_assignment', params, token);
    },
    del_assignment: async function (policy_name, state_name, trigger, variable_name, target_policy_name = null, token) {
        const params = {
            policy_name,
            state_name,
            trigger,
            variable_name
        };

        // 如果是跨策略赋值，添加target_policy_name参数
        if (target_policy_name) {
            params.target_policy_name = target_policy_name;
        }

        return await call_remote('/policy/del_assignment', params, token);
    },
    set_scan_period: async function (period_ms, token) {
        return await call_remote('/policy/set_scan_period', { period_ms }, token);
    },
    get_scan_period: async function (token) {
        return await call_remote('/policy/get_scan_period', {}, token);
    },
    set_init_state: async function (policy_name, state_name, token) {
        return await call_remote('/policy/set_init_state', { policy_name, state_name }, token);
    },
    get_init_state: async function (policy_name, token) {
        return await call_remote('/policy/get_init_state', { policy_name }, token);
    },
    // 轮灌组相关API
    get_irrigation_groups: async function (token) {
        return await call_remote('/policy/get_irrigation_groups', {}, token);
    },
    get_policy_runtime:async function(policy_name, token) {
        return await call_remote('/policy/get_policy_runtime', { policy_name }, token);
    },
}