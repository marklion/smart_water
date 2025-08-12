import pty from 'node-pty';
let g_server = null;
async function start_server() {
    let ret = {};

    ret = pty.spawn('npm', ['run', 'start_server'], {
        cwd: process.cwd(),
        env: process.env
    });
    await new Promise(resolve => {
        let start_log = ''
        ret.on('data', function (data) {
            start_log += data;
            console.log(data);

            if (start_log.includes('Server running on port')) {
                ret.removeAllListeners('data');
                resolve();
            }
        });
    });
    g_server = ret;
    console.log('Server started successfully at ' + new Date().toLocaleTimeString());
}
async function close_server() {
    if (g_server) {
        await new Promise((resolve) => {
            g_server.on('exit', () => {
                resolve();
            });
            g_server.kill();
        });
        g_server = null;
    }

    console.log('Server closed successfully at ' + new Date().toLocaleTimeString());
}

export default async function create_cli(processName) {
    let ret = {};

    // 解析命令和参数
    const parts = processName.split(' ');
    const command = parts[0];
    const args = parts.slice(1);

    ret.process = pty.spawn(command, args, {
        cwd: process.cwd(),
        env: process.env
    });
    ret.output = '';
    ret.process.on('data', function (data) {
        ret.output += data;
    });
    async function waitForPrompt(prompt) {
        return new Promise((resolve) => {
            const checkOutput = setInterval(() => {
                //console.log('ret.output:', ret.output);
                // 找到 output 中包含 prompt 并且 prompt 是行末的行
                let lines = ret.output.split('\n');
                lines = lines.map(line => line.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, ''));
                let promptLine = lines.find(line => {
                    return line.endsWith(prompt)
                });
                if (promptLine) {
                    lines = lines.slice(1);
                    lines = lines.filter(line => line.trim() !== '');

                    ret.output = lines.join('\n');
                    clearInterval(checkOutput);
                    let outputBeforePrompt = ''
                    let index = ret.output.indexOf(promptLine);
                    if (index > 0 && ret.output[index - 1] === '\n') {
                        index--;
                        outputBeforePrompt = ret.output.substring(0, index);
                    }
                    ret.output = ret.output.substring(index + promptLine.length);
                    resolve({
                        prompt: promptLine,
                        content: outputBeforePrompt,
                    });
                }
            }, 100);
        });
    }
    ret.run_cmd = async function (cmd, prompt = '> ') {
        ret.output = '';
        ret.process.write(cmd + '\n');
        let resp = await waitForPrompt(prompt);
        console.log(`In ${resp.prompt} Run Cmd: ${cmd} -> Output:\n${resp.content}`);

        return resp.content;
    }
    ret.close = async function () {
        ret.process.write('exit\n');
    }

    ret.save_config = async function () {
        let new_cli = await create_cli(processName);
        await new_cli.run_cmd('save', 'sw_cli> ');
        await new_cli.close();
    }
    ret.clear_config = async function () {
        let new_cli = await create_cli(processName);
        await new_cli.run_cmd('clear', 'sw_cli> ');
        await new_cli.close();
    }
    ret.restore_config = async function () {
        let new_cli = await create_cli(processName);
        await new_cli.run_cmd('restore', 'sw_cli> ');
        await new_cli.close();
    }
    await waitForPrompt('sw_cli> ');

    return ret;
}
export { start_server, close_server };