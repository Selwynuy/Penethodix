# Penethodix

A state-aware penetration testing notebook that helps security professionals organize engagements, track targets, document findings, and get intelligent suggestions based on detected services.

![Penethodix](https://img.shields.io/badge/Status-Production%20Ready-success)
![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-2.95.2-green)

## Features

### 🎯 Engagement Management
- Create and manage multiple penetration testing engagements
- Track engagement phases (Reconnaissance, Enumeration, Exploitation, Post-Exploitation, Reporting)
- Real-time synchronization across devices
- Status tracking (Active, Completed, Paused)

### 🎯 Target & Port Tracking
- Add and manage targets (IP addresses/hostnames)
- Track discovered ports with service and version information
- Mark targets as in-scope or discovered during recon
- Collapsible target details with port and version sections
- Dynamic resizable panels

### 📝 Findings Documentation
- Rich markdown editor for documenting findings
- Auto-save functionality (2.5 seconds after typing stops)
- Manual save option
- Markdown preview modal (Ctrl+Shift+P)
- Real-time collaboration support
- Phase-specific organization

### 💡 Intelligent Suggestions
- Rule-based suggestion engine
- Context-aware recommendations based on:
  - Detected services
  - Open ports
  - Service versions
  - Current engagement phase
- Grouped suggestions by service
- One-click command copying with target IP replacement
- Confidence levels (High, Medium, Low)

### 📚 Knowledge Base
- Centralized repository of techniques and tools
- Categorized by domain and phase
- Search and filter functionality
- OWASP tag support
- Step-by-step procedures
- Command templates
- Export/Import JSON functionality

### ⚙️ Rules Engine
- Create custom rules for automated suggestions
- Condition-based rule evaluation:
  - Service detection
  - Port status
  - Version matching
  - Phase activation
  - Tag presence
- Enable/disable rules
- Duplicate and delete rules
- Advanced JSON editing mode

### ⌨️ Keyboard Shortcuts
- `Ctrl/Cmd + P` - Switch engagement phase
- `Ctrl/Cmd + N` - Insert new finding template
- `Ctrl/Cmd + Shift + P` - Preview markdown
- `?` - Show keyboard shortcuts help

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript 5.0
- **UI Components**: Radix UI + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime Subscriptions
- **Notifications**: Sonner (Toast notifications)
- **State Management**: React Hooks + Custom Hooks
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account and project
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Selwynuy/Penethodix.git
cd Penethodix
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory (or use `.env.example` as a template):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**For Vercel Deployment:**
Add these environment variables in your Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Set up the database:
   - **Option A (Recommended)**: Use Supabase CLI:
     ```bash
     npm install -g supabase
     supabase login
     supabase link --project-ref your-project-ref
     supabase db push
     ```
   - **Option B (Manual)**: Run migrations in order:
     1. `supabase/schema.sql` - Initial schema
     2. `supabase/migrations/create_findings_table.sql` - Findings table
     3. `supabase/migrations/alter_findings_table.sql` - Update findings structure
     4. `supabase/migrations/secure_rls_policies.sql` - Security policies
     
   See `supabase/README.md` and `supabase/MIGRATION_GUIDE.md` for detailed instructions.

5. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
Penethodix/
├── app/                    # Next.js app directory
│   ├── layout.tsx          # Root layout with error boundary
│   └── page.tsx            # Main application page
├── components/
│   ├── pentest/            # Pentest-specific components
│   │   ├── app-header.tsx
│   │   ├── findings-editor.tsx
│   │   ├── knowledge-base.tsx
│   │   ├── markdown-preview.tsx
│   │   ├── rules-editor.tsx
│   │   ├── sidebar.tsx
│   │   ├── suggestions-panel.tsx
│   │   └── target-panel.tsx
│   ├── ui/                 # Reusable UI components
│   └── error-boundary.tsx  # Error boundary component
├── hooks/                  # Custom React hooks
│   ├── use-engagements.ts
│   ├── use-targets.ts
│   ├── use-knowledge.ts
│   ├── use-rules.ts
│   └── use-categories.ts
├── lib/
│   ├── services/           # Service layer
│   │   └── findings.ts
│   ├── supabase/          # Supabase client and types
│   ├── rule-evaluator.ts  # Rule evaluation logic
│   └── types.ts           # TypeScript type definitions
└── supabase/              # Database migrations
    ├── migrations/        # Versioned migrations
    │   ├── create_findings_table.sql
    │   ├── alter_findings_table.sql
    │   └── secure_rls_policies.sql
    ├── schema.sql         # Initial schema (for reference)
    ├── seed-data.sql      # Seed data (optional)
    └── README.md          # Supabase setup guide
```

## Key Features Explained

### Real-time Synchronization
All data is synchronized in real-time using Supabase Realtime subscriptions. Changes made in one browser tab are instantly reflected in other tabs.

### Auto-save
Findings are automatically saved 2.5 seconds after you stop typing, with visual indicators showing save status.

### Rule-based Suggestions
The suggestion engine evaluates rules based on:
- Current engagement phase
- Detected services and ports
- Service versions
- Selected target (if any)

Rules can be enabled/disabled and customized to match your workflow.

### Export/Import
Knowledge base entries can be exported as JSON and imported back, making it easy to share and backup your knowledge base.

## Database Schema

The application uses the following main tables:
- `engagements` - Penetration testing engagements
- `targets` - IP addresses and hostnames
- `findings` - Markdown findings content
- `knowledge_entries` - Knowledge base entries
- `rules` - Suggestion rules
- `categories` - Knowledge base categories

See `supabase/` directory for migration files.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and proprietary.

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

Built with ❤️ for the security community
