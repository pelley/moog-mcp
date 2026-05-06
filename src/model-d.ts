/**
 * Moog Model D — Control Surface Definition
 *
 * Mirrors every control on the front panel of the Minimoog Model D app.
 * Each control declares a default MIDI CC number that the user maps once
 * in the app's "Map CCs" panel, then saves as a CC Map preset.
 *
 * The Model D app does NOT publish a fixed MIDI implementation chart —
 * CC mapping is user-defined via MIDI Learn. The CC numbers below are
 * a sensible default chosen to:
 *   - avoid collisions with reserved CCs (0=Bank MSB, 6/38=Data Entry,
 *     32=Bank LSB, 64=Sustain, 96-101=NRPN/RPN, 120-127=Channel Mode)
 *   - mirror a plausible left-to-right top-to-bottom panel walk
 *   - leave room for the Mod and Pitch wheels (which are not CCs)
 *
 * Continuous knobs map to 0–127 on a CC. Switches use threshold semantics:
 *   - 2-position: 0 = off, 127 = on
 *   - 3-position: 0 / 64 / 127
 *   - n-position: evenly distributed across 0–127
 *
 * The Mod Wheel uses CC1 (fixed by MIDI spec).
 * The Pitch Bend Wheel uses MIDI Pitch Bend (14-bit, not a CC).
 */

export type ControlKind =
  | "continuous" // 0.0 – 1.0 → 0–127
  | "switch2" // off / on
  | "switch3" // pos1 / pos2 / pos3
  | "switchN" // n discrete positions
  | "modWheel" // CC1, fixed
  | "pitchWheel"; // 14-bit pitch bend

export interface ControlSpec {
  /** Stable identifier used by the agent (e.g. "filter_cutoff"). */
  id: string;
  /** Human-friendly name as printed on the Model D panel. */
  panelLabel: string;
  /** Which physical section of the panel this lives on. */
  section: string;
  /** Default CC number — user assigns this in the app's MAP CCs screen. */
  defaultCC?: number;
  /** Behaviour of the control. */
  kind: ControlKind;
  /**
   * For switchN: ordered list of position labels (low → high).
   * The label index maps to evenly spaced CC values in 0..127.
   */
  positions?: string[];
  /** Tooltip-quality description for the LLM. */
  description: string;
}

export type Section =
  | "controllers"
  | "oscillator-bank"
  | "mixer"
  | "modifiers" // filter + envelopes
  | "output"
  | "performance"; // wheels, glide, etc.

/**
 * Default CC assignments. The user assigns each in the Model D app's
 * "Map CCs" panel and saves as a CC Map preset named e.g. "Claude MCP".
 */
