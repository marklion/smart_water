import { createRouter, createWebHistory } from 'vue-router'
import {
  MenuIcons,
  batchCreateRoutes
} from '../utils/menuConfig.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...batchCreateRoutes([
      {
        name: '监控中心',
        path: '/',
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
        component: () => import('../components/FarmConfigView.vue'),
        parent: '配置中心',
        icon: MenuIcons.HOUSE
      },
      {
        name: '地块配置',
        path: '/config/block_config',
        component: () => import('../components/BlockConfigView.vue'),
        parent: '配置中心',
        icon: MenuIcons.GRID
      }
    ])
  ],
})

export default router
