import axios from 'axios';
let err_handler = undefined;
export default async function (url, body, token = '') {
    const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
    const url_prefix = isBrowser ? '' : 'http://localhost:47147';
    let resp = await axios.post(url_prefix + '/api/v1' + url, body, {
        headers: {
            'Content-Type': 'application/json',
            'token': token
        }
    });
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
        else
        {
            break;
        }
    }

    return ret;
}
