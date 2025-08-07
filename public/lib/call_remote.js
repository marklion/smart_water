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