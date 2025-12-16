import { Brain, Flame, Sparkles, Heart, Shield, Laugh, UserCheck, Eye, PartyPopper, ShieldAlert, HeartHandshake, Waves, Wind, Zap, Moon, Sun, Leaf, Crown, Music, Coffee } from 'lucide-react';

export type PetSpecies = 'dog' | 'cat' | 'rabbit' | 'hamster' | 'guinea_pig' | 'bird' | 'fish' | 'reptile' | 'horse' | 'other';

// Soul type options by species
export const getSoulOptions = (species: PetSpecies) => {
  const baseOptions = [
    { id: 'old-soul', label: 'An Old Soul', description: 'Wise & Calm', icon: Brain },
    { id: 'wild-spirit', label: 'A Wild Spirit', description: 'Untamed & Independent', icon: Flame },
    { id: 'pure-joy', label: 'Pure Joy', description: 'Innocent & Playful', icon: Sparkles },
    { id: 'deep-healer', label: 'A Deep Healer', description: 'Sensitive & Loving', icon: Heart },
  ];

  switch (species) {
    case 'dog':
      return [
        { id: 'loyal-guardian', label: 'Loyal Guardian', description: 'Devoted & Protective', icon: Shield },
        { id: 'playful-pup', label: 'Playful Pup', description: 'Energetic & Fun-loving', icon: Sparkles },
        { id: 'old-soul', label: 'Old Soul', description: 'Wise & Calm', icon: Brain },
        { id: 'gentle-heart', label: 'Gentle Heart', description: 'Sensitive & Loving', icon: Heart },
      ];
    case 'cat':
      return [
        { id: 'mysterious-sage', label: 'Mysterious Sage', description: 'Enigmatic & Wise', icon: Moon },
        { id: 'wild-hunter', label: 'Wild Hunter', description: 'Independent & Fierce', icon: Flame },
        { id: 'lap-royalty', label: 'Lap Royalty', description: 'Regal & Affectionate', icon: Crown },
        { id: 'curious-explorer', label: 'Curious Explorer', description: 'Adventurous & Playful', icon: Sparkles },
      ];
    case 'rabbit':
      return [
        { id: 'gentle-spirit', label: 'Gentle Spirit', description: 'Soft & Sensitive', icon: Heart },
        { id: 'curious-hopper', label: 'Curious Hopper', description: 'Inquisitive & Alert', icon: Sparkles },
        { id: 'zen-bunny', label: 'Zen Bunny', description: 'Calm & Peaceful', icon: Leaf },
        { id: 'social-fluff', label: 'Social Fluff', description: 'Friendly & Affectionate', icon: HeartHandshake },
      ];
    case 'hamster':
    case 'guinea_pig':
      return [
        { id: 'busy-bee', label: 'Busy Bee', description: 'Active & Industrious', icon: Zap },
        { id: 'cozy-soul', label: 'Cozy Soul', description: 'Loves comfort & warmth', icon: Coffee },
        { id: 'curious-nibbler', label: 'Curious Nibbler', description: 'Investigative & Alert', icon: Eye },
        { id: 'social-squeaker', label: 'Social Squeaker', description: 'Chatty & Friendly', icon: Music },
      ];
    case 'bird':
      return [
        { id: 'free-spirit', label: 'Free Spirit', description: 'Independent & Adventurous', icon: Wind },
        { id: 'songster', label: 'The Songster', description: 'Musical & Expressive', icon: Music },
        { id: 'curious-mind', label: 'Curious Mind', description: 'Intelligent & Playful', icon: Brain },
        { id: 'bonded-heart', label: 'Bonded Heart', description: 'Loyal & Affectionate', icon: Heart },
      ];
    case 'fish':
      return [
        { id: 'serene-swimmer', label: 'Serene Swimmer', description: 'Peaceful & Calming', icon: Waves },
        { id: 'bold-explorer', label: 'Bold Explorer', description: 'Curious & Active', icon: Sparkles },
        { id: 'zen-master', label: 'Zen Master', description: 'Tranquil & Meditative', icon: Moon },
        { id: 'social-schooler', label: 'Social Schooler', description: 'Community-oriented', icon: HeartHandshake },
      ];
    case 'reptile':
      return [
        { id: 'ancient-soul', label: 'Ancient Soul', description: 'Wise & Patient', icon: Brain },
        { id: 'sun-seeker', label: 'Sun Seeker', description: 'Warmth-loving & Content', icon: Sun },
        { id: 'silent-observer', label: 'Silent Observer', description: 'Watchful & Calm', icon: Eye },
        { id: 'curious-crawler', label: 'Curious Crawler', description: 'Exploratory & Alert', icon: Sparkles },
      ];
    case 'horse':
      return [
        { id: 'noble-spirit', label: 'Noble Spirit', description: 'Proud & Dignified', icon: Crown },
        { id: 'free-runner', label: 'Free Runner', description: 'Wild & Untamed', icon: Wind },
        { id: 'gentle-giant', label: 'Gentle Giant', description: 'Kind & Nurturing', icon: Heart },
        { id: 'wise-companion', label: 'Wise Companion', description: 'Intuitive & Bonded', icon: Brain },
      ];
    default:
      return baseOptions;
  }
};

