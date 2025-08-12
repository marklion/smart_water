import test_utils from "../../public/lib/test_utils";
import { start_server, close_server } from "../../public/lib/test_utils.js";
let cli;
beforeAll(async () => {
    cli = await test_utils('npm run dev_cli');
    await start_server()
    await cli.run_cmd('clear');
})
afterAll(async () => {
    await cli.run_cmd('clear');
    await cli.run_cmd('save');
    await cli.close();
    await close_server();
})

describe('策略增删', () => {
    let policy_configs = [];
    for (let i = 0; i < 22; i++) {
        policy_configs.push({
            name: `policy${i}`,
        })
    }
    beforeEach(async () => {
        await cli.run_cmd('policy');
    })
    afterEach(async () => {
        await cli.run_cmd('return');
    })
    test('新增策略', async () => {
        for (const policy of policy_configs) {
            await cli.run_cmd(`policy '${policy.name}'`);
            await cli.run_cmd('return')
        }
        let bdr = await cli.run_cmd('bdr');
        expect(bdr).toContain('policy0');
        expect(bdr).toContain('policy9');
        expect(bdr).toContain('policy21');
    });
    test('删除某个策略', async () => {
        await cli.run_cmd('undo policy policy0')
        await cli.run_cmd('undo policy policy21')
        let bdr = await cli.run_cmd('bdr');
        expect(bdr).not.toContain('policy0');
        expect(bdr).toContain('policy9');
        expect(bdr).not.toContain('policy21');
    })

    test('删除全部策略', async () => {
        await cli.run_cmd('clear');
        let bdr = await cli.run_cmd('bdr');
        expect(bdr).not.toContain('policy0');
        expect(bdr).not.toContain('policy9');
        expect(bdr).not.toContain('policy21');
    })
});
