import React, { useState } from 'react';
import {ApplicationLogo} from "@/components/common/icons/ApplicationLogo.tsx";
import { ThemedText} from '@/components/common/layout/ThemedText';
import {ThemeProvider} from "@/contexts/ThemeContext.tsx";
import {ThemedInput} from "@/components/common/form/ThemedInput.tsx";
import {ThemedSubmitButton} from "@/components/common/form/ThemedSubmitButton.tsx";
import {authService} from "@/services/auth.service.ts";

export default function LoginPage() {
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
            setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
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
                            Sign in to your account
                        </ThemedText>
                        <ThemedText variant="secondary"  size="medium">
                            We'll send you a magic link to sign in
                        </ThemedText>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        {!success && (
                            <ThemedInput
                                label="Email"
                                variant="accent"
                                placeholder="user@example.com"
                                value={email}
                                onChange={handleEmailChange}
                                type="email"
                                required
                            />
                        )}

                        {success && (
                            <ThemedText variant="success" size="large">
                                Check your email ({sentEmail}) for the sign-in link!
                            </ThemedText>
                        )}

                        {error && <ThemedText variant="danger" size="large">{error}</ThemedText>}

                        {!success && (
                            <ThemedSubmitButton
                                variant="secondary"
                                isLoading={isLoading}
                                loadingText="Sending..."
                                type="submit"
                            >
                                Send the magic link
                            </ThemedSubmitButton>
                        )}
                    </form>
                </div>
            </div>
        </ThemeProvider>
    );
}