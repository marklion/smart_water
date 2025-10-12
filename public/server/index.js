import express from 'express';
import json2md from 'json2md';
import dotenv from 'dotenv';
import MarkdownIt from 'markdown-it';
import mdTocAndAnchor from 'markdown-it-toc-and-anchor';
import cli_runtime_lib from '../cli/cli_runtime_lib.js';
import path from 'path';
import { fileURLToPath } from 'url';
import historyApiFallback from 'connect-history-api-fallback';
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: envFile });
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.help_info = [];
app.use(historyApiFallback());

import mkapi from './api_utils.js';
async function module_install(app, module) {
    let mo = module;
    Object.keys(mo.methods).forEach(itr => {
        let method_name = itr;
        let method = mo.methods[itr];
        mkapi('/' + mo.name + '/' + method_name,
            mo.name, method.is_write, method.need_rbac,
            method.params, method.result, method.name,
            method.description, method.is_get_api).add_handler(
                method.func
            ).install(app);
    });
}

async function init_super_user() {
    const authModule = (await import('../../web/server/auth_module.js')).default;
    app.authModule = authModule; // 将认证模块添加到app中，供api_utils使用
    await module_install(app, authModule);
    await module_install(app, (await import('../../device/server/device_management_module.js')).default);
    await module_install(app, (await import('../../resource/server/resource_module.js')).default);
    await module_install(app, (await import('../../policy/server/policy_module.js')).default);
    await module_install(app, (await import('../../weather/server/weather_module.js')).default);
    await module_install(app, (await import('../../monitoring/server/monitoring_module.js')).default);
}
// 托管前端静态文件
let web_dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'web');
console.log(`Web directory: ${web_dir}`);
app.use(express.static(web_dir));

app.post('/api/v1/restart', async (req, res)=>{
    res.json({
        err_msg: '',
        result: 'Server is restarting...'
    });
    console.log('Server is restarting...');
    setTimeout(() => {
        process.exit(-1);
    }, 1000);
})
var sys_name = 'no name';
app.post('/api/v1/set_sys_name', async (req, res)=>{
    sys_name = req.body.sys_name;
    res.json({
        err_msg: '',
        result: {result:true}
    });
});
app.post('/api/v1/get_sys_name', async (req, res)=>{
    res.json({
        err_msg: '',
        result: {sys_name: sys_name}
    });
});
app.get('/api/help', (req, res) => {
    let out_json = app.help_info;

    const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
    });

    md.use(mdTocAndAnchor, {
        toc: true,
        tocFirstLevel: 1,
        tocLastLevel: 6,
        wrapHeadingTextInAnchor: true
    });

    let markdownText = json2md(out_json);
    markdownText =
        `
# 概述
+ 本文档中所有接口使用 POST 方法
+ 除登录接口之外，需要先调用登录接口获取 token，然后在请求头中带上 token 才能调用其他接口
+ 每个接口的参数和返回值都是 JSON 格式
+ 接口返回的对象中会携带两个字段，err_msg 和 result
+ err_msg 为空字符串表示成功，否则表示失败
+ result字段是真正的接口返回值，每个接口的返回值都不一样，具体参考接口文档
    ` + markdownText;
    const htmlContent = md.render(markdownText);
    const html = `
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@4.0.0/github-markdown.min.css">
    <title>接口文档</title>
    <style>
        #toc {
            position: fixed;
            left: 0;
            top: 0;
            width: 400px;
            height: 100%;
            overflow: auto;
            border-right: 1px solid #000;
        }
        #content {
            margin-left: 410px;
        }
        #toc a {
            display: block;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div id="toc"></div>
    <article class="markdown-body">
    <div id="content">${htmlContent}</div>
    </article>
    <script>
    window.onload = function() {
        const toc = document.getElementById('toc');
        const links = document.querySelectorAll('#content h1 a');
        let titels = [];
        links.forEach((link, index) => {
            const newLink = document.createElement('a');
            newLink.href = link.href;
            newLink.textContent = link.textContent;
            titels.push(newLink);
        });
        titels.sort((a, b) => {
            return a.textContent.localeCompare(b.textContent);
        });
        titels.forEach((link,index) => {
            link.textContent = (index + 1) + '. ' +link.textContent;
            toc.appendChild(link);
        });
    }
    </script>
</body>
</html>
`;
    res.send(html);
});

let server = app.listen(parseInt(process.env.PORT), async () => {
    await init_super_user();
    try {
        await cli_runtime_lib.restore_config();
        cli_runtime_lib.destroy();
    } catch (error) {
        console.log(error);
    }
    console.log('Server running on port ' + process.env.PORT)
});
process.on('uncaughtException', (err) => {
    console.error('An uncaught error occurred!');
    console.error(err.stack);
});
process.on('SIGINT', () => {
    console.log('SIGINT signal received. Closing server...');
    server.close();
});
