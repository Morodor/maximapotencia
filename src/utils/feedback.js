// Web Audio API Synthesizer & Haptic Vibration Engine
let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playBeep(freq = 880, duration = 0.15, type = 'sine') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio errors on unsupported environments
  }
}

export function playTimerFinishBeep() {
  playBeep(880, 0.2, 'triangle');
  setTimeout(() => playBeep(880, 0.2, 'triangle'), 250);
  setTimeout(() => playBeep(1320, 0.4, 'triangle'), 500);
}

export function hapticTap() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(20); } catch {}
  }
}

export function hapticSuccess() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate([40, 50, 60]); } catch {}
  }
}

export function hapticAlert() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate([100, 60, 100, 60, 200]); } catch {}
  }
}
