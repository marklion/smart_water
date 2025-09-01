function copy_by_key(source, target) {
    let ret = {};
    Object.keys(source).forEach((itr) => {
        let element = source[itr];
        let source_type = Object.prototype.toString.call(element);
        let target_type = Object.prototype.toString.call(target[itr]);
        if (target[itr] != undefined && source_type == target_type) {
            if (source_type == '[object Object]') {
                ret[itr] = copy_by_key(element, target[itr]);
            } else if (target_type == '[object Array]') {
                ret[itr] = [];
                target[itr].forEach((sub_itr) => {
                    ret[itr].push(copy_by_key(element[0], sub_itr));
                });
            } else {
                ret[itr] = target[itr];
            }
        }
    });
    return ret;
}

function result_maker(result, reason = 'undefined error message', result_define = {}) {
    let ret = { err_msg: reason };
    if (null != result && result_define != {}) {
        ret = { result: copy_by_key(result_define, result), err_msg: '' };
    }

    return ret;
}
function make_params_help_info(params, is_params = true) {
    let ret = [];
    let rows = [];
    let sub_p = [];

    if (params == undefined) {
        return ret;
    }

    let all_cols = Object.keys(params);
    all_cols.sort();

    all_cols.forEach(itr => {
        let example = '';
        if (params[itr].example != undefined) {
            example = params[itr].example;
            if (params[itr].type == String) {
                example = '"' + example + '"';
            }
        }
        if (is_params) {
            let param_array = [itr, params[itr].type.name, params[itr].have_to.toString(), params[itr].mean, example];
            rows.push(param_array);
        }
        else {
            let result_array = [itr, params[itr].type.name, params[itr].mean, example];
            rows.push(result_array);
        }
        if (params[itr].type == Object || params[itr].type == Array) {
            let one_sub_p = {
                ...
                params[itr] };
            one_sub_p.name = itr;
            sub_p.push(one_sub_p);
        }
    });
    let table_header = ["字段名", "类型", "是否必填", "描述", "范例"];
    if (!is_params) {
        table_header = ["字段名", "类型", "描述", "范例"];
    }
    ret.push({
        table: {
            headers: table_header,
            rows: rows,
        },
    });

    sub_p.forEach(sp => {
        ret.push({ h3: sp.name });
        ret = ret.concat(make_params_help_info(sp.explain, is_params));
    });

    return ret;
}
function make_req_example(params) {
    let ret = {};
    let all_cols = Object.keys(params);
    all_cols.sort();
    all_cols.forEach(itr => {
        let example = '';
        if (params[itr].example != undefined) {
            example = params[itr].example;
        }
        if (params[itr].type == Object) {
            ret[itr] = make_req_example(params[itr].explain);
        }
        else if (params[itr].type == Array) {
            ret[itr] = [make_req_example(params[itr].explain)];
        }
        else {
            ret[itr] = example;
        }
    });
    return ret;
}
function api_param_walk_check(api_param_req, input) {
    let ret = "params input wrong";
    if (input != undefined) {
        if (Object.prototype.toString.call(api_param_req.type()) == Object.prototype.toString.call(input)) {
            ret = "";
        }
        else {
            ret = " require " + api_param_req.type.name + " but input " + Object.prototype.toString.call(input);
        }
    }
    else {
        if (!api_param_req.have_to) {
            ret = "";
        }
        else {
            ret = " param missed";
        }
    }

    if (ret.length == 0 && input) {
        if (api_param_req.type == Object) {
            let explain_keys = Object.keys(api_param_req.explain);
            for (let index = 0; index < explain_keys.length; index++) {
                let itr = explain_keys[index];
                const element = api_param_req.explain[itr];
                let sub_ret = api_param_walk_check(element, input[itr]);
                if (sub_ret.length > 0) {
                    ret = "." + itr + sub_ret;
                    break;
                }
            }
        }
        else if (api_param_req.type == Array) {
            let explain_keys = Object.keys(api_param_req.explain);
            for (let index = 0; index < explain_keys.length; index++) {
                let itr = explain_keys[index];
                const element = api_param_req.explain[itr];
                for (let i = 0; i < input.length; i++) {
                    let sub_ret = api_param_walk_check(element, input[i][itr]);
                    if (sub_ret.length > 0) {
                        ret = "." + itr + sub_ret;
                        break;
                    }
                }
                if (ret.length > 0) {
                    break;
                }
            }
        }
    }

    return ret;
}

