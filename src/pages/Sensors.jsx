import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { useData } from '../context/DataContext';
import { AlertBox } from '../components/AlertBox';
import {
  PenLine, X, RotateCcw, ClipboardList, Plus, Trash2,
  Cpu, Wifi, WifiOff, Clock, Copy, Check, ChevronRight, ChevronLeft,
  RefreshCw, Terminal, Download, Eye, EyeOff,
} from 'lucide-react';
import clsx from 'clsx';

/* ── Constants ──────────────────────────────────────────────────────── */

const TEMP_DATA = [19,18,17,17,18,20,22,24,25,26,25,24].map((v,i)=>({t:`${i*2}:00`,barn:v,hen:v+2.5}));

const MANUAL_REASONS = [
  'Sensor offline','Sensor malfunction','Calibration check',
  'Cross-verification reading','Temporary replacement reading','Maintenance period','Other',
];

const SENSOR_CATEGORIES = [
  'Environment','Air Quality','Water','Field','Feed',
  'Animal Health','Production','Weather','Security',
];

const COMMON_UNITS = ['°C','°F','%','ppm','L/day','km/h','mm','lux','pH','bar','V','kg','mg/L','mS/cm'];

const ICON_OPTIONS = [
  '🌡️','💧','🌬️','⚗️','🚰','🌱','🌾','🐄','🥛','🐝','🍯','💨',
  '🌧️','☀️','📍','🔥','⚡','🌊','🧪','📡','🔬','💡',
  '🌿','🐷','🐔','🐑','🐟','🦟','🏭','🛢️','🔋','📶',
];

/* `available` is the honest bit. MQTT and WebSocket both need a process
   listening continuously; isibaya runs on serverless functions that exist only
   for the length of a request, so there is nothing for a device to hold a
   connection to. They are left visible because they are the right answer for
   some hardware and worth asking about — but they are not selectable, because
   shipping a credential and a code snippet for an endpoint that does not exist
   is how someone loses a weekend to a device that was never going to connect. */
const PROTOCOLS = [
  {
    id:'HTTP', label:'HTTP REST', icon:'🌐', available:true,
    color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0',
    badge:'Recommended',
    description:'A POST per reading. Works from anything with an internet path — and it is the only transport isibaya accepts today.',
    useCases:['ESP32 / Arduino','Raspberry Pi','Wi-Fi and LTE sensors','LoRa gateways with a bridge'],
  },
  {
    id:'MQTT', label:'MQTT', icon:'📡', available:false,
    color:'#3b82f6', bg:'#eff6ff', border:'#bfdbfe',
    badge:'Not available yet',
    description:'Needs a broker holding connections open. Serverless functions cannot host one, so this would need an external broker bridging into the HTTP endpoint.',
    useCases:['Low-power devices','Unreliable networks','Fleets reporting at once'],
  },
  {
    id:'WebSocket', label:'WebSocket', icon:'⚡', available:false,
    color:'#f59e0b', bg:'#fffbeb', border:'#fde68a',
    badge:'Not available yet',
    description:'Needs a persistent socket server for the same reason. For sub-second reporting, talk to support about a dedicated ingest service.',
    useCases:['High-frequency sensors','Real-time displays','Industrial PLCs'],
  },
];

const REPORT_INTERVALS = [
  {label:'10 sec', value:10},
  {label:'30 sec', value:30},
  {label:'1 min',  value:60},
  {label:'5 min',  value:300},
  {label:'15 min', value:900},
  {label:'30 min', value:1800},
  {label:'1 hr',   value:3600},
];

/* ── Helpers ────────────────────────────────────────────────────────── */

const CustomTooltip = ({active,payload,label}) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{background:'#1e293b',borderRadius:10,padding:'10px 14px',boxShadow:'0 10px 25px rgba(0,0,0,.2)'}}>
      <p style={{color:'#94a3b8',fontSize:11,marginBottom:6}}>{label}</p>
      {payload.map((p,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#f1f5f9',marginBottom:2}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:p.color}}/>
          <span style={{color:'#94a3b8'}}>{p.name}:</span>
          <span style={{fontWeight:700}}>{p.value}°C</span>
        </div>
      ))}
    </div>
  );
};

function pct(s){
  if (s.max===s.min) return 100;
  return Math.round(((s.value-s.min)/(s.max-s.min))*100);
}

