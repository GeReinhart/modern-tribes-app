import {Authorization, PermissionEnum} from "@/types/authorization.types.ts";
import {apiService} from "@/services/api.service.ts";
import { API_BASE_URL } from '@/config/env';

export const authService = {
    sendMagicLink: async (email: string): Promise<void> => {
        const response = await fetch(
            `${API_BASE_URL}/auth/magic-link`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            }
        );

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || 'Failed to send magic link');
        }
    },

    verifyToken: async (token: string): Promise<{ access_token: string }> => {
        const response = await fetch(
            `${API_BASE_URL}/auth/verify?token=${token}`,
            {
                method: 'POST',
            }
        );

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || 'Verification failed');
        }

        return response.json();
    },

    verifyAuthorization: async (
        permissions: PermissionEnum[],
        tribe_id?: string,
        position?: string
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
    }



};