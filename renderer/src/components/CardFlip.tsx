// A card that flips over to reveal the result of a bingo check.
// The parent screen decides the result; this component only shows it.

import { useEffect, useState } from 'react';

export type CheckResult = 'checking' | 'winner' | 'no-bingo';

interface CardFlipProps {
  cardNumber: number;
  result: CheckResult;
  lastFlipWait?: number; // how long the final flip takes, in seconds
  flipWait?: number;     // seconds between dings
  animated?: boolean; // if false, the flip is instant
}

export default function CardFlip({ cardNumber, result, lastFlipWait = 5, flipWait = 3, animated = true }: CardFlipProps) {
  const [revealed, setRevealed] = useState(false);
  const flipped = revealed;

  useEffect(() => {
    if (result === 'checking') {
      setRevealed(false);
      return;
    }
    if (!animated) {
      setRevealed(true);
      return;
    }
    const timer = setTimeout(() => {
      setRevealed(true);
    }, 3 *flipWait * 1000);
    return () => clearTimeout(timer);
  }, [result, animated, flipWait]);

  return (
    <div className="flip">
      <div className={`flip-inner ${flipped ? 'is-flipped' : ''}`} style={{ transitionDuration: `${animated ? lastFlipWait : 0}s` }}>
        {/* Front: shown while checking */}
        <div className="flip-face flip-front">
          <span className="flip-label">Card #{cardNumber}</span>
          <span className="flip-sub">Checking…</span>
        </div>

        {/* Back: revealed when flipped */}
        <div className={`flip-face flip-back ${result}`}>
          {result === 'winner' ? 'BINGO!' : 'No Bingo'}
        </div>
      </div>
    </div>
  );
}
