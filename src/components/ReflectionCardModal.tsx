import { useState } from 'react';
import { X, Copy, Check, Quote, Calendar, Tag, Compass } from 'lucide-react';
import { JournalInteraction, PerspectiveLens, EmotionalMood } from '../types';

interface ReflectionCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  entryText: string;
  reflectionText?: string;
  lens?: PerspectiveLens;
  mood?: EmotionalMood;
  tags?: string[];
  createdAt?: string;
}

export function ReflectionCardModal({
  isOpen,
  onClose,
  title,
  entryText,
  reflectionText,
  lens,
  mood,
  tags,
  createdAt,
}: ReflectionCardModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const handleCopyMarkdown = async () => {
    const md = `### ${title || 'Journal Reflection'}\n*${formattedDate}*\n\n**Journal Entry:**\n${entryText}\n\n${
      reflectionText ? `**Gemini Reflection (${lens || 'Mindful'}):**\n${reflectionText}` : ''
    }`;
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-[#faf8f5] p-6 sm:p-8 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Quote className="h-5 w-5 text-amber-700" />
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Reflection Excerpt Card
          </span>
        </div>

        {/* Card Canvas */}
        <div
          id="reflection-printable-card"
          className="rounded-xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between border-b border-stone-100 pb-3 text-xs text-stone-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-stone-400" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              {mood && (
                <span className="capitalize font-mono text-[11px] text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full">
                  {mood}
                </span>
              )}
              {lens && (
                <span className="capitalize font-mono text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                  {lens} Lens
                </span>
              )}
            </div>
          </div>

          <h3 className="font-serif text-xl font-bold tracking-tight text-stone-900 leading-snug">
            {title || 'Untitled Reflection'}
          </h3>

          <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic border-l-2 border-amber-300 pl-3.5 py-0.5">
            "{entryText.slice(0, 240)}{entryText.length > 240 ? '...' : ''}"
          </p>

          {reflectionText && (
            <div className="rounded-lg bg-stone-50/80 p-3.5 text-xs text-stone-800 leading-relaxed border border-stone-100">
              <p className="font-semibold text-stone-900 mb-1 flex items-center gap-1.5 text-[11px]">
                <Compass className="h-3 w-3 text-stone-600" />
                Key Reframing Takeaway
              </p>
              <p className="text-stone-600 line-clamp-4">
                {reflectionText.slice(0, 280)}{reflectionText.length > 280 ? '...' : ''}
              </p>
            </div>
          )}

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((t) => (
                <span key={t} className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md font-medium">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-5 flex items-center justify-between gap-3 pt-2">
          <span className="text-[11px] text-stone-500">Private & encrypted in your Firestore vault</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 transition cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied Markdown!' : 'Copy Formatted'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
