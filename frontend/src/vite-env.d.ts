/// <reference types="vite/client" />

/**
 * Vite client types for import.meta.env variables
 * @see https://vitejs.dev/guide/env-and-mode.html
 */
interface ImportMetaEnv {
  /** Base URL for the application */
  readonly VITE_API_BASE_URL?: string;
  /** Application mode (development, production, test) */
  readonly MODE: string;
  /** Whether in development mode */
  readonly DEV: boolean;
  /** Whether in production mode */
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
