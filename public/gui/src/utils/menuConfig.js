/**
 * 菜单配置工具函数
 * 用于简化路由配置和菜单生成
 */

/**
 * 创建路由配置
 * @param {string} name - 菜单名称
 * @param {string} path - 路由路径
 * @param {function} component - 组件导入函数
 * @param {object} options - 可选配置
 * @param {string|null} options.parent - 父级菜单名称，null表示顶级菜单
 * @param {string} options.icon - Element Plus 图标名称
 * @param {string} options.permission - 权限要求
 * @param {boolean} options.hidden - 是否隐藏菜单
 * @returns {object} 路由配置对象
 */
export function createRoute(name, path, component, options = {}) {
  const { parent = null, icon, permission, hidden = false } = options

  return {
    name,
    path,
    component,
    meta: {
      parent,
      icon,
      permission,
      hidden
    }
  }
}

/**
 * 创建菜单分组
 * @param {string} groupName - 分组名称
 * @param {array} routes - 路由配置数组
 * @param {string} groupIcon - 分组图标
 * @returns {array} 带有统一父级的路由配置数组
 */
export function createMenuGroup(groupName, routes, groupIcon = 'Folder') {
  return routes.map(route => ({
    ...route,
    meta: {
      ...route.meta,
      parent: groupName,
      groupIcon
    }
  }))
}

/**
 * 预定义的菜单分组
 */
export const MenuGroups = {
  CONFIG: '配置中心',
  SYSTEM: '系统管理',
  MONITOR: '监控中心',
  DATA: '数据管理',
  REPORT: '报表中心'
}

/**
 * 常用图标映射
 */
export const MenuIcons = {
  HOME: 'House',
  HOUSE: 'House',
  GRID: 'Grid',
  SETTING: 'Setting',
  USER: 'User',
  LOCK: 'Lock',
  MONITOR: 'Monitor',
  WARNING: 'Warning',
  DOCUMENT: 'Document',
  TOOLS: 'Tools',
  DATA: 'DataLine',
  CHART: 'PieChart',
  EDIT: 'Edit',
  DELETE: 'Delete',
  PLUS: 'Plus',
  SEARCH: 'Search',
  REFRESH: 'Refresh',
  DOWNLOAD: 'Download',
  UPLOAD: 'Upload'
}

/**
 * 快速创建配置中心路由
 */
export function createConfigRoute(name, path, component, icon = MenuIcons.SETTING) {
  return createRoute(name, path, component, {
    parent: MenuGroups.CONFIG,
    icon
  })
}

/**
 * 快速创建系统管理路由
 */
export function createSystemRoute(name, path, component, icon = MenuIcons.TOOLS) {
  return createRoute(name, path, component, {
    parent: MenuGroups.SYSTEM,
    icon
  })
}

/**
 * 快速创建监控中心路由
 */
export function createMonitorRoute(name, path, component, icon = MenuIcons.MONITOR) {
  return createRoute(name, path, component, {
    parent: MenuGroups.MONITOR,
    icon
  })
}

export function createPolicyRoute(name, path, component, icon = MenuIcons.SETTING) {
  return createRoute(name, path, component, {
    parent: MenuGroups.POLICY,
    icon
  })
}
/**
 * 批量创建路由
 * @param {array} routeConfigs - 路由配置数组
 * @returns {array} 完整的路由配置数组
 */
export function batchCreateRoutes(routeConfigs) {
  return routeConfigs.map(config => {
    const { name, path, component, ...options } = config
    return createRoute(name, path, component, options)
  })
}
