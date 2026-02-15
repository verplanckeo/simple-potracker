# React Patterns & Best Practices

## Core Principles

1. **Functional Components**: Use functional components with hooks exclusively
2. **Single Responsibility**: Each component should do one thing well
3. **Composition over Inheritance**: Build complex UIs by composing simple components
4. **Declarative Code**: Write code that describes what you want, not how to do it

## Component Structure

### File Organization

```
components/
├── ui/              # Reusable UI primitives (Button, Input, Card)
├── common/          # Shared business components
├── forms/           # Form-related components
└── layouts/         # Layout components
```

### Component Template

```typescript
// src/components/UserCard.tsx
import { FC } from 'react';

interface UserCardProps {
  userId: string;
  onEdit?: (userId: string) => void;
}

/**
 * Displays user information in a card format.
 * 
 * @param userId - The unique identifier for the user
 * @param onEdit - Optional callback when edit button is clicked
 */
export const UserCard: FC<UserCardProps> = ({ userId, onEdit }) => {
  // 1. Hooks
  const user = useUser(userId);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 2. Derived state
  const displayName = user?.name ?? 'Unknown User';
  
  // 3. Event handlers
  const handleEdit = () => {
    onEdit?.(userId);
  };
  
  // 4. Early returns
  if (!user) {
    return <UserCardSkeleton />;
  }
  
  // 5. Render
  return (
    <div className="user-card">
      <h3>{displayName}</h3>
      {onEdit && (
        <button onClick={handleEdit}>Edit</button>
      )}
    </div>
  );
};
```

## Hooks Best Practices

### Custom Hooks

```typescript
// src/hooks/useUser.ts
import { useState, useEffect } from 'react';
import type { User } from '@/types';

/**
 * Fetches and manages user data.
 * 
 * @param userId - The ID of the user to fetch
 * @returns Loading state, user data, and error if any
 */
export function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let cancelled = false;
    
    async function fetchUser() {
      try {
        setIsLoading(true);
        const response = await userService.getUser(userId);
        if (!cancelled) {
          setUser(response.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    
    fetchUser();
    
    return () => {
      cancelled = true;
    };
  }, [userId]);
  
  return { user, isLoading, error };
}
```

### Hook Naming

- Always prefix with `use`: `useUser`, `useLocalStorage`
- Be specific: `useUserAuthentication` not `useAuth`
- Return objects for multiple values: `{ data, error, isLoading }`

### Common Patterns

```typescript
// 1. useCallback for event handlers passed to children
const handleSubmit = useCallback((values: FormValues) => {
  submitForm(values);
}, [submitForm]);

// 2. useMemo for expensive computations
const sortedUsers = useMemo(
  () => users.sort((a, b) => a.name.localeCompare(b.name)),
  [users]
);

// 3. useRef for DOM elements and mutable values
const inputRef = useRef<HTMLInputElement>(null);
const renderCount = useRef(0);

// 4. useEffect cleanup for subscriptions
useEffect(() => {
  const subscription = eventBus.subscribe('user-updated', handleUpdate);
  return () => subscription.unsubscribe();
}, [handleUpdate]);
```

## State Management

### Local State

```typescript
// Simple state
const [count, setCount] = useState(0);

// Object state - use functional updates
const [user, setUser] = useState<User | null>(null);

const updateEmail = (email: string) => {
  setUser(prev => prev ? { ...prev, email } : null);
};
```

### Context API

```typescript
// src/context/AuthContext.tsx
import { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  const login = async (credentials: Credentials) => {
    const user = await authService.login(credentials);
    setUser(user);
  };
  
  const logout = () => {
    authService.logout();
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

## Performance Optimization

### React.memo

```typescript
// Only re-render when props actually change
export const UserCard = memo<UserCardProps>(({ user, onEdit }) => {
  return (
    <div>
      <h3>{user.name}</h3>
      <button onClick={() => onEdit(user.id)}>Edit</button>
    </div>
  );
});
```

### Code Splitting

```typescript
// Lazy load routes
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

## Component Composition Patterns

### Compound Components

```typescript
// Card.tsx
interface CardProps {
  children: ReactNode;
}

export function Card({ children }: CardProps) {
  return <div className="card">{children}</div>;
}

Card.Header = function CardHeader({ children }: CardProps) {
  return <div className="card-header">{children}</div>;
};

Card.Body = function CardBody({ children }: CardProps) {
  return <div className="card-body">{children}</div>;
};

Card.Footer = function CardFooter({ children }: CardProps) {
  return <div className="card-footer">{children}</div>;
};

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>
```

### Render Props

```typescript
interface DataFetcherProps<T> {
  url: string;
  children: (data: T | null, loading: boolean, error: Error | null) => ReactNode;
}

function DataFetcher<T>({ url, children }: DataFetcherProps<T>) {
  const { data, loading, error } = useFetch<T>(url);
  return <>{children(data, loading, error)}</>;
}

// Usage
<DataFetcher<User> url="/api/user/123">
  {(user, loading, error) => {
    if (loading) return <Spinner />;
    if (error) return <Error message={error.message} />;
    return <UserProfile user={user} />;
  }}
</DataFetcher>
```

## Error Boundaries

```typescript
// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <div>Something went wrong</div>;
    }
    
    return this.props.children;
  }
}
```

## Accessibility

```typescript
// Always include ARIA labels and semantic HTML
function SearchInput() {
  return (
    <label htmlFor="search">
      Search
      <input
        id="search"
        type="search"
        aria-label="Search users"
        placeholder="Enter name..."
      />
    </label>
  );
}

// Use semantic HTML
function Navigation() {
  return (
    <nav aria-label="Main navigation">
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
      </ul>
    </nav>
  );
}

// Keyboard navigation
function Dialog({ isOpen, onClose }: DialogProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);
  
  return isOpen ? (
    <div role="dialog" aria-modal="true">
      {/* Content */}
    </div>
  ) : null;
}
```

## Don't Do This

❌ **Mutating state directly**
```typescript
// Bad
user.name = 'New Name';
setUser(user);

// Good
setUser({ ...user, name: 'New Name' });
```

❌ **Using index as key**
```typescript
// Bad
{items.map((item, index) => <Item key={index} {...item} />)}

// Good
{items.map(item => <Item key={item.id} {...item} />)}
```

❌ **Conditional hooks**
```typescript
// Bad
if (isLoggedIn) {
  const user = useUser();
}

// Good
const user = useUser();
if (isLoggedIn && user) {
  // Use user
}
```

## Resources

- [React Documentation](https://react.dev)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Patterns.dev](https://www.patterns.dev/)