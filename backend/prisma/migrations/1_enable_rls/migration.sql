-- ============================================================
-- SECURITY: lock down the public schema for the Supabase PostgREST API.
-- ------------------------------------------------------------
-- The application connects through Prisma as the `postgres` role, which has
-- BYPASSRLS. Supabase additionally exposes every `public` table to the
-- `anon` / `authenticated` roles (with full DML grants by default) through its
-- REST API, protected only by Row Level Security. Because Prisma created these
-- tables with RLS disabled, anyone holding the project's public anon key could
-- read and modify all data - including User password hashes and Session tokens.
--
-- Enabling RLS with no permissive policies denies `anon` and `authenticated`
-- while leaving the application (postgres) and Supabase Storage (service_role)
-- unaffected, because both of those roles have BYPASSRLS.
-- ============================================================

-- 1. Enable Row Level Security on every table currently in the public schema.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 2. Defence in depth: remove the public API roles' direct grants.
--    (Guarded so this migration is a no-op on a plain PostgreSQL database.)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated';
  END IF;
END $$;
