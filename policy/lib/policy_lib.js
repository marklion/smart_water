import call_remote from '../../public/lib/call_remote.js';
export default {
    add_policy: async function (name, token) {
        return await call_remote('/policy/add_policy', { name }, token);
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
    }
}