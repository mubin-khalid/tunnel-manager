/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string;
  /** HTTPS base URL for the Git repo (from package.json `repository`, no trailing slash). */
  readonly VITE_REPOSITORY_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
