import call_remote from '../../public/lib/call_remote.js';
export default {
    add_farm: async function (name, location, longitude, latitude, info, token) {
        return await call_remote('/resource/add_farm', { name, location, longitude, latitude, info }, token);
    },
    del_farm: async function (name, token) {
        return await call_remote('/resource/del_farm', { name }, token);
    },
    list_farm: async function (pageNo, token) {
        return await call_remote('/resource/list_farm', { pageNo }, token);
    },
    add_block: async function (farm_name, block_name, area, info, token) {
        return await call_remote('/resource/add_block', { farm_name, block_name, area, info }, token);
    },
    del_block: async function (farm_name, block_name, token) {
        return await call_remote('/resource/del_block', { farm_name, block_name }, token);
    },
    list_block: async function (farm_name, pageNo, token) {
        return await call_remote('/resource/list_block', { farm_name, pageNo }, token);
    },
    get_all_farms: async function () {
        let farms = [];
        let pageNo = 0;
        while (true) {
            let result = await this.list_farm(pageNo);
            if (result.farms.length === 0) {
                break;
            }
            farms = farms.concat(result.farms);
            pageNo++;
        }
        return farms;
    },
    set_farm_area_params: async function (farm_name, params, token) {
        return await call_remote('/resource/set_farm_area_params', { farm_name, ...params }, token);
    },
    get_farm_area_params: async function (farm_name, token) {
        return await call_remote('/resource/get_farm_area_params', { farm_name }, token);
    }
}