import type { RouteMeta, RouteRecordRaw } from 'vue-router';
import { createCustomNameComponent } from '@/utils/createCustomNameComponent';
import BaseLayout from '@/layouts/base-layout/index.vue';

/** the component names which have special meaning in the RuoYi backend menu */
const LAYOUT_COMPONENT = 'Layout';
const PARENT_VIEW_COMPONENT = 'ParentView';
const INNER_LINK_COMPONENT = 'InnerLink';

/** all views of the project, used to resolve the component by the string which is returned by the backend */
const viewModules = import.meta.glob('/src/views/**/*.vue');

/** the map of the view modules, the key is the relative path of the view, like `system/user/index` */
const viewModuleMap = new Map<string, () => Promise<any>>();
Object.entries(viewModules).forEach(([path, loader]) => {
  const dir = path.slice('/src/views/'.length, path.lastIndexOf('.vue'));
  viewModuleMap.set(dir, loader as () => Promise<any>);
});

/** whether the path is a http url */
function isHttpPath(path: string) {
  return /^https?:\/\//.test(path);
}

/** join the parent path and the child path, and remove the duplicated slashes */
function joinPath(parentPath: string, childPath: string) {
  return `${parentPath}/${childPath}`.replace(/\/{2,}/g, '/');
}

/**
 * Load the view component by the component string of the backend menu
 *
 * the component name is wrapped by the route name, to make the `keep-alive` work
 *
 * @param view The component string of the backend menu, like `system/user/index`
 * @param name The route name
 */
function loadView(view: string, name: string) {
  const loader = viewModuleMap.get(view);

  if (!loader) {
    console.error(`Cannot find view component: ${view} of the route: ${name}`);

    return () => import('@/views/_builtin/404/index.vue');
  }

  return createCustomNameComponent(loader, { name });
}

/** parse the query string of the backend menu to the meta query of soybean */
function parseRouteQuery(query?: string): { key: string; value: string }[] | null {
  if (!query) return null;

  try {
    const parsed = JSON.parse(query) as Record<string, string>;
    return Object.entries(parsed).map(([key, value]) => ({ key, value }));
  } catch {
    return null;
  }
}

/** create the route meta by the backend menu node */
function createRouteMeta(node: Api.Route.MenuRoute): RouteMeta {
  const meta = node.meta;

  const result: RouteMeta = {
    title: meta?.title || node.name,
    keepAlive: meta?.noCache !== true,
    hideInMenu: node.hidden === true
  };

  if (meta?.icon?.includes(':')) {
    result.icon = meta.icon;
  }

  if (meta?.activeMenu) {
    result.activeMenu = meta.activeMenu;
  }

  if (meta?.link) {
    result.link = meta.link;
  }

  const query = parseRouteQuery(node.query);
  if (query) {
    result.query = query;
  }

  return result;
}

/** create the route record of the leaf, which has a real page component */
function createLeafRoute(node: Api.Route.MenuRoute, path: string): RouteRecordRaw {
  const meta = createRouteMeta(node);

  const route = {
    name: node.name,
    path,
    meta
  } as unknown as RouteRecordRaw;

  if (node.redirect && node.redirect !== 'noRedirect') {
    route.redirect = node.redirect;
  }

  if (node.component === INNER_LINK_COMPONENT || (meta.link && !isHttpPath(node.path))) {
    // inner link: show the link in a iframe page
    route.component = () => import('@/views/_builtin/iframe-page/[url].vue');
    route.props = () => ({ url: meta.link });
  } else if (isHttpPath(node.path) || (meta.link && isHttpPath(meta.link))) {
    // external link: open it in a new page by the route guard
    meta.href = meta.link || node.path;
    route.path = `/href-link/${node.name}`;
    route.component = () => import('@/views/_builtin/404/index.vue');
  } else {
    route.component = loadView(node.component || node.path, node.name);
  }

  return route;
}

/**
 * flatten the children of the backend menu
 *
 * the `ParentView` is a virtual component, which is used to support the multi level menu, soybean does not need it, so
 * we flatten it and join the path of its children
 *
 * @param nodes The children nodes of the backend menu
 * @param parentPath The full path of the parent node
 */
function flattenMenuChildren(nodes: Api.Route.MenuRoute[], parentPath: string): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = [];

  nodes.forEach(node => {
    const fullPath = node.path.startsWith('/') ? node.path : joinPath(parentPath, node.path);

    if (node.component === PARENT_VIEW_COMPONENT && node.children?.length) {
      routes.push(...flattenMenuChildren(node.children, fullPath));
      return;
    }

    const route = createLeafRoute(node, node.path);

    if (node.children?.length) {
      route.children = flattenMenuChildren(node.children, fullPath);
    }

    routes.push(route);
  });

  return routes;
}

/** transform the backend menu routes to the vue router routes */
export function transformRoutes(nodes: Api.Route.MenuRoute[]): RouteRecordRaw[] {
  return nodes.map(node => {
    const meta = createRouteMeta(node);

    const isSinglePage = !node.children?.length || node.component !== LAYOUT_COMPONENT;

    if (isSinglePage) {
      // the top level route which is not a layout, treat it as a leaf route
      return createLeafRoute(node, node.path);
    }

    const route = {
      name: node.name,
      path: isHttpPath(node.path) ? `/href-link/${node.name}` : node.path,
      component: BaseLayout,
      meta,
      children: flattenMenuChildren(node.children!, node.path)
    } as unknown as RouteRecordRaw;

    if (node.redirect && node.redirect !== 'noRedirect') {
      route.redirect = node.redirect;
    }

    return route;
  });
}

/** collect all the full paths of the vue router routes, used to check whether the route is authorized */
export function collectRoutePaths(routes: RouteRecordRaw[], parentPath = ''): string[] {
  const paths: string[] = [];

  routes.forEach(route => {
    if (route.path === '/:pathMatch(.*)*') return;

    const fullPath = route.path.startsWith('/') ? route.path : joinPath(parentPath, route.path);

    if (!route.children?.length) {
      paths.push(fullPath);
    } else {
      paths.push(...collectRoutePaths(route.children, fullPath));
    }
  });

  return paths;
}

/** check whether the route names of the routes are duplicated */
export function checkRouteNameRepeat(routes: RouteRecordRaw[]) {
  const nameSet = new Set<string>();

  function walk(items: RouteRecordRaw[]) {
    items.forEach(item => {
      const name = String(item.name || '');

      if (!name) return;

      if (nameSet.has(name)) {
        const message = `Route name: [${name}] is duplicated, it may cause 404 error`;
        console.error(message);
        window.$message?.error(message);
      } else {
        nameSet.add(name);
      }

      if (item.children?.length) {
        walk(item.children as RouteRecordRaw[]);
      }
    });
  }

  walk(routes);
}
