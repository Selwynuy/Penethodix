# Database Migration: Add Content to Categories

## What This Does
Adds CherryTree-style content fields to categories, allowing them to act as both folders AND content nodes.

## Run the Migration

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/add_content_to_categories.sql`
4. Paste and run the SQL

### Option 2: Via Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push

# Or run the migration file directly
supabase db execute -f supabase/migrations/add_content_to_categories.sql
```

### Option 3: Manual SQL
Connect to your database and run:
```sql
ALTER TABLE categories 
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS steps TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS commands JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS owasp_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS phase TEXT,
  ADD COLUMN IF NOT EXISTS service TEXT;
```

## What Changed
- Categories can now have description, steps, commands, notes, tags, etc.
- Double-click a category to view/edit its content
- Single-click still filters entries by category
- Fully backward compatible - existing categories work as before

## Testing
1. Create a new category
2. Double-click it
3. Add description and notes
4. Save
5. Navigate away and back - content should persist
