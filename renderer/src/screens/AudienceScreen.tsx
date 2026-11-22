import CardFlip from '../components/CardFlip';
import { useEffect, useState } from 'react';
import type { ControlPanelSettings } from '../../../host/index';
import { mediaUrl } from '../media';

// TV / projector screen. No host controls ever appear here.
// The mode buttons are dev-only, to preview each state.
type Mode = 'break' | 'song' | 'check' | 'win' | 'lose';

export default function AudienceScreen() {
  const [mode, setMode] = useState<Mode>('break');
  const [settings, setSettings] = useState<ControlPanelSettings | null>(null);
  const [bannerIndex, setBannerIndex] = useState(0);

  // Load the Control Panel settings, and update them live whenever the host changes something
  useEffect(() => {
    window.bingo?.getSettings().then(setSettings);
    return window.bingo?.onSettingsChanged(setSettings);
  }, []);

  const logo = settings?.branding.venueLogo ?? null;
  const banners = settings?.branding.sponsorBanners ?? [];
  const seconds = settings?.branding.bannerIntervalSeconds ?? 10;
  const bannerKey = banners.join('|'); // changes when a banner is added or removed

  // Show the next sponsor banner every few seconds
  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => {
      setBannerIndex((i) => (i + 1) % banners.length);
    }, seconds * 1000);
    return () => clearInterval(timer);
  }, [bannerKey, banners.length, seconds]);

  const currentBanner = banners.length > 0 ? banners[bannerIndex % banners.length] : null;

  // The check view stays on screen for all three modes, so switching
  // from "check" to "win" or "lose" plays the flip animation.
  const result = mode === 'win' ? 'winner' : mode === 'lose' ? 'no-bingo' : 'checking';
  const isChecking = mode === 'check' || mode === 'win' || mode === 'lose';

  return (
    <div className="audience">
      {import.meta.env.DEV && (
        <div className="dev-modes">
          {(['break', 'song', 'check', 'win', 'lose'] as Mode[]).map((m) => (
            <button key={m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>
              {m}
            </button>
          ))}
        </div>
      )}

      {mode === 'break' && (
        <div className="aud-break">
          <div className="logo-box" style={logo ? { border: 'none', position: 'relative', minHeight: 0 } : undefined}>
            {logo ? (
              <img src={mediaUrl(logo)} alt="Venue logo" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              'Venue / host logo image'
            )}
          </div>
          <div className="qr-box">
            <div className="qr-placeholder">QR</div>
            <p>Scan to get your bingo card!</p>
          </div>
          <div className="aud-status">2010's Bingo 2 · Next song soon</div>
          <div className="sponsor-strip" style={currentBanner ? { padding: 0, height: '160px', position: 'relative' } : undefined}>
            {currentBanner ? (
              <img src={mediaUrl(currentBanner)} alt="Sponsor banner" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              'Sponsor banner rotation'
            )}
          </div>
        </div>
      )}

      {mode === 'song' && (
        <div className="aud-song">
          <div className="title-bar">Ycaoekbr</div>
          <div className="video-box">Music video plays here</div>
        </div>
      )}

      {isChecking && (
        <div className="aud-check">
          <h1>Checking card #397…</h1>
          <CardFlip cardNumber={397} result={result} />
        </div>
      )}
    </div>
  );
}