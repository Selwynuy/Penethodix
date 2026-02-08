# Database Migration Guide

## Overview

This guide explains how to manage database migrations for Penethodix using Supabase CLI or manual SQL execution.

## Migration Management Options

### Option 1: Supabase CLI (Recommended)

The Supabase CLI provides versioned migrations, rollback capabilities, and better collaboration.

#### Installation

```bash
# macOS
brew install supabase/tap/supabase

# Windows (Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
npm install -g supabase
```

#### Setup

1. **Login to Supabase**:
   ```bash
   supabase login
   ```

2. **Link your project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```
   Find your project ref in Supabase Dashboard → Settings → General

3. **Initialize migrations** (if starting fresh):
   ```bash
   supabase migration new initial_schema
   ```

#### Using Migrations

1. **Create a new migration**:
   ```bash
   supabase migration new migration_name
   ```
   This creates a timestamped file in `supabase/migrations/`

2. **Write your migration SQL** in the generated file

3. **Apply migrations**:
   ```bash
   supabase db push
   ```

4. **Check migration status**:
   ```bash
   supabase migration list
   ```

5. **Reset database** (development only):
   ```bash
   supabase db reset
   ```

#### Migration Best Practices

- **One logical change per migration**: Don't mix schema changes with data migrations
- **Use descriptive names**: `add_user_id_to_engagements` not `migration_1`
- **Test locally first**: Use `supabase start` for local development
- **Review before pushing**: Always review SQL before applying to production
- **Backup before major changes**: Always backup production before schema changes

### Option 2: Manual SQL Execution

For projects without Supabase CLI, you can run migrations manually:

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy migration SQL** from `supabase/migrations/`
3. **Paste and run** in SQL Editor
4. **Verify** the changes were applied

## Current Migrations

### Migration Order

Apply migrations in this order:

1. **Initial Schema** (`schema.sql`) - Base tables and structure
2. **Create Findings Table** (`migrations/create_findings_table.sql`) - Findings table structure
3. **Alter Findings Table** (`migrations/alter_findings_table.sql`) - Update findings to structured format
4. **Secure RLS Policies** (`migrations/secure_rls_policies.sql`) - User-scoped security policies

### Migration Details

#### `create_findings_table.sql`
- Creates the findings table with initial structure
- Sets up basic indexes
- Only run if table doesn't exist

#### `alter_findings_table.sql`
- Transforms findings from single `content` column to structured format
- Adds: `title`, `severity`, `status`, `description`, `target_id`
- Migrates existing data
- **Safe to run on existing tables**

#### `secure_rls_policies.sql`
- Implements Row Level Security (RLS)
- Restricts access to user's own data
- Adds automatic `user_id` assignment triggers
- **Critical for production security**

## Migration Workflow

### Development

1. Create migration: `supabase migration new feature_name`
2. Write SQL in generated file
3. Test locally: `supabase db reset` (if using local Supabase)
4. Apply: `supabase db push`

### Production

1. **Review migration SQL** carefully
2. **Backup database** (Supabase Dashboard → Database → Backups)
3. **Test in staging** first (if available)
4. **Apply migration**:
   - CLI: `supabase db push --linked`
   - Manual: Copy SQL to Supabase SQL Editor
5. **Verify** changes in Supabase Dashboard
6. **Monitor** for errors or issues

## Rollback Strategy

### Using Supabase CLI

Supabase CLI doesn't have automatic rollback, but you can:

1. **Create a rollback migration**:
   ```bash
   supabase migration new rollback_feature_name
   ```
2. **Write reverse SQL** in the rollback file
3. **Apply rollback**: `supabase db push`

### Manual Rollback

1. Create a new SQL file with reverse operations
2. Run in Supabase SQL Editor
3. Document the rollback in your migration history

## Troubleshooting

### Migration Fails

1. **Check error message** in Supabase Dashboard → Logs
2. **Verify SQL syntax** - test in SQL Editor first
3. **Check dependencies** - ensure previous migrations ran
4. **Review RLS policies** - might block migration execution

### Migration Already Applied

- Supabase tracks applied migrations
- Re-running should be idempotent (use `IF NOT EXISTS`)
- Check `supabase_migrations.schema_migrations` table

### Conflicts

- If multiple developers create migrations:
  - Merge migration files
  - Resolve SQL conflicts
  - Test merged migration

## Security Considerations

- **Never commit secrets** in migration files
- **Use environment variables** for sensitive data
- **Review RLS policies** after schema changes
- **Test permissions** after applying migrations
- **Backup before production migrations**

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Supabase Migrations Guide](https://supabase.com/docs/guides/database/migrations)
- [PostgreSQL Migration Best Practices](https://www.postgresql.org/docs/current/ddl-alter.html)
