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
    }
};