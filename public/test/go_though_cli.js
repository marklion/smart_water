import { print_test_log } from "../lib/test_utils";

function parseCommandLine(line) {
    // 用正则匹配：命令部分 + 描述部分
    // 假设命令和描述之间至少有两个空格
    const match = line.match(/^(.+?)\s{2,}(.+)$/);
    if (!match) return null;

    const cmdPart = match[1].trim();
    const description = match[2].trim();

    // 拆分命令部分的 token
    const tokens = cmdPart.split(/\s+/);

    // 找出命令名（连续的非 < > [ ] token）
    let cmdTokens = [];
    let params = [];
    for (let token of tokens) {
        if (token.startsWith('<') && token.endsWith('>')) {
            params.push({
                text: token.slice(1, -1),
                optional: false
            });
        } else if (token.startsWith('[') && token.endsWith(']')) {
            params.push({
                text: token.slice(1, -1),
                optional: true
            });
        } else {
            cmdTokens.push(token);
        }
    }

    return {
        cmd: cmdTokens.join(' '),
        params,
        description
    };
}
function get_next_param(cmd_obj, current_param) {
    if (current_param) {
        for (let i = 0; i < cmd_obj.params.length - 1; i++) {
            if (cmd_obj.params[i].text === current_param.text) {
                return cmd_obj.params[i + 1];
            }
        }
    }
    return null;
}
function convert_param(param) {
    let convert_ret = []
    if (param) {
        if (param == 'driver_name') {
            convert_ret = ['虚拟设备']
        }
        else {
            convert_ret = ['abc', '123', '汉字', 'a = b.a + 1']
        }
    }
    return convert_ret.map(v => `'${v}'`);
}
function generate_various_cmds(previous_cmd, param, cmd_obj) {
    let param_values = convert_param(param?.text);
    if (!param || param.optional) {
        param_values.push('');
    }
    let ret = param_values.map(v => { return previous_cmd + ' ' + v.trim() }).filter(v => v.trim() !== '');
    let next_param = get_next_param(cmd_obj, param);
    if (next_param) {
        let new_ret = [];
        for (let cmd of ret) {
            let further_cmds = generate_various_cmds(cmd, next_param, cmd_obj);
            new_ret = new_ret.concat(further_cmds);
        }
        ret = new_ret;
    }
    return ret;
}
export default {
    collect_cmds: async function (cli) {
        let help_resp = await cli.run_cmd('help');
        let lines = help_resp.split('\n');
        lines = lines.filter(line => !/^help|^bdr|^exit|^save|^restore|^restart|^clear|^Commands:/.test(line.trim()));
        let ret = []
        for (let line of lines) {
            let one_cmd_obj = parseCommandLine(line.trim());
            if (one_cmd_obj.cmd.startsWith('undo ') || one_cmd_obj.cmd.startsWith('del') || one_cmd_obj.cmd.startsWith('list ')) {
                one_cmd_obj.no_bdr = true;
            }
            ret.push(one_cmd_obj);
        }
        return ret;
    },

    run_and_check: async function (cli, cmd_obj) {
        let orig_prompt = cli.current_prompt;
        let cmds = generate_various_cmds(cmd_obj.cmd, cmd_obj.params[0], cmd_obj);
        for (let cmd of cmds) {
            let output = await cli.run_cmd(cmd);
            expect(output).not.toContain('Usage:');
            expect(output.substring(0, 5)).not.toEqual('Error');
            if (cli.current_prompt !== orig_prompt) {
                let sub_commands = await this.collect_cmds(cli);
                for (let sub_cmd of sub_commands) {
                    await this.run_and_check(cli, sub_cmd);
                }
                await cli.run_cmd('return');
            }
            if (!cmd_obj.no_bdr) {
                let bdr = await cli.run_cmd('bdr');
                expect(bdr).toContain(cmd.trim());
                await cli.run_cmd('clear');
            }
        }
    }
}