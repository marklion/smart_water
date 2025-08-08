import pty from 'node-pty';

async function start_server() {
    let ret = {};

    ret = pty.spawn('npm', ['run', 'dev_server'], {
        cwd: process.cwd(),
        env: process.env
    });
    await new Promise(resolve => {
        ret.on('data', function (data) {
            if (data.includes('Server running on port')) {
                resolve();
            }
        });
    });

    return ret;
}

export default async function (processName) {
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
                let promptLine = lines.find(line => {
                    line = line.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
                    return line.endsWith(prompt)
                });
                if (promptLine) {
                    lines = lines.slice(1);
                    ret.output = lines.join('\n');
                    clearInterval(checkOutput);
                    let index = ret.output.indexOf(promptLine);
                    let outputBeforePrompt = ret.output.substring(0, index);
                    ret.output = ret.output.substring(index + promptLine.length);
                    resolve(outputBeforePrompt);
                }
            }, 100);
        });
    }
    ret.run_cmd = async function (cmd) {
        ret.output = '';
        ret.process.write(cmd + '\n');
        return await waitForPrompt('> ');
    }
    ret.close = async function () {
        ret.process.write('exit\n');
        ret.server.kill();
    }
    ret.server = await start_server();
    await waitForPrompt('sw_cli> ');

    return ret;
}