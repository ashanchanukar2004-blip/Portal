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
    <div>
      <SectionHeader
        title="Lesson Notes"
        subtitle="Download study materials organized by unit"
        action={teacherMode && <AddButton onClick={onAdd} label="Add Notes" />}
      />

      <div className="mb-5 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes by title or keyword..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
          <button
            onClick={() => setActiveUnit('All')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeUnit === 'All'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'
            }`}
          >
            All Units
          </button>
          {unitNumbers.map((unit) => (
            <button
              key={unit}
              onClick={() => setActiveUnit(unit)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeUnit === unit
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'
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
            <div key={unit}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                  <Layers size={16} className="text-white" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Unit {unit}</h4>
                <span className="text-xs text-slate-400">({items.length})</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((note) => (
                  <div
                    key={note.id}
                    className="group rounded-xl border border-slate-200 bg-white p-4 hover:shadow-lg hover:border-brand-200 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
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
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
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
                      className="inline-flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-brand-50 hover:text-brand-600 transition-colors"
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
