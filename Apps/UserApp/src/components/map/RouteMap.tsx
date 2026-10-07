import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { routeMapHtml } from './routeMapHtml';
import type { MapPoint, RouteMapHandle, RouteMapProps } from './types';

// Tiles load over the network; this base url is the page origin OpenStreetMap sees as the referrer.
const BASE_URL = 'https://ashwaindia.com';

export const RouteMap = forwardRef<RouteMapHandle, RouteMapProps>(function RouteMapView(
  { initialCenter, initialZoom, source, destination, onCenterChange, onReady, onTouchActive, style },
  ref,
) {
  // react-native-webview's class typings don't accept a React 19 ref object; only injectJavaScript is used.
  const webRef = useRef<any>(null);
  const ready = useRef(false);
  const latest = useRef({ source, destination, onCenterChange, onReady });
  latest.current = { source, destination, onCenterChange, onReady };

  // Built once: later moves go through commands so the map keeps its zoom and position.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => routeMapHtml(initialCenter, initialZoom), []);

  const send = (cmd: object) => {
    if (ready.current) webRef.current?.injectJavaScript(`window.__cmd(${JSON.stringify(cmd)}); true;`);
  };

  useImperativeHandle(ref, () => ({
    panTo: (p: MapPoint, zoom?: number) => send({ type: 'view', lat: p.lat, lng: p.lng, zoom }),
  }));

  useEffect(() => {
    send({ type: 'points', source, destination });
  }, [source?.lat, source?.lng, destination?.lat, destination?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const onMessage = (e: WebViewMessageEvent) => {
    let msg: any;
    try {
      msg = JSON.parse(e.nativeEvent.data);
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

  return (
    <View
      style={style}
      onTouchStart={() => onTouchActive?.(true)}
      onTouchEnd={() => onTouchActive?.(false)}
      onTouchCancel={() => onTouchActive?.(false)}>
      <WebView
        ref={webRef}
        source={{ html, baseUrl: BASE_URL }}
        originWhitelist={['*']}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        nestedScrollEnabled
        scrollEnabled={false}
        setSupportMultipleWindows={false}
        style={styles.web}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: '#F1EEE6' },
});
