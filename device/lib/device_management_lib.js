import call_remote from '../../public/lib/call_remote.js';
export default{
    get_driver_list: async function (token, pageNo = 0) {
        return await call_remote('/device_management/list_driver', { pageNo }, token);
    },
    add_device: async function (device_name, driver_name, config_key, farm_name, block_name, token) {
        return await call_remote('/device_management/add_device', {
            device_name: String(device_name),
            driver_name: String(driver_name),
            config_key: String(config_key),
            farm_name: String(farm_name),
            block_name: String(block_name),
        }, token);
    },
    del_device: async function (device_name, token) {
        return await call_remote('/device_management/del_device', { device_name }, token);
    },
    list_device: async function (pageNo, farm_name, block_name, token) {
        return await call_remote('/device_management/list_device', { pageNo, farm_name, block_name }, token);
    },
    open_device: async function (device_name, token) {
        return await call_remote('/device_management/open_device', { device_name }, token);
    },
    close_device: async function (device_name, token) {
        return await call_remote('/device_management/close_device', { device_name }, token);
    },
    readout_device: async function (device_name, token) {
        return await call_remote('/device_management/readout_device', { device_name }, token);
    },
    mock_readout: async function (device_name, value, token) {
        return await call_remote('/device_management/mock_readout', { device_name, value }, token);
    },
}