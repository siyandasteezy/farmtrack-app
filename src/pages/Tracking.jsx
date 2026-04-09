import { useState, useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useData } from '../context/DataContext';
import {
  MapPin, List, Battery, BatteryLow, Wifi, Clock, X,
  AlertTriangle, Satellite, Map, Navigation,
} from 'lucide-react';
import clsx from 'clsx';

/* ── Farm Config ────────────────────────────────────────────────────── */

const TILE_LAYERS = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri &mdash; Esri, DeLorme, NAVTEQ',
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
};

/* ── Species helpers ────────────────────────────────────────────────── */

const SPECIES_MARKER = {
  Cattle:  { bg:'#16a34a', ring:'#dcfce7' },
  Sheep:   { bg:'#3b82f6', ring:'#dbeafe' },
  Goat:    { bg:'#eab308', ring:'#fef9c3' },
  Pig:     { bg:'#ec4899', ring:'#fce7f3' },
  Horse:   { bg:'#a855f7', ring:'#f3e8ff' },
  Poultry: { bg:'#f97316', ring:'#ffedd5' },
  Rabbit:  { bg:'#78716c', ring:'#f5f5f4' },
  Alpaca:  { bg:'#d946ef', ring:'#fdf4ff' },
  Duck:    { bg:'#06b6d4', ring:'#cffafe' },
  Deer:    { bg:'#f59e0b', ring:'#fef3c7' },
  Bee:     { bg:'#ca8a04', ring:'#fefce8' },
};

const SPECIES_META = {
  Cattle:'🐄', Sheep:'🐑', Goat:'🐐', Pig:'🐷', Horse:'🐴',
  Poultry:'🐔', Rabbit:'🐇', Alpaca:'🦙', Duck:'🦆', Deer:'🦌', Bee:'🐝',
};

const STATUS_STYLE = {
  Healthy:    { bg:'#f0fdf4', border:'#bbf7d0', text:'#16a34a' },
  Pregnant:   { bg:'#eff6ff', border:'#bfdbfe', text:'#2563eb' },
  Treatment:  { bg:'#fff7ed', border:'#fed7aa', text:'#c2410c' },
  Quarantine: { bg:'#fef2f2', border:'#fecaca', text:'#dc2626' },
  Sick:       { bg:'#fef2f2', border:'#fecaca', text:'#dc2626' },
  Sold:       { bg:'#f1f5f9', border:'#cbd5e1', text:'#64748b' },
};

/* ── Geo helpers ────────────────────────────────────────────────────── */

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pointInPolygon(lat, lng, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].lng, yi = points[i].lat;
    const xj = points[j].lng, yj = points[j].lat;
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

function boundaryCenter(b) {
  if (b?.type === 'polygon' && b.points?.length > 0) {
    const lat = b.points.reduce((s, p) => s + p.lat, 0) / b.points.length;
    const lng = b.points.reduce((s, p) => s + p.lng, 0) / b.points.length;
    return [lat, lng];
  }
  return [b?.lat ?? -33.73, b?.lng ?? 19.01];
}

function outsideFarm(trk, boundary) {
  if (!trk?.lat || !trk?.lng || !boundary) return false;
  if (boundary.type === 'polygon') {
    if (!boundary.points || boundary.points.length < 3) return false;
    return !pointInPolygon(trk.lat, trk.lng, boundary.points);
  }
  return haversine(boundary.lat ?? -33.73, boundary.lng ?? 19.01, trk.lat, trk.lng) > (boundary.radius ?? 450);
}

