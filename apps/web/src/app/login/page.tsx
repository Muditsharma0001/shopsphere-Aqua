'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const roleParam = searchParams.get('role') || 'CUSTOMER';
  const role = roleParam.toUpperCase();

  const handleGoogleLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    window.location.href = `${apiUrl}/auth/google?role=${role}`;
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-zinc-950 px-6 py-12 lg:px-8 text-zinc-100 font-sans antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/25">
          <span className="text-2xl font-bold text-white">S</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
          Sign In to ShopSphere
        </h2>
        <p className="mt-2 text-center text-xs text-indigo-400 uppercase tracking-widest font-bold">
          Role Access: {role}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm px-6 py-8 shadow-xl sm:px-10">
          {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-400">
              {error === 'auth_failed' 
                ? 'Google Authentication failed. Please try again.' 
                : 'Authentication error. Session details missing.'}
            </div>
          )}

          {/* Social login option only */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-indigo-500 bg-indigo-600 px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-sm transition-all duration-300 hover:bg-indigo-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/20 cursor-pointer"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Email login/signup forms temporarily disabled but preserved structurally below */}
          {/*
          <form className="hidden space-y-4">
            <input type="email" placeholder="Email" />
            <input type="password" placeholder="Password" />
            <button type="submit">Sign In</button>
          </form>
          */}

          <div className="mt-8 border-t border-zinc-800/80 pt-6 text-center text-xs text-zinc-500">
            <span>By clicking Continue, you agree to ShopSphere&apos;s </span>
            <a href="#" className="font-semibold text-zinc-400 hover:text-indigo-400 transition-colors">Terms of Service</a>
            <span> and </span>
            <a href="#" className="font-semibold text-zinc-400 hover:text-indigo-400 transition-colors">Privacy Policy</a>
            <span>.</span>
          </div>

          <div className="mt-4 text-center text-xs text-zinc-500">
            <Link href="/portal" className="hover:text-indigo-400 transition-colors">
              ← Choose another experience path
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center font-sans antialiased">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-zinc-400 text-sm">Loading session...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
