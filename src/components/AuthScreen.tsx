import { useState } from 'react';
import { FlaskConical, GraduationCap, ShieldCheck, Mail, Lock, User, Loader as Loader2, CircleAlert as AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../lib/auth';
import type { UserRole } from '../lib/supabase';

export default function AuthScreen() {
  const { signIn, signUp, teacherExists } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (mode === 'signup') {
      const { error } = await signUp(email, password, role);
      if (error) setError(error);
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    }
    setSubmitting(false);
  };

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setError(null);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 p-4 animate-fade-in">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-brand-400/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 items-center justify-center shadow-xl shadow-brand-500/30 mb-3 transition-all duration-200 hover:scale-105">
            <FlaskConical size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Molekul</h1>
          <p className="text-sm text-slate-400 mt-1">Advanced Level Chemistry Portal</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-7 animate-scale-in border border-white/20">
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-5">
            <button
              onClick={() => switchMode('signin')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-in-out ${
                mode === 'signin' ? 'bg-white text-slate-900 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:scale-[1.02]'
              }`}
            >
              <LogIn size={16} />
              Sign In
            </button>
            <button
              onClick={() => switchMode('signup')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-in-out ${
                mode === 'signup' ? 'bg-white text-slate-900 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:scale-[1.02]'
              }`}
            >
              <UserPlus size={16} />
              Create Account
            </button>
          </div>

          {mode === 'signup' && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-2">I am a...</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all duration-200 ease-in-out ${
                    role === 'student'
                      ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-md shadow-brand-500/15 scale-[1.02]'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:scale-[1.02]'
                  }`}
                >
                  <GraduationCap size={20} />
                  <span className="text-xs font-semibold">Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  disabled={teacherExists}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all duration-200 ease-in-out ${
                    teacherExists
                      ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                      : role === 'teacher'
                      ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-md shadow-brand-500/15 scale-[1.02]'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:scale-[1.02]'
                  }`}
                >
                  <ShieldCheck size={20} />
                  <span className="text-xs font-semibold">
                    {teacherExists ? 'Teacher Taken' : 'Teacher'}
                  </span>
                </button>
              </div>
              {teacherExists && (
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={11} />
                  A teacher account already exists. Only one teacher can register.
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 animate-fade-in">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  minLength={6}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 active:scale-95 transition-all duration-200 ease-in-out shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : mode === 'signin' ? (
                <><LogIn size={18} /> Sign In</>
              ) : (
                <><UserPlus size={18} /> Create Account</>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-4">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-brand-600 font-semibold hover:underline"
            >
              {mode === 'signin' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          Molekul &middot; For educational use &middot; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
