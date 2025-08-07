const driver_array = [
    {
        name: '虚拟设备',
        config_method: '[log_file]'
    }
];
const device_array = []
export default {
    name: 'device_management',
    description: '设备管理',
    methods: {
        list_driver: {
            name: '列出驱动',
            description: '列出所有驱动',
            is_write: false,
            is_get_api: true,
            params: {
            },
            result: {
                drivers: {
                    type: Array,
                    mean: '驱动列表',
                    explain: {
                        name: { type: String, mean: '驱动名称', example:'常闭电磁阀' },
                        config_method: { type: String, mean: '配置方法', example:'<ip> <port> <id>' }
                    }
                },
            },
            func: async function (body, token) {
                let current_page_content = driver_array.slice(body.pageNo * 20, (body.pageNo + 1) * 20);
                return {
                    drivers: current_page_content,
                    total: driver_array.length,
                }
            },
        },
        add_device:{
            name: '添加设备',
            description: '添加新设备',
            is_write: true,
            is_get_api: false,
            params: {
                device_name:{ type: String, have_to:true, mean: '设备名称', example:'虚拟设备1' },
                driver_name: { type: String, have_to:true, mean: '驱动名称', example:'虚拟设备' },
                config_key:{ type: String, have_to:true, mean: '配置json', example:'log_file' },
                farm_name: { type: String, have_to:false, mean: '所属农场', example:'农场1' },
                block_name: { type: String, have_to:false, mean: '所属区块', example:'区块1' },
            },
            result: {
                result: { type: Boolean, mean: '添加结果', example: true }
            },
            func: async function (body, token) {
                if (driver_array.find(driver => driver.name === body.driver_name) === undefined) {
                    throw {err_msg:'驱动不存在'};
                }
                let exist_device = device_array.find(device => device.name === body.device_name);
                if (!exist_device) {
                    exist_device = {
                        device_name: body.device_name,
                    }
                    device_array.push(exist_device);
                }
                exist_device.driver_name = body.driver_name;
                exist_device.config_key = body.config_key;
                if (body.farm_name && body.block_name) {
                    exist_device.block_name = body.block_name;
                    exist_device.farm_name = body.farm_name;
                }
                return { result: true };
            }
        },
        del_device: {
            name: '删除设备',
            description: '删除指定设备',
            is_write: true,
            is_get_api: false,
            params: {
                device_name: { type: String, have_to: true, mean: '设备名称', example: '虚拟设备1' }
            },
            result: {
                result: { type: Boolean, mean: '删除结果', example: true }
            },
            func: async function (body, token) {
                let index = device_array.findIndex(device => device.device_name === body.device_name);
                if (index !== -1) {
                    device_array.splice(index, 1);
                    return { result: true };
                } else {
                    return { result: false };
                }
            }
        },
        list_device:{
            name: '列出设备',
            description: '列出所有设备',
            is_write: false,
            is_get_api: true,
            params: {
                farm_name: { type: String, have_to: false, mean: '农场名称', example: '农场1' },
                block_name: { type: String, have_to: false, mean: '区块名称', example: '区块1' },
            },
            result: {
                devices: {
                    type: Array,
                    mean: '设备列表',
                    explain: {
                        device_name: { type: String, mean: '设备名称', example:'虚拟设备1' },
                        driver_name: { type: String, mean: '驱动名称', example:'虚拟设备' },
                        config_key: { type: String, mean: '配置json', example:'log_file' },
                        farm_name: { type: String, mean: '所属农场', example:'农场1' },
                        block_name: { type: String, mean: '所属区块', example:'区块1' }
                    }
                },
            },
            func: async function (body, token) {
                let filtered_devices = [];
                device_array.forEach(device => {
                    if (body.farm_name && device.farm_name !== body.farm_name) return;
                    if (body.block_name && device.block_name !== body.block_name) return;
                    filtered_devices.push(device);
                });
                let current_page_content = filtered_devices.slice(body.pageNo * 20, (body.pageNo + 1) * 20);
                return {
                    devices: current_page_content,
                    total: filtered_devices.length,
                }
            }
        },
    }
}