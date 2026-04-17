// Usage: node scripts/dump-report.cjs <reportId> [fixtureName]
// Writes src/fixtures/report-<fixtureName>.json from Supabase.
//
//   node scripts/dump-report.cjs 2e47a0a6-06a4-49cc-a0da-58cdb53357d6 monty
//
// Requires SUPABASE_SERVICE_KEY env var, or falls back to the known key.
const { writeFileSync } = require('node:fs');
const { join } = require('node:path');

const SUPABASE_URL = 'https://aduibsyrnenzobuyetmn.supabase.co';
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkdWlic3lybmVuem9idXlldG1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjkzMDAzOCwiZXhwIjoyMDg4NTA2MDM4fQ.6Icy7RKDkfCYI5EoUMn1u8kYK1FNVbB9pC46JENbXdo';

async function main() {
  const reportId = process.argv[2];
  const fixtureNameArg = process.argv[3];
  if (!reportId) {
    console.error('Usage: node scripts/dump-report.cjs <reportId> [fixtureName]');
    process.exit(1);
  }

  const url =
    SUPABASE_URL + '/rest/v1/pet_reports?id=eq.' + reportId +
    '&select=pet_name,pet_photo_url,portrait_url,report_content,occasion_mode,species';

  const res = await fetch(url, {
    headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY },
  });
  if (!res.ok) {
    console.error('Supabase error', res.status, await res.text());
    process.exit(1);
  }
  const rows = await res.json();
  if (!rows || !rows[0]) {
    console.error('No report found for id', reportId);
    process.exit(1);
  }
  const r = rows[0];

  const fixtureName =
    fixtureNameArg ||
    String(r.pet_name || 'report')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') ||
    'report';

  const out = {
    reportId: 'fixture-' + fixtureName,
    petName: r.pet_name,
    petPhotoUrl: r.pet_photo_url,
    portraitUrl: r.portrait_url,
    occasionMode: r.occasion_mode || 'discover',
    species: r.species || 'dog',
    report: r.report_content,
  };

  const dest = join(__dirname, '..', 'src', 'fixtures', 'report-' + fixtureName + '.json');
  writeFileSync(dest, JSON.stringify(out, null, 2));
  console.log('Wrote', dest);
  console.log('Preview: /dev/report?fixture=' + fixtureName);
  console.log('Remember to register it in src/pages/DevReport.tsx FIXTURES map.');
}

main().catch((e) => { console.error(e); process.exit(1); });
