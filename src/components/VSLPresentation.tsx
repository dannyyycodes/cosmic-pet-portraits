import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, SkipForward, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

// Import testimonial images
import miaImg from '@/assets/testimonials/mia.jpg';
import markImg from '@/assets/testimonials/mark.jpg';

interface Slide {
  id: number;
  duration: number; // in seconds
  headline: string;
  subtext?: string;
  image?: string;
  testimonial?: {
    quote: string;
    name: string;
    image: string;
  };
}

const slides: Slide[] = [
  {
    id: 1,
    duration: 8,
    headline: "What if your pet has been trying to tell you something...",
    subtext: "...and you've been missing the signs?",
  },
  {
    id: 2,
    duration: 10,
    headline: "Most pet owners never truly understand why their pet acts the way they do",
    subtext: "The sudden anxiety. The strange habits. The unexplained moods.",
  },
  {
    id: 3,
    duration: 12,
    headline: "Your pet's birth date holds the key",
    subtext: "Their cosmic personality — revealed in a detailed report that's so accurate, people think we've been spying on their pets.",
  },
  {
    id: 4,
    duration: 12,
    headline: "Over 12,000 pet parents have discovered their pet's hidden soul",
    testimonial: {
      quote: "My husband was like 'did you write this?'",
      name: "Mia",
      image: miaImg,
    },
  },
  {
    id: 5,
    duration: 10,
    headline: "The perfect gift that makes people cry happy tears",
    testimonial: {
      quote: "She rang me crying!",
      name: "Mark",
      image: markImg,
    },
  },
  {
    id: 6,
    duration: 10,
    headline: "Takes 60 seconds. 100% money-back guarantee.",
    subtext: "Discover what your pet has been trying to tell you.",
  },
];

const vslScript = `What if your pet has been trying to tell you something... and you've been missing the signs?

Most pet owners never truly understand why their pet acts the way they do. The sudden anxiety. The strange habits. The unexplained moods.

Your pet's birth date holds the key. Their cosmic personality — revealed in a detailed report that's so accurate, people think we've been spying on their pets.

Over 12,000 pet parents have discovered their pet's hidden soul. Mia said, quote, "My husband was like, did you write this?" end quote.

It's the perfect gift that makes people cry happy tears. Mark told us his sister rang him crying after receiving hers.

Takes just 60 seconds. 100% money-back guarantee. Discover what your pet has been trying to tell you.`;

export function VSLPresentation() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const totalDuration = slides.reduce((acc, slide) => acc + slide.duration, 0);

  // Load audio on mount
  useEffect(() => {
    const loadAudio = async () => {
      setAudioLoading(true);
      setAudioError(null);
      
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ 
              text: vslScript,
              voiceId: 'EXAVITQu4vr4xnSDxMaL' // Sarah - warm, friendly voice
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to generate audio');
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        audioRef.current = new Audio(audioUrl);
        audioRef.current.addEventListener('ended', () => {
          setIsPlaying(false);
          setCurrentSlide(slides.length - 1);
          setProgress(100);
        });
        
        setAudioLoaded(true);
      } catch (error) {
        console.error('Audio loading error:', error);
        setAudioError('Could not load voiceover. Playing without audio.');
        setAudioLoaded(true); // Allow playing without audio
      } finally {
        setAudioLoading(false);
      }
    };

    loadAudio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Handle slide progression
  useEffect(() => {
    if (!isPlaying) return;

    const slideStartTimes = slides.reduce((acc, slide, index) => {
      if (index === 0) {
        acc.push(0);
      } else {
        acc.push(acc[index - 1] + slides[index - 1].duration);
      }
      return acc;
    }, [] as number[]);

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const progressPercent = (elapsed / totalDuration) * 100;
      setProgress(Math.min(progressPercent, 100));

      // Find current slide based on elapsed time
      for (let i = slideStartTimes.length - 1; i >= 0; i--) {
        if (elapsed >= slideStartTimes[i]) {
          setCurrentSlide(i);
          break;
        }
      }

      if (elapsed >= totalDuration) {
        setIsPlaying(false);
        setCurrentSlide(slides.length - 1);
        setProgress(100);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, totalDuration]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      // Pause
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      // Play
      setIsPlaying(true);
      startTimeRef.current = Date.now() - (progress / 100) * totalDuration * 1000;
      if (audioRef.current && !isMuted) {
        audioRef.current.currentTime = (progress / 100) * totalDuration;
        audioRef.current.play().catch(console.error);
      }
    }
  }, [isPlaying, progress, totalDuration, isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (audioRef.current) {
        audioRef.current.muted = !prev;
      }
      return !prev;
    });
  }, []);

  const skipToEnd = useCallback(() => {
    setIsPlaying(false);
    setCurrentSlide(slides.length - 1);
    setProgress(100);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  const currentSlideData = slides[currentSlide];

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Main presentation container */}
      <div className="relative aspect-video bg-gradient-to-br from-background via-background to-primary/10 rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
        {/* Cosmic background effects */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(ellipse 80% 50% at 50% 30%, hsl(var(--primary) / 0.4), transparent 60%)',
            }}
          />
          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/40"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Slide content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 md:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-2xl"
            >
              {/* Headline */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl md:text-4xl font-serif font-semibold text-foreground mb-4 leading-tight"
              >
                {currentSlideData.headline}
              </motion.h2>

              {/* Subtext */}
              {currentSlideData.subtext && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg md:text-xl text-muted-foreground"
                >
                  {currentSlideData.subtext}
                </motion.p>
              )}

              {/* Testimonial */}
              {currentSlideData.testimonial && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-8 flex flex-col items-center"
                >
                  <img 
                    src={currentSlideData.testimonial.image}
                    alt={currentSlideData.testimonial.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gold/50 mb-4"
                  />
                  <p className="text-xl md:text-2xl text-gold font-medium italic mb-2">
                    "{currentSlideData.testimonial.quote}"
                  </p>
                  <p className="text-muted-foreground">
                    — {currentSlideData.testimonial.name}
                  </p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-border/30">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-gold"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Loading overlay */}
        {audioLoading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading voiceover...</p>
            </div>
          </div>
        )}

        {/* Play button overlay (when not playing) */}
        {!isPlaying && audioLoaded && !audioLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-background/40 z-20 cursor-pointer"
            onClick={togglePlay}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30"
            >
              <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-4 px-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            disabled={!audioLoaded}
            className="h-10 w-10"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-10 w-10"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
          {audioError && (
            <span className="text-xs text-muted-foreground">{audioError}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={skipToEnd}
            className="text-muted-foreground"
          >
            <SkipForward className="w-4 h-4 mr-1" />
            Skip
          </Button>
          <Button
            variant="cosmic"
            onClick={() => navigate('/intake')}
            className="shadow-lg"
          >
            Get Your Pet's Reading
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
