const driver_array = [
    {
        name: '常闭电磁阀',
        config_method: '<ip> <port> <id>'
    },
    {
        name: '常闭电磁阀',
        config_method: '<ip> <port> <id>'
    },
    {
        name: '常闭电磁阀',
        config_method: '<ip> <port> <id>'
    },
    {
        name: '常闭电磁阀',
        config_method: '<ip> <port> <id>'
    },
    {
        name: '常闭电磁阀',
        config_method: '<ip> <port> <id>'
    },
    {
        name: '常闭电磁阀',
        config_method: '<ip> <port> <id>'
    },
    {
        name: '常闭电磁阀',
        config_method: '<ip> <port> <id>'
    },
    {
        name: '常闭电磁阀',
        config_method: '<ip> <port> <id>'
    },
    {
        name: '常闭电磁阀',
        config_method: '<ip> <port> <id>'
    },
    {
        name: '常闭电磁阀',
        config_method: '<ip> <port> <id>'
    },
    {
        name: '常闭电磁阀',
        config_method: '<ip> <port> <id>'
    },
    {
        name: '常闭电磁阀',
        config_method: '<ip> <port> <id>'
    },
    {
        name: '常闭电磁阀',
        config_method: '<ip> <port> <id>'
    },
    {
        name: '常闭电磁阀',
        config_method: '<ip> <port> <id>'
    },
    {
        name: '常闭电磁阀',
        config_method: '<ip> <port> <id>'
    },
    {
        name: '常闭电磁阀',
        config_method: '<ip> <port> <id>'
    },
    {
        name: '常闭电磁阀',
        config_method: '<ip> <port> <id>'
    },
    {
        name: '常闭电磁阀',
        config_method: '<ip> <port> <id>'
    },
    {
        name: '常闭电磁阀',
        config_method: '<ip> <port> <id>'
    },
    {
        name: '常闭电磁阀',
        config_method: '<ip> <port> <id>'
    },
    {
        name: '常闭电磁阀',
        config_method: '<ip> <port> <id>'
    },
    {
        name: '常闭电磁阀',
        config_method: '<ip> <port> <id>'
    },
];
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
    }
}