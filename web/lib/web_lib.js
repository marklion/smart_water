import call_remote from '../../public/lib/call_remote.js';

export default {
    add_user: async function (username, password, role) {
        return await call_remote('/auth/add_user', {
            username: username,
            password: password,
            role: role
        });
    },
    del_user: async function (username) {
        return await call_remote('/auth/del_user', {
            username: username
        });
    },
    list_users: async function () {
        return await call_remote('/auth/list_users', {});
    },
    login: async function (username, password) {
        return await call_remote('/auth/login', {
            username: username,
            password: password
        });
    },
};