// Superpower options by species
export const getSuperpowerOptions = (species: PetSpecies) => {
  const baseOptions = [
    { id: 'empathy', label: 'Empathy', description: 'Senses your emotions', icon: Heart },
    { id: 'joy-bringer', label: 'Joy Bringer', description: 'Always makes you smile', icon: Laugh },
    { id: 'calm-presence', label: 'Calm Presence', description: 'Brings peace to any room', icon: Waves },
    { id: 'loyal-companion', label: 'Loyal Companion', description: 'Always by your side', icon: UserCheck },
  ];

  switch (species) {
    case 'dog':
      return [
        { id: 'empathy', label: 'Empathy', description: 'Knows when you are sad', icon: Heart },
        { id: 'protection', label: 'Protection', description: 'Guards your home fiercely', icon: Shield },
        { id: 'comedian', label: 'The Comedian', description: 'Exists to make you laugh', icon: Laugh },
        { id: 'shadow', label: 'The Shadow', description: 'Never leaves your side', icon: UserCheck },
      ];
    case 'cat':
      return [
        { id: 'stress-reliever', label: 'Stress Reliever', description: 'Purrs away your worries', icon: Waves },
        { id: 'pest-control', label: 'Pest Control', description: 'Keeps your home critter-free', icon: Shield },
        { id: 'entertainment', label: 'Entertainment', description: 'Endless amusing antics', icon: Laugh },
        { id: 'warmth-giver', label: 'Warmth Giver', description: 'The perfect lap warmer', icon: Coffee },
      ];
    case 'rabbit':
      return [
        { id: 'zen-master', label: 'Zen Master', description: 'Brings calm to your space', icon: Leaf },
        { id: 'joy-hopper', label: 'Joy Hopper', description: 'Binkies brighten your day', icon: Sparkles },
        { id: 'gentle-healer', label: 'Gentle Healer', description: 'Soothes with soft presence', icon: Heart },
        { id: 'curious-entertainer', label: 'Curious Entertainer', description: 'Always exploring something', icon: Eye },
      ];
    case 'hamster':
    case 'guinea_pig':
      return [
        { id: 'night-companion', label: 'Night Companion', description: 'Keeps you company late', icon: Moon },
        { id: 'mood-lifter', label: 'Mood Lifter', description: 'Cheek pouches = instant joy', icon: Laugh },
        { id: 'routine-keeper', label: 'Routine Keeper', description: 'Reminds you of feeding time', icon: Zap },
        { id: 'cozy-comfort', label: 'Cozy Comfort', description: 'Small but mighty comfort', icon: Heart },
      ];
    case 'bird':
      return [
        { id: 'morning-singer', label: 'Morning Singer', description: 'Wakes you with song', icon: Music },
        { id: 'mimicry-master', label: 'Mimicry Master', description: 'Copies sounds perfectly', icon: Laugh },
        { id: 'alert-system', label: 'Alert System', description: 'Announces all visitors', icon: ShieldAlert },
        { id: 'conversation-partner', label: 'Conversation Partner', description: 'Always ready to chat', icon: HeartHandshake },
      ];
    case 'fish':
      return [
        { id: 'meditation-aid', label: 'Meditation Aid', description: 'Calming to watch swim', icon: Waves },
        { id: 'stress-reducer', label: 'Stress Reducer', description: 'Lowers your blood pressure', icon: Heart },
        { id: 'ambient-beauty', label: 'Ambient Beauty', description: 'Living art in your home', icon: Sparkles },
        { id: 'routine-anchor', label: 'Routine Anchor', description: 'Feeding time grounds you', icon: Sun },
      ];
    case 'reptile':
      return [
        { id: 'conversation-starter', label: 'Conversation Starter', description: 'Everyone asks about them', icon: Laugh },
        { id: 'zen-presence', label: 'Zen Presence', description: 'Teaches you patience', icon: Brain },
        { id: 'low-key-companion', label: 'Low-Key Companion', description: 'Calm, undemanding presence', icon: Waves },
        { id: 'unique-bond', label: 'Unique Bond', description: 'Special connection few understand', icon: Heart },
      ];
    case 'horse':
      return [
        { id: 'therapy-presence', label: 'Therapy Presence', description: 'Heals through connection', icon: Heart },
        { id: 'freedom-giver', label: 'Freedom Giver', description: 'Riding feels like flying', icon: Wind },
        { id: 'confidence-builder', label: 'Confidence Builder', description: 'Makes you feel powerful', icon: Crown },
        { id: 'intuitive-reader', label: 'Intuitive Reader', description: 'Senses your every mood', icon: Eye },
      ];
    default:
      return baseOptions;
  }
};

