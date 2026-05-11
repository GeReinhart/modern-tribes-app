import { getAPIBaseUrl } from '@/config/env';
import { tokenManager } from '@/utils/tokenManager';

class ApiService {

    private getAuthHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        const token = tokenManager.getAccessToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    }

    private async request<T>(
        endpoint: string,
        options?: RequestInit,
        isRetry = false,
    ): Promise<T> {
        const url = `${getAPIBaseUrl()}${endpoint}`;

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.getAuthHeaders(),
                    ...options?.headers,
                },
            });

            if (response.status === 401 && !isRetry) {
                const newToken = await tokenManager.tryRefresh();
                if (newToken) {
                    return this.request<T>(endpoint, options, true);
                }
            }

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
                throw new Error(error.detail || `HTTP error! status: ${response.status}`);
            }

            // Handle 204 No Content
            if (response.status === 204) {
                return null as T;
            }

            return await response.json();
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    async post<T>(endpoint: string, data: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put<T>(endpoint: string, data: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

export const apiService = new ApiService();