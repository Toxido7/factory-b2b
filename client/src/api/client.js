import axios from "axios";

let accessToken = null;
let onSessionExpired = null;

export const setAccessToken = (token) => {
  accessToken = token;
};
export const setOnSessionExpired = (fn) => {
  onSessionExpired = fn;
};

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Attach the access token to every request
api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// Single-flight: everybody who needs a refresh shares the same promise
let refreshPromise = null;

export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post("/api/auth/refresh", null, { withCredentials: true })
      .then((res) => {
        const { user, accessToken: token } = res.data.data;
        setAccessToken(token);
        return user;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

const NO_RETRY = ["/auth/login", "/auth/register", "/auth/refresh"];

// On 401: refresh once, then replay the request one time
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (
      status === 401 &&
      original &&
      !original._retried &&
      !NO_RETRY.includes(original.url)
    ) {
      original._retried = true;
      try {
        await refreshSession();
        return api(original);
      } catch {
        setAccessToken(null);
        if (onSessionExpired) onSessionExpired();
      }
    }
    return Promise.reject(error);
  },
);
