import test_utils from "../../public/lib/test_utils.js";
import { print_test_log, start_server, close_server, wait_ms } from "../../public/lib/test_utils.js";
import fs from 'fs';
import path from 'path';

let cli;

beforeAll(async () => {
    print_test_log('warning test start', true);
    cli = await test_utils('npm run dev_cli');
    await start_server();
    await cli.run_cmd('clear');

});

afterAll(async () => {
    await cli.run_cmd('clear');
    await cli.close();
    await close_server();
    print_test_log('warning test end', true);
});
describe('产生告警测试', () => {
    beforeEach(async () => {
        const logPath = path.resolve(process.cwd(), 'warning.log');
        try {
            await fs.promises.unlink(logPath);
            print_test_log(`deleted ${logPath}`, true);
        } catch (err) {
            // ignore if file does not exist
        }
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
        scan period '100'
        policy 'a'
            state 'a'
            enter assignment 'false' 'begin' 'Date.now()'
            enter assignment 'false' 'cur' '"waring_A"'
            warning '\`\${prs.variables.get("cur")}\`'
            transformer 'tob'
                rule 'false' 'b' 'Date.now() - prs.variables.get("begin") > 1000'
            return
            return
            state 'b'
            enter assignment 'false' 'cur' '"waring_B"'
            enter assignment 'false' 'begin' 'Date.now()'
            warning '\`\${prs.variables.get("cur")}\`'
            transformer 'toa'
                rule 'false' 'a' 'Date.now() - prs.variables.get("begin") > 1000'
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

        await cli.run_cmd('warning');
    });
    afterEach(async () => {
        await cli.run_cmd('clear');
    });
    test('生成告警并查看', async () => {
        await wait_ms(200);
        let res = await cli.run_cmd('list warnings');
        let top_warning = res.trim().split('\n')[0];
        expect(top_warning).toContain('waring_A');
        await wait_ms(1050);
        res = await cli.run_cmd('list warnings');
        top_warning = res.trim().split('\n')[0];
        expect(top_warning).toContain('waring_B');
        await wait_ms(1050);
        res = await cli.run_cmd('list warnings');
        top_warning = res.trim().split('\n')[0];
        expect(top_warning).toContain('waring_A');
    });
});