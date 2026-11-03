import { useState } from 'react';
import { songs } from '../data/fakeData';

// Player's phone screen (opened from the QR code).
export default function PlayerCard() {
  // 25 squares: 24 songs with "FREE" in the middle (index 12)
  const titles = songs.slice(0, 24).map((s) => s.title);
  const cells = [...titles.slice(0, 12), 'FREE', ...titles.slice(12)];
  const [marked, setMarked] = useState<boolean[]>(cells.map((c) => c === 'FREE'));

  const toggle = (i: number) => {
    if (cells[i] === 'FREE') return;
    setMarked((m) => m.map((v, j) => (j === i ? !v : v)));
  };

  return (
    <div className="player">
      <div className="sponsor-banner">Sponsor banner: $5 wings tonight!</div>

      <header className="player-header">
        <h1>Music Bingo</h1>
        <div className="round-status">
          <span>2010's Bingo 2</span>
          <span className="pill playing">Playing</span>
        </div>
        <div className="muted">Card #397 · Pattern: Line</div>
      </header>

      <div className="card-grid">
        {cells.map((title, i) => (
          <button
            key={i}
            className={`cell ${marked[i] ? 'marked' : ''} ${title === 'FREE' ? 'free' : ''}`}
            onClick={() => toggle(i)}
          >
            {title}
          </button>
        ))}
      </div>

      <button className="bingo-btn">Bingo!</button>

      {/* Placeholder for the host's answer after a claim */}
      <div className="result-msg">Result message goes here</div>
    </div>
  );
}
