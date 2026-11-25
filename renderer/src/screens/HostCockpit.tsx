import { useEffect, useRef, useState } from 'react';
import type { Track } from '../../../host/index';
import { rounds, songs } from '../data/fakeData';
import { CatalogManager } from '../CatalogManager';
import { ControlPanel } from '../ControlPanel';
import ThemeToggle from '../components/ThemeToggle';
import { BingoEngine } from '../../../host/BingoEngine';
import type { WinningPattern } from '../../../host/BingoEngine';
import { PlaybackEngine } from '../../../host/PlaybackEngine';
import { webCatalogApi } from '../webCatalogStore';

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
  // The engine plays catalog songs; trackLookup lets it find each song's file.
  const [catalogTracks, setCatalogTracks] = useState<Track[]>([]);
  const trackLookup = useRef(new Map<string, Track>());
  const [engine] = useState(() => new PlaybackEngine({
    getAddress: (id) => trackLookup.current.get(id)?.filePath,
    getTrack: (id) => trackLookup.current.get(id),
  }));
  const audioRef = useRef<HTMLAudioElement>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'catalog' | 'controlPanel'>('dashboard');
  useEffect(() => {
    if (activeView !== 'dashboard') return;
    const catalog = window.catalogApi ?? webCatalogApi;
    catalog.list()
      .then((saved) => {
        trackLookup.current = new Map(saved.map((t) => [t.id, t]));
        setCatalogTracks(saved);
      })
      .catch(() => {});
  }, [activeView]);
  // Saved catalog songs make up the call list when there are any; otherwise the sample songs show.
  const callList = catalogTracks.length > 0 ? catalogTracks : songs.slice(3);
  const called = songs.slice(0, 3);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<'timers' | 'bingo'>('timers');
  // Grid size & Pattern dialog state
  const [gridSize, setGridSize] = useState<number>(5);
  const [isPatternOpen, setIsPatternOpen] = useState(false);
  const [pattern, setPattern] = useState<WinningPattern>('horizontal');
  const [customGrid, setCustomGrid] = useState<boolean[][]>(() => BingoEngine.createEmptyCustomGrid(5));

  const handleGridSizeChange = (newSize: number) => {
    setGridSize(newSize);
    setCustomGrid(BingoEngine.createEmptyCustomGrid(newSize));
  };

  const activeMask = pattern === 'custom'
    ? customGrid
    : BingoEngine.generatePatternMask(pattern, gridSize);

  const centerIndex = Math.floor(gridSize / 2);

  const handleCellClick = (r: number, c: number) => {
    if (gridSize % 2 !== 0 && r === centerIndex && c === centerIndex) return;
    if (pattern === 'custom') {
      setCustomGrid(BingoEngine.toggleCustomGridCell(customGrid, r, c));
    }
  };

  const [callSeconds, setCallSeconds] = useState(engine.getCallDuration());
  const [breakSeconds, setBreakSeconds] = useState(engine.getBreakDuration());
  const [speed, setSpeed] = useState(engine.getPlaybackSpeed());
  const [volume, setVolume] = useState(engine.getVolume());
  const [randomStart, setRandomStart] = useState(false);
  const [fadeOut, setFadeOut] = useState(true);

  // Play starts the call list, or resumes it after a pause. Ignored while a song or break is running.
  const onPlay = () => {
    const el = audioRef.current;
    if (!el) return;
    const state = engine.getState();
    if (state === 'playing' || state === 'breaking') return;
    engine.start(catalogTracks.map((t) => t.id), el);
  };
  return (
    <div className="host">
      <audio ref={audioRef} preload="auto" style={{ display: 'none' }} />
      {/* Top bar */}
      <header className="host-top">
        <select defaultValue={rounds[1]}>
          {rounds.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <div className="host-actions">
          <button className="btn green" onClick={onPlay}>▶ Play</button>
          <button className="btn" onClick={() => engine.pause()}>⏸ Pause</button>
          <button className="btn" onClick={() => engine.next()}>Next</button>
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
          <ThemeToggle />
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
                        {s.title} <span className="song-artist">· {s.artist}</span>
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
                        {s.title} <span className="song-artist">· {s.artist}</span>
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
                    <input
                      type="checkbox"
                      checked={randomStart}
                      onChange={(e) => {
                        setRandomStart(e.target.checked);
                        engine.setRandomStart(e.target.checked);
                      }}
                    />
                    {' '}Randomize start time
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={fadeOut}
                      onChange={(e) => {
                        setFadeOut(e.target.checked);
                        engine.setFadeOut(e.target.checked);
                      }}
                    />
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
                  <label>
                    Grid Size
                    <select
                      value={gridSize}
                      onChange={(e) => handleGridSizeChange(Number(e.target.value))}
                    >
                      <option value={3}>3 × 3 (9 squares)</option>
                      <option value={4}>4 × 4 (16 squares)</option>
                      <option value={5}>5 × 5 (25 squares)</option>
                      <option value={6}>6 × 6 (36 squares)</option>
                    </select>
                  </label>
                  <button className="btn" type="button" onClick={() => setIsPatternOpen(true)}>
                    Define Bingo pattern ({pattern})
                  </button>
                  <label><input type="checkbox" /> Show pattern on audience screen</label>
                  <label><input type="checkbox" defaultChecked={gridSize % 2 !== 0} /> Free space</label>
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

      {/* Pattern Modal from BingoEngine */}
      {isPatternOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: '#1E293B', padding: '20px', borderRadius: '8px', color: '#fff', width: '340px' }}>
            <h3>Define Pattern ({gridSize}×{gridSize})</h3>
            <select
              value={pattern}
              onChange={(e) => setPattern(e.target.value as WinningPattern)}
              style={{ width: '100%', padding: '8px', margin: '10px 0', backgroundColor: '#0F172A', color: '#fff', border: '1px solid #475569' }}
            >
              <option value="horizontal">Horizontal Line</option>
              <option value="vertical">Vertical Line</option>
              <option value="diagonal">Diagonal (\ or /)</option>
              <option value="cross">Cross (X)</option>
              <option value="plus">Plus (+)</option>
              <option value="corners">4 Corners</option>
              <option value="L">L Shape</option>
              <option value="blackout">Full Blackout</option>
              <option value="custom">Custom Pattern (Click Squares)</option>
            </select>

            <p style={{ fontSize: '12px', color: '#94A3B8', margin: '4px 0 10px 0' }}>
              {pattern === 'custom'
                ? 'Click squares to set/unset your custom pattern.'
                : 'Pattern mask generated by BingoEngine:'}
            </p>

            {/* X by X Grid Mask from BingoEngine */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gap: '4px',
              margin: '14px 0'
            }}>
              {activeMask.map((row, r) =>
                row.map((active, c) => {
                  const isFree = (gridSize % 2 !== 0 && r === centerIndex && c === centerIndex);
                  const isMarked = isFree || active;
                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      onClick={() => handleCellClick(r, c)}
                      style={{
                        aspectRatio: '1',
                        backgroundColor: isMarked ? '#10B981' : '#334155',
                        border: isFree ? '2px dashed #F59E0B' : '1px solid #475569',
                        borderRadius: '4px',
                        cursor: pattern === 'custom' && !isFree ? 'pointer' : 'default',
                        color: '#fff',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {isFree ? 'FREE' : ''}
                    </button>
                  );
                })
              )}
            </div>

            <button className="btn green" style={{ width: '100%' }} onClick={() => setIsPatternOpen(false)}>
              Apply Pattern
            </button>
          </div>
        </div>
      )}
    </div>
  );
}