import test_utils from "../../public/lib/test_utils.js";
import { print_test_log, start_server, close_server, wait_ms } from "../../public/lib/test_utils.js";
import fs from 'fs';
import path from 'path';

let cli;

beforeAll(async () => {
    print_test_log('statistic test start', true);
    cli = await test_utils('npm run dev_cli');
    await start_server();
    await cli.run_cmd('clear');

});
afterAll(async () => {
    await cli.run_cmd('clear');
    await cli.close();
    await close_server();
    print_test_log('statistic test end', true);
});
describe('产生统计数据测试', () => {
    beforeEach(async () => {
        const rootDir = process.cwd();
        async function removeStTxt(dir) {
            const entries = await fs.promises.readdir(dir, { withFileTypes: true });
            await Promise.all(entries.map(async (entry) => {
                const fullPath = path.join(dir, entry.name);

                if (/^st_.*\.txt$/i.test(entry.name)) {
                    try {
                        await fs.promises.unlink(fullPath);
                    } catch (e) {
                        // ignore deletion errors
                    }
                }
            }));
        }
        await removeStTxt(rootDir);
        let config = `
        set_sys_name 'no_name'
        device
        return
        resource
        farm
        return
        block
        return
        return
        policy
        policy 'a'
            init assignment 'false' 'rec' '0'
            state 'a'
                enter assignment 'false' 'rec' 'prs.variables.get("rec") + 1'
                enter assignment 'false' 'begin' 'Date.now()'
                transformer 'tob'
                    rule 'false' 'b' 'Date.now() - prs.variables.get("begin") > 90'
                    statistic 'b' 'st_1' 'prs.variables.get("rec")'
                return
            return
            state 'b'
                enter assignment 'false' 'begin' 'Date.now()'
                transformer 'toa'
                    rule 'false' 'a' 'Date.now() - prs.variables.get("begin") > 90'
                    statistic 'a' 'st_2' 'prs.variables.get("rec")'
                return
            return
            init state 'a'
        return
        return
        web
        return
        `;
        await cli.run_cmd('clear');
        for (const line of config.trim().split('\n')) {
            await cli.run_cmd(line.trim());
        }
    });
    afterEach(async () => {
        await cli.run_cmd('return');
        await cli.run_cmd('clear');
    });
    test('生成统计并查看', async () => {
        await cli.run_cmd('policy');
        await cli.run_cmd('scan period 100');
        await cli.run_cmd('return');
        await cli.run_cmd('statistic');
        await wait_ms(210);
        let res = await cli.run_cmd('list items');
        expect(res).toContain('st_1');
        expect(res).not.toContain('st_2');
        await wait_ms(210);
        res = await cli.run_cmd('list items');
        expect(res).toContain('st_1');
        expect(res).toContain('st_2');
    });
    test('查看统计历史', async () => {
        await cli.run_cmd('policy');
        await cli.run_cmd('scan period 100');
        await cli.run_cmd('return');
        await cli.run_cmd('statistic');
        await wait_ms(500);
        let res = await cli.run_cmd('list item history st_1');
        expect(res.split('\n').length).toBe(2);
    });
});