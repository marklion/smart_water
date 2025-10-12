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
                        info: { type: String, mean: '农场信息', example: '信息1' }
                    }
                },
            },
            func: async function (body, token) {
                let current_page_content = farms.slice(body.pageNo * 20, (body.pageNo + 1) * 20);
                return {
                    farms: current_page_content,
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
                        info: body.info
                    });
                }
                else {
                    existingFarm.location = body.location;
                    existingFarm.longitude = body.longitude;
                    existingFarm.latitude = body.latitude;
                    existingFarm.info = body.info;
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
        }
    }
}