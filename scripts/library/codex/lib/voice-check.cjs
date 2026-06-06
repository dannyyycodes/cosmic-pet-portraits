/**
 * voice-check.js — regex pass for Little Souls FB caption manifests.
 *
 * Run after Codex generates a manifest. Blocks publish if any HARD pattern matches.
 * Warns on SOFT patterns (advisory).
 *
 * Usage:
 *   node scripts/library/codex/lib/voice-check.js <path-to-manifest.json>
 *
 * Exit codes:
 *   0 — pass
 *   1 — hard fail (do not publish)
 *   2 — soft warn (review before publish)
 */

const fs = require('node:fs');
const path = require('node:path');

const HARD_BLOCKS = [
  {
    pattern: /\b(my|our)\s+(dog|cat|pet|puppy|kitten|boy|girl)\b/i,
    label: 'first-person possessive',
    why: 'Little Souls is a witnessing studio, never a pet-owner. Use "your" or "her family\'s" instead.',
  },
  {
    pattern: /\b(I sleep|we adopted|my rescue|I cuddle|we cuddle)\b/i,
    label: 'first-person Little Souls',
    why: 'The narrator is a witness, never the protagonist.',
  },
  {
    pattern: /\b(tag a friend|like if|comment yes|share if|comment YES)\b/i,
    label: 'engagement bait',
    why: '2026 FB classifier downranks 20-95%. Use real questions instead.',
  },
  {
    pattern: /\b(buy now|shop now|order now|purchase|limited offer|while stocks last|act now)\b/i,
    label: 'purchase vocabulary',
    why: 'Discovery vocabulary only — decode/uncover/identify/painted from your photo.',
  },
  {
    pattern: /(https?:\/\/|littlesouls\.app|shop\.littlesouls)/i,
    label: 'link in caption body',
    why: 'Links go in first_comment field only. Body links lose 70-80% reach.',
  },
  {
    pattern: /!/,
    label: 'exclamation mark',
    why: 'Brightens voice against warm/quiet register. Use a period.',
    field: 'caption_only', // allow ! in first_comment for the ✨ line emoji-adjacent? still no — keep clean
  },
  {
    pattern: /\b(closure|heal from|move on|move forward|get over)\b/i,
    label: 'time-heals language (memorial gate)',
    why: 'Bridge Friday must use "sit with", "less lonely", "still here". Never "closure".',
    bridge_friday_only: true,
  },
];

const SOFT_WARNS = [
  {
    pattern: /\b(amazing|incredible|stunning|gorgeous)\b/i,
    label: 'generic-marketing adjective',
    why: 'Replace with un-inventable specific (radiator, wildflowers, second step of stairs).',
  },
  {
    pattern: /\b(beautiful soul|forever home|fur baby|pawrent)\b/i,
    label: 'pet-niche cliché',
    why: 'Eyeroll territory. Find a fresher way to say it.',
  },
  {
    pattern: /\bDM us\b/i,
    label: 'too-direct CTA',
    why: 'Soften — "drop their name below" or move to first_comment.',
  },
];

function checkManifest(manifestPath) {
  if (!fs.existsSync(manifestPath)) {
    console.error(`✗ Manifest not found: ${manifestPath}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const slot = manifest.slot || 'unknown';
  const caption = manifest.caption || '';
  const firstComment = manifest.first_comment || '';
  const selfReply = manifest.self_reply || '';
  const wordCount = caption.split(/\s+/).filter(Boolean).length;

  let hardFails = 0;
  let softWarns = 0;
  const flags = [];

  console.log(`\n━━━ Voice Check — ${slot} ━━━`);
  console.log(`Caption: ${wordCount} words`);

  // Word count guards
  if (wordCount < 30) {
    flags.push({ level: 'HARD', label: `caption too short (${wordCount} words, min 30)` });
    hardFails++;
  } else if (slot === 'caption-this-thursday' && wordCount < 20) {
    flags.push({ level: 'HARD', label: `caption-this too short (${wordCount} words, min 20)` });
    hardFails++;
  } else if (wordCount > 200) {
    flags.push({ level: 'HARD', label: `caption too long (${wordCount} words, max 200)` });
    hardFails++;
  } else if (wordCount > 150 && slot !== 'bridge-friday') {
    flags.push({ level: 'WARN', label: `caption over FB sweet spot (${wordCount} words, ideal 60-130)` });
    softWarns++;
  }

  // Hard blocks across body fields
  const bodyToCheck = [
    { name: 'caption', text: caption },
    { name: 'self_reply', text: selfReply },
  ];

  for (const { name, text } of bodyToCheck) {
    for (const rule of HARD_BLOCKS) {
      if (rule.bridge_friday_only && slot !== 'bridge-friday') continue;
      if (rule.field === 'caption_only' && name !== 'caption') continue;
      if (rule.pattern.test(text)) {
        flags.push({
          level: 'HARD',
          label: `${name}: ${rule.label}`,
          why: rule.why,
          match: text.match(rule.pattern)[0],
        });
        hardFails++;
      }
    }
    for (const rule of SOFT_WARNS) {
      if (rule.pattern.test(text)) {
        flags.push({
          level: 'WARN',
          label: `${name}: ${rule.label}`,
          why: rule.why,
          match: text.match(rule.pattern)[0],
        });
        softWarns++;
      }
    }
  }

  // first_comment is allowed to contain the link, but body must have ✨ or 🐾 emoji prefix
  if (firstComment && !/^[✨🐾🤍]/.test(firstComment.trim())) {
    flags.push({
      level: 'WARN',
      label: 'first_comment missing emoji prefix',
      why: 'Convention: first comment opens with ✨ or 🐾 to feel branded.',
    });
    softWarns++;
  }

  if (firstComment && !firstComment.includes('littlesouls.app')) {
    flags.push({
      level: 'WARN',
      label: 'first_comment missing link',
      why: 'first_comment is the link drop. Should contain littlesouls.app/portraits.',
    });
    softWarns++;
  }

  // Bridge Friday — ethics gate must be present and passed
  if (slot === 'bridge-friday') {
    if (!manifest.ethics_gate || manifest.ethics_gate.gate_passed !== true) {
      flags.push({
        level: 'HARD',
        label: 'bridge-friday missing ethics_gate or gate_passed: false',
        why: 'Five Love Test must run AND pass before memorial publishes. See _ethics-gate.md.',
      });
      hardFails++;
    }
  }

  // Print
  for (const f of flags) {
    const icon = f.level === 'HARD' ? '✗' : '⚠';
    console.log(`  ${icon} [${f.level}] ${f.label}`);
    if (f.why) console.log(`      → ${f.why}`);
    if (f.match) console.log(`      match: "${f.match}"`);
  }

  if (hardFails === 0 && softWarns === 0) {
    console.log('  ✓ Clean. Ready for review.');
  }

  console.log(`\nResult: ${hardFails} hard / ${softWarns} soft\n`);

  if (hardFails > 0) process.exit(1);
  if (softWarns > 0) process.exit(2);
  process.exit(0);
}

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node voice-check.js <path-to-manifest.json>');
  process.exit(1);
}
checkManifest(path.resolve(arg));