export const CONTROL_SURFACE: ControlSpec[] = [
  // ============ CONTROLLERS section (top-left of panel) ============
  {
    id: "tune",
    panelLabel: "Tune",
    section: "controllers",
    defaultCC: 20,
    kind: "continuous",
    description:
      "Master tuning. Center is concert pitch; turn left/right to detune the entire instrument.",
  },
  {
    id: "glide_rate",
    panelLabel: "Glide",
    section: "controllers",
    defaultCC: 5, // CC5 = portamento time, MIDI standard
    kind: "continuous",
    description:
      "Portamento time between notes. 0 = instant, max = very slow glide.",
  },
  {
    id: "modulation_mix",
    panelLabel: "Modulation Mix",
    section: "controllers",
    defaultCC: 21,
    kind: "continuous",
    description:
      "Crossfade between the two modulation sources (Osc 3 / Filter EG vs. Noise / LFO). 0 = first source, 127 = second source.",
  },
  {
    id: "noise_lfo",
    panelLabel: "Noise / LFO",
    section: "controllers",
    defaultCC: 66,
    kind: "switch2",
    description:
      "Selects the secondary modulation source: OFF = Noise, ON = LFO. Works in conjunction with Modulation Mix.",
  },

  // ============ OSCILLATOR BANK ============
  {
    id: "osc1_range",
    panelLabel: "Oscillator 1 Range",
    section: "oscillator-bank",
    defaultCC: 22,
    kind: "switchN",
    positions: ["LO", "32'", "16'", "8'", "4'", "2'"],
    description:
      "Octave/range of Oscillator 1. LO is sub-audio (good for modulation). 32'/16'/8'/4'/2' are descending octave shifts.",
  },
  {
    id: "osc1_waveform",
    panelLabel: "Oscillator 1 Waveform",
    section: "oscillator-bank",
    defaultCC: 23,
    kind: "switchN",
    positions: [
      "triangle",
      "triangle-saw",
      "sawtooth",
      "reverse-sawtooth",
      "square",
      "wide-pulse",
      "narrow-pulse",
    ],
    description:
      "Oscillator 1 waveform shape. Triangle = mellow flute-like; sawtooth = bright/buzzy; square/pulse = hollow/reedy.",
  },
  {
    id: "osc2_range",
    panelLabel: "Oscillator 2 Range",
    section: "oscillator-bank",
    defaultCC: 24,
    kind: "switchN",
    positions: ["LO", "32'", "16'", "8'", "4'", "2'"],
    description: "Octave/range of Oscillator 2. Same scale as Osc 1.",
  },
  {
    id: "osc2_frequency",
    panelLabel: "Oscillator 2 Frequency",
    section: "oscillator-bank",
    defaultCC: 25,
    kind: "continuous",
    description:
      "Fine tune of Oscillator 2 relative to Oscillator 1, ±7 semitones. Center = unison. Slight detune = thicker sound.",
  },
  {
    id: "osc2_waveform",
    panelLabel: "Oscillator 2 Waveform",
    section: "oscillator-bank",
    defaultCC: 26,
    kind: "switchN",
    positions: [
      "triangle",
      "triangle-saw",
      "sawtooth",
      "reverse-sawtooth",
      "square",
      "wide-pulse",
      "narrow-pulse",
    ],
    description: "Oscillator 2 waveform shape. Same options as Osc 1.",
  },
  {
    id: "osc3_range",
    panelLabel: "Oscillator 3 Range",
    section: "oscillator-bank",
    defaultCC: 27,
    kind: "switchN",
    positions: ["LO", "32'", "16'", "8'", "4'", "2'"],
    description:
      "Octave/range of Oscillator 3. Set to LO when using Osc 3 as a modulation source for vibrato/wobble effects.",
  },
  {
    id: "osc3_frequency",
    panelLabel: "Oscillator 3 Frequency",
    section: "oscillator-bank",
    defaultCC: 28,
    kind: "continuous",
    description: "Fine tune of Oscillator 3, ±7 semitones from Osc 1.",
  },
  {
    id: "osc3_waveform",
    panelLabel: "Oscillator 3 Waveform",
    section: "oscillator-bank",
    defaultCC: 29,
    kind: "switchN",
    positions: [
      "triangle",
      "triangle-saw",
      "sawtooth",
      "reverse-sawtooth",
      "square",
      "wide-pulse",
      "narrow-pulse",
    ],
    description: "Oscillator 3 waveform shape.",
  },
  {
    id: "osc_modulation",
    panelLabel: "Oscillator Modulation",
    section: "oscillator-bank",
    defaultCC: 30,
    kind: "switch2",
    description:
      "Routes Modulation Mix to Osc 1, 2, and (if not in keyboard control) Osc 3 frequencies. Off = no FM/vibrato effect on oscillator pitch.",
  },
  {
    id: "osc3_keyboard_control",
    panelLabel: "Oscillator 3 Keyboard Control",
    section: "oscillator-bank",
    defaultCC: 31,
    kind: "switch2",
    description:
      "When ON, Osc 3 tracks the keyboard like a normal voice. When OFF, Osc 3 stays at a fixed pitch — useful for using Osc 3 as a constant LFO source.",
  },

  // ============ MIXER ============
  {
    id: "osc1_volume",
    panelLabel: "Oscillator 1 Volume",
    section: "mixer",
    defaultCC: 33,
    kind: "continuous",
    description: "Mixer level for Oscillator 1.",
  },
  {
    id: "osc1_on",
    panelLabel: "Oscillator 1 On/Off",
    section: "mixer",
    defaultCC: 34,
    kind: "switch2",
    description: "Enable/disable Oscillator 1 in the mix.",
  },
  {
    id: "external_input_volume",
    panelLabel: "External Input Volume",
    section: "mixer",
    defaultCC: 35,
    kind: "continuous",
    description:
      "Level of the external input (or feedback path on the app). Drives the filter overdrive when high.",
  },
  {
    id: "external_input_on",
    panelLabel: "External Input On/Off",
    section: "mixer",
    defaultCC: 36,
    kind: "switch2",
    description: "Enable/disable the external input / feedback path.",
  },
  {
    id: "osc2_volume",
    panelLabel: "Oscillator 2 Volume",
    section: "mixer",
    defaultCC: 37,
    kind: "continuous",
    description: "Mixer level for Oscillator 2.",
  },
  {
    id: "osc2_on",
    panelLabel: "Oscillator 2 On/Off",
    section: "mixer",
    defaultCC: 39,
    kind: "switch2",
    description: "Enable/disable Oscillator 2 in the mix.",
  },
  {
    id: "noise_volume",
    panelLabel: "Noise Volume",
    section: "mixer",
    defaultCC: 40,
    kind: "continuous",
    description: "Mixer level for the noise generator.",
  },
  {
    id: "noise_on",
    panelLabel: "Noise On/Off",
    section: "mixer",
    defaultCC: 41,
    kind: "switch2",
    description: "Enable/disable the noise generator.",
  },
  {
    id: "noise_color",
    panelLabel: "Noise Color",
    section: "mixer",
    defaultCC: 42,
    kind: "switch2",
    description:
      "White (full spectrum, hissier) vs. Pink (-3dB/octave, more rumbly).",
  },
  {
    id: "osc3_volume",
    panelLabel: "Oscillator 3 Volume",
    section: "mixer",
    defaultCC: 43,
    kind: "continuous",
    description: "Mixer level for Oscillator 3.",
  },
  {
    id: "osc3_on",
    panelLabel: "Oscillator 3 On/Off",
    section: "mixer",
    defaultCC: 44,
    kind: "switch2",
    description: "Enable/disable Oscillator 3 in the audio mix (separate from its modulation role).",
  },

  // ============ MODIFIERS — Filter + Envelopes ============
  {
    id: "filter_cutoff",
    panelLabel: "Filter Cutoff",
    section: "modifiers",
    defaultCC: 74, // CC74 = standard "Brightness/Cutoff"
    kind: "continuous",
    description:
      "Low-pass filter cutoff frequency. The signature Moog control. Low = dark/muffled, high = bright/open.",
  },
  {
    id: "filter_emphasis",
    panelLabel: "Filter Emphasis (Resonance)",
    section: "modifiers",
    defaultCC: 71, // CC71 = standard "Resonance"
    kind: "continuous",
    description:
      "Filter resonance. Emphasizes frequencies near the cutoff. High values = nasal/whistling. Self-oscillates near max on the Model D.",
  },
  {
    id: "filter_contour_amount",
    panelLabel: "Filter Contour Amount",
    section: "modifiers",
    defaultCC: 45,
    kind: "continuous",
    description:
      "How much the filter envelope (Attack/Decay/Sustain) modulates the cutoff. 0 = static filter; high = pronounced filter sweep on each note.",
  },
  {
    id: "filter_attack",
    panelLabel: "Filter Attack",
    section: "modifiers",
    defaultCC: 46,
    kind: "continuous",
    description:
      "Filter envelope attack time. 0 = instant rise; high = slow rise (good for sweeps and pads).",
  },
  {
    id: "filter_decay",
    panelLabel: "Filter Decay",
    section: "modifiers",
    defaultCC: 47,
    kind: "continuous",
    description:
      "Filter envelope decay time. After attack, time to fall from peak to sustain level.",
  },
  {
    id: "filter_sustain",
    panelLabel: "Filter Sustain",
    section: "modifiers",
    defaultCC: 48,
    kind: "continuous",
    description:
      "Filter envelope sustain level (0–127). Filter cutoff settles here while a note is held.",
  },
  {
    id: "osc2_filter_eg",
    panelLabel: "Osc 2 Filter EG",
    section: "modifiers",
    defaultCC: 63,
    kind: "switch2",
    description:
      "Routes the Filter Envelope Generator to Oscillator 2 frequency. ON = filter EG modulates Osc 2 pitch.",
  },
  {
    id: "filter_modulation",
    panelLabel: "Filter Modulation",
    section: "modifiers",
    defaultCC: 49,
    kind: "switch2",
    description:
      "Routes the Modulation Mix to the filter cutoff. Turn on for filter wobble/vibrato.",
  },
  {
    id: "keyboard_control_1",
    panelLabel: "Keyboard Control 1",
    section: "modifiers",
    defaultCC: 50,
    kind: "switch2",
    description:
      "First of two switches that determine how much keyboard pitch tracks the filter cutoff. Both off = no tracking; one = 1/3; both = 2/3 + slight detune; (combinations replicate the original Model D's filter tracking quirks).",
  },
  {
    id: "keyboard_control_2",
    panelLabel: "Keyboard Control 2",
    section: "modifiers",
    defaultCC: 51,
    kind: "switch2",
    description: "Second filter keyboard tracking switch — see Keyboard Control 1.",
  },
  {
    id: "loudness_attack",
    panelLabel: "Loudness Attack",
    section: "modifiers",
    defaultCC: 52,
    kind: "continuous",
    description:
      "Amplitude envelope attack. 0 = instant note (percussive); high = slow swell (good for pads).",
  },
  {
    id: "loudness_decay",
    panelLabel: "Loudness Decay",
    section: "modifiers",
    defaultCC: 53,
    kind: "continuous",
    description: "Amplitude envelope decay time after attack peak.",
  },
  {
    id: "loudness_sustain",
    panelLabel: "Loudness Sustain",
    section: "modifiers",
    defaultCC: 54,
    kind: "continuous",
    description:
      "Amplitude envelope sustain level. The volume held while a note is held down.",
  },
  {
    id: "decay_switch",
    panelLabel: "Decay Switch",
    section: "modifiers",
    defaultCC: 55,
    kind: "switch2",
    description:
      "When ON, both filter and loudness envelopes use their Decay times for the release phase. When OFF, release is instant. (The original Model D has no separate Release knob; this switch toggles the trick of 'Release = Decay'.)",
  },

  // ============ OUTPUT ============
  {
    id: "main_output_volume",
    panelLabel: "Main Output Volume",
    section: "output",
    defaultCC: 7, // CC7 = MIDI standard Channel Volume
    kind: "continuous",
    description: "Master output volume.",
  },
  {
    id: "main_output_on",
    panelLabel: "Main Output On/Off",
    section: "output",
    defaultCC: 56,
    kind: "switch2",
    description: "Master output enable. OFF = silence regardless of envelopes.",
  },
  {
    id: "a440",
    panelLabel: "A-440 Tuning Tone",
    section: "output",
    defaultCC: 57,
    kind: "switch2",
    description:
      "Outputs a steady 440 Hz tuning reference. Useful for tuning by ear — but turn off before playing!",
  },

  // ============ PERFORMANCE — wheels & glide ============
  {
    id: "glide_on",
    panelLabel: "Glide On/Off",
    section: "performance",
    defaultCC: 65, // CC65 = MIDI standard Portamento On/Off
    kind: "switch2",
    description:
      "Enable portamento (glide between notes). Combine with glide_rate to control how slowly pitches slur.",
  },
  {
    id: "decay_on",
    panelLabel: "Decay On/Off (legacy)",
    section: "performance",
    defaultCC: 58,
    kind: "switch2",
    description:
      "Alternate decay enable on some app revisions; same idea as decay_switch.",
  },
  // ============ EXTRAS — app-specific features beyond the original panel ============
  {
    id: "arp",
    panelLabel: "ARP",
    section: "extras",
    defaultCC: 59,
    kind: "switch2",
    description: "Enable/disable the arpeggiator.",
  },
  {
    id: "arp_rate",
    panelLabel: "ARP Rate",
    section: "extras",
    defaultCC: 67,
    kind: "continuous",
    description: "Arpeggiator rate. Low = slow, high = fast.",
  },
  {
    id: "arp_pattern",
    panelLabel: "ARP Pattern",
    section: "extras",
    defaultCC: 68,
    kind: "switchN",
    positions: ["UP", "UP/DOWN", "ORDERED", "RANDOM"],
    description: "Arpeggiator pattern: UP, UP/DOWN, ORDERED, or RANDOM.",
  },
  {
    id: "arp_octave",
    panelLabel: "ARP Octave",
    section: "extras",
    defaultCC: 69,
    kind: "switchN",
    positions: ["1", "2", "3"],
    description: "Arpeggiator octave range: 1, 2, or 3 octaves.",
  },
  {
    id: "arp_gate_length",
    panelLabel: "ARP Gate Length",
    section: "extras",
    defaultCC: 70,
    kind: "continuous",
    description: "Arpeggiator gate length. Low = short/staccato, high = long/legato.",
  },
  {
    id: "arp_latch",
    panelLabel: "ARP Latch",
    section: "extras",
    defaultCC: 75,
    kind: "switch2",
    description: "Latch the arpeggiator — holds the pattern playing without keys held.",
  },
  {
    id: "key_hold",
    panelLabel: "Key Hold",
    section: "extras",
    defaultCC: 64, // pre-assigned in app (MIDI standard Sustain Pedal)
    kind: "switch2",
    description: "Hold currently pressed notes, freeing hands for other controls.",
  },
  {
    id: "bender",
    panelLabel: "Bender",
    section: "extras",
    defaultCC: 60,
    kind: "switch2",
    description: "Enable/disable the bender section.",
  },
  {
    id: "bender_rate",
    panelLabel: "Bender Rate",
    section: "extras",
    defaultCC: 76,
    kind: "continuous",
    description: "Bender LFO rate.",
  },
  {
    id: "bender_depth",
    panelLabel: "Bender Depth",
    section: "extras",
    defaultCC: 77,
    kind: "continuous",
    description: "Bender modulation depth.",
  },
  {
    id: "bender_mix",
    panelLabel: "Bender Mix",
    section: "extras",
    defaultCC: 78,
    kind: "continuous",
    description: "Bender wet/dry mix.",
  },
  {
    id: "bender_time",
    panelLabel: "Bender Time",
    section: "extras",
    defaultCC: 79,
    kind: "continuous",
    description: "Bender time.",
  },
  {
    id: "bender_feedback",
    panelLabel: "Bender Feedback",
    section: "extras",
    defaultCC: 80,
    kind: "continuous",
    description: "Bender feedback amount.",
  },
  {
    id: "delay",
    panelLabel: "Delay",
    section: "extras",
    defaultCC: 61,
    kind: "switch2",
    description: "Enable/disable the delay effect.",
  },
  {
    id: "delay_time",
    panelLabel: "Delay Time",
    section: "extras",
    defaultCC: 81,
    kind: "continuous",
    description: "Delay time. Low = short slapback, high = long echo.",
  },
  {
    id: "delay_mix",
    panelLabel: "Delay Mix",
    section: "extras",
    defaultCC: 82,
    kind: "continuous",
    description: "Delay wet/dry mix.",
  },
  {
    id: "delay_feedback",
    panelLabel: "Delay Feedback",
    section: "extras",
    defaultCC: 83,
    kind: "continuous",
    description: "Delay feedback (number of repeats). High values approach self-oscillation.",
  },
  {
    id: "delay_sync",
    panelLabel: "Delay Sync",
    section: "extras",
    defaultCC: 84,
    kind: "switch2",
    description: "Sync delay time to MIDI clock.",
  },
  {
    id: "looper",
    panelLabel: "Looper",
    section: "extras",
    defaultCC: 62,
    kind: "switch2",
    description: "Enable/disable the looper.",
  },
  {
    id: "looper_play_stop",
    panelLabel: "Looper Play/Stop",
    section: "extras",
    defaultCC: 85,
    kind: "switch2",
    description: "Toggle looper playback.",
  },
  {
    id: "looper_record",
    panelLabel: "Looper Record",
    section: "extras",
    defaultCC: 86,
    kind: "switch2",
    description: "Start/stop looper recording.",
  },
  {
    id: "looper_overdub",
    panelLabel: "Looper Overdub",
    section: "extras",
    defaultCC: 87,
    kind: "switch2",
    description: "Enable looper overdub — layers a new pass over the existing loop.",
  },
  {
    id: "looper_undo",
    panelLabel: "Looper Undo",
    section: "extras",
    defaultCC: 88,
    kind: "switch2",
    description: "Undo the last looper overdub pass.",
  },
  {
    id: "looper_clear",
    panelLabel: "Looper Clear",
    section: "extras",
    defaultCC: 89,
    kind: "switch2",
    description: "Clear the looper buffer.",
  },
  {
    id: "looper_share",
    panelLabel: "Looper Share",
    section: "extras",
    defaultCC: 90,
    kind: "switch2",
    description: "Share/export the looper recording.",
  },

  // The Mod Wheel and Pitch Wheel are special — see modWheel/pitchWheel kinds.
  {
    id: "mod_wheel",
    panelLabel: "Mod Wheel",
    section: "performance",
    kind: "modWheel",
    description:
      "Modulation wheel — sends MIDI CC1. Routed by the app's modulation matrix; commonly controls vibrato or filter sweep depth.",
  },
  {
    id: "pitch_wheel",
    panelLabel: "Pitch Wheel",
    section: "performance",
    kind: "pitchWheel",
    description:
      "Pitch bend wheel — sends 14-bit MIDI Pitch Bend. ±2 semitones by default in the Model D app (configurable in the app's Advanced settings up to ±24).",
  },
];

