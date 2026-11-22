// Decides whether the screens use the light or dark theme.
// The choice is stored on <html data-theme="..."> and the CSS does the rest.

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'musicbingo-theme';

// The theme the host picked last time, if any.
function savedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null; // storage can be blocked; then we simply don't remember
  }
}

// The device's own setting (Windows, macOS, iPhone and Android all have one).
function deviceTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Which theme is showing right now.
export function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

// Switch theme and remember the choice.
export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // storage blocked: the theme still changes, it just won't be remembered
  }
}

// Run once when the app starts: saved choice first, otherwise the device setting.
export function initTheme(): void {
  document.documentElement.dataset.theme = savedTheme() ?? deviceTheme();
}