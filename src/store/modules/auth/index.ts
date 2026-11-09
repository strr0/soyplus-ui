import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { defineStore } from 'pinia';
import { useLoading } from '@sa/hooks';
import { localStg } from '@/utils/storage';
import { fetchGetUserInfo, fetchLogin, fetchLogout } from '@/service/api';
import { $t } from '@/locales';
import { useRouterPush } from '@/hooks/common/router';
import { router } from '@/router';
import { SetupStoreId } from '@/enum';
import { useRouteStore } from '../route';
import { useTabStore } from '../tab';
import { clearAuthStorage, getToken } from './shared';

export const useAuthStore = defineStore(SetupStoreId.Auth, () => {
  const route = useRoute();
  const authStore = useAuthStore();
  const routeStore = useRouteStore();
  const tabStore = useTabStore();
  const { redirectFromLogin } = useRouterPush(false);
  const { loading: loginLoading, startLoading, endLoading } = useLoading();

  const token = ref('');

  /** the original RuoYi user info: { user, roles, permissions } */
  const userInfo: Api.Auth.UserInfo = reactive({
    user: {
      userId: '',
      userName: '',
      nickName: ''
    },
    roles: [],
    permissions: []
  });

  /** is super admin by the permissions of RuoYi */
  const isSuperAdmin = computed(() => userInfo.permissions.includes('*:*:*'));

  /** Is login */
  const isLogin = computed(() => Boolean(token.value));

  /** Reset auth store */
  async function resetStore() {
    recordUserId();

    clearAuthStorage();

    authStore.$reset();

    if (!route.meta.constant) {
      // jump to the login page by replace, same as plus-ui, so the back button can not go back to the protected page
      await router.replace({
        name: 'login',
        params: { module: 'pwd-login' },
        query: { redirect: route.fullPath }
      });
    }

    tabStore.cacheTabs();
    routeStore.resetStore();
  }

  /** Record the user ID of the previous login session Used to compare with the current user ID on next login */
  function recordUserId() {
    if (!userInfo.user.userId) {
      return;
    }

    // Store current user ID locally for next login comparison
    localStg.set('lastLoginUserId', String(userInfo.user.userId));
  }

  /**
   * Check if current login user is different from previous login user If different, clear all tabs
   *
   * @returns {boolean} Whether to clear all tabs
   */
  function checkTabClear(): boolean {
    if (!userInfo.user.userId) {
      return false;
    }

    const lastLoginUserId = localStg.get('lastLoginUserId');

    // Clear all tabs if current user is different from previous user
    if (!lastLoginUserId || lastLoginUserId !== String(userInfo.user.userId)) {
      localStg.remove('globalTabs');
      tabStore.clearTabs();

      localStg.remove('lastLoginUserId');
      return true;
    }

    localStg.remove('lastLoginUserId');
    return false;
  }

  /**
   * Login, same as the login flow of the plus-ui user store
   *
   * @param loginData Login params (username / password / captcha code and uuid)
   * @param [redirect=true] Whether to redirect after login. Default is `true`
   */
  async function login(loginData: Api.Auth.LoginData, redirect = true) {
    startLoading();

    const { data: loginResult, error } = await fetchLogin(loginData);

    // the backend returns a snake_case `access_token`, reject the login when it is missing
    if (!error && loginResult?.access_token) {
      const pass = await loginByToken(loginResult);

      if (pass) {
        // Check if the tab needs to be cleared
        const isClear = checkTabClear();
        let needRedirect = redirect;

        if (isClear) {
          // If the tab needs to be cleared,it means we don't need to redirect.
          needRedirect = false;
        }
        await redirectFromLogin(needRedirect);

        window.$notification?.success({
          title: $t('page.login.common.loginSuccess'),
          // greet with the nickName, fallback to the login userName when it is empty
          content: $t('page.login.common.welcomeBack', { userName: userInfo.user.nickName || userInfo.user.userName }),
          duration: 4500
        });
      }
    } else {
      resetStore();
    }

    endLoading();
  }

  async function loginByToken(loginResult: Api.Auth.LoginResult) {
    // 1. stored in the localStorage, the later requests need it in headers
    localStg.set('token', loginResult.access_token);

    // 2. get user info
    const pass = await getUserInfo();

    if (pass) {
      token.value = loginResult.access_token;

      return true;
    }

    return false;
  }

  /** Get the user info from the RuoYi backend, same as the getInfo of the plus-ui user store */
  async function getUserInfo() {
    const { data: info, error } = await fetchGetUserInfo();

    if (!error && info?.user) {
      // when the roles is empty, fallback to the ROLE_DEFAULT, keep same as plus-ui
      if (!info.roles || info.roles.length === 0) {
        info.roles = ['ROLE_DEFAULT'];
      }

      // store the original RuoYi user info directly, no field mapping
      Object.assign(userInfo, info);

      return true;
    }

    return false;
  }

  async function initUserInfo() {
    const maybeToken = getToken();

    if (maybeToken) {
      token.value = maybeToken;
      const pass = await getUserInfo();

      if (!pass) {
        resetStore();
      }
    }
  }

  /**
   * Logout by the RuoYi backend and reset the store, same as the logout flow of plus-ui
   *
   * the logout api invalidates the token session in the backend; the flat request never throws, so the local state is
   * always cleared even when the session has already expired
   */
  async function logout() {
    await fetchLogout();

    // close all the opened pages like the `tab.closeAllPage()` of plus-ui
    // set the active tab to the home tab first to avoid the route switching of the clearTabs
    tabStore.activeTabId = tabStore.homeTab?.id || '';
    await tabStore.clearTabs();
    localStg.remove('globalTabs');

    await resetStore();
  }

  return {
    token,
    userInfo,
    isSuperAdmin,
    isLogin,
    loginLoading,
    resetStore,
    login,
    logout,
    initUserInfo
  };
});
