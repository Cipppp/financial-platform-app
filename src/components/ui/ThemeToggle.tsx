'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md border border-border hover:bg-accent hover:shadow-lg hover:scale-105 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] active:scale-95"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-5 h-5">
        <Moon 
          className={`absolute inset-0 h-5 w-5 text-foreground transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            theme === 'light' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 rotate-180 scale-50'
          }`} 
        />
        <Sun 
          className={`absolute inset-0 h-5 w-5 text-foreground transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            theme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 rotate-180 scale-50'
          }`} 
        />
      </div>
    </button>
  );
};