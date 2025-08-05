const farms = []
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
                info: { type: String, mean: '农场信息', example: '信息1', have_to: false }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                let existingFarm = farms.find(farm => farm.name === body.name);
                if (!existingFarm) {
                    farms.push({
                        name: body.name,
                        location: body.location,
                        info: body.info
                    });
                }
                else {
                    existingFarm.location = body.location;
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
                if (index !== -1) {
                    farms.splice(index, 1);
                    return { result: true };
                }
                return { result: false };
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
                info: { type: String, mean: '地块信息', example: '信息1', have_to: false }
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                let farm = farms.find(farm => farm.name === body.farm_name);
                if (farm) {
                    if (!farm.blocks) {
                        farm.blocks = [];
                    }
                    let existingBlock = farm.blocks.find(block => block.name === body.block_name);
                    if (!existingBlock) {
                        farm.blocks.push({
                            name: body.block_name,
                            info: body.info
                        });
                    } else {
                        existingBlock.info = body.info;
                    }
                    return { result: true };
                }
                return { result: false };
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
                let farm = farms.find(farm => farm.name === body.farm_name);
                if (farm && farm.blocks) {
                    let index = farm.blocks.findIndex(block => block.name === body.block_name);
                    if (index !== -1) {
                        farm.blocks.splice(index, 1);
                        return { result: true };
                    }
                }
                return { result: false };
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
                                    info: block.info
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