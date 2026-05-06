/**
 * Moog Matriarch — MIDI Control Surface Definition
 *
 * The Matriarch is a 4-voice paraphonic semi-modular analog synthesizer.
 * Like the Grandmother, its core analog signal path (filter, envelopes,
 * mixer) uses physical pots that are NOT MIDI-controllable. The MIDI
 * implementation covers oscillator tuning, arp/seq, delay, and
 * performance parameters.
 *
 * MIDI implementation source: Moog Matriarch User Manual, Appendix A,
 * and official Moog Matriarch MIDI Documentation PDF.
 *
 * All CCs are 7-bit (0–127). No 14-bit pairs.
 * Switch semantics: 0–63 = off, 64–127 = on.
 * Default MIDI channel: 1 (configurable in Global Settings).
 * MIDI ports: 5-pin DIN IN / OUT + USB.
 */

import type { ControlSpec } from "./model-d.js";
export type { ControlSpec };
export { normalizedToCC, positionToCC } from "./model-d.js";

export const SECTIONS: readonly string[] = [
  "oscillators",
  "delay",
  "performance",
  "sequencer",
];

export const CONTROL_SURFACE: ControlSpec[] = [
  // ============ OSCILLATORS ============
  // OSC1 has no MIDI fine-tune (it tracks the keyboard).
  // OSC 2–4 can be detuned relative to OSC 1.
  {
    id: "osc1_octave",
    panelLabel: "OSC 1 Octave",
    section: "oscillators",
    defaultCC: 74,
    kind: "switchN",
    positions: ["32'", "16'", "8'", "4'"],
    positionValues: [0, 32, 64, 96],
    description: "Oscillator 1 octave range. 32' = lowest; 4' = highest.",
  },
  {
    id: "osc2_octave",
    panelLabel: "OSC 2 Octave",
    section: "oscillators",
    defaultCC: 75,
    kind: "switchN",
    positions: ["32'", "16'", "8'", "4'"],
    positionValues: [0, 32, 64, 96],
    description: "Oscillator 2 octave range.",
  },
  {
    id: "osc3_octave",
    panelLabel: "OSC 3 Octave",
    section: "oscillators",
    defaultCC: 76,
    kind: "switchN",
    positions: ["32'", "16'", "8'", "4'"],
    positionValues: [0, 32, 64, 96],
    description: "Oscillator 3 octave range.",
  },
  {
    id: "osc4_octave",
    panelLabel: "OSC 4 Octave",
    section: "oscillators",
    defaultCC: 77,
    kind: "switchN",
    positions: ["32'", "16'", "8'", "4'"],
    positionValues: [0, 32, 64, 96],
    description: "Oscillator 4 octave range.",
  },
  {
    id: "osc2_frequency",
    panelLabel: "OSC 2 Frequency",
    section: "oscillators",
    defaultCC: 16,
    kind: "continuous",
    description:
      "OSC 2 fine-tune relative to OSC 1. CC value 64 = unison; below 64 = flat; above 64 = sharp (approx ±7 semitones).",
  },
  {
    id: "osc3_frequency",
    panelLabel: "OSC 3 Frequency",
    section: "oscillators",
    defaultCC: 17,
    kind: "continuous",
    description:
      "OSC 3 fine-tune relative to OSC 1. CC value 64 = unison. Use 0.5 as value for unison.",
  },
  {
    id: "osc4_frequency",
    panelLabel: "OSC 4 Frequency",
    section: "oscillators",
    defaultCC: 18,
    kind: "continuous",
    description:
      "OSC 4 fine-tune relative to OSC 1. CC value 64 = unison. Use 0.5 as value for unison.",
  },
  {
    id: "hard_sync",
    panelLabel: "Hard Sync On/Off",
    section: "oscillators",
    defaultCC: 80,
    kind: "switch2",
    onValue: 64,
    description:
      "Master hard sync toggle. When on, OSC 2–4 sync to OSC 1, creating harmonically rich timbres when detuned.",
  },
  {
    id: "osc2_sync",
    panelLabel: "OSC 2 Sync",
    section: "oscillators",
    defaultCC: 81,
    kind: "switch2",
    onValue: 64,
    description: "Sync OSC 2 to OSC 1 independently.",
  },
  {
    id: "osc3_sync",
    panelLabel: "OSC 3 Sync",
    section: "oscillators",
    defaultCC: 82,
    kind: "switch2",
    onValue: 64,
    description: "Sync OSC 3 to OSC 1 independently.",
  },
  {
    id: "osc4_sync",
    panelLabel: "OSC 4 Sync",
    section: "oscillators",
    defaultCC: 83,
    kind: "switch2",
    onValue: 64,
    description: "Sync OSC 4 to OSC 1 independently.",
  },
  {
    id: "noise_filter_cutoff",
    panelLabel: "Noise Filter Cutoff",
    section: "oscillators",
    defaultCC: 9,
    kind: "continuous",
    description:
      "Cutoff of the dedicated noise filter (separate from the main ladder filter). Shapes the noise color before it enters the mixer.",
  },
  {
    id: "para_voice_mode",
    panelLabel: "Para Voice Mode",
    section: "oscillators",
    defaultCC: 94,
    kind: "switchN",
    positions: ["Mono", "Duo", "Trio", "Para"],
    positionValues: [0, 42, 85, 127],
    description:
      "Paraphonic voice allocation. Mono = all 4 OSCs play the same note; Duo = 2 pairs; Trio = 3 voices; Para = 4 independent voices sharing one filter.",
  },
  {
    id: "multi_trig",
    panelLabel: "Multi Trig",
    section: "oscillators",
    defaultCC: 95,
    kind: "switch2",
    onValue: 64,
    description:
      "Multi-trigger mode. When on, the envelope re-triggers on every note even in legato playing. When off, legato notes share the running envelope.",
  },

  // ============ DELAY ============
  {
    id: "delay_time",
    panelLabel: "Delay Time",
    section: "delay",
    defaultCC: 12,
    kind: "continuous",
    description:
      "Stereo BBD analog delay time. 0.0 = shortest (slapback); 1.0 = longest echo. Use delay_sync to lock to MIDI clock.",
  },
  {
    id: "delay_spacing",
    panelLabel: "Delay Spacing",
    section: "delay",
    defaultCC: 13,
    kind: "continuous",
    description:
      "Time difference between the left and right delay channels. 0.0 = identical (mono); higher values widen the stereo image.",
  },
  {
    id: "delay_ping_pong",
    panelLabel: "Delay Ping Pong",
    section: "delay",
    defaultCC: 88,
    kind: "switch2",
    onValue: 64,
    description:
      "Ping-pong delay mode. When on, delay repeats alternate between left and right outputs.",
  },
  {
    id: "delay_sync",
    panelLabel: "Delay Sync",
    section: "delay",
    defaultCC: 89,
    kind: "switch2",
    onValue: 64,
    description: "Lock delay time to incoming MIDI clock.",
  },

  // ============ PERFORMANCE — wheels, glide, transpose ============
  {
    id: "mod_wheel",
    panelLabel: "Mod Wheel",
    section: "performance",
    kind: "modWheel",
    description:
      "Modulation wheel — CC1. Routes to the mod destination configured on the panel.",
  },
  {
    id: "pitch_wheel",
    panelLabel: "Pitch Wheel",
    section: "performance",
    kind: "pitchWheel",
    description: "Pitch bend — 14-bit MIDI Pitch Bend.",
  },
  {
    id: "mod_rate",
    panelLabel: "Modulation Rate",
    section: "performance",
    defaultCC: 3,
    kind: "continuous",
    description:
      "LFO / modulation rate. 0.0 = slowest; 1.0 = fastest. May be overridden by the physical RATE knob.",
  },
  {
    id: "glide_rate",
    panelLabel: "Glide",
    section: "performance",
    defaultCC: 5,
    kind: "continuous",
    description:
      "Portamento time. 0.0 = instant; 1.0 = slowest. Combine with glide_on.",
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
      "Glide curve. LCR = linear constant-rate; LCT = linear constant-time; Exponential = fast then slow.",
  },
  {
    id: "gated_glide",
    panelLabel: "Gated Glide",
    section: "performance",
    defaultCC: 86,
    kind: "switch2",
    onValue: 64,
    description:
      "Gated glide: portamento only while a note is held.",
  },
  {
    id: "square_lfo_polarity",
    panelLabel: "Square LFO Polarity",
    section: "performance",
    defaultCC: 90,
    kind: "switch2",
    onValue: 64,
    description:
      "Toggles the square LFO between unipolar (0 to +peak) and bipolar (−peak to +peak) modes.",
  },
  {
    id: "sustain_pedal",
    panelLabel: "Sustain Pedal",
    section: "performance",
    defaultCC: 64,
    kind: "switch2",
    onValue: 64,
    description:
      "Sustain pedal (MIDI standard CC64). Holds notes while active.",
  },
  {
    id: "keyboard_octave",
    panelLabel: "Keyboard Octave",
    section: "performance",
    defaultCC: 89,
    kind: "switchN",
    positions: ["-2", "-1", "0", "+1", "+2"],
    positionValues: [0, 26, 51, 77, 102],
    description: "Transpose the keyboard by octave (−2 to +2).",
  },
  {
    id: "pitch_bend_up",
    panelLabel: "Pitch Bend Up Range",
    section: "performance",
    defaultCC: 107,
    kind: "continuous",
    description:
      "Maximum upward pitch bend in semitones (0–24). CC 127 = 24 semitones.",
  },
  {
    id: "pitch_bend_down",
    panelLabel: "Pitch Bend Down Range",
    section: "performance",
    defaultCC: 108,
    kind: "continuous",
    description: "Maximum downward pitch bend in semitones (0–24).",
  },
  {
    id: "keyboard_transpose",
    panelLabel: "Keyboard Transpose",
    section: "performance",
    defaultCC: 119,
    kind: "continuous",
    description:
      "Semitone transpose. CC 0 = −12 st; ~62 = 0 st; 123 = +12 st. Use value 0.5 for no transpose.",
  },

  // ============ SEQUENCER / ARPEGGIATOR ============
  {
    id: "arp_rate",
    panelLabel: "Arp/Seq Rate",
    section: "sequencer",
    defaultCC: 8,
    kind: "continuous",
    description:
      "Arpeggiator / sequencer internal clock rate. 0.0 = slowest; 1.0 = fastest.",
  },
  {
    id: "arp_swing",
    panelLabel: "Arp/Seq Swing",
    section: "sequencer",
    defaultCC: 14,
    kind: "continuous",
    description:
      "Swing amount. CC value 64 = no swing (straight); above 64 = increasing swing. Use value 0.5 for no swing.",
  },
  {
    id: "arp_gate_length",
    panelLabel: "Arp Gate Length",
    section: "sequencer",
    defaultCC: 15,
    kind: "continuous",
    description:
      "Arpeggiator / sequencer gate length as percentage of step. 0.0 = very short; 1.0 = full legato.",
  },
  {
    id: "arp_latch",
    panelLabel: "Arp/Seq Latch",
    section: "sequencer",
    defaultCC: 69,
    kind: "switch2",
    onValue: 64,
    description:
      "Latch the arpeggiator so it keeps running after keys are released.",
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
      "Arp = arpeggiator; Seq = sequencer playback; Rec = sequencer record.",
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
      "Arpeggiator note order. Ordered = ascending; Fwd-Bkwd = up/down; Random = shuffled.",
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
];
