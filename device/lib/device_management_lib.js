import call_remote from '../../public/lib/call_remote.js';
export default{
    get_driver_list: async function (token, pageNo = 0) {
        return await call_remote('/device_management/list_driver', { pageNo }, token);
    }
}