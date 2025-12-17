import { createRouter, createWebHashHistory } from 'vue-router'
import {
  MenuIcons,
  batchCreateRoutes
} from '../utils/menuConfig.js'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/center'
    },
    {
      path: '/login',
      name: 'Login',
      component:() => import('../components/LoginPage.vue'),
      meta: {
        hidden: true
      }
    },
    {
      path: '/',
      component: () => import('../components/MainLayout.vue'),
      children: [
        ...batchCreateRoutes([
          {
            name: '数据大屏',
            path: '/dashboard',
            component: () => import('../../../../web/gui/StandaloneDashboard.vue'),
            icon: MenuIcons.DATA,
            meta: {
              allowedRoles: ['engineer']
            }
          },
          {
            name: '监控中心',
            path: '/center',
            component: () => import('../components/DefaultPage.vue'),
          },
          {
            name: '设备配置',
            path: '/config/device_management',
            component: () => import('../../../../device/gui/device_management_gui.vue'),
            parent: '配置中心',
            icon: MenuIcons.SETTING,
            meta: {
              allowedRoles: ['engineer']
            }
          },
          {
            name: '农场配置',
            path: '/config/farm_config',
            component: () => import('../../../../resource/gui/FarmConfigView.vue'),
            parent: '配置中心',
            icon: MenuIcons.HOUSE,
            meta: {
              allowedRoles: ['engineer']
            }
          },
          {
            name: '地块配置',
            path: '/config/block_config',
            component: () => import('../../../../resource/gui/BlockConfigView.vue'),
            parent: '配置中心',
            icon: MenuIcons.GRID,
            meta: {
              allowedRoles: ['engineer']
            }
          },
          {
            name: '策略配置',
            path: '/config/policy_template',
            component: () => import('../../../../policy/gui/PolicyTemplateConfigSimple.vue'),
            parent: '配置中心',
            icon: MenuIcons.DOCUMENT,
            meta: {
              allowedRoles: ['engineer']
            }
          },
          {
            name: '策略程序设定向导',
            path: '/policy_wizard',
            component: () => import('../../../../policy/gui/PolicyWizard.vue'),
            icon: MenuIcons.DOCUMENT,
            hidden: true,
            meta: {
              hideMenu: true
            }
          }
        ])
      ]
    }
  ],
})

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('auth_token')
  const role = localStorage.getItem('user_role') || 'farmer'
  console.log('路由守卫执行:', { from: from.path, to: to.path, hasToken: !!token })
  
  if (to.path === '/login') {
    if (token) {
      console.log('已登录，从登录页重定向到 /center')
      next('/center')
    } else {
      console.log('未登录，允许访问登录页')
      next()
    }
  } else {
    if (token) {
      // 确保 axios headers 已设置
      const axios = (await import('axios')).default
      axios.defaults.headers.common['token'] = token
      // 角色权限控制：如果路由限定角色且当前角色不在允许列表中，则跳转到监控中心
      if (to.meta && Array.isArray(to.meta.allowedRoles) && !to.meta.allowedRoles.includes(role)) {
        console.log('当前角色无权访问该页面，重定向到 /center', { role, path: to.path })
        next('/center')
      } else {
        console.log('已登录，允许访问:', to.path, 'role:', role)
        next()
      }
    } else {
      console.log('未登录，重定向到登录页')
      next('/login')
    }
  }
})

export default router
