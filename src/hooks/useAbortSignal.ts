import { useEffect, useRef } from "react";

/**
 * Returns an AbortSignal that automatically aborts when the component unmounts.
 * Pass the signal to axios requests via { signal } config to cancel in-flight
 * requests on unmount / navigation away.
 *
 * Usage:
 *   const getSignal = useAbortSignal();
 *   await api.get('/endpoint', { signal: getSignal() });
 */
export function useAbortSignal() {
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      // Abort any in-flight request when the component unmounts
      controllerRef.current?.abort();
    };
  }, []);

  /**
   * Returns a fresh AbortSignal. Call this before each request so that
   * each request gets its own controller. Previous request's controller
   * is aborted automatically (useful for re-fetches).
   */
  const getSignal = (): AbortSignal => {
    // Abort any previous in-flight request
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    return controllerRef.current.signal;
  };

  return getSignal;
}

export default useAbortSignal;
