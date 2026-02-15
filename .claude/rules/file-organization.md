# File Organization Guidelines

## Directory Structure

```
root/
├── public/                    # Static assets
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── components/           # React components
│   │   ├── ui/              # Base UI components (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   └── card.tsx
│   │   ├── common/          # Shared business components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navigation.tsx
│   │   ├── forms/           # Form components
│   │   │   ├── LoginForm.tsx
│   │   │   └── UserForm.tsx
│   │   └── layouts/         # Layout components
│   │       ├── PageLayout.tsx
│   │       └── SidebarLayout.tsx
│   ├── pages/               # Page/route components
│   │   ├── HomePage.tsx
│   │   ├── DashboardPage.tsx
│   │   └── users/
│   │       ├── UsersPage.tsx
│   │       └── UserDetailPage.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useDebounce.ts
│   │   └── useLocalStorage.ts
│   ├── context/             # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── services/            # API calls and external services
│   │   ├── api/
│   │   │   ├── client.ts    # HTTP client
│   │   │   ├── config.ts    # API configuration
│   │   │   └── endpoints.ts # Endpoint constants
│   │   ├── userService.ts
│   │   └── authService.ts
│   ├── types/               # TypeScript type definitions
│   │   ├── index.ts         # Export all types
│   │   ├── user.ts
│   │   ├── api.ts
│   │   └── common.ts
│   ├── utils/               # Utility functions
│   │   ├── cn.ts           # Class name utility
│   │   ├── formatters.ts   # Data formatting
│   │   └── validators.ts   # Validation functions
│   ├── constants/           # Application constants
│   │   ├── routes.ts
│   │   └── config.ts
│   ├── lib/                 # Third-party library configs
│   │   └── queryClient.ts
│   ├── assets/              # Images, fonts, etc.
│   │   ├── images/
│   │   └── fonts/
│   ├── test/                # Test utilities and setup
│   │   ├── setup.ts
│   │   ├── utils.tsx
│   │   └── mocks/
│   ├── App.tsx              # Root component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── .claude/                 # Claude configuration
│   └── rules/              # Coding rules
├── .env                     # Environment variables (gitignored)
├── .env.example            # Example environment variables
├── .eslintrc.json          # ESLint configuration
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json           # TypeScript configuration
├── tsconfig.node.json
├── vite.config.ts          # Vite configuration
├── vitest.config.ts        # Vitest configuration
└── README.md
```

## Naming Conventions

### Files and Directories

```
✅ Components:        PascalCase       UserCard.tsx, LoginForm.tsx
✅ Hooks:             camelCase        useAuth.ts, useLocalStorage.ts
✅ Utils:             camelCase        formatDate.ts, validators.ts
✅ Types:             camelCase        user.ts, api.ts
✅ Constants:         camelCase        routes.ts, config.ts
✅ Tests:             Component.test   UserCard.test.tsx
✅ Directories:       lowercase        components/, hooks/, utils/
```

### Code Elements

```typescript
// ✅ Interfaces - PascalCase with 'I' prefix (optional)
interface UserProfile { }
interface IUserProfile { }  // Alternative style

// ✅ Types - PascalCase
type UserId = string;
type UserRole = 'admin' | 'user';

// ✅ Components - PascalCase
export function UserCard() { }
export const LoginForm = () => { };

// ✅ Hooks - camelCase starting with 'use'
export function useAuth() { }
export const useLocalStorage = () => { };

// ✅ Constants - SCREAMING_SNAKE_CASE
const API_BASE_URL = 'http://localhost:5000';
const MAX_RETRY_COUNT = 3;

// ✅ Variables - camelCase
const userData = {};
const isLoading = false;

// ✅ Functions - camelCase
function formatDate() { }
const validateEmail = () => { };

// ✅ Enums - PascalCase for enum, SCREAMING_SNAKE_CASE for values
enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST',
}
```

## File Size Guidelines

- **Components**: Max 250-300 lines
- **Hooks**: Max 100-150 lines
- **Utils**: Max 200 lines
- **Services**: Max 300 lines

If a file exceeds these limits, consider splitting it into smaller modules.

## Component Organization

### Component File Structure

```typescript
// 1. Imports
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { userService } from '@/services/userService';
import type { User } from '@/types/user';
import { cn } from '@/utils/cn';

// 2. Types/Interfaces
interface UserCardProps {
  userId: string;
  className?: string;
  onEdit?: (userId: string) => void;
}

// 3. Constants (component-scoped)
const DEFAULT_AVATAR = '/images/default-avatar.png';

// 4. Component
export function UserCard({ userId, className, onEdit }: UserCardProps) {
  // 4a. Hooks
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 4b. Effects
  useEffect(() => {
    loadUser();
  }, [userId]);
  
  // 4c. Functions
  const loadUser = async () => {
    try {
      const data = await userService.getUser(userId);
      setUser(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEdit = () => {
    onEdit?.(userId);
  };
  
  // 4d. Early returns
  if (isLoading) {
    return <CardSkeleton />;
  }
  
  if (!user) {
    return null;
  }
  
  // 4e. Render
  return (
    <div className={cn('rounded-lg border p-4', className)}>
      <img src={user.avatar ?? DEFAULT_AVATAR} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      {onEdit && (
        <Button onClick={handleEdit}>Edit</Button>
      )}
    </div>
  );
}

// 5. Sub-components (if small and only used here)
function CardSkeleton() {
  return <div className="animate-pulse">Loading...</div>;
}
```

