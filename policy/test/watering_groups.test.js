import test_utils from "../../public/lib/test_utils.js";
import { print_test_log, start_server, close_server, call_api } from "../../public/lib/test_utils.js";

let cli;

beforeAll(async () => {
    print_test_log('watering groups test begin', true);
    cli = await test_utils('npm run dev_cli');
    await start_server();
    await cli.run_cmd('clear');
});

afterAll(async () => {
    await cli.run_cmd('clear');
    await cli.close();
    await close_server();
    print_test_log('watering groups test end', true);
});

describe('轮灌组列表功能测试', () => {
    beforeEach(async () => {
        await cli.run_cmd('clear');
        
        // 创建测试用的设备和农场
        await cli.run_cmd('device');
        // 使用 WaterGroupValve 驱动，配置格式为 JSON 字符串
        await cli.run_cmd("add device '阀门1' 'WaterGroupValve' '{\"device_sn\":\"SN001\",\"is_left\":false,\"poll_interval\":1000,\"token\":\"test_token\"}' '2' '3'");
        await cli.run_cmd("add device '阀门2' 'WaterGroupValve' '{\"device_sn\":\"SN002\",\"is_left\":false,\"poll_interval\":1000,\"token\":\"test_token\"}' '2' '3'");
        // 创建模板中需要的主管道流量计（使用 virtualDevice）
        await cli.run_cmd("add device '主管道流量计' 'virtualDevice' 'flow.log' '2' '3'");
        await cli.run_cmd('return');
        
        await cli.run_cmd('resource');
        await cli.run_cmd('farm');
        await cli.run_cmd("add farm '测试农场' a 1 2");
        await cli.run_cmd('return');
        await cli.run_cmd('return');
    });

    afterEach(async () => {
        await cli.run_cmd('clear');
    });

    test('创建轮灌组并列出', async () => {
        // 通过 API 创建轮灌组
        const groups = [
            {
                name: '轮灌组1',
                area: 5,
                valves: ['阀门1', '阀门2'],
                method: 'AreaBased',
                AB_fert: 2,
                total_fert: 0,
                fert_time: 0,
                pre_fert_time: 2,
                post_fert_time: 2
            },
            {
                name: '轮灌组2',
                area: 10,
                valves: ['阀门1'],
                method: 'Total',
                AB_fert: 0,
                total_fert: 50,
                fert_time: 0,
                pre_fert_time: 1,
                post_fert_time: 1
            }
        ];

        // 创建轮灌组
        let resp = await call_api('/policy/apply_wizard_groups', {
            groups: groups,
            farm_name: '测试农场'
        });
        expect(resp.result).toBe(true);

        // 列出轮灌组
        resp = await call_api('/policy/list_watering_groups', { pageNo: 0 });
        expect(resp.groups).toBeDefined();
        expect(resp.total).toBe(2);
        expect(resp.groups.length).toBe(2);

        // 验证第一个轮灌组
        const group1 = resp.groups.find(g => g.name === '轮灌组1');
        expect(group1).toBeDefined();
        expect(group1.name).toBe('轮灌组1');
        expect(group1.area).toBe(5);
        expect(group1.method).toBe('亩定量');
        expect(group1.fert_rate).toBe(2);
        expect(group1.valves).toBe('"阀门1" "阀门2"');
        expect(group1.cur_state).toBeDefined();

        // 验证第二个轮灌组
        const group2 = resp.groups.find(g => g.name === '轮灌组2');
        expect(group2).toBeDefined();
        expect(group2.name).toBe('轮灌组2');
        expect(group2.area).toBe(10);
        expect(group2.method).toBe('总定量');
        expect(group2.valves).toBe('"阀门1"');
        expect(group2.cur_state).toBeDefined();
    });

    test('空列表测试', async () => {
        // 没有轮灌组时应该返回空列表
        let resp = await call_api('/policy/list_watering_groups', { pageNo: 0 });
        expect(resp.groups).toBeDefined();
        expect(Array.isArray(resp.groups)).toBe(true);
        expect(resp.total).toBe(0);
        expect(resp.groups.length).toBe(0);
    });

    test('分页测试', async () => {
        // 创建多个轮灌组
        const groups = [];
        for (let i = 1; i <= 25; i++) {
            groups.push({
                name: `轮灌组${i}`,
                area: i,
                valves: ['阀门1'],
                method: 'AreaBased',
                AB_fert: 1,
                total_fert: 0,
                fert_time: 0,
                pre_fert_time: 1,
                post_fert_time: 1
            });
        }

        await call_api('/policy/apply_wizard_groups', {
            groups: groups,
            farm_name: '测试农场'
        });

        // 第一页
        let resp = await call_api('/policy/list_watering_groups', { pageNo: 0 });
        expect(resp.total).toBe(25);
        expect(resp.groups.length).toBe(20); // 每页20条

        // 第二页
        resp = await call_api('/policy/list_watering_groups', { pageNo: 1 });
        expect(resp.total).toBe(25);
        expect(resp.groups.length).toBe(5); // 剩余5条

        // 第三页应该为空
        resp = await call_api('/policy/list_watering_groups', { pageNo: 2 });
        expect(resp.total).toBe(25);
        expect(resp.groups.length).toBe(0);
    });

    test('验证返回数据结构', async () => {
        // 创建一个轮灌组
        const groups = [{
            name: '测试轮灌组',
            area: 3,
            valves: ['阀门1', '阀门2'],
            method: 'AreaBased',
            AB_fert: 2.5,
            total_fert: 0,
            fert_time: 0,
            pre_fert_time: 1,
            post_fert_time: 1
        }];

        await call_api('/policy/apply_wizard_groups', {
            groups: groups,
            farm_name: '测试农场'
        });

        // 列出轮灌组
        let resp = await call_api('/policy/list_watering_groups', { pageNo: 0 });
        expect(resp.groups.length).toBe(1);

        const group = resp.groups[0];
        
        // 验证所有必需字段都存在
        expect(group.name).toBe('测试轮灌组');
        expect(group.area).toBeDefined();
        expect(typeof group.area).toBe('number');
        expect(group.method).toBeDefined();
        expect(typeof group.method).toBe('string');
        expect(group.fert_rate).toBeDefined();
        expect(typeof group.fert_rate).toBe('number');
        expect(group.total_water).toBeDefined();
        expect(typeof group.total_water).toBe('number');
        expect(group.total_fert).toBeDefined();
        expect(typeof group.total_fert).toBe('number');
        expect(group.minute_left).toBeDefined();
        expect(typeof group.minute_left).toBe('number');
        expect(group.valves).toBeDefined();
        expect(typeof group.valves).toBe('string');
        expect(group.cur_state).toBeDefined();
        expect(typeof group.cur_state).toBe('string');
        
        // 验证字段值
        expect(group.area).toBe(3);
        expect(group.fert_rate).toBe(2.5);
        expect(group.valves).toBe('"阀门1" "阀门2"');
    });

    test('验证多个阀门显示', async () => {
        // 创建包含多个阀门的轮灌组
        const groups = [{
            name: '多阀门轮灌组',
            area: 5,
            valves: ['阀门1', '阀门2'],
            method: 'AreaBased',
            AB_fert: 1,
            total_fert: 0,
            fert_time: 0,
            pre_fert_time: 1,
            post_fert_time: 1
        }];

        await call_api('/policy/apply_wizard_groups', {
            groups: groups,
            farm_name: '测试农场'
        });

        let resp = await call_api('/policy/list_watering_groups', { pageNo: 0 });
        const group = resp.groups.find(g => g.name === '多阀门轮灌组');
        expect(group).toBeDefined();
        expect(group.name).toBe('多阀门轮灌组');
        expect(group.valves).toBe('"阀门1" "阀门2"');
    });
});

