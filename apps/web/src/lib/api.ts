import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
});

function readCookie(name: string) {
  return document.cookie.split("; ").find((row) => row.startsWith(`${name}=`))?.split("=")[1];
}

// Attach the double-submit CSRF token to every cookie-issuing call.
api.interceptors.request.use((config) => {
  const csrf = readCookie("csrfToken");
  if (csrf) config.headers.set("x-csrf-token", csrf);
  return config;
});

let accessToken: string | null = null;
export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) config.headers.set("Authorization", `Bearer ${accessToken}`);
  return config;
});

// Single-flight refresh: on a 401, rotate the session once and replay failures.
let refreshing: Promise<string> | null = null;

async function refreshAccessToken() {
  refreshing ??= api
    .post<{ accessToken: string }>("/auth/refresh")
    .then(({ data }) => {
      setAccessToken(data.accessToken);
      return data.accessToken;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const isAuthCall = original?.url?.includes("/auth/login") || original?.url?.includes("/auth/refresh");
    if (error.response?.status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      try {
        await refreshAccessToken();
      } catch {
        setAccessToken(null);
        window.dispatchEvent(new Event("auth:expired"));
        return Promise.reject(error);
      }
      return api(original);
    }
    return Promise.reject(error);
  },
);

export type ApiError = { error?: { code?: string; message?: string; details?: unknown } };

export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (axios.isAxiosError<ApiError>(error)) return error.response?.data?.error?.message ?? fallback;
  return fallback;
}
