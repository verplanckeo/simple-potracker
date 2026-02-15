# TypeScript Standards

## Core Principles

1. **Strict Type Safety**: Always use TypeScript's strict mode
2. **No `any` Types**: Avoid `any` - use `unknown` if type is truly unknown
3. **Explicit Return Types**: Always specify return types for functions
4. **Interface over Type**: Prefer `interface` for object shapes, `type` for unions/intersections

## Type Definitions

### Naming Conventions

```typescript
// Interfaces - PascalCase with descriptive names
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

// Types - PascalCase
type UserId = string;
type UserRole = 'admin' | 'user' | 'guest';

// Generics - Single letter or PascalCase
type ApiResponse<T> = {
  data: T;
  status: number;
  message: string;
};
```

### File Organization

- Place shared types in `src/types/`
- Co-locate component-specific types with components
- Export types from `src/types/index.ts` for easy importing

```typescript
// src/types/index.ts
export type { User, UserProfile } from './user';
export type { ApiResponse, ApiError } from './api';
```

## Best Practices

### 1. Use Discriminated Unions for State

```typescript
type LoadingState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };
```

### 2. Utility Types

Use built-in TypeScript utility types:

```typescript
// Make all properties optional
type PartialUser = Partial<User>;

// Make all properties required
type RequiredUser = Required<User>;

// Pick specific properties
type UserPreview = Pick<User, 'id' | 'name'>;

// Omit specific properties
type UserWithoutEmail = Omit<User, 'email'>;
```

### 3. Const Assertions

```typescript
const ROUTES = {
  HOME: '/',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

type Route = typeof ROUTES[keyof typeof ROUTES];
```

### 4. Type Guards

```typescript
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj
  );
}
```

## TSConfig Settings

Ensure these settings in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "allowUnusedLabels": false,
    "exactOptionalPropertyTypes": true
  }
}
```

## Common Patterns

### API Response Typing

```typescript
// src/types/api.ts
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string[]>;
}

// Usage
async function fetchUser(id: string): Promise<ApiResponse<User>> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}
```

### Props Typing

```typescript
// Prefer interface for props
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}

// With generics for flexible components
interface SelectProps<T> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
}
```

## Forbidden Patterns

❌ **Don't use `any`**
```typescript
// Bad
function processData(data: any) { }

// Good
function processData(data: unknown) {
  if (isValidData(data)) {
    // Now TypeScript knows the type
  }
}
```

❌ **Don't use type assertions without validation**
```typescript
// Bad
const user = data as User;

// Good
if (isUser(data)) {
  const user = data; // TypeScript infers User type
}
```

❌ **Don't ignore TypeScript errors**
```typescript
// Bad
// @ts-ignore
const result = somethingBroken();

// Good - Fix the underlying issue
```

## References

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)