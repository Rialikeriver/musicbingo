import { useState } from 'react';
import { getTheme, setTheme, type Theme } from '../theme';

// A button that switches between the light and dark themes.
export default function ThemeToggle() {
  // Remember which theme is showing, so the button label stays correct
  const [theme, setThemeState] = useState<Theme>(getTheme);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);       // change the page (and remember it)
    setThemeState(next);  // update this button's label
  };

  const nextName = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      className="btn"
      onClick={toggle}
      title={`Switch to ${nextName} theme`}
      aria-label={`Switch to ${nextName} theme`}
    >
      {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}