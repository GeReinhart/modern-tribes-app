import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallState {
    isStandalone: boolean;
    isIOS: boolean;
    canPrompt: boolean;
    install: () => Promise<void>;
}

function detectStandalone(): boolean {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
}

function detectIOS(): boolean {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function usePWAInstall(): PWAInstallState {
    const [isStandalone] = useState(detectStandalone);
    const [isIOS] = useState(detectIOS);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        if (isStandalone) return;

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('appinstalled', () => setDeferredPrompt(null));

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, [isStandalone]);

    const install = async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setDeferredPrompt(null);
    };

    return {
        isStandalone,
        isIOS,
        canPrompt: !!deferredPrompt,
        install,
    };
}
