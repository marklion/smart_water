export default {
  water_group_config: function (params) {
    let config_string = `
device
  add device '${params.valve_name}' '${params.driver_name}' '${params.valve_config_key}' '${params.longitude}' '${params.latitude}' '${params.farm_name}' '${params.block_name}'
return
policy
  policy '${params.valve_name}'
    init assignment 'false' '需要启动' 'false'
    init assignment 'false' '需要重置' 'false'
    init assignment 'false' '开阀压力下限' '${params.open_pressure_low_limit}'
    init assignment 'false' '关阀压力上限' '${params.close_pressure_high_limit}'
    init assignment 'false' '压力检查周期' '${params.pressure_check_interval * 1000}'
    source '瞬时压力' '${params.valve_name}' 'readout'
    state '关阀'
      enter action '${params.valve_name}' 'close'
      enter assignment 'false' '进入时间' 'Date.now()'
      transformer 'next'
        rule 'false' '异常' '(Date.now() - prs.variables.get("进入时间") > prs.variables.get("压力检查周期")) &&  await prs.getSource("瞬时压力") > prs.variables.get("关阀压力上限")'
        rule 'false' '开阀' 'prs.variables.get("需要启动") == true'
      return
    return
    state '开阀'
      enter action '${params.valve_name}' 'open'
      enter assignment 'false' '进入时间' 'Date.now()'
      transformer 'next'
        rule 'false' '异常' '(Date.now() - prs.variables.get("进入时间") > prs.variables.get("压力检查周期")) &&  await prs.getSource("瞬时压力") < prs.variables.get("开阀压力下限")'
        rule 'false' '关阀' 'prs.variables.get("需要启动") == false'
      return
    return
    state '异常'
      exit assignment 'false' '需要启动' 'false'
      warning '\`${params.valve_name}压力异常:\${await prs.getSource("瞬时压力")}, 当前设定为\${prs.variables.get("需要启动")?"开":"关"}\`'
      transformer 'next'
        rule 'false' '关阀' 'prs.variables.get("需要重置") == true'
      return
    return
    init state '关阀'
    match farm '${params.farm_name}'
  return
return`;
    return config_string;
  },
  init_water_policy_config: function (params) {
    let config_string = `
policy
  policy '${params.policy_name}'
    init assignment 'false' '流量告警下限' '${params.flow_warning_low_limit}'
    init assignment 'false' '流量告警上限' '${params.flow_warning_high_limit}'
    init assignment 'false' '压力告警下限' '${params.pressure_warning_low_limit}'
    init assignment 'false' '压力告警上限' '${params.pressure_warning_high_limit}'
    init assignment 'false' '压力停机下限' '${params.pressure_shutdown_low_limit}'
    init assignment 'false' '压力停机上限' '${params.pressure_shutdown_high_limit}'
    init assignment 'false' '流量检查周期' '${params.flow_check_interval * 1000}'
    init assignment 'false' '压力告警检查周期' '${params.pressure_shutdown_check_interval * 1000}'
    init assignment 'false' '压力停机检查周期' '${params.pressure_shutdown_check_interval * 1000}'
    init assignment 'false' '需要启动' 'false'
    init assignment 'false' '需要重置' 'false'
    init assignment 'false' '主管道累计流量' '0'
    init assignment 'false' '主管道累计流量增量' '0'
    source '主管道压力读数' '${params.farm_name}-主管道压力计' 'readout'
    source '主管道流量读数' '${params.farm_name}-主管道流量计' 'readout'
    source '主管道流量累计读数' '${params.farm_name}-主管道流量计' 'total_readout'
    state '空闲'
      enter action '${params.farm_name}-主泵' 'close'
      enter assignment 'false' '需要重置' 'false'
      exit assignment 'false' '主管道累计流量' 'await prs.getSource("主管道流量累计读数")'
      transformer 'next'
        rule 'false' '主泵工作' 'prs.variables.get("需要启动") == true'
      return
    return
    state '主泵工作'
      enter action '${params.farm_name}-主泵' 'open'
      enter assignment 'false' '进入时间' 'Date.now()'
      do assignment 'false' '主管道累计流量增量' 'await prs.getSource("主管道流量累计读数") - prs.variables.get("主管道累计流量")'
      transformer 'next'
        rule 'false' '异常停机' '(Date.now() - prs.variables.get("进入时间") > prs.variables.get("压力停机检查周期")) &&  await prs.getSource("主管道压力读数") < prs.variables.get("压力停机下限")'
        rule 'false' '异常停机' '(Date.now() - prs.variables.get("进入时间") > prs.variables.get("压力停机检查周期")) && await prs.getSource("主管道压力读数") > prs.variables.get("压力停机上限")'
        rule 'false' '压力异常' '(Date.now() - prs.variables.get("进入时间") > prs.variables.get("压力告警检查周期")) && await prs.getSource("主管道压力读数") < prs.variables.get("压力告警下限")'
        rule 'false' '压力异常' '(Date.now() - prs.variables.get("进入时间") > prs.variables.get("压力告警检查周期")) && await prs.getSource("主管道压力读数") > prs.variables.get("压力告警上限")'
        rule 'false' '流量异常' '(Date.now() - prs.variables.get("进入时间") > prs.variables.get("流量检查周期")) && await prs.getSource("主管道流量读数") < prs.variables.get("流量告警下限")'
        rule 'false' '流量异常' '(Date.now() - prs.variables.get("进入时间") > prs.variables.get("流量检查周期")) && await prs.getSource("主管道流量读数") > prs.variables.get("流量告警上限")'
        rule 'false' '空闲' 'prs.variables.get("需要启动") == false'
        statistic '空闲' '${params.farm_name}总水流量' 'prs.variables.get("主管道累计流量增量")' 'true'
      return
    return
    state '压力异常'
      warning '\`${params.farm_name}主管道压力异常:\${await prs.getSource("主管道压力读数")}\`'
      transformer 'next'
        rule 'false' '主泵工作' 'true'
      return
    return
    state '流量异常'
      warning '\`${params.farm_name}主管道流量异常:\${await prs.getSource("主管道流量读数")}\`'
      transformer 'next'
        rule 'false' '主泵工作' 'true'
      return
    return
    state '异常停机'
      do action '${params.farm_name}-主泵' 'close'
      enter crossAssignment 'false' '"${params.farm_name}-总策略"' '供水策略异常' 'true'
      exit assignment 'false' '需要启动' 'false'
      transformer 'next'
        rule 'false' '空闲' 'prs.variables.get("需要重置") == true'
      return
    return
    init state '空闲'
    match farm '${params.farm_name}'
  return
return`;
    return config_string;
  },
  init_fert_policy_config: function (params) {
    let config_string = `
policy
  policy '${params.policy_name}'
    init assignment 'false' '需要启动' 'false'
    init assignment 'false' '需要重置' 'false'
    init assignment 'false' '液位告警' '${params.level_warning_limit}'
    init assignment 'false' '液位停机' '${params.level_shutdown_limit}'
    init assignment 'false' '期望施肥流量' '${params.flow_expected_value}'
    init assignment 'false' '流量告警偏移' '${params.flow_warning_max_offset}'
    init assignment 'false' '流量检查周期' '${params.flow_check_interval * 1000}'
    init assignment 'false' '液位告警检查周期' '${params.level_check_interval * 1000}'
    init assignment 'false' '液位停机检查周期' '${params.level_check_interval * 1000}'
    init assignment 'false' '本次施肥量' '0'
    source '施肥流量读数' '${params.farm_name}-施肥流量计' 'readout'
    source '施肥液位读数' '${params.farm_name}-施肥液位计' 'readout'
    state '空闲'
      enter action '${params.farm_name}-施肥泵' 'close'
      enter assignment 'false' '本次施肥量' '0'
      enter assignment 'false' '需要重置' 'false'
      transformer 'next'
        rule 'false' '施肥工作' 'prs.variables.get("需要启动") == true'
      return
    return
    state '施肥工作'
      enter action '${params.farm_name}-施肥泵' 'open'
      enter assignment 'false' '进入时间' 'Date.now()'
      enter assignment 'false' '上次采样' 'Date.now()'
      do assignment 'false' '采样时长' '(Date.now() - prs.variables.get("上次采样"))/1000'
      do assignment 'false' '本次施肥量' 'await prs.getSource("施肥流量读数") / 60 * prs.variables.get("采样时长") + prs.variables.get("本次施肥量")'
      do assignment 'false' '上次采样' 'Date.now()'
      transformer 'next'
        rule 'false' '异常停机' '(Date.now() - prs.variables.get("进入时间") > prs.variables.get("液位停机检查周期")) && await prs.getSource("施肥液位读数") < prs.variables.get("液位停机")'
        rule 'false' '液位异常' '(Date.now() - prs.variables.get("进入时间") > prs.variables.get("液位告警检查周期")) && await prs.getSource("施肥液位读数") < prs.variables.get("液位告警")'
        rule 'false' '流量异常' '(Date.now() - prs.variables.get("进入时间") > prs.variables.get("流量检查周期")) && (await prs.getSource("施肥流量读数") < prs.variables.get("期望施肥流量") - prs.variables.get("流量告警偏移") || await prs.getSource("施肥流量读数") > prs.variables.get("期望施肥流量") + prs.variables.get("流量告警偏移"))'
        rule 'false' '空闲' 'prs.variables.get("需要启动") == false'
        statistic '空闲' '${params.farm_name}总施肥量' 'prs.variables.get("本次施肥量")' 'true'
      return
    return
    state '液位异常'
      warning '\`${params.farm_name}施肥液位异常:\${await prs.getSource("施肥液位读数")}\`'
      transformer 'next'
        rule 'false' '施肥工作' 'true'
      return
    return
    state '流量异常'
      warning '\`${params.farm_name}施肥流量异常:\${await prs.getSource("施肥流量读数")}\`'
      transformer 'next'
        rule 'false' '施肥工作' 'true'
      return
    return
    state '异常停机'
      do action '${params.farm_name}-施肥泵' 'close'
      enter crossAssignment 'false' '"${params.farm_name}-总策略"' '施肥策略异常' 'true'
      exit assignment 'false' '需要启动' 'false'
      transformer 'next'
        rule 'false' '空闲' 'prs.variables.get("需要重置") == true'
      return
    return
    init state '空闲'
    match farm '${params.farm_name}'
  return
return
        `;
    return config_string;
  },
  init_fert_mixing_policy_config: function (params) {
    let mixing_pump_name = params.mixing_pump_name || `${params.farm_name}-搅拌泵`;
    let start_interval = params.start_interval || params.mixing_before_time || 60; // 启动间隔（分钟），默认60分钟（1小时）
    let duration = params.duration || params.mixing_after_time || 6; // 期望运行时间（分钟），默认6分钟
    let start_interval_ms = start_interval * 1000 * 60;
    let duration_ms = duration * 1000 * 60;

    let config_string = `
policy
  policy '${params.policy_name}'
    init assignment 'false' '需要启动' 'false'
    init assignment 'false' '启动间隔' '${start_interval_ms}'
    init assignment 'false' '期望运行时间' '${duration_ms}'
    init assignment 'false' '停留时间' '0'
    init assignment 'false' '下次运行时间' '""'
    state '空闲'
      enter assignment 'false' '需要启动' 'false'
      enter assignment 'false' '进入时间' 'Date.now()'
      enter assignment 'false' '停留时间' '0'
      do assignment 'false' '停留时间' '(Date.now() - prs.variables.get("进入时间"))'
      do assignment 'false' '需要启动' '(prs.variables.get("下次运行时间") != "" ? (new Date(prs.variables.get("下次运行时间")).getTime() <= Date.now() ? true : prs.variables.get("需要启动")) : prs.variables.get("需要启动"))'
      transformer 'next'
        rule 'false' '搅拌' 'prs.variables.get("需要启动") == true'
      return
      transformer 'timeup'
        rule 'false' '搅拌' 'prs.variables.get("停留时间") >= prs.variables.get("启动间隔")'
      return
    return
    state '搅拌'
      enter assignment 'false' '停留时间' '0'
      enter assignment 'false' '需要启动' 'true'
      enter assignment 'false' '下次运行时间' '""'
      enter action '${mixing_pump_name}' 'open'
      enter assignment 'false' '进入时间' 'Date.now()'
      exit action '${mixing_pump_name}' 'close'
      do assignment 'false' '停留时间' '(Date.now() - prs.variables.get("进入时间"))'
      transformer 'timeup'
        rule 'false' '空闲' 'prs.variables.get("停留时间") >= prs.variables.get("期望运行时间")'
      return
      transformer 'next'
        rule 'false' '空闲' 'prs.variables.get("需要启动") == false'
      return
    return
    init state '空闲'
    match farm '${params.farm_name}'
  return
return
        `;
    return config_string;
  },
  add_group_policy: function (params) {
    
    let valve_open_config = '';
    for (let single_sub_policy of params.wgv_array) {
      valve_open_config += `\n enter crossAssignment 'false' '"${single_sub_policy.name}"' '需要启动' 'true'`;
    }
    let valve_close_config = '';
    for (let single_sub_policy of params.wgv_array) {
      valve_close_config += `\n enter crossAssignment 'false' '"${single_sub_policy.name}"' '需要启动' 'false'`;
    }
    let exeption_push_config = '';
    for (let single_sub_policy of params.wgv_array) {
      exeption_push_config += `
      policy '${single_sub_policy.name}'
        state '异常'
          enter crossAssignment 'false' '"${params.policy_name}"' '需要跳过' 'true'
        return
      return
      `;
    }
    
    // 根据method类型计算期望施肥总量和期望每亩施肥量
    // AB_fert (area_based_amount) 填写位置：第270行的 '期望每亩施肥量'
    // total_fert 填写位置：第272行的 '期望施肥总量'
    let expected_per_mu_fert = 0;  // 期望每亩施肥量 (AB_fert / area_based_amount)
    let expected_total_fert = 0;   // 期望施肥总量 (total_fert)
    
    if (params.method === '总定量') {
      // 总定量模式：使用total_fert，期望每亩施肥量设为0
      expected_total_fert = params.total_fert || 0;
      expected_per_mu_fert = 0;
    } else if (params.method === '亩定量' || params.method === '定量' || params.method === '只浇水') {
      // 亩定量模式：使用area_based_amount，计算total_fert
      // 注意：只浇水模式虽然method是'只浇水'，但也会走到这里，不过water_only=true时会跳过这段代码
      expected_per_mu_fert = params.area_based_amount || 0;
      expected_total_fert = expected_per_mu_fert * (params.area || 0);
    } else if (params.method === '定时') {
      // 定时模式：两个值都为0
      expected_per_mu_fert = 0;
      expected_total_fert = 0;
    } else {
      // 其他未知模式：两个值都为0
      expected_per_mu_fert = 0;
      expected_total_fert = 0;
    }
    
    let config_string = `
policy
  ${exeption_push_config}
  policy '${params.farm_name}-施肥'
    state '施肥工作'
      do crossAssignment 'false' '"${params.policy_name}"' '当前施肥量' 'prs.variables.get("本次施肥量")'
    return
  return
  policy '${params.policy_name}'
    init assignment 'false' '组内阀门' '"${params.wgv_array.map((item) => item.name).join(",")}"'
    ${params.water_only ? '' : `init assignment 'false' '肥前时间' '${(params.pre_fert_time || 0) * 1000 * 60}'
    init assignment 'false' '施肥时间' '${(params.fert_time || 0) * 1000 * 60}'
    init assignment 'false' '肥后时间' '${(params.post_fert_time || 0) * 1000 * 60}'`}
    init assignment 'false' '施肥策略' '${params.method}'
    ${params.water_only ? '' : `init assignment 'false' '期望每亩施肥量' '${expected_per_mu_fert}'
    init assignment 'false' '期望施肥速率' '0'
    init assignment 'false' '期望施肥总量' '${expected_total_fert}'`}
    init assignment 'false' '面积' '${params.area}'
    init assignment 'false' '需要启动' 'false'
    init assignment 'false' '需要跳过' 'false'
    init assignment 'false' '是否只浇水' '${params.water_only ? 'true' : 'false'}'
    init assignment 'false' '当前施肥量' '0'
    init assignment 'false' '当前浇水量' '0'
    init assignment 'false' '阶段剩余时间' '0'
    init assignment 'false' '总灌溉时间' '${params.water_only ? ((params.total_time || 0) * 1000 * 60) : (((params.pre_fert_time || 0) + (params.fert_time || 0) + (params.post_fert_time || 0)) * 1000 * 60)}'
    watering group matrix 'area' '面积'
    watering group matrix 'method' '施肥策略'
    watering group matrix 'fert_rate' '期望施肥速率'
    watering group matrix 'total_water' '当前浇水量'
    watering group matrix 'total_fert' '当前施肥量'
    watering group matrix 'minute_left' '阶段剩余时间'
    watering group matrix 'valves' '组内阀门'
    source '供水流量累计读数' '${params.farm_name}-主管道流量计' 'total_readout'
    source '施肥平均流量' '${params.farm_name}-施肥流量计' 'ava_readout'
    state '空闲'
      enter assignment 'false' '当前施肥量' '0'
      enter assignment 'false' '当前浇水量' '0'
      enter assignment 'false' '需要跳过' 'false'
      enter assignment 'false' '阶段剩余时间' '0'
      ${valve_close_config}
      exit assignment 'false' '主管道流量累计值' 'await prs.getSource("供水流量累计读数")'
      transformer 'next'
        rule 'false' '浇水' 'prs.variables.get("需要启动") == true && prs.variables.get("是否只浇水") == true'
        rule 'false' '肥前' 'prs.variables.get("需要启动") == true && prs.variables.get("是否只浇水") != true'
      return
    return
    state '浇水'
      enter assignment 'false' '进入时间' 'Date.now()'
      enter assignment 'false' '阶段剩余时间' '0'
      do assignment 'false' '阶段剩余时间' 'prs.variables.get("总灌溉时间") / 1000 / 60 - (Date.now() - prs.variables.get("进入时间"))/1000/60'
      do assignment 'false' '当前浇水量' 'await prs.getSource("供水流量累计读数") - prs.variables.get("主管道流量累计值")'
      ${valve_open_config}
      transformer 'timeup'
        rule 'false' '收尾' 'prs.variables.get("阶段剩余时间") < 0'
        rule 'false' '收尾' 'prs.variables.get("需要跳过") == true'
        statistic '收尾' '${params.policy_name}累计供水量' 'prs.variables.get("当前浇水量")' 'true'
      return
    return
    state '肥前'
      ${valve_open_config}
      enter crossAssignment 'false' '"${params.farm_name}-总策略"' '当前轮灌组已启动' 'true'
      enter assignment 'false' '进入时间' 'Date.now()'
      enter assignment 'false' '阶段剩余时间' '0'
      do assignment 'false' '期望施肥速率' 'await prs.getSource("施肥平均流量")'
      do assignment 'false' '肥前时间' '(prs.variables.get("施肥策略") == "定时"?prs.variables.get("肥前时间"):(((${params.pre_fert_time || 0}) + (${params.fert_time || 0}) + (${params.post_fert_time || 0})) - (${params.post_fert_time || 0}) - prs.variables.get("期望施肥总量") / prs.variables.get("期望施肥速率"))*60 * 1000)'
      do assignment 'false' '阶段剩余时间' 'prs.variables.get("肥前时间") / 1000 / 60 - (Date.now() - prs.variables.get("进入时间"))/1000/60'
      do assignment 'false' '当前浇水量' 'await prs.getSource("供水流量累计读数") - prs.variables.get("主管道流量累计值")'
      transformer 'timeup'
        rule 'false' '施肥' 'prs.variables.get("阶段剩余时间") < 0'
        rule 'false' '收尾' 'prs.variables.get("需要跳过") == true'
      return
    return
    state '施肥'
      enter crossAssignment 'false' '"${params.farm_name}-施肥"' '需要启动' 'true'
      enter assignment 'false' '进入时间' 'Date.now()'
      enter assignment 'false' '阶段剩余时间' '0'
      do assignment 'false' '期望施肥速率' 'await prs.getSource("施肥平均流量")'
      do assignment 'false' '阶段剩余时间' 'prs.variables.get("施肥策略") == "定时"?(prs.variables.get("施肥时间") / 1000 / 60 - (Date.now() - prs.variables.get("进入时间"))/1000/60):( (prs.variables.get("期望施肥总量") / prs.variables.get("期望施肥速率")) * 60 - (Date.now() - prs.variables.get("进入时间"))/1000)'
      do assignment 'false' '当前浇水量' 'await prs.getSource("供水流量累计读数") - prs.variables.get("主管道流量累计值")'
      exit crossAssignment 'false' '"${params.farm_name}-施肥"' '需要启动' 'false'
      transformer 'timeup'
        rule 'false' '肥后' '"定时" != prs.variables.get("施肥策略") && prs.variables.get("当前施肥量") >= prs.variables.get("期望施肥总量")'
        rule 'false' '肥后' '"定时" == prs.variables.get("施肥策略") && (prs.variables.get("施肥时间") > 0) && prs.variables.get("阶段剩余时间") < 0'
        rule 'false' '收尾' 'prs.variables.get("需要跳过") == true'
        statistic '肥后' '${params.policy_name}累计施肥量' 'prs.variables.get("当前施肥量")' 'true'
        statistic '收尾' '${params.policy_name}累计施肥量' 'prs.variables.get("当前施肥量")' 'true'
      return
    return
    state '肥后'
      enter assignment 'false' '进入时间' 'Date.now()'
      enter assignment 'false' '阶段剩余时间' '0'
      do assignment 'false' '阶段剩余时间' 'prs.variables.get("肥后时间") / 1000 / 60 - (Date.now() - prs.variables.get("进入时间"))/1000/60'
      do assignment 'false' '当前浇水量' 'await prs.getSource("供水流量累计读数") - prs.variables.get("主管道流量累计值")'
      transformer 'timeup'
        rule 'false' '收尾' 'prs.variables.get("阶段剩余时间") < 0'
        rule 'false' '收尾' 'prs.variables.get("需要跳过") == true'
        statistic '收尾' '${params.policy_name}累计供水量' 'prs.variables.get("当前浇水量")' 'true'
      return
    return
    state '收尾'
      enter crossAssignment 'false' '"${params.farm_name}-总策略"' '当前轮灌组已启动' 'false'
      transformer 'next'
        rule 'false' '空闲' 'prs.variables.get("需要启动") == false'
      return
    return
    init state '空闲'
    match farm '${params.farm_name}'
  return
return`;
    return config_string;
  },
  init_global_policy: function (params) {
    let config_string = `
policy
  policy '${params.farm_name}-总策略'
    init assignment 'false' '需要启动' 'false'
    init assignment 'false' '需要重置' 'false'
    init assignment 'false' '启动时间' '${params.start_hour}'
    init assignment 'false' '下次启动时间' '""'
    init assignment 'false' '今天日期' '0'
    init assignment 'false' '今天已经自动启动过了' 'false'
    init assignment 'false' '当前轮灌组索引' '0'
    init assignment 'false' '当前轮灌组名称' '""'
    init assignment 'false' '上一个轮灌组名称' '""'
    init assignment 'false' '当前轮灌组已启动' 'false'
    init assignment 'false' '供水策略异常' 'false'
    init assignment 'false' '施肥策略异常' 'false'
    init assignment 'false' '所有轮灌组' '[]'
    state '空闲'
      enter assignment 'false' '供水策略异常' 'false'
      enter assignment 'false' '施肥策略异常' 'false'
      enter crossAssignment 'false' '"${params.farm_name}-供水"' '需要启动' 'false'
      enter assignment 'false' '需要重置' 'false'
      enter assignment 'false' '当前轮灌组索引' '0-1'
      do assignment 'false' '今天已经自动启动过了' '(new Date().getDate() != prs.variables.get("今天日期"))?false:(prs.variables.get("今天已经自动启动过了"))'
      do assignment 'false' '今天日期' 'new Date().getDate()'
      do assignment 'false' '需要启动' '(prs.variables.get("下次启动时间") != "" ? (new Date(prs.variables.get("下次启动时间")).getTime() <= Date.now() ? true : prs.variables.get("需要启动")) : prs.variables.get("需要启动"))'
      transformer 'next'
        rule 'false' '准备' 'prs.variables.get("需要启动") == true'
        rule 'false' '准备' 'prs.variables.get("启动时间") == new Date().getHours() && prs.variables.get("今天已经自动启动过了") == false'
      return
    return
    state '准备'
      enter assignment 'false' '需要启动' 'false'
      enter assignment 'false' '今天已经自动启动过了' 'true'
      enter assignment 'false' '下次启动时间' '""'
      enter assignment 'false' '上一个轮灌组名称' 'prs.variables.get("当前轮灌组索引")>=prs.variables.get("所有轮灌组").length?"":(prs.variables.get("所有轮灌组")[prs.variables.get("当前轮灌组索引")])'
      enter assignment 'false' '当前轮灌组索引' 'prs.variables.get("当前轮灌组索引") + 1'
      enter assignment 'false' '当前轮灌组名称' 'prs.variables.get("当前轮灌组索引")>=prs.variables.get("所有轮灌组").length?"":(prs.variables.get("所有轮灌组")[prs.variables.get("当前轮灌组索引")])'
      do crossAssignment 'false' 'prs.variables.get("当前轮灌组名称")' '需要启动' 'true'
      exit crossAssignment 'false' '"${params.farm_name}-供水"' '需要启动' 'true'
      exit crossAssignment 'false' 'prs.variables.get("上一个轮灌组名称")' '需要启动' 'false'
      transformer 'next'
        rule 'false' '空闲' 'prs.variables.get("当前轮灌组名称") == ""'
        rule 'false' '空闲' 'prs.variables.get("需要重置") == true'
        rule 'false' '工作' 'prs.variables.get("当前轮灌组已启动") == true'
      return
      transformer 'exp'
        rule 'false' '异常' 'prs.variables.get("供水策略异常") == true'
        rule 'false' '异常' 'prs.variables.get("施肥策略异常") == true'
      return
    return
    state '工作'
      transformer 'next'
        rule 'false' '准备' 'prs.variables.get("当前轮灌组已启动") == false'
        rule 'false' '空闲' 'prs.variables.get("需要重置") == true'
      return
      transformer 'exp'
        rule 'false' '异常' 'prs.variables.get("供水策略异常") == true'
        rule 'false' '异常' 'prs.variables.get("施肥策略异常") == true'
      return
    return
    state '异常'
      warning '\`${params.farm_name}总策略异常,因为\${prs.variables.get("供水策略异常") == true?"供水策略异常":""}\${prs.variables.get("施肥策略异常") == true?"施肥策略异常":""}\`'
      transformer 'next'
        rule 'false' '空闲' 'prs.variables.get("需要重置") == true'
      return
    return
    init state '空闲'
    match farm '${params.farm_name}'
  return
return
    `;
    return config_string;
  },
};