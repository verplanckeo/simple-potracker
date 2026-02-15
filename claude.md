# Project Overview

A simple PO tracker with UX best practices to give a proper user experience.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Context API / Zustand (specify when implemented)
- **Testing**: Vitest + React Testing Library
- **Build Tool**: Vite

## Project Structure

```
project-root/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page/route components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── context/      # React Context providers
│   │   ├── services/     # API calls and external services
│   │   ├── types/        # TypeScript type definitions
│   │   ├── utils/        # Utility functions
│   │   └── constants/    # Application constants
│   └── .claude/          # Claude-specific configuration
│       └── rules/        # Modular coding rules
└── claude.md            # This file
```

## Development Workflow

When working on this project, Claude should:

1. Read and apply rules from `.claude/rules/` directory
2. Use TypeScript strictly - no `any` types
3. Follow React best practices and hooks patterns
4. Ensure accessibility (WCAG compliance)
5. Write tests alongside implementation
6. Use semantic commits

## Rule Files

This project uses modular rule files located in `.claude/rules/`:

- `typescript-standards.md` - TypeScript coding standards
- `react-patterns.md` - React component patterns and best practices
- `api-integration.md` - Frontend-backend API integration guidelines
- `testing-guidelines.md` - Testing standards and patterns
- `styling-guide.md` - UI/UX and styling conventions
- `file-organization.md` - Project structure and naming conventions

Claude should reference these rule files when making code changes or providing guidance.

## Quick Commands

```bash
# Frontend development
npm install
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Run tests
npm run lint         # Run ESLint

```

## Current Sprint Goals

[Update this section with current development priorities]

## Notes

- Always run TypeScript type checking before committing
- API endpoints should be documented in backend README
- Use path aliases (@/) for cleaner imports
- Prefer functional components with hooks over class components