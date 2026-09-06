import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, logOut } from './lib/firebase';
import { subscribeToUserInteractions, deleteJournalInteraction } from './lib/journalService';
import { JournalInteraction } from './types';
import { LandingPage } from './components/LandingPage';
import { Navbar } from './components/Navbar';
import { HistorySidebar } from './components/HistorySidebar';
import { JournalEditor } from './components/JournalEditor';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Journal interactions state
  const [interactions, setInteractions] = useState<JournalInteraction[]>([]);
  const [activeInteraction, setActiveInteraction] = useState<JournalInteraction | null>(null);
  const [interactionsLoading, setInteractionsLoading] = useState(false);
  const [zenMode, setZenMode] = useState(false);

  // Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setAuthError(error.message);
        setAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Real-time Firestore subscription when user is authenticated
  useEffect(() => {
    if (!user) {
      setInteractions([]);
      setActiveInteraction(null);
      return;
    }

    setInteractionsLoading(true);
    const unsubscribe = subscribeToUserInteractions(
      user.uid,
      (updatedInteractions) => {
        setInteractions(updatedInteractions);
        setInteractionsLoading(false);

        // Keep active interaction in sync if updated
        setActiveInteraction((prev) => {
          if (!prev) return null;
          const fresh = updatedInteractions.find((item) => item.id === prev.id);
          return fresh || prev;
        });
      },
      (error) => {
        console.error('Interactions subscription error:', error);
        setInteractionsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Handlers
  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign in error:', err);
      setAuthError(err?.message || 'Failed to sign in with Google');
      throw err;
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setActiveInteraction(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  const handleNewEntry = () => {
    setActiveInteraction(null);
  };

  const handleSelectInteraction = (interaction: JournalInteraction) => {
    setActiveInteraction(interaction);
  };

  const handleDeleteInteraction = async (id: string) => {
    if (!user) return;
    try {
      await deleteJournalInteraction(user.uid, id);
      if (activeInteraction?.id === id) {
        setActiveInteraction(null);
      }
    } catch (err) {
      console.error('Failed to delete interaction:', err);
    }
  };

  const handleInteractionSaved = (saved: JournalInteraction) => {
    setActiveInteraction(saved);
  };

  // Auth Loading Screen
  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#faf9f6]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-stone-300 border-t-stone-900" />
          <p className="text-xs font-medium text-stone-500">Initializing secure session...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated Landing Page
  if (!user) {
    return (
      <LandingPage
        onSignIn={handleSignIn}
        isLoading={authLoading}
        error={authError}
      />
    );
  }

  // Authenticated Private Dashboard
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-white text-stone-900">
      <Navbar
        user={user}
        onSignOut={handleSignOut}
        onNewEntry={handleNewEntry}
        activeModel="gemini-3.6-flash"
        zenMode={zenMode}
        onToggleZenMode={() => setZenMode((prev) => !prev)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Journal History (collapsible via Zen Mode) */}
        {!zenMode && (
          <div className="w-80 shrink-0 hidden md:block transition-all duration-300">
            <HistorySidebar
              interactions={interactions}
              selectedId={activeInteraction?.id || null}
              onSelectInteraction={handleSelectInteraction}
              onDeleteInteraction={handleDeleteInteraction}
              onNewEntry={handleNewEntry}
              isLoading={interactionsLoading}
            />
          </div>
        )}

        {/* Center Canvas: Active Journal Editor & Multi-turn Reflection */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <JournalEditor
            userId={user.uid}
            activeInteraction={activeInteraction}
            onInteractionSaved={handleInteractionSaved}
            onNewEntryRequested={handleNewEntry}
            zenMode={zenMode}
            onToggleZenMode={() => setZenMode((prev) => !prev)}
          />
        </main>
      </div>
    </div>
  );
}
