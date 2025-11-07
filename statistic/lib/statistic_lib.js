import call_remote from '../../public/lib/call_remote.js';
export default {
    list_all_items: async function (token) {
        let ret = [];
        let pageNo = 0;
        while (true) {
            let result = await this.list_items(pageNo, token);
            if (result.items.length === 0) {
                break;
            }
            ret = ret.concat(result.items);
            pageNo++;
        }
        return ret;
    },
    update_item: async function (item_name, value, is_increment, token) {
        return await call_remote('/statistic/update_item', { item_name, value, is_increment }, token);
    },
    list_items: async function (pageNo, token) {
        return await call_remote('/statistic/list_items', { pageNo }, token);
    },
    list_item_history: async function (item_name, pageNo, token) {
        return await call_remote('/statistic/list_item_history', { item_name, pageNo }, token);
    },
}