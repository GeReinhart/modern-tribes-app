import { getAPIBaseUrl } from '@/app/platform/core/env.ts';
import { apiService } from '@/app/platform/core/api/api.service.ts';

export const authService = {
  sendMagicLink: async (email: string): Promise<void> => {
    const response = await fetch(`${getAPIBaseUrl()}/platform/core/authentication/magic-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const data = await response.json();
      const error: Error & { status?: number } = new Error(
        data.detail || 'Failed to send magic link',
      );
      error.status = response.status;
      throw error;
    }
  },

  verifyToken: async (
    token: string,
  ): Promise<{ access_token: string; refresh_token: string }> => {
    const response = await fetch(
      `${getAPIBaseUrl()}/platform/core/authentication/verify?token=${token}`,
      { method: 'POST' },
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || 'Verification failed');
    }

    return response.json();
  },

  refreshToken: async (
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> => {
    const response = await fetch(`${getAPIBaseUrl()}/platform/core/authentication/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const err: Error & { status?: number } = new Error(
        data.detail || 'Token refresh failed',
      );
      err.status = response.status;
      throw err;
    }

    return response.json();
  },

  updateLanguage: async (language: string): Promise<void> => {
    await apiService.patch('/platform/core/authentication/me/language', { language });
  },
};
