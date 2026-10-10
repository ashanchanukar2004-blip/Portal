/*
# Create assignments and submissions tables

## Purpose
Adds an assignment system where the teacher can create assignments with deadlines,
and students can submit their work (PDF uploads). The teacher can view all student
submissions per assignment.

## New Tables

### `assignments`
- `id` (uuid, primary key, default gen_random_uuid())
- `title` (text, not null) — assignment title
- `description` (text, not null) — what the student needs to do
- `deadline` (timestamptz, not null) — due date and time for submissions
- `medium` (text, not null, default 'English') — language medium
- `created_at` (timestamptz, default now())
- `created_by` (uuid, references profiles.id ON DELETE SET NULL) — the teacher who created it

### `submissions`
- `id` (uuid, primary key, default gen_random_uuid())
- `assignment_id` (uuid, not null, references assignments.id ON DELETE CASCADE)
- `student_id` (uuid, not null, references profiles.id ON DELETE CASCADE) — the student who submitted
- `student_email` (text, not null) — denormalized for teacher display
- `file_name` (text, not null) — uploaded PDF file name
- `file_url` (text, not null) — public URL of the uploaded PDF
- `submitted_at` (timestamptz, default now())
- Unique constraint on (assignment_id, student_id) — one submission per student per assignment

## Security — Row Level Security

### assignments
- SELECT: authenticated users (students + teacher) can read all assignments.
- INSERT: only the teacher (role = 'teacher') can create assignments.
- UPDATE: only the teacher can update assignments.
- DELETE: only the teacher can delete assignments.

### submissions
- SELECT: students can read their own submissions; the teacher can read all submissions.
- INSERT: students can insert their own submission (auth.uid() = student_id).
- UPDATE: students can update their own submission.
- DELETE: students can delete their own submission; teacher can delete any.

## Notes
1. The teacher check uses a subquery on profiles WHERE role = 'teacher' AND id = auth.uid().
2. Student submissions are scoped to their own user id, enforced by RLS.
3. The unique constraint prevents duplicate submissions — a student re-submitting will
   need to update their existing submission row.
4. File uploads go to the existing `pdfs` storage bucket under a `submissions/` folder.
*/

CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  deadline timestamptz NOT NULL,
  medium text NOT NULL DEFAULT 'English' CHECK (medium IN ('English', 'Sinhala', 'Tamil', 'Bi-lingual')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assignments_select_all" ON assignments;
CREATE POLICY "assignments_select_all"
  ON assignments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "assignments_insert_teacher" ON assignments;
CREATE POLICY "assignments_insert_teacher"
  ON assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher')
  );

DROP POLICY IF EXISTS "assignments_update_teacher" ON assignments;
CREATE POLICY "assignments_update_teacher"
  ON assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher')
  );

DROP POLICY IF EXISTS "assignments_delete_teacher" ON assignments;
CREATE POLICY "assignments_delete_teacher"
  ON assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher')
  );

CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  student_email text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  submitted_at timestamptz DEFAULT now()
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "submissions_select_own_or_teacher" ON submissions;
CREATE POLICY "submissions_select_own_or_teacher"
  ON submissions FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher')
  );

DROP POLICY IF EXISTS "submissions_insert_own" ON submissions;
CREATE POLICY "submissions_insert_own"
  ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "submissions_update_own" ON submissions;
CREATE POLICY "submissions_update_own"
  ON submissions FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "submissions_delete_own_or_teacher" ON submissions;
CREATE POLICY "submissions_delete_own_or_teacher"
  ON submissions FOR DELETE
  TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher')
  );

CREATE UNIQUE INDEX IF NOT EXISTS one_submission_per_student
  ON submissions (assignment_id, student_id);
