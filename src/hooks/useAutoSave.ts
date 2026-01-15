import { useRef, useCallback } from 'react';

export function useAutoSave<T>(
  saveFn: (data: T) => Promise<void>,
  delay: number = 500
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<T | null>(null);

  const save = useCallback(
    (data: T) => {
      pendingDataRef.current = data;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        if (pendingDataRef.current !== null) {
          try {
            await saveFn(pendingDataRef.current);
          } catch (error) {
            console.error('Auto-save failed:', error);
          }
        }
      }, delay);
    },
    [saveFn, delay]
  );

  const flush = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pendingDataRef.current !== null) {
      try {
        await saveFn(pendingDataRef.current);
        pendingDataRef.current = null;
      } catch (error) {
        console.error('Flush save failed:', error);
      }
    }
  }, [saveFn]);

  return { save, flush };
}
