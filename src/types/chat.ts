export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  characterId?: string;
  metadata?: {
    tokensUsed?: number;
    creditCost?: number;
    premiumFeaturesUsed?: string[];
    emotion?: string;
    voiceProfile?: VoiceProfileSnapshot;
    specialAbilityUsed?: string;
  };
  isStreaming?: boolean;
  isEdited?: boolean;
  replyTo?: string;
}

export interface VoiceProfileSnapshot {
  tone: string;
  pace: string;
  vocabulary: string;
}

export interface ChatSession {
  id: string;
  characterId: string;
  userId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  totalCreditsSpent: number;
  totalTokensUsed: number;
  premiumFeaturesUnlocked: string[];
  relationshipLevel: number;
  relationshipDynamic: string;
  context: {
    summary: string;
    keyTopics: string[];
    userPreferences: Record<string, unknown>;
  };
  settings: ChatSettings;
}

export interface ChatSettings {
  streamingEnabled: boolean;
  autoScroll: boolean;
  showTimestamps: boolean;
  compactMode: boolean;
  nsfwFilter: boolean;
  voiceEnabled: boolean;
  soundEffects: boolean;
  animationsEnabled: boolean;
  messageAnimation: 'fade' | 'slide' | 'typewriter' | 'none';
}

export interface TypingIndicator {
  characterId: string;
  isTyping: boolean;
  progress?: number;
}

export interface ChatState {
  currentSession: ChatSession | null;
  sessions: Map<string, ChatSession>;
  typingIndicator: TypingIndicator | null;
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
}

export interface StreamingChunk {
  content: string;
  done: boolean;
  metadata?: {
    tokensUsed: number;
    creditCost: number;
  };
}

export interface SendMessageOptions {
  sessionId: string;
  content: string;
  usePremiumFeatures?: string[];
  specialAbilityId?: string;
  replyToMessageId?: string;
}

export interface ChatResponse {
  message: Message;
  session: ChatSession;
  creditsDeducted: number;
  premiumFeaturesActivated: string[];
}