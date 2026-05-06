/**
 * Moog Grandmother — MIDI Control Surface Definition
 *
 * The Grandmother is a semi-modular analog synthesizer. Its core analog
 * signal path (filter cutoff, resonance, envelope times, mixer levels) is
 * controlled by physical pots that are NOT MIDI-controllable — only
 * parameters with dedicated digital control circuitry respond to MIDI CC.
 *
 * MIDI implementation source: Moog Grandmother User Manual v1.2, Appendix B.
 *
 * 14-bit pairs follow the MIDI standard: MSB on CC n, LSB on CC n+32.
 * Switch values use Moog's documented semantics (64 = on, 0 = off for
 * 2-position; 0/43/85 or similar for 3-position).
 *
 * Default MIDI channel: 1 (configurable in Global Settings).
 * MIDI ports: 5-pin DIN IN / THRU / OUT + USB.
 */

import type { ControlSpec } from "./model-d.js";
export type { ControlSpec };
export { normalizedToCC, positionToCC } from "./model-d.js";

export const SECTIONS: readonly string[] = [
  "oscillators",
  "performance",
  "sequencer",
];

export const CONTROL_SURFACE: ControlSpec[] = [
  // ============ OSCILLATORS ============
  // Physical panel knobs (waveform, filter, envelopes, mixer) are analog pots
  // and NOT MIDI-controllable. Only the following OSC parameters are.
  {
    id: "osc1_octave",
    panelLabel: "OSC 1 Octave",
    section: "oscillators",
    defaultCC: 74,
    kind: "switchN",
    positions: ["32'", "16'", "8'", "4'"],
    positionValues: [0, 32, 64, 96],
    description:
      "Oscillator 1 octave range. 32' = lowest (one octave below 16'); 4' = highest.",
  },
  {
    id: "osc2_octave",
    panelLabel: "OSC 2 Octave",
    section: "oscillators",
    defaultCC: 75,
    kind: "switchN",
    positions: ["32'", "16'", "8'", "4'"],
    positionValues: [0, 32, 64, 96],
    description: "Oscillator 2 octave range. Same scale as OSC 1.",
  },
  {
    id: "osc2_frequency",
    panelLabel: "OSC 2 Frequency",
    section: "oscillators",
    defaultCC: 12,
    kind: "bipolar14",
    description:
      "OSC 2 fine-tune relative to OSC 1. 14-bit resolution. Value -1.0 = maximum flat detune; 0.0 = unison with OSC 1; +1.0 = maximum sharp detune (approx ±7 semitones).",
  },
  {
    id: "osc2_sync",
    panelLabel: "OSC 2 Hard Sync",
    section: "oscillators",
    defaultCC: 77,
    kind: "switch2",
    onValue: 64,
    description:
      "Hard sync OSC 2 to OSC 1. When on, OSC 2 restarts its cycle each time OSC 1 completes one. Creates harmonically rich, biting tones when OSC 2 is detuned above OSC 1.",
  },

  // ============ PERFORMANCE — wheels, glide, transpose ============
  {
    id: "mod_wheel",
    panelLabel: "Mod Wheel",
    section: "performance",
    kind: "modWheel",
    description:
      "Modulation wheel — CC1. On the Grandmother, routes to the mod destination configured on the panel (LFO → pitch or filter).",
  },
  {
    id: "pitch_wheel",
    panelLabel: "Pitch Wheel",
    section: "performance",
    kind: "pitchWheel",
    description:
      "Pitch bend — 14-bit MIDI Pitch Bend. Range is configurable via pitch_bend_up / pitch_bend_down CCs.",
  },
  {
    id: "mod_rate",
    panelLabel: "Modulation Rate",
    section: "performance",
    defaultCC: 3,
    kind: "continuous14",
    description:
      "LFO / modulation rate. 14-bit resolution. 0.0 = slowest; 1.0 = fastest. Note: the physical RATE knob on the panel overrides this when moved.",
  },
  {
    id: "glide_rate",
    panelLabel: "Glide",
    section: "performance",
    defaultCC: 5,
    kind: "continuous14",
    description:
      "Portamento time between notes. 14-bit resolution. 0.0 = instant; 1.0 = very slow glide. Combine with glide_on.",
  },
  {
    id: "glide_on",
    panelLabel: "Glide On/Off",
    section: "performance",
    defaultCC: 65,
    kind: "switch2",
    onValue: 64,
    description: "Enable portamento (glide) between notes.",
  },
  {
    id: "glide_type",
    panelLabel: "Glide Type",
    section: "performance",
    defaultCC: 85,
    kind: "switchN",
    positions: ["LCR", "LCT", "Exponential"],
    positionValues: [0, 43, 85],
    description:
      "Glide curve shape. LCR = linear constant-rate (same time between any two notes); LCT = linear constant-time; Exponential = fast start, slow finish.",
  },
  {
    id: "legato_glide",
    panelLabel: "Legato Glide",
    section: "performance",
    defaultCC: 94,
    kind: "switch2",
    onValue: 64,
    description:
      "When on, glide only activates for legato notes (new note played before previous one is released). Off = glide on every note transition.",
  },
  {
    id: "gated_glide",
    panelLabel: "Gated Glide",
    section: "performance",
    defaultCC: 103,
    kind: "switch2",
    onValue: 64,
    description:
      "When on, glide only operates while a note is held (gated). Off = continuous glide behavior.",
  },
  {
    id: "keyboard_octave",
    panelLabel: "Keyboard Octave",
    section: "performance",
    defaultCC: 89,
    kind: "switchN",
    positions: ["-2", "-1", "0", "+1", "+2"],
    positionValues: [0, 26, 51, 77, 102],
    description:
      "Transpose the keyboard by octave. 0 = nominal pitch; ±1/±2 = one or two octaves up or down.",
  },
  {
    id: "keyboard_transpose",
    panelLabel: "Keyboard Transpose",
    section: "performance",
    defaultCC: 119,
    kind: "continuous",
    description:
      "Semitone transpose of the keyboard. CC value 0 = −12 semitones; ~62 = 0 semitones; 123 = +12 semitones. Use 0.5 as value for no transpose.",
  },
  {
    id: "pitch_bend_up",
    panelLabel: "Pitch Bend Up Range",
    section: "performance",
    defaultCC: 107,
    kind: "continuous",
    description:
      "Maximum upward pitch bend range in semitones (0–24). CC value 0 = 0 semitones; 127 = 24 semitones. 0.17 ≈ 2 semitones (typical).",
  },
  {
    id: "pitch_bend_down",
    panelLabel: "Pitch Bend Down Range",
    section: "performance",
    defaultCC: 108,
    kind: "continuous",
    description:
      "Maximum downward pitch bend range in semitones (0–24). Same scale as pitch_bend_up.",
  },

  // ============ SEQUENCER / ARPEGGIATOR ============
  {
    id: "arp_rate",
    panelLabel: "Arp/Seq Rate",
    section: "sequencer",
    defaultCC: 8,
    kind: "continuous14",
    description:
      "Arpeggiator / sequencer rate (internal clock). 14-bit resolution. 0.0 = slowest; 1.0 = fastest. Ignored when synced to MIDI clock.",
  },
  {
    id: "arp_hold",
    panelLabel: "Arp/Seq Hold",
    section: "sequencer",
    defaultCC: 69,
    kind: "switch2",
    onValue: 64,
    description:
      "Latch / hold the arpeggiator — keeps the current note set running without keys held.",
  },
  {
    id: "arp_play",
    panelLabel: "Arp/Seq Play",
    section: "sequencer",
    defaultCC: 73,
    kind: "switch2",
    onValue: 64,
    description: "Start (on) or stop (off) the arpeggiator / sequencer.",
  },
  {
    id: "arp_mode",
    panelLabel: "Arp/Seq Mode",
    section: "sequencer",
    defaultCC: 91,
    kind: "switchN",
    positions: ["Arp", "Seq", "Rec"],
    positionValues: [0, 43, 85],
    description:
      "Arp = arpeggiator; Seq = sequencer playback; Rec = sequencer record mode.",
  },
  {
    id: "arp_pattern",
    panelLabel: "Arp Pattern",
    section: "sequencer",
    defaultCC: 92,
    kind: "switchN",
    positions: ["Ordered", "Fwd-Bkwd", "Random"],
    positionValues: [0, 43, 85],
    description:
      "Arpeggiator note order. Ordered = ascending; Fwd-Bkwd = up then down; Random = shuffled.",
  },
  {
    id: "arp_range",
    panelLabel: "Arp Range",
    section: "sequencer",
    defaultCC: 93,
    kind: "switchN",
    positions: ["1", "2", "3"],
    positionValues: [0, 43, 85],
    description: "Arpeggiator octave range: 1, 2, or 3 octaves.",
  },
  {
    id: "arp_clock_div",
    panelLabel: "Arp/Seq Clock Division",
    section: "sequencer",
    defaultCC: 90,
    kind: "continuous",
    description:
      "Clock division for the arpeggiator/sequencer when synced to MIDI clock. 0.0 = whole notes; 1.0 = fastest subdivision. Exact division steps depend on firmware.",
  },
];