export const SECTIONS: readonly string[] = [
  "controllers",
  "oscillator-bank",
  "mixer",
  "modifiers",
  "output",
  "performance",
  "extras",
];

/**
 * Look up a control by id, throwing if unknown.
 */
export function findControl(id: string): ControlSpec {
  const c = CONTROL_SURFACE.find((c) => c.id === id);
  if (!c) {
    throw new Error(
      `Unknown control: "${id}". Available: ${CONTROL_SURFACE.map((c) => c.id).join(", ")}`,
    );
  }
  return c;
}

/**
 * For a switchN control, map a label to its CC value.
 */
export function positionToCC(spec: ControlSpec, label: string): number {
  if (!spec.positions) {
    throw new Error(`Control ${spec.id} has no enumerated positions`);
  }
  const idx = spec.positions.indexOf(label);
  if (idx < 0) {
    throw new Error(
      `Unknown position "${label}" for ${spec.id}. Valid: ${spec.positions.join(", ")}`,
    );
  }
  // Spread n positions evenly across 0..127.
  const n = spec.positions.length;
  if (n === 1) return 64;
  return Math.round((idx * 127) / (n - 1));
}

/**
 * For a 3-position switch, map "low" | "mid" | "high" to 0/64/127.
 */
export function tristateToCC(value: "low" | "mid" | "high"): number {
  return value === "low" ? 0 : value === "mid" ? 64 : 127;
}

/**
 * Clamp a 0.0–1.0 normalized value to a 0–127 CC value.
 */
export function normalizedToCC(v: number): number {
  if (Number.isNaN(v)) throw new Error("Value must be a number");
  const clamped = Math.max(0, Math.min(1, v));
  return Math.round(clamped * 127);
}
