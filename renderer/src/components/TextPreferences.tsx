// Pop-up where the host changes how the song title looks on the TV

import { useState } from 'react';
import './TextPreferences.css';

// Fonts the host can pick. Inter and Outfit are bundled with the app (assets/fonts)
const FONTS = ['Inter', 'Outfit', 'Arial', 'Georgia', 'Impact'];

interface TextPreferencesProps {
  onClose: () => void; // runs when the host clicks Close
}

export default function TextPreferences({ onClose }: TextPreferencesProps) {
  // Each setting is its own piece of state. Defaults match the current TV title bar.
  const [fontSize, setFontSize] = useState(64);
  const [textColor, setTextColor] = useState('#ffffff');
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [fontFamily, setFontFamily] = useState('Inter');

  return (
    <div className="prefs-overlay">
      <div className="prefs-box">
        <h3>Text Preferences</h3>
         {/* Live preview: a mini copy of the TV title bar */}
        <div
          className="prefs-preview"
          style={{
            fontSize: `${fontSize}px`,
            color: textColor,
            backgroundColor: backgroundColor,
            fontFamily: `${fontFamily}, sans-serif`,
          }}
        >
          ycaoekbR
        </div>
        <label className="prefs-row">
          Font size: {fontSize}px
          <input
            type="range" min={24} max={120}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
          />
        </label>
        <label className="prefs-row">
          Text colour
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
          />
        </label>
        <label className="prefs-row">
          Background colour
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
          />
        </label>
        <label className="prefs-row">
          Font
          <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
            {FONTS.map((font) => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </label>
        <button className="btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}