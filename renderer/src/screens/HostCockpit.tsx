import { useState } from 'react';
import { rounds, songs } from '../data/fakeData';
import { CatalogManager } from '../CatalogManager';
import { BingoEngine } from '../../../host/BingoEngine';
import type { WinningPattern } from '../../../host/BingoEngine';

// Host's laptop screen: the "cockpit" from the legacy walkthrough.
export default function HostCockpit() {
  const callList = songs.slice(3);
  const called = songs.slice(0, 3);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<'timers' | 'bingo'>('timers');
  const [activeView, setActiveView] = useState<'dashboard' | 'catalog'>('dashboard');

  // Pattern dialog state
  const [isPatternOpen, setIsPatternOpen] = useState(false);
  const [pattern, setPattern] = useState<WinningPattern>('horizontal');
  const [customGrid, setCustomGrid] = useState<boolean[][]>(() => BingoEngine.createEmptyCustomGrid(5));

  const activeMask = pattern === 'custom'
    ? customGrid
    : BingoEngine.generatePatternMask(pattern, 5);

  const handleCellClick = (r: number, c: number) => {
    // If middle free space, do not toggle
    if (r === 2 && c === 2) return;
    if (pattern === 'custom') {
      const updated = BingoEngine.toggleCustomGridCell(customGrid, r, c);
      setCustomGrid(updated);
    }
  };

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
          <button className="btn">Control Panel</button>
        </div>
      </header>

      {activeView === 'catalog' ? (
        <main style={{ padding: '16px', overflowY: 'auto' }}>
          <CatalogManager />
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
                  <label>Call duration <select><option>0:55</option></select></label>
                  <label>Break duration <select><option>4</option></select></label>
                  <label>Play speed <select><option>1.00</option></select></label>
                  <div className="readouts">
                    <span>Call 0:08</span><span>Break 0</span><span>Time 0:46</span>
                  </div>
                  <label><input type="checkbox" /> Randomize start time</label>
                  <label><input type="checkbox" defaultChecked /> Volume fade out</label>
                  <label className="wide">Volume <input type="range" /></label>
                </div>
              ) : (
                <div className="form-grid">
                  <div className="wide">
                    <strong>Incoming claims</strong>
                    <div className="claim">Card #397: waiting to check…</div>
                  </div>
                  <button className="btn" type="button" onClick={() => setIsPatternOpen(true)}>
                    Define Bingo pattern ({pattern})
                  </button>
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

      {/* Pattern Modal from BingoEngine */}
      {isPatternOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: '#1E293B', padding: '20px', borderRadius: '8px', color: '#fff', width: '330px' }}>
            <h3>Define Pattern</h3>
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

            {/* 5x5 Grid Mask from BingoEngine */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', margin: '14px 0' }}>
              {activeMask.map((row, r) =>
                row.map((active, c) => {
                  const isFree = (r === 2 && c === 2);
                  const isMarked = isFree || active;
                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      onClick={() => handleCellClick(r, c)}
                      style={{
                        height: '42px',
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