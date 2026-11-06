// Control Panel: where the host sets up media, branding and the TV screen.

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 0' }}>
      <span style={{ width: '180px', fontWeight: 'bold' }}>{label}</span>
      <span className="muted" style={{ flex: 1 }}>{value}</span>
      <button className="btn">Choose file…</button>
    </div>
  );
}

export function ControlPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2>Control Panel</h2>

      <section className="panel">
        <h3>Media</h3>
        <SettingRow label="Winner video" value="Not chosen" />
        <SettingRow label="Winner audio" value="Not chosen" />
        <SettingRow label="Background music" value="Not chosen" />
      </section>

      <section className="panel">
        <h3>Branding</h3>
        <SettingRow label="Venue logo" value="Not chosen" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 0' }}>
          <span style={{ width: '180px', fontWeight: 'bold' }}>Sponsor banners</span>
          <span className="muted" style={{ flex: 1 }}>No banners yet</span>
          <button className="btn">Add banner…</button>
        </div>
        <label style={{ padding: '6px 0' }}>
          <span style={{ display: 'inline-block', width: '180px', fontWeight: 'bold' }}>Seconds per banner</span>
          <input type="number" min={3} max={120} defaultValue={10} style={{ width: '80px' }} />
        </label>
      </section>

      <section className="panel">
        <h3>TV screen</h3>
        <label style={{ padding: '6px 0' }}>
          <span style={{ display: 'inline-block', width: '180px', fontWeight: 'bold' }}>Show on</span>
          <select defaultValue="auto">
            <option value="auto">Automatic (second screen if connected)</option>
          </select>
        </label>
        <label style={{ padding: '6px 0' }}>
          <input type="checkbox" defaultChecked /> Full screen
        </label>
      </section>
    </div>
  );
}