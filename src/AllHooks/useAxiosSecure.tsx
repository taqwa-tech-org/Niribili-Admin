import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import Cookies from "js-cookie";

interface RefreshTokenResponse {
  data: {
    accessToken: string;
  };
}

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Cookie options
const cookieOptions = {
  expires: 7,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
};

let axiosSecureInstance: AxiosInstance | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const createAxiosSecure = (): AxiosInstance => {
  const axiosSecure = axios.create({
    baseURL: import.meta.env.VITE_SERVER_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // REQUEST interceptor - attach access token from cookie
  axiosSecure.interceptors.request.use((config) => {
    const token = Cookies.get("accessToken");
    if (token) {
      config.headers.Authorization = `${token}`;
    }
    return config;
  });

  // RESPONSE interceptor - handle token refresh
  axiosSecure.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as CustomAxiosRequestConfig;

      // If 401 and not already retrying
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // Queue requests while refreshing
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers!.Authorization = `${token}`;
              return axiosSecure(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = Cookies.get("refreshToken");

          if (!refreshToken) {
            throw new Error("No refresh token");
          }

          const res = await axios.post<RefreshTokenResponse>(
            `${import.meta.env.VITE_SERVER_URL}/auth/refresh-token`,
            { refreshToken },
          );

          const { accessToken } = res.data.data;

          // Store new access token in cookie
          Cookies.set("accessToken", accessToken, cookieOptions);

          // Update authorization header
          originalRequest.headers!.Authorization = `${accessToken}`;

          processQueue(null, accessToken);

          return axiosSecure(originalRequest);
        } catch (err) {
          processQueue(err as Error, null);

          // Clear cookies and redirect to login
          Cookies.remove("accessToken");
          Cookies.remove("refreshToken");
          window.location.href = "/";

          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );

  return axiosSecure;
};

export const axiosSecure = (() => {
  if (!axiosSecureInstance) {
    axiosSecureInstance = createAxiosSecure();
  }
  return axiosSecureInstance;
})();

const useAxiosSecure = (): AxiosInstance => {
  return axiosSecure;
};

export default useAxiosSecure;
