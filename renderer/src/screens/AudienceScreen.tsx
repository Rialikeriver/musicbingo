import { useState } from 'react';

// TV / projector screen. No host controls ever appear here.
// The mode buttons are dev-only, to preview each state.
type Mode = 'break' | 'song' | 'check';

export default function AudienceScreen() {
  const [mode, setMode] = useState<Mode>('break');

  return (
    <div className="audience">
      <div className="dev-modes">
        {(['break', 'song', 'check'] as Mode[]).map((m) => (
          <button key={m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>
            {m}
          </button>
        ))}
      </div>

      {mode === 'break' && (
        <div className="aud-break">
          <div className="logo-box">Venue / host logo image</div>
          <div className="qr-box">
            <div className="qr-placeholder">QR</div>
            <p>Scan to get your bingo card!</p>
          </div>
          <div className="aud-status">2010's Bingo 2 · Next song soon</div>
          <div className="sponsor-strip">Sponsor banner rotation</div>
        </div>
      )}

      {mode === 'song' && (
        <div className="aud-song">
          <div className="title-bar">Ycaoekbr</div>
          <div className="video-box">Music video plays here</div>
        </div>
      )}

      {mode === 'check' && (
        <div className="aud-check">
          <h1>Checking card #397…</h1>
          <div className="flip-card">Card-check animation</div>
        </div>
      )}
    </div>
  );
}
