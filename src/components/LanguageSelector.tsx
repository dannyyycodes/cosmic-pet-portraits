import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useLanguage, languages, Language } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface LanguageSelectorProps {
  variant?: 'default' | 'minimal' | 'hero';
}

export function LanguageSelector({ variant = 'default' }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(l => l.code === language);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  if (variant === 'minimal') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-cosmic-text/70 hover:text-cosmic-text transition-colors text-sm"
        >
          <Globe className="w-4 h-4" />
          <span>{currentLanguage?.flag}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-48 bg-cosmic-card border border-cosmic-accent/30 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto"
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-cosmic-accent/20 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    language === lang.code ? 'bg-cosmic-accent/30 text-cosmic-highlight' : 'text-cosmic-text'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm">{lang.nativeName}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-cosmic-card/50 backdrop-blur-sm border border-cosmic-accent/30 rounded-full hover:border-cosmic-highlight/50 transition-all"
        >
          <Globe className="w-4 h-4 text-cosmic-highlight" />
          <span className="text-lg">{currentLanguage?.flag}</span>
          <span className="text-sm text-cosmic-text">{currentLanguage?.nativeName}</span>
          <ChevronDown className={`w-4 h-4 text-cosmic-text/70 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 top-full mt-2 w-56 bg-cosmic-card/95 backdrop-blur-md border border-cosmic-accent/30 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto"
            >
              <div className="p-2">
                <p className="text-xs text-cosmic-text/50 px-3 py-2 uppercase tracking-wider">
                  {t('common.selectLanguage')}
                </p>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleSelect(lang.code)}
                    className={`w-full px-3 py-2.5 text-left flex items-center gap-3 rounded-lg transition-all ${
                      language === lang.code 
                        ? 'bg-gradient-to-r from-cosmic-highlight/20 to-cosmic-accent/20 text-cosmic-highlight' 
                        : 'text-cosmic-text hover:bg-cosmic-accent/20'
                    }`}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{lang.nativeName}</span>
                      <span className="text-xs text-cosmic-text/50">{lang.name}</span>
                    </div>
                    {language === lang.code && (
                      <span className="ml-auto text-cosmic-highlight">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Default variant
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-cosmic-card/30 border border-cosmic-accent/20 rounded-lg hover:border-cosmic-accent/40 transition-all text-sm"
      >
        <span>{currentLanguage?.flag}</span>
        <span className="text-cosmic-text/80">{currentLanguage?.code.toUpperCase()}</span>
        <ChevronDown className={`w-3 h-3 text-cosmic-text/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-52 bg-cosmic-card border border-cosmic-accent/30 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-cosmic-accent/20 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  language === lang.code ? 'bg-cosmic-accent/30 text-cosmic-highlight' : 'text-cosmic-text'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <div className="flex flex-col">
                  <span className="text-sm">{lang.nativeName}</span>
                  <span className="text-xs text-cosmic-text/50">{lang.name}</span>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
