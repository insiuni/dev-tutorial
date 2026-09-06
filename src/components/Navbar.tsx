import { User } from 'firebase/auth';
import { Sparkles, BookOpen, LogOut, ShieldCheck, Maximize2, Minimize2 } from 'lucide-react';

interface NavbarProps {
  user: User;
  onSignOut: () => void;
  onNewEntry: () => void;
  activeModel?: string;
  zenMode?: boolean;
  onToggleZenMode?: () => void;
}

export function Navbar({
  user,
  onSignOut,
  onNewEntry,
  activeModel = 'gemini-3.6-flash',
  zenMode = false,
  onToggleZenMode,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-stone-50 shadow-sm">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-stone-900">
                ReflectAI
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 ring-inset">
                <ShieldCheck className="h-3 w-3" />
                Firestore Isolated
              </span>
              {zenMode && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-600/20 ring-inset">
                  Zen Sanctuary
                </span>
              )}
            </div>
            <p className="hidden text-xs text-stone-500 sm:block">
              Journal & Reflections powered by Gemini
            </p>
          </div>
        </div>

        {/* Model Indicator & User Controls */}
        <div className="flex items-center gap-3">
          {onToggleZenMode && (
            <button
              id="nav-zen-toggle-btn"
              onClick={onToggleZenMode}
              title={zenMode ? 'Exit Zen Mode (Show Sidebar)' : 'Enter Zen Sanctuary (Distraction-Free)'}
              className={`hidden sm:flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                zenMode
                  ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                  : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {zenMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span>{zenMode ? 'Exit Zen' : 'Zen Mode'}</span>
            </button>
          )}

          <div className="hidden items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-600 md:flex">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span className="font-mono text-[11px] font-medium text-stone-700">{activeModel}</span>
          </div>

          <button
            id="nav-new-entry-btn"
            onClick={onNewEntry}
            className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-stone-800 shadow-sm cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>New Reflection</span>
          </button>

          <div className="h-5 w-[1px] bg-stone-200" />

          {/* User profile */}
          <div className="flex items-center gap-2.5">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="h-8 w-8 rounded-full border border-stone-200 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200 text-xs font-semibold text-stone-700">
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden flex-col text-left sm:flex">
              <span className="text-xs font-medium text-stone-900 max-w-[130px] truncate">
                {user.displayName || user.email?.split('@')[0]}
              </span>
              <span className="text-[10px] text-stone-400 max-w-[130px] truncate">
                {user.email}
              </span>
            </div>

            <button
              id="sign-out-btn"
              onClick={onSignOut}
              title="Sign Out"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
