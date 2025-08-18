import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme from localStorage immediately
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('theme') as Theme;
    if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
      document.documentElement.setAttribute('data-theme', storedTheme);
      document.body.className = storedTheme; // Also set body class for App.css compatibility
      return storedTheme;
    }
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.className = 'light'; // Also set body class for App.css compatibility
    return 'light';
  });

  // Load theme from localStorage on component mount (fallback) - only run once
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme;
    if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
      if (theme !== storedTheme) {
        setTheme(storedTheme);
        document.documentElement.setAttribute('data-theme', storedTheme);
        document.body.className = storedTheme; // Also set body class for App.css compatibility
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Update document attribute and localStorage when theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = theme; // Also set body class for App.css compatibility
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};