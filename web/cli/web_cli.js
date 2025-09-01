import cli_utils from '../../public/lib/cli_utils.js';
import web_lib from '../lib/web_lib.js';

export default {
    command: 'web',
    name: 'Web用户管理',
    _vorpalInstance: null,
    install: function (parent_prompt) {
        let prompt = parent_prompt + 'web> ';
        let ins = this;
        const vorpal = cli_utils.create_vorpal();
        this._vorpalInstance = vorpal;

        cli_utils.make_common_cmd(vorpal, 'add user <name> <password>', '新增一个用户', async (cmd_this, args) => {
            const result = await web_lib.add_user(args.name, args.password);
            return `用户 "${args.name}" 创建成功`;
        });
        cli_utils.make_common_cmd(vorpal, 'del user <name>', '删除用户', async (cmd_this, args) => {
            const result = await web_lib.del_user(args.name);
            return `用户 "${args.name}" 删除成功`;
        });
        cli_utils.make_common_cmd(vorpal, 'bdr', '列出当前用户配置', async (cmd_this, args) => {
            const commands = await ins.make_bdr('');
            return commands.join('\n');
        });
        
        vorpal.delimiter(prompt);
        return vorpal;
    },
    make_bdr: async function (view_name) {
        try {
            const result = await web_lib.list_users();
            let commands = [];
            result.users.forEach(user => {
                commands.push(`add user ${user.username} ********`);
            });
            
            return commands;
        } catch (err) {
            console.error('获取用户列表失败:', err.err_msg || err.message);
            return [];
        }
    }
};
