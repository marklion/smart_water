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
      enter crossAssignment 'false' '"总策略"' '${params.valve_name}策略异常' 'true'
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
  policy '供水'
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
    source '主管道压力读数' '主管道压力计' 'readout'
    source '主管道流量读数' '主管道流量计' 'readout'
    source '主管道流量累计读数' '主管道流量计' 'total_readout'
    state '空闲'
      enter action '主泵' 'close'
      enter assignment 'false' '需要重置' 'false'
      exit assignment 'false' '主管道累计流量' 'await prs.getSource("主管道流量累计读数")'
      transformer 'next'
        rule 'false' '主泵工作' 'prs.variables.get("需要启动") == true'
      return
    return
    state '主泵工作'
      enter action '主泵' 'open'
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
        statistic '空闲' '总水流量' 'prs.variables.get("主管道累计流量增量")' 'true'
      return
    return
    state '压力异常'
      warning '\`压力异常:\${await prs.getSource("主管道压力读数")}\`'
      transformer 'next'
        rule 'false' '主泵工作' 'true'
      return
    return
    state '流量异常'
      warning '\`流量异常:\${await prs.getSource("主管道流量读数")}\`'
      transformer 'next'
        rule 'false' '主泵工作' 'true'
      return
    return
    state '异常停机'
      do action '主泵' 'close'
      enter crossAssignment 'false' '"总策略"' '供水策略异常' 'true'
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
    init_fert_policy_config:function(params) {
        let config_string = `
policy
  policy '施肥'
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
    source '施肥流量读数' '施肥流量计' 'readout'
    source '施肥液位读数' '施肥液位计' 'readout'
    state '空闲'
      enter action '施肥泵' 'close'
      enter assignment 'false' '本次施肥量' '0'
      enter assignment 'false' '需要重置' 'false'
      transformer 'next'
        rule 'false' '施肥工作' 'prs.variables.get("需要启动") == true'
      return
    return
    state '施肥工作'
      enter action '施肥泵' 'open'
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
        statistic '空闲' '总施肥量' 'prs.variables.get("本次施肥量")' 'true'
      return
    return
    state '液位异常'
      warning '\`施肥液位异常:\${await prs.getSource("施肥液位读数")}\`'
      transformer 'next'
        rule 'false' '施肥工作' 'true'
      return
    return
    state '流量异常'
      warning '\`施肥流量异常:\${await prs.getSource("施肥流量读数")}\`'
      transformer 'next'
        rule 'false' '施肥工作' 'true'
      return
    return
    state '异常停机'
      do action '施肥泵' 'close'
      enter crossAssignment 'false' '"总策略"' '施肥策略异常' 'true'
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
};