import call_remote from '../../public/lib/call_remote.js';
export default{
    get_driver_list: async function (token, pageNo = 0) {
        return await call_remote('/device_management/list_driver', { pageNo }, token);
    },
    add_device: async function(device_name, driver_name, config_key, farm_name, block_name, token) {
        return await call_remote('/device_management/add_device', {
            device_name,
            driver_name,
            config_key,
            farm_name,
            block_name
        }, token);
    },
    del_device: async function(device_name, token) {
        return await call_remote('/device_management/del_device', { device_name }, token);
    },
    list_device: async function(pageNo,farm_name,block_name, token) {
        return await call_remote('/device_management/list_device', { pageNo,farm_name,block_name }, token);
    }
}