/**
 * Moog Model 15 — Control Surface Definition
 *
 * Mirrors the front-panel controls of the Moog Model 15 modular synthesizer
 * app (iOS/macOS). The System 15 is a semi-fixed modular: the modules are
 * always the same (921A driver, three 921B oscillators, 904A/B filters, two
 * 911 envelopes, two 902 VCAs, noise, 960 sequencer), but you patch cables
 * between them in the app.
 *
 * This surface map targets the *standard out-of-the-box patch* — the one that
 * ships with the app: three OSCs into the 904A LP filter into a 902 VCA, with
 * envelope 1 on the filter and envelope 2 on the VCA. Map these CCs once in
 * the app's MIDI Learn panel (Settings → MIDI → MIDI Learn) and save as a
 * preset (e.g. "Claude MCP 15").
 *
 * CC numbering strategy:
 *   - Reuses the same CC for acoustically equivalent controls where possible
 *     (filter_cutoff = 74, resonance = 71, channel volume = 7, etc.) so that
 *     sequences written for one synth roughly translate to the other.
 *   - Avoids reserved CCs: 0, 6, 32, 38, 64, 96–101, 120–127.
 *   - Continuous knobs → 0–127. Switches → 0 = off/first, 127 = on/last.
 */
export const SECTIONS = [
    "oscillators",
    "mixer",
    "filters",
    "envelopes",
    "amplifiers",
    "modulation",
    "sequencer",
    "performance",
];
export const CONTROL_SURFACE = [
    // ============ OSCILLATORS ============
    // 921A Oscillator Driver — sets the master pitch that all 921Bs track.
    {
        id: "driver_frequency",
        panelLabel: "921A Frequency",
        section: "oscillators",
        defaultCC: 20,
        kind: "continuous",
        description: "921A Oscillator Driver master frequency (coarse tune). All three 921B oscillators track this as their base pitch.",
    },
    {
        id: "driver_range",
        panelLabel: "921A Range",
        section: "oscillators",
        defaultCC: 21,
        kind: "switchN",
        positions: ["LO", "32'", "16'", "8'", "4'", "2'"],
        description: "921A octave range. LO = sub-audio (use as master LFO clock). 32'/16'/8'/4'/2' = descending octaves.",
    },
    // 921B Oscillator 1
    {
        id: "osc1_range",
        panelLabel: "Oscillator 1 Range",
        section: "oscillators",
        defaultCC: 22,
        kind: "switchN",
        positions: ["LO", "32'", "16'", "8'", "4'", "2'"],
        description: "921B #1 octave/range switch. LO = sub-audio. 8' is the standard concert-pitch octave.",
    },
    {
        id: "osc1_frequency",
        panelLabel: "Oscillator 1 Frequency",
        section: "oscillators",
        defaultCC: 23,
        kind: "continuous",
        description: "921B #1 fine-tune offset relative to the 921A driver. Center = unison with driver; sweep ±7 semitones.",
    },
    {
        id: "osc1_waveform",
        panelLabel: "Oscillator 1 Waveform",
        section: "oscillators",
        defaultCC: 24,
        kind: "switchN",
        positions: ["triangle", "sawtooth", "square"],
        description: "921B #1 waveform output. Triangle = soft/flute-like; sawtooth = bright/buzzy; square = hollow/reedy.",
    },
    {
        id: "osc1_pulse_width",
        panelLabel: "Oscillator 1 Pulse Width",
        section: "oscillators",
        defaultCC: 25,
        kind: "continuous",
        description: "921B #1 pulse width. Only audible when waveform is set to square. 0.5 = true square; lower/higher = narrow pulse (nasal, thin).",
    },
    // 921B Oscillator 2
    {
        id: "osc2_range",
        panelLabel: "Oscillator 2 Range",
        section: "oscillators",
        defaultCC: 26,
        kind: "switchN",
        positions: ["LO", "32'", "16'", "8'", "4'", "2'"],
        description: "921B #2 octave/range switch.",
    },
    {
        id: "osc2_frequency",
        panelLabel: "Oscillator 2 Frequency",
        section: "oscillators",
        defaultCC: 27,
        kind: "continuous",
        description: "921B #2 fine-tune offset. Slight detune from Osc 1 creates classic Moog chorus/beating.",
    },
    {
        id: "osc2_waveform",
        panelLabel: "Oscillator 2 Waveform",
        section: "oscillators",
        defaultCC: 28,
        kind: "switchN",
        positions: ["triangle", "sawtooth", "square"],
        description: "921B #2 waveform output.",
    },
    {
        id: "osc2_pulse_width",
        panelLabel: "Oscillator 2 Pulse Width",
        section: "oscillators",
        defaultCC: 29,
        kind: "continuous",
        description: "921B #2 pulse width. See osc1_pulse_width.",
    },
    // 921B Oscillator 3
    {
        id: "osc3_range",
        panelLabel: "Oscillator 3 Range",
        section: "oscillators",
        defaultCC: 30,
        kind: "switchN",
        positions: ["LO", "32'", "16'", "8'", "4'", "2'"],
        description: "921B #3 octave/range switch. Set to LO when repurposing Osc 3 as a modulation source.",
    },
    {
        id: "osc3_frequency",
        panelLabel: "Oscillator 3 Frequency",
        section: "oscillators",
        defaultCC: 31,
        kind: "continuous",
        description: "921B #3 fine-tune offset. Detune for chorus, or tune to a harmonic interval.",
    },
    {
        id: "osc3_waveform",
        panelLabel: "Oscillator 3 Waveform",
        section: "oscillators",
        defaultCC: 33, // 32 = Bank Select LSB (reserved)
        kind: "switchN",
        positions: ["triangle", "sawtooth", "square"],
        description: "921B #3 waveform output.",
    },
    {
        id: "osc3_pulse_width",
        panelLabel: "Oscillator 3 Pulse Width",
        section: "oscillators",
        defaultCC: 34,
        kind: "continuous",
        description: "921B #3 pulse width. See osc1_pulse_width.",
    },
    // ============ MIXER ============
    {
        id: "osc1_volume",
        panelLabel: "Oscillator 1 Volume",
        section: "mixer",
        defaultCC: 35,
        kind: "continuous",
        description: "Mixer input level for Oscillator 1 (921B #1).",
    },
    {
        id: "osc2_volume",
        panelLabel: "Oscillator 2 Volume",
        section: "mixer",
        defaultCC: 36,
        kind: "continuous",
        description: "Mixer input level for Oscillator 2 (921B #2).",
    },
    {
        id: "osc3_volume",
        panelLabel: "Oscillator 3 Volume",
        section: "mixer",
        defaultCC: 37,
        kind: "continuous",
        description: "Mixer input level for Oscillator 3 (921B #3).",
    },
    {
        id: "noise_volume",
        panelLabel: "Noise Volume",
        section: "mixer",
        defaultCC: 39, // 38 = Data Entry LSB (reserved)
        kind: "continuous",
        description: "Mixer input level for the noise generator.",
    },
    {
        id: "noise_color",
        panelLabel: "Noise Color",
        section: "mixer",
        defaultCC: 40,
        kind: "switch2",
        description: "Noise generator spectrum. Off = white (flat, hissier); on = pink (−3 dB/octave, warmer/rumbly).",
    },
    {
        id: "ext_input_volume",
        panelLabel: "External Input Volume",
        section: "mixer",
        defaultCC: 41,
        kind: "continuous",
        description: "Level of the external audio input into the mixer. Route back to create feedback through the 904A for self-oscillating textures.",
    },
    // ============ FILTERS ============
    // 904A Low Pass Filter
    {
        id: "lpf_cutoff",
        panelLabel: "904A Filter Cutoff",
        section: "filters",
        defaultCC: 74, // MIDI standard Brightness
        kind: "continuous",
        description: "904A Voltage Controlled Low Pass Filter cutoff frequency. The heart of the Moog sound. Low = dark/muffled; high = bright/open.",
    },
    {
        id: "lpf_emphasis",
        panelLabel: "904A Filter Emphasis (Resonance)",
        section: "filters",
        defaultCC: 71, // MIDI standard Resonance
        kind: "continuous",
        description: "904A filter resonance. Emphasizes frequencies near the cutoff. High values produce a nasal, whistling quality. The 904A self-oscillates near maximum, producing a sine wave at the cutoff frequency.",
    },
    {
        id: "lpf_env_amount",
        panelLabel: "904A Envelope Contour Amount",
        section: "filters",
        defaultCC: 45,
        kind: "continuous",
        description: "How much Envelope 1 modulates the 904A cutoff. 0 = static filter; high = dramatic sweep on each triggered note.",
    },
    {
        id: "lpf_keyboard_tracking",
        panelLabel: "904A Keyboard Tracking",
        section: "filters",
        defaultCC: 42,
        kind: "switchN",
        positions: ["off", "1/3", "2/3", "full"],
        description: "How much keyboard pitch shifts the 904A cutoff. 'full' = filter tracks pitch 1:1, keeping timbre consistent across the keyboard. 'off' = filter is independent of pitch.",
    },
    // 904B High Pass Filter
    {
        id: "hpf_cutoff",
        panelLabel: "904B Filter Cutoff",
        section: "filters",
        defaultCC: 60,
        kind: "continuous",
        description: "904B Voltage Controlled High Pass Filter cutoff frequency. Removes low frequencies. Useful for thinning out bass-heavy patches or creating telephone/radio effects.",
    },
    // 904C Filter Coupler
    {
        id: "coupler_balance",
        panelLabel: "904C Coupler Balance",
        section: "filters",
        defaultCC: 61,
        kind: "continuous",
        description: "904C Filter Coupler balance between the 904A low-pass and 904B high-pass outputs. Center = band-pass response; extremes = pure LP or pure HP.",
    },
    // ============ ENVELOPES ============
    // 911 Envelope Generator 1 — typically patched to the filter (904A CV input)
    {
        id: "env1_attack",
        panelLabel: "Envelope 1 Attack",
        section: "envelopes",
        defaultCC: 46,
        kind: "continuous",
        description: "911 #1 attack time. In the standard patch this shapes the filter sweep. 0 = instant; max = very slow rise. Short attack = percussive; long = swelling pad.",
    },
    {
        id: "env1_decay",
        panelLabel: "Envelope 1 Decay",
        section: "envelopes",
        defaultCC: 47,
        kind: "continuous",
        description: "911 #1 decay time. Time to fall from peak to sustain level after the attack completes.",
    },
    {
        id: "env1_sustain",
        panelLabel: "Envelope 1 Sustain",
        section: "envelopes",
        defaultCC: 48,
        kind: "continuous",
        description: "911 #1 sustain level. The contour height held while a gate is open (key held). 0 = fully decays; max = no decay.",
    },
    {
        id: "env1_release",
        panelLabel: "Envelope 1 Release",
        section: "envelopes",
        defaultCC: 49,
        kind: "continuous",
        description: "911 #1 release time. How long the filter sweep tail lasts after the gate closes (key released). Long release = lingering filter sweep.",
    },
    // 911 Envelope Generator 2 — typically patched to the VCA (902 CV input)
    {
        id: "env2_attack",
        panelLabel: "Envelope 2 Attack",
        section: "envelopes",
        defaultCC: 52,
        kind: "continuous",
        description: "911 #2 attack time. In the standard patch this shapes the amplitude (loudness) envelope. 0 = instant pluck; max = slow swell.",
    },
    {
        id: "env2_decay",
        panelLabel: "Envelope 2 Decay",
        section: "envelopes",
        defaultCC: 53,
        kind: "continuous",
        description: "911 #2 decay time after attack peak.",
    },
    {
        id: "env2_sustain",
        panelLabel: "Envelope 2 Sustain",
        section: "envelopes",
        defaultCC: 54,
        kind: "continuous",
        description: "911 #2 sustain level. The amplitude while a note is held.",
    },
    {
        id: "env2_release",
        panelLabel: "Envelope 2 Release",
        section: "envelopes",
        defaultCC: 55,
        kind: "continuous",
        description: "911 #2 release time. How long the note fades after key release. Long release = reverberant, trail-off feel.",
    },
    // ============ AMPLIFIERS ============
    // 902 VCA #1 — typically the main output VCA, controlled by Envelope 2
    {
        id: "vca1_initial_gain",
        panelLabel: "VCA 1 Initial Gain",
        section: "amplifiers",
        defaultCC: 56,
        kind: "continuous",
        description: "902 #1 initial (base) gain level before CV modulation. At 0 with envelope patched, notes are silent between triggers. Raise for a drone that the envelope shapes on top of.",
    },
    // 902 VCA #2 — available for parallel signal paths or layered modulation
    {
        id: "vca2_initial_gain",
        panelLabel: "VCA 2 Initial Gain",
        section: "amplifiers",
        defaultCC: 57,
        kind: "continuous",
        description: "902 #2 initial gain. Use for a secondary signal path (e.g. a dry oscillator blend) or as a CV-controlled crossfader in more complex patches.",
    },
    // ============ SEQUENCER ============
    // 960 Sequential Controller — 8-step analog sequencer
    {
        id: "seq_rate",
        panelLabel: "960 Step Rate",
        section: "sequencer",
        defaultCC: 62,
        kind: "continuous",
        description: "960 Sequential Controller clock rate. Controls how fast the sequencer advances through its steps. Low = slow arpeggiation; high = trilling/rhythmic texture.",
    },
    {
        id: "seq_stages",
        panelLabel: "960 Stage Count",
        section: "sequencer",
        defaultCC: 63,
        kind: "switchN",
        positions: ["1", "2", "3", "4", "5", "6", "7", "8"],
        description: "Number of active steps in the 960 sequence (1–8). The sequencer loops back after this many stages. Shorter loops = ostinato; 8 = full phrase.",
    },
    // ============ PERFORMANCE ============
    {
        id: "glide_rate",
        panelLabel: "Glide Rate",
        section: "performance",
        defaultCC: 5, // MIDI standard Portamento Time
        kind: "continuous",
        description: "Portamento time between notes. 0 = instant pitch change; max = very slow glide. Combine with glide_on.",
    },
    {
        id: "glide_on",
        panelLabel: "Glide On/Off",
        section: "performance",
        defaultCC: 65, // MIDI standard Portamento On/Off
        kind: "switch2",
        description: "Enable portamento (glide) between notes.",
    },
    {
        id: "main_volume",
        panelLabel: "Main Output Volume",
        section: "performance",
        defaultCC: 7, // MIDI standard Channel Volume
        kind: "continuous",
        description: "Master output volume.",
    },
    {
        id: "mod_wheel",
        panelLabel: "Mod Wheel",
        section: "performance",
        kind: "modWheel",
        description: "Modulation wheel — sends MIDI CC1. In the Model 15 app this is typically routed to LFO depth or filter cutoff offset via the patch matrix.",
    },
    {
        id: "pitch_wheel",
        panelLabel: "Pitch Wheel",
        section: "performance",
        kind: "pitchWheel",
        description: "Pitch bend wheel — sends 14-bit MIDI Pitch Bend. ±2 semitones by default (configurable in the app's MIDI settings).",
    },
];
/**
 * Look up a Model 15 control by id, throwing if unknown.
 */
export function findControl(id) {
    const c = CONTROL_SURFACE.find((c) => c.id === id);
    if (!c) {
        throw new Error(`Unknown Model 15 control: "${id}". Available: ${CONTROL_SURFACE.map((c) => c.id).join(", ")}`);
    }
    return c;
}
//# sourceMappingURL=model-15.js.map