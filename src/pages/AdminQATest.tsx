import { useState, useRef, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';

// --- Types ---

type TestStatus = 'idle' | 'redeeming' | 'updating' | 'generating' | 'polling' | 'checking' | 'done' | 'error';

interface Check {
  label: string;
  passed: boolean | null;
}

interface TestPet {
  name: string;
  species: string;
  breed: string;
  gender: string;
  birthDate: string;
  birthTime: string;
  location: string;
  soulType: string;
  superpower: string;
  strangerReaction: string;
  occasionMode: string;
  expectedSign: string;
}

interface TestState {
  status: TestStatus;
  reportId: string | null;
  shareToken: string | null;
  error: string | null;
  checks: Check[];
  reportJson: any;
  elapsed: number;
  showJson: boolean;
}

// --- Preset test pets ---

const TEST_PETS: TestPet[] = [
  {
    name: 'Luna', species: 'cat', breed: 'Siamese', gender: 'female',
    birthDate: '2021-07-10', birthTime: '09:30', location: 'London, UK',
    soulType: 'The Gentle Healer', superpower: 'Emotional Intelligence',
    strangerReaction: 'Cautious Then Obsessed', occasionMode: 'discover',
    expectedSign: 'Cancer',
  },
  {
    name: 'Rex', species: 'dog', breed: 'Golden Retriever', gender: 'male',
    birthDate: '2022-04-05', birthTime: '14:00', location: 'New York, USA',
    soulType: 'The Wild Spirit', superpower: 'Pure Chaos Energy',
    strangerReaction: 'Instant Best Friend', occasionMode: 'discover',
    expectedSign: 'Aries',
  },
  {
    name: 'Buddy', species: 'dog', breed: 'Labrador', gender: 'male',
    birthDate: '2015-06-01', birthTime: '06:00', location: 'Sydney, Australia',
    soulType: 'The Loyal Guardian', superpower: 'Infinite Patience',
    strangerReaction: 'Suspicious Until Trust Earned', occasionMode: 'memorial',
    expectedSign: 'Gemini',
  },
  {
    name: 'Cinnamon', species: 'rabbit', breed: 'Holland Lop', gender: 'female',
    birthDate: '2023-11-05', birthTime: '22:15', location: 'Paris, France',
    soulType: 'The Mischief Maker', superpower: 'Treat Detection',
    strangerReaction: 'Hides Then Investigates', occasionMode: 'discover',
    expectedSign: 'Scorpio',
  },
  {
    name: 'Kiwi', species: 'bird', breed: 'Cockatiel', gender: 'female',
    birthDate: '2017-12-01', birthTime: '11:00', location: 'Tokyo, Japan',
    soulType: 'The Calm Observer', superpower: 'Mind Reading',
    strangerReaction: "Couldn't Care Less", occasionMode: 'memorial',
    expectedSign: 'Sagittarius',
  },
];

// --- Helpers ---

function getZodiacSign(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if ((m === 3 && day >= 21) || (m === 4 && day <= 19)) return 'Aries';
  if ((m === 4 && day >= 20) || (m === 5 && day <= 20)) return 'Taurus';
  if ((m === 5 && day >= 21) || (m === 6 && day <= 20)) return 'Gemini';
  if ((m === 6 && day >= 21) || (m === 7 && day <= 22)) return 'Cancer';
  if ((m === 7 && day >= 23) || (m === 8 && day <= 22)) return 'Leo';
  if ((m === 8 && day >= 23) || (m === 9 && day <= 22)) return 'Virgo';
  if ((m === 9 && day >= 23) || (m === 10 && day <= 22)) return 'Libra';
  if ((m === 10 && day >= 23) || (m === 11 && day <= 21)) return 'Scorpio';
  if ((m === 11 && day >= 22) || (m === 12 && day <= 21)) return 'Sagittarius';
  if ((m === 12 && day >= 22) || (m === 1 && day <= 19)) return 'Capricorn';
  if ((m === 1 && day >= 20) || (m === 2 && day <= 18)) return 'Aquarius';
  return 'Pisces';
}

const READING_SECTIONS = [
  'solarSoulprint', 'lunarHeart', 'cosmicCuriosity', 'harmonyHeartbeats',
  'spiritOfMotion', 'starlitGaze', 'destinyCompass', 'gentleHealer',
  'wildSpirit', 'cosmicExpansion', 'cosmicLessons',
  'elementalNature', 'celestialChoreography', 'earthlyExpression',
  'luminousField', 'celestialGem', 'eternalArchetype', 'keepersBond',
];

const PLANET_KEYS = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
  'uranus', 'neptune', 'pluto', 'northNode', 'chiron', 'ascendant',
];

