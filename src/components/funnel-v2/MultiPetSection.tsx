import { motion } from 'framer-motion';
import { Heart, Sparkles, Users } from 'lucide-react';

interface MultiPetSectionProps {
  onCtaClick: () => void;
  ctaLabel: string;
}

/**
 * Explains the multi-pet story to first-time visitors: pet-pet compatibility
 * readings + Cosmic Household weekly digest. Lives between ProductReveal and
 * InlineCheckout so a buyer considering 2+ pets sees the story before they pick.
 */
export function MultiPetSection({ onCtaClick, ctaLabel }: MultiPetSectionProps) {
  return (
    <section className="py-16 md:py-20 px-4 overflow-hidden" style={{ background: '#FFFDF5' }}>
      <div className="max-w-[720px] mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5"
          style={{
            background: 'linear-gradient(135deg, rgba(196,162,101,0.15), rgba(191,82,74,0.1))',
            border: '1px solid rgba(196,162,101,0.35)',
          }}
        >
          <Users className="w-3.5 h-3.5" style={{ color: '#a07c3a' }} />
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.15em]" style={{ color: '#a07c3a', fontFamily: 'Cormorant, serif' }}>
            For multi-pet homes
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[1.8rem] md:text-[2.4rem] text-[#2D2926] mb-3 leading-tight"
          style={{ fontFamily: 'DM Serif Display, serif' }}
        >
          You don't just have <em style={{ color: '#bf524a' }}>one</em> little soul.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[1.02rem] md:text-[1.15rem] text-[#6B5E54] italic mb-12 max-w-[560px] mx-auto leading-relaxed"
          style={{ fontFamily: 'Cormorant, serif' }}
        >
          When a household has two or more pets, their charts start speaking to each other. We read those conversations — and deliver the whole family's week in one place.
        </motion.p>

        <div className="grid md:grid-cols-2 gap-4 md:gap-5 text-left">
          {/* Cross-pet readings */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="rounded-[20px] p-6 md:p-7 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(196,162,101,0.08), rgba(191,82,74,0.05))',
              border: '1.5px solid rgba(196,162,101,0.3)',
            }}
          >
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-4 right-4"
              style={{ color: '#c4a265' }}
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #c4a265, #bf524a)' }}>
                <Heart className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-[1.15rem] text-[#2D2926]" style={{ fontFamily: 'DM Serif Display, serif' }}>
                Cross-pet readings
              </h3>
            </div>
            <p className="text-[0.92rem] text-[#5a4a42] leading-relaxed mb-3" style={{ fontFamily: 'Cormorant, serif' }}>
              Pair any two of your pets and we'll compose a reading showing how they move through the world together — where they harmonise, where they clash, the rituals that keep the bond steady.
            </p>
            <p className="text-[0.82rem] italic" style={{ fontFamily: 'Cormorant, serif', color: '#a07c3a' }}>
              Unlocks after your first two readings. $12.
            </p>
          </motion.div>

          {/* Cosmic Household digest */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="rounded-[20px] p-6 md:p-7 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(191,82,74,0.08), rgba(196,162,101,0.05))',
              border: '1.5px solid rgba(196,162,101,0.3)',
            }}
          >
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
              className="absolute top-4 right-4"
              style={{ color: '#c4a265' }}
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #bf524a, #c4a265)' }}>
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-[1.15rem] text-[#2D2926]" style={{ fontFamily: 'DM Serif Display, serif' }}>
                Cosmic Household
              </h3>
            </div>
            <p className="text-[0.92rem] text-[#5a4a42] leading-relaxed mb-3" style={{ fontFamily: 'Cormorant, serif' }}>
              One Sunday email for the whole family. Every pet gets their own section — their week ahead, best moments, little rituals. One subscription. One unsubscribe. No clutter.
            </p>
            <p className="text-[0.82rem] italic" style={{ fontFamily: 'Cormorant, serif', color: '#a07c3a' }}>
              Add at checkout — one price for up to ten pets.
            </p>
          </motion.div>
        </div>

        <motion.button
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.5 }}
          onClick={onCtaClick}
          className="mt-10 px-7 py-3.5 rounded-xl text-white font-semibold relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #c4a265, #bf524a)',
            fontFamily: 'DM Serif Display, serif',
            fontSize: '1.02rem',
          }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)' }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="relative z-10">{ctaLabel}</span>
        </motion.button>
      </div>
    </section>
  );
}
