import { useEffect, useRef, useState, useCallback } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave<T>({ data, onSave, debounceMs = 800 }: {
  data: T;
  onSave: () => Promise<void>;
  debounceMs?: number;
}) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const initialLoad = useRef(true);
  const lastDataRef = useRef<string>('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const doSave = useCallback(async () => {
    setStatus('saving');
    try {
      await onSave();
      setStatus('saved');
      retryCountRef.current = 0;
      setTimeout(() => setStatus((s) => (s === 'saved' ? 'idle' : s)), 2000);
    } catch {
      setStatus('error');
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        setTimeout(() => doSave(), 2000 * retryCountRef.current);
      }
    }
  }, [onSave]);

  useEffect(() => {
    const serialized = JSON.stringify(data);
    if (serialized === lastDataRef.current) return;
    lastDataRef.current = serialized;

    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(doSave, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data, debounceMs, doSave]);

  return { status, setStatus };
}

export function SaveIndicator({ status }: { status: SaveStatus }) {
  const config = {
    idle: { text: '', color: 'text-gray-400', bg: 'bg-gray-50' },
    saving: { text: 'Enregistrement…', color: 'text-blue-600', bg: 'bg-blue-50' },
    saved: { text: 'Enregistré', color: 'text-green-600', bg: 'bg-green-50' },
    error: { text: 'Erreur de sauvegarde', color: 'text-red-600', bg: 'bg-red-50' },
  }[status];

  if (status === 'idle') return null;

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg ${config.color} ${config.bg}`}>
      {status === 'saving' && (
        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {status === 'saved' && (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
      {status === 'error' && (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {config.text}
    </span>
  );
}
