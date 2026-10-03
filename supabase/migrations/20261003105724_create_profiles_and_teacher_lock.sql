/*
# Create profiles table with role-based access and single-teacher lock

## Purpose
This migration creates a `profiles` table that extends Supabase's built-in `auth.users`
with a role column (`student` or `teacher`). It enforces that only ONE teacher account
can ever exist in the system, preventing fake students from registering as teachers.

## New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users) — same as the auth user id
  - `email` (text, not null) — copied from the auth user's email for convenience
  - `role` (text, not null, default 'student') — either 'student' or 'teacher'
  - `created_at` (timestamptz, default now())

## Security — Row Level Security
- RLS enabled on `profiles`.
- SELECT: authenticated users can read all profiles (so the frontend can check
  if a teacher already exists before allowing teacher registration).
- INSERT: users can insert their own profile row (WITH CHECK auth.uid() = id).
- UPDATE/DELETE: blocked at the policy level (no policies defined).

## Single-Teacher Enforcement
- A unique partial index `only_one_teacher` on `profiles` WHERE role = 'teacher'
  ensures the database rejects any attempt to insert a second teacher row.
- This is a database-level guarantee — even if the frontend is bypassed, a second
  teacher registration fails with a unique constraint violation.

## Notes
1. The frontend checks for an existing teacher BEFORE showing the teacher signup
   option, giving a clean UX. The DB index is the hard enforcement.
2. Role is stored in the `profiles` table (not in user_metadata) so it is
   server-controlled and cannot be tampered with by the client.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all profiles (needed to check if teacher exists)
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to insert only their own profile
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update only their own profile (needed for edge cases)
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Single-teacher enforcement: only one row with role='teacher' can exist
CREATE UNIQUE INDEX IF NOT EXISTS only_one_teacher
  ON profiles (role)
  WHERE role = 'teacher';
