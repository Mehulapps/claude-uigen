# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# First-time setup (install deps + generate Prisma client + run migrations)
npm run setup

# Development server (uses Turbopack)
npm run dev

# Build
npm run build

# Lint
npm run lint

# Run all tests
npm test

# Run a single test file
npx vitest run src/lib/__tests__/file-system.test.ts

# Reset database
npm run db:reset
```

`NODE_OPTIONS='--require ./node-compat.cjs'` is prepended to all Next.js commands via the npm scripts — this is required and should not be removed.

## Architecture

UIGen is an AI-powered React component generator. Users describe a component in a chat panel, Claude generates it, and a live preview renders the result — all without writing files to disk.

### Split-panel layout (`src/app/main-content.tsx`)

The UI is two resizable panels: chat on the left, and preview/code-editor on the right. The right panel switches between a live preview iframe and a Monaco code editor with a file tree. Everything is wrapped in `FileSystemProvider` → `ChatProvider`.

### Virtual file system (`src/lib/file-system.ts`)

`VirtualFileSystem` is an in-memory tree of `FileNode` objects. It never touches the real filesystem. The AI writes to it via tools; the preview reads from it. It serializes to/from a plain `Record<string, FileNode>` for storage in the database and transmission to the API route.

### AI tools (`src/lib/tools/`)

The chat API route (`src/app/api/chat/route.ts`) wires up two tools for `streamText`:
- `str_replace_editor` — create, str_replace, insert, and view operations on the virtual FS
- `file_manager` — rename and delete operations

Tool calls stream back to the client; `FileSystemContext.handleToolCall` applies them to the in-memory FS in real time.

### Client-side JSX preview (`src/lib/transform/jsx-transformer.ts`)

When the preview tab is shown, `PreviewFrame` calls `createImportMap` which:
1. Transpiles every `.js/.jsx/.ts/.tsx` file with Babel standalone
2. Creates blob URLs for each transpiled module
3. Builds an ES module import map (with `@/` alias support and esm.sh fallback for third-party packages)
4. Injects the import map into an srcdoc iframe that renders the app rooted at `/App.jsx`

### State management

Two React contexts manage global state:
- `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) — wraps `VirtualFileSystem`, exposes CRUD operations, tracks `selectedFile`, and applies incoming tool calls
- `ChatContext` (`src/lib/contexts/chat-context.tsx`) — wraps the Vercel AI SDK `useChat` hook, passes the serialized file system with every request, and routes tool calls to `FileSystemContext`

### Auth and persistence

- Auth uses JWT cookies via the `jose` library (`src/lib/auth.ts`). Passwords are hashed with `bcrypt`. Session duration is 7 days.
- The database is SQLite via Prisma. The Prisma client is generated to `src/generated/prisma`.
- Projects store `messages` and `data` (the serialized virtual FS) as JSON strings in the DB.
- Anonymous users can generate components without signing in; their work is tracked in `src/lib/anon-work-tracker.ts` and can be claimed after sign-up.
- Authenticated users are redirected from `/` to their most recent project (or a newly created one).

### Mock provider

If `ANTHROPIC_API_KEY` is not set, `getLanguageModel()` (`src/lib/provider.ts`) returns `MockLanguageModel`, which streams static component code. The real model is `claude-haiku-4-5`.

### Testing

Tests use Vitest with jsdom and React Testing Library. Test files live in `__tests__/` directories co-located with the code they test. The `vite-tsconfig-paths` plugin is used so `@/` imports resolve in tests.

## Conventions

- Use comments sparingly. Only comment complex code.
- The database schema is defined in `prisma/schema.prisma`. Reference it to understand stored data structures.
