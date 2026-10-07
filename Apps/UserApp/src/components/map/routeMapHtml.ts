// A Leaflet + OpenStreetMap page for the transport route picker. It runs inside a WebView (or an
// iframe in the browser preview) and talks to the app with small JSON messages:
//   page -> app: { type: 'ready' } and { type: 'center', lat, lng } after the user drags the map
//   app -> page: { type: 'view', lat, lng, zoom? } and { type: 'points', source, destination }
// Only a user drag reports a new centre, so the app moving the map never moves a pin by itself.
export function routeMapHtml(center: { lat: number; lng: number }, zoom: number) {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: #F1EEE6; }
  .leaflet-control-attribution { font-size: 9px; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  function send(msg) {
    var s = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(s);
    else if (window.parent && window.parent !== window) window.parent.postMessage(s, '*');
  }
  var map = L.map('map', { zoomControl: true }).setView([${center.lat}, ${center.lng}], ${zoom});
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  map.on('dragend', function () {
    var c = map.getCenter();
    send({ type: 'center', lat: c.lat, lng: c.lng });
  });

  function dot(color, label) {
    return L.divIcon({
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      html: '<div style="width:24px;height:24px;border-radius:12px;background:' + color +
        ';border:2px solid #fff;color:#fff;font:bold 12px sans-serif;display:flex;align-items:center;' +
        'justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.35)">' + label + '</div>'
    });
  }

  var markers = {};
  var line = null;
  var STYLE = { source: ['#10B981', 'A'], destination: ['#F43F5E', 'B'] };

  function setPoints(points) {
    ['source', 'destination'].forEach(function (field) {
      var p = points[field];
      if (!p) {
        if (markers[field]) { map.removeLayer(markers[field]); delete markers[field]; }
        return;
      }
      if (markers[field]) markers[field].setLatLng([p.lat, p.lng]);
      else markers[field] = L.marker([p.lat, p.lng], { icon: dot(STYLE[field][0], STYLE[field][1]) }).addTo(map);
    });
    if (line) { map.removeLayer(line); line = null; }
    if (points.source && points.destination) {
      var path = [[points.source.lat, points.source.lng], [points.destination.lat, points.destination.lng]];
      line = L.polyline(path, { color: '#0B1C33', opacity: 0.7, weight: 3 }).addTo(map);
      map.fitBounds(path, { padding: [60, 60] });
    }
  }

  window.__cmd = function (cmd) {
    if (!cmd || !cmd.type) return;
    if (cmd.type === 'view') map.setView([cmd.lat, cmd.lng], cmd.zoom || map.getZoom());
    if (cmd.type === 'points') setPoints(cmd);
  };
  window.addEventListener('message', function (e) {
    try { window.__cmd(typeof e.data === 'string' ? JSON.parse(e.data) : e.data); } catch (err) {}
  });
  send({ type: 'ready' });
</script>
</body>
</html>`;
}
