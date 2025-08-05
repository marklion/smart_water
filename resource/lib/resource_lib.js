import call_remote from '../../public/lib/call_remote.js';
export default {
    add_farm: async function (name, location, info, token) {
        return await call_remote('/resource/add_farm', { name, location, info }, token);
    },
    del_farm: async function (name, token) {
        return await call_remote('/resource/del_farm', { name }, token);
    },
    list_farm: async function (pageNo, token) {
        return await call_remote('/resource/list_farm', { pageNo }, token);
    },
    add_block: async function (farm_name, block_name, info, token) {
        return await call_remote('/resource/add_block', { farm_name, block_name, info }, token);
    },
    del_block: async function (farm_name, block_name, token) {
        return await call_remote('/resource/del_block', { farm_name, block_name }, token);
    },
    list_block: async function (farm_name, pageNo, token) {
        return await call_remote('/resource/list_block', { farm_name, pageNo }, token);
    },
}