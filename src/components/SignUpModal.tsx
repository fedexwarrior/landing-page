import { motion } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton';

interface SignedInUser {
  email: string;
  name: string;
  credits: number;
  isNewUser: boolean;
}

interface SignUpModalProps {
  onClose: () => void;
  onSignedIn: (user: SignedInUser) => void;
  reason?: string;
}

export function SignUpModal({ onClose, onSignedIn, reason }: SignUpModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="w-full max-w-md glass-strong rounded-2xl border-gold/30 p-6 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 glass-medium rounded-xl text-zinc-400 hover:text-white hover:bg-glass-strong transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 glass-medium rounded-2xl flex items-center justify-center border-gold/30">
            <Sparkles className="w-8 h-8 text-gold" />
          </div>
          <h2 className="font-display font-medium text-2xl text-white mb-2">Sign in to continue</h2>
          <p className="text-zinc-400">
            {reason || "Create a free account to keep going — you'll get 20 free credits right away."}
          </p>
        </div>

        <GoogleSignInButton onSignedIn={onSignedIn} />

        <p className="text-xs text-zinc-500 text-center mt-6">
          By signing in you agree this is a fictional AI companion experience.
        </p>
      </motion.div>
    </motion.div>
  );
}