function runChecks(report: any, pet: TestPet): Check[] {
  const checks: Check[] = [];
  const nameLC = pet.name.toLowerCase();

  checks.push({
    label: 'Prologue exists and mentions pet name',
    passed: !!report.prologue && report.prologue.toLowerCase().includes(nameLC),
  });
  checks.push({
    label: 'Epilogue exists and mentions pet name',
    passed: !!report.epilogue && report.epilogue.toLowerCase().includes(nameLC),
  });
  checks.push({
    label: 'Cosmic nickname exists',
    passed: !!report.cosmicNickname?.nickname,
  });

  const missingSections = READING_SECTIONS.filter(s => !report[s]?.content);
  checks.push({
    label: `All ${READING_SECTIONS.length} reading sections present (${missingSections.length === 0 ? `${READING_SECTIONS.length}/${READING_SECTIONS.length}` : `missing: ${missingSections.join(', ')}`})`,
    passed: missingSections.length === 0,
  });

  const placements = report.chartPlacements || {};
  const missingPlanets = PLANET_KEYS.filter(p => !placements[p]?.sign);
  checks.push({
    label: `chartPlacements has all 13 planets (${PLANET_KEYS.length - missingPlanets.length}/13${missingPlanets.length ? ` — missing: ${missingPlanets.join(', ')}` : ''})`,
    passed: missingPlanets.length === 0,
  });

  const actualSun = placements.sun?.sign;
  checks.push({
    label: `Sun sign matches DOB: expected ${pet.expectedSign}, got ${actualSun || 'none'}`,
    passed: actualSun?.toLowerCase() === pet.expectedSign.toLowerCase(),
  });

  const crimes = report.topFiveCrimes?.crimes || [];
  checks.push({
    label: `topFiveCrimes has 5 entries (got ${crimes.length})`,
    passed: crimes.length === 5,
  });

  checks.push({
    label: 'dominantElement exists',
    passed: !!report.dominantElement,
  });

  checks.push({
    label: 'Archetype has name and description',
    passed: !!report.archetype?.name && !!report.archetype?.description,
  });

  checks.push({
    label: 'Google searches exist',
    passed: Array.isArray(report.googleSearches) && report.googleSearches.length > 0,
  });

  checks.push({
    label: 'Text messages exist',
    passed: !!report.textMessages?.morning && !!report.textMessages?.night,
  });

  checks.push({
    label: 'Playlist has entries',
    passed: Array.isArray(report.playlist) && report.playlist.length > 0,
  });

  return checks;
}

const STATUS_COLORS: Record<TestStatus, string> = {
  idle: '#9a8578',
  redeeming: '#c4a265',
  updating: '#c4a265',
  generating: '#c4a265',
  polling: '#c4a265',
  checking: '#c4a265',
  done: '#4a8c5c',
  error: '#bf524a',
};

const STATUS_LABELS: Record<TestStatus, string> = {
  idle: 'Ready',
  redeeming: 'Redeeming code...',
  updating: 'Updating pet data...',
  generating: 'Triggering generation...',
  polling: 'Waiting for report...',
  checking: 'Running checks...',
  done: 'Complete',
  error: 'Failed',
};

// --- Component ---

