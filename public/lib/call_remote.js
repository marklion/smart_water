import axios from 'axios';
let err_handler = undefined;
const request = (options) => {
    return new Promise((resolve, reject) => {
        const defaultOptions = {
            url: '',
            method: 'POST',
            data: {},
            header: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        };

        const requestOptions = { ...defaultOptions, ...options };

        uni.request({
            ...requestOptions,
            success: (res) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(res);
                } else {
                    reject(new Error(`请求失败: ${res.statusCode}`));
                }
            },
            fail: (err) => {
                reject(err);
            }
        });
    });
};
export default async function (url, body) {
    let isBrowser = false;
    let app_server = undefined;
    let token = '';
    try {
        app_server = uni.getStorageSync('app_server') || '';
        token = uni.getStorageSync('auth_token') || '';

        isBrowser = true;
    } catch (error) {
    }
    if (token == '') {
        try {
            token = localStorage.getItem('auth_token') || '';
            isBrowser = true;
        } catch (error) {
        }
    }
    let url_prefix = isBrowser ? '' : 'http://localhost:47147'
    if (app_server) {
        url_prefix = app_server;
    }

    const headers = {
        'Content-Type': 'application/json',
        'token': token
    };
    // CLI 请求添加特殊标识，用于服务器识别
    if (!isBrowser) {
        headers['X-Request-Source'] = 'cli';
    }
    let resp;
    if (isBrowser) {
        resp = await request({
            url: url_prefix + '/api/v1' + url,
            method: 'POST',
            data: body,
            header: headers
        });
    }
    else {
        resp = await axios.post(url_prefix + '/api/v1' + url, body, {
            headers: headers
        });
    }
    if (resp.data.err_msg) {
        if (err_handler) {
            await err_handler(resp.data.err_msg);
        }
        throw { err_msg: resp.data.err_msg }; // Handle error from the server
    }
    let result = resp.data;

    return result.result; // Return the result part of the response
}
export function inject_err_handler(fn) {
    err_handler = fn;
}
export async function find_by_list(list_fn, cmp_func, token) {
    let ret = undefined;
    let pageNo = 0;
    while (true) {
        let result_items = await list_fn(pageNo, token);
        if (result_items && result_items.length > 0) {
            ret = result_items.find(cmp_func);
            if (ret !== undefined) {
                break;
            }
            pageNo++;
        }
        else {
            break;
        }
    }

    return ret;
}
