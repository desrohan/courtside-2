import { motion } from 'framer-motion';
import { Hexagon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-white to-court-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-court-500 to-court-700 flex items-center justify-center shadow-lg mb-4">
            <Hexagon size={28} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-extrabold text-dark-900 tracking-tight">Courtside</h1>
          <p className="text-sm text-dark-400 mt-1">Sports management platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-elevated border border-dark-100 p-8">
          <h2 className="text-xl font-bold text-dark-900 mb-1">Welcome back</h2>
          <p className="text-sm text-dark-400 mb-8">Sign in to your account to continue</p>

          <button
            onClick={signInWithGoogle}
            className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border border-dark-200 bg-white hover:bg-dark-50 transition-colors text-sm font-semibold text-dark-800 shadow-sm hover:shadow"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="text-center text-[11px] text-dark-400 mt-6 leading-relaxed">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}
