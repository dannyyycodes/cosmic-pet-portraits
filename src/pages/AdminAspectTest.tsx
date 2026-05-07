/**
 * /admin/aspect-test — internal smoke test for canvas-aspect coverage.
 *
 * Generates one gpt-image-2 image per aspect group (4:5 / 3:4 / 5:7 / 2:3 / 1:1)
 * from a single prompt + photo. Lets us eyeball that gpt-image-2 holds up at
 * every Gelato canvas SKU before wiring the auto-regen into checkout.
 *
 * Auth: gated by a simple admin secret typed into the page (matches the
 * server's ADMIN_TEST_SECRET env). Stored in sessionStorage so we don't
 * have to retype on every test. Don't link this page anywhere public.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';

type AspectResult = {
  key: string;
  label: string;
  width: number;
  height: number;
  skuExamples: string[];
  url: string | null;
  error: string | null;
};

const ADMIN_KEY_STORAGE = 'pawtraits.adminTestKey';

export default function AdminAspectTest() {
  const [adminKey, setAdminKey] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [petName, setPetName] = useState('');
  const [mode, setMode] = useState<'preview' | 'print'>('preview');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<AspectResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_KEY_STORAGE);
    if (stored) setAdminKey(stored);
  }, []);

  function persistAdminKey(k: string) {
    setAdminKey(k);
    sessionStorage.setItem(ADMIN_KEY_STORAGE, k);
  }

  async function uploadPhoto(file: File): Promise<string> {
    // Quick + dirty: upload to a free image host (no auth needed) — postimages?
    // Actually safer: use the existing supabase pet-photos bucket.
    // Even simpler for admin testing: convert to data URL since fal accepts URLs.
    // gpt-image-2 needs a real URL it can fetch — data URLs may not work.
    // So upload to a temp endpoint... but that's complex. For admin testing,
    // require the user to host the image themselves OR paste a URL.
    return URL.createObjectURL(file);  // local blob URL — only works if fal can fetch it (it can't)
  }

  async function handleGenerate() {
    setError(null);
    setResults(null);
    if (!adminKey) { setError('Admin secret required'); return; }
    if (!photoUrl) { setError('Photo URL required (paste a public image URL)'); return; }
    if (!prompt.trim()) { setError('Prompt required'); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/portraits?action=test-aspects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-test-secret': adminKey,
        },
        body: JSON.stringify({
          imageUrl: photoUrl,
          prompt: prompt.trim(),
          petName: petName.trim() || undefined,
          mode,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || `Request failed (${r.status})`);
        return;
      }
      setResults(data.aspects ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#f5f5f5' }}>
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2 text-sm" style={{ color: '#9a8578' }}>
            <ArrowLeft className="w-4 h-4" /> Back home
          </Link>
          <div className="text-xs uppercase tracking-widest" style={{ color: '#9a8578' }}>
            internal · canvas aspect smoke test
          </div>
        </div>

        <h1 className="text-3xl font-serif mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Canvas aspect smoke test
        </h1>
        <p className="text-sm mb-8" style={{ color: '#aaa', maxWidth: 600 }}>
          Generates one gpt-image-2 image per aspect group from one prompt + photo.
          Use this to eyeball that text + face hold across every canvas SKU before
          wiring auto-regen into checkout.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest mb-1" style={{ color: '#9a8578' }}>
                Admin secret (matches Vercel env ADMIN_TEST_SECRET)
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => persistAdminKey(e.target.value)}
                className="w-full px-3 py-2 rounded bg-neutral-900 border border-neutral-800 text-white"
                placeholder="paste secret"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest mb-1" style={{ color: '#9a8578' }}>
                Photo URL (publicly fetchable — paste a Supabase / Imgur / direct URL)
              </label>
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full px-3 py-2 rounded bg-neutral-900 border border-neutral-800 text-white"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest mb-1" style={{ color: '#9a8578' }}>
                Prompt (the artistic transformation)
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded bg-neutral-900 border border-neutral-800 text-white"
                placeholder="watercolour floral portrait with soft botanical wreath frame"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest mb-1" style={{ color: '#9a8578' }}>
                Pet name (optional, tests text rendering)
              </label>
              <input
                type="text"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                className="w-full px-3 py-2 rounded bg-neutral-900 border border-neutral-800 text-white"
                placeholder="Rosie"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest mb-1" style={{ color: '#9a8578' }}>
                Render size
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="mode" checked={mode === 'preview'} onChange={() => setMode('preview')} />
                  <span>Preview (1024×N · ~£0.04/img × 5 = £0.20)</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="mode" checked={mode === 'print'} onChange={() => setMode('print')} />
                  <span>Print (2048×N · ~£0.10/img × 5 = £0.50)</span>
                </label>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={busy}
              className="w-full py-3 rounded font-semibold disabled:opacity-50"
              style={{ background: '#bf524a', color: '#fff' }}
            >
              {busy ? (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Generating 5 aspects in parallel… (~10-20s)
                </span>
              ) : 'Generate all 5 aspects →'}
            </button>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          {/* Source preview */}
          <div className="space-y-4">
            <label className="block text-xs uppercase tracking-widest" style={{ color: '#9a8578' }}>
              Source photo
            </label>
            {photoUrl ? (
              <img src={photoUrl} alt="source" className="w-full rounded border border-neutral-800" />
            ) : (
              <div className="aspect-square rounded border border-dashed border-neutral-700 flex items-center justify-center text-sm text-neutral-500">
                paste a URL on the left
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {results && (
          <div>
            <h2 className="text-xl font-serif mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              Results — eyeball each one
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {results.map((r) => (
                <div key={r.key} className="space-y-2">
                  <div className="text-xs uppercase tracking-widest" style={{ color: '#bf524a' }}>
                    {r.label}
                  </div>
                  <div className="text-[10px]" style={{ color: '#aaa' }}>
                    {r.width}×{r.height} · SKUs: {r.skuExamples.join(', ')}
                  </div>
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={r.url}
                        alt={r.label}
                        className="w-full rounded border border-neutral-800 hover:border-neutral-600"
                        style={{ aspectRatio: `${r.width}/${r.height}` }}
                      />
                    </a>
                  ) : (
                    <div
                      className="w-full rounded border border-red-900 bg-red-950/30 p-3 text-xs text-red-300"
                      style={{ aspectRatio: `${r.width}/${r.height}` }}
                    >
                      Failed: {r.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs" style={{ color: '#9a8578' }}>
              Click any image to open the full-resolution version in a new tab.
              Check: face is preserved (matches the source pet), name renders cleanly
              along the lower margin (if set), each aspect feels well-composed not
              awkwardly stretched.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
