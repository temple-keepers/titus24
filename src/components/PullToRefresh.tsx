import { useEffect, useRef, useState, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Mobile pull-to-refresh wrapper. Detects a downward pull when the page is
 * already scrolled to the top, shows a small indicator, and calls onRefresh
 * once the user releases past the threshold.
 *
 * No-op on desktop / non-touch devices — mouse drag never engages.
 */
const THRESHOLD = 70; // px to pull before a release triggers refresh
const MAX_PULL = 110; // visual cap

export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
}) {
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    function isAtTop() {
      // Use the document scroller — the app's main scroll surface lives at
      // window-level, not on a nested div.
      return (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
    }

    function onTouchStart(e: TouchEvent) {
      if (refreshing) return;
      if (!isAtTop()) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
    }

    function onTouchMove(e: TouchEvent) {
      if (refreshing || startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        setPull(0);
        return;
      }
      // Damp the pull so it feels rubbery.
      const damped = Math.min(MAX_PULL, dy * 0.5);
      setPull(damped);
    }

    async function onTouchEnd() {
      if (startY.current === null) return;
      const triggered = pull >= THRESHOLD && !refreshing;
      startY.current = null;
      if (triggered) {
        setRefreshing(true);
        setPull(THRESHOLD); // hold at threshold while refreshing
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          setPull(0);
        }
      } else {
        setPull(0);
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [pull, refreshing, onRefresh]);

  const progress = Math.min(1, pull / THRESHOLD);
  const visible = pull > 4 || refreshing;

  return (
    <>
      {visible && (
        <div
          className="pointer-events-none fixed left-0 right-0 top-0 z-30 flex justify-center"
          style={{
            transform: `translateY(${Math.max(0, pull - 24)}px)`,
            transition: refreshing ? 'transform 0.15s ease-out' : 'none',
          }}
        >
          <div
            className="mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-surface shadow-soft border border-app"
            style={{ opacity: refreshing ? 1 : progress }}
          >
            <RefreshCw
              size={16}
              className={refreshing ? 'animate-spin text-brand-600' : 'text-brand-500'}
              style={{
                transform: refreshing ? undefined : `rotate(${progress * 270}deg)`,
                transition: refreshing ? undefined : 'transform 0.05s linear',
              }}
            />
          </div>
        </div>
      )}
      <div
        style={{
          transform: pull ? `translateY(${pull * 0.4}px)` : undefined,
          transition: refreshing || pull === 0 ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </>
  );
}
