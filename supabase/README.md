# Supabase Setup Guide

## Quick Start

1. **Create a Supabase project** at https://supabase.com

2. **Run the initial schema**:
   - Open your Supabase project
   - Go to SQL Editor
   - Copy and paste the contents of `schema.sql`
   - Click "Run"

3. **Apply Secure RLS Policies**:
   - Go to SQL Editor
   - Copy and paste the contents of `migrations/secure_rls_policies.sql`
   - Click "Run"
   - This will set up the database with secure policies that ensure users can only access their own data.

4. **Seed example data** (optional):
   - Copy and paste the contents of `seed-data.sql`
   - Click "Run"
   - This creates example engagements, targets, knowledge entries, and rules.

5. **Get your credentials**:
   - Go to Project Settings → API
   - Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

6. **Add to `.env.local`**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

7. **Restart your dev server**

## Seed Data Contents

The seed data includes:

- **1 Example Engagement**: "Example Engagement" in enumeration phase
- **2 Example Targets**: 
  - `192.168.1.100` (web-server-01) with SSH, HTTP, HTTPS, MySQL
  - `192.168.1.101` (db-server-01) with SSH, PostgreSQL
- **5 Knowledge Base Entries**:
  - SSH Enumeration
  - Web Directory Bruteforce
  - SQL Injection Testing
  - Nmap Scanning Techniques
  - OWASP Top 10 - A01 Broken Access Control
- **5 Rules**:
  - SSH User Enumeration
  - HTTP Directory Discovery
  - MySQL Default Credentials
  - SSL/TLS Weakness Check (disabled)
  - PostgreSQL Enumeration
- **Example Findings**: Markdown template showing the format

## Migration Management

For proper database migration management, see `MIGRATION_GUIDE.md`.

**Quick Start with Supabase CLI:**
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

## Production Setup

For production, you should:

1. **Enable authentication** in Supabase
2. **Apply secure RLS policies** (`migrations/secure_rls_policies.sql`)
3. **Remove seed data** or keep only as templates
4. **Set up proper user management**
5. **Use Supabase CLI** for versioned migrations

## Troubleshooting

- **"Failed to create engagement"**: Check that RLS policies allow inserts
- **No data showing**: Verify seed data was inserted successfully
- **Connection errors**: Check your `.env.local` has correct credentials
