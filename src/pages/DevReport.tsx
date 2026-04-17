// Dev-only preview route. Renders the full report UI from a local fixture
// so design iterations don't burn Claude tokens or touch Supabase.
//
//   /dev/report                          → default fixture (Monty)
//   /dev/report?fixture=monty            → named fixture from src/fixtures/
//   /dev/report?stage=generating         → 2-min wait screen preview
//   /dev/report?stage=reveal             → cinematic reveal only
//   /dev/report?stage=viewer             → full viewer (default)
//
// Accessible in prod too, but gated behind DEV or ?devkey=littlesouls.
import { Suspense, lazy, useEffect, useState } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { ReportGenerating } from '@/components/report/ReportGenerating';
import { EmotionalReportReveal } from '@/components/report/EmotionalReportReveal';

const CosmicReportViewer = lazy(() =>
  import('@/components/report/CosmicReportViewer').then((m) => ({ default: m.CosmicReportViewer }))
);

const FIXTURES = {
  monty: () => import('@/fixtures/report-monty.json'),
} as const;

type FixtureKey = keyof typeof FIXTURES;
type Stage = 'generating' | 'reveal' | 'viewer';

const DEV_KEY = 'littlesouls';

export default function DevReport() {
  const [params] = useSearchParams();
  const fixtureKey = (params.get('fixture') || 'monty') as FixtureKey;
  const stage = (params.get('stage') || 'viewer') as Stage;
  const devkey = params.get('devkey');

  const gateOpen = import.meta.env.DEV || devkey === DEV_KEY;

  const [fixture, setFixture] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!gateOpen) return;
    const loader = FIXTURES[fixtureKey];
    if (!loader) {
      setErr(`Unknown fixture "${fixtureKey}". Available: ${Object.keys(FIXTURES).join(', ')}`);
      return;
    }
    loader()
      .then((m: any) => setFixture(m.default ?? m))
      .catch((e) => setErr(String(e)));
  }, [fixtureKey, gateOpen]);

  if (!gateOpen) return <Navigate to="/" replace />;

  if (err) {
    return (
      <div className="min-h-screen bg-[#faf6ef] text-[#3d2f2a] p-8 font-mono text-sm">
        <h1 className="text-xl font-bold mb-4">DevReport error</h1>
        <pre className="whitespace-pre-wrap">{err}</pre>
      </div>
    );
  }

  if (!fixture) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf6ef] text-[#5a4a42]">
        Loading fixture…
      </div>
    );
  }

  if (stage === 'generating') {
    return (
      <ReportGenerating
        petName={fixture.petName}
        petPhotoUrl={fixture.petPhotoUrl}
        reportId={fixture.reportId}
      />
    );
  }

  if (stage === 'reveal') {
    return (
      <EmotionalReportReveal
        petName={fixture.petName}
        report={fixture.report}
        onComplete={() => {
          const url = new URL(window.location.href);
          url.searchParams.set('stage', 'viewer');
          window.history.replaceState(null, '', url.toString());
          window.location.reload();
        }}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#faf6ef]">Loading viewer…</div>
      }
    >
      <CosmicReportViewer
        petName={fixture.petName}
        report={fixture.report}
        reportId={fixture.reportId}
        portraitUrl={fixture.portraitUrl}
        petPhotoUrl={fixture.petPhotoUrl}
        occasionMode={fixture.occasionMode}
        species={fixture.species}
      />
    </Suspense>
  );
}
