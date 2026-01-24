import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
  AxiosResponse,
} from "axios";


interface RefreshTokenResponse {
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let axiosSecureInstance: AxiosInstance | null = null;

const createAxiosSecure = (): AxiosInstance => {
  const axiosSecure = axios.create({
    baseURL: "http://localhost:8080/api/v1",
    headers: {
      "Content-Type": "application/json",
    },
  });

  // REQUEST interceptor
  axiosSecure.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `${token}`;
    }
    return config;
  });

  // RESPONSE interceptor (your refresh logic stays same)
  axiosSecure.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as CustomAxiosRequestConfig;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem("refreshToken");

          if (!refreshToken) {
            localStorage.clear();
            window.location.href = "/login";
            return Promise.reject(error);
          }

          const res = await axios.post<RefreshTokenResponse>(
            "http://localhost:8080/api/v1/auth/refresh-token",
            { refreshToken }
          );

          localStorage.setItem("accessToken", res.data.data.accessToken);
          localStorage.setItem("refreshToken", res.data.data.refreshToken);

          originalRequest.headers!.Authorization =
            `${res.data.data.accessToken}`;

          return axiosSecure(originalRequest);
        } catch (err) {
          localStorage.clear();
          window.location.href = "/login";
          return Promise.reject(err);
        }
      }

      return Promise.reject(error);
    }
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
 