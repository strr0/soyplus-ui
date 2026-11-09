import { computed, nextTick, ref, shallowRef } from 'vue';
import type { RouteRecordRaw } from 'vue-router';
import { defineStore } from 'pinia';
import { useBoolean } from '@sa/hooks';
import { fetchGetRouters } from '@/service/api';
import { router } from '@/router';
import { SetupStoreId } from '@/enum';
import { constantRoutes, HOME_ROUTE_NAME } from '@/router/routes/constant';
import { checkRouteNameRepeat, collectRoutePaths, transformRoutes } from '@/router/utils/transform';
import { useAuthStore } from '../auth';
import { useTabStore } from '../tab';
import {
  getBreadcrumbsByRoute,
  getCacheRouteNames,
  getGlobalMenusByRoutes,
  getSelectedMenuKeyPathByKey,
  transformMenuToSearchMenus
} from './shared';

export const useRouteStore = defineStore(SetupStoreId.Route, () => {
  const authStore = useAuthStore();
  const tabStore = useTabStore();
  const { bool: isInitConstantRoute, setBool: setIsInitConstantRoute } = useBoolean();
  const { bool: isInitAuthRoute, setBool: setIsInitAuthRoute } = useBoolean();

  /** Home route name */
  const routeHome = ref<string>(HOME_ROUTE_NAME);

  /** auth routes transformed from the backend menu */
  const authRoutes = shallowRef<RouteRecordRaw[]>([]);

  const removeRouteFns: (() => void)[] = [];

  /** Global menus */
  const menus = ref<App.Global.Menu[]>([]);
  const searchMenus = computed(() => transformMenuToSearchMenus(menus.value));

  /** Get global menus */
  function getGlobalMenus(routes: RouteRecordRaw[]) {
    menus.value = getGlobalMenusByRoutes(routes);
  }

  /** Cache routes */
  const cacheRoutes = ref<string[]>([]);

  /**
   * Exclude cache routes
   *
   * for reset route cache
   */
  const excludeCacheRoutes = ref<string[]>([]);

  /**
   * Get cache routes
   *
   * @param routes Vue routes
   */
  function getCacheRoutes(routes: RouteRecordRaw[]) {
    cacheRoutes.value = getCacheRouteNames(routes);
  }

  /**
   * Reset route cache
   *
   * @default router.currentRoute.value.name current route name
   * @param routeKey
   */
  async function resetRouteCache(routeKey?: string) {
    const routeName = routeKey || (router.currentRoute.value.name as string);

    excludeCacheRoutes.value.push(routeName);

    await nextTick();

    excludeCacheRoutes.value = [];
  }

  /** Global breadcrumbs */
  const breadcrumbs = computed(() => getBreadcrumbsByRoute(router.currentRoute.value, menus.value));

  /** Reset store */
  async function resetStore() {
    const routeStore = useRouteStore();

    routeStore.$reset();

    resetVueRoutes();

    // after reset store, need to re-init constant route
    await initConstantRoute();
  }

  /** Reset vue routes */
  function resetVueRoutes() {
    removeRouteFns.forEach(fn => fn());
    removeRouteFns.length = 0;
  }

  /** init constant route */
  async function initConstantRoute() {
    if (isInitConstantRoute.value) return;

    // the constant routes are registered in the vue router directly, just handle the menus and cache
    getGlobalMenus(constantRoutes);

    getCacheRoutes(constantRoutes);

    setIsInitConstantRoute(true);

    tabStore.initHomeTab();
  }

  /** Init auth route */
  async function initAuthRoute() {
    // check if user info is initialized
    if (!authStore.userInfo.user?.userId) {
      await authStore.initUserInfo();
    }

    await initDynamicAuthRoute();

    tabStore.initHomeTab();
  }

  /** Init auth routes by the backend menu of RuoYi */
  async function initDynamicAuthRoute() {
    const { data, error } = await fetchGetRouters();

    if (error) {
      // if fetch routes failed, reset store
      authStore.resetStore();
      return;
    }

    const routes = transformRoutes(data);

    checkRouteNameRepeat(routes);

    authRoutes.value = routes;

    resetVueRoutes();

    addRoutesToVueRouter(routes);

    getGlobalMenus([...constantRoutes, ...routes]);

    getCacheRoutes([...constantRoutes, ...routes]);

    setIsInitAuthRoute(true);
  }

  /**
   * Add routes to vue router
   *
   * @param routes Vue routes
   */
  function addRoutesToVueRouter(routes: RouteRecordRaw[]) {
    routes.forEach(route => {
      const removeFn = router.addRoute(route);
      addRemoveRouteFn(removeFn);
    });
  }

  /**
   * Add remove route fn
   *
   * @param fn
   */
  function addRemoveRouteFn(fn: () => void) {
    removeRouteFns.push(fn);
  }

  /**
   * Get is auth route exist
   *
   * @param routePath Route path
   */
  async function getIsAuthRouteExist(routePath: string) {
    return collectRoutePaths(authRoutes.value).includes(routePath);
  }

  /**
   * Get selected menu key path
   *
   * @param selectedKey Selected menu key
   */
  function getSelectedMenuKeyPath(selectedKey: string) {
    return getSelectedMenuKeyPathByKey(selectedKey, menus.value);
  }

  async function onRouteSwitchWhenLoggedIn() {
    // some global init logic when logged in and switch route
  }

  async function onRouteSwitchWhenNotLoggedIn() {
    // some global init logic if it does not need to be logged in
  }

  return {
    resetStore,
    routeHome,
    menus,
    searchMenus,
    cacheRoutes,
    excludeCacheRoutes,
    resetRouteCache,
    breadcrumbs,
    initConstantRoute,
    isInitConstantRoute,
    initAuthRoute,
    isInitAuthRoute,
    setIsInitAuthRoute,
    getIsAuthRouteExist,
    getSelectedMenuKeyPath,
    onRouteSwitchWhenLoggedIn,
    onRouteSwitchWhenNotLoggedIn
  };
});
