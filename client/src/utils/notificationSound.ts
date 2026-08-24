let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!('AudioContext' in window) && !('webkitAudioContext' in window)) return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  audioContext ??= new Ctor();
  return audioContext;
}

interface ToneOptions {
  frequency: number;
  duration: number;
  start: number;
  volume: number;
  type?: OscillatorType;
  /** Frequency where a lowpass filter cuts off; keeps notes soft/rounded. */
  lowpass?: number;
  /** Volume of a second oscillator one octave up, adds a bell-like sheen. */
  harmonic?: number;
  /** Pitch bend target reached at the end of the note (Hz). */
  glideTo?: number;
}

function tone({
  frequency,
  duration,
  start,
  volume,
  type = 'sine',
  lowpass,
  harmonic,
  glideTo,
}: ToneOptions) {
  const context = getAudioContext();
  if (!context) return;

  const t0 = context.currentTime + start;
  const end = t0 + duration;

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  let tail: AudioNode = context.destination;
  if (lowpass) {
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    filter.Q.value = 0.7;
    filter.connect(context.destination);
    tail = filter;
  }
  gain.connect(tail);

  const osc = context.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, t0);
  if (glideTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(glideTo, end);
  }
  osc.connect(gain);
  osc.start(t0);
  osc.stop(end + 0.02);

  if (harmonic) {
    const hGain = context.createGain();
    hGain.gain.setValueAtTime(0.0001, t0);
    hGain.gain.linearRampToValueAtTime(volume * harmonic, t0 + 0.006);
    hGain.gain.exponentialRampToValueAtTime(0.0001, end);
    hGain.connect(tail);

    const hOsc = context.createOscillator();
    hOsc.type = 'sine';
    hOsc.frequency.setValueAtTime(frequency * 2, t0);
    hOsc.connect(hGain);
    hOsc.start(t0);
    hOsc.stop(end + 0.02);
  }
}

/**
 * Messenger-style incoming message sound.
 * A warm, rounded two-note "da-dum" pop — soft attack, lowpassed triangle waves.
 */
function playMessengerPop() {
  tone({ frequency: 880, duration: 0.09, start: 0, volume: 0.14, type: 'triangle', lowpass: 1600 });
  tone({ frequency: 587.33, duration: 0.16, start: 0.085, volume: 0.12, type: 'triangle', lowpass: 1400 });
  tone({ frequency: 293.66, duration: 0.18, start: 0.085, volume: 0.05, type: 'sine' });
}

/**
 * iPhone-style notification tri-tone.
 * Three quick ascending bell plucks (E6 - G6 - C7) with a bright harmonic sheen.
 */
function playTriTone() {
  const notes = [1318.51, 1567.98, 2093.0];
  notes.forEach((frequency, i) => {
    const start = i * 0.11;
    tone({ frequency, duration: 0.18, start, volume: 0.1, harmonic: 0.35 });
  });
}

const THROTTLE_MS = 300;
const lastPlayed = new Map<string, number>();
const pendingSounds = new Set<'message' | 'notification'>();

function renderPendingSounds() {
  for (const kind of pendingSounds) {
    pendingSounds.delete(kind);
    if (kind === 'message') playMessengerPop();
    else playTriTone();
  }
}

function playThrottled(kind: 'message' | 'notification', render: () => void) {
  const now = Date.now();
  const last = lastPlayed.get(kind) ?? 0;
  // Collapse duplicate triggers (double-registered listeners, reconnect replays).
  if (now - last < THROTTLE_MS) return;
  lastPlayed.set(kind, now);

  const context = getAudioContext();
  if (!context) return;
  if (context.state === 'running') {
    render();
    return;
  }

  // Queue before resuming because browsers may leave this promise pending
  // until a user gesture unlocks the audio context.
  pendingSounds.add(kind);
  void context.resume().then(() => {
    if (!pendingSounds.delete(kind)) return;
    render();
  }).catch(() => undefined);
}

/**
 * Unlock audio at the first possible moment.
 * Browsers start AudioContexts as "suspended" until a user gesture occurs;
 * priming on the first interaction guarantees later notifications can sound
 * even if none arrived while the page had focus before.
 */
function installAudioUnlock() {
  if (typeof window === 'undefined') return;
  const unlock = () => {
    const context = getAudioContext();
    if (context && context.state !== 'running') {
      void context.resume().then(renderPendingSounds).catch(() => undefined);
    } else if (context) {
      renderPendingSounds();
    }
  };
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);
  window.addEventListener('touchstart', unlock, { passive: true });
}
installAudioUnlock();

export function playMessageSound() {
  playThrottled('message', playMessengerPop);
}

export function playNotificationSound() {
  playThrottled('notification', playTriTone);
}
