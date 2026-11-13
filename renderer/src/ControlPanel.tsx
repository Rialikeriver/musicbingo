// Control Panel: where the host sets up media, branding and the TV screen.
// Step 3: the venue logo can be chosen. The other buttons get connected in Step 4.
import { useEffect, useState } from 'react';
import type { ControlPanelSettings, MediaSettingKey } from '../../host/index';

// Show just the file name from a full path, or "Not chosen"
function fileName(filePath: string | null): string {
  if (!filePath) return 'Not chosen';
  return filePath.split(/[\\/]/).pop() ?? filePath;
}

// One row: a label, what is chosen now, and a button
// The button only works when onChoose is given (other rows get connected in Step 4)
function SettingRow({ label, value, onChoose }: { label: string; value: string; onChoose?: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 0' }}>
      <span style={{ width: '180px', fontWeight: 'bold' }}>{label}</span>
      <span className="muted" style={{ flex: 1 }}>{value}</span>
      <button className="btn" onClick={onChoose} disabled={!onChoose}>Choose file…</button>
    </div>
  );
}

export function ControlPanel() {
  const [settings, setSettings] = useState<ControlPanelSettings | null>(null);

  // When the Control Panel opens, ask the app for the saved settings
  useEffect(() => {
    window.bingo?.getSettings().then(setSettings);
  }, []);

  if (!window.bingo) {
    return <p>Open the Control Panel inside the Music Bingo app to see and change settings.</p>;
  }

  if (!settings) {
    return <p>Loading settings…</p>;
  }

  const banners = settings.branding.sponsorBanners;

  // Open the file picker for one setting, then show the updated settings
  const choose = (key: MediaSettingKey) => {
    window.bingo?.chooseFile(key).then(setSettings);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2>Control Panel</h2>

      <section className="panel">
        <h3>Media</h3>
        <SettingRow label="Winner video" value={fileName(settings.media.winnerVideo)} />
        <SettingRow label="Winner audio" value={fileName(settings.media.winnerAudio)} />
        <SettingRow label="Background music" value={fileName(settings.media.backgroundMusic)} />
      </section>

      <section className="panel">
        <h3>Branding</h3>
        <SettingRow label="Venue logo" value={fileName(settings.branding.venueLogo)} onChoose={() => choose('venueLogo')} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 0' }}>
          <span style={{ width: '180px', fontWeight: 'bold' }}>Sponsor banners</span>
          <span className="muted" style={{ flex: 1 }}>
            {banners.length === 0 ? 'No banners yet' : banners.map(fileName).join(', ')}
          </span>
          <button className="btn" disabled>Add banner…</button>
        </div>
        <label style={{ padding: '6px 0' }}>
          <span style={{ display: 'inline-block', width: '180px', fontWeight: 'bold' }}>Seconds per banner</span>
          <input type="number" min={3} max={120} value={settings.branding.bannerIntervalSeconds} readOnly style={{ width: '80px' }} />
        </label>
      </section>

      <section className="panel">
        <h3>TV screen</h3>
        <label style={{ padding: '6px 0' }}>
          <span style={{ display: 'inline-block', width: '180px', fontWeight: 'bold' }}>Show on</span>
          <select value="auto" disabled>
            <option value="auto">Automatic (second screen if connected)</option>
          </select>
        </label>
        <label style={{ padding: '6px 0' }}>
          <input type="checkbox" checked={settings.display.fullscreen} readOnly /> Full screen
        </label>
      </section>
    </div>
  );
}