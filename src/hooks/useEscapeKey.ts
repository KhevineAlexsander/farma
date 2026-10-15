import { useEffect, useRef } from 'react';

/** Calls `onEscape` when Escape is pressed while `active` is true (modals, drawers). */
export function useEscapeKey(active: boolean, onEscape: () => void) {
  const handlerRef = useRef(onEscape);
  handlerRef.current = onEscape;

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handlerRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active]);
}
