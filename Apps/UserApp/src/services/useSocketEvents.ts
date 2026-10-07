import { useEffect, useRef } from 'react';
import { getSocket } from './socket';

type Handlers = Record<string, (payload: any) => void>;

// Subscribes to socket events for the lifetime of the component. Handlers may change between
// renders without resubscribing; only the set of event names matters.
export function useSocketEvents(handlers: Handlers) {
  const ref = useRef(handlers);
  ref.current = handlers;
  const events = Object.keys(handlers).sort().join('|');

  useEffect(() => {
    let cancelled = false;
    const names = events.split('|').filter(Boolean);
    const listeners = names.map(name => [name, (p: any) => ref.current[name]?.(p)] as const);
    let cleanup = () => {};

    getSocket().then(socket => {
      if (cancelled) return;
      listeners.forEach(([name, fn]) => socket.on(name, fn));
      cleanup = () => listeners.forEach(([name, fn]) => socket.off(name, fn));
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [events]);
}
