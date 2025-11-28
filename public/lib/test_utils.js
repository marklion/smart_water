import pty from 'node-pty';
import moment from 'moment';
import axios from 'axios';
let g_server = null;
function print_test_log(log, need_equal_sign = false) {
    let now = moment().format('YYYY-MM-DD HH:mm:ss:SSS');
    let real_log = log;
    if (typeof log === 'object') {
        real_log = JSON.stringify(log, null, 2);
    }
    if (need_equal_sign) {
        real_log = `=======${real_log}=======`;
    }
    console.log(`[${now}] ${real_log}`);
}
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
            if (start_log.includes('Server running on port')) {
                ret.removeAllListeners('data');
                resolve();
            }
        });
    });
    g_server = ret;
    print_test_log('Server started successfully at ' + new Date().toLocaleTimeString());
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

    print_test_log('Server closed successfully at ' + new Date().toLocaleTimeString());
}
async function wait_ms(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}
async function wait_spend_ms(start_point, ms) {
    return new Promise(resolve => {
        let int = setInterval(() => {
            if (Date.now() - start_point >= ms) {
                clearInterval(int);
                resolve();
            }
        }, 10);
    });
}
async function call_api(path, params) {
    let real_path = `http://localhost:47147/api/v1${path}`;
    let ret = '';
    try {
        console.log(`send req:${JSON.stringify(params)} to ${real_path}`);
        // 测试环境的请求添加 CLI 标识，这样不需要 token
        const response = await axios.post(real_path, params, {
            headers: {
                'Content-Type': 'application/json',
                'X-Request-Source': 'cli'
            }
        });
        console.log(`recv resp:${JSON.stringify(response.data)}`);

        if (response.data.err_msg) {
            throw new Error(response.data.err_msg);
        }
        ret = response.data.result;
    } catch (error) {
        console.error('Error calling API:', error);
        throw error;
    }
    return ret;
}

export default async function create_cli(processName) {
    let ret = {};

    // 解析命令和参数
    const parts = processName.split(' ');
    const command = parts[0];
    const args = parts.slice(1);

    ret.process = pty.spawn(command, args, {
        cwd: process.cwd(),
        env: process.env,
        cols: 320,
        rows: 600,
    });
    ret.output = '';
    ret.process.on('data', function (data) {
        ret.output += data;
        if (data.includes('是否继续显示')) {
            ret.process.write('y\n');
        }
    });
    async function waitForPrompt(prompt, wait_gap = 10) {
        return new Promise((resolve) => {
            const checkOutput = setInterval(() => {
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
            }, wait_gap);
        });
    }
    ret.run_cmd = async function (cmd, prompt = '> ') {
        ret.output = '';
        ret.process.write(cmd + '\n');
        let wait_gap = 10;
        if (cmd === 'clear' || cmd.startsWith('restore')) {
            wait_gap = 500;
        }
        let resp = await waitForPrompt(prompt, wait_gap);
        if (cmd != 'clear') {
            print_test_log(`In ${resp.prompt} Run Cmd: ${cmd} -> Output:\n${resp.content}`);
        }
        ret.current_prompt = resp.prompt;

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
export { start_server, close_server, print_test_log, wait_ms, call_api, wait_spend_ms };