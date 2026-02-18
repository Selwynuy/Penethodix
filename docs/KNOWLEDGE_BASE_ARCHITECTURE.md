# Knowledge Base Architecture - Future Expansion Plan

## Current Structure (Limitations)

**Current:**
- Flat categories (no hierarchy)
- Flat entries (no relationships)
- Simple tags (no relationships)
- No nesting or grouping beyond categories

**Problems:**
- Can't create subcategories (e.g., "Web Apps" > "API Security" > "GraphQL")
- Can't link related entries (e.g., "SQL Injection" → "SQLMap Usage")
- Can't create folders/collections
- Can't nest entries (e.g., "Methodology" > "Reconnaissance" > "Subdomain Enumeration")
- No graph view like Obsidian
- Limited organization for large knowledge bases

## Proposed Solutions

### Option 1: Hierarchical Categories (CherryTree-like)
**Add parent-child relationships to categories:**

```typescript
interface KnowledgeCategory {
  id: string
  name: string
  parentId?: string | null  // NEW: Support nesting
  color: string
  order: number
  // ... existing fields
}
```

**Benefits:**
- Backward compatible (parentId is optional)
- Supports folder-like structure
- Easy to migrate existing categories
- UI can show tree view

**Migration:**
- Existing categories get `parentId: null`
- Add migration to add `parent_id` column to categories table

### Option 2: Entry Relationships (Obsidian-like)
**Add bidirectional links between entries:**

```typescript
interface KnowledgeEntry {
  // ... existing fields
  linkedEntries?: string[]  // NEW: Array of entry IDs
  parentEntryId?: string | null  // NEW: For nesting entries
  collectionId?: string | null  // NEW: Group entries into collections
}
```

**Benefits:**
- Create knowledge graphs
- Link related techniques
- Build methodology chains
- Visual graph view possible

### Option 3: Hybrid Approach (Recommended)
**Combine both for maximum flexibility:**

```typescript
// Enhanced Category with hierarchy
interface KnowledgeCategory {
  id: string
  name: string
  parentId?: string | null
  color: string
  order: number
  // ... existing
}

// Enhanced Entry with relationships
interface KnowledgeEntry {
  id: string
  title: string
  domain: KnowledgeCategory  // Keep for backward compat
  categoryId?: string  // NEW: Explicit category reference
  
  // Relationships
  parentEntryId?: string | null  // For nesting entries
  linkedEntryIds?: string[]  // Bidirectional links
  collectionId?: string | null  // Optional grouping
  
  // Existing fields
  phase?: string
  service?: string
  tags: string[]
  // ... rest
}

// NEW: Collections/Folders
interface KnowledgeCollection {
  id: string
  name: string
  description?: string
  parentId?: string | null  // Nested collections
  color?: string
  order: number
  userId: string
}
```

## Implementation Strategy

### Phase 1: Add Optional Fields (Non-breaking)
1. Add `parent_id` to categories table (nullable)
2. Add `parent_entry_id`, `linked_entry_ids`, `collection_id` to entries table (all nullable)
3. Update types with optional fields
4. Existing data works as-is (all new fields null)

### Phase 2: UI Enhancements
1. Tree view for categories (if parentId exists)
2. Entry linking UI (similar to Obsidian `[[entry]]`)
3. Collection/folder view
4. Graph visualization (optional)

### Phase 3: Advanced Features
1. Entry nesting (sub-entries)
2. Graph view with relationships
3. Search across linked entries
4. Import/export with relationships

## Migration Path

```sql
-- Step 1: Add optional hierarchy columns
ALTER TABLE categories ADD COLUMN parent_id UUID REFERENCES categories(id) ON DELETE CASCADE;
ALTER TABLE knowledge_entries ADD COLUMN parent_entry_id UUID REFERENCES knowledge_entries(id) ON DELETE SET NULL;
ALTER TABLE knowledge_entries ADD COLUMN linked_entry_ids UUID[] DEFAULT '{}';
ALTER TABLE knowledge_entries ADD COLUMN collection_id UUID REFERENCES knowledge_collections(id) ON DELETE SET NULL;

-- Step 2: Create collections table (optional grouping)
CREATE TABLE knowledge_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES knowledge_collections(id) ON DELETE CASCADE,
  color TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Step 3: Add indexes for performance
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_entries_parent_entry_id ON knowledge_entries(parent_entry_id);
CREATE INDEX idx_entries_collection_id ON knowledge_entries(collection_id);
```

## Backward Compatibility

- All new fields are **optional** (nullable)
- Existing entries work without changes
- UI can show flat view by default, tree view as option
- Migration is additive, not destructive

## Benefits

1. **Scalability**: Handle thousands of entries with organization
2. **Flexibility**: Support multiple organizational patterns
3. **Relationships**: Link related knowledge (like Obsidian)
4. **Hierarchy**: Folder-like structure (like CherryTree)
5. **Future-proof**: Easy to add more relationship types later

## Recommendation

Start with **Phase 1** (optional fields) to maintain backward compatibility while enabling future expansion. Users can gradually adopt hierarchical features as needed.
