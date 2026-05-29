import { getAPIBaseUrl } from '@/app/platform/core/env.ts';
import { localStorageUtils } from '@/app/platform/core/browser/local-storage/local-storage-utils.ts';

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const apiUtils = axios.create({
  baseURL: getAPIBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
apiUtils.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorageUtils.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - Handle 401 errors
apiUtils.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorageUtils.clearAuth();
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  },
);
