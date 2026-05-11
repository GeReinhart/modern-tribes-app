import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {ApplicationLogo} from "@/components/common/icons/ApplicationLogo.tsx";
import { ThemedText} from '@/components/common/layout/ThemedText';
import {ThemeProvider} from "@/contexts/ThemeContext.tsx";
import {ThemedInput} from "@/components/common/form/ThemedInput.tsx";
import {ThemedSubmitButton} from "@/components/common/form/ThemedSubmitButton.tsx";
import {authService} from "@/services/auth.service.ts";

export default function LoginPage() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [sentEmail, setSentEmail] = useState('');
    const [error, setError] = useState('');

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await authService.sendMagicLink(email);
            setSentEmail(email);
            setSuccess(true);
            setEmail('');
        } catch (err) {
            setError(err instanceof Error ? err.message : t('validation.errorOccurred'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ThemeProvider defaultTheme="default">
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <ApplicationLogo />
                        <ThemedText size="large">
                            {t('auth.signIn')}
                        </ThemedText>
                        <ThemedText variant="secondary"  size="medium">
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

                        {error && <ThemedText variant="danger" size="large">{error}</ThemedText>}

                        {!success && (
                            <ThemedSubmitButton
                                variant="secondary"
                                isLoading={isLoading}
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
