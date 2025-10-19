import call_remote from '../../public/lib/call_remote.js';
export default {
    generate_warning: async function (content, token) {
        return await call_remote('/warning/generate_warning', { content }, token);
    },
    list_warnings: async function (pageNo, token) {
        return await call_remote('/warning/list_warnings', { pageNo }, token);
    },
}