function api_param_check(param_req, input) {
    let ret = '';
    let all_cols = Object.keys(param_req);
    let tmp = {...input};
    input = [];
    all_cols.forEach(itr => {
        let sub_ret = api_param_walk_check(param_req[itr], tmp[itr]);
        if (sub_ret.length > 0) {
            ret = itr + sub_ret;
            return ret;
        }
        else
        {
            input[itr] = tmp[itr];
        }
    });

    return ret;
}

function make_api(path, module, is_write, need_rbac, params, result, title, description, is_get_api = false) {
    let temp_params = { ...params };
    let temp_result = { ...result };
    if (is_get_api) {
        temp_params.pageNo = { type: Number, have_to: false, mean: '页码', example: 0 };
        temp_result.total = { type: Number, mean: '总数', example: 100 };
    }
    let ret = {
        path: path, module: module, is_write: is_write, need_rbac: need_rbac, params: temp_params, result: temp_result, title: title, description: description,
        add_handler: function (handler) {
            this.handler = handler;
            return this;
        },
        make_help_info: function () {
            let ret = []
            console.log(this.title)
            ret.push({ h1: this.module + '--' + this.title });
            ret.push({ code: { content: this.path } });
            ret.push({ h2: '描述' });
            ret.push({ p: description });
            ret.push({ h2: '参数' });
            ret = ret.concat(make_params_help_info(this.params));
            ret.push({ h2: '返回值' });
            ret = ret.concat(make_params_help_info(this.result, false));
            ret.push({ h2: '举例' });
            ret.push({ h3: '请求' });
            ret.push({ code: { content: JSON.stringify(make_req_example(this.params), null, 4) } });
            ret.push({ h3: '回复' });
            ret.push({
                code: {
                    content: JSON.stringify(
                        {
                            err_msg: '',
                            result: make_req_example(this.result)
                        }
                        , null, 4)
                }
            });

            return ret;
        },
        install: function (app) {
            app.post('/api/v1' + this.path, async (req, res) => {
                let start_time = new Date().getTime();
                let body = req.body;
                let token = req.headers['token'];
                let ret = result_maker(null, '未知错误');
                try {
                    // 检查是否需要token验证
                    const isLoginApi = this.path === '/auth/login';
                    const isLocalRequest = checkIsLocalRequest(req);
                    
                    if (!isLoginApi && !isLocalRequest) {
                        // 非登录接口且非本机请求需要验证token
                        if (!token) {
                            ret = result_maker(null, '缺少token，请先登录');
                            res.send(ret);
                            return;
                        }
                        
                        // 验证token有效性
                        if (app.authModule && app.authModule.verifyToken) {
                            try {
                                const decoded = app.authModule.verifyToken(token);
                                if (!decoded) {
                                    ret = result_maker(null, 'Token无效或已过期，请重新登录');
                                    res.send(ret);
                                    return;
                                }
                                req.user = decoded;
                            } catch (authError) {
                                ret = result_maker(null, 'Token验证失败，请重新登录');
                                res.send(ret);
                                return;
                            }
                        }
                    }
                } catch (authError) {
                    console.error('Token验证出错:', authError);
                    ret = result_maker(null, '身份验证失败');
                    res.send(ret);
                    return;
                }
                
                let pc_ret = api_param_check(this.params, body);
                if (pc_ret.length > 0) {
                    ret = result_maker(null, '参数错误:' + pc_ret);
                }
                else {
                    try {
                        if (is_get_api && body.pageNo == undefined) {
                            body.pageNo = 0;
                        }
                        let result = await this.handler(body, token);
                        ret = result_maker(result, '', make_req_example(this.result))
                    } catch (error) {
                        console.log(error);
                        if (error.err_msg) {
                            ret = result_maker(null, error.err_msg);
                        }
                        else {
                            ret = result_maker(null, JSON.stringify(error));
                        }
                    }
                }
                let end_time = new Date().getTime();
                console.log((end_time - start_time) + '->' + this.path);
                res.send(ret);
            });
            app.help_info.push(this.make_help_info());
        },
    };

    return ret;
}

// 检查请求是否来自本机
function checkIsLocalRequest(req) {
    const remoteAddress = req.connection?.remoteAddress || 
                         req.socket?.remoteAddress ||
                         req.ip ||
                         '127.0.0.1';
    
    // 检查是否是本机地址
    const localAddresses = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
    return localAddresses.includes(remoteAddress);
}

export default make_api;