## Component Splitting

### When to Split

Split a component when:
- It exceeds 250 lines
- It has multiple responsibilities
- It contains reusable UI patterns
- It has complex logic that could be extracted

### Example Split

```typescript
// ❌ Before - One large component
export function UserDashboard() {
  // 300 lines of mixed concerns
  // - User profile display
  // - Activity feed
  // - Statistics
  // - Settings panel
}

// ✅ After - Split into focused components
export function UserDashboard() {
  return (
    <div className="grid gap-6">
      <UserProfile userId={userId} />
      <ActivityFeed userId={userId} />
      <UserStatistics userId={userId} />
      <SettingsPanel userId={userId} />
    </div>
  );
}
```

## Import Organization

### Import Order

```typescript
// 1. External dependencies (React, third-party libraries)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

// 2. Internal absolute imports (@/)
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/userService';
import type { User } from '@/types/user';
import { cn } from '@/utils/cn';

// 3. Relative imports
import { UserAvatar } from './UserAvatar';
import './UserCard.css';  // If using CSS modules
```

### Path Aliases

Configure in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/services/*": ["./src/services/*"]
    }
  }
}
```

And in `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

## Type Organization

### Shared Types

```typescript
// src/types/index.ts - Export all types
export type { User, CreateUserDto, UpdateUserDto } from './user';
export type { ApiResponse, ApiError, PaginatedResponse } from './api';
export type { AuthState, LoginCredentials } from './auth';
```

### Component-Specific Types

```typescript
// Keep component-specific types in the same file
// src/components/UserCard.tsx

interface UserCardProps {
  user: User;
  variant?: 'compact' | 'full';
}

type UserCardVariant = 'compact' | 'full';  // If used elsewhere

export function UserCard({ user, variant = 'compact' }: UserCardProps) {
  // ...
}
```

## Service Organization

### Service Structure

```typescript
// src/services/userService.ts

import { apiClient } from './api/client';
import type { User, CreateUserDto } from '@/types/user';

/**
 * Service for user-related API operations
 */
export const userService = {
  /**
   * Get all users
   */
  getUsers: async () => {
    const response = await apiClient.get<User[]>('/api/users');
    return response.data;
  },

  /**
   * Get user by ID
   */
  getUser: async (id: string) => {
    const response = await apiClient.get<User>(`/api/users/${id}`);
    return response.data;
  },

  /**
   * Create new user
   */
  createUser: async (data: CreateUserDto) => {
    const response = await apiClient.post<User>('/api/users', data);
    return response.data;
  },
} as const;
```

## Constants Organization

```typescript
// src/constants/routes.ts
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  USERS: '/users',
  USER_DETAIL: (id: string) => `/users/${id}`,
} as const;

// src/constants/config.ts
export const APP_CONFIG = {
  NAME: 'My App',
  VERSION: '1.0.0',
  API_TIMEOUT: 10000,
  ITEMS_PER_PAGE: 10,
} as const;
```

## Test Organization

### Co-located Tests

```
components/
├── UserCard.tsx
└── __tests__/
    └── UserCard.test.tsx

hooks/
├── useAuth.ts
└── __tests__/
    └── useAuth.test.ts
```

### Shared Test Utilities

```
test/
├── setup.ts              # Test setup and globals
├── utils.tsx            # Custom render, test utilities
└── mocks/
    ├── handlers.ts      # MSW handlers
    └── data.ts          # Mock data
```

## Documentation

### Component Documentation

```typescript
/**
 * Displays user information in a card format.
 * 
 * @example
 * ```tsx
 * <UserCard userId="123" onEdit={handleEdit} />
 * ```
 * 
 * @param userId - The unique identifier for the user
 * @param onEdit - Optional callback when edit button is clicked
 */
export function UserCard({ userId, onEdit }: UserCardProps) {
  // ...
}
```

### README Files

Add README.md files for complex directories:

```
services/
├── README.md           # Explains service layer architecture
├── userService.ts
└── authService.ts
```

## Best Practices

### ✅ Do This

- Keep files focused on a single responsibility
- Use meaningful, descriptive names
- Organize imports by category
- Co-locate related files
- Use path aliases for cleaner imports
- Document complex components and utilities
- Keep directory nesting shallow (max 3-4 levels)
- Use index files to simplify imports

### ❌ Don't Do This

- Create deeply nested directory structures
- Mix different concerns in one file
- Use generic names (utils.ts, helpers.ts)
- Import using relative paths for shared code
- Leave large files unsplit
- Use default exports excessively (prefer named exports)
- Mix test files with source files
- Add file extension in imports

## Barrel Exports (Index Files)

Use sparingly for cleaner imports:

```typescript
// src/components/ui/index.ts
export { Button } from './button';
export { Input } from './input';
export { Card } from './card';

// Usage
import { Button, Input, Card } from '@/components/ui';
```

⚠️ **Warning**: Barrel exports can impact tree-shaking and build performance. Use only for components that are frequently imported together.

## Resources

- [React File Structure Best Practices](https://react.dev/learn/thinking-in-react)
- [TypeScript Project Structure](https://www.typescriptlang.org/docs/handbook/project-references.html)