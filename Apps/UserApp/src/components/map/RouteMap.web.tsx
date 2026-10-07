// Browser preview: react-native-webview has no web build, so the same map page runs in an iframe.
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { routeMapHtml } from './routeMapHtml';
import type { MapPoint, RouteMapHandle, RouteMapProps } from './types';

const Frame: any = 'iframe';
const browser = globalThis as any;
const frameStyle = { border: 0, width: '100%', height: '100%' };

export const RouteMap = forwardRef<RouteMapHandle, RouteMapProps>(function RouteMapView(
  { initialCenter, initialZoom, source, destination, onCenterChange, onReady, style },
  ref,
) {
  const frameRef = useRef<any>(null);
  const ready = useRef(false);
  const latest = useRef({ source, destination, onCenterChange, onReady });
  latest.current = { source, destination, onCenterChange, onReady };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => routeMapHtml(initialCenter, initialZoom), []);

  const send = (cmd: object) => {
    if (ready.current) frameRef.current?.contentWindow?.postMessage(JSON.stringify(cmd), '*');
  };

  useImperativeHandle(ref, () => ({
    panTo: (p: MapPoint, zoom?: number) => send({ type: 'view', lat: p.lat, lng: p.lng, zoom }),
  }));

  useEffect(() => {
    send({ type: 'points', source, destination });
  }, [source?.lat, source?.lng, destination?.lat, destination?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onMessage = (e: any) => {
      if (e.source !== frameRef.current?.contentWindow) return;
      let msg: any;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      if (msg.type === 'ready') {
        ready.current = true;
        send({ type: 'points', source: latest.current.source, destination: latest.current.destination });
        latest.current.onReady?.();
      } else if (msg.type === 'center') {
        latest.current.onCenterChange({ lat: msg.lat, lng: msg.lng });
      }
    };
    browser.addEventListener('message', onMessage);
    return () => browser.removeEventListener('message', onMessage);
  }, []);

  return (
    <View style={style}>
      <Frame ref={frameRef} srcDoc={html} title="Route map" style={frameStyle} />
    </View>
  );
});
