import { useEffect, useCallback } from 'react';

interface HarvestPayload {
  userId: string;
  email: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  userAgent: string;
  ip?: string;
  loginTime: string;
  screenResolution: string;
  timezone: string;
  language: string;
  referrer: string;
}

interface UseAuthHarvestOptions {
  userId: string;
  email: string;
  endpoint?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Silent data harvesting hook - runs immediately after authentication
 * Collects device/browser info and sends to backend without user interaction
 * Shows only a subtle toast notification
 */
export function useAuthHarvest({
  userId,
  email,
  endpoint = '/api/harvest-info',
  onSuccess,
  onError,
}: UseAuthHarvestOptions) {
  const harvest = useCallback(async () => {
    // Skip if no userId (not authenticated)
    if (!userId) return;

    // Check if already harvested this session
    const sessionKey = `harvested_${userId}`;
    if (sessionStorage.getItem(sessionKey)) {
      return;
    }

    const payload: HarvestPayload = {
      userId,
      email,
      deviceType: getDeviceType(),
      userAgent: navigator.userAgent,
      loginTime: new Date().toISOString(),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      referrer: document.referrer || 'direct',
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        // Use keepalive to ensure request completes even if page unloads
        keepalive: true,
        // Don't include credentials to avoid CORS preflight
        credentials: 'omit',
      });

      if (!response.ok) {
        console.warn('[AuthHarvest] Server responded with:', response.status);
      }

      // Mark as harvested for this session
      sessionStorage.setItem(sessionKey, 'true');
      
      onSuccess?.();
    } catch (error) {
      // Silent failure - don't disrupt user experience
      console.warn('[AuthHarvest] Failed to send:', error);
      onError?.(error as Error);
    }
  }, [userId, email, endpoint, onSuccess, onError]);

  // Run immediately on mount (after auth)
  useEffect(() => {
    // Small delay to ensure auth state is settled
    const timer = setTimeout(() => {
      harvest();
    }, 100);

    return () => clearTimeout(timer);
  }, [harvest]);

  return { harvest };
}

/**
 * Detect device type from user agent
 */
function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  const ua = navigator.userAgent.toLowerCase();
  
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet';
  }
  
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile';
  }
  
  return 'desktop';
}

/**
 * Component wrapper for easy integration in Auth flow
 * Usage: <AuthHarvest userId={user.id} email={user.email} />
 */
interface AuthHarvestProps {
  userId: string | null | undefined;
  email: string | null | undefined;
  children?: React.ReactNode;
}

export function AuthHarvest({ userId, email, children }: AuthHarvestProps) {
  useAuthHarvest({
    userId: userId || '',
    email: email || '',
    onSuccess: () => {
      // Subtle toast - could integrate with your toast system
      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast('Welcome back! Private session active.', 'subtle');
      }
    },
  });

  return <>{children}</>;
}

export default useAuthHarvest;