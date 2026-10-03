import { useState, useMemo } from 'react';
import { ClipboardList, Download, FileCheck, Trash2, FileStack } from 'lucide-react';
import type { ExamPaper, PaperType } from '../types';
import { formatDate } from '../utils';
import { MediumBadge, EmptyState, SectionHeader, AddButton } from './ui';

interface PapersSectionProps {
  papers: ExamPaper[];
  teacherMode: boolean;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

const allPaperTypes: PaperType[] = ['Model Papers', 'Past Papers', 'Tutorials', 'Revision Papers'];

export default function PapersSection({ papers, teacherMode, onAdd, onDelete }: PapersSectionProps) {
  const [activeType, setActiveType] = useState<PaperType | 'All'>('All');

  const availableTypes = useMemo(() => {
    const set = new Set<PaperType>();
    papers.forEach((p) => set.add(p.paperType));
    return allPaperTypes.filter((t) => set.has(t));
  }, [papers]);

  const filtered = useMemo(() => {
    const list = activeType === 'All' ? papers : papers.filter((p) => p.paperType === activeType);
    return [...list].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }, [papers, activeType]);

  const grouped = useMemo(() => {
    const map = new Map<PaperType, ExamPaper[]>();
    const types = activeType === 'All' ? availableTypes : [activeType as PaperType];
    types.forEach((t) => map.set(t, []));
    filtered.forEach((p) => {
      const arr = map.get(p.paperType) ?? [];
      arr.push(p);
      map.set(p.paperType, arr);
    });
    return Array.from(map.entries()).filter(([, items]) => items.length > 0);
  }, [filtered, activeType, availableTypes]);

  return (
    <div className="animate-fade-in-up">
      <SectionHeader
        title="Papers"
        subtitle="Download exam papers and marking schemes by section"
        action={teacherMode && <AddButton onClick={onAdd} label="Add Paper" />}
      />

      <div className="mb-5">
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
          <button
            onClick={() => setActiveType('All')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ease-in-out ${
              activeType === 'All'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25 scale-[1.03]'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600 hover:scale-[1.03]'
            }`}
          >
            All Papers
          </button>
          {allPaperTypes.map((type) => {
            const count = papers.filter((p) => p.paperType === type).length;
            return (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ease-in-out ${
                  activeType === type
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25 scale-[1.03]'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600 hover:scale-[1.03]'
                }`}
              >
                {type}
                {count > 0 && (
                  <span className={`ml-1.5 text-[10px] ${activeType === type ? 'text-brand-100' : 'text-slate-400'}`}>
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={28} />}
          title="No papers yet"
          description={teacherMode ? "Click 'Add Paper' to upload exam papers." : 'No papers available yet. Check back soon!'}
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([type, items]) => (
            <div key={type} className="animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20">
                  <FileStack size={16} className="text-white" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">{type}</h4>
                <span className="text-xs text-slate-400">({items.length})</span>
              </div>
              <div className="space-y-3">
                {items.map((paper, index) => (
                  <div
                    key={paper.id}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 card-shadow hover:card-shadow-hover hover:border-brand-200 transition-all duration-300 ease-in-out hover:scale-[1.01] animate-stagger-in stagger-${Math.min(index + 1, 6)}"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-500/25 transition-all duration-200 group-hover:scale-105">
                          <ClipboardList size={22} className="text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 text-brand-600 text-[11px] font-bold">
                              <FileStack size={11} />
                              {paper.paperType}
                            </span>
                            <MediumBadge medium={paper.medium} />
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">{paper.title}</h4>
                          <p className="text-xs text-slate-400 mt-1">Published on {formatDate(paper.publishedAt)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={paper.paperUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 active:scale-95 transition-all duration-200 ease-in-out shadow-md shadow-brand-500/20 hover:shadow-brand-500/30 hover:scale-[1.03]"
                        >
                          <Download size={15} />
                          Question Paper
                        </a>
                        <a
                          href={paper.markingSchemeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 active:scale-95 transition-all duration-200 ease-in-out hover:scale-[1.03]"
                        >
                          <FileCheck size={15} />
                          Marking Scheme
                        </a>
                        {teacherMode && (
                          <button
                            onClick={() => onDelete(paper.id)}
                            className="p-2.5 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200 ease-in-out hover:scale-110 active:scale-95"
                            aria-label="Delete paper"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
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
