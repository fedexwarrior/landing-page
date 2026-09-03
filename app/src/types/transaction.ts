export interface CreditPackage {
  id: string;
  name: string;
  description: string;
  credits: number;
  bonusCredits: number;
  price: number; // in cents
  currency: string;
  stripePriceId: string;
  tier: 'starter' | 'popular' | 'value' | 'premium' | 'ultimate';
  isPopular: boolean;
  isBestValue: boolean;
  features: string[];
  badge?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'purchase' | 'spend' | 'refund' | 'bonus' | 'referral' | 'daily_reward';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number; // credits (positive for gain, negative for spend)
  currencyAmount?: number; // in cents for purchases
  currency?: string;
  description: string;
  metadata?: {
    packageId?: string;
    sessionId?: string;
    characterId?: string;
    featureId?: string;
    stripePaymentIntentId?: string;
    stripeSessionId?: string;
  };
  createdAt: number;
  completedAt?: number;
}

export interface UserCredits {
  balance: number;
  totalPurchased: number;
  totalSpent: number;
  lifetimeEarned: number;
  tier: 'free' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  dailyStreak: number;
  lastDailyClaim: number;
  referralCode: string;
  referredBy?: string;
  referralCredits: number;
}

export interface StripeCheckoutSession {
  sessionId: string;
  url: string;
  expiresAt: number;
}

export interface StripePortalSession {
  url: string;
}

export interface PurchaseRequest {
  packageId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}

export interface SpendCreditsRequest {
  amount: number;
  characterId: string;
  sessionId: string;
  featureId?: string;
  description: string;
}

export interface TransactionGatewayState {
  creditPackages: CreditPackage[];
  userCredits: UserCredits | null;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  checkoutSession: StripeCheckoutSession | null;
  portalSession: StripePortalSession | null;
}

export interface PremiumUnlock {
  featureId: string;
  characterId: string;
  permanent: boolean;
  expiresAt?: number;
  creditCost: number;
}

export interface UserPremiumAccess {
  characterId: string;
  features: PremiumUnlock[];
  subscriptionTier?: 'monthly' | 'yearly' | 'lifetime';
  subscriptionExpiresAt?: number;
}

export interface RetentionMechanic {
  id: string;
  type: 'daily_login' | 'streak_bonus' | 'level_up' | 'referral' | 'achievement' | 'event' | 'comeback';
  name: string;
  description: string;
  reward: {
    credits: number;
    premiumFeatureUnlock?: string;
    exclusiveContent?: string;
  };
  requirements: {
    consecutiveDays?: number;
    level?: number;
    referrals?: number;
    achievementId?: string;
    eventId?: string;
    daysInactive?: number;
  };
  cooldown: number; // in hours, 0 = no cooldown
  maxClaims: number; // -1 = unlimited
}

export interface UserRetentionState {
  dailyStreak: number;
  lastLogin: number;
  totalLogins: number;
  claimedRewards: string[];
  achievements: string[];
  referralCount: number;
  comebackEligible: boolean;
  lastActivity: number;
}