export default function AdminQATest() {
  const [redeemCode, setRedeemCode] = useState('QATEST');
  const [tests, setTests] = useState<Record<number, TestState>>(
    Object.fromEntries(TEST_PETS.map((_, i) => [i, {
      status: 'idle' as TestStatus, reportId: null, shareToken: null,
      error: null, checks: [], reportJson: null, elapsed: 0, showJson: false,
    }]))
  );
  const timerRefs = useRef<Record<number, ReturnType<typeof setInterval>>>({});

  const updateTest = useCallback((idx: number, patch: Partial<TestState>) => {
    setTests(prev => ({ ...prev, [idx]: { ...prev[idx], ...patch } }));
  }, []);

  const runTest = useCallback(async (idx: number) => {
    const pet = TEST_PETS[idx];
    const email = `qa+${pet.name.toLowerCase()}@littlesouls.co`;
    const start = Date.now();

    // Start elapsed timer
    if (timerRefs.current[idx]) clearInterval(timerRefs.current[idx]);
    timerRefs.current[idx] = setInterval(() => {
      updateTest(idx, { elapsed: Math.round((Date.now() - start) / 1000) });
    }, 1000);

    const fail = (msg: string) => {
      clearInterval(timerRefs.current[idx]);
      updateTest(idx, { status: 'error', error: msg, elapsed: Math.round((Date.now() - start) / 1000) });
    };

    try {
      // Step 1: Redeem
      updateTest(idx, { status: 'redeeming', reportId: null, shareToken: null, error: null, checks: [], reportJson: null, elapsed: 0 });

      const { data: redeemData, error: redeemError } = await supabase.functions.invoke('redeem-free-code', {
        body: { code: redeemCode, email, petName: pet.name, species: pet.species, occasionMode: pet.occasionMode },
      });

      if (redeemError || !redeemData?.success) {
        return fail(`Redeem failed: ${redeemData?.error || redeemError?.message || 'Unknown error'}`);
      }

      const reportId = redeemData.reportId;
      updateTest(idx, { reportId, status: 'updating' });

      // Step 2: Update pet data
      const { error: updateError } = await supabase.functions.invoke('update-pet-data', {
        body: {
          reportId, petName: pet.name, species: pet.species, breed: pet.breed,
          gender: pet.gender, birthDate: pet.birthDate, birthTime: pet.birthTime,
          location: pet.location, soulType: pet.soulType, superpower: pet.superpower,
          strangerReaction: pet.strangerReaction,
        },
      });

      if (updateError) {
        return fail(`Update pet data failed: ${updateError.message}`);
      }

      // Step 3: Trigger generation
      updateTest(idx, { status: 'generating' });

      const { error: genError } = await supabase.functions.invoke('generate-report-background', {
        body: { reportId },
      });

      if (genError) {
        console.warn(`[QA] Gen trigger warning for ${pet.name}:`, genError.message);
      }

      // Step 4: Poll for report
      updateTest(idx, { status: 'polling' });

      let report: any = null;
      let shareToken: string | null = null;
      for (let attempt = 0; attempt < 60; attempt++) {
        await new Promise(r => setTimeout(r, 5000));

        const { data: getData } = await supabase.functions.invoke('get-report', {
          body: { reportId, email },
        });

        if (getData?.report && !getData.report.status && !getData.report.error) {
          report = getData.report;
          shareToken = getData.shareToken || null;
          break;
        }
      }

      if (!report) {
        return fail('Timed out waiting for report (5 min)');
      }

      // Step 5: Run checks
      updateTest(idx, { status: 'checking', reportJson: report, shareToken });
      const checks = runChecks(report, pet);

      clearInterval(timerRefs.current[idx]);
      updateTest(idx, {
        status: 'done', checks, reportJson: report, shareToken,
        elapsed: Math.round((Date.now() - start) / 1000),
      });

    } catch (err: any) {
      fail(err.message || 'Unexpected error');
    }
  }, [redeemCode, updateTest]);

  const runAll = useCallback(() => {
    TEST_PETS.forEach((_, i) => runTest(i));
  }, [runTest]);

  const passCount = (checks: Check[]) => checks.filter(c => c.passed).length;
  const totalCount = (checks: Check[]) => checks.length;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold" style={{ color: '#3d2f2a' }}>QA Testing</h1>
            <p className="text-sm mt-1" style={{ color: '#9a8578' }}>End-to-end report generation testing with automated checks</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium" style={{ color: '#9a8578' }}>Code:</label>
              <input
                value={redeemCode}
                onChange={e => setRedeemCode(e.target.value.toUpperCase())}
                className="px-3 py-2 rounded-xl text-sm"
                style={{ border: '1px solid #e8ddd0', background: 'white', color: '#3d2f2a', width: 120 }}
              />
            </div>
            <button
              onClick={runAll}
              className="px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-opacity hover:opacity-90"
              style={{ background: '#c4a265' }}
            >
              Run All
            </button>
          </div>
        </div>

        {/* Test pets */}
        <div className="space-y-4">
          {TEST_PETS.map((pet, idx) => {
            const t = tests[idx];
            return (
              <div key={pet.name} className="rounded-xl overflow-hidden" style={{ background: 'white', border: '1px solid #e8ddd0' }}>
                {/* Pet row header */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                      style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}>
                      {pet.species === 'cat' ? '🐈' : pet.species === 'dog' ? '🐕' : pet.species === 'rabbit' ? '🐇' : '🐦'}
                    </div>
                    <div>
                      <div className="font-semibold" style={{ color: '#3d2f2a' }}>
                        {pet.name}
                        <span className="font-normal text-sm ml-2" style={{ color: '#9a8578' }}>
                          {pet.breed} · {pet.expectedSign} · {pet.occasionMode}
                        </span>
                      </div>
                      <div className="text-xs" style={{ color: '#9a8578' }}>
                        {pet.birthDate} {pet.birthTime} · {pet.location}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Elapsed */}
                    {t.elapsed > 0 && (
                      <span className="text-sm tabular-nums" style={{ color: '#9a8578' }}>{t.elapsed}s</span>
                    )}

                    {/* Status badge */}
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{ background: `${STATUS_COLORS[t.status]}18`, color: STATUS_COLORS[t.status] }}
                    >
                      {STATUS_LABELS[t.status]}
                    </span>

                    {/* Score */}
                    {t.status === 'done' && (
                      <span className="text-sm font-semibold" style={{ color: passCount(t.checks) === totalCount(t.checks) ? '#4a8c5c' : '#bf524a' }}>
                        {passCount(t.checks)}/{totalCount(t.checks)}
                      </span>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => runTest(idx)}
                        disabled={t.status !== 'idle' && t.status !== 'done' && t.status !== 'error'}
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
                        style={{ background: '#3d2f2a', color: 'white' }}
                      >
                        {t.status === 'done' || t.status === 'error' ? 'Re-run' : 'Run Test'}
                      </button>
                      {t.reportId && (
                        <a
                          href={`/report?id=${t.reportId}${t.shareToken ? `&share=${t.shareToken}` : ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-xl text-sm transition-opacity hover:opacity-80"
                          style={{ border: '1px solid #e8ddd0', color: '#c4a265' }}
                        >
                          View
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Error */}
                {t.error && (
                  <div className="px-5 pb-4">
                    <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#bf524a12', color: '#bf524a' }}>
                      {t.error}
                    </div>
                  </div>
                )}

                {/* Checks */}
                {t.checks.length > 0 && (
                  <div className="px-5 pb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {t.checks.map((check, ci) => (
                        <div key={ci} className="flex items-start gap-2 text-sm py-1">
                          <span className="shrink-0 mt-0.5">{check.passed ? '✅' : '❌'}</span>
                          <span style={{ color: check.passed ? '#3d2f2a' : '#bf524a' }}>{check.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* JSON viewer */}
                {t.reportJson && (
                  <div className="px-5 pb-4">
                    <button
                      onClick={() => updateTest(idx, { showJson: !t.showJson })}
                      className="text-sm underline transition-colors"
                      style={{ color: '#c4a265' }}
                    >
                      {t.showJson ? 'Hide report JSON' : 'Show report JSON'}
                    </button>
                    {t.showJson && (
                      <pre
                        className="mt-2 p-4 rounded-xl overflow-auto text-xs max-h-[400px]"
                        style={{ background: '#faf6ef', color: '#3d2f2a', border: '1px solid #e8ddd0' }}
                      >
                        {JSON.stringify(t.reportJson, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
