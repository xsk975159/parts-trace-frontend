import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '工作台', icon: 'DataLine' }
      },
      // 用户管理
      {
        path: 'user',
        name: 'User',
        redirect: '/user/list',
        meta: { title: '用户管理', icon: 'User' },
        children: [
          {
            path: 'list',
            name: 'UserList',
            component: () => import('@/views/user/list.vue'),
            meta: { title: '用户列表', icon: 'UserFilled' }
          },
          {
            path: 'role',
            name: 'Role',
            component: () => import('@/views/user/role.vue'),
            meta: { title: '角色管理', icon: 'Avatar' }
          },
          {
            path: 'permission',
            name: 'Permission',
            component: () => import('@/views/user/permission.vue'),
            meta: { title: '权限管理', icon: 'Lock' }
          }
        ]
      },
      // 零部件管理
      {
        path: 'parts',
        name: 'Parts',
        redirect: '/parts/list',
        meta: { title: '零部件管理', icon: 'Box' },
        children: [
          {
            path: 'category',
            name: 'PartsCategory',
            component: () => import('@/views/parts/category.vue'),
            meta: { title: '分类管理', icon: 'Menu' }
          },
          {
            path: 'list',
            name: 'PartsList',
            component: () => import('@/views/parts/list.vue'),
            meta: { title: '零部件列表', icon: 'List' }
          },
          {
            path: 'did',
            name: 'PartsDid',
            component: () => import('@/views/parts/did.vue'),
            meta: { title: 'DID管理', icon: 'Key' }
          }
        ]
      },
      // 零部件溯源
      {
        path: 'trace',
        name: 'Trace',
        redirect: '/trace/workbench',
        meta: { title: '零部件溯源', icon: 'Connection' },
        children: [
          {
            path: 'workbench',
            name: 'TraceWorkbench',
            component: () => import('@/views/trace/workbench.vue'),
            meta: { title: '批次溯源工作台', icon: 'Monitor' }
          },
          {
            path: 'event',
            name: 'TraceEvent',
            component: () => import('@/views/trace/event.vue'),
            meta: { title: '事件记录', icon: 'Document' }
          },
          {
            path: 'certificate',
            name: 'TraceCertificate',
            component: () => import('@/views/trace/certificate.vue'),
            meta: { title: '凭证管理', icon: 'Tickets' }
          }
        ]
      },
      // 录视频临时隐藏异常检测菜单，恢复时取消下面注释即可
      /*
      {
        path: 'anomaly',
        name: 'Anomaly',
        redirect: '/anomaly/rule',
        meta: { title: '异常检测', icon: 'Warning' },
        children: [
          {
            path: 'rule',
            name: 'AnomalyRule',
            component: () => import('@/views/anomaly/rule.vue'),
            meta: { title: '规则配置', icon: 'Setting' }
          },
          {
            path: 'alert',
            name: 'AnomalyAlert',
            component: () => import('@/views/anomaly/alert.vue'),
            meta: { title: '异常预警', icon: 'BellFilled' }
          }
        ]
      },
      */
      // 追溯查询
      {
        path: 'query',
        name: 'Query',
        component: () => import('@/views/query/index.vue'),
        meta: { title: '追溯查询', icon: 'Search' }
      },
      // 数据统计
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/statistics/index.vue'),
        meta: { title: '数据统计', icon: 'DataLine' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.path === '/login') {
    if (token) {
      next('/')
    } else {
      next()
    }
  } else {
    if (token) {
      next()
    } else {
      next('/login')
    }
  }
})

export default router
