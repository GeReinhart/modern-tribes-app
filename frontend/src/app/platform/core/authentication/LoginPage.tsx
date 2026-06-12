import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedSubmitButton } from '@/app/platform/core/layout/themes/components/ThemedSubmitButton.tsx';
import { ApplicationLogo } from '@/app/platform/core/layout/themes/icons/ApplicationLogo.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { ThemeProvider } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAuth } from './AuthContext.tsx';
import { authService } from './authentication-service.ts';

export default function LoginPage() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [error, setError] = useState('');

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await authService.sendMagicLink(email);
      setSentEmail(email);
      setSuccess(true);
      setEmail('');
    } catch (err: unknown) {
      const status = err instanceof Error ? (err as Error & { status?: number }).status : undefined;
      if (status === 404) {
        setError(t('auth.emailNotFound'));
      } else {
        setError(t('validation.errorOccurred'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemeProvider defaultTheme="default">
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8">
          <div>
            <ApplicationLogo />
            <ThemedText size="large">{t('auth.signIn')}</ThemedText>
            <ThemedText variant="secondary" size="medium">
              {t('auth.magicLinkHint')}
            </ThemedText>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {!success && (
              <ThemedInput
                label={t('auth.email')}
                variant="accent"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={handleEmailChange}
                type="email"
                required
              />
            )}

            {success && (
              <ThemedText variant="success" size="large">
                {t('auth.checkEmail', { email: sentEmail })}
              </ThemedText>
            )}

            {error && (
              <ThemedText variant="danger" size="large">
                {error}
              </ThemedText>
            )}

            {!success && (
              <ThemedSubmitButton
                variant="secondary"
                isLoading={isSubmitting}
                loadingText={t('auth.sending')}
                type="submit"
              >
                {t('auth.sendMagicLink')}
              </ThemedSubmitButton>
            )}
          </form>
        </div>
      </div>
    </ThemeProvider>
  );
}
