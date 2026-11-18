import { useState } from 'react';
import { rounds, songs } from '../data/fakeData';
import { CatalogManager } from '../CatalogManager';
import { ControlPanel } from '../ControlPanel';
import { PlaybackEngine } from '../../../host/PlaybackEngine';

// Choices for the Timers & Volume controls. Call and break are in seconds.
const CALL_OPTIONS = [
  { seconds: 30, label: '0:30' },
  { seconds: 45, label: '0:45' },
  { seconds: 55, label: '0:55' },
  { seconds: 60, label: '1:00' },
  { seconds: 75, label: '1:15' },
  { seconds: 90, label: '1:30' },
];
const BREAK_OPTIONS = [0, 2, 4, 6, 8, 10];
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

// Host's laptop screen: the "cockpit" from the legacy walkthrough.
export default function HostCockpit() {
  const callList = songs.slice(3);
  const called = songs.slice(0, 3);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<'timers' | 'bingo'>('timers');
  const [activeView, setActiveView] = useState<'dashboard' | 'catalog' | 'controlPanel'>('dashboard');
  // The playback engine holds the speed, durations and volume the songs will use.
  const [engine] = useState(() => new PlaybackEngine());
  const [callSeconds, setCallSeconds] = useState(engine.getCallDuration());
  const [breakSeconds, setBreakSeconds] = useState(engine.getBreakDuration());
  const [speed, setSpeed] = useState(engine.getPlaybackSpeed());
  const [volume, setVolume] = useState(engine.getVolume());
  const [randomStart, setRandomStart] = useState(false);
  const [fadeOut, setFadeOut] = useState(true);
  return (
    <div className="host">
      {/* Top bar */}
      <header className="host-top">
        <select defaultValue={rounds[1]}>
          {rounds.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <div className="host-actions">
          <button className="btn green">▶ Play</button>
          <button className="btn">⏸ Pause</button>
          <button className="btn">Next</button>
          <button className="btn">Reset Game</button>
          <button 
          className={`btn ${activeView === 'catalog' ? 'green' : ''}`} 
          onClick={() => setActiveView(activeView === 'catalog' ? 'dashboard' : 'catalog')}
        >
          {activeView === 'catalog' ? '← Back to Cockpit' : 'Create/Edit Catalog'}
        </button>
          <button className="btn">Text Preferences</button>
          <button
            className={`btn ${activeView === 'controlPanel' ? 'green' : ''}`}
            onClick={() => setActiveView(activeView === 'controlPanel' ? 'dashboard' : 'controlPanel')}
          >
            {activeView === 'controlPanel' ? '← Back to Cockpit' : 'Control Panel'}
          </button>
        </div>
      </header>

      {activeView === 'catalog' ? (
        <main style={{ padding: '16px', overflowY: 'auto' }}>
          <CatalogManager />
        </main>
      ) : activeView === 'controlPanel' ? (
        <main style={{ padding: '16px', overflowY: 'auto', gridRow: '2 / 4' }}>
          <ControlPanel />
        </main>
      ) : (
        <>
          {/* Middle: call list + called items */}
          <main className="host-lists">
            <section className="panel">
              <h2>Call List {callList.length}</h2>
              <ul className="song-list">
                {callList.map((s) => (
                  <li
                    key={s.id}
                    className={`song-row ${selected === s.id ? 'selected' : ''}`}
                    onClick={() => setSelected(s.id)}
                  >
                    <div>
                      <div className="song-title">
                        - {s.artist}
                        {s.title}
                      </div>
                      <div className="song-meta">
                        Start {s.startTime} · Duration {s.duration}
                      </div>
                    </div>
                    {/* Move buttons only show for the selected song */}
                    {selected === s.id && (
                      <div className="move-btns">
                        <button title="Move up">↑</button>
                        <button title="Move down">↓</button>
                        <button title="Move to top" className="red">⤒</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2>Called Items {called.length}</h2>
                <span className="muted">Sort: A-Z / Played</span>
              </div>
              <ul className="song-list">
                {called.map((s) => (
                  <li key={s.id} className="song-row called">
                    <div>
                      <div className="song-title">
                        - {s.artist}
                        {s.title}
                      </div>
                      <div className="song-meta">Played</div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </main>

          {/* Bottom: tabs + audience preview */}
          <footer className="host-bottom">
            <section className="panel">
              <div className="tabs">
                <button className={tab === 'timers' ? 'active' : ''} onClick={() => setTab('timers')}>
                  Timers & Volume
                </button>
                <button className={tab === 'bingo' ? 'active' : ''} onClick={() => setTab('bingo')}>
                  Bingo Tool
                </button>
              </div>

              {tab === 'timers' ? (
                <div className="form-grid">
                  <label>
                    Call duration{' '}
                    <select
                      value={callSeconds}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setCallSeconds(value);
                        engine.setCallDuration(value);
                      }}
                    >
                      {CALL_OPTIONS.map((o) => (
                        <option key={o.seconds} value={o.seconds}>{o.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Break duration{' '}
                    <select
                      value={breakSeconds}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setBreakSeconds(value);
                        engine.setBreakDuration(value);
                      }}
                    >
                      {BREAK_OPTIONS.map((sec) => (
                        <option key={sec} value={sec}>{sec} s</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Play speed{' '}
                    <select
                      value={speed}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setSpeed(value);
                        engine.setSpeed(value);
                      }}
                    >
                      {SPEED_OPTIONS.map((x) => (
                        <option key={x} value={x}>{x.toFixed(2)}x</option>
                      ))}
                    </select>
                  </label>
                  <div className="readouts">
                    <span>Call 0:08</span><span>Break 0</span><span>Time 0:46</span>
                  </div>
                  <label>
                    <input type="checkbox" checked={randomStart} onChange={(e) => setRandomStart(e.target.checked)} />
                    {' '}Randomize start time
                  </label>
                  <label>
                    <input type="checkbox" checked={fadeOut} onChange={(e) => setFadeOut(e.target.checked)} />
                    {' '}Volume fade out
                  </label>
                  <label className="wide">
                    Volume{' '}
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volume}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setVolume(value);
                        engine.setVolume(value);
                      }}
                    />
                  </label>
                </div>
              ) : (
                <div className="form-grid">
                  <div className="wide">
                    <strong>Incoming claims</strong>
                    <div className="claim">Card #397: waiting to check…</div>
                  </div>
                  <button className="btn">Define Bingo pattern</button>
                  <label><input type="checkbox" /> Show pattern on audience screen</label>
                  <label><input type="checkbox" defaultChecked /> Free space</label>
                  <div className="wide big-btns">
                    <button className="btn green big">We Have A Bingo!</button>
                    <button className="btn red big">No Bingo</button>
                  </div>
                </div>
              )}
            </section>

            <section className="panel">
              <h2>Audience preview</h2>
              <div className="preview-box">Ycaoekbr</div>
            </section>
          </footer>
        </>
      )}
    </div>
  );
}