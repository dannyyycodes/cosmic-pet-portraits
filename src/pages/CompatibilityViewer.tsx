import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Share2, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CompatPet {
  id: string;
  petName: string;
  species?: string;
  petPhotoUrl?: string;
  gender?: string;
  sunSign?: string;
  moonSign?: string;
  archetype?: string;
}

interface CompatibilityReading {
  headline?: string;
  opening?: string;
  /** Array of themed section objects for flexibility as the prompt evolves. */
  sections?: Array<{ title: string; icon?: string; body: string }>;
  /** Fallback: a single long-form body if the worker returns a plain string. */
  body?: string;
  blessing?: string;
}

interface CompatibilityResponse {
  id: string;
  status: 'pending' | 'generating' | 'ready' | 'failed';
  reading: CompatibilityReading | null;
  shareToken: string;
  petA: CompatPet | null;
  petB: CompatPet | null;
  createdAt: string;
}

const grainStyle: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
};

export default function CompatibilityViewer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const compatId = searchParams.get('id');
  const token = searchParams.get('token');
  const stripeSession = searchParams.get('session_id');
  const petAFromUrl = searchParams.get('a');
  const petBFromUrl = searchParams.get('b');

  const [data, setData] = useState<CompatibilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isStripeReturn = !!stripeSession && !!petAFromUrl && !!petBFromUrl;

  const shareUrl = useMemo(() => {
    if (!data?.shareToken) return '';
    return `${window.location.origin}/compatibility?token=${data.shareToken}`;
  }, [data?.shareToken]);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const fetchOnce = async () => {
      try {
        // Fresh Stripe return — there's no compatibility row id yet; wait for
        // the webhook to create it, then look it up by the pet pair.
        if (isStripeReturn && !compatId && !token) {
          const { data: row } = await supabase
            .from('pet_compatibilities')
            .select('id, status')
            .eq('pet_report_a_id', petAFromUrl! < petBFromUrl! ? petAFromUrl! : petBFromUrl!)
            .eq('pet_report_b_id', petAFromUrl! < petBFromUrl! ? petBFromUrl! : petAFromUrl!)
            .maybeSingle();
          if (row?.id && !cancelled) {
            const nextUrl = `/compatibility?id=${row.id}`;
            navigate(nextUrl, { replace: true });
          }
          return;
        }

        const qs = new URLSearchParams();
        if (compatId) qs.set('id', compatId);
        if (token) qs.set('token', token);
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/get-compatibility?${qs.toString()}`, {
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
          },
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json: CompatibilityResponse = await resp.json();
        if (cancelled) return;
        setData(json);

        // Keep polling while still generating.
        if (json.status === 'generating' || json.status === 'pending') {
          pollTimer = setTimeout(fetchOnce, 6000);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load reading');
      }
    };

    fetchOnce();
    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [compatId, token, isStripeReturn, petAFromUrl, petBFromUrl, navigate]);

  const handleCopyShare = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied');
    setTimeout(() => setCopied(false), 2000);
  };

  // Stripe return with no row yet — brief waiting state.
  if (isStripeReturn && !data && !error) {
    return <LoadingState title="Finalising your purchase…" subtitle="Give it a few seconds while we set up the pairing." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#FFFDF5' }}>
        <div className="max-w-md text-center">
          <h1 className="text-2xl text-[#2D2926] mb-3" style={{ fontFamily: 'DM Serif Display, serif' }}>We couldn't find that reading</h1>
          <p className="text-[#6B5E54] mb-6" style={{ fontFamily: 'Cormorant, serif' }}>{error}</p>
          <button onClick={() => navigate('/account')} className="underline text-[#bf524a]">Back to your account</button>
        </div>
      </div>
    );
  }

  if (!data) {
    return <LoadingState title="Opening the reading…" />;
  }

  if (data.status === 'pending' || data.status === 'generating') {
    return (
      <LoadingState
        title={`Composing ${data.petA?.petName || 'their'} × ${data.petB?.petName || 'their'} reading…`}
        subtitle="This takes a minute — we're mapping how their two charts breathe together."
      />
    );
  }

  if (data.status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#FFFDF5' }}>
        <div className="max-w-md text-center">
          <h1 className="text-2xl text-[#2D2926] mb-3" style={{ fontFamily: 'DM Serif Display, serif' }}>Something went sideways</h1>
          <p className="text-[#6B5E54] mb-6" style={{ fontFamily: 'Cormorant, serif' }}>We'll retry this automatically. Please check back in a few minutes.</p>
          <button onClick={() => navigate('/account')} className="underline text-[#bf524a]">Back to your account</button>
        </div>
      </div>
    );
  }

  // Ready — render the reading.
  const reading = data.reading || {};
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FFFDF5 0%, #f5efe6 60%, #ede5d8 100%)', ...grainStyle }}>
      <div className="max-w-[640px] mx-auto px-4 py-10 md:py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[0.6rem] font-bold uppercase tracking-[0.18em] mb-4"
            style={{ background: 'rgba(191,82,74,0.9)', color: 'white' }}>
            <Heart className="w-3 h-3" /> Cross-pet reading
          </div>

          <div className="flex items-center justify-center gap-5 mb-5">
            <PetHero pet={data.petA} />
            <motion.div
              animate={{ scale: [1, 1.12, 1], rotate: [0, 6, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="text-[2rem]" style={{ color: '#bf524a' }}
            >
              ✦
            </motion.div>
            <PetHero pet={data.petB} />
          </div>

          <h1 className="text-[1.75rem] md:text-[2.3rem] text-[#2D2926] leading-tight mb-3"
            style={{ fontFamily: 'DM Serif Display, serif' }}>
            {reading.headline || `${data.petA?.petName || 'They'} & ${data.petB?.petName || 'they'}`}
          </h1>
        </motion.div>

        {/* Opening */}
        {reading.opening && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="rounded-[20px] p-6 md:p-8 mb-8 bg-white border"
            style={{ borderColor: '#E8DFD6' }}
          >
            <p className="text-[1.02rem] md:text-[1.1rem] leading-[1.85] italic text-[#6B5E54]"
              style={{ fontFamily: 'Cormorant, serif' }}>
              {reading.opening}
            </p>
          </motion.div>
        )}

        {/* Sections */}
        <AnimatePresence>
          {(reading.sections || []).map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              className="rounded-[20px] p-6 md:p-7 mb-5 bg-white border"
              style={{ borderColor: '#E8DFD6' }}
            >
              <div className="flex items-center gap-2 mb-3">
                {section.icon && <span className="text-[1.3rem]">{section.icon}</span>}
                <h3 className="text-[1.2rem] text-[#2D2926]"
                  style={{ fontFamily: 'DM Serif Display, serif' }}>
                  {section.title}
                </h3>
              </div>
              <p className="text-[0.98rem] text-[#4a3f3a] leading-[1.75] whitespace-pre-line"
                style={{ fontFamily: 'Cormorant, serif' }}>
                {section.body}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Long-form fallback body */}
        {reading.body && !reading.sections && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-[20px] p-6 md:p-8 mb-8 bg-white border"
            style={{ borderColor: '#E8DFD6' }}
          >
            <p className="text-[0.98rem] text-[#4a3f3a] leading-[1.8] whitespace-pre-line"
              style={{ fontFamily: 'Cormorant, serif' }}>
              {reading.body}
            </p>
          </motion.div>
        )}

        {/* Blessing */}
        {reading.blessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center my-10"
          >
            <p className="text-[1.2rem] italic"
              style={{ fontFamily: 'Caveat, cursive', color: '#bf524a' }}>
              {reading.blessing}
            </p>
          </motion.div>
        )}

        {/* Share */}
        <div className="mt-12 rounded-[18px] p-5 text-center"
          style={{ background: 'rgba(196,162,101,0.1)', border: '1px solid rgba(196,162,101,0.35)' }}>
          <p className="text-[0.88rem] text-[#6B5E54] mb-3"
            style={{ fontFamily: 'Cormorant, serif' }}>
            Want to share this with the other pet's family? This link lets anyone read it.
          </p>
          <button
            onClick={handleCopyShare}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold"
            style={{ background: '#bf524a', fontFamily: 'DM Serif Display, serif' }}
          >
            {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Share2 className="w-4 h-4" /> Copy share link</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function PetHero({ pet }: { pet: CompatPet | null }) {
  if (!pet) return null;
  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-[3px]"
        style={{ borderColor: '#c4a265' }}
      >
        {pet.petPhotoUrl ? (
          <img src={pet.petPhotoUrl} alt={pet.petName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[2rem]"
            style={{ background: 'linear-gradient(135deg, rgba(196,162,101,0.25), rgba(191,82,74,0.15))' }}>
            🐾
          </div>
        )}
      </motion.div>
      <div className="mt-2 text-center">
        <div className="text-[0.95rem] text-[#2D2926] font-semibold"
          style={{ fontFamily: 'DM Serif Display, serif' }}>{pet.petName}</div>
        {pet.sunSign && (
          <div className="text-[0.7rem] text-[#9B8E84]"
            style={{ fontFamily: 'Cormorant, serif' }}>
            {pet.sunSign} Sun
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#FFFDF5', ...grainStyle }}>
      <div className="max-w-md text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #c4a265, #bf524a)', boxShadow: '0 10px 40px -10px rgba(191,82,74,0.4)' }}
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-2xl text-[#2D2926] mb-3" style={{ fontFamily: 'DM Serif Display, serif' }}>{title}</h1>
        {subtitle && (
          <p className="text-[#6B5E54] italic" style={{ fontFamily: 'Cormorant, serif' }}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}
