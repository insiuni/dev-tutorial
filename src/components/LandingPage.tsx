import { useState } from 'react';
import { BookOpen, Sparkles, ShieldCheck, Lock, ArrowRight, MessageSquareQuote, CheckCircle2, AlertCircle } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

export function LandingPage({ onSignIn, isLoading, error }: LandingPageProps) {
  const [internalError, setInternalError] = useState<string | null>(null);

  const handleSignInClick = async () => {
    setInternalError(null);
    try {
      await onSignIn();
    } catch (err: any) {
      setInternalError(err?.message || 'Authentication was cancelled or failed.');
    }
  };

  const displayError = error || internalError;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 flex flex-col justify-between">
      {/* Top bar */}
      <header className="border-b border-stone-200/80 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-stone-50">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-base font-bold tracking-tight text-stone-900">
              ReflectAI
            </span>
          </div>

          <button
            id="landing-signin-top-btn"
            onClick={handleSignInClick}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-stone-800 disabled:opacity-50 cursor-pointer"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In with Google'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Main Hero */}
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-700 shadow-sm mb-6">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>Powered by Gemini 3.6 Flash & Cloud Firestore</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl font-serif">
            Your Private Space for Thought, Reflection & Clarity
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-stone-600 leading-relaxed">
            Write uninhibited journal reflections and engage in private, multi-turn dialogues with Gemini. Gain structured summaries, fresh perspectives, and deep personal insights.
          </p>

          {/* Sign In Card */}
          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-800">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="text-base font-semibold text-stone-900">
                Sign in to your private vault
              </h2>
              <p className="mt-1 text-xs text-stone-500 text-center">
                Strict user data isolation ensures your journal entries are exclusively accessible by your verified identity.
              </p>

              {displayError && (
                <div className="mt-4 flex w-full items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-left text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <div className="flex-1">{displayError}</div>
                </div>
              )}

              <button
                id="landing-google-signin-btn"
                onClick={handleSignInClick}
                disabled={isLoading}
                className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 shadow-sm transition hover:bg-stone-50 hover:border-stone-400 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {/* Google vector icon */}
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>

              <div className="mt-4 flex items-center gap-1.5 text-[11px] text-stone-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Zero stored passwords. Authenticated via Google OAuth.</span>
              </div>
            </div>
          </div>

          {/* Pillars */}
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3 text-left">
            <div className="rounded-xl border border-stone-200/90 bg-white p-5 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-800 mb-3">
                <MessageSquareQuote className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900">Multi-Turn Reflections</h3>
              <p className="mt-1.5 text-xs text-stone-600 leading-relaxed">
                Receive thoughtful feedback on your entries and continue the conversation with Gemini to unpack ideas, emotions, or dilemmas.
              </p>
            </div>

            <div className="rounded-xl border border-stone-200/90 bg-white p-5 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-800 mb-3">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900">Strict Data Isolation</h3>
              <p className="mt-1.5 text-xs text-stone-600 leading-relaxed">
                Rules-enforced database documents under <code className="rounded bg-stone-100 px-1 py-0.5 font-mono text-[10px]">/users/&#123;uid&#125;/interactions</code> ensure no other user can read or write your records.
              </p>
            </div>

            <div className="rounded-xl border border-stone-200/90 bg-white p-5 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-800 mb-3">
                <CheckCircle2 className="h-4 w-4 text-amber-600" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900">Resilient Fallback Ladder</h3>
              <p className="mt-1.5 text-xs text-stone-600 leading-relaxed">
                Built-in automatic failover between Gemini 3.6 Flash, 3.1 Flash-Lite, and Flash-Latest ensures uninterrupted creative continuity.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 bg-white py-6 text-center text-xs text-stone-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ReflectAI • Authenticated Gemini Reflections Platform</span>
          <span className="font-mono text-[11px] text-stone-400">GCP Cloud Run • Cloud Firestore • Firebase Auth</span>
        </div>
      </footer>
    </div>
  );
}