function formatLoggedAt(iso){
  return new Date(iso).toLocaleString('en-ZA',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
}

/* Real endpoint, resolved from wherever the app is being served so the snippet
   works against a local dev server as well as production. The previous
   snippets pointed at broker.isibaya.io and api.isibaya.io — neither of which
   exists, nor is on a domain we own, so anything flashed from them failed
   silently. */
const ingestUrl = () =>
  `${typeof window !== 'undefined' ? window.location.origin : 'https://isibaya.smartpick.co.za'}/.netlify/functions/ingest`;

function getCodeSnippet(protocol, deviceId, token, sensor){
  const unit = sensor?.unit || '°C';
  const url  = ingestUrl();

  if (protocol==='HTTP') return `# Check it works first — this should return 202
curl -X POST ${url} \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"deviceId":"${deviceId}","value":24.3,"unit":"${unit}"}'

# ── Python ────────────────────────────────────────────────────────────
import requests, time

URL   = "${url}"
TOKEN = "${token}"

def read_sensor():
    return 24.3  # ← replace with your sensor read

while True:
    r = requests.post(URL,
        headers={"Authorization": f"Bearer {TOKEN}"},
        json={"deviceId": "${deviceId}", "value": read_sensor(), "unit": "${unit}"},
        timeout=10)
    print(r.status_code, r.text)
    time.sleep(60)   # reporting interval

# ── ESP32 / Arduino (HTTPClient) ──────────────────────────────────────
# HTTPClient http;
# http.begin("${url}");
# http.addHeader("Authorization", "Bearer ${token}");
# http.addHeader("Content-Type", "application/json");
# http.POST("{\\"deviceId\\":\\"${deviceId}\\",\\"value\\":24.3,\\"unit\\":\\"${unit}\\"}");`;

  // MQTT and WebSocket both need a process listening all the time. Netlify
  // Functions only run in response to a request, so there is nothing here to
  // connect to. Rather than print code that cannot work, say so.
  return `# ${protocol} is not available yet.
#
# ${protocol === 'MQTT' ? 'An MQTT broker' : 'A WebSocket server'} has to hold connections open
# continuously. isibaya runs on serverless functions, which only exist for the
# length of a request, so there is no ${protocol === 'MQTT' ? 'broker' : 'socket'} to connect to.
#
# Use HTTP instead — it is the tab next to this one, it works today, and any
# ESP32, Raspberry Pi or LoRa gateway with an internet path can post to it.
#
# If you need ${protocol} specifically, it needs a always-on service
# (HiveMQ, EMQX or similar) bridging into the HTTP endpoint. Ask support.`;
}

/* ── Copy Button ────────────────────────────────────────────────────── */

function CopyBtn({text, size=13}){
  const [copied,setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(()=>{});
    setCopied(true);
    setTimeout(()=>setCopied(false),1800);
  };
  return (
    <button onClick={copy}
      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all"
      style={copied
        ? {background:'#dcfce7',color:'#16a34a',border:'1px solid #bbf7d0'}
        : {background:'#f8fafc',color:'#64748b',border:'1px solid #e2e8f0'}}>
      {copied ? <Check size={size}/> : <Copy size={size}/>}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

/* ── Sensor Card ────────────────────────────────────────────────────── */

function SensorCard({sensor:s, onManualEntry, onClearOverride, onDelete}){
  const p = Math.max(0,Math.min(100,pct(s)));
  const isAlert=s.status==='alert', isWarn=s.status==='warn';
  const barColor  = isAlert?'#ef4444':isWarn?'#f59e0b':'#22c55e';
  const topColor  = s.isManual?'#8b5cf6':(isAlert?'#ef4444':isWarn?'#f59e0b':'#22c55e');
  const cardBg    = s.isManual?'linear-gradient(135deg,#faf5ff,#ede9fe)':isAlert?'linear-gradient(135deg,#fff5f5,#fee2e2)':isWarn?'linear-gradient(135deg,#fffbeb,#fef3c7)':'#ffffff';
  const cardBorder= s.isManual?'#c4b5fd':isAlert?'#fca5a5':isWarn?'#fde68a':'#e2e8f0';

  return (
    <div className="rounded-2xl p-4 relative overflow-hidden transition-all hover:-translate-y-0.5"
      style={{background:cardBg,border:`1px solid ${cardBorder}`,boxShadow:'0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04)'}}>
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{background:topColor}}/>
      <div className="flex items-center justify-between mb-2.5 gap-1">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">{s.category}</div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {s.isManual&&<span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{background:'#ede9fe',color:'#7c3aed',border:'1px solid #c4b5fd'}}>MANUAL</span>}
          {s._custom&&<span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{background:'#f0fdf4',color:'#16a34a',border:'1px solid #bbf7d0'}}>NEW</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-xl leading-none">{s.icon}</span>
        <span className="text-2xl font-extrabold text-slate-900 leading-none">{s.value}</span>
        <span className="text-xs text-slate-400 leading-none">{s.unit}</span>
      </div>
      <div className="text-sm font-bold text-slate-700 mb-3 truncate">{s.name}</div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1">
        <div className="h-full rounded-full transition-all" style={{width:`${p}%`,background:barColor}}/>
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mb-2"><span>{s.min}</span><span>{s.max}</span></div>
      <div className="text-[11px] text-slate-400 mb-1 truncate">📍 {s.location}</div>
      <div className="flex items-center gap-1.5 text-xs font-semibold" style={{color:barColor}}>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isAlert?'bg-red-500':isWarn?'bg-amber-500':'bg-green-500 pulse'}`}/>
        {s.status==='normal'?'Normal':s.status==='warn'?'Warning':'Critical'}
      </div>
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5">
        <button onClick={()=>onManualEntry(s)}
          className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold py-1.5 rounded-lg hover:opacity-90 transition-all"
          style={{background:'linear-gradient(135deg,#8b5cf6,#7c3aed)',color:'#fff'}}>
          <PenLine size={11}/> Manual Entry
        </button>
        {s.isManual&&(
          <button onClick={()=>onClearOverride(s.id)} title="Restore live reading"
            className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-all">
            <RotateCcw size={13}/>
          </button>
        )}
        <button onClick={()=>onDelete(s)} title="Remove sensor"
          className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
          <Trash2 size={13}/>
        </button>
      </div>
    </div>
  );
}

/* ── Add Sensor Modal ───────────────────────────────────────────────── */

function AddSensorModal({existingLocations,onClose,onSave}){
  const BLANK={name:'',category:'Environment',icon:'📡',location:'',unit:'°C',min:0,max:100,value:0};
  const [form,setForm]=useState(BLANK);
  const [customCat,setCustomCat]=useState('');
  const [useCustomCat,setUseCustomCat]=useState(false);
  const [errors,setErrors]=useState({});
  const set=(k,v)=>{setForm(f=>({...f,[k]:v}));setErrors(e=>({...e,[k]:''}));};

  const validate=()=>{
    const e={};
    if(!form.name.trim()) e.name='Required';
    if(!form.location.trim()) e.location='Required';
    if(!form.unit.trim()) e.unit='Required';
    const n=parseFloat(form.min),x=parseFloat(form.max),v=parseFloat(form.value);
    if(isNaN(n)) e.min='Must be a number';
    if(isNaN(x)) e.max='Must be a number';
    if(!isNaN(n)&&!isNaN(x)&&n>=x) e.max='Max must be > min';
    if(isNaN(v)) e.value='Must be a number';
    return e;
  };

  const handleSave=()=>{
    const e=validate();
    if(Object.keys(e).length){setErrors(e);return;}
    const cat=useCustomCat?customCat.trim():form.category;
    const numMin=parseFloat(form.min),numMax=parseFloat(form.max),numVal=parseFloat(form.value);
    const status=numVal<numMin?'alert':numVal>numMax?'warn':'normal';
    onSave({name:form.name.trim(),category:cat||'Environment',icon:form.icon,location:form.location.trim(),unit:form.unit.trim(),min:numMin,max:numMax,value:numVal,status,_custom:true});
  };

  const inp=(err)=>clsx('w-full border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none transition-all',err?'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100':'border-slate-200 focus:border-green-400 focus:ring-2 focus:ring-green-100');
  const pred=()=>{const n=parseFloat(form.min),x=parseFloat(form.max),v=parseFloat(form.value);if(isNaN(n)||isNaN(x)||isNaN(v))return null;if(v<n)return{label:'Critical',color:'#ef4444',bg:'#fee2e2'};if(v>x)return{label:'Warning',color:'#f59e0b',bg:'#fef3c7'};return{label:'Normal',color:'#16a34a',bg:'#dcfce7'};};
  const pr=pred();

  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(15,23,42,.45)',backdropFilter:'blur(4px)'}}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden flex flex-col max-h-[90vh]" style={{background:'#fff',boxShadow:'0 20px 60px rgba(0,0,0,.18)'}}>
        <div className="flex items-center justify-between px-6 py-5 flex-shrink-0" style={{background:'linear-gradient(135deg,#16a34a,#15803d)'}}>
          <div>
            <div className="text-white font-extrabold text-base flex items-center gap-2"><Plus size={16}/> Add New Sensor</div>
            <div className="text-green-200 text-xs mt-0.5">Configure sensor details and its location on the farm</div>
          </div>
          <button onClick={onClose} className="text-green-200 hover:text-white"><X size={20}/></button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex flex-col gap-4">
          <div><label className="block text-xs font-bold text-slate-600 mb-1.5">Sensor Name *</label><input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Water Temperature, Dissolved Oxygen…" className={inp(errors.name)}/>{errors.name&&<p className="text-xs text-red-500 mt-1">{errors.name}</p>}</div>
          <div><label className="block text-xs font-bold text-slate-600 mb-1.5">Icon</label><div className="flex flex-wrap gap-1.5">{ICON_OPTIONS.map(ic=><button key={ic} onClick={()=>set('icon',ic)} className={clsx('w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all',form.icon===ic?'border-green-400 bg-green-50 scale-110 shadow-sm':'border-slate-200 hover:border-green-300 hover:bg-slate-50')}>{ic}</button>)}</div></div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Category *</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {SENSOR_CATEGORIES.map(c=><button key={c} onClick={()=>{setUseCustomCat(false);set('category',c);}} className={clsx('px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',!useCustomCat&&form.category===c?'text-white border-green-600':'bg-white border-slate-200 text-slate-600 hover:border-green-300')} style={!useCustomCat&&form.category===c?{background:'linear-gradient(135deg,#16a34a,#15803d)'}:{}}>{c}</button>)}
              <button onClick={()=>setUseCustomCat(true)} className={clsx('px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',useCustomCat?'text-white border-green-600':'bg-white border-dashed border-slate-300 text-slate-500 hover:border-green-300')} style={useCustomCat?{background:'linear-gradient(135deg,#16a34a,#15803d)'}:{}}>+ Custom</button>
            </div>
            {useCustomCat&&<input value={customCat} onChange={e=>setCustomCat(e.target.value)} placeholder="Enter custom category name…" className={inp(false)}/>}
          </div>
          <div><label className="block text-xs font-bold text-slate-600 mb-1.5">Location *</label><input value={form.location} onChange={e=>set('location',e.target.value)} placeholder="e.g. Barn 2, Fish Pond A, Field D…" list="sensor-locations" className={inp(errors.location)}/><datalist id="sensor-locations">{existingLocations.map(l=><option key={l} value={l}/>)}</datalist>{errors.location&&<p className="text-xs text-red-500 mt-1">{errors.location}</p>}<p className="text-[11px] text-slate-400 mt-1">Type a new location or pick an existing one from the suggestions.</p></div>
          <div><label className="block text-xs font-bold text-slate-600 mb-1.5">Unit *</label><div className="flex gap-2 flex-wrap mb-2">{COMMON_UNITS.map(u=><button key={u} onClick={()=>set('unit',u)} className={clsx('px-2.5 py-1 rounded-lg text-xs font-bold border transition-all',form.unit===u?'text-white border-green-600':'bg-white border-slate-200 text-slate-500 hover:border-green-300')} style={form.unit===u?{background:'linear-gradient(135deg,#16a34a,#15803d)'}:{}}>{u}</button>)}</div><input value={form.unit} onChange={e=>set('unit',e.target.value)} placeholder="Or type a custom unit…" className={inp(errors.unit)}/>{errors.unit&&<p className="text-xs text-red-500 mt-1">{errors.unit}</p>}</div>
          <div className="grid grid-cols-3 gap-3">
            {[['Min Value *','min'],['Max Value *','max'],['Initial Reading *','value']].map(([lbl,k])=>(
              <div key={k}><label className="block text-xs font-bold text-slate-600 mb-1.5">{lbl}</label><input type="number" step="any" value={form[k]} onChange={e=>set(k,e.target.value)} className={inp(errors[k])}/>{errors[k]&&<p className="text-xs text-red-500 mt-1">{errors[k]}</p>}</div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">Preview</label>
            <div className="rounded-2xl p-4 border border-dashed border-green-300" style={{background:'linear-gradient(135deg,#f0fdf4,#dcfce7)'}}>
              <div className="flex items-center gap-2 mb-1"><span className="text-2xl">{form.icon}</span><span className="text-xl font-extrabold text-slate-900">{form.value||'—'}</span><span className="text-xs text-slate-400">{form.unit}</span>{pr&&<span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-lg" style={{background:pr.bg,color:pr.color}}>{pr.label}</span>}</div>
              <div className="text-sm font-bold text-slate-700">{form.name||'Sensor Name'}</div>
              <div className="text-[11px] text-slate-400 mt-1">📍 {form.location||'Location'} · {useCustomCat?(customCat||'Category'):form.category}</div>
            </div>
          </div>
        </div>
        <div className="px-6 pb-5 pt-2 flex gap-3 flex-shrink-0 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all" style={{background:'linear-gradient(135deg,#16a34a,#15803d)'}}>Add Sensor</button>
        </div>
      </div>
    </div>
  );
}

/* ── Manual Entry Modal ─────────────────────────────────────────────── */

function ManualEntryModal({sensor,onClose,onSave}){
  const [form,setForm]=useState({value:sensor.value,reason:MANUAL_REASONS[0],notes:''});
  const [error,setError]=useState('');
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const handleSave=()=>{const num=parseFloat(form.value);if(isNaN(num)){setError('Enter a valid number.');return;}onSave({sensorId:sensor.id,value:num,reason:form.reason,notes:form.notes});onClose();};
  const pred=()=>{const num=parseFloat(form.value);if(isNaN(num))return null;if(num<sensor.min)return{label:'Critical',color:'#ef4444',bg:'#fee2e2'};if(num>sensor.max)return{label:'Warning',color:'#f59e0b',bg:'#fef3c7'};return{label:'Normal',color:'#16a34a',bg:'#dcfce7'};};
  const p=pred();
  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(15,23,42,.45)',backdropFilter:'blur(4px)'}}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden" style={{background:'#fff',boxShadow:'0 20px 60px rgba(0,0,0,.18)'}}>
        <div className="flex items-center justify-between px-6 py-5" style={{background:'linear-gradient(135deg,#8b5cf6,#7c3aed)'}}>
          <div><div className="text-white font-extrabold text-base flex items-center gap-2"><PenLine size={16}/> Manual Sensor Reading</div><div className="text-violet-200 text-xs mt-0.5">{sensor.icon} {sensor.name} · {sensor.location}</div></div>
          <button onClick={onClose} className="text-violet-200 hover:text-white"><X size={20}/></button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="rounded-xl p-3 flex items-center gap-4 text-xs" style={{background:'#f8fafc',border:'1px solid #e2e8f0'}}>
            <div className="text-center"><div className="text-slate-400 mb-0.5">Current</div><div className="font-extrabold text-slate-800">{sensor.value}{sensor.unit}</div></div>
            <div className="h-8 w-px bg-slate-200"/>
            <div className="text-center"><div className="text-slate-400 mb-0.5">Min</div><div className="font-bold text-slate-600">{sensor.min}{sensor.unit}</div></div>
            <div className="text-center"><div className="text-slate-400 mb-0.5">Max</div><div className="font-bold text-slate-600">{sensor.max}{sensor.unit}</div></div>
            {p&&<><div className="h-8 w-px bg-slate-200"/><div className="text-center"><div className="text-slate-400 mb-0.5">Predicted</div><span className="font-bold px-2 py-0.5 rounded-lg text-[11px]" style={{background:p.bg,color:p.color}}>{p.label}</span></div></>}
          </div>
          <div><label className="block text-xs font-bold text-slate-600 mb-1.5">New Reading <span className="text-slate-400 font-normal">({sensor.unit})</span></label><input type="number" step="any" value={form.value} onChange={e=>{set('value',e.target.value);setError('');}} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"/>{error&&<p className="text-xs text-red-500 mt-1">{error}</p>}</div>
          <div><label className="block text-xs font-bold text-slate-600 mb-1.5">Reason</label><select value={form.reason} onChange={e=>set('reason',e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100">{MANUAL_REASONS.map(r=><option key={r}>{r}</option>)}</select></div>
          <div><label className="block text-xs font-bold text-slate-600 mb-1.5">Notes <span className="text-slate-400 font-normal">(optional)</span></label><textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={2} placeholder="e.g. Reading taken with handheld device" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"/></div>
          <div className="rounded-xl p-3 text-xs text-violet-700 flex gap-2" style={{background:'#f5f3ff',border:'1px solid #ede9fe'}}><span>ℹ️</span><span>This reading overrides the sensor display and is logged in the Manual Readings history. The sensor will be marked <strong>MANUAL</strong> until a live reading is restored.</span></div>
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all" style={{background:'linear-gradient(135deg,#8b5cf6,#7c3aed)'}}>Save Reading</button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete Confirm ─────────────────────────────────────────────────── */

function DeleteConfirm({sensor,onClose,onConfirm}){
  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(15,23,42,.45)',backdropFilter:'blur(4px)'}}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden" style={{background:'#fff',boxShadow:'0 20px 60px rgba(0,0,0,.18)'}}>
        <div className="px-6 py-5 text-center"><div className="text-4xl mb-3">{sensor.icon}</div><h3 className="text-base font-extrabold text-slate-800 mb-1">Remove Sensor?</h3><p className="text-sm text-slate-500"><strong>{sensor.name}</strong> at <strong>{sensor.location}</strong> will be permanently removed.</p></div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
          <button onClick={()=>{onConfirm(sensor.id);onClose();}} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all" style={{background:'linear-gradient(135deg,#ef4444,#dc2626)'}}>Remove</button>
        </div>
      </div>
    </div>
  );
}

/* ── Device Card ────────────────────────────────────────────────────── */

function DeviceCard({device:d, sensor, onViewConfig, onRemove, onTestConnection}){
  const proto = PROTOCOLS.find(p=>p.id===d.protocol)||PROTOCOLS[0];
  const isOnline=d.status==='online', isOffline=d.status==='offline';
  return(
    <div className="rounded-2xl p-5 transition-all hover:-translate-y-0.5"
      style={{background:'#fff',border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,.04),0 4px 16px rgba(0,0,0,.04)'}}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{background:'linear-gradient(135deg,#f0fdf4,#dcfce7)',border:'1px solid #bbf7d0'}}>
            {sensor?.icon||'📡'}
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm leading-tight">{sensor?.name||'Unknown Sensor'}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">📍 {sensor?.location||'—'}</div>
          </div>
        </div>
        {/* Status */}
        <div className={clsx('flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl',
          isOnline?'text-green-700':isOffline?'text-red-600':'text-amber-600')}
          style={{background:isOnline?'#f0fdf4':isOffline?'#fef2f2':'#fffbeb',border:`1px solid ${isOnline?'#bbf7d0':isOffline?'#fecaca':'#fde68a'}`}}>
          {isOnline?<Wifi size={11}/>:isOffline?<WifiOff size={11}/>:<Clock size={11}/>}
          {d.status==='online'?'Online':d.status==='offline'?'Offline':'Pending'}
        </div>
      </div>

      {/* Protocol + Device ID */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{background:proto.bg,color:proto.color,border:`1px solid ${proto.border}`}}>
          {proto.icon} {proto.label}
        </span>
        <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">{d.deviceId}</span>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-slate-500">
        <div><span className="text-slate-400">Interval: </span><span className="font-semibold text-slate-700">{REPORT_INTERVALS.find(r=>r.value===d.reportingInterval)?.label||`${d.reportingInterval}s`}</span></div>
        <div><span className="text-slate-400">Last seen: </span><span className="font-semibold text-slate-700">{d.lastSeen?formatLoggedAt(d.lastSeen):'Never'}</span></div>
        <div className="col-span-2"><span className="text-slate-400">Added: </span><span className="font-semibold text-slate-700">{formatLoggedAt(d.createdAt)}</span></div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={()=>onViewConfig(d)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
          style={{background:'linear-gradient(135deg,#16a34a,#15803d)',color:'#fff'}}>
          <Terminal size={12}/> View Config
        </button>
        <button onClick={()=>onTestConnection(d)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
          <RefreshCw size={12}/> Test
        </button>
        <button onClick={()=>onRemove(d.id)}
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
          <Trash2 size={13}/>
        </button>
      </div>
    </div>
  );
}

/* ── Register Device Wizard ─────────────────────────────────────────── */

const STEPS = ['Sensor','Protocol','Credentials','Verify'];

function RegisterDeviceWizard({sensors, onClose, onComplete}){
  const [step,setStep]         = useState(0);
  const [sensorId,setSensorId] = useState(sensors[0]?.id||'');
  const [interval,setInterval] = useState(60);
  const [protocol,setProtocol] = useState('HTTP');
  // Minted by the server — see netlify/functions/device-credentials.js for why
  // they are not generated here any more.
  const [creds,setCreds]       = useState(null);
  const [credError,setCredError] = useState('');
  const [showToken,setShowToken] = useState(false);
  const [registered,setRegistered] = useState(false);
  const [testState,setTestState] = useState('idle'); // idle|waiting|done|error
  const [testLog,setTestLog]   = useState([]);

  const deviceId = creds?.deviceId || '';
  const token    = creds?.token || '';

  useEffect(()=>{
    let cancelled = false;
    (async ()=>{
      try{
        const r = await fetch('/.netlify/functions/device-credentials',{method:'POST',credentials:'same-origin'});
        const d = await r.json().catch(()=>null);
        if(cancelled) return;
        if(!r.ok||!d?.token){ setCredError(d?.error||'Could not get device credentials.'); return; }
        setCreds(d);
      }catch{
        if(!cancelled) setCredError('You need to be online to register a device.');
      }
    })();
    return ()=>{ cancelled = true; };
  },[]);

  const selectedSensor = sensors.find(s=>s.id===Number(sensorId)||s.id===sensorId);
  const snippet = creds ? getCodeSnippet(protocol, deviceId, token, selectedSensor) : '';

  const log = (m)=> setTestLog(l=>[...l,m]);

  /* Waits for the device to actually report.
     This used to print a scripted ACK on a timer whether or not anything was
     connected, which is worse than no check: it sent people away believing
     hardware worked. Now it polls for a stored reading and says nothing until
     one arrives. */
  const runTest = useCallback(async ()=>{
    setTestState('waiting');
    setTestLog([]);
    log(`Listening for ${deviceId}…`);
    log('Run the snippet on your device now. This waits up to 2 minutes.');

    const deadline = Date.now() + 120000;
    while(Date.now() < deadline){
      try{
        const r = await fetch(`/.netlify/functions/device-status?deviceId=${encodeURIComponent(deviceId)}`,{credentials:'same-origin'});
        const d = await r.json().catch(()=>null);
        if(d?.reported && d.latest){
          log(`✓ Reading received — ${d.latest.value}${d.latest.unit?` ${d.latest.unit}`:''} (${d.latest.status})`);
          if(d.latest.status!=='normal') log(`⚠ That value is outside the sensor's normal range.`);
          setTestState('done');
          return;
        }
      }catch{ /* keep waiting — a dropped poll is not a failed device */ }
      await new Promise(r=>setTimeout(r,3000));
    }
    log('✗ Nothing received in 2 minutes.');
    log('Check the device has internet, and that the token was copied whole.');
    setTestState('error');
  },[deviceId]);

  const protoAvailable = PROTOCOLS.find(p=>p.id===protocol)?.available;

  const canNext = ()=>{
    if(step===0) return !!sensorId;
    if(step===1) return !!protoAvailable;
    if(step===2) return !!creds;
    return true;
  };

  /* The device row is created on the way into Verify, not at the end — the
     ingest endpoint has nothing to authenticate against until it exists. */
  const next = ()=>{
    if(step===2 && !registered){
      onComplete({sensorId:selectedSensor?.id, deviceId, token, protocol, reportingInterval:interval});
      setRegistered(true);
    }
    setStep(s=>s+1);
  };

  const finish = ()=> onClose();

  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(15,23,42,.45)',backdropFilter:'blur(4px)'}}>
      <div className="w-full max-w-xl rounded-3xl overflow-hidden flex flex-col max-h-[92vh]" style={{background:'#fff',boxShadow:'0 20px 60px rgba(0,0,0,.2)'}}>

        {/* Header */}
        <div className="px-6 py-5 flex-shrink-0" style={{background:'linear-gradient(135deg,#0f172a,#1e293b)'}}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.3)'}}>
                <Cpu size={16} color="#22c55e"/>
              </div>
              <div>
                <div className="text-white font-extrabold text-base">Register Physical Device</div>
                <div className="text-slate-400 text-xs mt-0.5">Connect real sensor hardware to isibaya</div>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
          </div>
          {/* Step bar */}
          <div className="flex items-center gap-0">
            {STEPS.map((s,i)=>(
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold transition-all',
                    i<step?'bg-green-500 text-white':i===step?'bg-white text-slate-900':'bg-slate-700 text-slate-400')}>
                    {i<step?<Check size={13}/>:i+1}
                  </div>
                  <span className={clsx('text-[10px] font-bold whitespace-nowrap',i===step?'text-white':i<step?'text-green-400':'text-slate-500')}>{s}</span>
                </div>
                {i<STEPS.length-1&&<div className={clsx('h-px flex-1 mx-2 mb-4',i<step?'bg-green-500':'bg-slate-700')}/>}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 overflow-y-auto flex-1">

          {/* Step 0 — Sensor */}
          {step===0&&(
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 mb-1">Link to a Sensor</h3>
                <p className="text-sm text-slate-500">Choose which sensor on the dashboard this physical device will feed data into.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Sensor *</label>
                <select value={sensorId} onChange={e=>setSensorId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100">
                  {sensors.map(s=>(
                    <option key={s.id} value={s.id}>{s.icon} {s.name} — {s.location} ({s.unit})</option>
                  ))}
                </select>
              </div>
              {selectedSensor&&(
                <div className="rounded-2xl p-4 flex items-center gap-4" style={{background:'linear-gradient(135deg,#f0fdf4,#dcfce7)',border:'1px solid #bbf7d0'}}>
                  <span className="text-3xl">{selectedSensor.icon}</span>
                  <div>
                    <div className="font-bold text-slate-800">{selectedSensor.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">📍 {selectedSensor.location} · {selectedSensor.category} · range: {selectedSensor.min}–{selectedSensor.max} {selectedSensor.unit}</div>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Reporting Interval</label>
                <div className="flex flex-wrap gap-2">
                  {REPORT_INTERVALS.map(r=>(
                    <button key={r.value} onClick={()=>setInterval(r.value)}
                      className={clsx('px-3.5 py-2 rounded-xl text-xs font-bold border transition-all',
                        interval===r.value?'text-white border-green-600':'bg-white border-slate-200 text-slate-600 hover:border-green-300')}
                      style={interval===r.value?{background:'linear-gradient(135deg,#16a34a,#15803d)'}:{}}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1 — Protocol */}
          {step===1&&(
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 mb-1">Choose Connection Protocol</h3>
                <p className="text-sm text-slate-500">Select how your device will send data to isibaya.</p>
              </div>
              {PROTOCOLS.map(p=>(
                <button key={p.id} onClick={()=>p.available&&setProtocol(p.id)} disabled={!p.available}
                  className={clsx('w-full text-left rounded-2xl p-4 border-2 transition-all',
                    !p.available?'opacity-55 cursor-not-allowed':protocol===p.id?'shadow-md':'hover:border-slate-300')}
                  style={{borderColor:protocol===p.id&&p.available?p.color:'#e2e8f0',background:protocol===p.id&&p.available?p.bg:'#fff'}}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{p.icon}</span>
                      <span className="font-extrabold text-slate-800">{p.label}</span>
                      {p.badge&&<span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{background:p.color}}>{p.badge}</span>}
                    </div>
                    <div className={clsx('w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all')}
                      style={{borderColor:protocol===p.id?p.color:'#cbd5e1',background:protocol===p.id?p.color:'transparent'}}>
                      {protocol===p.id&&<Check size={10} color="#fff"/>}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{p.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.useCases.map(u=><span key={u} className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-500">{u}</span>)}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2 — Credentials */}
          {step===2&&(
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 mb-1">Device Credentials</h3>
                <p className="text-sm text-slate-500">Flash or configure your device with these credentials. Keep the token secret.</p>
                {credError&&(
                  <div className="mt-3 px-3 py-2.5 rounded-xl text-sm font-medium" style={{background:'#fff5f5',border:'1px solid #fca5a5',color:'#dc2626'}}>
                    ⚠ {credError}
                  </div>
                )}
                {!creds&&!credError&&(
                  <p className="mt-3 text-sm text-slate-400">Generating credentials…</p>
                )}
              </div>

              {/* Credentials */}
              <div className="rounded-2xl overflow-hidden border border-slate-200">
                {[
                  {label:'Device ID',    value:deviceId,                  mono:true,  canHide:false},
                  {label:'Secret Token', value:token,                     mono:true,  canHide:true},
                  {label:'Protocol',     value:protocol,                  mono:false, canHide:false},
                  {label:'Sensor',       value:selectedSensor?.name||'',  mono:false, canHide:false},
                  {label:'Location',     value:selectedSensor?.location||'', mono:false, canHide:false},
                  {label:'Interval',     value:REPORT_INTERVALS.find(r=>r.value===interval)?.label||`${interval}s`, mono:false, canHide:false},
                ].map((row,i)=>(
                  <div key={row.label} className={clsx('flex items-center justify-between px-4 py-3 gap-3',i!==0&&'border-t border-slate-100')}>
                    <span className="text-xs font-bold text-slate-400 w-28 flex-shrink-0">{row.label}</span>
                    <span className={clsx('text-sm font-bold text-slate-800 flex-1 break-all',row.mono&&'font-mono text-xs')}>
                      {row.canHide&&!showToken?'ft_' + '•'.repeat(20):row.value}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {row.canHide&&(
                        <button onClick={()=>setShowToken(v=>!v)}
                          className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
                          {showToken?<EyeOff size={13}/>:<Eye size={13}/>}
                        </button>
                      )}
                      <CopyBtn text={row.value}/>
                    </div>
                  </div>
                ))}
              </div>

              {/* Code snippet */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-600">
                    {protocol==='MQTT'?'Python (paho-mqtt)':protocol==='HTTP'?'cURL / Python':'Node.js'} Starter Code
                  </label>
                  <CopyBtn text={snippet}/>
                </div>
                <pre className="rounded-2xl p-4 text-[11px] leading-relaxed overflow-x-auto"
                  style={{background:'#0f172a',color:'#94a3b8',fontFamily:'ui-monospace,monospace',border:'1px solid #1e293b'}}>
                  <code style={{color:'#e2e8f0'}}>{snippet}</code>
                </pre>
              </div>

              <div className="rounded-xl p-3 text-xs flex gap-2" style={{background:'#fffbeb',border:'1px solid #fde68a',color:'#92400e'}}>
                <span>⚠️</span>
                <span><strong>Keep your Secret Token private.</strong> Anyone with it can post data to this sensor. If exposed, delete this device and register a new one to get a fresh token.</span>
              </div>
            </div>
          )}

          {/* Step 3 — Verify */}
          {step===3&&(
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 mb-1">Verify Connection</h3>
                <p className="text-sm text-slate-500">The device is registered. Run the snippet on it — this waits for a real reading to arrive and tells you what it was.</p>
              </div>

              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                {/* Terminal header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100" style={{background:'#f8fafc'}}>
                  <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400"/><div className="w-3 h-3 rounded-full bg-amber-400"/><div className="w-3 h-3 rounded-full bg-green-400"/></div>
                  <span className="text-xs font-mono text-slate-400 ml-2">isibaya connection test — {deviceId}</span>
                </div>
                {/* Terminal body */}
                <div className="p-4 min-h-[120px]" style={{background:'#0f172a'}}>
                  {testLog.length===0&&testState==='idle'&&(
                    <p className="text-slate-500 text-xs font-mono">$ Press "Wait for reading", then run the snippet on your device...</p>
                  )}
                  {testLog.map((line,i)=>(
                    <p key={i} className={clsx('text-xs font-mono mb-1',line.startsWith('✓')?'text-green-400':line.startsWith('✗')?'text-red-400':line.startsWith('⚠')?'text-amber-400':'text-slate-300')}>{`> ${line}`}</p>
                  ))}
                  {testState==='waiting'&&(
                    <p className="text-xs font-mono text-slate-500 animate-pulse">{'> ▋'}</p>
                  )}
                  {testState==='done'&&(
                    <div className="mt-3 p-3 rounded-xl text-xs font-mono" style={{background:'rgba(34,197,94,.1)',border:'1px solid rgba(34,197,94,.2)'}}>
                      <p className="text-green-400 font-bold">✓ Reading received and stored.</p>
                      <p className="text-slate-400 mt-1"><span className="text-white font-bold">{deviceId}</span> is live. Its readings now drive this sensor.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={runTest} disabled={testState==='waiting'}
                  className={clsx('flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all',
                    testState==='waiting'?'opacity-60 cursor-not-allowed':'hover:opacity-90')}
                  style={{background:'linear-gradient(135deg,#0f172a,#1e293b)',color:testState==='done'?'#4ade80':'#94a3b8',border:'1px solid #334155'}}>
                  <RefreshCw size={14} className={testState==='waiting'?'animate-spin':''}/> {testState==='waiting'?'Waiting for a reading…':testState==='done'?'Wait again':'Wait for reading'}
                </button>
                {testState==='done'&&(
                  <button onClick={finish}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all"
                    style={{background:'linear-gradient(135deg,#16a34a,#15803d)'}}>
                    <Check size={14}/> Done
                  </button>
                )}
              </div>

              {testState!=='done'&&(
                <p className="text-xs text-slate-400 text-center">You can close this now — the device is already registered and stays <strong>Pending</strong> until its first reading arrives, whenever that is.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <button onClick={()=>step===0?onClose():setStep(s=>s-1)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
            <ChevronLeft size={14}/> {step===0?'Cancel':'Back'}
          </button>
          <span className="text-xs text-slate-400">Step {step+1} of {STEPS.length}</span>
          {step<3?(
            <button onClick={next} disabled={!canNext()}
              className={clsx('flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all',!canNext()?'opacity-40 cursor-not-allowed':'hover:opacity-90')}
              style={{background:'linear-gradient(135deg,#16a34a,#15803d)'}}>
              Next <ChevronRight size={14}/>
            </button>
          ):(
            <button onClick={finish}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all"
              style={{background:'linear-gradient(135deg,#16a34a,#15803d)'}}>
              <Check size={14}/> Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Config Viewer Modal ────────────────────────────────────────────── */

function ConfigViewer({device:d, sensor, onClose}){
  const proto = PROTOCOLS.find(p=>p.id===d.protocol)||PROTOCOLS[0];
  const snippet = getCodeSnippet(d.protocol, d.deviceId, d.token, sensor);
  const [showToken,setShowToken] = useState(false);
  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(15,23,42,.45)',backdropFilter:'blur(4px)'}}>
      <div className="w-full max-w-xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]" style={{background:'#fff',boxShadow:'0 20px 60px rgba(0,0,0,.2)'}}>
        <div className="flex items-center justify-between px-6 py-5 flex-shrink-0" style={{background:'linear-gradient(135deg,#0f172a,#1e293b)'}}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.3)'}}><Terminal size={16} color="#22c55e"/></div>
            <div><div className="text-white font-extrabold text-base">Device Configuration</div><div className="text-slate-400 text-xs mt-0.5">{d.deviceId} · <span style={{color:proto.color}}>{proto.label}</span></div></div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20}/></button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1 flex flex-col gap-5">
          <div className="rounded-2xl overflow-hidden border border-slate-200">
            {[
              {label:'Device ID',    value:d.deviceId, mono:true,  canHide:false},
              {label:'Secret Token', value:d.token,    mono:true,  canHide:true},
              {label:'Protocol',     value:d.protocol, mono:false, canHide:false},
              {label:'Sensor',       value:sensor?.name||'—',      mono:false, canHide:false},
              {label:'Location',     value:sensor?.location||'—',  mono:false, canHide:false},
              {label:'Interval',     value:REPORT_INTERVALS.find(r=>r.value===d.reportingInterval)?.label||`${d.reportingInterval}s`, mono:false, canHide:false},
            ].map((row,i)=>(
              <div key={row.label} className={clsx('flex items-center justify-between px-4 py-3 gap-3',i!==0&&'border-t border-slate-100')}>
                <span className="text-xs font-bold text-slate-400 w-28 flex-shrink-0">{row.label}</span>
                <span className={clsx('text-sm font-bold text-slate-800 flex-1 break-all',row.mono&&'font-mono text-xs')}>
                  {row.canHide&&!showToken?'ft_'+'•'.repeat(20):row.value}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {row.canHide&&<button onClick={()=>setShowToken(v=>!v)} className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">{showToken?<EyeOff size={13}/>:<Eye size={13}/>}</button>}
                  <CopyBtn text={row.value}/>
                </div>
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-600">Starter Code</label>
              <CopyBtn text={snippet}/>
            </div>
            <pre className="rounded-2xl p-4 text-[11px] leading-relaxed overflow-x-auto" style={{background:'#0f172a',color:'#e2e8f0',fontFamily:'ui-monospace,monospace',border:'1px solid #1e293b'}}><code>{snippet}</code></pre>
          </div>
        </div>
        <div className="px-6 pb-5 pt-2 border-t border-slate-100">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">Close</button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */

export default function Sensors(){
  const { sensors, addSensor, removeSensor, addManualReading, removeManualReading, clearManualOverride, manualReadings, devices, addDevice, updateDevice, removeDevice, zones } = useData();

  const [tab,setTab]               = useState('dashboard');
  const [cat,setCat]               = useState('All');
  const [activeManual,setActiveManual] = useState(null);
  const [showAdd,setShowAdd]       = useState(false);
  const [deleteTarget,setDeleteTarget] = useState(null);
  const [showWizard,setShowWizard] = useState(false);
  const [configDevice,setConfigDevice] = useState(null);

  const categories   = useMemo(()=>['All',...new Set(sensors.map(s=>s.category))],[sensors]);
  const existingLocs = useMemo(()=>[...new Set([...zones.map(z=>z.name),...sensors.map(s=>s.location)].filter(Boolean))],[sensors,zones]);
  const shown        = cat==='All'?sensors:sensors.filter(s=>s.category===cat);
  const alerts       = sensors.filter(s=>s.status!=='normal');
  const normalCount  = sensors.filter(s=>s.status==='normal').length;
  const warnCount    = sensors.filter(s=>s.status==='warn').length;
  const alertCount   = sensors.filter(s=>s.status==='alert').length;
  const manualCount  = sensors.filter(s=>s.isManual).length;
  const onlineCount  = devices.filter(d=>d.status==='online').length;
  const pendingCount = devices.filter(d=>d.status==='pending').length;

  const card = {background:'#ffffff',borderRadius:20,border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,.04),0 4px 16px rgba(0,0,0,.04)',padding:24};

  const handleTestConnection = (device) => {
    // Simulate a successful ping after 1.5s
    setTimeout(()=>{
      updateDevice({...device, status:'online', lastSeen:new Date().toISOString()});
    },1500);
    updateDevice({...device, status:'pending'});
  };

  const configSensor = configDevice ? sensors.find(s=>s.id===configDevice.sensorId) : null;

  return(
    <div className="flex flex-col gap-5 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Farm Sensors</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time IoT monitoring — {sensors.length} sensors
            {manualCount>0&&<span className="ml-2 text-violet-500 font-semibold">· {manualCount} manual override{manualCount>1?'s':''}</span>}
            {devices.length>0&&<span className="ml-2 text-blue-500 font-semibold">· {onlineCount}/{devices.length} devices online</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab==='dashboard'?(
            <button onClick={()=>setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all shadow-sm"
              style={{background:'linear-gradient(135deg,#16a34a,#15803d)'}}>
              <Plus size={15}/> Add Sensor
            </button>
          ):(
            <button onClick={()=>setShowWizard(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all shadow-sm"
              style={{background:'linear-gradient(135deg,#0f172a,#1e293b)'}}>
              <Cpu size={15}/> Register Device
            </button>
          )}
          <div className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl"
            style={{background:'linear-gradient(135deg,#f0fdf4,#dcfce7)',color:'#15803d',border:'1px solid #bbf7d0'}}>
            <div className="w-2 h-2 rounded-full bg-green-500 pulse"/>
            Live · Updated now
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit" style={{background:'#f1f5f9',border:'1px solid #e2e8f0'}}>
        {[{id:'dashboard',label:'Live Dashboard',icon:'📊'},{id:'setup',label:'Device Setup',icon:'⚙️'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={clsx('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all',
              tab===t.id?'text-slate-900 shadow-sm bg-white':'text-slate-500 hover:text-slate-700')}>
            <span>{t.icon}</span>{t.label}
            {t.id==='setup'&&devices.length>0&&(
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{background:'#3b82f6'}}>{devices.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════ DASHBOARD TAB ════════════════ */}
      {tab==='dashboard'&&(
        <>
          {alerts.length>0&&(
            <div className="flex flex-col gap-2">
              {alerts.filter(s=>s.status==='alert').map(s=>(
                <AlertBox key={s.id} color="red"><strong>{s.icon} {s.name}</strong> at <strong>{s.location}</strong> is CRITICAL — {s.value}{s.unit}{s.isManual&&<span className="ml-1 text-xs font-bold">(manual)</span>}</AlertBox>
              ))}
              {alerts.filter(s=>s.status==='warn').map(s=>(
                <AlertBox key={s.id} color="amber"><strong>{s.icon} {s.name}</strong> at <strong>{s.location}</strong> — {s.value}{s.unit} approaching threshold{s.isManual&&<span className="ml-1 text-xs font-bold">(manual)</span>}</AlertBox>
              ))}
            </div>
          )}

          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(c=>(
              <button key={c} onClick={()=>setCat(c)}
                className={clsx('px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all',
                  cat===c?'text-white shadow-sm':'bg-white border border-slate-200 text-slate-600 hover:border-green-400 hover:text-green-700')}
                style={cat===c?{background:'linear-gradient(135deg,#16a34a,#15803d)'}:{}}>
                {c}
              </button>
            ))}
          </div>

          {/* Sensor grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {shown.map(s=>(
              <SensorCard key={s.id} sensor={s} onManualEntry={setActiveManual} onClearOverride={clearManualOverride} onDelete={setDeleteTarget}/>
            ))}
            <button onClick={()=>setShowAdd(true)}
              className="rounded-2xl border-2 border-dashed border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all flex flex-col items-center justify-center gap-2 p-4 min-h-[180px] text-slate-400 hover:text-green-600 group">
              <div className="w-10 h-10 rounded-xl border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-all"><Plus size={20}/></div>
              <span className="text-xs font-bold">Add Sensor</span>
            </button>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div style={card}>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Temperature Trend (24h)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={TEMP_DATA}>
                  <defs>
                    <linearGradient id="gb2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
                    <linearGradient id="ga2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                  <XAxis dataKey="t" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} interval={2}/>
                  <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} unit="°"/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Legend iconSize={10} iconType="circle" formatter={v=><span style={{fontSize:11,color:'#64748b'}}>{v}</span>}/>
                  <Area type="monotone" dataKey="barn" stroke="#22c55e" strokeWidth={2.5} fill="url(#gb2)" name="Barn 1" dot={false} activeDot={{r:4,strokeWidth:0}}/>
                  <Area type="monotone" dataKey="hen" stroke="#f59e0b" strokeWidth={2.5} fill="url(#ga2)" name="Hen House" dot={false} activeDot={{r:4,strokeWidth:0}}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Sensor Status Summary</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={[{name:'Normal',value:normalCount},{name:'Warning',value:warnCount},{name:'Critical',value:alertCount}]} dataKey="value" cx="40%" cy="50%" outerRadius={78} innerRadius={30} paddingAngle={3}>
                    <Cell fill="#22c55e"/><Cell fill="#f59e0b"/><Cell fill="#ef4444"/>
                  </Pie>
                  <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={10} iconType="circle" formatter={v=><span style={{fontSize:11,color:'#64748b'}}>{v}</span>}/>
                  <Tooltip contentStyle={{background:'#1e293b',border:'none',borderRadius:10,color:'#f1f5f9'}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Manual Readings Log */}
          <div style={card}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#f5f3ff,#ede9fe)',border:'1px solid #ddd6fe'}}><ClipboardList size={15} color="#7c3aed"/></div>
              <div><h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider leading-none">Manual Readings Log</h3><p className="text-xs text-slate-400 mt-0.5">All manually captured sensor data</p></div>
              {manualReadings.length>0&&<span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-lg" style={{background:'#ede9fe',color:'#7c3aed'}}>{manualReadings.length} entr{manualReadings.length===1?'y':'ies'}</span>}
            </div>
            {manualReadings.length===0?(
              <div className="text-center py-10"><div className="text-3xl mb-2">📋</div><p className="text-sm font-semibold text-slate-400">No manual readings yet</p><p className="text-xs text-slate-300 mt-1">Click <strong className="text-violet-400">Manual Entry</strong> on any sensor card</p></div>
            ):(
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr>{['Sensor','Location','Value','Reason','Notes','Logged At',''].map(h=><th key={h} className="pb-2.5 pr-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {manualReadings.map(r=>(
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 pr-4 font-semibold text-slate-800 whitespace-nowrap">{r.sensorName}</td>
                        <td className="py-2.5 pr-4 whitespace-nowrap"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-xs">📍 {r.location}</span></td>
                        <td className="py-2.5 pr-4 font-bold whitespace-nowrap" style={{color:'#7c3aed'}}>{r.value}{r.unit}</td>
                        <td className="py-2.5 pr-4 text-slate-600 text-xs whitespace-nowrap">{r.reason}</td>
                        <td className="py-2.5 pr-4 text-slate-400 text-xs max-w-[160px] truncate">{r.notes||'—'}</td>
                        <td className="py-2.5 pr-4 text-slate-400 text-xs whitespace-nowrap">{formatLoggedAt(r.loggedAt)}</td>
                        <td className="py-2.5">
                          <button onClick={()=>removeManualReading(r.id)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 size={13}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ════════════════ DEVICE SETUP TAB ════════════════ */}
      {tab==='setup'&&(
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {label:'Registered Devices', value:devices.length, icon:'🖥️', color:'#3b82f6', bg:'#eff6ff', border:'#bfdbfe'},
              {label:'Online',             value:onlineCount,    icon:'🟢', color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0'},
              {label:'Pending Setup',      value:pendingCount,   icon:'🟡', color:'#d97706', bg:'#fffbeb', border:'#fde68a'},
              {label:'Offline',            value:devices.filter(d=>d.status==='offline').length, icon:'🔴', color:'#dc2626', bg:'#fff5f5', border:'#fca5a5'},
            ].map(s=>(
              <div key={s.label} className="rounded-2xl p-4" style={{background:s.bg,border:`1px solid ${s.border}`}}>
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="text-2xl font-extrabold" style={{color:s.color}}>{s.value}</div>
                <div className="text-xs font-semibold text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Devices list */}
          {devices.length===0?(
            <div style={card}>
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{background:'linear-gradient(135deg,#f0fdf4,#dcfce7)',border:'1px solid #bbf7d0'}}>
                  <Cpu size={28} color="#16a34a"/>
                </div>
                <h3 className="text-base font-extrabold text-slate-700 mb-2">No devices registered yet</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">Register your physical IoT hardware — Arduino, Raspberry Pi, ESP32, or any HTTP/MQTT device — and link it to a sensor on the dashboard.</p>
                <button onClick={()=>setShowWizard(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white mx-auto hover:opacity-90 transition-all"
                  style={{background:'linear-gradient(135deg,#0f172a,#1e293b)'}}>
                  <Cpu size={15}/> Register Your First Device
                </button>
              </div>
            </div>
          ):(
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map(d=>(
                <DeviceCard key={d.id} device={d}
                  sensor={sensors.find(s=>s.id===d.sensorId)}
                  onViewConfig={setConfigDevice}
                  onRemove={removeDevice}
                  onTestConnection={handleTestConnection}
                />
              ))}
              {/* Add another */}
              <button onClick={()=>setShowWizard(true)}
                className="rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-2 p-6 min-h-[200px] text-slate-400 hover:text-blue-500 group">
                <div className="w-12 h-12 rounded-xl border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-all"><Cpu size={22}/></div>
                <span className="text-xs font-bold">Register Another Device</span>
              </button>
            </div>
          )}

          {/* Protocol guide */}
          <div style={card}>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">📶 Supported Protocols</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PROTOCOLS.map(p=>(
                <div key={p.id} className="rounded-xl p-4" style={{background:p.bg,border:`1px solid ${p.border}`}}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{p.icon}</span>
                    <span className="font-extrabold text-sm" style={{color:p.color}}>{p.label}</span>
                    {p.badge&&<span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{background:p.color}}>{p.badge}</span>}
                  </div>
                  <p className="text-xs text-slate-600 mb-3">{p.description}</p>
                  <div className="flex flex-col gap-1">
                    {p.useCases.map(u=><div key={u} className="flex items-center gap-1.5 text-xs text-slate-500"><span style={{color:p.color}}>•</span>{u}</div>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {showAdd&&<AddSensorModal existingLocations={existingLocs} onClose={()=>setShowAdd(false)} onSave={s=>{addSensor(s);setShowAdd(false);}}/>}
      {activeManual&&<ManualEntryModal sensor={activeManual} onClose={()=>setActiveManual(null)} onSave={r=>{addManualReading(r);setActiveManual(null);}}/>}
      {deleteTarget&&<DeleteConfirm sensor={deleteTarget} onClose={()=>setDeleteTarget(null)} onConfirm={removeSensor}/>}
      {/* onComplete only registers the device — it fires on the way into the
          Verify step, which needs the wizard to stay open so the reading can
          be waited for. Closing is onClose's job. */}
      {showWizard&&<RegisterDeviceWizard sensors={sensors} onClose={()=>{setShowWizard(false);setTab('setup');}} onComplete={d=>addDevice(d)}/>}
      {configDevice&&<ConfigViewer device={configDevice} sensor={configSensor} onClose={()=>setConfigDevice(null)}/>}
    </div>
  );
}
