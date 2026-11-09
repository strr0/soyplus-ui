import { request } from '../request';

/** Get the dynamic routes (menu tree) from the RuoYi backend */
export function fetchGetRouters() {
  return request<Api.Route.MenuRoute[]>({ url: '/system/menu/getRouters' });
}
