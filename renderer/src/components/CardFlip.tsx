// A card that flips over to reveal the result of a bingo check.
// The parent screen decides the result; this component only shows it.

import { useEffect, useState } from 'react';

export type CheckResult = 'checking' | 'winner' | 'no-bingo';

interface CardFlipProps {
  cardNumber: number;
  result: CheckResult;
  lastFlipWait?: number;  // how long the final flip takes, in seconds
  flipWait?: number;      // seconds between dings
  animated?: boolean;     // if false, the flip is instant
}

function playDing(pitch: number = 880, delay: number = 0): void {
  const audio = new AudioContext();       // the sound system
  const tone = audio.createOscillator();  // makes the beep
  const volume = audio.createGain(); // controls the volume of the beep

  tone.type = 'sine';                     // a smooth, pure tone
  tone.frequency.value = pitch;             // pitch in Hz: 880 is a high bell-like note

  const now = audio.currentTime + delay;          // the sound system's clock, in seconds
  volume.gain.setValueAtTime(0.3, now);   // start at 30% volume
  volume.gain.exponentialRampToValueAtTime(0.001, now + 1); // fade out over 1 second

  tone.connect(volume);                   // cable: tone -> volume
  volume.connect(audio.destination);      // cable: volume knob -> speakers
  tone.start(now);                        // start the beep now
  tone.stop(now + 1);                     // stop after 1 second
  tone.onended = () => audio.close();     // free the sound system when done
}

export default function CardFlip({ cardNumber, result, lastFlipWait = 3, flipWait = 1, animated = true }: CardFlipProps) {
  const [revealed, setRevealed] = useState(false);
  const flipped = revealed && result !== 'checking'; // true if the card is flipped over to show the result


  useEffect(() => {

    if (result === 'checking') {
      setRevealed(false); // reset to unflipped when checking starts
      return;
    }

    if (!animated) {
      setRevealed(true); // immediately reveal the result if not animated
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = []; // store timers so we can clear them if the component unmounts or result changes
    for (let i = 0; i < 3; i++) {
      timers.push(setTimeout(playDing, i * flipWait * 1000)); // play a ding every flipWait seconds
    }
    timers.push(setTimeout(() => {setRevealed(true);}, 3 * flipWait * 1000)); // wait 3 dings before flipping
    
    return () => timers.forEach(clearTimeout); // clean up timers if the component unmounts or result changes
  }, [result, animated, flipWait]);

  return (
    <div className="flip">
      <div className={`flip-inner ${flipped ? 'is-flipped' : ''}`} style={{ transitionDuration: `${animated && result !== 'checking' ? lastFlipWait : 0}s` }}>
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
