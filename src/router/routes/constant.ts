import type { RouteRecordRaw } from 'vue-router';
import BaseLayout from '@/layouts/base-layout/index.vue';
import BlankLayout from '@/layouts/blank-layout/index.vue';

/** the login route path */
export const LOGIN_ROUTE_PATH = '/login';

/** the home route name */
export const HOME_ROUTE_NAME = 'home';

/**
 * Constant routes
 *
 * These routes do not require login, they are setup in vue router directly
 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    name: 'root',
    path: '/',
    redirect: `/${HOME_ROUTE_NAME}`,
    meta: {
      title: 'root',
      constant: true,
      hideInMenu: true
    }
  },
  {
    path: '/',
    component: BaseLayout,
    meta: {
      title: 'root layout',
      constant: true,
      hideInMenu: true
    },
    children: [
      {
        name: HOME_ROUTE_NAME,
        path: `/${HOME_ROUTE_NAME}`,
        component: () => import('@/views/home/index.vue'),
        meta: {
          title: '首页',
          icon: 'mdi:monitor-dashboard',
          // login is required to access the home page, same as RuoYi, the unauthenticated visit will redirect to the login page
          constant: false,
          keepAlive: true,
          fixedIndexInTab: 0
        }
      },
      {
        name: 'iframe-page',
        path: '/iframe-page/:url',
        component: () => import('@/views/_builtin/iframe-page/[url].vue'),
        props: true,
        meta: {
          title: 'iframe-page',
          constant: true,
          hideInMenu: true,
          keepAlive: true
        }
      }
    ]
  },
  {
    path: '/',
    component: BlankLayout,
    meta: {
      title: 'blank layout',
      constant: true,
      hideInMenu: true
    },
    children: [
      {
        name: 'login',
        path: '/login/:module(pwd-login|code-login|register|reset-pwd|bind-wechat)?',
        component: () => import('@/views/_builtin/login/index.vue'),
        props: true,
        meta: {
          title: 'login',
          constant: true,
          hideInMenu: true
        }
      },
      {
        name: '403',
        path: '/403',
        component: () => import('@/views/_builtin/403/index.vue'),
        meta: {
          title: '403',
          constant: true,
          hideInMenu: true
        }
      },
      {
        name: '404',
        path: '/404',
        component: () => import('@/views/_builtin/404/index.vue'),
        meta: {
          title: '404',
          constant: true,
          hideInMenu: true
        }
      },
      {
        name: '500',
        path: '/500',
        component: () => import('@/views/_builtin/500/index.vue'),
        meta: {
          title: '500',
          constant: true,
          hideInMenu: true
        }
      },
      {
        name: 'not-found',
        path: '/:pathMatch(.*)*',
        component: () => import('@/views/_builtin/404/index.vue'),
        meta: {
          title: 'not-found',
          constant: true,
          hideInMenu: true
        }
      }
    ]
  }
];
