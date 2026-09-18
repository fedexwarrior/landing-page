import { useEffect, useRef } from 'react';

interface GoogleSignInButtonProps {
  onSignedIn: (user: { email: string; name: string; credits: number; isNewUser: boolean }) => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

export function GoogleSignInButton({ onSignedIn }: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scriptId = 'google-identity-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    } else {
      initGoogle();
    }

    function initGoogle() {
      if (!window.google || !buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response: { credential: string }) => {
          try {
            const res = await fetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken: response.credential }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Sign-in failed');
            onSignedIn(data);
          } catch (err: any) {
            console.error('Sign-in error:', err);
            alert('Sign-in failed. Please try again.');
          }
        },
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        width: 280,
      });
    }
  }, [onSignedIn]);

  return <div ref={buttonRef} className="flex justify-center" />;
}