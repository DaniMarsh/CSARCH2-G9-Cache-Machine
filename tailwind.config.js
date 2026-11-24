/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        canvas: 'var(--bg-canvas)',
        surface: 'var(--bg-surface)',
        subtle: 'var(--bg-subtle)',
        hover: 'var(--bg-hover)',
        'border-subtle': 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
        'ink-primary': 'var(--ink-primary)',
        'ink-secondary': 'var(--ink-secondary)',
        'ink-muted': 'var(--ink-muted)',
        'accent-primary': 'var(--accent-primary)',
        'accent-soft': 'var(--accent-soft)',
        'status-hit': 'var(--status-hit)',
        'status-hit-bg': 'var(--status-hit-bg)',
        'status-hit-border': 'var(--status-hit-border)',
        'status-miss': 'var(--status-miss)',
        'status-miss-bg': 'var(--status-miss-bg)',
        'status-miss-border': 'var(--status-miss-border)',
        'status-evict': 'var(--status-evict)',
        'status-evict-bg': 'var(--status-evict-bg)',
        'status-evict-border': 'var(--status-evict-border)',
      },
      spacing: {
        'ds-1': 'var(--space-1)',
        'ds-2': 'var(--space-2)',
        'ds-3': 'var(--space-3)',
        'ds-4': 'var(--space-4)',
        'ds-5': 'var(--space-5)',
        'ds-6': 'var(--space-6)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(26, 24, 22, 0.04)',
      },
    },
  },
  plugins: [],
};
