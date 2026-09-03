import { Link } from 'react-router-dom';
import { ArrowLeft, XCircle } from 'lucide-react';

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-yellow-500/30 rounded-2xl p-8 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-yellow-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Payment Cancelled</h2>
        <p className="text-zinc-400 mb-6">No charges were made. You can try again anytime.</p>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Characters
        </Link>
      </div>
    </div>
  );
}