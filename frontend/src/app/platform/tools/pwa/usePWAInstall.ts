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
  isAndroidInAppBrowser: boolean;
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

// Android in-app browsers (Gmail, Outlook, FB, etc.) use a WebView and never fire
// beforeinstallprompt. Chrome on Android includes "Chrome/" but not "wv".
function detectAndroidInAppBrowser(): boolean {
  const ua = navigator.userAgent;
  if (!/android/i.test(ua)) return false;
  return /wv|FBAN|FBAV|Instagram|Snapchat|Twitter|Line|MicroMessenger/i.test(ua) ||
    (!/chrome/i.test(ua) && !/firefox/i.test(ua) && !/samsungbrowser/i.test(ua));
}

export function usePWAInstall(): PWAInstallState {
  const [isStandalone] = useState(detectStandalone);
  const [isIOS] = useState(detectIOS);
  const [isInSafari] = useState(() => detectInSafari(detectIOS()));
  const [isAndroid] = useState(detectAndroid);
  const [isAndroidInAppBrowser] = useState(detectAndroidInAppBrowser);
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
    isAndroidInAppBrowser,
    canPrompt: !!deferredPrompt,
    install,
  };
}
