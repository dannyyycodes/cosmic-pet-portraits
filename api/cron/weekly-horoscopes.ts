import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://aduibsyrnenzobuyetmn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const CRON_SECRET = process.env.CRON_SECRET || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify the request is from Vercel Cron (or has valid secret)
  const authHeader = req.headers.authorization;
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('[CRON] Triggering weekly horoscope generation...');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-weekly-horoscopes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ trigger: 'vercel-cron' }),
    });

    const data = await response.text();
    console.log('[CRON] Response:', response.status, data);

    return res.status(200).json({
      success: true,
      status: response.status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CRON] Error:', error);
    return res.status(500).json({ error: 'Failed to trigger horoscope generation' });
  }
}
