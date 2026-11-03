import { useState } from 'react';
import { rounds, songs } from '../data/fakeData';

// Host's laptop screen: the "cockpit" from the legacy walkthrough.
export default function HostCockpit() {
  const callList = songs.slice(3);
  const called = songs.slice(0, 3);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<'timers' | 'bingo'>('timers');

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
          <button className="btn">Create/Edit Catalog</button>
          <button className="btn">Text Preferences</button>
          <button className="btn">Control Panel</button>
        </div>
      </header>

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
                    {s.artist} - {s.title}
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
                    {s.artist} - {s.title}
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
    </div>
  );
}
