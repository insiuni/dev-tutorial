import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import {
  Sparkles,
  Send,
  Save,
  FileText,
  Lightbulb,
  MessageSquare,
  Compass,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  Tag,
  Clock,
  ExternalLink,
  Brain,
  Share2,
  Maximize2,
  Minimize2,
  Feather,
} from 'lucide-react';
import {
  JournalInteraction,
  ReflectionMode,
  ChatMessage,
  ReflectionPrompt,
  PerspectiveLens,
  EmotionalMood,
  CognitiveClarityInsights,
} from '../types';
import {
  requestReflection,
  requestSummary,
  requestClarity,
  fetchReflectionPrompts,
} from '../lib/geminiClient';
import { createJournalInteraction, updateJournalInteraction } from '../lib/journalService';
import { ReflectionCardModal } from './ReflectionCardModal';
import { CognitiveClarityCard } from './CognitiveClarityCard';

const EMOTIONAL_MOODS: { id: EmotionalMood; label: string; icon: string; ringColor: string }[] = [
  { id: 'reflective', label: 'Reflective', icon: '🌿', ringColor: 'border-emerald-400 text-emerald-900 bg-emerald-50' },
  { id: 'grateful', label: 'Grateful', icon: '☀️', ringColor: 'border-amber-400 text-amber-900 bg-amber-50' },
  { id: 'anxious', label: 'Overwhelmed', icon: '🌪️', ringColor: 'border-violet-400 text-violet-900 bg-violet-50' },
  { id: 'inspired', label: 'Inspired', icon: '💡', ringColor: 'border-yellow-400 text-yellow-900 bg-yellow-50' },
  { id: 'heavy', label: 'Heavy', icon: '🌙', ringColor: 'border-slate-400 text-slate-900 bg-slate-100' },
  { id: 'resolute', label: 'Resolute', icon: '🏔️', ringColor: 'border-stone-500 text-stone-900 bg-stone-100' },
];

const PERSPECTIVE_LENSES: { id: PerspectiveLens; title: string; subtitle: string; icon: string }[] = [
  { id: 'mindful', title: 'Mindful', subtitle: 'Present grounding & acceptance', icon: '🌿' },
  { id: 'stoic', title: 'Stoic', subtitle: 'Control vs external fortitude', icon: '🏛️' },
  { id: 'compassionate', title: 'Compassion', subtitle: 'Self-kindness & warm validation', icon: '🕊️' },
  { id: 'future_self', title: 'Future Self', subtitle: '5-year vantage & calm wisdom', icon: '🔮' },
  { id: 'socratic', title: 'Socratic', subtitle: 'Deep assumption inquiry', icon: '⚖️' },
];

interface JournalEditorProps {
  userId: string;
  activeInteraction: JournalInteraction | null;
  onInteractionSaved: (savedInteraction: JournalInteraction) => void;
  onNewEntryRequested: () => void;
  zenMode?: boolean;
  onToggleZenMode?: () => void;
}

