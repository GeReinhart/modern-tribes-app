import { applyCssVariables } from '@/app/platform/core/cssVariables.ts';

import { useEffect, useState } from 'react';

const ZOOM_KEY = 'app-zoom';
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.0;
const ZOOM_DEFAULT = 1.0;
const ZOOM_PHONE_DEFAULT = 1.5;

const detectPhone = (): boolean => {
  const { innerWidth, innerHeight } = window;
  return innerHeight > innerWidth && innerWidth < 700;
};

const loadZoom = (): number => {
  const stored = localStorage.getItem(ZOOM_KEY);
  if (!stored) return detectPhone() ? ZOOM_PHONE_DEFAULT : ZOOM_DEFAULT;
  const val = parseFloat(stored);
  return isNaN(val)
    ? ZOOM_DEFAULT
    : Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, val));
};

export const useResponsive = () => {
  const [isPhone, setIsPhone] = useState(detectPhone);
  const [zoom, setZoom] = useState(loadZoom);

  useEffect(() => {
    applyCssVariables(isPhone, zoom);
  }, [isPhone, zoom]);

  useEffect(() => {
    const handler = () => setIsPhone(detectPhone());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const updateZoom = (newZoom: number): void => {
    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, newZoom));
    localStorage.setItem(ZOOM_KEY, String(clamped));
    setZoom(clamped);
  };

  return { isPhone, isMobile: isPhone, zoom, updateZoom };
};
