import { useState, useMemo } from 'react';
import { FileText, Download, Trash2, Search, Layers } from 'lucide-react';
import type { NoteItem } from '../types';
import { MediumBadge, EmptyState, SectionHeader, AddButton } from './ui';

interface NotesSectionProps {
  notes: NoteItem[];
  teacherMode: boolean;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export default function NotesSection({ notes, teacherMode, onAdd, onDelete }: NotesSectionProps) {
  const [activeUnit, setActiveUnit] = useState<number | 'All'>('All');
  const [search, setSearch] = useState('');

  const unitNumbers = useMemo(() => {
    const set = new Set<number>();
    notes.forEach((n) => set.add(n.unitNumber));
    return Array.from(set).sort((a, b) => a - b);
  }, [notes]);

  const filtered = notes.filter((n) => {
    const matchUnit = activeUnit === 'All' || n.unitNumber === activeUnit;
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.description.toLowerCase().includes(search.toLowerCase());
    return matchUnit && matchSearch;
  });

  const grouped = useMemo(() => {
    const map = new Map<number, NoteItem[]>();
    filtered.forEach((n) => {
      const arr = map.get(n.unitNumber) ?? [];
      arr.push(n);
      map.set(n.unitNumber, arr);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filtered]);

  return (
    <div className="animate-fade-in-up">
      <SectionHeader
        title="Lesson Notes"
        subtitle="Download study materials organized by unit"
        action={teacherMode && <AddButton onClick={onAdd} label="Add Notes" />}
      />

      <div className="mb-5 space-y-3">
        <div className="relative group">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors duration-200" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes by title or keyword..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all duration-200 ease-in-out shadow-sm hover:shadow-md"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
          <button
            onClick={() => setActiveUnit('All')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ease-in-out ${
              activeUnit === 'All'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25 scale-[1.03]'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600 hover:scale-[1.03]'
            }`}
          >
            All Units
          </button>
          {unitNumbers.map((unit) => (
            <button
              key={unit}
              onClick={() => setActiveUnit(unit)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ease-in-out ${
                activeUnit === unit
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25 scale-[1.03]'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600 hover:scale-[1.03]'
              }`}
            >
              Unit {unit}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText size={28} />}
          title="No notes found"
          description={teacherMode ? "Click 'Add Notes' to upload study materials." : 'No notes match your search. Try a different filter.'}
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([unit, items]) => (
            <div key={unit} className="animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20">
                  <Layers size={16} className="text-white" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Unit {unit}</h4>
                <span className="text-xs text-slate-400">({items.length})</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((note, index) => (
                  <div
                    key={note.id}
                    className="group rounded-2xl border border-slate-200 bg-white p-4 card-shadow hover:card-shadow-hover hover:border-brand-200 transition-all duration-300 ease-in-out hover:scale-[1.02] animate-stagger-in stagger-${Math.min(index + 1, 6)}"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:bg-red-100">
                          <FileText size={18} className="text-red-500" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-sm font-semibold text-slate-900 leading-snug truncate">{note.title}</h5>
                          <div className="flex items-center gap-1.5 mt-1">
                            <MediumBadge medium={note.medium} />
                          </div>
                        </div>
                      </div>
                      {teacherMode && (
                        <button
                          onClick={() => onDelete(note.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
                          aria-label="Delete note"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{note.description}</p>
                    <a
                      href={note.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-brand-50 hover:text-brand-600 transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-95"
                    >
                      <Download size={14} />
                      Download PDF
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
