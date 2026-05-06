/**
 * Moog Messenger (2025) — MIDI Control Surface Definition
 *
 * The Messenger is a fully programmable monophonic analog synthesizer
 * (duophonic in firmware ≥ 1.1). Unlike the Grandmother/Matriarch, ALL
 * panel controls are MIDI-accessible.
 *
 * MIDI implementation source: Moog Messenger User Manual, Appendix A
 * (pages 34–37). Firmware v1.0.8 added a toggle for 14-bit CC mode;
 * by default 14-bit is ON.
 *
 * CC architecture:
 *   - CC 1–31  = 14-bit MSBs (resolution 0–16383).
 *     LSBs sent on CC 33–63 (= MSB CC + 32), standard MIDI convention.
 *   - CC 52–83, 114–118 = 7-bit switch / mode parameters.
 *     NOTE: CC 52–63 are also the LSBs for the 14-bit pair of CC 20–31.
 *     The Messenger disambiguates by context (MSB preceding = 14-bit LSB;
 *     standalone = switch CC). Send 14-bit pairs promptly to avoid ambiguity.
 *
 * Bipolar 14-bit params (center = 8192): OSC Tune (CC 10), OSC 2 Freq (CC 12).
 * Waveshape 14-bit params morph continuously; see individual descriptions.
 *
 * Default MIDI channel: 1 (configurable in Settings → MIDI).
 * MIDI ports: 5-pin DIN IN/OUT (no thru) + USB-C.
 * 14-bit mode can be toggled via Settings → MIDI → 14-bit CC (firmware 1.0.8+).
 */

import type { ControlSpec } from "./model-d.js";
export type { ControlSpec };
export { normalizedToCC, positionToCC } from "./model-d.js";

export const SECTIONS: readonly string[] = [
  "oscillators",
  "mixer",
  "filter",
  "envelopes",
  "lfo",
  "performance",
  "sequencer",
];

