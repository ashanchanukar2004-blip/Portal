/*
# Create PDF storage bucket for notes and exam papers

## Purpose
Creates a public-readable storage bucket called `pdfs` where teachers can upload
PDF files for lesson notes and exam papers. Students can download them without
signing in to storage, but only authenticated users can upload.

## Storage Bucket
- `pdfs` — public bucket (files are readable by anyone with the URL)
  - MIME type allowed: application/pdf
  - File size limit: 50 MB

## RLS Policies on storage.objects
1. SELECT (read): Anyone (anon + authenticated) can read files in the `pdfs` bucket.
   This allows students to download PDFs via the public URL.
2. INSERT (upload): Only authenticated users can upload files to the `pdfs` bucket.
   In practice only teachers will see the upload UI, but the policy allows any
   authenticated user to upload — the frontend gates the UI by role.
3. UPDATE: Only authenticated users can update files in the `pdfs` bucket.
4. DELETE: Only authenticated users can delete files in the `pdfs` bucket.

## Notes
1. The bucket is set to public so that download links work without signed URLs.
2. File paths use a folder structure: `notes/<timestamp>-<filename>` and `papers/<timestamp>-<filename>`.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pdfs',
  'pdfs',
  true,
  52428800,
  '{application/pdf}'
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read files in the pdfs bucket
DROP POLICY IF EXISTS "pdfs_public_read" ON storage.objects;
CREATE POLICY "pdfs_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'pdfs');

-- Allow authenticated users to upload files to the pdfs bucket
DROP POLICY IF EXISTS "pdfs_authed_upload" ON storage.objects;
CREATE POLICY "pdfs_authed_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'pdfs');

-- Allow authenticated users to update files in the pdfs bucket
DROP POLICY IF EXISTS "pdfs_authed_update" ON storage.objects;
CREATE POLICY "pdfs_authed_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'pdfs')
  WITH CHECK (bucket_id = 'pdfs');

-- Allow authenticated users to delete files in the pdfs bucket
DROP POLICY IF EXISTS "pdfs_authed_delete" ON storage.objects;
CREATE POLICY "pdfs_authed_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'pdfs');
