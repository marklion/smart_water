import { print_test_log } from "../lib/test_utils";
import pict from 'pict-pairwise-testing'

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
const common_param_values = ['abcd', '12345', 'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa', 'a = b.a + 1'];
function convert_param(cmd, param) {
    let convert_ret = common_param_values;
    let exceptions = [
        {
            cmd: 'policy',
            param: 'view_name',
            values: ['abcd', 'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa']
        },
        {
            cmd: 'state',
            param: 'view_name',
            values: ['abcd', 'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa']
        },
        {
            cmd: 'transformer',
            param: 'view_name',
            values: ['abcd', 'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa']
        },
        {
            cmd: 'resource',
            param: 'view_name',
            values: ['abcd', 'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa']
        },
        {
            cmd: 'farm',
            param: 'view_name',
            values: ['abcd', 'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa']
        },
        {
            cmd: 'block',
            param: 'view_name',
            values: ['abcd', 'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa']
        },
        {
            cmd: 'add device',
            param: 'driver_name',
            values: ['virtualDevice']
        },
        {
            cmd: 'add device',
            param: 'longitude',
            values: ['20.3']
        },
        {
            cmd: 'add device',
            param: 'latitude',
            values: ['20.3']
        },
        {
            cmd: 'add farm',
            param: 'longitude',
            values: ['20.3']
        },
        {
            cmd: 'add farm',
            param: 'latitude',
            values: ['20.3']
        },
        {
            cmd: 'add block',
            param: 'block_area',
            values: ['100', '200.5', '0.05']
        },
        {
            cmd: 'enter action',
            param: 'device',
            values: ['LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa', 'abcd']
        },
        {
            cmd: 'exit action',
            param: 'device',
            values: ['LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa', 'abcd']
        },
        {
            cmd: 'do action',
            param: 'device',
            values: ['LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa', 'abcd']
        },
        {
            cmd: 'enter action',
            param: 'action',
            values: ['open', 'close']
        },
        {
            cmd: 'do action',
            param: 'action',
            values: ['open', 'close']
        },
        {
            cmd: 'exit action',
            param: 'action',
            values: ['open', 'close']
        },
        {
            cmd: 'del enter',
            param: 'device',
            values: ['abcd']
        },
        {
            cmd: 'del exit',
            param: 'device',
            values: ['abcd']
        },
        {
            cmd: 'del do',
            param: 'device',
            values: ['abcd']
        },
        {
            cmd: 'del enter',
            param: 'action',
            values: ['open']
        },
        {
            cmd: 'del do',
            param: 'action',
            values: ['open']
        },
        {
            cmd: 'del exit',
            param: 'action',
            values: ['open']
        },
        {
            cmd: 'del enter assignment',
            param: 'variable_name',
            values: ['LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa']
        },
        {
            cmd: 'del do assignment',
            param: 'variable_name',
            values: ['LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa']
        },
        {
            cmd: 'del exit assignment',
            param: 'variable_name',
            values: ['LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa']
        },
        {
            cmd: 'del enter crossAssignment',
            param: 'policy_name',
            values: ['abcd']
        },
        {
            cmd: 'del enter crossAssignment',
            param: 'variable_name',
            values: ['LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa']
        },
        {
            cmd: 'del do crossAssignment',
            param: 'variable_name',
            values: ['LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa']
        },
        {
            cmd: 'del do crossAssignment',
            param: 'policy_name',
            values: ['abcd']
        }, {
            cmd: 'del exit crossAssignment',
            param: 'variable_name',
            values: ['LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa']
        },
        {
            cmd: 'del exit crossAssignment',
            param: 'policy_name',
            values: ['abcd']
        },
        {
            cmd: 'del source',
            param: 'name',
            values: ['abcd', 'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa']
        },
        {
            cmd: 'scan period',
            param: 'period_ms',
            values: ['23'],
        },
        {
            cmd: 'del user',
            param: 'name',
            values: ['abcd', 'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa']
        },
        {
            cmd: 'enter assignment',
            param: 'is_constant',
            values: ['true', 'false']
        },
        {
            cmd: 'do assignment',
            param: 'is_constant',
            values: ['true', 'false']
        }, {
            cmd: 'exit assignment',
            param: 'is_constant',
            values: ['true', 'false']
        },
        {
            cmd: 'enter crossAssignment',
            param: 'is_constant',
            values: ['true', 'false']
        },
        {
            cmd: 'do crossAssignment',
            param: 'is_constant',
            values: ['true', 'false']
        }, {
            cmd: 'exit crossAssignment',
            param: 'is_constant',
            values: ['true', 'false']
        },
        {
            cmd: 'rule',
            param: 'is_constant',
            values: ['true', 'false']
        },
    ];
    for (let item of exceptions) {
        if (item.cmd === cmd && item.param === param) {
            convert_ret = item.values;
            break;
        }
    }
    return convert_ret.map(v => `'${v}'`);
}
function make_pairwise_cmds(cmd_obj) {
    let model = {
        parameters: cmd_obj.params.map(p => {
            return {
                property: p.text,
                values: convert_param(cmd_obj.cmd, p.text)
            }
        }),
    };
    let ret = [cmd_obj.cmd];
    if (cmd_obj.params.length > 0) {
        print_test_log(`test model:${JSON.stringify(model)}`);
        let tcs = pict.pict(model).testCases;
        print_test_log(`tcs:${JSON.stringify(tcs)}`);
        ret = tcs.map(param_set => {
            let cmd_line = cmd_obj.cmd;
            for (let p of cmd_obj.params) {
                let v = param_set[p.text];
                if (v && v.trim() != '') {
                    cmd_line += ' ' + v.trim();
                }
            }
            return cmd_line;
        });
    }

    return ret;
}
function cmds_depend_prepare(cmd, parent) {
    let farm_related_prepare = [
        'return',
        'farm',
        'add farm abcd 1 2 3',
        'add farm 12345 1 2 3',
        'add farm \'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa\' 1 2 3',
        'add farm \'a = b.a + 1\' 1 2 3',
        'return',
        'block'
    ];
    let farm_related_teardown = [
        'return',
        'farm',
        'undo add farm',
        'return',
        'block'
    ];
    let depends = [
        {
            cmd: 'del enter',
            depends: [
                'enter action abcd open',
            ],
            teardown: [
                'undo enter action',
            ]
        },
        {
            cmd: 'del do',
            depends: [
                'do action abcd open',
            ],
            teardown: [
                'undo do action',
            ]
        },
        {
            cmd: 'del exit',
            depends: [
                'exit action abcd open',
            ],
            teardown: [
                'undo exit action',
            ]
        },
        {
            cmd: 'policy',
            parent: 'sw_cli',
            depends: [
                'device',
                'add device abcd virtualDevice abcd 3 5',
                'add device LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa virtualDevice abcd 3 5',
                'return',
            ],
            teardown: [
                'device',
                'clear',
                'return'
            ],
        },
        {
            cmd: 'add block',
            depends: farm_related_prepare,
            teardown: farm_related_teardown,
        }, {
            cmd: 'del device',
            depends: [
                'add device abcd virtualDevice abcd 3 5',
                'add device 12345 virtualDevice 12345 4 5',
                'add device \'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa\' virtualDevice \'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa\' 5 5',
                'add device \'a = b.a + 1\' virtualDevice \'a = b.a + 1\' 3 3',
            ],
            teardown: [
                'undo add device',
            ],
        }, {
            cmd: 'del farm',
            depends: [
                'add farm abcd 1 2 3',
                'add farm 12345 1 2 3',
                'add farm \'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa\' 1 2 3',
                'add farm \'a = b.a + 1\' 1 2 3',
            ],
            teardown: [
                'undo add farm',
            ],
        }, {
            cmd: 'del block',
            depends: farm_related_prepare.concat([
                'add block abcd abcd 100',
                'add block abcd 12345 100',
                'add block abcd \'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa\' 100',
                'add block abcd \'a = b.a + 1\' 100',
                'add block 12345 abcd 100',
                'add block 12345 12345 100',
                'add block 12345 \'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa\' 100',
                'add block 12345 \'a = b.a + 1\' 100',
                'add block \'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa\' abcd 100',
                'add block \'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa\' 12345 100',
                'add block \'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa\' \'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa\' 100',
                'add block \'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa\' \'a = b.a + 1\' 100',
                'add block \'a = b.a + 1\' abcd 100',
                'add block \'a = b.a + 1\' 12345 100',
                'add block \'a = b.a + 1\' \'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa\' 100',
                'add block \'a = b.a + 1\' \'a = b.a + 1\' 100',
            ]),
            teardown: ([
                'undo add block',
            ]).concat(farm_related_teardown),
        }, {
            cmd: 'undo policy',
            depends: [
                'policy abcd',
                'return',
                'policy 12345',
                'return',
                'policy \'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa\'',
                'return',
                'policy \'a = b.a + 1\'',
                'return',
            ],
            teardown: [
                'clear',
            ],
        }, {
            cmd: 'undo state',
            depends: [
                'state abcd',
                'return',
                'state 12345',
                'return',
                'state \'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa\'',
                'return',
                'state \'a = b.a + 1\'',
                'return',
            ],
            teardown: [

            ],
        }, {
            cmd: 'del enter assignment',
            depends: [
                'enter assignment true LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa abcd',
            ],
            teardown: [
                'undo enter assignment',
            ],
        }, {
            cmd: 'del exit assignment',
            depends: [
                'exit assignment false LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa abcd',
            ],
            teardown: [
                'undo exit assignment',
            ],
        },
        {
            cmd: 'del do assignment',
            depends: [
                'do assignment true LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa abcd',
            ],
            teardown: [
                'undo do assignment',
            ],
        },
        {
            cmd: 'del enter crossAssignment',
            depends: [
                'enter crossAssignment true abcd LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa abcd'
            ],
            teardown: [
                'undo enter crossAssignment'
            ]
        },
        {
            cmd: 'del exit crossAssignment',
            depends: [
                'exit crossAssignment false abcd LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa abcd'
            ],
            teardown: [
                'undo exit crossAssignment'
            ]
        }, {
            cmd: 'del do crossAssignment',
            depends: [
                'do crossAssignment false abcd LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa abcd'
            ],
            teardown: [
                'undo do crossAssignment'
            ]
        }, {
            cmd: 'undo transformer',
            depends: [
                'transformer abcd',
                'return',
                'transformer 12345',
                'return',
                'transformer \'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa\'',
                'return',
                'transformer \'a = b.a + 1\'',
                'return',
            ],
            teardown: [
                'clear'
            ],
        }, {
            cmd: 'del source',
            depends: [
                'source abcd a b',
                'source LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa a b'
            ],
            teardown: [
                'undo source'
            ]
        }, {
            cmd: 'del user',
            depends: [
                'user abcd 12345',
                'user LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa 12345',
            ],
            teardown: [
                'undo user'
            ]
        },{
            cmd:'init state',
            depends:[
                'state abcd',
                'return',
                'state 12345',
                'return',
                'state \'LONG_param_aaaaaaaaaaaaaaaaaaaaaaaaa\'',
                'return',
                'state \'a = b.a + 1\'',
                'return',
            ],
            teardown:[
                'clear'
            ],
        }
    ];
    let ret = { depends: [], teardown: [] };
    for (let item of depends) {
        if (item.parent) {
            if (item.cmd === cmd && item.parent === parent) {
                ret = item;
                break;
            }
        }
        else {
            if (item.cmd === cmd) {
                ret = item;
                break;
            }
        }

    }
    return ret;
}
export default {
    commands_in_whitelist: function (prompt, cmd) {
        let ret = false;
        let whitelist = [
            {
                prompt: 'device',
                cmd: 'open'
            },
            {
                prompt: 'device',
                cmd: 'close'
            },
            {
                prompt: 'device',
                cmd: 'readout'
            },
            {
                prompt: 'device',
                cmd: 'mock readout'
            },
        ];
        for (let item of whitelist) {
            if (prompt.includes(item.prompt) && cmd == item.cmd) {
                ret = true;
                break;
            }
        }
        return ret;
    },
    collect_cmds: async function (cli, cur_level = 'sw_cli') {
        let help_resp = await cli.run_cmd('help');
        print_test_log(`Collect commands from prompt: ${cli.current_prompt}`);
        let lines = help_resp.split('\n');
        lines = lines.filter(line => !/^return|^help|^bdr|^exit|^save|^restore|^restart|^clear|^Commands:/.test(line.trim()));
        let ret = []
        for (let line of lines) {
            let one_cmd_obj = parseCommandLine(line.trim());
            if (one_cmd_obj.cmd.startsWith('undo ') || one_cmd_obj.cmd.startsWith('del') || one_cmd_obj.cmd.startsWith('list ')) {
                one_cmd_obj.no_bdr = true;
            }
            one_cmd_obj.parent = cur_level;
            if (!this.commands_in_whitelist(cli.current_prompt, one_cmd_obj.cmd)) {
                ret.push(one_cmd_obj);
            }
            one_cmd_obj.depend_define = cmds_depend_prepare(one_cmd_obj.cmd, one_cmd_obj.parent);
        }
        return ret;
    },

    run_and_check: async function (cli, cmd_obj) {
        let orig_prompt = cli.current_prompt;
        let cmds = make_pairwise_cmds(cmd_obj);
        print_test_log(`run cmds: ${JSON.stringify(cmds)}`);
        for (let cmd of cmds) {
            for (let depend of cmd_obj.depend_define.depends) {
                await cli.run_cmd(depend);
            }
            let output = await cli.run_cmd(cmd);
            expect(output).not.toContain('Usage:');
            expect(output).not.toContain('Invalid Command');
            expect(output).not.toContain('失败');
            expect(output.substring(0, 5)).not.toEqual('Error');
            let is_view_cmd = false;
            if (cli.current_prompt !== orig_prompt) {
                let sub_commands = await this.collect_cmds(cli, cmd_obj.cmd);
                for (let sub_cmd of sub_commands) {
                    await this.run_and_check(cli, sub_cmd);
                }
                await cli.run_cmd('return');
                is_view_cmd = true;
            }
            if (!cmd_obj.no_bdr) {
                let bdr = await cli.run_cmd('bdr');
                expect(bdr).toContain(cmd.trim());
                await cli.run_cmd('clear');
            }
            if (cmd_obj.params.length > 0 || !is_view_cmd) {
                let bdr = await cli.run_cmd('bdr');
                expect(bdr).not.toContain(cmd.trim());
            }
            for (let teardown of cmd_obj.depend_define.teardown) {
                await cli.run_cmd(teardown);
            }
        }
    }
}