function formatDist(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

/* ── Shared helpers ─────────────────────────────────────────────────── */

function relativeTime(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function BatteryBadge({ pct }) {
  const color = pct > 50 ? '#16a34a' : pct > 20 ? '#f59e0b' : '#ef4444';
  const bg    = pct > 50 ? '#f0fdf4' : pct > 20 ? '#fffbeb' : '#fff5f5';
  const Icon  = pct < 20 ? BatteryLow : Battery;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg"
      style={{ background: bg, color, border: `1px solid ${color}33` }}>
      <Icon size={11} /> {pct}%
    </span>
  );
}

/* ── Detail Panel ───────────────────────────────────────────────────── */

function DetailPanel({ animal, healthRecords, distFromCenter, isOutside, onClose }) {
  const st  = STATUS_STYLE[animal.status] || STATUS_STYLE.Healthy;
  const mk  = SPECIES_MARKER[animal.species] || SPECIES_MARKER.Cattle;
  const trk = animal.tracker;
  const isOut = isOutside ?? false;
  const lastHealth = healthRecords
    .filter(h => h.animalTag === animal.tag || h.animalId === animal.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  return (
    <div className="flex flex-col h-full" style={{ background: '#fff' }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex-shrink-0"
        style={{ background: isOut ? 'linear-gradient(135deg,#fff5f5,#fef2f2)' : `linear-gradient(135deg,${mk.ring},#fff)`, borderBottom: '1px solid #f1f5f9' }}>
        {isOut && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3 text-xs font-bold"
            style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }}>
            <AlertTriangle size={13} /> OUTSIDE FARM BOUNDARY — {formatDist(distFromCenter)} from centre
          </div>
        )}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: isOut ? '#fef2f2' : mk.ring, border: `2px solid ${isOut ? '#fca5a5' : mk.bg + '33'}` }}>
              {SPECIES_META[animal.species] || '🐾'}
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 leading-tight">{animal.name}</h3>
              <div className="text-xs text-slate-500 mt-0.5 font-mono font-bold">{animal.tag}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl"
          style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: st.text }} />
          {animal.status}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {/* Tracker */}
        {trk ? (
          <div className="rounded-2xl p-4" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
            <div className="flex items-center gap-2 mb-3">
              <Wifi size={13} color={isOut ? '#f87171' : '#22c55e'} />
              <span className={clsx('text-xs font-bold uppercase tracking-wider', isOut ? 'text-red-400' : 'text-green-400')}>
                {isOut ? '⚠ Outside Farm' : 'Live Tracker'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div><div className="text-slate-500 mb-0.5">Device</div><div className="font-mono font-bold text-white">{trk.deviceId || 'Manual GPS'}</div></div>
              <div><div className="text-slate-500 mb-0.5">Battery</div><BatteryBadge pct={trk.battery} /></div>
              <div><div className="text-slate-500 mb-0.5">Last seen</div><div className="font-semibold text-slate-300 flex items-center gap-1.5"><Clock size={11} className="text-slate-500" />{relativeTime(trk.lastSeen)}</div></div>
              {trk.lat && trk.lng && (
                <div><div className="text-slate-500 mb-0.5">Coordinates</div><div className="font-mono text-[10px] text-slate-300">{trk.lat.toFixed(5)}, {trk.lng.toFixed(5)}</div></div>
              )}
              {distFromCenter != null && (
                <div className="col-span-2">
                  <div className="text-slate-500 mb-0.5">Distance from farm centre</div>
                  <div className={clsx('font-bold text-sm', isOut ? 'text-red-400' : 'text-green-400')}>{formatDist(distFromCenter)}</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <MapPin size={16} className="text-slate-300 flex-shrink-0" />
            <div className="text-xs text-slate-400">No GPS tracker attached to this animal.</div>
          </div>
        )}

        {/* Location */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Registered Location</div>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <MapPin size={14} className="text-green-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-slate-700">{animal.location}</span>
          </div>
        </div>

        {/* Animal details */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Animal Details</div>
          <div className="rounded-2xl overflow-hidden border border-slate-100">
            {[
              ['Species',  `${SPECIES_META[animal.species]} ${animal.species}`],
              ['Breed',    animal.breed],
              ['Sex',      animal.sex],
              ['Age',      `${animal.age} yr${animal.age !== 1 ? 's' : ''}`],
              ['Weight',   animal.weight ? `${animal.weight} kg` : '—'],
              ['Born',     animal.dob],
            ].map(([k, v], i) => (
              <div key={k} className={clsx('flex items-center justify-between px-3 py-2.5 text-xs', i !== 0 && 'border-t border-slate-50')}>
                <span className="text-slate-400 font-semibold">{k}</span>
                <span className="font-bold text-slate-700">{v}</span>
              </div>
            ))}
            {animal.notes && (
              <div className="border-t border-slate-50 px-3 py-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Notes</span>
                <span className="text-xs text-slate-600">{animal.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Last health event */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Last Health Event</div>
          {lastHealth ? (
            <div className="rounded-2xl p-3.5" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg text-white"
                  style={{ background: lastHealth.type === 'Vaccination' ? '#3b82f6' : lastHealth.type === 'Treatment' ? '#ef4444' : '#64748b' }}>
                  {lastHealth.type}
                </span>
                <span className="text-xs text-slate-400">{lastHealth.date}</span>
              </div>
              <div className="text-xs font-semibold text-slate-700">{lastHealth.description || lastHealth.notes || '—'}</div>
              {lastHealth.vet && <div className="text-[11px] text-slate-400 mt-1">Dr. {lastHealth.vet}</div>}
            </div>
          ) : (
            <div className="rounded-2xl p-3.5 text-xs text-slate-400" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              No health records found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── GPS Map (vanilla Leaflet — no react-leaflet hooks) ─────────────── */

function makeMarkerIcon(animal, isOut, isSel) {
  const mk    = SPECIES_MARKER[animal.species] || { bg: '#64748b' };
  const emoji = SPECIES_META[animal.species] || '🐾';
  const size  = isSel ? 42 : 34;
  const bg    = isOut ? '#ef4444' : mk.bg;
  const shadow = isOut
    ? ',0 0 0 6px rgba(239,68,68,.35)'
    : isSel ? `,0 0 0 5px ${mk.bg}55` : '';
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.45)}px;box-shadow:0 3px 10px rgba(0,0,0,.3)${shadow};cursor:pointer">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
}

function GPSMap({ trackedAnimals, selected, onSelect, farmBoundary }) {
  const containerRef     = useRef(null);
  const mapRef           = useRef(null);
  const tileLayerRef     = useRef(null);
  const markersRef       = useRef({});
  const geofenceRef      = useRef(null);
  const onSelectRef      = useRef(onSelect);
  const selectedRef      = useRef(selected);
  const farmBoundaryRef  = useRef(farmBoundary);
  const [mapType, setMapType] = useState('satellite');

  const farmCenter = boundaryCenter(farmBoundary);
  const farmRadius = farmBoundary?.type === 'polygon' ? null : (farmBoundary?.radius ?? 450);

  // Keep refs current without re-initialising the map
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { farmBoundaryRef.current = farmBoundary; }, [farmBoundary]);

  // Live-update geofence when boundary changes
  useEffect(() => {
    if (!mapRef.current) return;
    const fb = farmBoundaryRef.current;
    const escaped = trackedAnimals.filter(a => outsideFarm(a.tracker, fb));
    const color = escaped.length > 0 ? '#ef4444' : '#22c55e';

    if (geofenceRef.current) { geofenceRef.current.remove(); geofenceRef.current = null; }

    if (fb?.type === 'polygon' && fb.points?.length >= 3) {
      geofenceRef.current = L.polygon(fb.points.map(p => [p.lat, p.lng]), {
        color, fillColor: color, fillOpacity: 0.06, dashArray: '10 6', weight: 2.5,
      }).addTo(mapRef.current);
    } else {
      const fc = boundaryCenter(fb);
      const fr = fb?.radius ?? 450;
      geofenceRef.current = L.circle(fc, {
        radius: fr, color, fillColor: color, fillOpacity: 0.06, dashArray: '10 6', weight: 2.5,
      }).addTo(mapRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmBoundary]);

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true });
    mapRef.current = map;

    tileLayerRef.current = L.tileLayer(TILE_LAYERS.satellite.url, {
      attribution: TILE_LAYERS.satellite.attribution,
    }).addTo(map);

    const fb = farmBoundaryRef.current;
    const fc = boundaryCenter(fb);
    const escaped = trackedAnimals.filter(a => outsideFarm(a.tracker, fb));
    const color = escaped.length > 0 ? '#ef4444' : '#22c55e';

    // Geofence — circle or polygon
    if (fb?.type === 'polygon' && fb.points?.length >= 3) {
      geofenceRef.current = L.polygon(fb.points.map(p => [p.lat, p.lng]), {
        color, fillColor: color, fillOpacity: 0.06, dashArray: '10 6', weight: 2.5,
      }).addTo(map);
    } else {
      const fr = fb?.radius ?? 450;
      geofenceRef.current = L.circle(fc, {
        radius: fr, color, fillColor: color, fillOpacity: 0.06, dashArray: '10 6', weight: 2.5,
      }).addTo(map);
    }

    // Farm centre
    L.circleMarker(fc, {
      radius: 6, color: '#15803d', fillColor: '#16a34a', fillOpacity: 1, weight: 2,
    }).addTo(map).bindTooltip('🏠 Farm Centre', { permanent: true, direction: 'top', offset: [0, -10] });

    // Animal markers
    const pts = [fc];
    trackedAnimals.filter(a => a.tracker?.lat).forEach(animal => {
      const isOut = outsideFarm(animal.tracker, fb);
      const dist  = haversine(fc[0], fc[1], animal.tracker.lat, animal.tracker.lng);
      const tooltipHtml = `<div style="font-weight:700;font-size:12px;line-height:1.5">
        ${animal.name} · ${animal.tag}
        ${isOut
          ? `<div style="color:#ef4444;font-weight:800">🚨 OUTSIDE FARM — ${formatDist(dist)}</div>`
          : `<div style="color:#16a34a;font-size:11px">✓ Within boundary · ${formatDist(dist)}</div>`}
      </div>`;

      const marker = L.marker([animal.tracker.lat, animal.tracker.lng], {
        icon: makeMarkerIcon(animal, isOut, false),
      }).addTo(map).bindTooltip(tooltipHtml, { direction: 'top', offset: [0, -20] });

      marker.on('click', () => {
        const cur = selectedRef.current;
        onSelectRef.current(cur?.id === animal.id ? null : animal);
      });

      markersRef.current[animal.id] = { marker, animal };
      pts.push([animal.tracker.lat, animal.tracker.lng]);
    });

    // Fit to all points
    if (pts.length > 1) map.fitBounds(pts, { padding: [60, 60] });

    return () => { map.remove(); mapRef.current = null; markersRef.current = {}; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap tile layer on toggle
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(TILE_LAYERS[mapType].url);
  }, [mapType]);

  // Update marker icons when selection changes
  useEffect(() => {
    Object.values(markersRef.current).forEach(({ marker, animal }) => {
      const isOut = outsideFarm(animal.tracker, farmBoundaryRef.current);
      const isSel = selected?.id === animal.id;
      marker.setIcon(makeMarkerIcon(animal, isOut, isSel));
    });
  }, [selected]);

  const escaped = trackedAnimals.filter(a => outsideFarm(a.tracker, farmBoundary));

  return (
    <div>
      {escaped.length > 0 && (
        <div className="mb-4 flex items-start gap-3 px-4 py-3.5 rounded-2xl"
          style={{ background: '#fff5f5', border: '2px solid #fca5a5' }}>
          <AlertTriangle size={18} color="#ef4444" className="flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-extrabold text-red-700 mb-0.5">
              🚨 {escaped.length} animal{escaped.length > 1 ? 's' : ''} detected outside farm boundary!
            </div>
            <div className="text-xs text-red-600">
              {escaped.map(a => {
                const dist = haversine(farmCenter[0], farmCenter[1], a.tracker.lat, a.tracker.lng);
                return `${a.name} (${a.tag}) — ${formatDist(dist)} from centre, last seen ${relativeTime(a.tracker.lastSeen)}`;
              }).join(' · ')}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="text-xs font-semibold">
          {escaped.length === 0
            ? <span className="text-green-600 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" />All {trackedAnimals.length} animals within farm boundary</span>
            : <span className="text-red-600">{escaped.length} outside · {trackedAnimals.length - escaped.length} within boundary</span>}
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
          {[{ id:'satellite', label:'Satellite', Icon:Satellite }, { id:'street', label:'Street', Icon:Map }].map(t => (
            <button key={t.id} onClick={() => setMapType(t.id)}
              className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                mapType === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
              <t.Icon size={12}/> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="rounded-2xl overflow-hidden"
        style={{ height: 500, border: '1px solid #e2e8f0' }} />

      <p className="text-xs text-slate-400 mt-2 text-center">
        {farmBoundary?.type === 'polygon'
          ? `Polygon geofence (${farmBoundary.points?.length ?? 0} vertices)`
          : farmRadius >= 1000 ? `${(farmRadius / 1000).toFixed(2)} km` : `${farmRadius} m`} farm geofence · Click any marker to view animal details
      </p>
    </div>
  );
}

/* ── Farm Schematic (SVG plan) ──────────────────────────────────────── */

/* ── Tracked List ───────────────────────────────────────────────────── */

function TrackedList({ allAnimals, onSelect, farmBoundary, farmCenter }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="text-sm font-extrabold text-slate-700">All Animals</div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold px-2.5 py-1 rounded-lg text-white" style={{ background: '#16a34a' }}>{allAnimals.filter(a => a.tracker).length} tracked</span>
          <span className="font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500">{allAnimals.filter(a => !a.tracker).length} untracked</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {['Animal', 'Species', 'Location', 'Status', 'Battery', 'Last Seen', 'Distance', 'Device ID'].map(h => (
                <th key={h} className="pb-3 pr-4 pt-4 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left whitespace-nowrap first:pl-5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {[...allAnimals.filter(a => a.tracker), ...allAnimals.filter(a => !a.tracker)].map(a => {
              const st  = STATUS_STYLE[a.status] || STATUS_STYLE.Healthy;
              const trk = a.tracker;
              const isOut = outsideFarm(trk, farmBoundary);
              const dist = trk?.lat ? haversine(farmCenter[0], farmCenter[1], trk.lat, trk.lng) : null;
              return (
                <tr key={a.id}
                  className={clsx('transition-colors cursor-pointer', isOut ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50/70')}
                  onClick={() => trk && onSelect(a)}>
                  <td className="py-3 pr-4 pl-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: isOut ? '#fee2e2' : (SPECIES_MARKER[a.species]?.ring || '#f1f5f9') }}>
                        {SPECIES_META[a.species]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm leading-tight flex items-center gap-1.5">
                          {a.name}
                          {isOut && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-red-700 bg-red-100">OUTSIDE</span>}
                        </div>
                        <div className="text-[11px] font-mono font-bold text-slate-400">{a.tag}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-xs text-slate-600 font-semibold">{a.species}</td>
                  <td className="py-3 pr-4"><span className="text-xs font-semibold px-2 py-1 rounded-lg bg-slate-100 text-slate-600">📍 {a.location}</span></td>
                  <td className="py-3 pr-4"><span className="text-[11px] font-bold px-2 py-1 rounded-lg" style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>{a.status}</span></td>
                  {trk ? (
                    <>
                      <td className="py-3 pr-4"><BatteryBadge pct={trk.battery} /></td>
                      <td className="py-3 pr-4 text-xs text-slate-500 font-semibold">{relativeTime(trk.lastSeen)}</td>
                      <td className="py-3 pr-4 text-xs font-bold" style={{ color: isOut ? '#ef4444' : '#16a34a' }}>
                        {dist != null ? formatDist(dist) : '—'}
                        {isOut && ' ⚠'}
                      </td>
                      <td className="py-3 text-[11px] font-mono text-slate-400">{trk.deviceId || 'Manual GPS'}</td>
                    </>
                  ) : (
                    <td colSpan={4} className="py-3 text-xs text-slate-300 italic">No tracker</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */

export default function Tracking() {
  const { livestock, health, farmBoundary } = useData();
  const [view, setView]     = useState('gps');
  const [selected, setSelected] = useState(null);

  const farmCenter = useMemo(() => boundaryCenter(farmBoundary), [farmBoundary]);

  const trackedAnimals = useMemo(() => livestock.filter(a => a.tracker), [livestock]);
  const escapedAnimals = useMemo(
    () => trackedAnimals.filter(a => outsideFarm(a.tracker, farmBoundary)),
    [trackedAnimals, farmBoundary]
  );
  const lowBattery = useMemo(() => trackedAnimals.filter(a => a.tracker.battery < 20), [trackedAnimals]);

  const selectedDist = useMemo(() => {
    if (!selected?.tracker?.lat) return null;
    return haversine(farmCenter[0], farmCenter[1], selected.tracker.lat, selected.tracker.lng);
  }, [selected, farmCenter]);

  const handleSelect = (animal) => {
    setSelected(animal);
    if (animal && view === 'list') setView('gps');
  };

  const TABS = [
    { id: 'gps',  label: 'GPS Map', icon: <Navigation size={14} /> },
    { id: 'list', label: 'List',    icon: <List size={14} /> },
  ];

  return (
    <>
    <div className="flex flex-col gap-5 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Animal Tracking</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Live GPS map — {trackedAnimals.length} of {livestock.length} animals tracked
            {escapedAnimals.length > 0 && <span className="ml-2 text-red-500 font-bold">· {escapedAnimals.length} outside boundary!</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {escapedAnimals.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl animate-pulse"
              style={{ background: '#fff5f5', color: '#dc2626', border: '1px solid #fca5a5' }}>
              <AlertTriangle size={13} /> {escapedAnimals.length} Escaped
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl"
            style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', color: '#15803d', border: '1px solid #bbf7d0' }}>
            <div className="w-2 h-2 rounded-full bg-green-500 pulse" />
            {trackedAnimals.length - escapedAnimals.length} On Farm
          </div>
        </div>
      </div>

      {/* Low battery alert */}
      {lowBattery.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm"
          style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <BatteryLow size={16} color="#d97706" className="flex-shrink-0" />
          <span className="text-amber-700 font-semibold">
            Low battery warning: {lowBattery.map(a => `${a.name} (${a.tracker.battery}%)`).join(', ')} — charge or replace trackers soon.
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Tracked Animals',   value:trackedAnimals.length,                              icon:'📡', color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0' },
          { label:'Outside Boundary',  value:escapedAnimals.length,                              icon:'🚨', color: escapedAnimals.length > 0 ? '#dc2626' : '#64748b', bg: escapedAnimals.length > 0 ? '#fff5f5' : '#f8fafc', border: escapedAnimals.length > 0 ? '#fca5a5' : '#e2e8f0' },
          { label:'Zones Active',      value:new Set(trackedAnimals.map(a=>a.location)).size,    icon:'🗺️',  color:'#3b82f6', bg:'#eff6ff', border:'#bfdbfe' },
          { label:'Low Battery',       value:lowBattery.length,                                  icon:'🔋', color: lowBattery.length > 0 ? '#d97706' : '#64748b', bg: lowBattery.length > 0 ? '#fffbeb' : '#f8fafc', border: lowBattery.length > 0 ? '#fde68a' : '#e2e8f0' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 p-1 rounded-2xl w-fit" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            className={clsx('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all',
              view === t.id ? 'text-slate-900 shadow-sm bg-white' : 'text-slate-500 hover:text-slate-700')}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0">
          {view === 'gps'  && <GPSMap trackedAnimals={trackedAnimals} selected={selected} onSelect={handleSelect} farmBoundary={farmBoundary} />}
          {view === 'list' && <TrackedList allAnimals={livestock} onSelect={handleSelect} farmBoundary={farmBoundary} farmCenter={farmCenter} />}
          {view !== 'list' && <p className="text-xs text-slate-400 mt-2 text-center hidden md:block">Click any animal marker to view details</p>}
        </div>

        {/* Detail panel — only shown when an animal is selected in map views */}
        {selected && view !== 'list' && (
          <div className="w-80 flex-shrink-0 rounded-2xl overflow-hidden shadow-xl flex flex-col"
            style={{ border: '1px solid #e2e8f0', maxHeight: 'calc(100vh - 180px)', position: 'sticky', top: 16 }}>
            <DetailPanel animal={selected} healthRecords={health} distFromCenter={selectedDist} isOutside={outsideFarm(selected?.tracker, farmBoundary)} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>

    </div>

    </>
  );
}
