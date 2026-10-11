/*
# Create quizzes, questions, quiz_attempts tables and images storage bucket

## Purpose
Adds an online quiz system where the teacher creates quizzes with MCQ questions
(optionally with images), and students take the quiz online and see their marks
immediately after submitting.

## New Tables

### `quizzes`
- `id` (uuid, primary key)
- `title` (text, not null)
- `description` (text, not null, default '')
- `medium` (text, default 'English')
- `created_at` (timestamptz, default now())
- `created_by` (uuid, references profiles.id ON DELETE SET NULL)

### `quiz_questions`
- `id` (uuid, primary key)
- `quiz_id` (uuid, not null, references quizzes.id ON DELETE CASCADE)
- `question_text` (text, not null)
- `image_url` (text, nullable) — optional image for the question
- `options` (jsonb, not null) — array of strings, e.g. ["A", "B", "C", "D"]
- `correct_index` (int, not null, 0-based) — index into options array
- `sort_order` (int, default 0)

### `quiz_attempts`
- `id` (uuid, primary key)
- `quiz_id` (uuid, not null, references quizzes.id ON DELETE CASCADE)
- `student_id` (uuid, not null, default auth.uid(), references profiles.id ON DELETE CASCADE)
- `student_email` (text, not null)
- `score` (int, not null) — number of correct answers
- `total` (int, not null) — total number of questions
- `answers` (jsonb, not null) — array of selected indices
- `submitted_at` (timestamptz, default now())
- Unique constraint on (quiz_id, student_id) — one attempt per student per quiz

## Storage
- Creates `quiz-images` bucket (public, max 5 MB, image MIME types only)

## Security — RLS

### quizzes
- SELECT: all authenticated users can read quizzes.
- INSERT/UPDATE/DELETE: only teacher role.

### quiz_questions
- SELECT: all authenticated users can read questions.
- INSERT/UPDATE/DELETE: only teacher role.

### quiz_attempts
- SELECT: students read own attempts; teacher reads all.
- INSERT: students insert their own attempt.
- UPDATE: students update their own attempt.
- DELETE: teacher can delete any.

## Notes
1. Students see their score immediately on submit (computed client-side from
   correct_index values returned with questions).
2. One attempt per student per quiz (unique constraint). Re-taking replaces
   the existing attempt.
3. Question images uploaded to `quiz-images` bucket under `questions/` folder.
*/

CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  medium text NOT NULL DEFAULT 'English' CHECK (medium IN ('English', 'Sinhala', 'Tamil', 'Bi-lingual')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quizzes_select_all" ON quizzes;
CREATE POLICY "quizzes_select_all"
  ON quizzes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "quizzes_insert_teacher" ON quizzes;
CREATE POLICY "quizzes_insert_teacher"
  ON quizzes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'));

DROP POLICY IF EXISTS "quizzes_update_teacher" ON quizzes;
CREATE POLICY "quizzes_update_teacher"
  ON quizzes FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'));

DROP POLICY IF EXISTS "quizzes_delete_teacher" ON quizzes;
CREATE POLICY "quizzes_delete_teacher"
  ON quizzes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'));


CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  image_url text,
  options jsonb NOT NULL,
  correct_index int NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "questions_select_all" ON quiz_questions;
CREATE POLICY "questions_select_all"
  ON quiz_questions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "questions_insert_teacher" ON quiz_questions;
CREATE POLICY "questions_insert_teacher"
  ON quiz_questions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'));

DROP POLICY IF EXISTS "questions_update_teacher" ON quiz_questions;
CREATE POLICY "questions_update_teacher"
  ON quiz_questions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'));

DROP POLICY IF EXISTS "questions_delete_teacher" ON quiz_questions;
CREATE POLICY "questions_delete_teacher"
  ON quiz_questions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'));


CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  student_email text NOT NULL,
  score int NOT NULL,
  total int NOT NULL,
  answers jsonb NOT NULL,
  submitted_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attempts_select_own_or_teacher" ON quiz_attempts;
CREATE POLICY "attempts_select_own_or_teacher"
  ON quiz_attempts FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher')
  );

DROP POLICY IF EXISTS "attempts_insert_own" ON quiz_attempts;
CREATE POLICY "attempts_insert_own"
  ON quiz_attempts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "attempts_update_own" ON quiz_attempts;
CREATE POLICY "attempts_update_own"
  ON quiz_attempts FOR UPDATE TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "attempts_delete_teacher" ON quiz_attempts;
CREATE POLICY "attempts_delete_teacher"
  ON quiz_attempts FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'));

CREATE UNIQUE INDEX IF NOT EXISTS one_attempt_per_student
  ON quiz_attempts (quiz_id, student_id);

-- Create quiz-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quiz-images',
  'quiz-images',
  true,
  5242880,
  '{image/png, image/jpeg, image/jpg, image/webp, image/gif}'
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "quiz_images_public_read" ON storage.objects;
CREATE POLICY "quiz_images_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'quiz-images');

DROP POLICY IF EXISTS "quiz_images_authed_upload" ON storage.objects;
CREATE POLICY "quiz_images_authed_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'quiz-images');

DROP POLICY IF EXISTS "quiz_images_authed_update" ON storage.objects;
CREATE POLICY "quiz_images_authed_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'quiz-images')
  WITH CHECK (bucket_id = 'quiz-images');

DROP POLICY IF EXISTS "quiz_images_authed_delete" ON storage.objects;
CREATE POLICY "quiz_images_authed_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'quiz-images');
