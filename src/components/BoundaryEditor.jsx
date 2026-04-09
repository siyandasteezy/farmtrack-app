import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, X } from 'lucide-react';

const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_ATTR = 'Tiles © Esri &mdash; Esri, DeLorme, NAVTEQ';

export function BoundaryEditor({ current, onSave, onClose }) {
  const containerRef    = useRef(null);
  const mapRef          = useRef(null);
  const centreMarkerRef = useRef(null);
  const circleRef       = useRef(null);

  const [lat,    setLat]    = useState(current.lat);
  const [lng,    setLng]    = useState(current.lng);
  const [radius, setRadius] = useState(current.radius);

  const latRef    = useRef(lat);
  const lngRef    = useRef(lng);
  const radiusRef = useRef(radius);
  useEffect(() => { latRef.current = lat; }, [lat]);
  useEffect(() => { lngRef.current = lng; }, [lng]);
  useEffect(() => { radiusRef.current = radius; }, [radius]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true });
    mapRef.current = map;

    L.tileLayer(SATELLITE_URL, { attribution: SATELLITE_ATTR }).addTo(map);

    const centreIcon = L.divIcon({
      className: '',
      html: `<div style="width:22px;height:22px;border-radius:50%;background:#16a34a;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.4);cursor:grab"></div>`,
      iconSize: [22, 22], iconAnchor: [11, 11],
    });
    const marker = L.marker([latRef.current, lngRef.current], { icon: centreIcon, draggable: true }).addTo(map);
    marker.on('dragend', (e) => {
      const { lat: la, lng: ln } = e.target.getLatLng();
      setLat(parseFloat(la.toFixed(6)));
      setLng(parseFloat(ln.toFixed(6)));
      if (circleRef.current) circleRef.current.setLatLng([la, ln]);
    });
    centreMarkerRef.current = marker;

    circleRef.current = L.circle([latRef.current, lngRef.current], {
      radius: radiusRef.current,
      color: '#16a34a', fillColor: '#16a34a', fillOpacity: 0.08,
      dashArray: '10 6', weight: 2.5,
    }).addTo(map);

    map.on('click', (e) => {
      const { lat: la, lng: ln } = e.latlng;
      setLat(parseFloat(la.toFixed(6)));
      setLng(parseFloat(ln.toFixed(6)));
      marker.setLatLng([la, ln]);
      if (circleRef.current) circleRef.current.setLatLng([la, ln]);
    });

    map.setView([latRef.current, lngRef.current], 15);
    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (circleRef.current) circleRef.current.setRadius(radius);
  }, [radius]);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999, background: 'rgba(15,23,42,.55)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col"
        style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,.2)', maxHeight: '90vh' }}>

        <div className="flex items-center justify-between px-6 py-5 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(34,197,94,.15)', border: '1px solid rgba(34,197,94,.3)' }}>
              <LocateFixed size={16} color="#22c55e" />
            </div>
            <div>
              <div className="text-white font-extrabold text-base">Set Farm Boundary</div>
              <div className="text-slate-400 text-xs mt-0.5">Click the map to move the centre · drag the green pin · adjust radius below</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div ref={containerRef} style={{ height: 380, flexShrink: 0 }} />

        <div className="px-6 py-5 flex flex-col gap-4 flex-shrink-0 border-t border-slate-100">
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

          <div className="grid grid-cols-2 gap-3">
            {[['Latitude', lat, setLat], ['Longitude', lng, setLng]].map(([label, val, setter]) => (
              <div key={label}>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">{label}</label>
                <input type="number" step="0.000001" value={val}
                  onChange={e => {
                    const n = parseFloat(e.target.value);
                    if (isNaN(n)) return;
                    setter(n);
                    if (mapRef.current && centreMarkerRef.current) {
                      const newLat = label === 'Latitude' ? n : latRef.current;
                      const newLng = label === 'Longitude' ? n : lngRef.current;
                      centreMarkerRef.current.setLatLng([newLat, newLng]);
                      if (circleRef.current) circleRef.current.setLatLng([newLat, newLng]);
                      mapRef.current.panTo([newLat, newLng]);
                    }
                  }}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button onClick={() => { onSave({ lat, lng, radius }); onClose(); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all"
              style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
              Save Boundary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
