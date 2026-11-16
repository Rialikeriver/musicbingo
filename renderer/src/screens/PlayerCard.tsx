import { useState, useMemo, useEffect } from 'react';
import { songs } from '../data/fakeData';
import { BingoEngine } from '../../../host/BingoEngine';
import type { WinningPattern } from '../../../host/BingoEngine';

interface PlayerCardProps {
  gridSize?: number;
  roundPattern?: WinningPattern | 'standard_line';
  customMask?: boolean[][];
  parsedM3UTracks?: string[]; // Ria's parsed "Artist-Title" strings
}

// Player's phone screen (opened from the QR code).
export default function PlayerCard({
  gridSize = 5,
  roundPattern = 'standard_line',
  customMask,
  parsedM3UTracks,
}: PlayerCardProps) {
  // Use Ria's parsed M3U tracks if provided, otherwise fall back to catalog songs
  const songPool = useMemo(() => {
    if (parsedM3UTracks && parsedM3UTracks.length > 0) {
      return BingoEngine.formatParsedM3UTracks(parsedM3UTracks);
    }
    return songs;
  }, [parsedM3UTracks]);

  // Generate X by X card via BingoEngine (places FREE in the middle for odd sizes)
  const generatedCard = useMemo(() => {
    return BingoEngine.generateCard('397', songPool, gridSize, 'song', false);
  }, [songPool, gridSize]);

  // Flatten the 2D grid into 1D arrays to match teammates' cell rendering
  const cells = useMemo(
    () => generatedCard.grid.flat().map((sq) => (sq.isFreeSpace ? 'FREE' : sq.displayValue)),
    [generatedCard]
  );

  const [marked, setMarked] = useState<boolean[]>(() => generatedCard.markedGrid.flat());
  const [resultMsg, setResultMsg] = useState<string>('Result message goes here');

  // Reset marks when gridSize or playlist changes
  useEffect(() => {
    setMarked(generatedCard.markedGrid.flat());
    setResultMsg('Result message goes here');
  }, [generatedCard]);

  const toggle = (i: number) => {
    if (cells[i] === 'FREE') return;
    setMarked((m) => m.map((v, j) => (j === i ? !v : v)));
  };

  const handleBingoClick = () => {
    // Convert flat marked array back into X by X 2D grid for BingoEngine validation
    const marked2D: boolean[][] = [];
    for (let r = 0; r < gridSize; r++) {
      marked2D.push(marked.slice(r * gridSize, (r + 1) * gridSize));
    }

    const result = BingoEngine.validateCardAgainstRoundPattern(
      marked2D,
      roundPattern,
      customMask
    );

    if (result.isWin) {
      setResultMsg(`🎉 BINGO! Valid ${result.winningPattern} pattern!`);
    } else {
      setResultMsg(`❌ Not a valid Bingo yet (${roundPattern})`);
    }
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
        <div className="muted">
          Card #{generatedCard.cardId} · {gridSize}×{gridSize} · Pattern: {roundPattern}
        </div>
      </header>

      <div
        className="card-grid"
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
      >
        {cells.map((title, i) => (
          <button
            key={i}
            type="button"
            className={`cell ${marked[i] ? 'marked' : ''} ${title === 'FREE' ? 'free' : ''}`}
            onClick={() => toggle(i)}
          >
            {title}
          </button>
        ))}
      </div>

      <button type="button" className="bingo-btn" onClick={handleBingoClick}>
        Bingo!
      </button>

      {/* Host's answer / validation result after a claim */}
      <div className="result-msg">{resultMsg}</div>
    </div>
  );
}