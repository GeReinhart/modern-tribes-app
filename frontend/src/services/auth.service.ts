import { getAPIBaseUrl } from '@/config/env';
import { apiService } from '@/services/api.service.ts';
import { Authorization, PermissionEnum } from '@/types/authorization.types.ts';

export const authService = {
  sendMagicLink: async (email: string): Promise<void> => {
    const response = await fetch(`${getAPIBaseUrl()}/auth/magic-link`, {
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
      `${getAPIBaseUrl()}/auth/verify?token=${token}`,
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
    const response = await fetch(`${getAPIBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || 'Token refresh failed');
    }

    return response.json();
  },

  updateLanguage: async (language: string): Promise<void> => {
    await apiService.patch('/auth/me/language', { language });
  },

  verifyAuthorization: async (
    permissions: PermissionEnum[],
    tribe_id?: string,
    position?: string,
  ): Promise<Authorization> => {
    const permissionsStr = permissions.join(',');

    let url = `/auth/permissions/any/${permissionsStr}`;

    if (tribe_id) {
      url += `/own/tribe/${tribe_id}`;

      if (position) {
        url += `/position/${position}`;
      }
    }

    return apiService.get<Authorization>(url);
  },
};
