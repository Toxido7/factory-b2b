import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

export default function RouteFocus() {
  const { pathname } = useLocation();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    document.getElementById('main')?.focus({ preventScroll: true });
  }, [pathname]);

  return null;
}
