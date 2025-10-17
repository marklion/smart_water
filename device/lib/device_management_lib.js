import call_remote from '../../public/lib/call_remote.js';
export default{
    get_driver_list: async function (token, pageNo = 0) {
        return await call_remote('/device_management/list_driver', { pageNo }, token);
    },
    add_device: async function (deviceConfig, token) {
        const {
            device_name,
            driver_name,
            config_key,
            longitude,
            latitude,
            farm_name,
            block_name
        } = deviceConfig;

        return await call_remote('/device_management/add_device', {
            device_name: device_name,
            driver_name: driver_name,
            config_key: config_key,
            longitude: Number.parseFloat(longitude),
            latitude: Number.parseFloat(latitude),
            farm_name: farm_name,
            block_name: block_name,
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