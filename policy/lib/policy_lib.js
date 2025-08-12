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
    }
}