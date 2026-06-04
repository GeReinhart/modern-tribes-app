import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAInstallState {
  isStandalone: boolean;
  isIOS: boolean;
  isInSafari: boolean;
  isAndroid: boolean;
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
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function detectInSafari(isIOS: boolean): boolean {
  if (!isIOS) return false;
  const ua = navigator.userAgent;
  return /safari/i.test(ua) && !/crios|fxios|opios|mercury/i.test(ua);
}

function detectAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

export function usePWAInstall(): PWAInstallState {
  const [isStandalone] = useState(detectStandalone);
  const [isIOS] = useState(detectIOS);
  const [isInSafari] = useState(() => detectInSafari(detectIOS()));
  const [isAndroid] = useState(detectAndroid);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

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
    isInSafari,
    isAndroid,
    canPrompt: !!deferredPrompt,
    install,
  };
}
