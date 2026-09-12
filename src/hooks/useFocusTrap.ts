import { useEffect } from 'react';
import type { RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps Tab / Shift+Tab focus within `containerRef` while `active` is true,
 * and invokes `onEscape` when the Escape key is pressed.
 */
export const useFocusTrap = (
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  onEscape?: () => void
) => {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = (): HTMLElement[] =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );

    const focusable = getFocusable();
    if (focusable.length > 0 && !container.contains(document.activeElement)) {
      focusable[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape?.();
        return;
      }

      if (e.key !== 'Tab') return;

      const items = getFocusable();
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const activeElement = document.activeElement;

      if (e.shiftKey) {
        if (activeElement === first || !container.contains(activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (activeElement === last || !container.contains(activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
};