export const CONTROL_SURFACE: ControlSpec[] = [
  // ============ OSCILLATORS ============
  {
    id: "osc_tune",
    panelLabel: "OSC Tune",
    section: "oscillators",
    defaultCC: 10,
    kind: "bipolar14",
    description:
      "Master tuning offset for both oscillators. 14-bit. Value 0.0 = −max detune; 0.5 = concert pitch; 1.0 = +max detune. Use 0.5 for standard tuning.",
  },
  {
    id: "osc1_waveshape",
    panelLabel: "OSC 1 Waveshape",
    section: "oscillators",
    defaultCC: 9,
    kind: "continuous14",
    description:
      "OSC 1 waveform morph. 14-bit. Below center: triangle wave-folding (0.0 = maximum fold); 0.25 = pure triangle; 0.5 = sawtooth; 1.0 = square/pulse. Wave-folding adds upper harmonics without a filter.",
  },
  {
    id: "osc1_octave",
    panelLabel: "OSC 1 Octave",
    section: "oscillators",
    defaultCC: 57,
    kind: "switchN",
    positions: ["16'", "8'", "4'"],
    description: "Oscillator 1 octave range. 16' = lowest; 4' = highest.",
  },
  {
    id: "osc1_level",
    panelLabel: "OSC 1 Level",
    section: "oscillators",
    defaultCC: 15,
    kind: "continuous14",
    description: "OSC 1 level in the mixer. 14-bit.",
  },
  {
    id: "osc2_freq",
    panelLabel: "OSC 2 Freq",
    section: "oscillators",
    defaultCC: 12,
    kind: "bipolar14",
    description:
      "OSC 2 fine-tune relative to OSC 1. 14-bit bipolar. Value 0.5 = unison; below = flat detune; above = sharp detune (approx ±7 semitones).",
  },
  {
    id: "osc2_waveshape",
    panelLabel: "OSC 2 Waveshape",
    section: "oscillators",
    defaultCC: 14,
    kind: "continuous14",
    description:
      "OSC 2 waveform morph. Same morphing range as OSC 1: wave-fold → triangle → sawtooth → square. 14-bit.",
  },
  {
    id: "osc2_octave",
    panelLabel: "OSC 2 Octave",
    section: "oscillators",
    defaultCC: 58,
    kind: "switchN",
    positions: ["16'", "8'", "4'"],
    description: "Oscillator 2 octave range.",
  },
  {
    id: "osc2_level",
    panelLabel: "OSC 2 Level",
    section: "oscillators",
    defaultCC: 16,
    kind: "continuous14",
    description: "OSC 2 level in the mixer. 14-bit.",
  },
  {
    id: "osc_sync",
    panelLabel: "OSC 2→1 Sync",
    section: "oscillators",
    defaultCC: 59,
    kind: "switch2",
    onValue: 64,
    description:
      "Hard sync OSC 2 to OSC 1. When on, OSC 2 resets each OSC 1 cycle, creating metallic overtones when OSC 2 is detuned above OSC 1.",
  },
  {
    id: "osc_mod_amount",
    panelLabel: "OSC Mod Amount",
    section: "oscillators",
    defaultCC: 13,
    kind: "continuous14",
    description:
      "Amount of modulation applied to the oscillators (LFO or cross-mod depending on osc_mod_destination). 14-bit.",
  },
  {
    id: "osc_mod_destination",
    panelLabel: "OSC Mod Destination",
    section: "oscillators",
    defaultCC: 54,
    kind: "switchN",
    positions: ["Pitch", "Filter", "Pitch+Filter"],
    description:
      "Where OSC mod is routed: pitch FM, filter FM, or both simultaneously.",
  },

  // ============ MIXER ============
  {
    id: "sub_osc_level",
    panelLabel: "Sub OSC Level",
    section: "mixer",
    defaultCC: 17,
    kind: "continuous14",
    description:
      "Level of the sub-oscillator (derived from OSC 1, one octave below). 14-bit.",
  },
  {
    id: "sub_osc_waveshape",
    panelLabel: "Sub OSC Waveshape",
    section: "mixer",
    defaultCC: 53,
    kind: "continuous",
    description:
      "Sub-oscillator waveform morph. 0.0 = triangle; 0.5 = sine-like; 1.0 = square. Adds fundamental weight.",
  },
  {
    id: "noise_level",
    panelLabel: "Noise Level",
    section: "mixer",
    defaultCC: 8,
    kind: "continuous14",
    description: "Noise generator level in the mixer. 14-bit.",
  },
  {
    id: "fb_ext_level",
    panelLabel: "FB/Ext In Level",
    section: "mixer",
    defaultCC: 18,
    kind: "continuous14",
    description:
      "Level of the feedback path or external audio input into the filter. High values drive the ladder filter into saturation. 14-bit.",
  },
  {
    id: "master_volume",
    panelLabel: "Master Volume",
    section: "mixer",
    defaultCC: 7,
    kind: "continuous14",
    description: "Master output volume. 14-bit.",
  },

  // ============ FILTER ============
  {
    id: "filter_cutoff",
    panelLabel: "Filter Cutoff",
    section: "filter",
    defaultCC: 19,
    kind: "continuous14",
    description:
      "Moog ladder filter cutoff frequency. 14-bit. 0.0 = fully closed (dark/muffled); 1.0 = fully open (bright). The signature Moog sound.",
  },
  {
    id: "filter_resonance",
    panelLabel: "Filter Resonance",
    section: "filter",
    defaultCC: 21,
    kind: "continuous14",
    description:
      "Filter resonance (emphasis). 14-bit. Accentuates frequencies near cutoff. High values produce a nasal, whistling tone. The Messenger includes resonance bass compensation.",
  },
  {
    id: "filter_eg_amount",
    panelLabel: "Filter EG Amount",
    section: "filter",
    defaultCC: 22,
    kind: "continuous14",
    description:
      "How much the filter envelope sweeps the cutoff. 14-bit. 0.0 = no sweep; 1.0 = full sweep from closed to open.",
  },
  {
    id: "filter_mode",
    panelLabel: "Filter Mode",
    section: "filter",
    defaultCC: 78,
    kind: "switchN",
    positions: ["LP 12", "LP 24", "HP 12", "HP 24", "BP 12"],
    description:
      "Filter topology. LP = low-pass (classic Moog); HP = high-pass; BP = band-pass. 12dB/oct = gentler slope; 24dB/oct = steeper (the classic Moog ladder voice).",
  },
  {
    id: "filter_kb_tracking",
    panelLabel: "Filter KB Tracking",
    section: "filter",
    defaultCC: 60,
    kind: "switchN",
    positions: ["Off", "Half", "Full"],
    description:
      "How much the filter cutoff tracks keyboard pitch. Off = static cutoff; Half = partial tracking; Full = cutoff rises with pitch to maintain timbre across the keyboard.",
  },
  {
    id: "filter_res_bass",
    panelLabel: "Filter Res Bass",
    section: "filter",
    defaultCC: 61,
    kind: "switch2",
    onValue: 64,
    description:
      "Resonance bass compensation (RES BASS). When on, compensates for bass roll-off that occurs at high resonance settings, keeping the low end full.",
  },
  {
    id: "osc2_cutoff_amount",
    panelLabel: "OSC 2 Cutoff Amount",
    section: "filter",
    defaultCC: 20,
    kind: "continuous14",
    description:
      "Amount OSC 2 frequency-modulates the filter cutoff (audio-rate filter FM). 14-bit. Creates metallic or formant-like timbres at high settings.",
  },
  {
    id: "filter_env_velocity",
    panelLabel: "F ENV Velocity",
    section: "filter",
    defaultCC: 62,
    kind: "switch2",
    onValue: 64,
    description:
      "When on, note velocity scales the filter envelope amount — harder playing opens the filter more.",
  },

  // ============ ENVELOPES ============
  {
    id: "filter_eg_attack",
    panelLabel: "Filter EG Attack",
    section: "envelopes",
    defaultCC: 23,
    kind: "continuous14",
    description:
      "Filter envelope attack time. 14-bit. 0.0 = instant; 1.0 = very slow rise. Good for filter sweeps on pads.",
  },
  {
    id: "filter_eg_decay",
    panelLabel: "Filter EG Decay",
    section: "envelopes",
    defaultCC: 24,
    kind: "continuous14",
    description:
      "Filter envelope decay time — how fast the filter falls from its attack peak to the sustain level.",
  },
  {
    id: "filter_eg_sustain",
    panelLabel: "Filter EG Sustain",
    section: "envelopes",
    defaultCC: 25,
    kind: "continuous14",
    description:
      "Filter envelope sustain level (0.0–1.0). The cutoff offset maintained while a note is held.",
  },
  {
    id: "filter_eg_release",
    panelLabel: "Filter EG Release",
    section: "envelopes",
    defaultCC: 26,
    kind: "continuous14",
    description:
      "Filter envelope release time — how fast the filter closes after a note is released.",
  },
  {
    id: "filter_env_loop",
    panelLabel: "F ENV Loop",
    section: "envelopes",
    defaultCC: 79,
    kind: "switch2",
    onValue: 64,
    description:
      "Loop the filter envelope: when the decay reaches sustain, it restarts from the attack — creates a cyclic filter sweep without holding a note.",
  },
  {
    id: "amp_eg_attack",
    panelLabel: "Amp EG Attack",
    section: "envelopes",
    defaultCC: 28,
    kind: "continuous14",
    description:
      "Amplitude envelope attack time. 14-bit. 0.0 = instant (percussive); 1.0 = slow swell (pads).",
  },
  {
    id: "amp_eg_decay",
    panelLabel: "Amp EG Decay",
    section: "envelopes",
    defaultCC: 29,
    kind: "continuous14",
    description:
      "Amplitude envelope decay time after the attack peak.",
  },
  {
    id: "amp_eg_sustain",
    panelLabel: "Amp EG Sustain",
    section: "envelopes",
    defaultCC: 30,
    kind: "continuous14",
    description:
      "Amplitude envelope sustain level — the volume maintained while a note is held.",
  },
  {
    id: "amp_eg_release",
    panelLabel: "Amp EG Release",
    section: "envelopes",
    defaultCC: 31,
    kind: "continuous14",
    description:
      "Amplitude envelope release time — how fast the note fades after release.",
  },
  {
    id: "amp_env_loop",
    panelLabel: "A ENV Loop",
    section: "envelopes",
    defaultCC: 80,
    kind: "switch2",
    onValue: 64,
    description:
      "Loop the amp envelope: creates a rhythmic volume pulse effect. Combine with filter_env_loop for complex evolving textures.",
  },
  {
    id: "amp_env_velocity",
    panelLabel: "A ENV Velocity",
    section: "envelopes",
    defaultCC: 63,
    kind: "switch2",
    onValue: 64,
    description:
      "When on, note velocity scales the amplitude envelope amount — harder playing produces louder notes.",
  },

  // ============ LFO ============
  {
    id: "lfo1_rate",
    panelLabel: "LFO 1 Rate",
    section: "lfo",
    defaultCC: 3,
    kind: "continuous14",
    description:
      "LFO 1 rate. 14-bit. 0.0 = very slow (sub-Hz); 1.0 = up to audio rate (1.2 kHz) if firmware unlocked — creates FM-like tones.",
  },
  {
    id: "lfo1_depth",
    panelLabel: "LFO 1 Depth",
    section: "lfo",
    defaultCC: 4,
    kind: "continuous14",
    description:
      "LFO 1 modulation depth. 14-bit. Controls the intensity of the LFO effect on its destination.",
  },
  {
    id: "lfo1_waveshape",
    panelLabel: "LFO 1 Waveshape",
    section: "lfo",
    defaultCC: 71,
    kind: "switchN",
    positions: ["Triangle", "Square", "Ramp Up", "Ramp Down", "S&H"],
    description:
      "LFO 1 waveform. Triangle = smooth; Square = stepped; Ramp Up/Down = one-directional; S&H = random stepped (sample-and-hold).",
  },
  {
    id: "lfo1_destination",
    panelLabel: "LFO 1 Destination",
    section: "lfo",
    defaultCC: 72,
    kind: "switchN",
    positions: ["Pitch", "Filter", "Amp", "Pitch+Filter"],
    description:
      "Where LFO 1 is routed. Pitch = vibrato; Filter = tremolo-filter; Amp = tremolo; Pitch+Filter = both.",
  },
  {
    id: "lfo_kb_reset",
    panelLabel: "LFO KB Reset",
    section: "lfo",
    defaultCC: 74,
    kind: "switch2",
    onValue: 64,
    description:
      "When on, LFO resets to the start of its cycle on each new note — ensures consistent LFO phase for rhythmic patterns.",
  },
  {
    id: "lfo_sync",
    panelLabel: "LFO Sync",
    section: "lfo",
    defaultCC: 75,
    kind: "switch2",
    onValue: 64,
    description:
      "Sync LFO 1 rate to incoming MIDI clock.",
  },
  {
    id: "lfo2_rate",
    panelLabel: "LFO 2 Rate",
    section: "lfo",
    defaultCC: 27,
    kind: "continuous14",
    description:
      "LFO 2 rate (triangle wave only). 14-bit. LFO 2 is a dedicated performance LFO routed via lfo2_pitch / lfo2_cutoff / lfo2_amp.",
  },
  {
    id: "lfo2_pitch",
    panelLabel: "LFO 2 → Pitch",
    section: "lfo",
    defaultCC: 116,
    kind: "switch2",
    onValue: 64,
    description: "Route LFO 2 to oscillator pitch (vibrato).",
  },
  {
    id: "lfo2_cutoff",
    panelLabel: "LFO 2 → Cutoff",
    section: "lfo",
    defaultCC: 117,
    kind: "switch2",
    onValue: 64,
    description: "Route LFO 2 to filter cutoff (wah/filter wobble).",
  },
  {
    id: "lfo2_amp",
    panelLabel: "LFO 2 → Amp",
    section: "lfo",
    defaultCC: 118,
    kind: "switch2",
    onValue: 64,
    description: "Route LFO 2 to amplitude (tremolo).",
  },

  // ============ PERFORMANCE ============
  {
    id: "mod_wheel",
    panelLabel: "Mod Wheel",
    section: "performance",
    kind: "modWheel",
    description:
      "Modulation wheel — CC1 (14-bit with CC33 LSB). Destination configurable on the Messenger.",
  },
  {
    id: "pitch_wheel",
    panelLabel: "Pitch Wheel",
    section: "performance",
    kind: "pitchWheel",
    description:
      "Pitch bend — 14-bit MIDI Pitch Bend. Range set via pitch_bend_up / pitch_bend_down (±2 semitones by default).",
  },
  {
    id: "glide_rate",
    panelLabel: "Glide Rate",
    section: "performance",
    defaultCC: 5,
    kind: "continuous14",
    description:
      "Portamento time. 14-bit. 0.0 = instant; 1.0 = slowest glide. Combine with glide_on.",
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
    id: "hold",
    panelLabel: "Hold",
    section: "performance",
    defaultCC: 55,
    kind: "switch2",
    onValue: 64,
    description: "Hold currently pressed notes without sustaining new ones.",
  },
  {
    id: "sustain_pedal",
    panelLabel: "Sustain Pedal",
    section: "performance",
    defaultCC: 52,
    kind: "switch2",
    onValue: 64,
    description:
      "Sustain pedal input. Note: CC 52 is also the LSB for the osc2_cutoff_amount 14-bit pair — send them as a pair, not standalone, to avoid ambiguity.",
  },
  {
    id: "expression_pedal",
    panelLabel: "Expression Pedal",
    section: "performance",
    defaultCC: 11,
    kind: "continuous14",
    description:
      "Expression pedal input (CC11). 14-bit. Destination assignable on the Messenger.",
  },
  {
    id: "multi_trig",
    panelLabel: "Multi Trig",
    section: "performance",
    defaultCC: 114,
    kind: "switch2",
    onValue: 64,
    description:
      "Multi-trigger: when on, envelope re-triggers on every new note. When off, legato notes share the running envelope (single-trigger).",
  },
  {
    id: "pitch_bend_up",
    panelLabel: "Pitch Bend Up Amount",
    section: "performance",
    defaultCC: 76,
    kind: "continuous",
    description:
      "Maximum upward pitch bend range in semitones. 0.0 = 0 st; 1.0 = 24 st. Default corresponds to 2 semitones.",
  },
  {
    id: "pitch_bend_down",
    panelLabel: "Pitch Bend Down Amount",
    section: "performance",
    defaultCC: 77,
    kind: "continuous",
    description: "Maximum downward pitch bend range in semitones.",
  },
  {
    id: "kb_octave",
    panelLabel: "KB Octave",
    section: "performance",
    defaultCC: 73,
    kind: "switchN",
    positions: ["-2", "-1", "0", "+1", "+2"],
    positionValues: [0, 26, 51, 77, 102],
    description: "Transpose the keyboard by octave (−2 to +2).",
  },

  // ============ SEQUENCER / ARPEGGIATOR ============
  {
    id: "seq_tempo",
    panelLabel: "Tempo",
    section: "sequencer",
    defaultCC: 2,
    kind: "continuous14",
    description:
      "Internal sequencer / arpeggiator tempo. 14-bit. Ignored when synced to MIDI clock. Higher values = faster.",
  },
];
