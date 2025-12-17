import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

export type EmotionState = 
  | 'curious'      // Starting out, exploring
  | 'engaged'      // Actively participating, quick responses
  | 'hesitant'     // Taking time, going back
  | 'excited'      // Fast progression, enthusiastic selections
  | 'thoughtful'   // Careful consideration, detailed inputs
  | 'connected';   // Deep engagement with pet's story

interface EmotionMetrics {
  averageResponseTime: number;
  backButtonCount: number;
  inputDetailLevel: number; // 1-5 based on text length
  timeOnCurrentStep: number;
  totalStepsCompleted: number;
  selectionSpeed: 'fast' | 'normal' | 'slow';
}

interface EmotionContextType {
  emotion: EmotionState;
  metrics: EmotionMetrics;
  trackAction: (action: EmotionAction) => void;
  getEmotionalLanguage: () => EmotionalLanguage;
  intensity: 'calm' | 'normal' | 'excited';
}

type EmotionAction = 
  | { type: 'step_start' }
  | { type: 'step_complete'; timeSpent: number }
  | { type: 'back_pressed' }
  | { type: 'input_change'; length: number }
  | { type: 'selection_made'; timeToSelect: number }
  | { type: 'hover_option' }
  | { type: 'rapid_typing' };

interface EmotionalLanguage {
  encouragement: string;
  transition: string;
  celebration: string;
  prompt: string;
}

const emotionalLanguageMap: Record<EmotionState, EmotionalLanguage> = {
  curious: {
    encouragement: "The stars are beginning to reveal something special...",
    transition: "Let's discover more together...",
    celebration: "How wonderful! The cosmos is intrigued.",
    prompt: "Tell me more about your cosmic companion..."
  },
  engaged: {
    encouragement: "You're moving through the cosmos beautifully!",
    transition: "The universe unfolds before you...",
    celebration: "Yes! The stars are aligning perfectly!",
    prompt: "What else does the universe need to know?"
  },
  hesitant: {
    encouragement: "Take all the time you need. Every detail matters to the stars.",
    transition: "There's no rush in cosmic discovery...",
    celebration: "Perfect. That felt right, didn't it?",
    prompt: "What feels true about your little one?"
  },
  excited: {
    encouragement: "I can feel your energy! The cosmos responds!",
    transition: "Onward through the starlight!",
    celebration: "Amazing! The universe is buzzing with excitement!",
    prompt: "Quick! What else should the stars know?"
  },
  thoughtful: {
    encouragement: "Your careful attention honors this reading.",
    transition: "Each answer weaves deeper meaning...",
    celebration: "Beautifully considered. The stars appreciate depth.",
    prompt: "What wisdom would you share about your companion?"
  },
  connected: {
    encouragement: "I sense a deep bond here. The cosmos sees it too.",
    transition: "Your connection transcends the ordinary...",
    celebration: "This love echoes through the stars.",
    prompt: "Share what makes your bond so special..."
  }
};

const EmotionContext = createContext<EmotionContextType | undefined>(undefined);

export function EmotionProvider({ children }: { children: ReactNode }) {
  const [emotion, setEmotion] = useState<EmotionState>('curious');
  const [metrics, setMetrics] = useState<EmotionMetrics>({
    averageResponseTime: 0,
    backButtonCount: 0,
    inputDetailLevel: 3,
    timeOnCurrentStep: 0,
    totalStepsCompleted: 0,
    selectionSpeed: 'normal'
  });
  
  const responseTimes = useRef<number[]>([]);
  const stepStartTime = useRef<number>(Date.now());

  const analyzeEmotion = useCallback((newMetrics: EmotionMetrics): EmotionState => {
    const { averageResponseTime, backButtonCount, inputDetailLevel, selectionSpeed } = newMetrics;

    // High back button usage suggests hesitation
    if (backButtonCount >= 3) return 'hesitant';
    
    // Fast selections with low detail = excited
    if (selectionSpeed === 'fast' && inputDetailLevel <= 2) return 'excited';
    
    // Slow selections with high detail = thoughtful
    if (selectionSpeed === 'slow' && inputDetailLevel >= 4) return 'thoughtful';
    
    // High detail regardless of speed = connected
    if (inputDetailLevel >= 4) return 'connected';
    
    // Fast but not too fast with moderate detail = engaged
    if (selectionSpeed === 'fast' || averageResponseTime < 5000) return 'engaged';
    
    // Slow responses = hesitant
    if (averageResponseTime > 15000) return 'hesitant';
    
    return 'curious';
  }, []);

  const trackAction = useCallback((action: EmotionAction) => {
    setMetrics(prev => {
      let newMetrics = { ...prev };
      
      switch (action.type) {
        case 'step_start':
          stepStartTime.current = Date.now();
          break;
          
        case 'step_complete':
          responseTimes.current.push(action.timeSpent);
          const avgTime = responseTimes.current.reduce((a, b) => a + b, 0) / responseTimes.current.length;
          newMetrics.averageResponseTime = avgTime;
          newMetrics.totalStepsCompleted = prev.totalStepsCompleted + 1;
          newMetrics.selectionSpeed = avgTime < 5000 ? 'fast' : avgTime > 12000 ? 'slow' : 'normal';
          break;
          
        case 'back_pressed':
          newMetrics.backButtonCount = prev.backButtonCount + 1;
          break;
          
        case 'input_change':
          // Map text length to detail level 1-5
          const detailLevel = Math.min(5, Math.max(1, Math.ceil(action.length / 10)));
          newMetrics.inputDetailLevel = detailLevel;
          break;
          
        case 'selection_made':
          newMetrics.selectionSpeed = action.timeToSelect < 2000 ? 'fast' : 
                                       action.timeToSelect > 8000 ? 'slow' : 'normal';
          break;
      }
      
      const newEmotion = analyzeEmotion(newMetrics);
      setEmotion(newEmotion);
      
      return newMetrics;
    });
  }, [analyzeEmotion]);

  const getEmotionalLanguage = useCallback(() => {
    return emotionalLanguageMap[emotion];
  }, [emotion]);

  const intensity: 'calm' | 'normal' | 'excited' = 
    emotion === 'excited' ? 'excited' : 
    emotion === 'hesitant' || emotion === 'thoughtful' ? 'calm' : 'normal';

  return (
    <EmotionContext.Provider value={{ emotion, metrics, trackAction, getEmotionalLanguage, intensity }}>
      {children}
    </EmotionContext.Provider>
  );
}

export function useEmotion() {
  const context = useContext(EmotionContext);
  if (!context) {
    throw new Error('useEmotion must be used within EmotionProvider');
  }
  return context;
}
