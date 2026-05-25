import { authService } from '@/services/auth.service.ts';
import { Authorization, PermissionEnum } from '@/types/authorization.types.ts';

import { useCallback, useState } from 'react';

interface UseVerifyAuthorizationState {
  data: Authorization | null;
  loading: boolean;
  error: Error | null;
}

export const useVerifyAuthorization = () => {
  const [state, setState] = useState<UseVerifyAuthorizationState>({
    data: null,
    loading: false,
    error: null,
  });

  const verifyAuthorization = useCallback(
    async (
      permissions: PermissionEnum[],
      tribe_id?: string,
      position?: string,
    ): Promise<Authorization> => {
      setState({ data: null, loading: true, error: null });

      try {
        const result = await authService.verifyAuthorization(
          permissions,
          tribe_id,
          position,
        );
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setState({ data: null, loading: false, error });
        throw error;
      }
    },
    [],
  );

  return {
    ...state,
    verifyAuthorization,
  };
};
