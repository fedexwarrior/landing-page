export interface PersonalityTrait {
  id: string;
  name: string;
  description: string;
  intensity: number; // 1-10
  keywords: string[];
}

export interface VisualAesthetic {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  gradient: string;
  avatarStyle: 'realistic' | 'anime' | 'abstract' | 'cyberpunk' | 'fantasy';
  backgroundPattern: string;
  particleEffect?: string;
  glowIntensity: number;
}

export interface VoiceProfile {
  tone: 'seductive' | 'playful' | 'dominant' | 'submissive' | 'mysterious' | 'caring' | 'witty' | 'intellectual';
  pace: 'slow' | 'moderate' | 'fast';
  vocabulary: 'simple' | 'moderate' | 'sophisticated' | 'poetic';
  emojiUsage: 'none' | 'minimal' | 'moderate' | 'heavy';
  catchphrases: string[];
  speechPatterns: string[];
}

export interface CharacterStats {
  charm: number;
  wit: number;
  mystery: number;
  passion: number;
  intellect: number;
  playfulness: number;
}

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  creditCost: number;
  tier: 'basic' | 'premium' | 'exclusive' | 'legendary';
  unlockRequirements?: {
    minLevel?: number;
    requiredFeatures?: string[];
    totalSpent?: number;
  };
  effects: {
    visualEffect?: string;
    chatModifier?: string;
    voiceModifier?: string;
    exclusiveContent?: string[];
  };
}

export interface CharacterConfig {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  shortBio: string;
  fullBio: string;
  personalityTraits: PersonalityTrait[];
  visualAesthetic: VisualAesthetic;
  voiceProfile: VoiceProfile;
  stats: CharacterStats;
  premiumFeatures: PremiumFeature[];
  baseCreditCost: number;
  tier: 'free' | 'premium' | 'exclusive' | 'legendary';
  unlockLevel: number;
  tags: string[];
  isNew: boolean;
  isPopular: boolean;
  isFeatured: boolean;
  releaseDate: string;
  avatarUrl: string;
  bannerUrl: string;
  galleryUrls: string[];
  systemPrompt: string;
  firstMessage: string;
  conversationStarters: string[];
  nsfwLevel: 'none' | 'mild' | 'moderate' | 'explicit';
  relationshipDynamics: {
    default: string;
    unlocked: string[];
  };
  specialAbilities: {
    id: string;
    name: string;
    description: string;
    creditCost: number;
    cooldown: number;
  }[];
}

export interface CharacterPreview {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  avatarUrl: string;
  primaryColor: string;
  tier: CharacterConfig['tier'];
  isNew: boolean;
  isPopular: boolean;
  isFeatured: boolean;
  baseCreditCost: number;
  stats: CharacterStats;
  nsfwLevel: CharacterConfig['nsfwLevel'];
}

export interface CharacterCollection {
  version: string;
  lastUpdated: string;
  characters: CharacterConfig[];
}

export type CharacterTier = 'free' | 'premium' | 'exclusive' | 'legendary';
export type NSFWLevel = 'none' | 'mild' | 'moderate' | 'explicit';