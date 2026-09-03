import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const MetaPixelTracker = () => {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Fire PageView on SPA client-side route transitions
    if (isFirstRender.current) {
      isFirstRender.current = false;
      console.log('[Meta Pixel] Initial load initialized with ID: 1966228154021969');
      return;
    }

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
      console.log('[Meta Pixel] PageView tracked for route:', location.pathname);
    }
  }, [location]);

  return null;
};

export default MetaPixelTracker;
