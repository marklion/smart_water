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
                },
                scheme_id: {
                    type: String,
                    mean: '方案ID（可选，用于筛选轮灌组）',
                    example: '方案1',
                    required: false
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
                },
                waterGroupCount: {
                    type: Number,
                    mean: '轮灌组数量',
                    example: 10
                }
            },
            func: async function (body, token) {
                const { farmName, scheme_id } = body;
                
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
                    let totalDevicesCount = 0;
                    try {
                        // 获取第一页设备用于统计在线/离线状态
                        const deviceResult = await deviceModule.methods.list_device.func({ farm_name: farmName, pageNo: 0 }, token);
                        deviceList = deviceResult.devices || [];
                        totalDevicesCount = deviceResult.total || deviceList.length;
                        
                        // 如果设备总数超过第一页，需要获取所有设备来准确统计在线/离线数量
                        if (totalDevicesCount > deviceList.length) {
                            const allDevices = [];
                            const pageSize = 20;
                            const totalPages = Math.ceil(totalDevicesCount / pageSize);
                            
                            // 获取所有页的设备
                            for (let pageNo = 0; pageNo < totalPages; pageNo++) {
                                try {
                                    const pageResult = await deviceModule.methods.list_device.func({ 
                                        farm_name: farmName, 
                                        pageNo: pageNo 
                                    }, token);
                                    if (pageResult && pageResult.devices) {
                                        allDevices.push(...pageResult.devices);
                                    }
                                } catch (pageError) {
                                    console.warn(`获取设备列表第 ${pageNo + 1} 页失败:`, pageError.message || pageError);
                                }
                            }
                            deviceList = allDevices;
                        }
                    } catch (error) {
                        console.warn('获取设备列表失败，使用空列表:', error.message || error);
                        deviceList = [];
                    }
                    
                    // 3. 计算基础信息
                    let totalArea = 0;
                    let totalDevices = 0;
                    let onlineDevices = 0;
                    let offlineDevices = 0;
                    let waterGroupCount = 0;
                    
                    // 计算农场面积（地块面积总和）
                    if (farm.blocks && farm.blocks.length > 0) {
                        totalArea = farm.blocks.reduce((sum, block) => {
                            return sum + (block.area || 0);
                        }, 0);
                    }
                    
                    
                    // 从农场的info字段获取作物类型
                    let cropName = farm.info && farm.info.trim() ? farm.info.trim() : '未知';
                    
                    // 计算设备统计 - 使用真实设备数据
                    if (deviceList.length > 0) {
                        totalDevices = totalDevicesCount > 0 ? totalDevicesCount : deviceList.length;
                        const onlineCount = deviceList.filter(device => device.is_online === true || device.is_online === 'true').length;
                        if (totalDevices > deviceList.length && deviceList.length > 0) {
                            const onlineRatio = onlineCount / deviceList.length;
                            onlineDevices = Math.round(totalDevices * onlineRatio);
                            offlineDevices = totalDevices - onlineDevices;
                        } else {
                            onlineDevices = onlineCount;
                            offlineDevices = totalDevices - onlineDevices;
                        }
                    }
                    // 如果没有设备数据，所有变量都保持初始值 0
                    
                    // 计算轮灌组数量 - 从策略模块获取
                    try {
                        const policyModule = (await import('../../policy/server/policy_module.js')).default;
                        // 如果指定了方案ID，只统计该方案的轮灌组；否则统计所有方案的轮灌组
                        const wateringGroupsResult = await policyModule.methods.list_watering_groups.func({ 
                            pageNo: 0,
                            scheme_id: scheme_id || undefined
                        }, token);
                        if (wateringGroupsResult && wateringGroupsResult.groups) {
                            // 筛选出匹配当前农场的轮灌组
                            const matchedGroups = await Promise.all(
                                wateringGroupsResult.groups.map(async (group) => {
                                    try {
                                        const farmMatch = await policyModule.methods.get_matched_farm.func({ 
                                            policy_name: group.name 
                                        }, token);
                                        return farmMatch.farm_name === farmName;
                                    } catch (error) {
                                        console.warn(`获取策略 ${group.name} 的农场信息失败:`, error);
                                        return false;
                                    }
                                })
                            );
                            waterGroupCount = matchedGroups.filter(Boolean).length;
                        }
                    } catch (error) {
                        console.warn('获取轮灌组数量失败:', error);
                        waterGroupCount = 0;
                    }
                    
                    return {
                        totalArea,
                        cropName,
                        totalDevices,
                        onlineDevices,
                        offlineDevices,
                        waterGroupCount
                    };
                    
                } catch (error) {
                    console.error('监控中心数据获取失败:', error);
                    // 返回默认数据
                    return {
                        totalArea: 0,
                        cropName: '未知',
                        totalDevices: 0,
                        onlineDevices: 0,
                        offlineDevices: 0,
                        waterGroupCount: 0
                    };
                }
            }
        }
    }
};
