import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import type { ScheduleSlot, NoteItem, ExamPaper } from '../types';

interface DbSchedule {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  join_link: string;
  medium: string;
}

interface DbNote {
  id: string;
  title: string;
  unit_number: number;
  description: string;
  file_name: string;
  file_url: string;
  medium: string;
  uploaded_at: string;
}

interface DbPaper {
  id: string;
  paper_type: string;
  title: string;
  paper_url: string;
  marking_scheme_url: string;
  medium: string;
  published_at: string;
}

const toScheduleSlot = (r: DbSchedule): ScheduleSlot => ({
  id: r.id,
  title: r.title,
  date: r.date,
  startTime: r.start_time,
  endTime: r.end_time,
  joinLink: r.join_link,
  medium: r.medium as ScheduleSlot['medium'],
});

const toNoteItem = (r: DbNote): NoteItem => ({
  id: r.id,
  title: r.title,
  unitNumber: r.unit_number,
  description: r.description,
  fileName: r.file_name,
  fileUrl: r.file_url,
  medium: r.medium as NoteItem['medium'],
  uploadedAt: r.uploaded_at,
});

const toExamPaper = (r: DbPaper): ExamPaper => ({
  id: r.id,
  paperType: r.paper_type as ExamPaper['paperType'],
  title: r.title,
  paperUrl: r.paper_url,
  markingSchemeUrl: r.marking_scheme_url,
  medium: r.medium as ExamPaper['medium'],
  publishedAt: r.published_at,
});

interface PortalData {
  schedule: ScheduleSlot[];
  notes: NoteItem[];
  papers: ExamPaper[];
  loading: boolean;
  addSchedule: (slot: Omit<ScheduleSlot, 'id'>) => Promise<{ error: string | null }>;
  deleteSchedule: (id: string) => Promise<void>;
  addNote: (note: Omit<NoteItem, 'id'>) => Promise<{ error: string | null }>;
  deleteNote: (id: string) => Promise<void>;
  addPaper: (paper: Omit<ExamPaper, 'id'>) => Promise<{ error: string | null }>;
  deletePaper: (id: string) => Promise<void>;
}

export function usePortalData(): PortalData {
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadAll = async () => {
      const [schedRes, notesRes, papersRes] = await Promise.all([
        supabase.from('schedules').select('*').order('date', { ascending: true }),
        supabase.from('notes').select('*').order('uploaded_at', { ascending: false }),
        supabase.from('papers').select('*').order('published_at', { ascending: false }),
      ]);

      if (!mounted) return;

      if (schedRes.data) setSchedule(schedRes.data.map(toScheduleSlot));
      if (notesRes.data) setNotes(notesRes.data.map(toNoteItem));
      if (papersRes.data) setPapers(papersRes.data.map(toExamPaper));
      setLoading(false);
    };

    loadAll();

    const channel = supabase
      .channel('portal-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSchedule((prev) => {
              const slot = toScheduleSlot(payload.new as DbSchedule);
              return prev.some((s) => s.id === slot.id) ? prev : [...prev, slot];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id: string }).id;
            setSchedule((prev) => prev.filter((s) => s.id !== oldId));
          } else if (payload.eventType === 'UPDATE') {
            const slot = toScheduleSlot(payload.new as DbSchedule);
            setSchedule((prev) => prev.map((s) => (s.id === slot.id ? slot : s)));
          }
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotes((prev) => {
              const note = toNoteItem(payload.new as DbNote);
              return prev.some((n) => n.id === note.id) ? prev : [...prev, note];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id: string }).id;
            setNotes((prev) => prev.filter((n) => n.id !== oldId));
          } else if (payload.eventType === 'UPDATE') {
            const note = toNoteItem(payload.new as DbNote);
            setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)));
          }
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'papers' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPapers((prev) => {
              const paper = toExamPaper(payload.new as DbPaper);
              return prev.some((p) => p.id === paper.id) ? prev : [...prev, paper];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id: string }).id;
            setPapers((prev) => prev.filter((p) => p.id !== oldId));
          } else if (payload.eventType === 'UPDATE') {
            const paper = toExamPaper(payload.new as DbPaper);
            setPapers((prev) => prev.map((p) => (p.id === paper.id ? paper : p)));
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const addSchedule = useCallback(async (slot: Omit<ScheduleSlot, 'id'>) => {
    const { error } = await supabase.from('schedules').insert({
      title: slot.title,
      date: slot.date,
      start_time: slot.startTime,
      end_time: slot.endTime,
      join_link: slot.joinLink,
      medium: slot.medium,
    });
    return { error: error?.message ?? null };
  }, []);

  const deleteSchedule = useCallback(async (id: string) => {
    await supabase.from('schedules').delete().eq('id', id);
  }, []);

  const addNote = useCallback(async (note: Omit<NoteItem, 'id'>) => {
    const { error } = await supabase.from('notes').insert({
      title: note.title,
      unit_number: note.unitNumber,
      description: note.description,
      file_name: note.fileName,
      file_url: note.fileUrl,
      medium: note.medium,
      uploaded_at: note.uploadedAt,
    });
    return { error: error?.message ?? null };
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    await supabase.from('notes').delete().eq('id', id);
  }, []);

  const addPaper = useCallback(async (paper: Omit<ExamPaper, 'id'>) => {
    const { error } = await supabase.from('papers').insert({
      paper_type: paper.paperType,
      title: paper.title,
      paper_url: paper.paperUrl,
      marking_scheme_url: paper.markingSchemeUrl,
      medium: paper.medium,
      published_at: paper.publishedAt,
    });
    return { error: error?.message ?? null };
  }, []);

  const deletePaper = useCallback(async (id: string) => {
    await supabase.from('papers').delete().eq('id', id);
  }, []);

  return {
    schedule,
    notes,
    papers,
    loading,
    addSchedule,
    deleteSchedule,
    addNote,
    deleteNote,
    addPaper,
    deletePaper,
  };
}
