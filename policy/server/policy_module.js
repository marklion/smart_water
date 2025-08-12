const policy_array = []
export default {
    name: 'policy',
    description: '策略管理',
    methods: {
        add_policy: {
            name: '添加策略',
            description: '添加一个新的策略',
            is_write: true,
            is_get_api: false,
            params: {
                name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                let existingPolicy = policy_array.find(policy => policy.name === body.name);
                if (!existingPolicy) {
                    policy_array.push({
                        name: body.name,
                    });
                }
                return { result: true };
            },
        },
        list_policy: {
            name: '列出策略',
            description: '列出所有策略',
            is_write: false,
            is_get_api: true,
            params: {
            },
            result: {
                policies: {
                    type: Array, mean: '策略列表', explain: {
                        name: { type: String, mean: '策略名称', example: '策略1' },
                    }
                }
            },
            func: async function (body, token) {
                let current_page_content = policy_array.slice(body.pageNo * 20, (body.pageNo + 1) * 20);
                return {
                    policies: current_page_content,
                    total: policy_array.length,
                }
            },
        },
        del_policy:{
            name:'删除策略',
            description: '删除一个策略',
            is_write: true,
            is_get_api: false,
            params: {
                name: { type: String, mean: '策略名称', example: '策略1', have_to: true },
            },
            result: {
                result: { type: Boolean, mean: '操作结果', example: true }
            },
            func: async function (body, token) {
                let index = policy_array.findIndex(policy => policy.name === body.name);
                if (index !== -1) {
                    policy_array.splice(index, 1);
                    return { result: true };
                } else {
                    throw {
                        err_msg:'策略不存在',
                    }
                }
            },
        },
    }
}