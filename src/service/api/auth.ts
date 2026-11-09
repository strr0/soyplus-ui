import { request } from '../request';

/**
 * Login, same as the login api of plus-ui
 *
 * @param data Login params (username / password / captcha code and uuid)
 */
export function fetchLogin(data: Api.Auth.LoginData) {
  const params = {
    ...data,
    clientId: data.clientId || import.meta.env.VITE_APP_CLIENT_ID,
    grantType: data.grantType || 'password'
  };

  return request<Api.Auth.LoginResult>({
    url: '/auth/login',
    method: 'post',
    headers: {
      // the login api of RuoYi is annotated with `@ApiEncrypt` when the server enables api-encrypt
      isEncrypt: 'true'
    },
    data: params
  });
}

/** Get captcha image */
export function fetchCaptcha() {
  return request<Api.Auth.Captcha>({ url: '/auth/code' });
}

/** Get user info, including roles and permissions */
export function fetchGetUserInfo() {
  return request<Api.Auth.UserInfo>({ url: '/system/user/getInfo' });
}

/** Logout */
export function fetchLogout() {
  return request({ url: '/auth/logout', method: 'post' });
}
