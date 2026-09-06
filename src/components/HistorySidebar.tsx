import { useState, useMemo, type MouseEvent } from 'react';
import { Search, Sparkles, BookOpen, Trash2, ChevronRight, MessageSquare, Calendar, Filter } from 'lucide-react';
import { JournalInteraction, ReflectionMode } from '../types';

interface HistorySidebarProps {
  interactions: JournalInteraction[];
  selectedId: string | null;
  onSelectInteraction: (interaction: JournalInteraction) => void;
  onDeleteInteraction: (id: string) => Promise<void>;
  onNewEntry: () => void;
  isLoading: boolean;
}

export function HistorySidebar({
  interactions,
  selectedId,
  onSelectInteraction,
  onDeleteInteraction,
  onNewEntry,
  isLoading,
}: HistorySidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredInteractions = useMemo(() => {
    return interactions.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.entryText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.aiResponse?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMode = selectedFilter === 'all' || item.mode === selectedFilter;

      return matchesSearch && matchesMode;
    });
  }, [interactions, searchTerm, selectedFilter]);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (e: MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setDeletingId(id);
    try {
      await onDeleteInteraction(id);
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  };

  const cancelDelete = (e: MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
  };

  const getModeBadge = (mode: ReflectionMode) => {
    switch (mode) {
      case 'summary':
        return { label: 'Summary', color: 'bg-blue-50 text-blue-700 ring-blue-700/10' };
      case 'brainstorm':
        return { label: 'Brainstorm', color: 'bg-purple-50 text-purple-700 ring-purple-700/10' };
      case 'chat':
        return { label: 'Chat', color: 'bg-amber-50 text-amber-700 ring-amber-700/10' };
      case 'reflection':
      default:
        return { label: 'Reflection', color: 'bg-emerald-50 text-emerald-700 ring-emerald-700/10' };
    }
  };

  return (
    <aside className="flex flex-col h-full border-r border-stone-200 bg-white">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-stone-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-stone-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Journal Vault ({interactions.length})
            </h2>
          </div>
          <button
            id="sidebar-new-entry-btn"
            onClick={onNewEntry}
            className="flex items-center gap-1 rounded-md bg-stone-100 hover:bg-stone-200 px-2 py-1 text-[11px] font-medium text-stone-700 transition cursor-pointer"
          >
            <Sparkles className="h-3 w-3" />
            <span>New</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative mb-2.5">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <input
            id="history-search-input"
            type="text"
            placeholder="Search entries & reflections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-stone-50/50 py-1.5 pl-8 pr-3 text-xs text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
          <Filter className="h-3 w-3 text-stone-400 shrink-0 ml-0.5" />
          {['all', 'reflection', 'summary', 'brainstorm', 'chat'].map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFilter(f)}
              className={`rounded-full px-2.5 py-0.5 font-medium transition shrink-0 capitalize cursor-pointer ${
                selectedFilter === f
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Interactions List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-stone-400">
            <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-800 mb-2" />
            Loading your reflections...
          </div>
        ) : filteredInteractions.length === 0 ? (
          <div className="py-12 px-4 text-center text-xs text-stone-500">
            {searchTerm || selectedFilter !== 'all' ? (
              <p>No reflections match your search criteria.</p>
            ) : (
              <div>
                <p className="font-medium text-stone-700">No reflections saved yet.</p>
                <p className="mt-1 text-stone-400">
                  Write your first journal entry on the right to reflect with Gemini!
                </p>
              </div>
            )}
          </div>
        ) : (
          filteredInteractions.map((item) => {
            const isSelected = selectedId === item.id;
            const badge = getModeBadge(item.mode);
            const dateStr = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recent';

            const turnCount = item.conversation?.length || 0;
            const moodEmojiMap: Record<string, string> = {
              reflective: '🌿',
              grateful: '☀️',
              anxious: '🌪️',
              inspired: '💡',
              heavy: '🌙',
              resolute: '🏔️',
            };
            const moodIcon = item.mood ? moodEmojiMap[item.mood] : null;

            return (
              <div
                key={item.id}
                id={`interaction-item-${item.id}`}
                onClick={() => onSelectInteraction(item)}
                className={`group relative flex flex-col rounded-xl p-3 text-left transition border cursor-pointer ${
                  isSelected
                    ? 'border-stone-900 bg-stone-50/80 shadow-xs ring-1 ring-stone-900'
                    : 'border-stone-200/80 bg-white hover:border-stone-300 hover:bg-stone-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {moodIcon && <span className="text-xs shrink-0">{moodIcon}</span>}
                    <span className="text-xs font-semibold text-stone-900 truncate">
                      {item.title || 'Untitled Reflection'}
                    </span>
                  </div>
                  {confirmDeleteId === item.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDelete(e, item.id!)}
                        disabled={deletingId === item.id}
                        className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-red-700 transition"
                      >
                        {deletingId === item.id ? '...' : 'Confirm'}
                      </button>
                      <button
                        onClick={cancelDelete}
                        className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600 hover:bg-stone-200 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => handleDelete(e, item.id!)}
                      disabled={deletingId === item.id}
                      title="Delete entry"
                      className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-600 rounded transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <p className="mt-1 text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                  {item.entryText}
                </p>

                <div className="mt-2.5 flex items-center justify-between text-[10px] text-stone-400">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                    {turnCount > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-stone-500">
                        <MessageSquare className="h-2.5 w-2.5" />
                        {turnCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" />
                    <span>{dateStr}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
