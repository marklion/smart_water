import call_remote from '../../public/lib/call_remote.js';
export default {
    add_water_group_valve: async function (wgv_config, token) {
        let req = {
            farm_name: wgv_config.farm_name,
            block_name: wgv_config.block_name,
            valve_name: wgv_config.valve_name,
            driver_name: wgv_config.driver_name,
            valve_config_key: wgv_config.valve_config_key,
            latitude: parseFloat(wgv_config.latitude),
            longitude: parseFloat(wgv_config.longitude),
            open_pressure_low_limit: parseFloat(wgv_config.open_pressure_low_limit),
            close_pressure_high_limit: parseFloat(wgv_config.close_pressure_high_limit),
            pressure_check_interval: parseInt(wgv_config.pressure_check_interval),
        };
        return await call_remote('/config/add_water_group_valve', req, token);
    },
    init_water_policy: async function (water_config, token) {
        let req = {
            farm_name: water_config.farm_name,
            flow_warning_low_limit: parseFloat(water_config.flow_warning_low_limit),
            flow_warning_high_limit: parseFloat(water_config.flow_warning_high_limit),
            pressure_warning_low_limit: parseFloat(water_config.pressure_warning_low_limit),
            pressure_warning_high_limit: parseFloat(water_config.pressure_warning_high_limit),
            pressure_shutdown_low_limit: parseFloat(water_config.pressure_shutdown_low_limit),
            pressure_shutdown_high_limit: parseFloat(water_config.pressure_shutdown_high_limit),
            flow_check_interval: parseInt(water_config.flow_check_interval),
            pressure_shutdown_check_interval: parseInt(water_config.pressure_shutdown_check_interval),
        };
        return await call_remote('/config/init_water_policy', req, token);
    },
    init_fert_policy: async function (fert_config, token) {
        let req = {
            farm_name: fert_config.farm_name,
            flow_expected_value: parseFloat(fert_config.flow_expected_value),
            flow_warning_max_offset: parseFloat(fert_config.flow_warning_max_offset),
            flow_check_interval: parseInt(fert_config.flow_check_interval),
            level_warning_limit: parseFloat(fert_config.level_warning_limit),
            level_shutdown_limit: parseFloat(fert_config.level_shutdown_limit),
            level_check_interval: parseInt(fert_config.level_check_interval),
        };
        return await call_remote('/config/init_fert_policy', req, token);
    },
    init_fert_mixing_policy: async function (fert_mixing_config, token) {
        let req = {
            farm_name: fert_mixing_config.farm_name,
        };
        if (fert_mixing_config.mixing_pump_name) {
            req.mixing_pump_name = fert_mixing_config.mixing_pump_name;
        }
        if (fert_mixing_config.start_interval !== undefined) {
            req.start_interval = parseFloat(fert_mixing_config.start_interval);
        }
        if (fert_mixing_config.duration !== undefined) {
            req.duration = parseFloat(fert_mixing_config.duration);
        }
        if (fert_mixing_config.mixing_before_time !== undefined) {
            req.mixing_before_time = parseFloat(fert_mixing_config.mixing_before_time);
        }
        if (fert_mixing_config.mixing_after_time !== undefined) {
            req.mixing_after_time = parseFloat(fert_mixing_config.mixing_after_time);
        }
        return await call_remote('/config/init_fert_mixing_policy', req, token);
    },
    add_group_policy: async function (group_policy_config, token) {
        const req = {
            policy_name: group_policy_config.policy_name,
            farm_name: group_policy_config.farm_name,
            wgv_array: group_policy_config.wgv_array,
            method: group_policy_config.method,
            area: parseFloat(group_policy_config.area),
            water_only: group_policy_config.water_only,
        };

        if (group_policy_config.method === '只浇水') {
            req.total_time = group_policy_config.total_time !== undefined ? parseFloat(group_policy_config.total_time) : undefined;
        } else if (group_policy_config.method === '总定量') {
            req.total_fert = group_policy_config.total_fert !== undefined ? parseFloat(group_policy_config.total_fert) : 0;
            req.pre_fert_time = group_policy_config.pre_fert_time !== undefined ? parseFloat(group_policy_config.pre_fert_time) : undefined;
            req.post_fert_time = group_policy_config.post_fert_time !== undefined ? parseFloat(group_policy_config.post_fert_time) : undefined;
        } else if (group_policy_config.method === '亩定量') {
            req.area_based_amount = group_policy_config.area_based_amount !== undefined ? parseFloat(group_policy_config.area_based_amount) : undefined;
            req.pre_fert_time = group_policy_config.pre_fert_time !== undefined ? parseFloat(group_policy_config.pre_fert_time) : undefined;
            req.post_fert_time = group_policy_config.post_fert_time !== undefined ? parseFloat(group_policy_config.post_fert_time) : undefined;
        } else if (group_policy_config.method === '定时') {
            req.fert_time = group_policy_config.fert_time !== undefined ? parseFloat(group_policy_config.fert_time) : undefined;
            req.pre_fert_time = group_policy_config.pre_fert_time !== undefined ? parseFloat(group_policy_config.pre_fert_time) : undefined;
            req.post_fert_time = group_policy_config.post_fert_time !== undefined ? parseFloat(group_policy_config.post_fert_time) : undefined;
        } else {
            req.total_time = group_policy_config.total_time !== undefined ? parseFloat(group_policy_config.total_time) : undefined;
            req.pre_fert_time = group_policy_config.pre_fert_time !== undefined ? parseFloat(group_policy_config.pre_fert_time) : undefined;
            req.post_fert_time = group_policy_config.post_fert_time !== undefined ? parseFloat(group_policy_config.post_fert_time) : undefined;
            req.fert_time = group_policy_config.fert_time !== undefined ? parseFloat(group_policy_config.fert_time) : undefined;
            req.area_based_amount = group_policy_config.area_based_amount !== undefined ? parseFloat(group_policy_config.area_based_amount) : undefined;
            req.total_fert = group_policy_config.total_fert !== undefined ? parseFloat(group_policy_config.total_fert) : undefined;
        }

        try {
            return await call_remote('/config/add_group_policy', req, token);
        } catch (err) {
            // 保留原错误结构，便于上层拿到 message/err_msg
            throw err;
        }
    },
    init_global_policy: async function (global_policy_config, token) {
        let req = {
            farm_name: global_policy_config.farm_name,
            start_hour: parseInt(global_policy_config.start_hour),
        };
        return await call_remote('/config/init_global_policy', req, token);
    }
};