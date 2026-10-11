import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import type { ScheduleSlot, NoteItem, ExamPaper, Assignment, Submission, Quiz, QuizAttempt } from '../types';

interface NotificationPayload {
  type: 'assignment' | 'notes' | 'papers' | 'schedule' | 'quiz';
  title: string;
  details: string;
  deadline?: string;
}

async function sendNotification(payload: NotificationPayload) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // non-blocking — email failure shouldn't affect the UI
  }
}

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

interface DbAssignment {
  id: string;
  title: string;
  description: string;
  deadline: string;
  medium: string;
  created_at: string;
}

interface DbSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  student_email: string;
  file_name: string;
  file_url: string;
  submitted_at: string;
}

interface DbQuiz {
  id: string;
  title: string;
  description: string;
  medium: string;
  created_at: string;
}

interface DbQuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  student_email: string;
  score: number;
  total: number;
  answers: number[];
  submitted_at: string;
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

const toAssignment = (r: DbAssignment): Assignment => ({
  id: r.id,
  title: r.title,
  description: r.description,
  deadline: r.deadline,
  medium: r.medium as Assignment['medium'],
  createdAt: r.created_at,
});

const toSubmission = (r: DbSubmission): Submission => ({
  id: r.id,
  assignmentId: r.assignment_id,
  studentId: r.student_id,
  studentEmail: r.student_email,
  fileName: r.file_name,
  fileUrl: r.file_url,
  submittedAt: r.submitted_at,
});

const toQuiz = (r: DbQuiz): Quiz => ({
  id: r.id,
  title: r.title,
  description: r.description,
  medium: r.medium as Quiz['medium'],
  createdAt: r.created_at,
});

const toQuizAttempt = (r: DbQuizAttempt): QuizAttempt => ({
  id: r.id,
  quizId: r.quiz_id,
  studentId: r.student_id,
  studentEmail: r.student_email,
  score: r.score,
  total: r.total,
  answers: r.answers,
  submittedAt: r.submitted_at,
});

