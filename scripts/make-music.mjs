/**
 * Composes the intro video's music and sound effects in code (no samples, no
 * downloads, free to use): a 100 BPM track in A minor with pads, bass, a plucked
 * arpeggio and light drums, plus whooshes, bubble pops, a stamp thump and an
 * end chime timed to the video.
 *
 *   node scripts/make-music.mjs  → video/voice/music.wav and video/voice/sfx.wav
 *   (npm run video:audio runs this, then mixes everything with the voices)
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RATE = 44100;
const DURATION = 94;
const N = RATE * DURATION;
const BEAT = 60 / 100; // 100 BPM
const BAR = BEAT * 4;

const freq = (midi) => 440 * 2 ** ((midi - 69) / 12);
const TAU = Math.PI * 2;
// Deterministic noise, so every render sounds the same.
let seed = 12345;
const noise = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x3fffffff) - 1;

// Am – F – C – G, one chord per bar.
const CHORDS = [
  { pad: [57, 60, 64, 69], bass: 45 },
  { pad: [57, 60, 65, 69], bass: 41 },
  { pad: [55, 60, 64, 67], bass: 48 },
  { pad: [55, 59, 62, 67], bass: 43 },
];
const chordAt = (t) => CHORDS[Math.floor(t / BAR) % 4];

// Arrangement: when each part plays (seconds).
const has = {
  bass: (t) => t > 6.4,
  kick: (t) => (t > 6.4 && t < 87.6) || (t > 88.8 && t < 92),
  hat: (t) => t > 14 && t < 92,
  clap: (t) => t > 22 && t < 87.6,
  arp: (t) => t > 1.2 && t < 92.5,
};

const L = new Float32Array(N), R = new Float32Array(N);

for (let i = 0; i < N; i++) {
  const t = i / RATE;
  const beatPos = (t % BEAT) / BEAT;
  const chord = chordAt(t);
  const inBar = t % BAR;

  // Sidechain pump: everything ducks a little on each beat.
  const pump = has.kick(t) ? 0.55 + 0.45 * Math.min(1, beatPos / 0.45) : 1;

  // Pad: soft detuned saws (first 6 harmonics), fading between chords.
  const chordFade = Math.min(1, inBar / 0.5);
  let pad = 0;
  for (const m of chord.pad) {
    const f = freq(m);
    for (const det of [0.9985, 1.0015]) {
      for (let h = 1; h <= 6; h++) pad += Math.sin(TAU * f * det * h * t) / (h * h * 0.8 + h * 0.2);
    }
  }
  pad *= 0.010 * chordFade * pump;

  // Bass: pulsing eighth notes.
  let bass = 0;
  if (has.bass(t)) {
    const e = (t % (BEAT / 2)) / (BEAT / 2);
    const env = Math.exp(-e * 4) * 0.9 + 0.1;
    const f = freq(chord.bass);
    bass = (Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * f * 2 * t)) * 0.11 * env * pump;
  }

  // Arpeggio: plucked chord tones in sixteenths, an octave up.
  let arp = 0;
  if (has.arp(t)) {
    const step = Math.floor(t / (BEAT / 4));
    const pattern = [0, 1, 2, 3, 2, 1, 2, 3];
    const note = chord.pad[pattern[step % 8]] + 12;
    const e = (t % (BEAT / 4));
    const f = freq(note);
    const tone = Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2 * t) + 0.12 * Math.sin(TAU * f * 3 * t);
    arp = tone * Math.exp(-e * 14) * 0.045 * (t < 6.4 ? 0.6 : 1);
  }

  // Drums
  let drums = 0;
  if (has.kick(t)) {
    const k = t % BEAT;
    if (k < 0.3) drums += Math.sin(TAU * (45 + 90 * Math.exp(-k * 30)) * k) * Math.exp(-k * 11) * 0.42;
  }
  if (has.hat(t)) {
    const h = (t + BEAT / 2) % BEAT;
    if (h < 0.05) drums += noise() * Math.exp(-h * 90) * 0.05;
  }
  if (has.clap(t)) {
    const c = (t + BEAT) % (BEAT * 2);
    if (c < 0.18) drums += (noise() * 0.7 + Math.sin(TAU * 190 * c) * 0.3) * Math.exp(-c * 28) * 0.13;
  }

  // Fade in and out, slight stereo spread.
  const fade = Math.min(1, t / 1.5) * Math.min(1, (DURATION - t) / 2.5);
  L[i] = (pad * 1.05 + bass + arp * 1.2 + drums) * fade;
  R[i] = (pad * 0.95 + bass + arp * 0.8 + drums) * fade;
}

// ── Sound effects, timed to the video ──
const SL = new Float32Array(N), SR = new Float32Array(N);
function add(at, length, fn, pan = 0) {
  const start = Math.floor(at * RATE);
  for (let j = 0; j < length * RATE && start + j < N; j++) {
    const v = fn(j / RATE);
    SL[start + j] += v * (1 - pan);
    SR[start + j] += v * (1 + pan);
  }
}
// Whoosh at each scene change: filtered noise that rises and falls.
let lp = 0;
const whoosh = (t) => {
  lp += (noise() - lp) * (0.04 + 0.25 * Math.sin(Math.PI * Math.min(1, t / 0.7)));
  return lp * Math.sin(Math.PI * Math.min(1, t / 0.7)) * 0.5;
};
for (const at of [6.15, 13.8, 21.8, 31.8, 39.8, 46.8, 53.8, 59.8, 69.8, 78.8, 87.9]) add(at, 0.7, whoosh, 0.2);
// Pop when a character's speech bubble appears.
const narration = JSON.parse(readFileSync(resolve(root, "video/narration.json"), "utf8")).lines;
for (const line of narration.filter((l) => l.who !== "Narrator")) {
  add(line.start - 0.15, 0.12, (t) => Math.sin(TAU * (520 + 900 * Math.exp(-t * 40)) * t) * Math.exp(-t * 35) * 0.16);
}
// Soft ticks as the checklist fills in.
for (let k = 0; k < 6; k++) add(23.2 + k * 1.15, 0.08, (t) => Math.sin(TAU * 1760 * t) * Math.exp(-t * 60) * 0.1);
// Stamp thump for "FALSE".
add(43.6, 0.5, (t) => (Math.sin(TAU * (60 + 80 * Math.exp(-t * 25)) * t) * 0.6 + noise() * 0.25 * Math.exp(-t * 30)) * Math.exp(-t * 7) * 0.7);
// End chime: a bright A major arpeggio.
[81, 85, 88, 93].forEach((m, k) => add(89.0 + k * 0.09, 2.2, (t) => (Math.sin(TAU * freq(m) * t) + 0.3 * Math.sin(TAU * freq(m) * 2 * t)) * Math.exp(-t * 2.2) * 0.07, (k - 1.5) * 0.15));

// ── Write 16-bit stereo WAV files ──
function wav(path, left, right, gain) {
  let peak = 0;
  for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  const scale = gain / (peak || 1);
  const data = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[i] * scale)) * 32767), i * 4);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[i] * scale)) * 32767), i * 4 + 2);
  }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(data.length, 40);
  writeFileSync(path, Buffer.concat([h, data]));
}
mkdirSync(resolve(root, "video/voice"), { recursive: true });
wav(resolve(root, "video/voice/music.wav"), L, R, 0.9);
wav(resolve(root, "video/voice/sfx.wav"), SL, SR, 0.9);
console.log("Saved video/voice/music.wav and video/voice/sfx.wav");
