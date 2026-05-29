import { ThemedText } from '@/platform/core/layout/themes/components/ThemedText.tsx';
import { ThemeProvider } from '@/platform/core/layout/themes/ThemeContext.tsx';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from './AuthContext.tsx';
import { authService } from './authentication-service.ts';

export default function Verify() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setError(t('auth.invalidLink'));
        setIsVerifying(false);
        return;
      }

      try {
        const data = await authService.verifyToken(token);
        await login(data.access_token, data.refresh_token);
        navigate('/app', { replace: true });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t('auth.verificationError'),
        );
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [searchParams, login, navigate, t]);

  return (
    <ThemeProvider defaultTheme="default">
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          {isVerifying ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <ThemedText variant="secondary">{t('auth.verifying')}</ThemedText>
            </>
          ) : error ? (
            <>
              <div className="rounded-md bg-red-50 p-4">
                <ThemedText variant="danger" size="medium">
                  {error}
                </ThemedText>
              </div>
              <button
                onClick={() => navigate('/auth/login')}
                className="text-indigo-600 hover:text-indigo-500"
              >
                <ThemedText variant="accent">
                  {t('auth.requestNewLink')}
                </ThemedText>
              </button>
            </>
          ) : null}
        </div>
      </div>
    </ThemeProvider>
  );
}
