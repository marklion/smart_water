import virtual_driver from './driver/virtual_driver.js';
const driver_array = [
    {
        name: 'virtualDevice',
        config_method: '[log_file]',
        capability: [
            'open', 'close', 'readout', 'mock_readout',
            'is_opened', 'status_map', 'shutdown'],
        driver: virtual_driver,
    }
];
export async function get_driver(device_name, capability) {
    let device = device_array.find(device => device.device_name === device_name);
    if (!device) {
        throw { err_msg: '设备不存在' };
    }
    let driver_config = driver_array.find(driver => driver.name === device.driver_name);
    if (!driver_config) {
        throw { err_msg: '驱动不存在' };
    }
    if (driver_config.capability.indexOf(capability) === -1) {
        throw { err_msg: '驱动不支持该能力' };
    }

    // 使用设备名称作为缓存键，确保每个设备只有一个驱动实例
    const cache_key = device_name;
    if (!driver_instances.has(cache_key)) {
        const driver_instance = await driver_config.driver(device.config_key);
        driver_instances.set(cache_key, driver_instance);
    }

    return driver_instances.get(cache_key);
}
const device_array = []
const driver_instances = new Map() // 缓存驱动实例
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
                        name: { type: String, mean: '驱动名称', example: '常闭电磁阀' },
                        config_method: { type: String, mean: '配置方法', example: '<ip> <port> <id>' },
                        capability: { type: String, mean: '能力集', example: 'open, close, readout, mock_readout' },
                    }
                },
            },
            func: async function (body, token) {
                let current_page_content = driver_array.slice(body.pageNo * 20, (body.pageNo + 1) * 20).map(driver => {
                    return {
                        name: driver.name,
                        config_method: driver.config_method,
                        capability: JSON.stringify(driver.capability),
                    }
                });
                return {
                    drivers: current_page_content,
                    total: driver_array.length,
                }
            },
        },
        add_device: {
            name: '添加设备',
            description: '添加新设备',
            is_write: true,
            is_get_api: false,
            params: {
                device_name: { type: String, have_to: true, mean: '设备名称', example: 'virtualDevice1' },
                driver_name: { type: String, have_to: true, mean: '驱动名称', example: 'virtualDevice' },
                config_key: { type: String, have_to: true, mean: '配置json', example: 'log_file' },
                longitude: { type: Number, have_to: true, mean: '经度', example: 111.670801 },
                latitude: { type: Number, have_to: true, mean: '纬度', example: 40.818311 },
                farm_name: { type: String, have_to: false, mean: '所属农场', example: '农场1' },
                block_name: { type: String, have_to: false, mean: '所属区块', example: '区块1' },
            },
            result: {
                result: { type: Boolean, mean: '添加结果', example: true }
            },
            func: async function (body, token) {
                if (driver_array.find(driver => driver.name === body.driver_name) === undefined) {
                    throw { err_msg: '驱动不存在' };
                }

                // 验证必填的经度和纬度参数
                if (body.longitude === undefined || body.latitude === undefined) {
                    throw { err_msg: '经度和纬度是必填参数' };
                }

                // 验证坐标范围
                if (body.longitude < -180 || body.longitude > 180) {
                    throw { err_msg: '经度必须在-180到180之间' };
                }
                if (body.latitude < -90 || body.latitude > 90) {
                    throw { err_msg: '纬度必须在-90到90之间' };
                }

                let exist_device = device_array.find(device => device.device_name === body.device_name);
                if (!exist_device) {
                    exist_device = {
                        device_name: body.device_name,
                    }
                    device_array.push(exist_device);
                }
                exist_device.driver_name = body.driver_name;
                exist_device.config_key = body.config_key;
                exist_device.longitude = body.longitude;
                exist_device.latitude = body.latitude;
                if (body.farm_name) {
                    exist_device.farm_name = body.farm_name;
                }
                if (body.block_name) {
                    exist_device.block_name = body.block_name;
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
                device_name: { type: String, have_to: true, mean: '设备名称', example: 'virtualDevice1' }
            },
            result: {
                result: { type: Boolean, mean: '删除结果', example: true }
            },
            func: async function (body, token) {
                let index = device_array.findIndex(device => device.device_name === body.device_name);
                if (index === -1) {
                    throw { err_msg: `设备 ${body.device_name} 不存在` };
                }
                device_array.splice(index, 1);
                // 清理驱动实例缓存
                driver_instances.delete(body.device_name);
                return { result: true };
            }
        },
        list_device: {
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
                        device_name: { type: String, mean: '设备名称', example: 'virtualDevice1' },
                        driver_name: { type: String, mean: '驱动名称', example: 'virtualDevice' },
                        config_key: { type: String, mean: '配置json', example: 'log_file' },
                        capability: { type: String, mean: '能力集', example: '[]' },
                        farm_name: { type: String, mean: '所属农场', example: '农场1' },
                        block_name: { type: String, mean: '所属区块', example: '区块1' },
                        longitude: { type: Number, mean: '经度', example: 111.670801 },
                        latitude: { type: Number, mean: '纬度', example: 40.818311 },
                        runtime_info: {
                            type: Array, mean: '运行时信息', explain: {
                                title: { type: String, mean: '信息标题', example: '开关是否打开' },
                                text: { type: String, mean: '信息内容', example: 'true' },
                            }
                        },
                    }
                },
            },
            func: async function (body, token) {
                let filtered_devices = [];
                device_array.forEach(device => {
                    if (body.farm_name && device.farm_name !== body.farm_name) return;
                    if (body.block_name && device.block_name !== body.block_name) return;
                    let capability = [];
                    let driver_config = driver_array.find(driver => driver.name === device.driver_name);
                    if (driver_config) {
                        capability = driver_config.capability;
                    }
                    filtered_devices.push({
                        device_name: device.device_name,
                        driver_name: device.driver_name,
                        config_key: device.config_key,
                        capability: JSON.stringify(capability),
                        farm_name: device.farm_name || '',
                        block_name: device.block_name || '',
                        longitude: device.longitude || null,
                        latitude: device.latitude || null
                    });
                });
                let current_page_content = filtered_devices.slice(body.pageNo * 20, (body.pageNo + 1) * 20);
                for (let device_info of current_page_content) {
                    let single_driver = await get_driver(device_info.device_name, 'status_map');
                    if (single_driver) {
                        let sm = single_driver.status_map();
                        device_info.runtime_info = []
                        for (let item of sm) {
                            let tmp_runtime = {
                                title: item.text,
                            }
                            tmp_runtime.text = String(await single_driver[item.func]());
                            device_info.runtime_info.push(tmp_runtime);
                        }
                    }
                }
                return {
                    devices: current_page_content,
                    total: filtered_devices.length,
                }
            }
        },
        open_device: {
            name: '打开阀门',
            description: '打开指定设备的阀门',
            is_write: true,
            is_get_api: false,
            params: {
                device_name: { type: String, have_to: true, mean: '设备名称', example: 'virtualDevice1' }
            },
            result: {
                result: { type: Boolean, mean: '打开结果', example: true }
            },
            func: async function (body, token) {
                let driver = await get_driver(body.device_name, 'open');
                await driver.open();
                return { result: true };
            }
        },
        close_device: {
            name: '关闭阀门',
            description: '关闭指定设备的阀门',
            is_write: true,
            is_get_api: false,
            params: {
                device_name: { type: String, have_to: true, mean: '设备名称', example: 'virtualDevice1' }
            },
            result: {
                result: { type: Boolean, mean: '关闭结果', example: true }
            },
            func: async function (body, token) {
                let driver = await get_driver(body.device_name, 'close');
                await driver.close();
                return { result: true };
            }
        },
        mock_readout: {
            name: '模拟读数',
            description: '模拟设备读数',
            is_write: true,
            is_get_api: false,
            params: {
                device_name: { type: String, have_to: true, mean: '设备名称', example: 'virtualDevice1' },
                value: { type: Number, have_to: true, mean: '模拟读数值', example: 100 }
            },
            result: {
                result: { type: Boolean, mean: '模拟读数结果', example: true }
            },
            func: async function (body, token) {
                let driver = await get_driver(body.device_name, 'mock_readout');
                await driver.mock_readout(body.value);
                return { result: true };
            }
        },
        readout_device: {
            name: '读取设备示数',
            description: '读取指定设备的示数',
            is_write: false,
            is_get_api: false,
            params: {
                device_name: { type: String, have_to: true, mean: '设备名称', example: 'virtualDevice1' }
            },
            result: {
                readout: { type: Number, mean: '设备示数', example: 100 }
            },
            func: async function (body, token) {
                let driver = await get_driver(body.device_name, 'readout');
                let readout = await driver.readout();
                return { readout };
            },
        },
        shutdown_device: {
            name: '急停设备',
            description: '急停指定设备',
            is_write: true,
            is_get_api: false,
            params: {
                device_name: { type: String, have_to: true, mean: '设备名称', example: 'virtualDevice1' }
            },
            result: {
                result: { type: Boolean, mean: '急停结果', example: true }
            },
            func: async function (body, token) {
                let driver = await get_driver(body.device_name, 'shutdown');
                await driver.shutdown();
                return { result: true };
            }
        },
    }
}