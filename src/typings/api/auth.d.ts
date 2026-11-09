declare namespace Api {
  /**
   * namespace Auth
   *
   * backend api module: "auth" (RuoYi-Vue-Plus)
   */
  namespace Auth {
    /**
     * login request params, same as LoginData in plus-ui
     *
     * api: POST /auth/login
     */
    interface LoginData {
      username: string;
      password: string;
      code?: string;
      uuid?: string;
      clientId?: string;
      grantType?: string;
    }

    /** login response data of RuoYi (snake_case keys), same as LoginResult in plus-ui */
    interface LoginResult {
      access_token: string;
      expire_in?: number;
      client_id?: string;
    }

    /** the user object of RuoYi, see UserVO in plus-ui (only the fields returned by getInfo are declared) */
    interface UserVO {
      userId: string | number;
      tenantId?: string;
      deptId?: string | number;
      userName: string;
      nickName: string;
      userType?: string;
      email?: string;
      phoneNumber?: string;
      sex?: string;
      avatar?: string | number;
      avatarUrl?: string;
      status?: string;
      loginIp?: string;
      loginDate?: string;
      remark?: string;
    }

    /**
     * user info returned by the api: GET /system/user/getInfo
     *
     * same as UserInfo in plus-ui (the RuoYi original structure)
     */
    interface UserInfo {
      user: UserVO;
      roles: string[];
      permissions: string[];
    }

    /** captcha returned by the api: GET /auth/code */
    interface Captcha {
      captchaEnabled: boolean;
      img: string;
      uuid: string;
    }
  }
}
