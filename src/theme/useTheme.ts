import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Theme } from '../lib/database.types';

const STORAGE_KEY = 'titus_theme';

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

function readInitial(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  const prefers = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefers ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readInitial);

  useEffect(() => {
    applyTheme(theme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme]);

  const setTheme = async (next: Theme, persistToProfile = true) => {
    setThemeState(next);
    if (persistToProfile) {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await supabase.from('profiles').update({ theme: next }).eq('id', data.user.id);
      }
    }
  };

  const toggle = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return { theme, setTheme, toggle };
}
