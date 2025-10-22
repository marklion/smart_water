// 监控中心模块
// 提供监控中心页面所需的基础信息接口

export default {
    name: 'monitoring',
    description: '监控中心',
    methods: {
        getBasicInfo: {
            name: '获取基础信息',
            description: '获取监控中心页面所需的基础信息',
            is_write: false,
            is_get_api: true,
            params: {
                farmName: {
                    type: String,
                    mean: '农场名称',
                    example: '智慧农场',
                    required: true
                }
            },
            result: {
                totalArea: {
                    type: Number,
                    mean: '农场总面积（亩）',
                    example: 580
                },
                cropName: {
                    type: String,
                    mean: '作物名称',
                    example: '玉米'
                },
                totalDevices: {
                    type: Number,
                    mean: '设备总数量',
                    example: 27
                },
                onlineDevices: {
                    type: Number,
                    mean: '在线设备数量',
                    example: 25
                },
                offlineDevices: {
                    type: Number,
                    mean: '离线设备数量',
                    example: 2
                }
            },
            func: async function (body, token) {
                const { farmName } = body;
                
                try {
                    // 1. 从资源模块获取农场和地块数据
                    const resourceModule = (await import('../../resource/server/resource_module.js')).default;
                    const farmListResult = await resourceModule.methods.list_farm.func({ pageNo: 0 }, token);
                    const farms = farmListResult.farms || [];
                    const farm = farms.find(f => f.name === farmName);
                    
                    if (!farm) {
                        throw new Error(`农场 ${farmName} 不存在`);
                    }
                    
                    // 2. 从设备管理模块获取设备数据
                    const deviceModule = (await import('../../device/server/device_management_module.js')).default;
                    let deviceList = [];
                    try {
                        const deviceResult = await deviceModule.methods.list_device.func({ farm_name: farmName, pageNo: 0 }, token);
                        deviceList = deviceResult.devices || [];
                    } catch (error) {
                        console.warn('获取设备列表失败，使用空列表:', error.message || error);
                        deviceList = [];
                    }
                    
                    // 3. 计算基础信息
                    let totalArea = 0;
                    let totalDevices = 0;
                    let onlineDevices = 0;
                    let offlineDevices = 0;
                    
                    // 计算农场面积（地块面积总和）
                    if (farm.blocks && farm.blocks.length > 0) {
                        totalArea = farm.blocks.reduce((sum, block) => {
                            return sum + (block.area || 0);
                        }, 0);
                    }
                    
                    
                    // 根据农场名称推断作物类型
                    let cropName;
                    if (farm.name.includes('玉米') || farm.name.includes('智慧农场')) {
                        cropName = '玉米';
                    } else if (farm.name.includes('小麦') || farm.name.includes('测试农场')) {
                        cropName = '小麦';
                    } else {
                        cropName = '蔬菜';
                    }
                    
                    // 计算设备统计 - 使用真实设备数据
                    if (deviceList.length > 0) {
                        totalDevices = deviceList.length;
                        // 根据设备状态计算在线/离线数量
                        onlineDevices = deviceList.filter(device => device.status === 'online' || device.status === '运行中').length;
                        offlineDevices = totalDevices - onlineDevices;
                    }
                    // 如果没有设备数据，所有变量都保持初始值 0
                    
                    
                    return {
                        totalArea,
                        cropName,
                        totalDevices,
                        onlineDevices,
                        offlineDevices
                    };
                    
                } catch (error) {
                    console.error('监控中心数据获取失败:', error);
                    // 返回默认数据
                    return {
                        totalArea: 0,
                        cropName: '未知',
                        totalDevices: 0,
                        onlineDevices: 0,
                        offlineDevices: 0
                    };
                }
            }
        },
    }
};
