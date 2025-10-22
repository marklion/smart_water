import call_remote from '../../public/lib/call_remote.js';
export default {
    update_item: async function (item_name, value, token) {
        return await call_remote('/statistic/update_item', { item_name, value }, token);
    },
    list_items: async function (pageNo, token) {
        return await call_remote('/statistic/list_items', { pageNo }, token);
    },
    list_item_history: async function (item_name, pageNo, token) {
        return await call_remote('/statistic/list_item_history', { item_name, pageNo }, token);
    },
}