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
};