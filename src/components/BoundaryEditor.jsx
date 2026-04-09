import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, X, Undo2, Trash2 } from 'lucide-react';

const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_ATTR = 'Tiles © Esri &mdash; Esri, DeLorme, NAVTEQ';

/* ── helpers ── */
function polygonCentroid(points) {
  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;
  return { lat, lng };
}

export function BoundaryEditor({ current, defaultCenter, onSave, onClose }) {
  const initMode = current?.type === 'polygon' ? 'polygon' : 'circle';
  const [mode, setMode]     = useState(initMode);

  // Resolve starting centre: existing boundary → farm profile → hardcoded fallback
  const startLat = current?.lat ?? defaultCenter?.lat ?? -33.7300;
  const startLng = current?.lng ?? defaultCenter?.lng ?? 19.0100;

  // Circle state
  const [lat,    setLat]    = useState(startLat);
  const [lng,    setLng]    = useState(startLng);
  const [radius, setRadius] = useState(current?.radius ?? 450);

  // Polygon state
  const [points, setPoints] = useState(
    current?.type === 'polygon' ? current.points : []
  );

  // Map refs
  const containerRef      = useRef(null);
  const mapRef            = useRef(null);
  const centreMarkerRef   = useRef(null);
  const circleRef         = useRef(null);
  const geofenceLayerRef  = useRef(null);   // polygon or polyline
  const vertexMarkersRef  = useRef([]);

  // Stable refs (avoid re-init)
  const modeRef   = useRef(mode);
  const latRef    = useRef(lat);
  const lngRef    = useRef(lng);
  const radiusRef = useRef(radius);
  useEffect(() => { modeRef.current   = mode;   }, [mode]);
  useEffect(() => { latRef.current    = lat;    }, [lat]);
  useEffect(() => { lngRef.current    = lng;    }, [lng]);
  useEffect(() => { radiusRef.current = radius; }, [radius]);

  /* ── Init map once ── */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true });
    mapRef.current = map;
    L.tileLayer(SATELLITE_URL, { attribution: SATELLITE_ATTR }).addTo(map);

    map.on('click', (e) => {
      const { lat: la, lng: ln } = e.latlng;
      if (modeRef.current === 'polygon') {
        setPoints(prev => [...prev, {
          lat: parseFloat(la.toFixed(6)),
          lng: parseFloat(ln.toFixed(6)),
        }]);
      } else {
        // circle: move centre
        setLat(parseFloat(la.toFixed(6)));
        setLng(parseFloat(ln.toFixed(6)));
        if (centreMarkerRef.current) centreMarkerRef.current.setLatLng([la, ln]);
        if (circleRef.current)       circleRef.current.setLatLng([la, ln]);
      }
    });

    map.setView([latRef.current, lngRef.current], 15);
    return () => { map.remove(); mapRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Circle mode layers ── */
  useEffect(() => {
    if (!mapRef.current) return;

    if (mode === 'circle') {
      // clear polygon layers
      if (geofenceLayerRef.current) { geofenceLayerRef.current.remove(); geofenceLayerRef.current = null; }
      vertexMarkersRef.current.forEach(m => m.remove());
      vertexMarkersRef.current = [];

      if (!centreMarkerRef.current) {
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:22px;height:22px;border-radius:50%;background:#16a34a;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.4);cursor:grab"></div>`,
          iconSize: [22, 22], iconAnchor: [11, 11],
        });
        const marker = L.marker([latRef.current, lngRef.current], { icon, draggable: true }).addTo(mapRef.current);
        marker.on('dragend', (e) => {
          const { lat: la, lng: ln } = e.target.getLatLng();
          setLat(parseFloat(la.toFixed(6)));
          setLng(parseFloat(ln.toFixed(6)));
          if (circleRef.current) circleRef.current.setLatLng([la, ln]);
        });
        centreMarkerRef.current = marker;
      }
      if (!circleRef.current) {
        circleRef.current = L.circle([latRef.current, lngRef.current], {
          radius: radiusRef.current,
          color: '#16a34a', fillColor: '#16a34a', fillOpacity: 0.08,
          dashArray: '10 6', weight: 2.5,
        }).addTo(mapRef.current);
      }
    } else {
      // clear circle layers
      if (centreMarkerRef.current) { centreMarkerRef.current.remove(); centreMarkerRef.current = null; }
      if (circleRef.current)       { circleRef.current.remove();       circleRef.current = null; }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  /* ── Circle radius live-update ── */
  useEffect(() => {
    if (circleRef.current) circleRef.current.setRadius(radius);
  }, [radius]);

  /* ── Circle lat/lng live-update from number inputs ── */
  useEffect(() => {
    if (!centreMarkerRef.current || !circleRef.current) return;
    centreMarkerRef.current.setLatLng([lat, lng]);
    circleRef.current.setLatLng([lat, lng]);
  }, [lat, lng]);

  /* ── Polygon layers ── */
  useEffect(() => {
    if (!mapRef.current || mode !== 'polygon') return;

    // Remove old layers
    if (geofenceLayerRef.current) { geofenceLayerRef.current.remove(); geofenceLayerRef.current = null; }
    vertexMarkersRef.current.forEach(m => m.remove());
    vertexMarkersRef.current = [];

    if (points.length === 0) return;

    const latlngs = points.map(p => [p.lat, p.lng]);

    // Vertex markers
    vertexMarkersRef.current = points.map((p, i) => {
      const isFirst = i === 0;
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:${isFirst ? 16 : 12}px;height:${isFirst ? 16 : 12}px;border-radius:50%;background:${isFirst ? '#15803d' : '#16a34a'};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`,
        iconSize: [isFirst ? 16 : 12, isFirst ? 16 : 12],
        iconAnchor: [isFirst ? 8 : 6, isFirst ? 8 : 6],
      });
      return L.marker([p.lat, p.lng], { icon }).addTo(mapRef.current);
    });

    if (points.length >= 3) {
      geofenceLayerRef.current = L.polygon(latlngs, {
        color: '#16a34a', fillColor: '#16a34a', fillOpacity: 0.1,
        dashArray: '8 5', weight: 2.5,
      }).addTo(mapRef.current);
    } else {
      geofenceLayerRef.current = L.polyline(latlngs, {
        color: '#16a34a', weight: 2.5, dashArray: '8 5',
      }).addTo(mapRef.current);
    }
  }, [points, mode]);

  /* ── Handlers ── */
  const switchMode = (m) => {
    setMode(m);
    if (m === 'polygon') setPoints([]);
  };

  const handleSave = () => {
    if (mode === 'circle') {
      onSave({ type: 'circle', lat, lng, radius });
    } else {
      if (points.length < 3) return;
      onSave({ type: 'polygon', points });
    }
    onClose();
  };

  const canSave = mode === 'circle' || points.length >= 3;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999, background: 'rgba(15,23,42,.55)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col"
        style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,.2)', maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(34,197,94,.15)', border: '1px solid rgba(34,197,94,.3)' }}>
              <LocateFixed size={16} color="#22c55e" />
            </div>
            <div>
              <div className="text-white font-extrabold text-base">Set Farm Boundary</div>
              <div className="text-slate-400 text-xs mt-0.5">
                {mode === 'circle'
                  ? 'Click map to move centre · drag the pin · adjust radius below'
                  : 'Click the map to place vertices · need at least 3 points'}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 px-6 pt-4 flex-shrink-0">
          {[
            { id: 'circle',  label: '⬤  Circle',  hint: 'Centre + radius' },
            { id: 'polygon', label: '⬡  Polygon', hint: 'Draw any shape' },
          ].map(m => (
            <button key={m.id} onClick={() => switchMode(m.id)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border-2"
              style={mode === m.id
                ? { background: '#f0fdf4', borderColor: '#16a34a', color: '#15803d' }
                : { background: '#f8fafc', borderColor: '#e2e8f0', color: '#64748b' }}>
              {m.label}
              <span className="block text-[10px] font-normal mt-0.5 opacity-70">{m.hint}</span>
            </button>
          ))}
        </div>

        {/* Map */}
        <div ref={containerRef} style={{ height: 340, flexShrink: 0 }} className="mt-3" />

        {/* Controls */}
        <div className="px-6 py-4 flex flex-col gap-3 flex-shrink-0 border-t border-slate-100">

          {mode === 'circle' ? (
            <>
              {/* Radius slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-600">Geofence Radius</label>
                  <span className="text-sm font-extrabold text-green-700 tabular-nums">
                    {radius >= 1000 ? `${(radius / 1000).toFixed(2)} km` : `${radius} m`}
                  </span>
                </div>
                <input type="range" min={100} max={5000} step={50} value={radius}
                  onChange={e => setRadius(Number(e.target.value))}
                  className="w-full accent-green-600" />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>100 m</span><span>1 km</span><span>2 km</span><span>3 km</span><span>5 km</span>
                </div>
              </div>
              {/* Lat/lng inputs */}
              <div className="grid grid-cols-2 gap-3">
                {[['Latitude', lat, setLat], ['Longitude', lng, setLng]].map(([label, val, setter]) => (
                  <div key={label}>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">{label}</label>
                    <input type="number" step="0.000001" value={val}
                      onChange={e => {
                        const n = parseFloat(e.target.value);
                        if (!isNaN(n)) setter(n);
                      }}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Polygon controls */
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-700">
                {points.length === 0 && <span className="text-slate-400">Click the map to start drawing…</span>}
                {points.length === 1 && <span className="text-amber-600">1 point — need 2 more to close</span>}
                {points.length === 2 && <span className="text-amber-600">2 points — need 1 more to close</span>}
                {points.length >= 3 && (
                  <span className="text-green-700">
                    ✓ {points.length} vertices — polygon ready
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={points.length === 0}
                  onClick={() => setPoints(p => p.slice(0, -1))}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all disabled:opacity-40"
                  style={{ borderColor: '#e2e8f0', color: '#475569' }}>
                  <Undo2 size={13} /> Undo
                </button>
                <button
                  disabled={points.length === 0}
                  onClick={() => setPoints([])}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all disabled:opacity-40"
                  style={{ borderColor: '#fca5a5', color: '#dc2626', background: '#fff5f5' }}>
                  <Trash2 size={13} /> Clear
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button onClick={handleSave} disabled={!canSave}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
              Save Boundary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