interface PortalData {
  schedule: ScheduleSlot[];
  notes: NoteItem[];
  papers: ExamPaper[];
  assignments: Assignment[];
  submissions: Submission[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  loading: boolean;
  addSchedule: (slot: Omit<ScheduleSlot, 'id'>) => Promise<{ error: string | null }>;
  deleteSchedule: (id: string) => Promise<void>;
  addNote: (note: Omit<NoteItem, 'id'>) => Promise<{ error: string | null }>;
  deleteNote: (id: string) => Promise<void>;
  addPaper: (paper: Omit<ExamPaper, 'id'>) => Promise<{ error: string | null }>;
  deletePaper: (id: string) => Promise<void>;
  addAssignment: (a: Omit<Assignment, 'id' | 'createdAt'>) => Promise<{ error: string | null }>;
  deleteAssignment: (id: string) => Promise<void>;
  submitAssignment: (assignmentId: string, studentEmail: string, fileName: string, fileUrl: string) => Promise<{ error: string | null }>;
  deleteSubmission: (id: string) => Promise<void>;
  addQuiz: (q: Omit<Quiz, 'id' | 'createdAt'>) => Promise<{ error: string | null }>;
  deleteQuiz: (id: string) => Promise<void>;
  quizQuestionCounts: Record<string, number>;
  refreshQuizQuestionCounts: () => Promise<void>;
}

export function usePortalData(userId?: string): PortalData {
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [quizQuestionCounts, setQuizQuestionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadAll = async () => {
      const [schedRes, notesRes, papersRes, assignRes, subRes, quizRes, attemptRes] = await Promise.all([
        supabase.from('schedules').select('*').order('date', { ascending: true }),
        supabase.from('notes').select('*').order('uploaded_at', { ascending: false }),
        supabase.from('papers').select('*').order('published_at', { ascending: false }),
        supabase.from('assignments').select('*').order('deadline', { ascending: true }),
        supabase.from('submissions').select('*').order('submitted_at', { ascending: false }),
        supabase.from('quizzes').select('*').order('created_at', { ascending: false }),
        supabase.from('quiz_attempts').select('*').order('submitted_at', { ascending: false }),
      ]);

      if (!mounted) return;

      if (schedRes.data) setSchedule(schedRes.data.map(toScheduleSlot));
      if (notesRes.data) setNotes(notesRes.data.map(toNoteItem));
      if (papersRes.data) setPapers(papersRes.data.map(toExamPaper));
      if (assignRes.data) setAssignments(assignRes.data.map(toAssignment));
      if (subRes.data) setSubmissions(subRes.data.map(toSubmission));
      if (quizRes.data) setQuizzes(quizRes.data.map(toQuiz));
      if (attemptRes.data) setQuizAttempts(attemptRes.data.map(toQuizAttempt));

      const quizIds = (quizRes.data ?? []).map((q) => q.id);
      if (quizIds.length > 0) {
        const { count } = await supabase.from('quiz_questions').select('id', { count: 'exact', head: true }).in('quiz_id', quizIds);
        void count;
      }
      await refreshQuizCounts(quizIds);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAssignments((prev) => {
              const a = toAssignment(payload.new as DbAssignment);
              return prev.some((x) => x.id === a.id) ? prev : [...prev, a];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id: string }).id;
            setAssignments((prev) => prev.filter((a) => a.id !== oldId));
          } else if (payload.eventType === 'UPDATE') {
            const a = toAssignment(payload.new as DbAssignment);
            setAssignments((prev) => prev.map((x) => (x.id === a.id ? a : x)));
          }
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSubmissions((prev) => {
              const s = toSubmission(payload.new as DbSubmission);
              return prev.some((x) => x.id === s.id) ? prev : [...prev, s];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id: string }).id;
            setSubmissions((prev) => prev.filter((s) => s.id !== oldId));
          } else if (payload.eventType === 'UPDATE') {
            const s = toSubmission(payload.new as DbSubmission);
            setSubmissions((prev) => prev.map((x) => (x.id === s.id ? s : x)));
          }
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quizzes' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setQuizzes((prev) => {
              const q = toQuiz(payload.new as DbQuiz);
              return prev.some((x) => x.id === q.id) ? prev : [q, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id: string }).id;
            setQuizzes((prev) => prev.filter((q) => q.id !== oldId));
          } else if (payload.eventType === 'UPDATE') {
            const q = toQuiz(payload.new as DbQuiz);
            setQuizzes((prev) => prev.map((x) => (x.id === q.id ? q : x)));
          }
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_attempts' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setQuizAttempts((prev) => {
              const a = toQuizAttempt(payload.new as DbQuizAttempt);
              return prev.some((x) => x.id === a.id) ? prev : [a, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id: string }).id;
            setQuizAttempts((prev) => prev.filter((a) => a.id !== oldId));
          } else if (payload.eventType === 'UPDATE') {
            const a = toQuizAttempt(payload.new as DbQuizAttempt);
            setQuizAttempts((prev) => prev.map((x) => (x.id === a.id ? a : x)));
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const addSchedule = useCallback(async (slot: Omit<ScheduleSlot, 'id'>) => {
    const { data, error } = await supabase.from('schedules').insert({
      title: slot.title,
      date: slot.date,
      start_time: slot.startTime,
      end_time: slot.endTime,
      join_link: slot.joinLink,
      medium: slot.medium,
    }).select().single();
    if (!error && data) {
      setSchedule((prev) => {
        const s = toScheduleSlot(data as DbSchedule);
        return prev.some((x) => x.id === s.id) ? prev : [...prev, s];
      });
      void sendNotification({
        type: 'schedule',
        title: slot.title,
        details: `Date: ${slot.date} | Time: ${slot.startTime}–${slot.endTime} | Medium: ${slot.medium}`,
      });
    }
    return { error: error?.message ?? null };
  }, []);

  const deleteSchedule = useCallback(async (id: string) => {
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (!error) setSchedule((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const addNote = useCallback(async (note: Omit<NoteItem, 'id'>) => {
    const { data, error } = await supabase.from('notes').insert({
      title: note.title,
      unit_number: note.unitNumber,
      description: note.description,
      file_name: note.fileName,
      file_url: note.fileUrl,
      medium: note.medium,
      uploaded_at: note.uploadedAt,
    }).select().single();
    if (!error && data) {
      setNotes((prev) => {
        const n = toNoteItem(data as DbNote);
        return prev.some((x) => x.id === n.id) ? prev : [n, ...prev];
      });
      void sendNotification({
        type: 'notes',
        title: note.title,
        details: note.description,
      });
    }
    return { error: error?.message ?? null };
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (!error) setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addPaper = useCallback(async (paper: Omit<ExamPaper, 'id'>) => {
    const { data, error } = await supabase.from('papers').insert({
      paper_type: paper.paperType,
      title: paper.title,
      paper_url: paper.paperUrl,
      marking_scheme_url: paper.markingSchemeUrl,
      medium: paper.medium,
      published_at: paper.publishedAt,
    }).select().single();
    if (!error && data) {
      setPapers((prev) => {
        const p = toExamPaper(data as DbPaper);
        return prev.some((x) => x.id === p.id) ? prev : [p, ...prev];
      });
      void sendNotification({
        type: 'papers',
        title: paper.title,
        details: `Section: ${paper.paperType} | Medium: ${paper.medium}`,
      });
    }
    return { error: error?.message ?? null };
  }, []);

  const deletePaper = useCallback(async (id: string) => {
    const { error } = await supabase.from('papers').delete().eq('id', id);
    if (!error) setPapers((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addAssignment = useCallback(async (a: Omit<Assignment, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase.from('assignments').insert({
      title: a.title,
      description: a.description,
      deadline: a.deadline,
      medium: a.medium,
    }).select().single();
    if (!error && data) {
      setAssignments((prev) => {
        const item = toAssignment(data as DbAssignment);
        return prev.some((x) => x.id === item.id) ? prev : [...prev, item];
      });
      void sendNotification({
        type: 'assignment',
        title: a.title,
        details: a.description,
        deadline: a.deadline,
      });
    }
    return { error: error?.message ?? null };
  }, []);

  const deleteAssignment = useCallback(async (id: string) => {
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (!error) {
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      setSubmissions((prev) => prev.filter((s) => s.assignmentId !== id));
    }
  }, []);

  const submitAssignment = useCallback(async (assignmentId: string, studentEmail: string, fileName: string, fileUrl: string) => {
    const { data: existing } = await supabase
      .from('submissions')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', userId ?? '')
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase.from('submissions').update({
        file_name: fileName,
        file_url: fileUrl,
        submitted_at: new Date().toISOString(),
      }).eq('id', existing.id).select().single();
      if (!error && data) {
        setSubmissions((prev) => prev.map((s) => s.id === existing.id ? toSubmission(data as DbSubmission) : s));
      }
      return { error: error?.message ?? null };
    }

    const { data, error } = await supabase.from('submissions').insert({
      assignment_id: assignmentId,
      student_email: studentEmail,
      file_name: fileName,
      file_url: fileUrl,
    }).select().single();
    if (!error && data) {
      setSubmissions((prev) => {
        const s = toSubmission(data as DbSubmission);
        return prev.some((x) => x.id === s.id) ? prev : [s, ...prev];
      });
    }
    return { error: error?.message ?? null };
  }, [userId]);

  const deleteSubmission = useCallback(async (id: string) => {
    const { error } = await supabase.from('submissions').delete().eq('id', id);
    if (!error) setSubmissions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const refreshQuizCounts = useCallback(async (quizIds?: string[]) => {
    const ids = quizIds ?? quizzes.map((q) => q.id);
    if (ids.length === 0) { setQuizQuestionCounts({}); return; }
    const { data } = await supabase.from('quiz_questions').select('quiz_id').in('quiz_id', ids);
    const counts: Record<string, number> = {};
    (data ?? []).forEach((row: { quiz_id: string }) => {
      counts[row.quiz_id] = (counts[row.quiz_id] ?? 0) + 1;
    });
    setQuizQuestionCounts(counts);
  }, [quizzes]);

  const addQuiz = useCallback(async (q: Omit<Quiz, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase.from('quizzes').insert({
      title: q.title,
      description: q.description,
      medium: q.medium,
    }).select().single();
    if (!error && data) {
      setQuizzes((prev) => {
        const item = toQuiz(data as DbQuiz);
        return prev.some((x) => x.id === item.id) ? prev : [item, ...prev];
      });
      void sendNotification({
        type: 'quiz',
        title: q.title,
        details: q.description || 'A new quiz is available on Molekul.',
      });
    }
    return { error: error?.message ?? null };
  }, []);

  const deleteQuiz = useCallback(async (id: string) => {
    const { error } = await supabase.from('quizzes').delete().eq('id', id);
    if (!error) {
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
      setQuizAttempts((prev) => prev.filter((a) => a.quizId !== id));
    }
  }, []);

  return {
    schedule,
    notes,
    papers,
    assignments,
    submissions,
    quizzes,
    quizAttempts,
    quizQuestionCounts,
    loading,
    addSchedule,
    deleteSchedule,
    addNote,
    deleteNote,
    addPaper,
    deletePaper,
    addAssignment,
    deleteAssignment,
    submitAssignment,
    deleteSubmission,
    addQuiz,
    deleteQuiz,
    refreshQuizQuestionCounts: () => refreshQuizCounts(),
  };
}