export function JournalEditor({
  userId,
  activeInteraction,
  onInteractionSaved,
  onNewEntryRequested,
  zenMode = false,
  onToggleZenMode,
}: JournalEditorProps) {
  // Input states
  const [title, setTitle] = useState('');
  const [entryText, setEntryText] = useState('');
  const [mode, setMode] = useState<ReflectionMode>('reflection');
  const [lens, setLens] = useState<PerspectiveLens>('mindful');
  const [mood, setMood] = useState<EmotionalMood | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Cognitive Clarity & Modals
  const [clarityInsights, setClarityInsights] = useState<CognitiveClarityInsights | null>(null);
  const [isAnalyzingClarity, setIsAnalyzingClarity] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);

  // Conversation & AI states
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [latestAiResponse, setLatestAiResponse] = useState('');
  const [activeModelUsed, setActiveModelUsed] = useState('gemini-3.6-flash');

  // Follow-up input
  const [followUpText, setFollowUpText] = useState('');

  // UI status states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Inspiration prompts
  const [prompts, setPrompts] = useState<ReflectionPrompt[]>([]);
  const [selectedPromptCategory, setSelectedPromptCategory] = useState<string | null>(null);

  // Ref to chat scroll
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Load prompts on mount
  useEffect(() => {
    fetchReflectionPrompts().then((loaded) => {
      if (loaded.length > 0) setPrompts(loaded);
    });
  }, []);

  // Sync state when activeInteraction changes
  useEffect(() => {
    if (activeInteraction) {
      setTitle(activeInteraction.title || '');
      setEntryText(activeInteraction.entryText || '');
      setMode(activeInteraction.mode || 'reflection');
      setLens(activeInteraction.lens || 'mindful');
      setMood(activeInteraction.mood);
      setClarityInsights(activeInteraction.clarityInsights || null);
      setTags(activeInteraction.tags || []);
      setConversation(activeInteraction.conversation || []);
      setLatestAiResponse(activeInteraction.aiResponse || '');
      setSaveStatus('saved');
      setErrorMessage(null);
    } else {
      // Clean slate for new reflection
      setTitle('');
      setEntryText('');
      setMode('reflection');
      setLens('mindful');
      setMood(undefined);
      setClarityInsights(null);
      setTags([]);
      setConversation([]);
      setLatestAiResponse('');
      setSaveStatus('idle');
      setErrorMessage(null);
    }
  }, [activeInteraction?.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (conversation.length > 0) {
      conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation.length, isGenerating]);

  // Handle adding tags
  const handleAddTag = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleaned = tagInput.trim().replace(/^#/, '');
      if (cleaned && !tags.includes(cleaned) && tags.length < 5) {
        setTags([...tags, cleaned]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Helper to persist current document to Firestore
  const persistToFirestore = async (
    overrideData: Partial<JournalInteraction> = {}
  ): Promise<JournalInteraction> => {
    setIsSaving(true);
    setSaveStatus('idle');

    const generatedTitle =
      title.trim() ||
      entryText.trim().slice(0, 45) + (entryText.trim().length > 45 ? '...' : '') ||
      'Untitled Reflection';

    const payload: Omit<JournalInteraction, 'id' | 'userId'> = {
      title: generatedTitle,
      entryText: entryText.trim(),
      aiResponse: overrideData.aiResponse ?? latestAiResponse,
      mode: overrideData.mode ?? mode,
      lens: overrideData.lens ?? lens,
      mood: overrideData.mood ?? mood,
      clarityInsights: overrideData.clarityInsights ?? (clarityInsights || undefined),
      conversation: overrideData.conversation ?? conversation,
      tags: overrideData.tags ?? tags,
      createdAt: activeInteraction?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      let docId = activeInteraction?.id;
      if (docId) {
        await updateJournalInteraction(userId, docId, payload);
      } else {
        docId = await createJournalInteraction(userId, payload);
      }

      const saved: JournalInteraction = {
        ...payload,
        id: docId,
        userId,
      };

      setSaveStatus('saved');
      setErrorMessage(null);
      onInteractionSaved(saved);
      return saved;
    } catch (err: any) {
      console.error('Firestore save failed:', err);
      setSaveStatus('error');
      setErrorMessage('Failed to persist to Firestore. Click "Retry Save" to secure your reflection.');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Primary Action: Submit journal entry to Gemini
  const handleGenerateReflection = async (forcedMode?: ReflectionMode) => {
    const targetMode = forcedMode || mode;
    const trimmedInput = entryText.trim();

    if (!trimmedInput) {
      setErrorMessage('Please write your thoughts in the journal entry before requesting Gemini reflection.');
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);

    try {
      // 1. Call Gemini API via resilient server proxy with selected lens
      const result = await requestReflection(trimmedInput, targetMode, conversation, lens);
      setActiveModelUsed(result.modelUsed);

      const userMsg: ChatMessage = {
        id: 'msg_' + Date.now(),
        role: 'user',
        content: trimmedInput,
        timestamp: new Date().toISOString(),
      };

      const modelMsg: ChatMessage = {
        id: 'msg_' + (Date.now() + 1),
        role: 'model',
        content: result.text,
        timestamp: new Date().toISOString(),
        modelUsed: result.modelUsed,
      };

      const updatedConversation = [...conversation, userMsg, modelMsg];
      setConversation(updatedConversation);
      setLatestAiResponse(result.text);

      // 2. Guaranteed Transaction Verification: Persist user input AND Gemini response together
      await persistToFirestore({
        aiResponse: result.text,
        conversation: updatedConversation,
        mode: targetMode,
        lens,
        mood,
      });
    } catch (err: any) {
      console.error('Reflection request failed:', err);
      // Defensive guarantee: Never clear user entry text on failure
      setErrorMessage(err?.message || 'Gemini processing failed. Please check your network or try again.');
      setSaveStatus('error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Unique Action: Cognitive Clarity & Emotional Landscape Analysis
  const handleGenerateClarity = async () => {
    const trimmedInput = entryText.trim();
    if (!trimmedInput) {
      setErrorMessage('Please write your thoughts before analyzing cognitive clarity.');
      return;
    }

    setErrorMessage(null);
    setIsAnalyzingClarity(true);

    try {
      const result = await requestClarity(trimmedInput);
      setClarityInsights(result);
      await persistToFirestore({
        clarityInsights: result,
      });
    } catch (err: any) {
      console.error('Clarity analysis failed:', err);
      setErrorMessage(err?.message || 'Failed to analyze cognitive clarity.');
    } finally {
      setIsAnalyzingClarity(false);
    }
  };

  // Dedicated Action: Summarize
  const handleGenerateSummary = async () => {
    const trimmedInput = entryText.trim();
    if (!trimmedInput) {
      setErrorMessage('Please write or paste content into the journal entry to summarize.');
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);

    try {
      const result = await requestSummary(trimmedInput);
      setActiveModelUsed(result.modelUsed);

      const modelMsg: ChatMessage = {
        id: 'summary_' + Date.now(),
        role: 'model',
        content: `**Executive Summary & Key Takeaways:**\n\n${result.summary}`,
        timestamp: new Date().toISOString(),
        modelUsed: result.modelUsed,
      };

      const updatedConversation = [...conversation, modelMsg];
      setConversation(updatedConversation);
      setLatestAiResponse(result.summary);
      setMode('summary');

      await persistToFirestore({
        aiResponse: result.summary,
        conversation: updatedConversation,
        mode: 'summary',
        lens,
        mood,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Summarization failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Multi-Turn Follow-Up Chat Submission
  const handleSendFollowUp = async () => {
    const prompt = followUpText.trim();
    if (!prompt || isGenerating) return;

    setFollowUpText('');
    setErrorMessage(null);
    setIsGenerating(true);

    const userFollowUp: ChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString(),
    };

    const conversationWithUser = [...conversation, userFollowUp];
    setConversation(conversationWithUser);

    try {
      const result = await requestReflection(prompt, 'chat', conversationWithUser);
      setActiveModelUsed(result.modelUsed);

      const modelReply: ChatMessage = {
        id: 'ai_' + (Date.now() + 1),
        role: 'model',
        content: result.text,
        timestamp: new Date().toISOString(),
        modelUsed: result.modelUsed,
      };

      const fullConversation = [...conversationWithUser, modelReply];
      setConversation(fullConversation);
      setLatestAiResponse(result.text);

      await persistToFirestore({
        conversation: fullConversation,
        aiResponse: result.text,
      });
    } catch (err: any) {
      console.error('Follow-up error:', err);
      setErrorMessage(err?.message || 'Failed to receive follow-up answer.');
      // Restore the follow-up text to input if failed
      setFollowUpText(prompt);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy helper
  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const wordCount = entryText.trim() ? entryText.trim().split(/\s+/).length : 0;
  const charCount = entryText.length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fcfbf9] overflow-y-auto">
      {/* Top action status bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white/90 px-6 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-stone-500">
            {activeInteraction?.id ? 'Editing Saved Entry' : 'New Journal Entry'}
          </span>

          {/* Mode Selector Pill */}
          <div className="hidden sm:flex items-center rounded-lg border border-stone-200 bg-stone-50 p-0.5 text-xs">
            <button
              onClick={() => setMode('reflection')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition cursor-pointer ${
                mode === 'reflection'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Compass className="h-3 w-3" />
              <span>Reflect</span>
            </button>
            <button
              onClick={() => setMode('summary')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition cursor-pointer ${
                mode === 'summary'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileText className="h-3 w-3" />
              <span>Summary</span>
            </button>
            <button
              onClick={() => setMode('brainstorm')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition cursor-pointer ${
                mode === 'brainstorm'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Lightbulb className="h-3 w-3" />
              <span>Brainstorm</span>
            </button>
            <button
              onClick={() => setMode('chat')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition cursor-pointer ${
                mode === 'chat'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <MessageSquare className="h-3 w-3" />
              <span>Dialogue</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* Save Status indicator */}
          <div className="flex items-center gap-1.5">
            {isSaving ? (
              <span className="flex items-center gap-1 text-stone-500">
                <div className="h-2 w-2 animate-ping rounded-full bg-stone-400" />
                Saving to Firestore...
              </span>
            ) : saveStatus === 'saved' ? (
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Vault Saved
              </span>
            ) : saveStatus === 'error' ? (
              <button
                onClick={() => persistToFirestore()}
                className="flex items-center gap-1 text-red-600 hover:underline cursor-pointer"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Retry Save
              </button>
            ) : null}
          </div>

          {/* Thought Card Share Button */}
          {(entryText.trim() || latestAiResponse) && (
            <button
              id="editor-open-card-modal-btn"
              onClick={() => setShowCardModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition cursor-pointer"
              title="Generate shareable insight card"
            >
              <Share2 className="h-3.5 w-3.5 text-stone-600" />
              <span className="hidden sm:inline">Thought Card</span>
            </button>
          )}

          {/* Zen Mode Toggle Button */}
          {onToggleZenMode && (
            <button
              id="editor-zen-mode-btn"
              onClick={onToggleZenMode}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                zenMode
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
              }`}
              title={zenMode ? 'Exit Zen Mode' : 'Enter Zen Focus Mode'}
            >
              {zenMode ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Exit Zen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Zen Mode</span>
                </>
              )}
            </button>
          )}

          <button
            id="editor-manual-save-btn"
            onClick={() => persistToFirestore()}
            disabled={isSaving || !entryText.trim()}
            className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition disabled:opacity-40 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 text-stone-500" />
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      {/* Main Form container */}
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8 space-y-6">
        {/* Error / Notice banner */}
        {errorMessage && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-950">
                    {errorMessage.includes('prepayment credits') || errorMessage.includes('RESOURCE_EXHAUSTED')
                      ? 'Gemini API Billing Credits Depleted'
                      : 'Notice'}
                  </p>
                  <p className="leading-relaxed text-stone-700">
                    {errorMessage}
                  </p>
                  {(errorMessage.includes('prepayment credits') || errorMessage.includes('RESOURCE_EXHAUSTED')) && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-3 pt-1">
                      <a
                        href="https://ai.studio/projects"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-stone-800"
                      >
                        <span>Manage AI Studio Project Billing</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <button
                        onClick={() => persistToFirestore()}
                        disabled={isSaving || !entryText.trim()}
                        className="inline-flex items-center gap-1 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-50"
                      >
                        <Save className="h-3 w-3 text-stone-500" />
                        <span>Save Current Journal Draft to Vault</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {saveStatus === 'error' && !errorMessage.includes('prepayment credits') && (
                <button
                  onClick={() => persistToFirestore()}
                  className="shrink-0 rounded-md bg-stone-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-stone-800 transition cursor-pointer"
                >
                  Retry Save
                </button>
              )}
            </div>
          </div>
        )}

        {/* Prompt Inspiration Drawer */}
        {prompts.length > 0 && !entryText.trim() && (
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Lightbulb className="h-3.5 w-3.5 text-amber-700" />
                Inspiration Prompts
              </span>
              <span className="text-[11px] text-amber-700">Click to load into journal</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {prompts.slice(0, 4).map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTitle(p.category + ' Reflection');
                    setEntryText(p.prompt + '\n\n');
                  }}
                  className="text-left rounded-lg border border-amber-200/60 bg-white p-2.5 text-xs text-stone-700 hover:border-amber-300 hover:bg-amber-50/80 transition cursor-pointer"
                >
                  <span className="font-semibold text-amber-800 block text-[11px] mb-0.5">
                    {p.category}
                  </span>
                  <span className="text-stone-600 line-clamp-2">{p.prompt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Title Input */}
        <div className="space-y-1">
          <input
            id="editor-title-input"
            type="text"
            placeholder="Reflection Title (e.g. Unpacking Today's Meeting, Creative Ideas)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={180}
            className="w-full font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 placeholder-stone-300 bg-transparent border-0 border-b border-transparent hover:border-stone-200 focus:border-stone-400 focus:outline-none py-1"
          />
        </div>

        {/* Emotional Resonance / Mood Selector */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className="text-xs font-medium text-stone-500 mr-1 flex items-center gap-1">
            <Feather className="h-3 w-3 text-stone-400" />
            Resonance:
          </span>
          {EMOTIONAL_MOODS.map((m) => {
            const isSelected = mood === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMood(isSelected ? undefined : m.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition cursor-pointer border ${
                  isSelected
                    ? `${m.ringColor} shadow-xs font-semibold ring-1 ring-inset ring-current`
                    : 'border-stone-200/80 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Perspective Lens Selector */}
        <div className="rounded-xl border border-stone-200/90 bg-stone-50/60 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-stone-500" />
              Perspective Lens
            </span>
            <span className="text-[11px] text-stone-500 font-medium">
              {PERSPECTIVE_LENSES.find((l) => l.id === lens)?.subtitle}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {PERSPECTIVE_LENSES.map((l) => {
              const isActive = lens === l.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLens(l.id)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer border ${
                    isActive
                      ? 'border-stone-900 bg-white text-stone-900 shadow-xs font-semibold'
                      : 'border-transparent text-stone-600 hover:bg-white/70 hover:text-stone-900'
                  }`}
                >
                  <span>{l.icon}</span>
                  <span>{l.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Journal Textarea */}
        <div className="relative rounded-2xl border border-stone-200 bg-white shadow-xs focus-within:border-stone-400 focus-within:ring-1 focus-within:ring-stone-400 transition">
          <textarea
            id="editor-entry-textarea"
            rows={10}
            placeholder="Write your journal entry, thought, dilemma, or reflection freely... What is on your mind today?"
            value={entryText}
            onChange={(e) => setEntryText(e.target.value)}
            className="w-full resize-y rounded-2xl bg-transparent p-5 text-sm sm:text-base leading-relaxed text-stone-800 placeholder-stone-400 focus:outline-none font-sans"
          />

          {/* Footer of textarea */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 bg-stone-50/60 px-5 py-3 rounded-b-2xl text-xs text-stone-500">
            <div className="flex items-center gap-4">
              <span>{wordCount} words</span>
              <span>{charCount} characters</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                id="editor-clarity-btn"
                type="button"
                onClick={handleGenerateClarity}
                disabled={isAnalyzingClarity || isGenerating || !entryText.trim()}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-medium text-indigo-900 hover:bg-indigo-100/80 transition disabled:opacity-40 cursor-pointer"
                title="Synthesize cognitive patterns, cognitive reframes, and micro-intentions"
              >
                <Brain className="h-3.5 w-3.5 text-indigo-600" />
                <span>{isAnalyzingClarity ? 'Analyzing Clarity...' : 'Cognitive Clarity'}</span>
              </button>

              <button
                id="editor-summarize-btn"
                type="button"
                onClick={handleGenerateSummary}
                disabled={isGenerating || isAnalyzingClarity || !entryText.trim()}
                className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 transition disabled:opacity-40 cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5 text-stone-600" />
                <span>Summarize</span>
              </button>

              <button
                id="editor-reflect-gemini-btn"
                type="button"
                onClick={() => handleGenerateReflection()}
                disabled={isGenerating || isAnalyzingClarity || !entryText.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-stone-800 transition disabled:opacity-40 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>{isGenerating ? 'Reflecting with Gemini...' : 'Reflect with Gemini'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cognitive Clarity Card (when generated or loaded from history) */}
        {clarityInsights && (
          <CognitiveClarityCard
            insights={clarityInsights}
            onApplyIntention={(intention) => {
              setEntryText((prev) => prev.trim() + `\n\n**Action Intention:** ${intention}`);
            }}
          />
        )}

        {/* Tags management */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <Tag className="h-3.5 w-3.5 text-stone-400" />
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 font-medium text-stone-700 text-xs"
            >
              #{tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ×
              </button>
            </span>
          ))}
          {tags.length < 5 && (
            <input
              type="text"
              placeholder="+ Add tag (press Enter)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="rounded-md border border-dashed border-stone-300 bg-transparent px-2 py-0.5 text-xs text-stone-700 placeholder-stone-400 focus:border-stone-500 focus:outline-none"
            />
          )}
        </div>

        {/* Multi-Turn Conversation / Gemini Interaction Thread */}
        {conversation.length > 0 && (
          <div className="mt-8 space-y-5 pt-6 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-bold text-stone-900">
                  Gemini Reflection Dialogue ({conversation.length} turns)
                </h3>
              </div>
              <span className="font-mono text-[11px] text-stone-500">
                Model: {activeModelUsed}
              </span>
            </div>

            {/* Conversation list */}
            <div className="space-y-4">
              {conversation.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id || index}
                    className={`flex flex-col rounded-xl p-4 transition ${
                      isUser
                        ? 'border border-stone-200 bg-white ml-6 text-stone-800'
                        : 'border border-amber-200/70 bg-amber-50/40 mr-6 text-stone-900 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 text-[11px] text-stone-400">
                      <div className="flex items-center gap-1.5 font-semibold">
                        {isUser ? (
                          <span className="text-stone-600">Your Reflection / Question</span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-800 font-bold">
                            <Sparkles className="h-3 w-3 text-amber-600" />
                            Gemini Reflection ({msg.modelUsed || activeModelUsed})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span>
                          {msg.timestamp
                            ? new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                        {!isUser && (
                          <button
                            onClick={() => handleCopyText(msg.content, index)}
                            className="text-stone-400 hover:text-stone-700 cursor-pointer"
                            title="Copy response"
                          >
                            {copiedIndex === index ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                      {msg.content}
                    </div>
                  </div>
                );
              })}

              {isGenerating && (
                <div className="flex items-center gap-3 rounded-xl border border-amber-200/70 bg-amber-50/40 p-4 mr-6 text-xs text-amber-800 animate-pulse">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                  <span>Gemini is synthesizing a thoughtful response...</span>
                </div>
              )}

              <div ref={conversationEndRef} />
            </div>

            {/* Follow-up Question Input Box */}
            <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-xs">
              <label htmlFor="editor-followup-input" className="block text-xs font-semibold text-stone-700 mb-1.5">
                Continue the dialogue with Gemini
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="editor-followup-input"
                  type="text"
                  placeholder="Ask a follow-up, explore an angle, or request action steps..."
                  value={followUpText}
                  onChange={(e) => setFollowUpText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendFollowUp();
                    }
                  }}
                  disabled={isGenerating}
                  className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:bg-white focus:outline-none"
                />

                <button
                  id="editor-followup-send-btn"
                  onClick={handleSendFollowUp}
                  disabled={!followUpText.trim() || isGenerating}
                  className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-stone-800 disabled:opacity-40 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Reply</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Shareable Thought Card Modal */}
      <ReflectionCardModal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        title={title || 'Journal Reflection'}
        entryText={entryText}
        reflectionText={latestAiResponse}
        tags={tags}
        lens={lens}
        mood={mood}
      />
    </div>
  );
}
