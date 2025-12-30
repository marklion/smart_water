import virtual_driver from './driver/virtual_driver.js';
import DZ005 from './driver/DZ005.js';
import dijiang from './driver/dijiang.js';
import kfd9000 from './driver/kfd9000.js';
import modbus_relay from './driver/modbus_relay.js';
import mgg_znf from './driver/mgg_znf.js';
import BCP8R from './driver/BCP8R.js';
import XM9231B from './driver/XM9231B.js';
const driver_array = [
    {
        name: 'virtualDevice',
        config_method: '[log_file]',
        capability: [
            'open', 'close', 'readout', 'mock_readout','ava_readout','battery_voltage','set_key_const_value',
            'is_opened', 'status_map', 'shutdown', 'total_readout', 'mock_total_readout'],
        driver: virtual_driver,
    }, {
        name: 'WaterGroupValve',
        config_method: '{device_sn:<设备序列号>, is_left:<是否左阀>, poll_interval:<轮询间隔(ms)>, token:<鉴权token>}',
        capability: [
            'open', 'close', 'readout', 'battery_voltage',
            'is_opened', 'status_map', 'shutdown'],
        driver: DZ005,
    }, {
        name: 'WaterGroupValve_v2',
        config_method: '{outlet:<出水口序号>, broker_url:<MQTT服务器地址>, username:<MQTT用户名>, password:<MQTT密码>}',
        capability: [
            'open', 'close', 'readout',
            'is_opened', 'status_map', 'shutdown'],
        driver: mgg_znf,
    }, {
        name: 'FertFlowMeter',
        config_method: '{serial_path:<串口号>, baud_rate:<波特率>, device_id:<设备ID>, poll_interval:<轮询间隔(ms)>}',
        capability: [
            'readout', 'status_map', 'shutdown', 'ava_readout', 'set_key_const_value'],
        driver: dijiang,
    },{
        name:'WaterFlowMeter',
        config_method: '{serial_path:<串口号>, baud_rate:<波特率>, device_id:<设备ID>, poll_interval:<轮询间隔(ms)>}',
        capability: [
            'readout', 'total_readout', 'status_map', 'shutdown'],
        driver: kfd9000,
    }, {
        name:'PressureMeter',
        config_method: '{serial_path:<串口号>, baud_rate:<波特率>, device_id:<设备ID>, poll_interval:<轮询间隔(ms)>}',
        capability: [
            'readout', 'status_map', 'shutdown'],
        driver: BCP8R,
    },{
        name:'ModbusRelay',
        config_method: '{ip:<设备IP>, port:<设备端口>, device_id:<设备ID>, relay_address:<继电器地址>, poll_interval:<轮询间隔(ms)>}',
        capability: [
            'open', 'close','is_opened', 'status_map', 'shutdown'],
        driver: modbus_relay,
    },{
        name:'DistanceMeter',
        config_method: '{serial_path:<串口号>, baud_rate:<波特率>, device_id:<设备ID>, multiplier:<倍率>, poll_interval:<轮询间隔(ms)>}',
        capability: [
            'readout', 'status_map', 'shutdown'],
        driver: XM9231B,
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
    if (capability && driver_config.capability.indexOf(capability) === -1) {
        throw { err_msg: '驱动不支持该能力' };
    }

    // 使用设备名称作为缓存键，确保每个设备只有一个驱动实例
    const cache_key = device_name;
    if (!driver_instances.has(cache_key)) {
        // 构建驱动配置，包含设备类型信息
        const driver_config_obj = {
            log_file: device.config_key,
            device_type: device.device_type || 'valve', // 默认阀门类型
            device_name: device_name
        };
        let driver_arg = device.config_key;
        if (driver_config.name == 'virtualDevice') {
            driver_arg = driver_config_obj;
        }
        const driver_instance = await driver_config.driver(driver_arg);
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
                device_type: { type: String, have_to: false, mean: '设备类型', example: 'flowmeter', options: ['valve', 'flowmeter', 'fertilizer', 'sensor', 'pump', 'temperature', 'humidity', 'pressure'] },
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
                exist_device.device_type = body.device_type || 'valve'; // 保存设备类型
                exist_device.longitude = body.longitude;
                exist_device.latitude = body.latitude;
                if (body.farm_name) {
                    exist_device.farm_name = body.farm_name;
                }
                if (body.block_name) {
                    exist_device.block_name = body.block_name;
                }
                await get_driver(body.device_name);
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
                let driver = await get_driver(body.device_name);
                if (driver.destroy) {
                    await driver.destroy();
                }
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
                        device_type: { type: String, mean: '设备类型', example: 'flowmeter' },
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
                        is_online: { type: Boolean, mean: '设备是否在线', example: true },
                    }
                },
            },
            func: async function (body, token) {
                // 根据 driver_name / device_name 兜底设备类型（兼容 valva）
                const normalizeDeviceType = (device) => {
                    const driverName = (device.driver_name || '').toLowerCase()
                    const driverTypeMap = {
                        pump: 'pump',
                        waterflowmeter: 'flowmeter',
                        flowmeter: 'flowmeter',
                        pressuremeter: 'pressure',
                        pressure: 'pressure',
                        watergroupvalve: 'valve',
                        valve: 'valve',
                        fertpump: 'pump',
                        fertilize: 'fertilizer',
                        fert: 'fertilizer',
                        level: 'level',
                        liquidlevel: 'level',
                        levelmeter: 'level',
                        mixer: 'pump',
                        stir: 'pump',
                        mix: 'pump'
                    }
                    // 先从驱动名精确/包含映射
                    for (const [key, val] of Object.entries(driverTypeMap)) {
                        if (driverName.includes(key)) return val
                    }

                    const inferFromName = (name = '') => {
                        const n = name.toLowerCase()
                        if (n.includes('泵') || n.includes('搅拌') || n.includes('混合') || n.includes('mix')) return 'pump'
                        if (n.includes('流量计')) return 'flowmeter'
                        if (n.includes('压力')) return 'pressure'
                        if (n.includes('液位') || n.includes('液面') || n.includes('水位') || n.includes('level')) return 'level'
                        if (n.includes('阀')) return 'valve'
                        return ''
                    }

                    const t = (device.device_type || '').toLowerCase()
                    const inferred = inferFromName(device.device_name)

                    // 如果设备名称能强匹配泵/流量计/压力/液位，则优先使用（即使 t 是 valve/valva）
                    if (inferred && inferred !== 'valve') return inferred

                    // 兼容 valva
                    if (t === 'valva') return inferred || 'valve'

                    if (t) return t

                    // t 为空时，尝试用名称推断；仍无则阀门兜底
                    return inferred || 'valve'
                }
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
                        device_type: normalizeDeviceType(device),
                        capability: JSON.stringify(capability),
                        farm_name: device.farm_name || '',
                        block_name: device.block_name || '',
                        longitude: device.longitude || null,
                        latitude: device.latitude || null
                    });
                });
                let pageNo = body.pageNo || 0;
                let current_page_content = filtered_devices.slice(pageNo * 20, (pageNo + 1) * 20);
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
                        device_info.is_online = await single_driver.is_online();
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
        mock_total_readout: {
            name: '模拟累计读数',
            description: '模拟设备累计读数',
            is_write: true,
            is_get_api: false,
            params: {
                device_name: { type: String, have_to: true, mean: '设备名称', example: 'virtualDevice1' },
                value: { type: Number, have_to: true, mean: '模拟累计读数值', example: 1000 }
            },
            result: {
                result: { type: Boolean, mean: '模拟累计读数结果', example: true }
            },
            func: async function (body, token) {
                let driver = await get_driver(body.device_name, 'mock_total_readout');
                await driver.mock_total_readout(body.value);
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
        emergency_stop: {
            name: '批量急停',
            description: '批量急停指定地块的所有设备',
            is_write: true,
            is_get_api: false,
            params: {
                farm_name: { type: String, have_to: true, mean: '农场名称', example: '温室1号' },
                block_names: {
                    type: Array,
                    have_to: true,
                    mean: '地块名称列表',
                    explain: {
                        name: { type: String, mean: '地块名称', example: '主灌溉管道' }
                    }
                }
            },
            result: {
                result: { type: Boolean, mean: '急停结果', example: true },
                stopped_devices: {
                    type: Array,
                    mean: '已急停的设备列表',
                    explain: {
                        device_name: { type: String, mean: '设备名称', example: '设备1' }
                    }
                },
                failed_devices: {
                    type: Array,
                    mean: '急停失败的设备列表',
                    explain: {
                        device_name: { type: String, mean: '设备名称', example: '设备3' },
                        reason: { type: String, mean: '失败原因', example: '急停失败' }
                    }
                }
            },
            func: async function (body, token) {
                try {
                    let stoppedDevices = [];
                    let failedDevices = [];

                    // 获取指定农场和地块下的所有设备
                    let targetDevices = device_array.filter(device =>
                        device.farm_name === body.farm_name &&
                        body.block_names.includes(device.block_name)
                    );

                    console.log(`找到 ${targetDevices.length} 个设备需要急停`);

                    // 遍历每个设备，调用shutdown_device接口
                    for (let device of targetDevices) {
                        try {
                            console.log(`正在急停设备: ${device.device_name}`);

                            // 直接调用shutdown逻辑
                            let driver = await get_driver(device.device_name, 'shutdown');
                            await driver.shutdown();

                            stoppedDevices.push(device.device_name);
                            console.log(`设备 ${device.device_name} 急停成功`);
                        } catch (error) {
                            console.error(`急停设备 ${device.device_name} 失败:`, error);
                            failedDevices.push({
                                device_name: device.device_name,
                                reason: error.message || '急停失败'
                            });
                        }
                    }

                    console.log(`急停完成: 成功 ${stoppedDevices.length} 个，失败 ${failedDevices.length} 个`);

                    return {
                        result: true,
                        stopped_devices: stoppedDevices,
                        failed_devices: failedDevices
                    };
                } catch (error) {
                    console.error('批量急停失败:', error);
                    return {
                        result: false,
                        stopped_devices: [],
                        failed_devices: [],
                        error: error.message || '批量急停失败'
                    };
                }
            }
        },
        set_key_const_value:{
            name: '设置关键参数值',
            description: '设置设备的关键参数值',
            is_write: true,
            is_get_api: false,
            params: {
                device_name: { type: String, have_to: true, mean: '设备名称', example: 'virtualDevice1' },
                value: { type: Number, have_to: true, mean: '关键参数值', example: 123.45 }
            },
            result: {
                result: { type: Boolean, mean: '设置结果', example: true }
            },
            func: async function (body, token) {
                let driver = await get_driver(body.device_name, 'set_key_const_value');
                if (driver) {
                    await driver.set_key_const_value(body.value);
                }
                return { result: true };
            }
        },
    }
}