// Stranger reaction options by species
export const getStrangerOptions = (species: PetSpecies) => {
  const baseOptions = [
    { id: 'friendly', label: 'Friendly', description: 'Approaches with curiosity', icon: PartyPopper },
    { id: 'observer', label: 'The Observer', description: 'Watches from a distance', icon: Eye },
    { id: 'shy', label: 'Shy', description: 'Hides or retreats', icon: ShieldAlert },
    { id: 'indifferent', label: 'Indifferent', description: 'Carries on unbothered', icon: Coffee },
  ];

  switch (species) {
    case 'dog':
      return [
        { id: 'greeter', label: 'The Greeter', description: 'Jumps/licks immediately', icon: PartyPopper },
        { id: 'observer', label: 'The Observer', description: 'Watches from a distance', icon: Eye },
        { id: 'guardian', label: 'The Guardian', description: 'Barks/stands ground', icon: ShieldAlert },
        { id: 'charmer', label: 'The Charmer', description: 'Belly up instantly', icon: HeartHandshake },
      ];
    case 'cat':
      return [
        { id: 'hider', label: 'The Hider', description: 'Vanishes under furniture', icon: Moon },
        { id: 'investigator', label: 'The Investigator', description: 'Cautious sniff inspection', icon: Eye },
        { id: 'social-butterfly', label: 'Social Butterfly', description: 'Loves all attention', icon: PartyPopper },
        { id: 'royalty', label: 'The Royalty', description: 'Ignores them completely', icon: Crown },
      ];
    case 'rabbit':
      return [
        { id: 'thumper', label: 'The Thumper', description: 'Thumps in warning', icon: ShieldAlert },
        { id: 'curious-one', label: 'The Curious One', description: 'Approaches slowly to sniff', icon: Eye },
        { id: 'freezer', label: 'The Freezer', description: 'Stays very still', icon: Moon },
        { id: 'friendly-flop', label: 'Friendly Flop', description: 'Relaxed around everyone', icon: HeartHandshake },
      ];
    case 'hamster':
    case 'guinea_pig':
      return [
        { id: 'squeaker', label: 'The Squeaker', description: 'Vocalizes excitedly', icon: Music },
        { id: 'hider', label: 'The Hider', description: 'Retreats to their house', icon: Moon },
        { id: 'curious-sniff', label: 'Curious Sniff', description: 'Investigates new scents', icon: Eye },
        { id: 'popcorner', label: 'The Popcorner', description: 'Jumps around excitedly', icon: Sparkles },
      ];
    case 'bird':
      return [
        { id: 'alarm-caller', label: 'Alarm Caller', description: 'Loud warning calls', icon: ShieldAlert },
        { id: 'show-off', label: 'The Show-Off', description: 'Performs for attention', icon: PartyPopper },
        { id: 'quiet-observer', label: 'Quiet Observer', description: 'Watches silently', icon: Eye },
        { id: 'talker', label: 'The Talker', description: 'Tries to communicate', icon: Music },
      ];
    case 'fish':
      return [
        { id: 'glass-surfer', label: 'Glass Surfer', description: 'Swims to the front', icon: PartyPopper },
        { id: 'hider', label: 'The Hider', description: 'Retreats to plants/caves', icon: Moon },
        { id: 'unbothered', label: 'Unbothered', description: 'Continues as normal', icon: Coffee },
        { id: 'feeder-expecter', label: 'Feeder Expecter', description: 'Thinks it is feeding time', icon: Zap },
      ];
    case 'reptile':
      return [
        { id: 'basker', label: 'The Basker', description: 'Continues basking unbothered', icon: Sun },
        { id: 'hider', label: 'The Hider', description: 'Retreats to their hide', icon: Moon },
        { id: 'alert-watcher', label: 'Alert Watcher', description: 'Freezes and watches', icon: Eye },
        { id: 'explorer', label: 'The Explorer', description: 'Comes to investigate', icon: Sparkles },
      ];
    case 'horse':
      return [
        { id: 'friendly-nickerer', label: 'Friendly Nickerer', description: 'Greets with soft sounds', icon: HeartHandshake },
        { id: 'cautious-one', label: 'The Cautious One', description: 'Keeps distance at first', icon: Eye },
        { id: 'protector', label: 'The Protector', description: 'Ears back, on alert', icon: ShieldAlert },
        { id: 'attention-seeker', label: 'Attention Seeker', description: 'Approaches for treats', icon: PartyPopper },
      ];
    default:
      return baseOptions;
  }
};
