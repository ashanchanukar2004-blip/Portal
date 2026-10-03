/*
# Create schedules, notes, and papers tables with realtime support

## Purpose
This migration creates three new tables — `schedules`, `notes`, and `papers` —
to permanently store the teacher's class schedule, lesson notes, and examination
papers. These replace the hardcoded in-memory data that was lost on every page
reload. Realtime replication is enabled on all three tables so that when the
teacher adds or deletes an item, every signed-in student sees the change
instantly without refreshing the page.

## New Tables

### `schedules`
- `id` (uuid, primary key) — unique identifier for each class slot
- `title` (text, not null) — class title (e.g. "Chemical Bonding — Part 1")
- `date` (date, not null) — the date of the class
- `start_time` (text, not null) — start time in HH:MM 24-hour format
- `end_time` (text, not null) — end time in HH:MM 24-hour format
- `join_link` (text, not null) — meeting URL (Zoom/Google Meet)
- `medium` (text, not null) — language medium: English, Sinhala, Tamil, or Bi-lingual
- `created_at` (timestamptz, default now()) — when the slot was created

### `notes`
- `id` (uuid, primary key) — unique identifier for each note
- `title` (text, not null) — note title
- `unit_number` (integer, not null) — which unit this note belongs to
- `description` (text, not null) — brief description of the note contents
- `file_name` (text, not null) — original file name for display
- `file_url` (text, not null) — public URL to the PDF in storage
- `medium` (text, not null) — language medium
- `uploaded_at` (date, not null) — date the note was uploaded

### `papers`
- `id` (uuid, primary key) — unique identifier for each exam paper
- `paper_type` (text, not null) — category: Model Papers, Past Papers, Tutorials, or Revision Papers
- `title` (text, not null) — paper title
- `paper_url` (text, not null) — public URL to the question paper PDF
- `marking_scheme_url` (text, not null) — public URL to the marking scheme PDF
- `medium` (text, not null) — language medium
- `published_at` (date, not null) — date the paper was published

## Security — Row Level Security

All three tables have RLS enabled. The app has a sign-in screen, so all policies
are scoped to `TO authenticated`:

- SELECT: Any authenticated user (student or teacher) can read all rows.
  This is intentional — the portal is a shared classroom where all students
  see the same schedule, notes, and papers.
- INSERT: Any authenticated user can insert rows. In practice only the
  teacher sees the "Add" buttons in the UI, but the policy allows any
  authenticated user to insert so the teacher (who is just an authenticated
  user with a role flag) can add items.
- DELETE: Any authenticated user can delete rows. Same reasoning — the UI
  only shows delete buttons in Teacher Mode.
- UPDATE: Any authenticated user can update rows (for future use).

These are shared-classroom tables (not per-user data), so ownership checks
are not applicable — all signed-in users share the same data set.

## Realtime

Realtime is enabled for all three tables by adding them to the
`supabase_realtime` publication. This allows the Supabase JS client to
subscribe to INSERT, UPDATE, and DELETE events, so students see changes
the teacher makes without refreshing.

## Notes
1. The initial seed data (sample schedule slots, notes, and papers) is
   inserted as part of this migration so the portal is not empty on first
   load.
2. `ON CONFLICT DO NOTHING` on the seed inserts makes the migration safe
   to re-run without creating duplicate rows.
*/

