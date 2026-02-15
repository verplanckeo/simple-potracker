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

## Import Conventions

### File Extensions in Imports

**CRITICAL: Never include file extensions (.ts, .tsx, .js, .jsx) in import statements.**

```typescript
// ❌ Bad - includes file extension
import { Button } from './Button.tsx';
import { useAuth } from '@/hooks/useAuth.ts';
import { formatDate } from '../utils/formatDate.ts';

// ✅ Good - no file extension
import { Button } from './Button';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '../utils/formatDate';
```

**Rationale:**
- TypeScript and bundlers (Vite, Webpack) automatically resolve extensions
- Including extensions causes compilation errors unless `allowImportingTsExtensions` is enabled
- Keeps imports cleaner and more maintainable
- Follows standard JavaScript/TypeScript conventions

**Exception:** Only include extensions for:
- Non-JS/TS files: `import styles from './styles.css'`
- JSON files: `import data from './data.json'`
- Assets: `import logo from './logo.svg'`

### ESLint Configuration

Add this rule to your `.eslintrc.json` to automatically catch import extension errors:

```json
{
  "rules": {
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        "js": "never",
        "jsx": "never",
        "ts": "never",
        "tsx": "never"
      }
    ]
  }
}
```

You'll need the `eslint-plugin-import` package:
```bash
npm install --save-dev eslint-plugin-import
```

## TSConfig Settings

### Output Directory Configuration

**CRITICAL: Configure TypeScript to output compiled files to a separate directory, not alongside source files.**

```json
{
  "compilerOptions": {
    // Output configuration
    "outDir": "./dist",                    // All compiled JS goes here
    "rootDir": "./src",                    // Source files location
    "declarationDir": "./dist/types",      // .d.ts files location (optional)
    
    // Strict type checking
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "allowUnusedLabels": false,
    "exactOptionalPropertyTypes": true,
    
    // Import settings
    "allowImportingTsExtensions": false,   // Do NOT enable
    
    // Additional useful settings
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    
    // Source maps for debugging
    "sourceMap": true,
    "declaration": true,                   // Generate .d.ts files
    "declarationMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### .gitignore Configuration

Ensure compiled files are ignored:

```gitignore
# Compiled output
/dist
*.js
*.js.map
*.d.ts
*.d.ts.map

# But keep config files
!vite.config.ts
!tailwind.config.js
!postcss.config.js
!*.config.js

# Node modules
node_modules/
```

### Project Structure

With proper configuration, your project should look like:

```
frontend/
├── src/                 # Source TypeScript files
│   ├── components/
│   ├── hooks/
│   └── ...
├── dist/                # Compiled JavaScript (gitignored)
│   ├── components/
│   ├── hooks/
│   └── types/           # .d.ts files
├── node_modules/
├── tsconfig.json
└── package.json
```

**Note for Vite Projects:** If you're using Vite, it handles compilation automatically and you typically don't need to run `tsc` for building. Vite uses `esbuild` internally. However, you should still configure `outDir` for type checking:

```bash
# Type check only (no emit)
tsc --noEmit

# Or add to package.json
"scripts": {
  "type-check": "tsc --noEmit"
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

## Handling Optional Props with `exactOptionalPropertyTypes`

With `exactOptionalPropertyTypes: true` enabled (which we use for maximum type safety), optional props typed as `prop?: boolean` means:
- You can **omit** the prop entirely
- If you **provide** the prop, it must be a real `boolean` (not `undefined`)

This causes issues when passing variables that are `boolean | undefined`.

### The Problem

```typescript
// Component prop is typed as: disabled?: boolean
interface ButtonProps {
  disabled?: boolean;
}

// Your variable is: boolean | undefined
const disabled: boolean | undefined = someCondition ? true : undefined;

// ❌ TypeScript Error with exactOptionalPropertyTypes
<IconButton disabled={disabled} />
// Error: Type 'boolean | undefined' is not assignable to type 'boolean'
```

### Solutions

**✅ Fix 1: Coerce to boolean (Recommended)**
```typescript
// Use double-bang (!!) to convert to boolean
<IconButton disabled={!!disabled} />

// Or use Boolean()
<IconButton disabled={Boolean(disabled)} />

// For clarity with complex conditions
const isDisabled = Boolean(someCondition);
<IconButton disabled={isDisabled} />
```

**✅ Fix 2: Conditional rendering**
```typescript
// Only pass the prop when it's actually true
<IconButton {...(disabled && { disabled: true })} />

// Or with explicit condition
<IconButton {...(disabled ? { disabled: true } : {})} />
```

**✅ Fix 3: Default to false**
```typescript
// Provide a default value
<IconButton disabled={disabled ?? false} />
```

**❌ Don't do this:**
```typescript
// Bad - disables the safety check
<IconButton disabled={disabled as boolean} />

// Bad - turns off exactOptionalPropertyTypes
// (in tsconfig.json)
"exactOptionalPropertyTypes": false  // Don't do this!
```

### Common Scenarios

**With MUI Components:**
```typescript
// ❌ Bad
const disabled: boolean | undefined = !user;
<IconButton disabled={disabled} />

// ✅ Good
<IconButton disabled={!!disabled} />
// Or even better:
<IconButton disabled={!user} />
```

**With Conditional Props:**
```typescript
// ❌ Bad
const [isLoading, setIsLoading] = useState<boolean | undefined>();
<Button disabled={isLoading} />

// ✅ Good - Type state correctly
const [isLoading, setIsLoading] = useState<boolean>(false);
<Button disabled={isLoading} />

// ✅ Also good - Coerce if needed
<Button disabled={!!isLoading} />
```

**With Spread Props:**
```typescript
interface DraggableProps {
  listeners?: Record<string, Function>;
  attributes?: Record<string, any>;
}

// ❌ Bad - passes undefined
{...(!disabled ? listeners : {})}
{...(!disabled ? attributes : {})}

// ✅ Good - only spread when truthy
{...(disabled ? {} : listeners)}
{...(disabled ? {} : attributes)}

// ✅ Also good - explicit check
{...(listeners && !disabled ? listeners : {})}
```

### When to Use Each Fix

1. **Use `!!` coercion** - When the variable logically represents a boolean state
2. **Use conditional spreading** - When you want to omit the prop entirely
3. **Use `?? false`** - When false is the appropriate default

## Forbidden Patterns

❌ **Don't include file extensions in imports**
```typescript
// Bad
import { Button } from './Button.tsx';
import { useAuth } from '@/hooks/useAuth.ts';

// Good
import { Button } from './Button';
import { useAuth } from '@/hooks/useAuth';
```

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

❌ **Don't pass `boolean | undefined` to optional boolean props**
```typescript
// Bad
const disabled: boolean | undefined = condition;
<Button disabled={disabled} />

// Good
<Button disabled={!!disabled} />
// Or
<Button disabled={disabled ?? false} />
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