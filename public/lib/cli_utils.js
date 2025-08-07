import Vorpal from 'vorpal';
const g_key_event = {
    key: undefined,
    value: undefined
}
export default {
    create_vorpal: function () {
        const vorpal = Vorpal();
        // vorpal.ui.on('vorpal_ui_keypress', function (data) {
        //     vorpal.emit('keypress', data);
        //     if (vorpal.ui.parent == vorpal) {
        //         vorpal._onKeypress(data.key, data.value);
        //     }
        // });
        // vorpal.hide();
        vorpal.on('keypress', function (data) {
            if (data.key != undefined) {
                g_key_event.key = data.key;
                g_key_event.value = data.value;
            }
            if (vorpal.ui.parent != vorpal) {
                data.key = undefined;
                data.value = undefined;
            }
            else {
                data.key = g_key_event.key;
                data.value = g_key_event.value;
            }
        });
        return vorpal;
    },

    add_sub_cli: function (cli, sub_cli_definition, parent_prompt) {
        let ins = this;
        let sub_cli = sub_cli_definition.install(parent_prompt);
        cli.command(sub_cli_definition.command, '进入' + sub_cli_definition.name)
            .action(async function (args) {
                cli.hide();
                sub_cli.show();
                return sub_cli;
            });
        sub_cli.command('return', '返回上一级视图')
            .alias('back')
            .action(async function (args) {
                sub_cli.hide();
                cli.show();
                return cli;
            });
        sub_cli.command('clear', '清除当前配置')
            .action(async function (args) {
                try {
                    await ins.clear_config(sub_cli);
                    this.log('当前配置已清除');
                } catch (err) {
                    this.log('Error:', err.err_msg || '未知错误');
                }
            });
        if (!cli.sub_clies) {
            cli.sub_clies = [];
        }
        cli.sub_clies.push(sub_cli_definition);
    },
    make_sub_bdr: async function (cur_cli) {
        let ret = [];
        let sub_clies = cur_cli.sub_clies;
        if (sub_clies) {
            for (let sub_cli of sub_clies) {
                ret.push(sub_cli.command);
                let sub_bdr = await sub_cli.make_bdr();
                sub_bdr.forEach(element => {
                    ret.push('  ' + element);
                });
                ret.push('return');
            }
        }
        return ret;
    },
    clear_config: async function (vorpal) {
        let undo_cmd_array = vorpal.undo_cmd_array;
        if (undo_cmd_array != undefined) {
            for (let undo_cmd of undo_cmd_array) {
                await vorpal.execSync(undo_cmd);
            }
        }
        let sub_clies = vorpal.sub_clies;
        if (sub_clies != undefined) {
            for (let sub_cli of sub_clies) {
                await vorpal.execSync(sub_cli.command)
                await this.clear_config(sub_cli._vorpalInstance);
                await sub_cli._vorpalInstance.execSync('return');
            }
        }
    },
    make_common_cmd: function (vorpal, cmd, description, func) {
        let ret = vorpal.command(cmd, description)
            .action(async function (args) {
                try {
                    let result = await func(this, args);
                    if (result) {
                        this.log(result);
                    }
                } catch (err) {
                    this.log('Error:', err.err_msg || '未知错误');
                }
            });
        return ret;
    },
    make_undo_cmd: function (vorpal, cmd, config_description, undo_description, config_func, undo_func) {
        let ret = vorpal.command(cmd, config_description)
            .action(async function (args) {
                try {
                    let result = await config_func(this, args);
                    if (result) {
                        this.log(result);
                    }
                } catch (err) {
                    this.log('Error:', err.err_msg || '未知错误');
                }
            });
        let undo_cmd_string = 'undo ' + cmd.split(/[<[]/)[0].trim();
        vorpal.command(undo_cmd_string, undo_description)
            .action(async function (args) {
                try {
                    let result = await undo_func(this, args);
                    if (result) {
                        this.log(result);
                    }
                } catch (err) {
                    this.log('Error:', err.err_msg || '未知错误');
                }
            });
        if (vorpal.undo_cmd_array == undefined) {
            vorpal.undo_cmd_array = [];
        }
        vorpal.undo_cmd_array.push(undo_cmd_string);
        return ret;
    },
    make_display_cmd: function (vorpal, cmd, description, func) {
        let ret = vorpal.command(cmd, description)
            .action(async function (args) {
                try {
                    let cur_page = 0;
                    let all_finished = false;
                    while (all_finished == false) {
                        let got_count = await func(this, args, cur_page);
                        if (got_count <= 0) {
                            all_finished = true;
                        } else {
                            let result = await this.prompt(
                                {
                                    type: 'confirm',
                                    name: 'continue',
                                    default: true,
                                    message: '是否继续显示？'
                                }
                            );
                            if (result.continue == false) {
                                all_finished = true;
                            }
                        }
                        cur_page++;
                    }
                } catch (err) {
                    this.log('Error:', err.err_msg || '未知错误');
                }
            })
        return ret;
    }
}