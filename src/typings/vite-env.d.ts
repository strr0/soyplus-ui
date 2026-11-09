/**
 * Namespace Env
 *
 * It is used to declare the type of the import.meta object
 */
declare namespace Env {
  /** The router history mode */
  type RouterHistoryMode = 'hash' | 'history' | 'memory';

  /** Interface for import.meta */
  // eslint-disable-next-line @typescript-eslint/no-shadow
  interface ImportMeta extends ImportMetaEnv {
    /** The base url of the application */
    readonly VITE_BASE_URL: string;
    /** The title of the application */
    readonly VITE_APP_TITLE: string;
    /** The description of the application */
    readonly VITE_APP_DESC: string;
    /** The router history mode */
    readonly VITE_ROUTER_HISTORY_MODE?: RouterHistoryMode;
    /** The prefix of the iconify icon */
    readonly VITE_ICON_PREFIX: 'icon';
    /**
     * The prefix of the local icon
     *
     * This prefix is start with the icon prefix
     */
    readonly VITE_ICON_LOCAL_PREFIX: 'icon-local';
    /** backend service base url */
    readonly VITE_SERVICE_BASE_URL: string;
    /**
     * success code of backend service
     *
     * when the code is received, the request is successful
     */
    readonly VITE_SERVICE_SUCCESS_CODE: string;
    /**
     * logout codes of backend service
     *
     * when the code is received, the user will be logged out and redirected to login page
     *
     * use "," to separate multiple codes
     */
    readonly VITE_SERVICE_LOGOUT_CODES: string;
    /**
     * modal logout codes of backend service
     *
     * when the code is received, the user will be logged out by displaying a modal
     *
     * use "," to separate multiple codes
     */
    readonly VITE_SERVICE_MODAL_LOGOUT_CODES: string;
    /**
     * token expired codes of backend service
     *
     * when the code is received, it will refresh the token and resend the request
     *
     * use "," to separate multiple codes
     */
    readonly VITE_SERVICE_EXPIRED_TOKEN_CODES: string;
    /**
     * other backend service base url
     *
     * the value is a json
     */
    readonly VITE_OTHER_SERVICE_BASE_URL: string;
    /**
     * Whether to enable the http proxy
     *
     * Only valid in the development environment
     */
    readonly VITE_HTTP_PROXY?: CommonType.YesOrNo;
    /**
     * Default menu icon if menu icon is not set
     *
     * Iconify icon name
     */
    readonly VITE_MENU_ICON: string;
    /** Whether to build with sourcemap */
    readonly VITE_SOURCE_MAP?: CommonType.YesOrNo;
    /**
     * Iconify api provider url
     *
     * If the project is deployed in intranet, you can set the api provider url to the local iconify server
     *
     * @link https://docs.iconify.design/api/providers.html
     */
    readonly VITE_ICONIFY_URL?: string;
    /** Used to differentiate storage across different domains */
    readonly VITE_STORAGE_PREFIX?: string;
    /** Whether to automatically detect updates after configuring application packaging */
    readonly VITE_AUTOMATICALLY_DETECT_UPDATE?: CommonType.YesOrNo;
    /** Whether to show watermark */
    readonly VITE_WATERMARK?: CommonType.YesOrNo;
    /** show proxy url log in terminal */
    readonly VITE_PROXY_LOG?: CommonType.YesOrNo;
    /** The launch editor */
    readonly VITE_DEVTOOLS_LAUNCH_EDITOR?: import('vite-plugin-vue-devtools').VitePluginVueDevToolsOptions['launchEditor'];
    /**
     * the client id of the RuoYi backend, which is stored in the `sys_client` table
     *
     * it will be sent to the backend by the request header `clientid`
     */
    readonly VITE_APP_CLIENT_ID: string;
    /** remember me */
    readonly VITE_REMEMBER_ME_AES_KEY?: string;
    /**
     * Whether to enable the api encrypt (RSA + AES) of the RuoYi backend
     *
     * If the backend enables api-encrypt, the annotated apis (like login) must be encrypted in the request body
     */
    readonly VITE_APP_ENCRYPT?: CommonType.YesOrNo;
    /** header flag */
    readonly VITE_HEADER_FLAG?: string;
    /** The RSA public key to encrypt the aes key of the request body, matches the decrypt private key of the backend */
    readonly VITE_APP_RSA_PUBLIC_KEY?: string;
    /** The RSA private key to decrypt the response, matches the encrypt public key of the backend */
    readonly VITE_APP_RSA_PRIVATE_KEY?: string;
    /** web socket */
    readonly VITE_APP_WEBSOCKET: CommonType.YesOrNo;
    /** sse */
    readonly VITE_APP_SSE: CommonType.YesOrNo;
  }
}

interface ImportMeta {
  readonly env: Env.ImportMeta;
}
