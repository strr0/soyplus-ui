import type { AxiosResponse } from 'axios';
import { BACKEND_ERROR_CODE, createFlatRequest } from '@sa/axios';
import { getServiceBaseURL } from '@/utils/service';
import { $t } from '@/locales';
import { useAuthStore } from '@/store/modules/auth';
import { getAuthorization, showErrorMsg } from './shared';
import { ENCRYPT_HEADER, decryptResponse, encryptRequest, isEncryptEnabled } from './encrypt';
import type { RequestInstanceState } from './type';

const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

export const request = createFlatRequest(
  {
    baseURL
  },
  {
    defaultState: {
      errMsgStack: []
    } as RequestInstanceState,
    transform(response: AxiosResponse<App.Service.Response<any>>) {
      return response.data.data;
    },
    async onRequest(config) {
      const Authorization = getAuthorization();
      Object.assign(config.headers, { Authorization, clientid: import.meta.env.VITE_APP_CLIENT_ID });

      // encrypt the request body when the api marks `isEncrypt` and the encrypt is enabled
      if (
        isEncryptEnabled() &&
        String(config.headers.isEncrypt) === 'true' &&
        ['post', 'put'].includes(config.method || '')
      ) {
        const { body, keyHeader } = encryptRequest(config.data);

        config.data = body;
        config.headers[ENCRYPT_HEADER] = keyHeader;
      }
      // the encrypt flag is only a internal marker, never send it as a header
      delete config.headers.isEncrypt;

      return config;
    },
    onResponse(response) {
      if (!isEncryptEnabled()) return;

      // decrypt the response body when the backend returns the encrypted aes key in the header
      const keyStr = response.headers[ENCRYPT_HEADER];
      if (keyStr) {
        response.data = decryptResponse(keyStr, response.data);
      }
    },
    isBackendSuccess(response) {
      // when the backend response code is "200"(default of RuoYi), it means the request is success
      // to change this logic by yourself, you can modify the `VITE_SERVICE_SUCCESS_CODE` in `.env` file
      return String(response.data.code) === import.meta.env.VITE_SERVICE_SUCCESS_CODE;
    },
    async onBackendFail(response) {
      const authStore = useAuthStore();
      const responseCode = String(response.data.code);

      function handleLogout() {
        authStore.resetStore();
      }

      function logoutAndCleanup() {
        handleLogout();
        window.removeEventListener('beforeunload', handleLogout);

        request.state.errMsgStack = request.state.errMsgStack.filter(msg => msg !== response.data.msg);
      }

      // when the backend response code is in `logoutCodes`, it means the user will be logged out and redirected to login page
      // for RuoYi, the token expired / unauthorized code is 401
      const logoutCodes = import.meta.env.VITE_SERVICE_LOGOUT_CODES?.split(',') || [];
      if (logoutCodes.includes(responseCode)) {
        handleLogout();
        return null;
      }

      // when the backend response code is in `modalLogoutCodes`, it means the user will be logged out by displaying a modal
      const modalLogoutCodes = import.meta.env.VITE_SERVICE_MODAL_LOGOUT_CODES?.split(',') || [];
      if (modalLogoutCodes.includes(responseCode) && !request.state.errMsgStack?.includes(response.data.msg)) {
        request.state.errMsgStack = [...(request.state.errMsgStack || []), response.data.msg];

        // prevent the user from refreshing the page
        window.addEventListener('beforeunload', handleLogout);

        window.$dialog?.error({
          title: $t('common.error'),
          content: response.data.msg,
          positiveText: $t('common.confirm'),
          maskClosable: false,
          closeOnEsc: false,
          onPositiveClick() {
            logoutAndCleanup();
          },
          onClose() {
            logoutAndCleanup();
          }
        });

        return null;
      }

      return null;
    },
    onError(error) {
      // when the request is fail, you can show error message

      let message = error.message;
      let backendErrorCode = '';

      // get backend error message and code
      if (error.code === BACKEND_ERROR_CODE) {
        message = error.response?.data?.msg || message;
        backendErrorCode = String(error.response?.data?.code || '');
      }

      // the error message is displayed in the modal
      const modalLogoutCodes = import.meta.env.VITE_SERVICE_MODAL_LOGOUT_CODES?.split(',') || [];
      if (modalLogoutCodes.includes(backendErrorCode)) {
        return;
      }

      showErrorMsg(request.state, message);
    }
  }
);
