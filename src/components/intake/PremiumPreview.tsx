import { motion } from 'framer-motion';
import { Lock, Sparkles, Star, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PremiumPreviewProps {
  petName: string;
  sunSign: string;
  element: string;
  onUnlock?: () => void;
}

const zodiacIcons: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
  Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

const elementColors: Record<string, string> = {
  Fire: '#ef4444',
  Earth: '#22c55e',
  Air: '#a855f7',
  Water: '#0ea5e9',
};

export function PremiumPreview({ petName, sunSign, element, onUnlock }: PremiumPreviewProps) {
  const zodiacIcon = zodiacIcons[sunSign] || '⭐';
  const elementColor = elementColors[element] || '#a855f7';

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-gold/20 to-primary/20 border border-gold/30"
        >
          <Crown className="w-4 h-4 text-gold" />
          <span className="text-sm font-medium text-gold">Exclusive Full Report Content</span>
        </motion.div>
        <p className="text-muted-foreground text-sm">
          Here's a glimpse of what awaits in {petName}'s complete cosmic profile
        </p>
      </div>

      {/* Blurred Birth Chart Preview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative group"
      >
        <div className="relative rounded-2xl overflow-hidden border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-purple-500/10 p-6">
          {/* Blurred animated birth chart */}
          <div className="relative blur-[6px] pointer-events-none">
            <svg viewBox="0 0 300 300" className="w-full max-w-[280px] mx-auto h-auto">
              {/* Outer ring with zodiac segments */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = i * 30;
                const colors = ['#ef4444', '#22c55e', '#a855f7', '#0ea5e9'];
                return (
                  <motion.path
                    key={i}
                    d={`M 150 150 L ${150 + 120 * Math.cos((angle - 90) * Math.PI / 180)} ${150 + 120 * Math.sin((angle - 90) * Math.PI / 180)} A 120 120 0 0 1 ${150 + 120 * Math.cos((angle + 30 - 90) * Math.PI / 180)} ${150 + 120 * Math.sin((angle + 30 - 90) * Math.PI / 180)} Z`}
                    fill={`${colors[i % 4]}30`}
                    stroke={colors[i % 4]}
                    strokeWidth="1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                  />
                );
              })}
              
              {/* Inner circles */}
              <circle cx="150" cy="150" r="80" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
              <circle cx="150" cy="150" r="50" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
              
              {/* Planet dots */}
              {[
                { x: 200, y: 100, color: '#fbbf24' },
                { x: 120, y: 80, color: '#e2e8f0' },
                { x: 230, y: 180, color: '#ec4899' },
                { x: 80, y: 200, color: '#ef4444' },
                { x: 180, y: 230, color: '#f97316' },
              ].map((planet, i) => (
                <motion.circle
                  key={i}
                  cx={planet.x}
                  cy={planet.y}
                  r="10"
                  fill={planet.color}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                />
              ))}
              
              {/* Center text */}
              <text x="150" y="145" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                {petName}'s
              </text>
              <text x="150" y="162" textAnchor="middle" fill={elementColor} fontSize="14" fontWeight="bold">
                BIRTH CHART
              </text>
            </svg>
            
            {/* Animated planet legend */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {['☉ Sun', '☽ Moon', '♀ Venus', '♂ Mars', '♃ Jupiter'].map((planet, i) => (
                <motion.span
                  key={planet}
                  className="text-xs px-2 py-1 rounded bg-white/10 border border-white/20"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                >
                  {planet}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Unlock overlay */}
          <motion.div 
            className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Lock className="w-10 h-10 text-gold mb-3" />
            <p className="text-foreground font-semibold text-lg">Full Birth Chart</p>
            <p className="text-muted-foreground text-sm mb-4">12 planetary positions revealed</p>
            <Button variant="outline" size="sm" className="border-gold/50 text-gold hover:bg-gold/10" onClick={onUnlock}>
              <Sparkles className="w-4 h-4 mr-2" />
              Unlock Full Chart
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Blurred Pokemon Card Preview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="relative group"
      >
        <div className="relative rounded-2xl overflow-hidden border border-gold/30 bg-gradient-to-br from-amber-500/10 via-background to-orange-500/10 p-6">
          {/* Blurred Pokemon-style card */}
          <div className="relative blur-[6px] pointer-events-none">
            <div className="max-w-[220px] mx-auto rounded-xl overflow-hidden" style={{ aspectRatio: '63/88' }}>
              <div 
                className="h-full p-2"
                style={{ background: `linear-gradient(135deg, ${elementColor}, ${elementColor}40)` }}
              >
                <div className="bg-amber-100 rounded-lg h-full p-2">
                  {/* Card header */}
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: elementColor }}>
                      COSMIC {zodiacIcon}
                    </span>
                    <div className="flex items-center">
                      <span className="text-xs font-bold text-gray-700">HP</span>
                      <span className="text-lg font-black text-gray-800">85</span>
                    </div>
                  </div>
                  
                  {/* Pet name */}
                  <p className="text-lg font-black text-gray-800 mb-1">{petName}</p>
                  
                  {/* Portrait placeholder */}
                  <div 
                    className="h-20 rounded-lg flex items-center justify-center text-4xl mb-2"
                    style={{ background: `linear-gradient(135deg, ${elementColor}30, ${elementColor}10)` }}
                  >
                    {zodiacIcon}
                  </div>
                  
                  {/* Stats bars */}
                  <div className="space-y-1">
                    {['Vitality', 'Empathy', 'Charm'].map((stat, i) => (
                      <div key={stat} className="flex items-center gap-2">
                        <span className="text-[8px] text-gray-600 w-12">{stat}</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: elementColor }}
                            initial={{ width: 0 }}
                            animate={{ width: `${60 + i * 15}%` }}
                            transition={{ delay: 1 + i * 0.1, duration: 0.5 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Unlock overlay */}
          <motion.div 
            className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown className="w-10 h-10 text-amber-400 mb-3" />
            </motion.div>
            <p className="text-foreground font-semibold text-lg">Shareable Pokemon Card</p>
            <p className="text-muted-foreground text-sm mb-4">Holographic with unique moves</p>
            <Button variant="outline" size="sm" className="border-gold/50 text-gold hover:bg-gold/10" onClick={onUnlock}>
              <Star className="w-4 h-4 mr-2" />
              Unlock Card
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Feature Grid Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 gap-3"
      >
        {[
          { icon: '🌙', title: 'Moon Sign', desc: 'Emotional depths', locked: true },
          { icon: '⬆️', title: 'Rising Sign', desc: 'First impressions', locked: true },
          { icon: '💕', title: 'Venus Placement', desc: 'Love language', locked: true },
          { icon: '⚡', title: 'Mars Energy', desc: 'Motivation style', locked: true },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className={cn(
              "relative p-4 rounded-xl border bg-card/40 backdrop-blur-sm",
              item.locked ? "border-muted/50" : "border-primary/30"
            )}
          >
            <div className={cn("transition-all", item.locked && "blur-[2px]")}>
              <span className="text-2xl">{item.icon}</span>
              <p className="font-medium text-sm mt-2">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            {item.locked && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-5 h-5 text-muted-foreground/50" />
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Unlock CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center space-y-3"
      >
        <p className="text-sm text-muted-foreground">
          <Zap className="w-4 h-4 inline mr-1 text-gold" />
          All this and 40+ more insights await in the full report
        </p>
      </motion.div>
    </div>
  );
}