import { Brain, Sparkles, Compass, Target, ArrowRight } from 'lucide-react';
import { CognitiveClarityInsights } from '../types';

interface CognitiveClarityCardProps {
  insights: CognitiveClarityInsights;
  onApplyIntention?: (intention: string) => void;
}

export function CognitiveClarityCard({ insights, onApplyIntention }: CognitiveClarityCardProps) {
  return (
    <div className="rounded-2xl border border-stone-200/90 bg-[#fbfaf8] p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-900 text-white">
            <Brain className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
              Cognitive Clarity & Reframe
            </h4>
            <p className="text-[11px] text-stone-500">
              Extracted emotional landscape and alternative perspective
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-200/60">
          <Sparkles className="h-3 w-3 text-amber-600" />
          Mindful Analysis
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Emotional Climate */}
        <div className="rounded-xl border border-stone-200/70 bg-white p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide block">
            Emotional Climate
          </span>
          <p className="text-xs text-stone-800 font-medium leading-relaxed">
            {insights.sentiment}
          </p>
        </div>

        {/* Core Dilemma Anchor */}
        <div className="rounded-xl border border-stone-200/70 bg-white p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide block">
            Core Dilemma Anchor
          </span>
          <p className="text-xs text-stone-800 font-medium leading-relaxed">
            {insights.keyTheme}
          </p>
        </div>
      </div>

      {/* Cognitive Reframe */}
      <div className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-4 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
          <Compass className="h-3.5 w-3.5 text-amber-700" />
          <span>Compassionate Reframe</span>
        </div>
        <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-sans">
          {insights.cognitiveReframe}
        </p>
      </div>

      {/* Micro-Intention */}
      <div className="rounded-xl border border-stone-200/80 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-900">
            <Target className="h-3.5 w-3.5 text-emerald-600" />
            <span>Gentle Micro-Intention for Today</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            {insights.microIntention}
          </p>
        </div>
        {onApplyIntention && (
          <button
            onClick={() => onApplyIntention(insights.microIntention)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            <span>Add to Notes</span>
            <ArrowRight className="h-3 w-3 text-stone-500" />
          </button>
        )}
      </div>
    </div>
  );
}
