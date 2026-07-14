import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { RevealExperience } from '@/components/reveal/RevealExperience';
import type { RevealReport } from '@/components/reveal/types';

/**
 * PREVIEW route for the new "Starlight Scroll" reveal (Phase 1).
 * Non-destructive: the live paid viewer stays on /report (CosmicReportViewer).
 * Open with:  /reveal-preview?id=<reportId>&token=<shareToken>
 */
export default function RevealPreview() {
  const [params] = useSearchParams();
  const [data, setData] = useState<RevealReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reportId = params.get('id');
  const shareToken = params.get('share') || params.get('token') || undefined;
  const code = params.get('code') || undefined;
  const forceDemo = params.get('demo') === '1';

  useEffect(() => {
    let cancelled = false;

    const mapResponse = (res: any): RevealReport => ({
      petName: res.petName || 'Little Soul',
      species: res.species,
      breed: res.breed,
      gender: res.gender,
      reportId: reportId || res.reportId,
      shareToken: res.shareToken || shareToken,
      petPhotoUrl: res.petPhotoUrl,
      portraitUrl: res.portraitUrl,
      occasionMode: res.occasionMode || 'discover',
      hasActiveHoroscope: res.hasActiveHoroscope,
      ownerAnswers: res.ownerAnswers,
      report: res.report,
    });

    // Bundled sample (same-origin, no CORS). Lets the preview render the real
    // shaped test reading on ANY origin — e.g. a Vercel branch preview, where
    // the get-report edge fn's origin lock would otherwise block the fetch.
    const loadDemo = async () => {
      const r = await fetch('/reveal-demo-report.json');
      if (!r.ok) throw new Error('Demo reading unavailable.');
      return mapResponse(await r.json());
    };

    async function run() {
      // explicit demo, or a bare link with nothing to fetch
      if (forceDemo || (!reportId && !code)) {
        try { const d = await loadDemo(); if (!cancelled) setData(d); }
        catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : 'Something went wrong.'); }
        return;
      }
      try {
        const { data: res, error: fnErr } = await supabase.functions.invoke('get-report', {
          body: { reportId: reportId || undefined, shareToken, giftCode: code },
        });
        if (fnErr) throw new Error(fnErr.message || 'Failed to load');
        if (res?.error) throw new Error(res.error);
        if (!res?.report) throw new Error('This reading has no content yet.');
        if (!cancelled) setData(mapResponse(res));
      } catch (e) {
        // live fetch failed (often CORS on a non-production origin) — fall back
        // to the bundled sample so the reveal still renders for review.
        try { const d = await loadDemo(); if (!cancelled) setData(d); }
        catch { if (!cancelled) setError(e instanceof Error ? e.message : 'Something went wrong.'); }
      }
    }
    run();
    return () => { cancelled = true; };
  }, [reportId, shareToken, code, forceDemo]);

  if (error) {
    return (
      <div style={fullStage}>
        <div style={{ maxWidth: 420, textAlign: 'center', color: '#B8AECF', fontFamily: 'Assistant, system-ui, sans-serif' }}>
          <p style={{ fontFamily: 'Fraunces, serif', fontSize: 26, color: '#F4EEFF', marginBottom: 12 }}>The stars are quiet</p>
          <p style={{ fontSize: 15, lineHeight: 1.6 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={fullStage}>
        <div style={{ textAlign: 'center', color: '#BBA7FF', fontFamily: 'Assistant, system-ui, sans-serif' }}>
          <div style={loader} />
          <p style={{ marginTop: 20, fontSize: 12, letterSpacing: '0.34em', textTransform: 'uppercase' }}>Aligning the stars</p>
        </div>
      </div>
    );
  }

  return <RevealExperience data={data} />;
}

const fullStage: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: '#0b0616', padding: 24,
};
const loader: React.CSSProperties = {
  width: 46, height: 46, margin: '0 auto', borderRadius: '50%',
  border: '2px solid rgba(187,167,255,0.25)', borderTopColor: '#BBA7FF',
  animation: 'rvspin 0.9s linear infinite',
};
