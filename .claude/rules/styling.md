# Styling Guide

## Styling Philosophy

1. **Utility-First**: Use Tailwind CSS for rapid development
2. **Component Library**: Use shadcn/ui for consistent, accessible components
3. **Responsive Design**: Mobile-first approach
4. **Accessibility**: WCAG 2.1 Level AA compliance
5. **Performance**: Minimize CSS bundle size

## Tech Stack

- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Re-usable components built with Radix UI
- **CSS Variables**: For theming
- **PostCSS**: For CSS processing

## Setup

### Tailwind Configuration

```typescript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/forms'),
  ],
};
```

### CSS Variables (Theme)

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

## Component Styling

### shadcn/ui Components

Install components as needed:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dialog
```

### Custom Component Styling

```typescript
// src/components/Card.tsx
import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'outlined' | 'elevated';
}

export function Card({ 
  children, 
  className,
  variant = 'default' 
}: CardProps) {
  return (
    <div
      className={cn(
        // Base styles
        'rounded-lg p-6',
        // Variant styles
        {
          'bg-card text-card-foreground shadow-sm': variant === 'default',
          'border-2 border-border': variant === 'outlined',
          'bg-card shadow-lg': variant === 'elevated',
        },
        // Custom className last (for overrides)
        className
      )}
    >
      {children}
    </div>
  );
}
```

### Utility Function for Class Names

```typescript
// src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Responsive Design

### Breakpoints

```typescript
// Tailwind breakpoints (mobile-first)
// sm: 640px   - Small devices
// md: 768px   - Medium devices (tablets)
// lg: 1024px  - Large devices (desktops)
// xl: 1280px  - Extra large devices
// 2xl: 1536px - 2X large devices
```

### Mobile-First Example

```typescript
export function ResponsiveGrid() {
  return (
    <div className="
      grid 
      grid-cols-1           /* Mobile: 1 column */
      gap-4
      sm:grid-cols-2        /* Small screens: 2 columns */
      md:grid-cols-3        /* Medium screens: 3 columns */
      lg:grid-cols-4        /* Large screens: 4 columns */
      xl:gap-6              /* Extra large: bigger gaps */
    ">
      {/* Grid items */}
    </div>
  );
}
```

### Container Queries (when needed)

```typescript
export function AdaptiveCard() {
  return (
    <div className="@container">
      <div className="
        flex flex-col
        @lg:flex-row      /* Horizontal layout in large containers */
        gap-4
      ">
        {/* Content */}
      </div>
    </div>
  );
}
```

## Layout Patterns

### Page Layout

```typescript
// src/components/layouts/PageLayout.tsx
import { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export function PageLayout({ 
  children, 
  title, 
  description,
  actions 
}: PageLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {(title || description || actions) && (
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {title && (
              <h1 className="text-3xl font-bold tracking-tight">
                {title}
              </h1>
            )}
            {actions && <div className="flex gap-2">{actions}</div>}
          </div>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </header>
      )}
      <main>{children}</main>
    </div>
  );
}
```

### Sidebar Layout

```typescript
export function SidebarLayout({ 
  sidebar, 
  children 
}: { 
  sidebar: ReactNode; 
  children: ReactNode; 
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="
        w-64 
        border-r 
        bg-card 
        hidden 
        lg:block          /* Hide on mobile, show on large screens */
        sticky 
        top-0 
        h-screen
        overflow-y-auto
      ">
        {sidebar}
      </aside>
      
      {/* Main content */}
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
```

## Common Patterns

### Loading Skeleton

```typescript
export function CardSkeleton() {
  return (
    <div className="rounded-lg border p-6 space-y-4 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-1/2" />
      <div className="h-20 bg-muted rounded" />
    </div>
  );
}
```

### Focus States

```typescript
export function FocusableCard() {
  return (
    <div className="
      rounded-lg 
      border 
      p-6
      focus-within:ring-2 
      focus-within:ring-ring 
      focus-within:ring-offset-2
      transition-shadow
    ">
      {/* Content */}
    </div>
  );
}
```

### Hover Effects

```typescript
export function InteractiveCard() {
  return (
    <div className="
      rounded-lg 
      border 
      p-6
      transition-all
      hover:shadow-lg
      hover:scale-[1.02]
      cursor-pointer
      active:scale-[0.98]
    ">
      {/* Content */}
    </div>
  );
}
```

## Accessibility

### Color Contrast

Always ensure sufficient contrast:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

```typescript
// Good contrast examples
<button className="bg-primary text-primary-foreground">
  Click me
</button>

<div className="bg-muted text-muted-foreground">
  Muted text with proper contrast
</div>
```

### Focus Indicators

```typescript
// Always provide visible focus indicators
export function AccessibleButton() {
  return (
    <button className="
      px-4 
      py-2 
      rounded-md
      focus:outline-none 
      focus:ring-2 
      focus:ring-ring 
      focus:ring-offset-2
    ">
      Accessible Button
    </button>
  );
}
```

### Screen Reader Support

```typescript
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return (
    <span className="
      absolute 
      w-px 
      h-px 
      p-0 
      -m-px 
      overflow-hidden 
      whitespace-nowrap 
      border-0
    ">
      {children}
    </span>
  );
}
```

## Dark Mode

```typescript
// src/components/ThemeProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({ theme: 'system', setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

## Performance

### Avoid Arbitrary Values

```typescript
// ❌ Bad - arbitrary values increase bundle size
<div className="w-[127px] h-[283px]" />

// ✅ Good - use Tailwind's scale
<div className="w-32 h-72" />
```

### Purge Unused CSS

Tailwind automatically removes unused styles in production.
Ensure your `content` config includes all files:

```javascript
// tailwind.config.js
content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}',
],
```

## Best Practices

### ✅ Do This

- Use semantic color tokens (`bg-primary`, not `bg-blue-500`)
- Follow mobile-first responsive design
- Provide focus indicators for all interactive elements
- Use `cn()` utility for conditional classes
- Keep component-specific styles in the component file
- Use CSS variables for theming
- Test with keyboard navigation
- Check color contrast ratios

### ❌ Don't Do This

- Use inline styles (except for dynamic values)
- Use arbitrary values excessively
- Hardcode colors (use theme variables)
- Ignore mobile viewports
- Remove focus outlines without replacement
- Use `!important` (use proper specificity)

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)