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
            name: '监控中心',
            path: '/center',
            component: () => import('../components/DefaultPage.vue'),
          },
          {
            name: '设备配置',
            path: '/config/device_management',
            component: () => import('../../../../device/gui/device_management_gui.vue'),
            parent: '配置中心',
            icon: MenuIcons.SETTING
          },
          {
            name: '农场配置',
            path: '/config/farm_config',
            component: () => import('../../../../resource/gui/FarmConfigView.vue'),
            parent: '配置中心',
            icon: MenuIcons.HOUSE
          },
          {
            name: '地块配置',
            path: '/config/block_config',
            component: () => import('../../../../resource/gui/BlockConfigView.vue'),
            parent: '配置中心',
            icon: MenuIcons.GRID
          },
          {
            name: '策略模板配置',
            path: '/config/policy_template',
            component: () => import('../../../../policy/gui/PolicyTemplateConfigSimple.vue'),
            parent: '配置中心',
            icon: MenuIcons.DOCUMENT
          }
        ])
      ]
    }
  ],
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('auth_token')
  if (to.path === '/login') {
    if (token) {
      next('/center')
    } else {
      next()
    }
  } else {
    if (token) {
      import('axios').then(axios => {
        axios.default.defaults.headers.common['token'] = token
      })
      next()
    } else {
      next('/login')
    }
  }
})

export default router
