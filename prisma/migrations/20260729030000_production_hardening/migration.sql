ALTER TABLE "User" ADD COLUMN "purgeScheduledAt" TIMESTAMP(3);
CREATE INDEX "User_status_purgeScheduledAt_idx" ON "User"("status", "purgeScheduledAt");

-- Supabase Storage is not present in ordinary PostgreSQL test databases, so
-- bucket creation and policies are applied only when that managed schema exists.
DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL AND to_regclass('storage.objects') IS NOT NULL THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'resume-photos',
      'resume-photos',
      true,
      5242880,
      ARRAY['image/jpeg', 'image/png', 'image/webp']
    )
    ON CONFLICT (id) DO UPDATE SET
      public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

    EXECUTE 'DROP POLICY IF EXISTS "resume_photos_insert_own_folder" ON storage.objects';
    EXECUTE 'CREATE POLICY "resume_photos_insert_own_folder" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
      bucket_id = ''resume-photos''
      AND (storage.foldername(name))[1] = (SELECT auth.jwt()->>''sub'')
      AND owner_id = (SELECT auth.uid()::text)
    )';

    EXECUTE 'DROP POLICY IF EXISTS "resume_photos_select_own_objects" ON storage.objects';
    EXECUTE 'CREATE POLICY "resume_photos_select_own_objects" ON storage.objects FOR SELECT TO authenticated USING (
      bucket_id = ''resume-photos''
      AND owner_id = (SELECT auth.uid()::text)
    )';

    EXECUTE 'DROP POLICY IF EXISTS "resume_photos_update_own_objects" ON storage.objects';
    EXECUTE 'CREATE POLICY "resume_photos_update_own_objects" ON storage.objects FOR UPDATE TO authenticated USING (
      bucket_id = ''resume-photos''
      AND owner_id = (SELECT auth.uid()::text)
    ) WITH CHECK (
      bucket_id = ''resume-photos''
      AND (storage.foldername(name))[1] = (SELECT auth.jwt()->>''sub'')
      AND owner_id = (SELECT auth.uid()::text)
    )';

    EXECUTE 'DROP POLICY IF EXISTS "resume_photos_delete_own_objects" ON storage.objects';
    EXECUTE 'CREATE POLICY "resume_photos_delete_own_objects" ON storage.objects FOR DELETE TO authenticated USING (
      bucket_id = ''resume-photos''
      AND owner_id = (SELECT auth.uid()::text)
    )';
  END IF;
END $$;
