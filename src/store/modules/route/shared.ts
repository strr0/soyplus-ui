import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router';
import { useSvgIcon } from '@/hooks/common/icon';

/**
 * Get global menus by vue router routes
 *
 * The visible children of a hidden route will be hoisted to the current level, so the constant route wrappers (which
 * have no menu meaning) will not break the menu structure
 *
 * @param routes Vue routes
 */
export function getGlobalMenusByRoutes(routes: RouteRecordRaw[]): App.Global.Menu[] {
  const menus: App.Global.Menu[] = [];

  routes.forEach(route => {
    if (route.meta?.hideInMenu) {
      if (route.children?.length) {
        menus.push(...getGlobalMenusByRoutes(route.children));
      }

      return;
    }

    const menu = getGlobalMenuByRoute(route);

    if (route.children?.some(child => !child.meta?.hideInMenu)) {
      menu.children = getGlobalMenusByRoutes(route.children);
    }

    menus.push(menu);
  });

  return menus;
}

/**
 * Get global menu by route
 *
 * @param route
 */
function getGlobalMenuByRoute(route: RouteRecordRaw | RouteLocationNormalizedLoaded): App.Global.Menu {
  const { SvgIconVNode } = useSvgIcon();

  const { name, path } = route;
  const { title, icon = import.meta.env.VITE_MENU_ICON, localIcon, iconFontSize } = route.meta ?? {};

  const menu: App.Global.Menu = {
    key: name as string,
    label: title || String(name ?? path),
    routeKey: name as string,
    routePath: path as string,
    icon: SvgIconVNode({ icon, localIcon, fontSize: iconFontSize || 20 })
  };

  return menu;
}

/**
 * Get cache route names
 *
 * @param routes Vue routes
 */
export function getCacheRouteNames(routes: RouteRecordRaw[]): string[] {
  const cacheNames: string[] = [];

  routes.forEach(route => {
    if (route.component && route.name && route.meta?.keepAlive) {
      cacheNames.push(route.name as string);
    }

    // only get last two level route, which has component
    route.children?.forEach(child => {
      if (child.component && child.meta?.keepAlive) {
        cacheNames.push(child.name as string);
      }
    });
  });

  return cacheNames;
}

/**
 * Get selected menu key path
 *
 * @param selectedKey
 * @param menus
 */
export function getSelectedMenuKeyPathByKey(selectedKey: string, menus: App.Global.Menu[]) {
  const keyPath: string[] = [];

  menus.some(menu => {
    const path = findMenuPath(selectedKey, menu);

    const find = Boolean(path?.length);

    if (find) {
      keyPath.push(...path!);
    }

    return find;
  });

  return keyPath;
}

/**
 * Find menu path
 *
 * @param targetKey Target menu key
 * @param menu Menu
 */
function findMenuPath(targetKey: string, menu: App.Global.Menu): string[] | null {
  const path: string[] = [];

  function dfs(item: App.Global.Menu): boolean {
    path.push(item.key);

    if (item.key === targetKey) {
      return true;
    }

    if (item.children) {
      for (const child of item.children) {
        if (dfs(child)) {
          return true;
        }
      }
    }

    path.pop();

    return false;
  }

  if (dfs(menu)) {
    return path;
  }

  return null;
}

/**
 * Find the menu chain from the menus to the menu whose key is the target
 *
 * @param targetKey Target menu key
 * @param menus Menus to search
 */
function findMenuChainByKey(targetKey: string, menus: App.Global.Menu[]): App.Global.Menu[] | null {
  for (const menu of menus) {
    if (menu.key === targetKey) {
      return [menu];
    }

    if (menu.children?.length) {
      const result = findMenuChainByKey(targetKey, menu.children);
      if (result) {
        return [menu, ...result];
      }
    }
  }

  return null;
}

/**
 * Find the menu chain from the menus to the menu whose route path is the target
 *
 * @param targetPath Target route path
 * @param menus Menus to search
 */
function findMenuChainByPath(targetPath: string, menus: App.Global.Menu[]): App.Global.Menu[] | null {
  for (const menu of menus) {
    if (menu.routePath === targetPath) {
      return [menu];
    }

    if (menu.children?.length) {
      const result = findMenuChainByPath(targetPath, menu.children);
      if (result) {
        return [menu, ...result];
      }
    }
  }

  return null;
}

/**
 * Transform menu to breadcrumb
 *
 * @param menu
 */
function transformMenuToBreadcrumb(menu: App.Global.Menu) {
  const { children, ...rest } = menu;

  const breadcrumb: App.Global.Breadcrumb = {
    ...rest
  };

  if (children?.length) {
    breadcrumb.options = children.map(transformMenuToBreadcrumb);
  }

  return breadcrumb;
}

/**
 * Get breadcrumbs by route
 *
 * @param route
 * @param menus
 */
export function getBreadcrumbsByRoute(
  route: RouteLocationNormalizedLoaded,
  menus: App.Global.Menu[]
): App.Global.Breadcrumb[] {
  const key = String(route.name ?? '');
  const activeMenu = route.meta?.activeMenu;

  let chain = findMenuChainByKey(key, menus);

  // the activeMenu of RuoYi is a route path, so here supports both the menu key and the route path
  if (!chain && activeMenu) {
    const parentChain = findMenuChainByPath(activeMenu, menus);

    if (parentChain) {
      chain = [...parentChain, getGlobalMenuByRoute(route)];
    }
  }

  if (!chain?.length) {
    return [];
  }

  return chain.map(transformMenuToBreadcrumb);
}

/**
 * Transform menu to searchMenus
 *
 * @param menus - menus
 * @param treeMap
 */
export function transformMenuToSearchMenus(menus: App.Global.Menu[], treeMap: App.Global.Menu[] = []) {
  if (menus && menus.length === 0) return [];
  return menus.reduce((acc, cur) => {
    if (!cur.children) {
      acc.push(cur);
    }
    if (cur.children && cur.children.length > 0) {
      transformMenuToSearchMenus(cur.children, treeMap);
    }
    return acc;
  }, treeMap);
}
