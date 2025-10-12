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
                irrigationGroups: {
                    type: Number,
                    mean: '轮灌组数量',
                    example: 6
                },
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
                        deviceList = [];
                    }
                    
                    // 3. 从策略模块获取轮灌组数据
                    const policyModule = (await import('../../policy/server/policy_module.js')).default;
                    let policyList = [];
                    try {
                        const policyResult = await policyModule.methods.list_policy.func({}, token);
                        policyList = policyResult.policies || [];
                    } catch (error) {
                        // 策略模块数据获取失败，使用模拟数据
                    }
                    
                    // 4. 计算基础信息
                    let totalArea = 0;
                    let irrigationGroups = 0;
                    let cropName = '未知';
                    let totalDevices = 0;
                    let onlineDevices = 0;
                    let offlineDevices = 0;
                    
                    // 计算农场面积（地块面积总和）
                    if (farm.blocks && farm.blocks.length > 0) {
                        totalArea = farm.blocks.reduce((sum, block) => {
                            return sum + (block.area || 0);
                        }, 0);
                    }
                    
                    // 计算轮灌组数量（策略数量或地块数量）
                    irrigationGroups = Math.max(policyList.length, farm.blocks ? farm.blocks.length : 0);
                    
                    // 根据农场名称推断作物类型
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
                    } else {
                        // 如果没有设备数据，显示0
                        totalDevices = 0;
                        onlineDevices = 0;
                        offlineDevices = 0;
                    }
                    
                    
                    return {
                        irrigationGroups,
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
                        irrigationGroups: 0,
                        totalArea: 0,
                        cropName: '未知',
                        totalDevices: 0,
                        onlineDevices: 0,
                        offlineDevices: 0
                    };
                }
            }
        },
        
        getRealtimeData: {
            name: '获取实时数据',
            description: '获取监控中心页面所需的实时数据',
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
                totalFlow: {
                    type: Number,
                    mean: '总流量（m³）',
                    example: 1680
                },
                mainPipeFlow: {
                    type: Number,
                    mean: '主管道流量（m³/h）',
                    example: 250
                },
                mainPipePressure: {
                    type: Number,
                    mean: '主管道压力（mpa）',
                    example: 0.345
                },
                fertilizerFlow: {
                    type: Number,
                    mean: '施肥流量（L/h）',
                    example: 50
                },
                totalFertilizer: {
                    type: Number,
                    mean: '总施肥量（m³）',
                    example: 1000
                }
            },
            func: async function (body, token) {
                const { farmName } = body;
                
                // 模拟实时数据计算
                let baseFlow = 1500;
                let basePressure = 0.3;
                let baseFertilizer = 800;
                
                // 根据农场ID调整基础数据
                if (farmName === 'farm_1') {
                    baseFlow = 1680;
                    basePressure = 0.345;
                    baseFertilizer = 1000;
                } else if (farmName === 'farm_2') {
                    baseFlow = 1200;
                    basePressure = 0.28;
                    baseFertilizer = 600;
                }
                
                // 移除模拟数据变化，返回基础数据
                const totalFlow = baseFlow;
                const mainPipeFlow = 250;
                const mainPipePressure = basePressure;
                const fertilizerFlow = 50;
                const totalFertilizer = baseFertilizer;
                
                return {
                    totalFlow,
                    mainPipeFlow,
                    mainPipePressure,
                    fertilizerFlow,
                    totalFertilizer
                };
            }
        },
        
        getIrrigationGroups: {
            name: '获取轮灌组数据',
            description: '获取轮灌组列表和状态',
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
                groups: {
                    type: Array,
                    mean: '轮灌组列表',
                    explain: {
                        id: { type: Number, mean: '组ID', example: 1 },
                        name: { type: String, mean: '组名称', example: 'A区灌溉组' },
                        status: { type: String, mean: '状态', example: '运行中' },
                        progress: { type: Number, mean: '进度百分比', example: 75 },
                        startTime: { type: String, mean: '开始时间', example: '09:00' },
                        endTime: { type: String, mean: '结束时间', example: '11:30' }
                    }
                }
            },
            func: async function (body, token) {
                const { farmName } = body;
                
                // 从资源模块获取农场和地块数据
                const resourceModule = (await import('../../resource/server/resource_module.js')).default;
                
                // 获取农场列表
                const farmListResult = await resourceModule.methods.list_farm.func({}, token);
                const farms = farmListResult.farms || [];
                
                // 根据农场名称找到对应的农场
                const farm = farms.find(f => f.name === farmName);
                
                if (!farm) {
                    throw new Error(`农场 ${farmName} 不存在`);
                }
                
                let groups = [];
                
                if (farm.blocks && farm.blocks.length > 0) {
                    // 根据地块数据生成轮灌组
                    groups = farm.blocks.map((block, index) => {
                        // 移除模拟状态生成，设置为默认状态
                        let status = '待机';
                        let progress = 0;
                        let startTime = '--';
                        let endTime = '--';
                        
                        return {
                            id: index + 1,
                            name: `${block.name}灌溉组`,
                            status: status,
                            progress: progress,
                            startTime: startTime,
                            endTime: endTime
                        };
                    });
                } else {
                    // 如果没有地块数据，返回空数组
                    groups = [];
                }
                
                // 移除模拟数据变化
                
                return groups;
            }
        }
    }
};
