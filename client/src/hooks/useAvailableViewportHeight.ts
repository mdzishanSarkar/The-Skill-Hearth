import { useLayoutEffect, useRef, useState } from 'react';

export function useAvailableViewportHeight<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [height, setHeight] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 0,
  );

  useLayoutEffect(() => {
    const measure = () => {
      const el = ref.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      setHeight(Math.max(0, Math.round(window.innerHeight - top)));
    };
    window.scrollTo(0, 0);
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, []);

  return { ref, height };
}