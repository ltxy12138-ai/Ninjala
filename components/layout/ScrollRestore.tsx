"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

const SCROLL_RESTORE_PREFIX = "scroll-restore:";
const SCROLL_RESTORE_TTL_MS = 10_000;
const SECOND_RESTORE_DELAY_MS = 220;

type ScrollSnapshot = {
  y: number;
  timestamp: number;
};

function buildRouteKey(pathname: string, search: string) {
  return search ? `${pathname}?${search}` : pathname;
}

function buildScrollRestoreKey(routeKey: string) {
  return `${SCROLL_RESTORE_PREFIX}${routeKey}`;
}

function readScrollSnapshot(routeKey: string) {
  const raw = window.sessionStorage.getItem(buildScrollRestoreKey(routeKey));

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ScrollSnapshot;

    if (Date.now() - parsed.timestamp > SCROLL_RESTORE_TTL_MS) {
      window.sessionStorage.removeItem(buildScrollRestoreKey(routeKey));
      return null;
    }

    return parsed;
  } catch {
    window.sessionStorage.removeItem(buildScrollRestoreKey(routeKey));
    return null;
  }
}

function saveScrollPosition(routeKey: string) {
  window.sessionStorage.setItem(
    buildScrollRestoreKey(routeKey),
    JSON.stringify({
      y: window.scrollY,
      timestamp: Date.now(),
    } satisfies ScrollSnapshot),
  );
}

export function ScrollRestore() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const restoreTimeoutRef = useRef<number | null>(null);
  const routeKey = useMemo(
    () => buildRouteKey(pathname, searchParams.toString()),
    [pathname, searchParams],
  );

  useEffect(() => {
    function clearPendingRestore(removeSnapshot = false) {
      if (restoreTimeoutRef.current !== null) {
        window.clearTimeout(restoreTimeoutRef.current);
        restoreTimeoutRef.current = null;
      }

      if (removeSnapshot) {
        window.sessionStorage.removeItem(buildScrollRestoreKey(routeKey));
      }
    }

    function runRestore(targetRouteKey: string, clearAfterRestore: boolean) {
      const snapshot = readScrollSnapshot(targetRouteKey);

      if (!snapshot) {
        return;
      }

      window.scrollTo({
        top: snapshot.y,
        behavior: "auto",
      });

      if (clearAfterRestore) {
        window.sessionStorage.removeItem(buildScrollRestoreKey(targetRouteKey));
      }
    }

    function queueRestore(targetRouteKey: string) {
      clearPendingRestore();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          runRestore(targetRouteKey, false);
        });
      });

      restoreTimeoutRef.current = window.setTimeout(() => {
        runRestore(targetRouteKey, true);
        restoreTimeoutRef.current = null;
      }, SECOND_RESTORE_DELAY_MS);
    }

    function handleSubmit() {
      saveScrollPosition(routeKey);
      queueRestore(routeKey);
    }

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");

      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      const nextUrl = new URL(anchor.href, window.location.href);

      if (nextUrl.origin !== window.location.origin) {
        return;
      }

      if (nextUrl.pathname !== pathname) {
        return;
      }

      const nextRouteKey = buildRouteKey(
        nextUrl.pathname,
        nextUrl.searchParams.toString(),
      );

      saveScrollPosition(nextRouteKey);
      queueRestore(nextRouteKey);
    }

    function handleUserScrollIntent() {
      clearPendingRestore(true);
    }

    document.addEventListener("submit", handleSubmit, true);
    document.addEventListener("click", handleClick, true);
    window.addEventListener("wheel", handleUserScrollIntent, { passive: true });
    window.addEventListener("touchmove", handleUserScrollIntent, { passive: true });
    queueRestore(routeKey);

    return () => {
      document.removeEventListener("submit", handleSubmit, true);
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("wheel", handleUserScrollIntent);
      window.removeEventListener("touchmove", handleUserScrollIntent);
      clearPendingRestore();
    };
  }, [pathname, routeKey]);

  return null;
}
