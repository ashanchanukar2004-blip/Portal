export type SectionId = 'schedule' | 'notes' | 'papers' | 'assignments' | 'quizzes';

export interface ScheduleSlot {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  joinLink: string;
  medium: 'English' | 'Sinhala' | 'Tamil' | 'Bi-lingual';
}

export interface NoteItem {
  id: string;
  title: string;
  unitNumber: number;
  description: string;
  fileName: string;
  fileUrl: string;
  medium: 'English' | 'Sinhala' | 'Tamil' | 'Bi-lingual';
  uploadedAt: string;
}

export type PaperType = 'Model Papers' | 'Past Papers' | 'Tutorials' | 'Revision Papers';

export interface ExamPaper {
  id: string;
  paperType: PaperType;
  title: string;
  paperUrl: string;
  markingSchemeUrl: string;
  medium: 'English' | 'Sinhala' | 'Tamil' | 'Bi-lingual';
  publishedAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  deadline: string;
  medium: 'English' | 'Sinhala' | 'Tamil' | 'Bi-lingual';
  createdAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentEmail: string;
  fileName: string;
  fileUrl: string;
  submittedAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  medium: 'English' | 'Sinhala' | 'Tamil' | 'Bi-lingual';
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  questionText: string;
  imageUrl: string | null;
  options: string[];
  correctIndex: number;
  sortOrder: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  studentEmail: string;
  score: number;
  total: number;
  answers: number[];
  submittedAt: string;
}
