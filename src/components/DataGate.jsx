import { useState } from 'react';
import { UploadCloud, Check, X, Loader2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { readLegacyData, clearLegacyData } from '../lib/legacyData';
import { Btn } from './FormField';

/**
 * Holds the app back until the farm data has loaded, and offers a one-time
 * move of anything still sitting in this browser from before the data lived
 * on the server — otherwise that work would look like it had vanished.
 */
export function DataGate({ children }) {
  const { loading, error, livestock, importLegacy } = useData();
  const [legacy] = useState(() => readLegacyData());
  const [phase, setPhase] = useState('offer');   // offer | busy | done | dismissed
  const [result, setResult] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 40%, #bbf7d0 100%)' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin" style={{ color: '#15803d' }} />
          <p className="text-sm font-medium text-green-900/70">Loading your farm…</p>
        </div>
      </div>
    );
  }

  // Only worth offering when this browser holds something and the account is
  // still empty — the server refuses the import otherwise.
  const canImport = legacy.rows > 0 && livestock.length === 0 && phase !== 'dismissed';

  const runImport = async () => {
    setPhase('busy');
    const res = await importLegacy(legacy.payload);
    if (!res.ok) { setResult({ error: res.error }); setPhase('offer'); return; }
    clearLegacyData();
    setResult({ counts: res.counts });
    setPhase('done');
  };

  return (
    <>
      {error && (
        <div className="px-4 pt-4">
          <div className="rounded-xl px-4 py-3 text-sm font-medium"
            style={{ background: '#fff5f5', border: '1px solid #fca5a5', color: '#b91c1c' }}>
            {error}
          </div>
        </div>
      )}

      {canImport && phase !== 'done' && (
        <div className="px-4 pt-4">
          <div className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#dbeafe' }}>
              <UploadCloud size={20} style={{ color: '#1d4ed8' }} />
            </div>
            <div className="flex-1">
              <div className="font-bold text-slate-900">Bring your existing farm data across</div>
              <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">
                This browser still holds {legacy.rows} record{legacy.rows === 1 ? '' : 's'} from
                before your data moved to your account. Import them and they'll be available on
                every device you sign in from.
              </p>
              {result?.error && <p className="text-sm font-medium text-red-600 mt-2">{result.error}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Btn onClick={runImport} disabled={phase === 'busy'}>
                {phase === 'busy'
                  ? <span className="flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" />Importing…</span>
                  : 'Import now'}
              </Btn>
              <button onClick={() => setPhase('dismissed')} title="Not now"
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'done' && result?.counts && (
        <div className="px-4 pt-4">
          <div className="rounded-2xl p-4 flex items-start gap-3"
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <Check size={18} className="mt-0.5 flex-shrink-0" style={{ color: '#15803d' }} />
            <div className="text-sm text-green-900">
              <strong>Imported.</strong>{' '}
              {Object.entries(result.counts).map(([k, v]) => `${v} ${k}`).join(', ') || 'Nothing to bring across'}.
              It's on your account now, not just this browser.
            </div>
          </div>
        </div>
      )}

      {children}
    </>
  );
}
