// Control Panel: where the host sets up media, branding and the TV screen.
// Step 5: media, logo, banners, seconds per banner and full screen can all be changed and saved.
import { useEffect, useState } from 'react';
import type { ControlPanelSettings, MediaSettingKey, DisplayInfo } from '../../host/index';
import { fileName, mediaUrl } from './media';

// A small picture preview
function Thumbnail({ filePath }: { filePath: string }) {
  return (
    <img
      src={mediaUrl(filePath)}
      alt=""
      style={{ width: '96px', height: '54px', objectFit: 'contain', background: '#222', borderRadius: '4px' }}
    />
  );
}

// One row: a label, what is chosen now, and a button
// The button only works when onChoose is given (other rows get connected in Step 4)
function SettingRow({ label, value, onChoose, preview }: { label: string; value: string; onChoose?: () => void; preview?: string | null }) {
return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 0' }}>
      <span style={{ width: '180px', fontWeight: 'bold' }}>{label}</span>
        {preview && <Thumbnail filePath={preview} />}
      <span className="muted" style={{ flex: 1 }}>{value}</span>
      <button className="btn" onClick={onChoose} disabled={!onChoose}>Choose file…</button>
    </div>
  );
}

// A number box that saves when the host leaves it or presses Enter, with a red message if the number is wrong
function NumberSetting({ label, value, min, max, onSave }: {
  label: string; value: number; min: number; max: number; onSave: (n: number) => void;
}) {
  const [text, setText] = useState(String(value));
  const [error, setError] = useState('');

  const save = () => {
    const n = Number(text);
    if (!Number.isInteger(n) || n < min || n > max) {
      setError(`Enter a whole number from ${min} to ${max}`);
      return;
    }
    setError('');
    if (n !== value) onSave(n);
  };

  return (
    <label style={{ padding: '6px 0' }}>
      <span style={{ display: 'inline-block', width: '180px', fontWeight: 'bold' }}>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
        style={{ width: '80px' }}
      />
      {error && <span style={{ color: '#d32f2f', marginLeft: '12px' }}>{error}</span>}
    </label>
  );
}

