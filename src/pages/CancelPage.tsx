import { Link } from 'react-router-dom';
import { ArrowLeft, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 relative">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-radial-gold rounded-full blur-3xl animate-float opacity-50" />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-strong rounded-2xl border-yellow-500/30 p-8 max-w-md w-full text-center"
      >
        <motion.div
          className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <XCircle className="w-8 h-8 text-yellow-500" />
        </motion.div>
        <h2 className="font-display font-medium text-2xl text-white mb-2">Payment Cancelled</h2>
        <p className="text-zinc-400 mb-6">No charges were made. You can try again anytime.</p>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 btn-ghost"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Companions
        </Link>
      </motion.div>
    </div>
  );
}