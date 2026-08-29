'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Lock,
  Mail,
  User,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

import { login, register } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    let res;
    if (isSignUp) {
      if (!name.trim()) {
        setErrorMsg('Please enter your name.');
        setLoading(false);
        return;
      }
      res = await register(name.trim(), email.trim(), password);
    } else {
      res = await login(email.trim(), password);
    }

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      router.push('/');
    }
    setLoading(false);
  };

  const handleDemoLogin = async (demoEmail: string, demoName: string) => {
    setLoading(true);
    setErrorMsg(null);
    const demoPassword = 'Password123!';

    let res = await login(demoEmail, demoPassword);
    if (res.error) {
      res = await register(demoName, demoEmail, demoPassword);
    }

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      router.push('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Logo / Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl mb-2 text-blue-500">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            ChangeShield Platform
          </h1>
          <p className="text-xs text-slate-400">
            Schema Change Impact & Blast Radius Intelligence
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 space-y-6">
          {/* Toggle Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl">
            <button
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                !isSignUp
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                isSignUp
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {isSignUp && (
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@changeshield.dev"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/40 border border-rose-900/60 text-rose-300 rounded-lg flex items-center space-x-2 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-xs flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Shortcuts */}
          <div className="border-t border-slate-800 pt-4 space-y-2">
            <div className="flex items-center space-x-1 text-slate-400 text-[11px] font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Demo Access:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@changeshield.dev', 'Demo Admin')}
                className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium text-center transition-colors cursor-pointer"
              >
                Demo Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('engineer@changeshield.dev', 'Demo Engineer')}
                className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium text-center transition-colors cursor-pointer"
              >
                Demo Engineer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
