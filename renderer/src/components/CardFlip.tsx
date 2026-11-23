// A card that flips over to reveal the result of a bingo check.
// The parent screen decides the result; this component only shows it.

export type CheckResult = 'checking' | 'winner' | 'no-bingo';

interface CardFlipProps {
  cardNumber: number;
  result: CheckResult;
}

export default function CardFlip({ cardNumber, result }: CardFlipProps) {
  const flipped = result !== 'checking';

  return (
    <div className="flip">
      <div className={`flip-inner ${flipped ? 'is-flipped' : ''}`}>
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
