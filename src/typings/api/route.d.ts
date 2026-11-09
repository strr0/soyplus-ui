declare namespace Api {
  /**
   * namespace Route
   *
   * backend api module: "system/menu" (RuoYi style)
   */
  namespace Route {
    /** the meta of the menu route, which is returned by the RuoYi backend */
    interface MenuRouteMeta {
      /** the title of the menu route */
      title: string;
      /** the icon of the menu route */
      icon?: string;
      /** whether the route is no cache, the opposite of `keepAlive` */
      noCache?: boolean;
      /** whether to show the route in breadcrumb */
      breadcrumb?: boolean;
      /** the active menu route name of the route */
      activeMenu?: string;
      /** the link of the route, it can be a inner iframe link or an external link */
      link?: string;
    }

    /** the menu route returned by the RuoYi backend (RouterVo) */
    interface MenuRoute {
      /** the name of the route */
      name: string;
      /** the path of the route, can be a http url for the external link menu */
      path: string;
      /** whether the route is hidden in the menu */
      hidden?: boolean;
      /** the redirect of the route, `noRedirect` means redirect to itself in breadcrumb */
      redirect?: string;
      /**
       * the component of the route
       *
       - `Layout`: the layout of the admin
       - `ParentView`: a virtual container of the multi level menu
       - `InnerLink`: a iframe page
       - others: the path of the view component, like `system/user/index`
       */
      component?: string;
      /** the default query of the route, it is a json string */
      query?: string;
      /** the meta of the route */
      meta?: MenuRouteMeta;
      /** the children of the route */
      children?: MenuRoute[];
    }
  }
}
