// Tests for PlaybackEngine: loading songs, speed and volume, and the call/fade/break sequence.
import * as assert from 'assert';
import { PlaybackEngine, MediaElement, FADE_MS } from './PlaybackEngine';
import { mediaUrlFor, filePathFromMediaUrl } from './mediaUrl';
import type { Track } from './index';

const catalog: Record<string, string> = {
  'track-1': 'C:\\Music\\Queen - Bohemian Rhapsody.mp3',
  'track-2': 'C:\\Music\\Queen - Radio Ga Ga.mp3',
};
const tracks: Record<string, Track> = {
  'track-1': { id: 'track-1', title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night', filePath: catalog['track-1'], startTime: 0, endTime: 100, duration: 100 },
  'track-2': { id: 'track-2', title: 'Radio Ga Ga', artist: 'Queen', album: 'The Works', filePath: catalog['track-2'], startTime: 10, endTime: 40, duration: 60 },
};

// ---- Loading, speed and volume ----
const engine = new PlaybackEngine({ getAddress: (id) => catalog[id] });

// A known song points the element at its media:// address
const element = { src: '' };
assert.strictEqual(engine.loadTrack('track-1', element), true);
assert.strictEqual(element.src, mediaUrlFor('C:\\Music\\Queen - Bohemian Rhapsody.mp3'));
assert.strictEqual(filePathFromMediaUrl(element.src), 'C:\\Music\\Queen - Bohemian Rhapsody.mp3');
assert.strictEqual(engine.getCurrentTrackId(), 'track-1');

// An unknown song leaves the element alone and reports false
const other = { src: 'unchanged' };
assert.strictEqual(engine.loadTrack('missing', other), false);
assert.strictEqual(other.src, 'unchanged');
assert.strictEqual(engine.getCurrentTrackId(), 'track-1', 'current track is not changed by a failed load');

// An engine without a catalog never finds anything
const bare = new PlaybackEngine();
assert.strictEqual(bare.loadTrack('track-1', { src: '' }), false);

const speedEngine = new PlaybackEngine({ getAddress: (id) => catalog[id] });
const media: MediaElement = { src: '' };
assert.strictEqual(speedEngine.getPlaybackSpeed(), 1.0);
assert.strictEqual(speedEngine.loadTrack('track-1', media), true);
assert.strictEqual(media.playbackRate, 1.0, 'a new song starts at the chosen speed');

speedEngine.setSpeed(1.5);
assert.strictEqual(media.playbackRate, 1.5, 'changing speed updates the loaded song');
assert.strictEqual(speedEngine.getPlaybackSpeed(), 1.5);

speedEngine.setSpeed(10);
assert.strictEqual(speedEngine.getPlaybackSpeed(), 2.0, 'speed is capped at 2x');
speedEngine.setSpeed(0.01);
assert.strictEqual(speedEngine.getPlaybackSpeed(), 0.5, 'speed has a floor of 0.5x');
speedEngine.setSpeed(NaN);
assert.strictEqual(speedEngine.getPlaybackSpeed(), 1.0, 'a bad speed falls back to normal');

speedEngine.setSpeed(0.75);
const next: MediaElement = { src: '' };
speedEngine.loadTrack('track-1', next);
assert.strictEqual(next.playbackRate, 0.75, 'the next song keeps the chosen speed');

speedEngine.setVolume(0.4);
assert.strictEqual(next.volume, 0.4, 'volume applies to the loaded song');
speedEngine.setVolume(5);
assert.strictEqual(speedEngine.getVolume(), 1.0, 'volume is capped at full');

speedEngine.setCallDuration(45.6);
assert.strictEqual(speedEngine.getCallDuration(), 46, 'call length is whole seconds');
speedEngine.setBreakDuration(-3);
assert.strictEqual(speedEngine.getBreakDuration(), 0, 'break length is never negative');
speedEngine.setBreakDuration(8);
assert.strictEqual(speedEngine.getBreakDuration(), 8);

// ---- Call, fade and break sequence, driven by a fake clock ----
class FakeClock {
  now = 0;
  private jobs: { id: number; due: number; run: () => void }[] = [];
  private nextId = 1;
  schedule = (run: () => void, ms: number): unknown => {
    const id = this.nextId++;
    this.jobs.push({ id, due: this.now + ms, run });
    return id;
  };
  cancel = (handle: unknown): void => {
    this.jobs = this.jobs.filter((job) => job.id !== handle);
  };
  advance(ms: number): void {
    const end = this.now + ms;
    for (;;) {
      this.jobs.sort((a, b) => a.due - b.due || a.id - b.id);
      const job = this.jobs[0];
      if (!job || job.due > end) break;
      this.jobs.shift();
      this.now = job.due;
      job.run();
    }
    this.now = end;
  }
}

function fakeElement() {
  return {
    src: '',
    currentTime: 0,
    volume: 1,
    playbackRate: 1,
    paused: true,
    play(): Promise<void> {
      this.paused = false;
      return Promise.resolve();
    },
    pause(): void {
      this.paused = true;
    },
  };
}

function makeEngine(clock: FakeClock, random?: () => number): PlaybackEngine {
  return new PlaybackEngine({
    getAddress: (id) => catalog[id],
    getTrack: (id) => tracks[id],
    schedule: clock.schedule,
    cancel: clock.cancel,
    random,
  });
}

// 1. Call, break, next song, then the list finishes. Fade is off so the timing is exact.
{
  const clock = new FakeClock();
  const seq = makeEngine(clock);
  const el = fakeElement();
  seq.setCallDuration(20);
  seq.setBreakDuration(5);
  seq.setFadeOut(false);
  assert.strictEqual(seq.start([], el), false, 'an empty list does not start');
  assert.strictEqual(seq.start(['track-1', 'track-2'], el), true);
  assert.strictEqual(seq.getState(), 'playing');
  assert.strictEqual(el.paused, false);
  assert.strictEqual(el.src, mediaUrlFor(catalog['track-1']));
  clock.advance(19999);
  assert.strictEqual(seq.getState(), 'playing');
  clock.advance(1);
  assert.strictEqual(seq.getState(), 'breaking');
  assert.strictEqual(el.paused, true, 'the song stops at the end of its call');
  clock.advance(5000);
  assert.strictEqual(seq.getCurrentTrackId(), 'track-2');
  assert.strictEqual(el.currentTime, 10, 'track 2 starts at its crop start');
  assert.strictEqual(seq.getState(), 'playing');
  clock.advance(20000);
  assert.strictEqual(seq.getState(), 'breaking');
  clock.advance(5000);
  assert.strictEqual(seq.getState(), 'finished');
  assert.strictEqual(el.paused, true);
}

// 2. Fade out: the volume drops over the last 2 seconds of the call, then comes back up.
{
  const clock = new FakeClock();
  const seq = makeEngine(clock);
  const el = fakeElement();
  seq.setCallDuration(20);
  seq.setBreakDuration(0);
  seq.start(['track-1'], el);
  clock.advance(20000 - FADE_MS);
  assert.ok(Math.abs(el.volume - 1) < 0.01, 'the fade starts at full volume');
  clock.advance(FADE_MS / 2);
  assert.ok(Math.abs(el.volume - 0.5) < 0.06, 'halfway through the fade the volume is about half');
  clock.advance(FADE_MS / 2);
  assert.strictEqual(el.paused, true, 'the call ends after the fade');
  assert.strictEqual(el.volume, 1, 'the volume is restored for the next song');
}

// 3. Random start: with the option on, the start moves inside the crop and leaves room for the call.
{
  const clock = new FakeClock();
  const seq = makeEngine(clock, () => 0.5);
  const el = fakeElement();
  seq.setRandomStart(true);
  seq.setCallDuration(20);
  seq.start(['track-1'], el);
  assert.strictEqual(el.currentTime, 40, 'half of the 80 seconds of room lands at 40');
}

// 4. Pause stops the clock; Play again resumes the same call where it stopped.
{
  const clock = new FakeClock();
  const seq = makeEngine(clock);
  const el = fakeElement();
  seq.setCallDuration(20);
  seq.setFadeOut(false);
  seq.start(['track-1'], el);
  clock.advance(5000);
  el.currentTime = 5; // what the browser would report after 5 seconds
  seq.pause();
  assert.strictEqual(seq.getState(), 'paused');
  assert.strictEqual(el.paused, true);
  clock.advance(60000);
  assert.strictEqual(seq.getState(), 'paused', 'nothing happens while paused');
  seq.start(['track-1'], el);
  assert.strictEqual(seq.getState(), 'playing');
  assert.strictEqual(el.paused, false);
  clock.advance(14999);
  assert.strictEqual(seq.getState(), 'playing');
  clock.advance(1);
  assert.strictEqual(seq.getState(), 'breaking', 'the call ends 20 seconds into the song, not 20 seconds after resume');
}

// 5. Next jumps to the following song; songs missing from the catalog are skipped.
{
  const clock = new FakeClock();
  const seq = makeEngine(clock);
  seq.start(['track-1', 'track-2'], fakeElement());
  clock.advance(3000);
  seq.next();
  assert.strictEqual(seq.getCurrentTrackId(), 'track-2');
  assert.strictEqual(seq.getState(), 'playing');
}
{
  const clock = new FakeClock();
  const seq = makeEngine(clock);
  seq.start(['missing', 'track-1'], fakeElement());
  assert.strictEqual(seq.getCurrentTrackId(), 'track-1', 'songs not in the catalog are skipped');
}

// 6. Speed changes how long a call takes on the clock: 2x makes a 20 second call last 10 seconds.
{
  const clock = new FakeClock();
  const seq = makeEngine(clock);
  seq.setSpeed(2);
  seq.setCallDuration(20);
  seq.setFadeOut(false);
  seq.start(['track-1'], fakeElement());
  clock.advance(10000);
  assert.strictEqual(seq.getState(), 'breaking', 'at 2x a 20 second call takes 10 seconds');
}

// 7. A zero break moves straight to the next song.
{
  const clock = new FakeClock();
  const seq = makeEngine(clock);
  seq.setCallDuration(20);
  seq.setBreakDuration(0);
  seq.setFadeOut(false);
  seq.start(['track-1', 'track-2'], fakeElement());
  clock.advance(20000);
  assert.strictEqual(seq.getCurrentTrackId(), 'track-2');
  assert.strictEqual(seq.getState(), 'playing');
}

console.log('PlaybackEngine: all tests passed');
