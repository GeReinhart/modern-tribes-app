import { useEffect, useState } from 'react';

const MQ = '(max-width: 768px)';

export const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(() => {
    const mobile = window.matchMedia(MQ).matches;
    if (mobile) console.log('Adapt design for phone');
    return mobile;
  });

  useEffect(() => {
    const mq = window.matchMedia(MQ);
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) console.log('Adapt design for phone');
      setIsMobile(e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return { isMobile };
};
