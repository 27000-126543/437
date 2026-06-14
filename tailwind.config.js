/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'deep-space': '#0B1E3F',
        'mid-space': '#1A2744',
        'surface': '#2A3A5C',
        'tech-cyan': '#00D4FF',
        'data-green': '#00FF88',
        'alert-orange': '#FF6B35',
        'alert-red': '#FF3B5C',
        'neut-1': '#6B7A99',
        'neut-2': '#C8D1E0',
      },
      fontFamily: {
        display: ['"Space Grotesk"', '"JetBrains Mono"', 'monospace'],
        mono: ['"JetBrains Mono"', 'monospace'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'scan-line': 'scan-line 3s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(0, 212, 255, 0.3)' },
          '50%': { boxShadow: '0 0 24px rgba(0, 212, 255, 0.7)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 16px rgba(0, 212, 255, 0.4)',
        'glow-green': '0 0 16px rgba(0, 255, 136, 0.4)',
        'glow-orange': '0 0 16px rgba(255, 107, 53, 0.5)',
        'inner-glow': 'inset 0 0 30px rgba(0, 212, 255, 0.05)',
      },
    },
  },
  plugins: [],
};