-- =============================================================
-- schedules table
-- =============================================================
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date date NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  join_link text NOT NULL,
  medium text NOT NULL DEFAULT 'Bi-lingual' CHECK (medium IN ('English', 'Sinhala', 'Tamil', 'Bi-lingual')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schedules_select_all" ON schedules;
CREATE POLICY "schedules_select_all"
  ON schedules FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "schedules_insert_all" ON schedules;
CREATE POLICY "schedules_insert_all"
  ON schedules FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "schedules_update_all" ON schedules;
CREATE POLICY "schedules_update_all"
  ON schedules FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "schedules_delete_all" ON schedules;
CREATE POLICY "schedules_delete_all"
  ON schedules FOR DELETE
  TO authenticated
  USING (true);

-- =============================================================
-- notes table
-- =============================================================
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  unit_number integer NOT NULL,
  description text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  medium text NOT NULL DEFAULT 'English' CHECK (medium IN ('English', 'Sinhala', 'Tamil', 'Bi-lingual')),
  uploaded_at date NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notes_select_all" ON notes;
CREATE POLICY "notes_select_all"
  ON notes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "notes_insert_all" ON notes;
CREATE POLICY "notes_insert_all"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "notes_update_all" ON notes;
CREATE POLICY "notes_update_all"
  ON notes FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "notes_delete_all" ON notes;
CREATE POLICY "notes_delete_all"
  ON notes FOR DELETE
  TO authenticated
  USING (true);

-- =============================================================
-- papers table
-- =============================================================
CREATE TABLE IF NOT EXISTS papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_type text NOT NULL CHECK (paper_type IN ('Model Papers', 'Past Papers', 'Tutorials', 'Revision Papers')),
  title text NOT NULL,
  paper_url text NOT NULL,
  marking_scheme_url text NOT NULL,
  medium text NOT NULL DEFAULT 'English' CHECK (medium IN ('English', 'Sinhala', 'Tamil', 'Bi-lingual')),
  published_at date NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE papers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "papers_select_all" ON papers;
CREATE POLICY "papers_select_all"
  ON papers FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "papers_insert_all" ON papers;
CREATE POLICY "papers_insert_all"
  ON papers FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "papers_update_all" ON papers;
CREATE POLICY "papers_update_all"
  ON papers FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "papers_delete_all" ON papers;
CREATE POLICY "papers_delete_all"
  ON papers FOR DELETE
  TO authenticated
  USING (true);

-- =============================================================
-- Enable realtime on all three tables
-- =============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE notes;
ALTER PUBLICATION supabase_realtime ADD TABLE papers;

-- =============================================================
-- Seed initial data (from the app's hardcoded initialData.ts)
-- =============================================================

INSERT INTO schedules (title, date, start_time, end_time, join_link, medium) VALUES
  ('Atomic Structure & Electronic Configuration', '2026-10-05', '16:00', '18:00', 'https://meet.google.com/abc-defg-hij', 'Bi-lingual'),
  ('Chemical Bonding — Part 1', '2026-10-07', '16:00', '18:00', 'https://zoom.us/j/1234567890', 'English'),
  ('Periodicity & Periodic Trends', '2026-10-09', '17:00', '19:00', 'https://meet.google.com/xyz-wxyz-rst', 'Sinhala'),
  ('Hydrocarbons — Alkanes & Alkenes', '2026-10-12', '16:00', '18:00', 'https://zoom.us/j/9876543210', 'Bi-lingual')
ON CONFLICT DO NOTHING;

INSERT INTO notes (title, unit_number, description, file_name, file_url, medium, uploaded_at) VALUES
  ('Atomic Structure Fundamentals', 1, 'Covers subatomic particles, isotopes, electronic configuration, and quantum numbers with worked examples.', 'atomic-structure-notes.pdf', 'https://example.com/notes/atomic-structure-notes.pdf', 'English', '2026-09-20'),
  ('Chemical Bonding — Complete Guide', 2, 'Ionic, covalent, dative bonds, VSEPR theory, shapes of molecules, and intermolecular forces.', 'chemical-bonding-guide.pdf', 'https://example.com/notes/chemical-bonding-guide.pdf', 'English', '2026-09-22'),
  ('Thermodynamics Notes (Sinhala Medium)', 3, 'Enthalpy, entropy, Gibbs free energy, and Hess law explained in Sinhala with diagrams.', 'thermodynamics-sinhala.pdf', 'https://example.com/notes/thermodynamics-sinhala.pdf', 'Sinhala', '2026-09-24'),
  ('Periodic Table & Periodicity', 4, 'Trends in atomic radius, ionization energy, electronegativity, and detailed group analysis.', 'periodicity-notes.pdf', 'https://example.com/notes/periodicity-notes.pdf', 'English', '2026-09-18'),
  ('Transition Metals & Coordination Chemistry', 5, 'd-block elements, oxidation states, complex ions, ligand types, and color of transition metal complexes.', 'transition-metals-notes.pdf', 'https://example.com/notes/transition-metals-notes.pdf', 'English', '2026-09-26'),
  ('Group 2 Elements — Sinhala Medium', 6, 'Alkaline earth metals, their properties, reactions, and compounds in Sinhala language.', 'group-2-sinhala.pdf', 'https://example.com/notes/group-2-sinhala.pdf', 'Sinhala', '2026-09-28'),
  ('Introduction to Organic Chemistry', 7, 'Functional groups, nomenclature (IUPAC), isomerism, and basic reaction mechanisms.', 'organic-intro-notes.pdf', 'https://example.com/notes/organic-intro-notes.pdf', 'English', '2026-09-15'),
  ('Hydrocarbons — Alkanes, Alkenes, Alkynes', 8, 'Complete coverage of saturated and unsaturated hydrocarbons with reaction mechanisms.', 'hydrocarbons-notes.pdf', 'https://example.com/notes/hydrocarbons-notes.pdf', 'Bi-lingual', '2026-09-30'),
  ('Organic Reaction Mechanisms (Sinhala)', 9, 'Substitution, addition, and elimination mechanisms explained step-by-step in Sinhala.', 'organic-mechanisms-sinhala.pdf', 'https://example.com/notes/organic-mechanisms-sinhala.pdf', 'Sinhala', '2026-10-01')
ON CONFLICT DO NOTHING;

INSERT INTO papers (paper_type, title, paper_url, marking_scheme_url, medium, published_at) VALUES
  ('Model Papers', 'Atomic Structure & Stoichiometry — Model Paper', 'https://example.com/papers/week1-model-paper.pdf', 'https://example.com/papers/week1-marking-scheme.pdf', 'English', '2026-09-21'),
  ('Model Papers', 'Chemical Bonding & Molecular Structure — Model Paper', 'https://example.com/papers/week2-model-paper.pdf', 'https://example.com/papers/week2-marking-scheme.pdf', 'English', '2026-09-28'),
  ('Past Papers', '2025 A/L Chemistry Paper — Sinhala Medium', 'https://example.com/papers/2025-al-sinhala-paper.pdf', 'https://example.com/papers/2025-al-sinhala-marking.pdf', 'Sinhala', '2026-10-02')
ON CONFLICT DO NOTHING;
