const farms = [];

export default {
    name: 'resource',
    description: '资源管理',
    methods: {
        list_farm: {
            name: '列出农场',
            description: '列出所有农场',
            is_write: false,
            is_get_api: true,
            params: {
            },
            result: {
                farms: {
                    type: Array,
                    mean: '农场列表',
                    explain: {
                        name: { type: String, mean: '农场名称', example: '农场1' },
                        location: { type: String, mean: '农场位置', example: '位置1' },
                        longitude: { type: Number, mean: '经度', example: 111.670801 },
                        latitude: { type: Number, mean: '纬度', example: 40.818311 },
                        info: { type: String, mean: '农场信息', example: '信息1' },
                        system_flow: { type: Number, mean: '系统流量', example: 0 },
                        laying_spacing: { type: Number, mean: '铺设间距', example: 0 },
                        dripper_spacing: { type: Number, mean: '滴头间距', example: 0 },
                        dripper_flow: { type: Number, mean: '滴头流量', example: 0 },
                        coefficient: { type: Number, mean: '系数', example: 0.9 }
                    }
                },
            },
            func: async function (body, token) {
                let current_page_content = farms.slice(body.pageNo * 20, (body.pageNo + 1) * 20);
                // 确保返回的 farm 对象包含所有属性，包括 realtime_configs
                let farms_with_configs = current_page_content.map(farm => {
                    return {
                        ...farm,
                        realtime_configs: farm.realtime_configs || []
                    };
                });
                return {
                    farms: farms_with_configs,
                    total: farms.length,
                }
            },
        },
        add_farm: {
            name: '添加农场',
            description: '添加一个新的农场',
            is_write: true,
            is_get_api: false,
            params: {
                name: { type: String, mean: '农场名称', example: '农场1', have_to: true },
                location: { type: String, mean: '农场位置', example: '位置1', have_to: true },
                longitude: { type: Number, mean: '经度', example: 111.670801, have_to: true },
                latitude: { type: Number, mean: '纬度', example: 40.818311, have_to: true },
                info: { type: String, mean: '农场信息', example: '信息1', have_to: false }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                // 验证坐标参数
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
                
                let existingFarm = farms.find(farm => farm.name === body.name);
                if (!existingFarm) {
                farms.push({
                    name: body.name,
                    location: body.location,
                    longitude: body.longitude,
                    latitude: body.latitude,
                    info: body.info,
                    // 建议亩数计算参数
                    system_flow: 0, // 系统流量
                    laying_spacing: 0, // 铺设间距
                    dripper_spacing: 0, // 滴头间距
                    dripper_flow: 0, // 滴头流量
                    coefficient: 0.9 // 系数，默认0.9
                });
                }
                else {
                    existingFarm.location = body.location;
                    existingFarm.longitude = body.longitude;
                    existingFarm.latitude = body.latitude;
                    existingFarm.info = body.info;
                    // 如果新参数未提供，保持原有值
                    if (body.system_flow !== undefined) existingFarm.system_flow = body.system_flow;
                    if (body.laying_spacing !== undefined) existingFarm.laying_spacing = body.laying_spacing;
                    if (body.dripper_spacing !== undefined) existingFarm.dripper_spacing = body.dripper_spacing;
                    if (body.dripper_flow !== undefined) existingFarm.dripper_flow = body.dripper_flow;
                    if (body.coefficient !== undefined) existingFarm.coefficient = body.coefficient;
                }
                
                return { result: true };
            },
        },
        del_farm: {
            name: '删除农场',
            description: '删除一个农场',
            is_write: true,
            is_get_api: false,
            params: {
                name: { type: String, mean: '农场名称', example: '农场1', have_to: true }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                let index = farms.findIndex(farm => farm.name === body.name);
                if (index === -1) {
                    throw { err_msg: `农场 ${body.name} 不存在` };
                }
                farms.splice(index, 1);
                return { result: true };
            },
        },
        add_block:{
            name: '添加地块',
            description: '添加一个新的地块到指定农场',
            is_write: true,
            is_get_api: false,
            params: {
                farm_name: { type: String, mean: '农场名称', example: '农场1', have_to: true },
                block_name: { type: String, mean: '地块名称', example: '地块1', have_to: true },
                area: { type: Number, mean: '地块面积(亩)', example: 10 ,have_to: false},
                info: { type: String, mean: '地块信息', example: '信息1', have_to: false }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                // 验证农场是否存在
                let farm = farms.find(farm => farm.name === body.farm_name);
                if (!farm) {
                    throw { err_msg: `农场 ${body.farm_name} 不存在` };
                }
                
                if (!farm.blocks) {
                    farm.blocks = [];
                }
                let existingBlock = farm.blocks.find(block => block.name === body.block_name);
                if (!existingBlock) {
                    farm.blocks.push({
                        name: body.block_name,
                        area: body.area,
                        info: body.info,
                    });
                } else {
                    existingBlock.area = body.area || existingBlock.area;
                    existingBlock.info = body.info || existingBlock.info;
                }
                // 保存数据到文件
                
                return { result: true };
            },
        },
        del_block:{
            name: '删除地块',
            description: '删除指定农场中的地块',
            is_write: true,
            is_get_api: false,
            params: {
                farm_name: { type: String, mean: '农场名称', example: '农场1', have_to: true },
                block_name: { type: String, mean: '地块名称', example: '地块1', have_to: true }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                // 验证农场是否存在
                let farm = farms.find(farm => farm.name === body.farm_name);
                if (!farm) {
                    throw { err_msg: `农场 ${body.farm_name} 不存在` };
                }
                
                // 验证地块是否存在
                if (!farm.blocks) {
                    throw { err_msg: `农场 ${body.farm_name} 中没有地块` };
                }
                
                let index = farm.blocks.findIndex(block => block.name === body.block_name);
                if (index === -1) {
                    throw { err_msg: `地块 ${body.block_name} 在农场 ${body.farm_name} 中不存在` };
                }
                
                farm.blocks.splice(index, 1);
                return { result: true };
            },
        },
        list_block:{
            name: '列出地块',
            description: '列出指定农场中的所有地块',
            is_write: false,
            is_get_api: true,
            params: {
                farm_name: { type: String, mean: '农场名称', example: '农场1', have_to: false }
            },
            result: {
                blocks:{
                    type: Array,
                    mean: '地块列表',
                    explain: {
                        farm_name: { type: String, mean: '农场名称', example: '农场1' },
                        name: { type: String, mean: '地块名称', example: '地块1' },
                        area: { type: Number, mean: '地块面积(亩)', example: 10 },
                        info: { type: String, mean: '地块信息', example: '信息1' }
                    }
                },
            },
            func: async function (body, token) {
                let ret_array = [];
                for (let farm of farms) {
                    if (farm.name === body.farm_name || !body.farm_name) {
                        if (farm.blocks) {
                            for (let block of farm.blocks) {
                                ret_array.push({
                                    farm_name: farm.name,
                                    name: block.name,
                                    area: block.area || 0,
                                    info: block.info || ''
                                });
                            }
                        }
                    }
                }

                let current_page_content = ret_array.slice(body.pageNo * 20, (body.pageNo + 1) * 20);
                return {
                    blocks: current_page_content,
                    total: ret_array.length
                };
            },
        },
        set_farm_area_params: {
            name: '设置农场建议亩数计算参数',
            description: '设置指定农场的建议亩数计算参数',
            is_write: true,
            is_get_api: false,
            params: {
                farm_name: { type: String, mean: '农场名称', example: '农场1', have_to: true },
                system_flow: { type: Number, mean: '系统流量', example: 0, have_to: false },
                laying_spacing: { type: Number, mean: '铺设间距', example: 0, have_to: false },
                dripper_spacing: { type: Number, mean: '滴头间距', example: 0, have_to: false },
                dripper_flow: { type: Number, mean: '滴头流量', example: 0, have_to: false },
                coefficient: { type: Number, mean: '系数', example: 0.9, have_to: false }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                let farm = farms.find(farm => farm.name === body.farm_name);
                if (!farm) {
                    throw { err_msg: `农场 ${body.farm_name} 不存在` };
                }
                
                if (body.system_flow !== undefined) farm.system_flow = body.system_flow;
                if (body.laying_spacing !== undefined) farm.laying_spacing = body.laying_spacing;
                if (body.dripper_spacing !== undefined) farm.dripper_spacing = body.dripper_spacing;
                if (body.dripper_flow !== undefined) farm.dripper_flow = body.dripper_flow;
                if (body.coefficient !== undefined) farm.coefficient = body.coefficient;
                
                return { result: true };
            },
        },
        get_farm_area_params: {
            name: '获取农场建议亩数计算参数',
            description: '获取指定农场的建议亩数计算参数',
            is_write: false,
            is_get_api: true,
            params: {
                farm_name: { type: String, mean: '农场名称', example: '农场1', have_to: true }
            },
            result: {
                system_flow: { type: Number, mean: '系统流量', example: 0 },
                laying_spacing: { type: Number, mean: '铺设间距', example: 0 },
                dripper_spacing: { type: Number, mean: '滴头间距', example: 0 },
                dripper_flow: { type: Number, mean: '滴头流量', example: 0 },
                coefficient: { type: Number, mean: '系数', example: 0.9 }
            },
            func: async function (body, token) {
                let farm = farms.find(farm => farm.name === body.farm_name);
                if (!farm) {
                    throw { err_msg: `农场 ${body.farm_name} 不存在` };
                }
                
                return {
                    system_flow: farm.system_flow !== undefined ? farm.system_flow : 1,
                    laying_spacing: farm.laying_spacing || 0,
                    dripper_spacing: farm.dripper_spacing || 0,
                    dripper_flow: farm.dripper_flow || 0,
                    coefficient: farm.coefficient !== undefined ? farm.coefficient : 0.9
                };
            },
        },
        add_realtime: {
            name: '添加实时数据配置',
            description: '为指定农场添加一个实时数据显示配置',
            is_write: true,
            is_get_api: false,
            params: {
                farm_name: { type: String, mean: '农场名称', example: '农场1', have_to: true },
                label: { type: String, mean: '显示名称', example: '农场1主管道当前流量值', have_to: true },
                device_name: { type: String, mean: '设备名称', example: '农场1主管道流量计', have_to: true },
                data_type: { type: String, mean: '数据类型', example: 'readout或total_readout', have_to: true }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                let farm = farms.find(farm => farm.name === body.farm_name);
                if (!farm) {
                    throw { err_msg: `农场 ${body.farm_name} 不存在` };
                }
                
                if (!farm.realtime_configs) {
                    farm.realtime_configs = [];
                }
                
                // 检查是否已存在相同的配置（根据label判断）
                let existingIndex = farm.realtime_configs.findIndex(config => config.label === body.label);
                if (existingIndex !== -1) {
                    // 更新现有配置
                    farm.realtime_configs[existingIndex] = {
                        label: body.label,
                        device_name: body.device_name,
                        data_type: body.data_type
                    };
                } else {
                    farm.realtime_configs.push({
                        label: body.label,
                        device_name: body.device_name,
                        data_type: body.data_type
                    });
                }
                
                return { result: true };
            },
        },
        del_realtime: {
            name: '删除实时数据配置',
            description: '删除指定农场的实时数据显示配置',
            is_write: true,
            is_get_api: false,
            params: {
                farm_name: { type: String, mean: '农场名称', example: '农场1', have_to: true },
                label: { type: String, mean: '显示名称', example: '农场1主管道当前流量值', have_to: true }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                let farm = farms.find(farm => farm.name === body.farm_name);
                if (!farm) {
                    throw { err_msg: `农场 ${body.farm_name} 不存在` };
                }
                
                if (!farm.realtime_configs) {
                    throw { err_msg: `农场 ${body.farm_name} 没有实时数据配置` };
                }
                
                let index = farm.realtime_configs.findIndex(config => config.label === body.label);
                if (index === -1) {
                    throw { err_msg: `配置 ${body.label} 在农场 ${body.farm_name} 中不存在` };
                }
                
                farm.realtime_configs.splice(index, 1);
                return { result: true };
            },
        },
        list_realtime: {
            name: '列出实时数据配置',
            description: '列出指定农场的所有实时数据显示配置',
            is_write: false,
            is_get_api: true,
            params: {
                farm_name: { type: String, mean: '农场名称', example: '农场1', have_to: false }
            },
            result: {
                configs: {
                    type: Array,
                    mean: '实时数据配置列表',
                    explain: {
                        farm_name: { type: String, mean: '农场名称', example: '农场1' },
                        label: { type: String, mean: '显示名称', example: '农场1主管道当前流量值' },
                        device_name: { type: String, mean: '设备名称', example: '农场1主管道流量计' },
                        data_type: { type: String, mean: '数据类型', example: 'readout' }
                    }
                },
            },
            func: async function (body, token) {
                let ret_array = [];
                for (let farm of farms) {
                    if (farm.name === body.farm_name || !body.farm_name) {
                        if (farm.realtime_configs) {
                            for (let config of farm.realtime_configs) {
                                ret_array.push({
                                    farm_name: farm.name,
                                    label: config.label,
                                    device_name: config.device_name,
                                    data_type: config.data_type
                                });
                            }
                        }
                    }
                }
                
                return {
                    configs: ret_array,
                    total: ret_array.length
                };
            },
        }
    }
}