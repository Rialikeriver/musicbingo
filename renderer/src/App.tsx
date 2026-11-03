import { useEffect, useState } from 'react';
import PlayerCard from './screens/PlayerCard';
import HostCockpit from './screens/HostCockpit';
import AudienceScreen from './screens/AudienceScreen';

// Each screen has its own URL: #/player, #/host, #/audience.
// Later, Electron opens #/host on the laptop and #/audience on the TV,
// and phones load #/player from the QR code.
type Screen = 'player' | 'host' | 'audience';

function readScreen(): Screen {
  const s = window.location.hash.replace('#/', '');
  return s === 'host' || s === 'audience' ? s : 'player';
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(readScreen);

  useEffect(() => {
    const onHash = () => setScreen(readScreen());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <>
      {/* Dev-only switcher so we can flip between screens while building */}
      <nav className="dev-nav">
        <span>Dev preview:</span>
        {(['player', 'host', 'audience'] as Screen[]).map((s) => (
          <a key={s} href={`#/${s}`} className={screen === s ? 'active' : ''}>
            {s}
          </a>
        ))}
      </nav>

      {screen === 'player' && <PlayerCard />}
      {screen === 'host' && <HostCockpit />}
      {screen === 'audience' && <AudienceScreen />}
    </>
  );
}