export function ControlPanel() {
  const [settings, setSettings] = useState<ControlPanelSettings | null>(null);
  const [secondsText, setSecondsText] = useState(''); // what is typed in "Seconds per banner"
  const [secondsError, setSecondsError] = useState('');
  const [displays, setDisplays] = useState<DisplayInfo[]>([]); // connected screens

  // When the Control Panel opens, ask the app for the saved settings
  useEffect(() => {
    window.bingo?.getSettings().then((loaded) => {
      setSettings(loaded);
      setSecondsText(String(loaded.branding.bannerIntervalSeconds));
    });
  }, []);

  
  // Get the list of connected screens, and keep it up to date when a TV is plugged in or out
  useEffect(() => {
    window.bingo?.listDisplays().then(setDisplays);
    return window.bingo?.onDisplaysChanged(setDisplays);
  }, []);

  if (!window.bingo) {
    return <p>Open the Control Panel inside the Music Bingo app to see and change settings.</p>;
  }

  if (!settings) {
    return <p>Loading settings…</p>;
  }

  const banners = settings.branding.sponsorBanners;

    // Save "Seconds per banner" when the host leaves the box or presses Enter
  const saveSeconds = () => {
    const seconds = Number(secondsText);
    if (!Number.isInteger(seconds) || seconds < 3 || seconds > 120) {
      setSecondsError('Enter a whole number from 3 to 120');
      return;
    }
    setSecondsError('');
    window.bingo?.updateOptions({ bannerIntervalSeconds: seconds }).then(setSettings);
  };

  // Save "Full screen" as soon as it is ticked or unticked
  const saveFullscreen = (fullscreen: boolean) => {
    window.bingo?.updateOptions({ fullscreen }).then(setSettings);
  };

    // Choosing a screen in "Show on" ("auto" means automatic)
  const saveDisplay = (value: string) => {
    window.bingo?.updateOptions({ audienceDisplayId: value === 'auto' ? null : Number(value) }).then(setSettings);
  };

  const chosenId = settings.display.audienceDisplayId;
  const chosenMissing = chosenId !== null && !displays.some((d) => d.id === chosenId);

  // Open the file picker for one setting, then show the updated settings
  const choose = (key: MediaSettingKey) => {
    window.bingo?.chooseFile(key).then(setSettings);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2>Control Panel</h2>

      <section className="panel">
        <h3>Media</h3>
        <SettingRow label="Winner video" value={fileName(settings.media.winnerVideo)} onChoose={() => choose('winnerVideo')} />
        <SettingRow label="Winner audio" value={fileName(settings.media.winnerAudio)} onChoose={() => choose('winnerAudio')} />
        <SettingRow label="Background music" value={fileName(settings.media.backgroundMusic)} onChoose={() => choose('backgroundMusic')} />
      </section>

      <section className="panel">
        <h3>Branding</h3>
        <SettingRow label="Venue logo" value={fileName(settings.branding.venueLogo)} onChoose={() => choose('venueLogo')} preview={settings.branding.venueLogo} />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '6px 0' }}>
          <span style={{ width: '180px', fontWeight: 'bold' }}>Sponsor banners</span>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {banners.length === 0 ? (
              <span className="muted">No banners yet</span>
            ) : (
              banners.map((banner) => (
                <div key={banner} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Thumbnail filePath={banner} />
                  <span className="muted" style={{ flex: 1 }}>{fileName(banner)}</span>
                  <button className="btn" onClick={() => window.bingo?.removeBanner(banner).then(setSettings)}>
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
          <button className="btn" onClick={() => window.bingo?.addBanners().then(setSettings)}>Add banner…</button>
        </div>
        
        <label style={{ padding: '6px 0' }}>
          <span style={{ display: 'inline-block', width: '180px', fontWeight: 'bold' }}>Seconds per banner</span>
          <input
            type="number"
            min={3}
            max={120}
            value={secondsText}
            onChange={(e) => setSecondsText(e.target.value)}
            onBlur={saveSeconds}
            onKeyDown={(e) => { if (e.key === 'Enter') saveSeconds(); }}
            style={{ width: '80px' }}
          />
          {secondsError && <span style={{ color: '#d32f2f', marginLeft: '12px' }}>{secondsError}</span>}
        </label>
      </section>

      <section className="panel">
        <h3>Commercial</h3>
        <SettingRow
          label="Commercial image"
          value={fileName(settings.commercial.image)}
          onChoose={() => choose('commercialImage')}
          preview={settings.commercial.image}
        />
        <label style={{ padding: '6px 0' }}>
          <input
            type="checkbox"
            checked={settings.commercial.enabled}
            onChange={(e) => window.bingo?.updateOptions({ commercialEnabled: e.target.checked }).then(setSettings)}
          /> Show the commercial automatically
        </label>
        <NumberSetting
          label="Every (minutes)"
          value={settings.commercial.intervalMinutes}
          min={1}
          max={120}
          onSave={(n) => window.bingo?.updateOptions({ commercialIntervalMinutes: n }).then(setSettings)}
        />
        <NumberSetting
          label="On screen (seconds)"
          value={settings.commercial.durationSeconds}
          min={5}
          max={120}
          onSave={(n) => window.bingo?.updateOptions({ commercialDurationSeconds: n }).then(setSettings)}
        />
        <div style={{ padding: '6px 0' }}>
          <button className="btn" disabled={!settings.commercial.image} onClick={() => window.bingo?.showCommercialNow()}>
            Show now on TV
          </button>
        </div>
      </section>

      <section className="panel">
        <h3>TV screen</h3>
        <label style={{ padding: '6px 0' }}>
          <span style={{ display: 'inline-block', width: '180px', fontWeight: 'bold' }}>Show on</span>
          <select value={chosenId === null || chosenMissing ? 'auto' : String(chosenId)} onChange={(e) => saveDisplay(e.target.value)}>
            <option value="auto">Automatic (second screen if connected)</option>
            {displays.map((d) => (
              <option key={d.id} value={String(d.id)}>{d.label}</option>
            ))}
          </select>
          {chosenMissing && (
            <span style={{ color: '#d32f2f', marginLeft: '12px' }}>The chosen screen is not connected, so Automatic is used</span>
          )}
        </label>
        <label style={{ padding: '6px 0' }}>
          <input
            type="checkbox"
            checked={settings.display.fullscreen}
            onChange={(e) => saveFullscreen(e.target.checked)}
          /> Full screen (when a second screen is connected)
        </label>
      </section>
    </div>
  );
}