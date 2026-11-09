import type { RouteLocationNormalized, RouteLocationRaw, Router } from 'vue-router';
import { localStg } from '@/utils/storage';
import { useRouteStore } from '@/store/modules/route';

const ROOT_ROUTE_NAME = 'root';
const LOGIN_ROUTE_NAME = 'login';
const NOT_FOUND_ROUTE_NAME = 'not-found';
const NO_AUTHORIZATION_ROUTE_NAME = '403';

/**
 * create route guard
 *
 * @param router router instance
 */
export function createRouteGuard(router: Router) {
  router.beforeEach(async (to, from) => {
    const location = await initRoute(to);

    if (location) {
      return location;
    }

    const isLogin = Boolean(localStg.get('token'));

    const needLogin = !to.meta.constant;

    // if it is login route when logged in, then switch to the root page
    if (to.name === LOGIN_ROUTE_NAME && isLogin) {
      return { name: ROOT_ROUTE_NAME };
    }

    // if the route does not need login, then it is allowed to access directly
    if (!needLogin) {
      return handleRouteSwitch(to, from);
    }

    // the route need login but the user is not logged in, then switch to the login page
    if (!isLogin) {
      return { name: LOGIN_ROUTE_NAME, query: { redirect: to.fullPath } };
    }

    // switch route normally
    return handleRouteSwitch(to, from);
  });
}

/**
 * initialize route
 *
 * @param to to route
 */
async function initRoute(to: RouteLocationNormalized): Promise<RouteLocationRaw | null> {
  const routeStore = useRouteStore();

  const isNotFoundRoute = to.name === NOT_FOUND_ROUTE_NAME;

  // if the constant route is not initialized, then initialize the constant route
  if (!routeStore.isInitConstantRoute) {
    await routeStore.initConstantRoute();

    // the route is captured by the "not-found" route because the constant route is not initialized
    // after the constant route is initialized, redirect to the original route
    const path = to.fullPath;
    const location: RouteLocationRaw = {
      path,
      replace: true,
      query: to.query,
      hash: to.hash
    };

    return location;
  }

  const isLogin = Boolean(localStg.get('token'));

  if (!isLogin) {
    // if the user is not logged in and the route is a constant route but not the "not-found" route, then it is allowed to access.
    if (to.meta.constant && !isNotFoundRoute) {
      routeStore.onRouteSwitchWhenNotLoggedIn();

      return null;
    }

    // if the user is not logged in, then switch to the login page with the redirect query,
    // same as the logic of permission.ts in plus-ui: `/login?redirect=to.fullPath`
    const location: RouteLocationRaw = {
      name: LOGIN_ROUTE_NAME,
      query: {
        redirect: to.fullPath
      }
    };

    return location;
  }

  if (!routeStore.isInitAuthRoute) {
    // initialize the auth route
    await routeStore.initAuthRoute();

    // the route is captured by the "not-found" route because the auth route is not initialized
    // after the auth route is initialized, redirect to the original route
    if (isNotFoundRoute) {
      const path = to.redirectedFrom?.name === ROOT_ROUTE_NAME ? '/' : to.fullPath;

      const location: RouteLocationRaw = {
        path,
        replace: true,
        query: to.query,
        hash: to.hash
      };

      return location;
    }
  }

  routeStore.onRouteSwitchWhenLoggedIn();

  // the auth route is initialized
  // it is not the "not-found" route, then it is allowed to access
  if (!isNotFoundRoute) {
    return null;
  }

  // it is captured by the "not-found" route, then check whether the route is authorized by the backend menu
  const exist = await routeStore.getIsAuthRouteExist(to.path);

  if (exist) {
    const location: RouteLocationRaw = {
      name: NO_AUTHORIZATION_ROUTE_NAME
    };

    return location;
  }

  return null;
}

function handleRouteSwitch(to: RouteLocationNormalized, from: RouteLocationNormalized) {
  // route with href
  if (to.meta.href) {
    window.open(to.meta.href, '_blank');

    return { path: from.fullPath, replace: true, query: from.query, hash: to.hash };
  }
}
