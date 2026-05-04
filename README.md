# Moog Model D & Model 15 MIDI MCP Server

A Model Context Protocol (MCP) server that exposes the full control surfaces of the Moog Model D and Moog Model 15 apps as semantically named tools, so an LLM agent (Claude, etc.) can play notes, twiddle knobs, flip switches, and improvise synthesizer textures on your Mac.

Built in TypeScript on top of:

- `@modelcontextprotocol/sdk` — MCP server transport (stdio)
- `easymidi` — virtual MIDI port creation (CoreMIDI on macOS)

## Overview

- **One tool per panel control.** Every knob, switch, and wheel on each synth's panel is its own tool with a meaningful name and a typed value (number, boolean, or enum of named positions). `set_filter_cutoff`, `set_osc1_waveform`, `set_lpf_emphasis`, `set_env1_attack`, `set_seq_stages` — the agent never has to guess a CC number.
- **Both synths supported.** The same server binary handles the Model D (40 controls) and the Model 15 (43 controls). Select which instrument at startup via an env var; run two instances simultaneously for duets.
- **Performance tools.** `play_note`, `play_chord`, `play_sequence`, `panic`, `get_active_notes`.
- **Sequence scheduling** for ambient textures: drop a list of timed events (notes + CC changes + pitch bends) and the server fires them with millisecond precision.
- **Safe panic.** The agent (or you) can stop everything cleanly: All Notes Off plus explicit Note Off for every held note, plus cancellation of all in-flight sequences.
- **Virtual port out of the box.** A CoreMIDI source appears in the app's MIDI Input list automatically. No IAC fiddling required.

## Quick start

```bash
git clone <this-repo>
cd moog-mcp
npm install
npm run build
```

### 1. Verify your MIDI ports

```bash
npm run list-ports
```

You should see your existing CoreMIDI devices. Once the server starts, its virtual port will join the list.

---

## Model D setup

### 2a. Connect the Model D app

1. Open the Minimoog Model D app on your Mac.
2. Go to Settings → MIDI.
3. Make sure MIDI In is enabled.
4. Select `Moog MCP Out` (or whatever you set `MOOG_MCP_PORT_NAME` to) as the MIDI input source.
5. **Receive Channel:** set to `1` (or whatever you set `MOOG_MCP_CHANNEL` to).

### 3a. Build the Model D CC Map preset (one-time setup)

The Model D app uses **user-defined CC mapping** rather than a fixed factory chart. Map each control once in the app, save it as a CC Map preset, and from then on the server's named tools will hit the right knobs.

The MCP server includes a `setup_cc_map` tool that handles this automatically — no terminal commands or manual CC number entry needed:

1. In the Model D app, open Settings → MIDI → Map CCs.
2. Ask Claude: _"Run setup_cc_map for the Model D"_ (optionally add _"with a 4 second delay"_ if you need more time per control).
3. The tool will print a numbered checklist with timestamps. Tap each control in the app at the moment its pulse fires — the app will learn the correct CC automatically.
4. When done, save the preset: Save/Load CC Map → Save → "Claude MCP" (or any name you like).

> **Note:** Mod Wheel (CC1) and Pitch Wheel are hardcoded by the MIDI spec and do not need to be mapped.

#### Model D default CC map

| Control                     | CC  | Notes                                |
| --------------------------- | --- | ------------------------------------ |
| Tune                        | 20  |                                      |
| Glide Rate                  | 5   | MIDI standard Portamento Time        |
| Modulation Mix              | 21  |                                      |
| Osc 1 Range                 | 22  | switchN: LO/32'/16'/8'/4'/2'         |
| Osc 1 Waveform              | 23  | switchN, 7 wave shapes               |
| Osc 2 Range                 | 24  |                                      |
| Osc 2 Frequency             | 25  |                                      |
| Osc 2 Waveform              | 26  |                                      |
| Osc 3 Range                 | 27  |                                      |
| Osc 3 Frequency             | 28  |                                      |
| Osc 3 Waveform              | 29  |                                      |
| Oscillator Modulation       | 30  | switch                               |
| Osc 3 Keyboard Control      | 31  | switch                               |
| Osc 1 Volume                | 33  |                                      |
| Osc 1 On/Off                | 34  | switch                               |
| External Input Volume       | 35  |                                      |
| External Input On/Off       | 36  | switch                               |
| Osc 2 Volume                | 37  |                                      |
| Osc 2 On/Off                | 39  | switch (38 reserved: Data Entry LSB) |
| Noise Volume                | 40  |                                      |
| Noise On/Off                | 41  | switch                               |
| Noise Color                 | 42  | switch (white/pink)                  |
| Osc 3 Volume                | 43  |                                      |
| Osc 3 On/Off                | 44  | switch                               |
| Filter Cutoff               | 74  | MIDI standard Brightness             |
| Filter Emphasis (Resonance) | 71  | MIDI standard Resonance              |
| Filter Contour Amount       | 45  |                                      |
| Filter Attack               | 46  |                                      |
| Filter Decay                | 47  |                                      |
| Filter Sustain              | 48  |                                      |
| Filter Modulation           | 49  | switch                               |
| Keyboard Control 1          | 50  | switch                               |
| Keyboard Control 2          | 51  | switch                               |
| Loudness Attack             | 52  |                                      |
| Loudness Decay              | 53  |                                      |
| Loudness Sustain            | 54  |                                      |
| Decay Switch                | 55  | switch                               |
| Main Output Volume          | 7   | MIDI standard Channel Volume         |
| Main Output On/Off          | 56  | switch                               |
| A-440 Tuning Tone           | 57  | switch                               |
| Glide On/Off                | 65  | MIDI standard Portamento On/Off      |
| Mod Wheel                   | 1   | Fixed by MIDI spec                   |
| Pitch Wheel                 | —   | 14-bit MIDI Pitch Bend (not a CC)    |

---

## Model 15 setup

### 2b. Connect the Model 15 app

The Model 15 server must use a different port name from the Model D server so CoreMIDI doesn't collide the names. Set `MOOG_MCP_PORT_NAME=Moog Model 15 Out` (see Configuration below) and then:

1. Open the Moog Model 15 app on your Mac.
2. Go to Settings → MIDI.
3. Make sure MIDI In is enabled.
4. Select `Moog Model 15 Out` as the MIDI input source.
5. Receive Channel: set to `1`.

### 3b. Build the Model 15 CC Map preset (one-time setup)

The Model 15 app also uses MIDI Learn. The `setup_cc_map` tool works identically:

1. In the Model 15 app, open Settings → MIDI → MIDI Learn.
2. Ask Claude: _"Run setup_cc_map for the Model 15"_.
3. Follow the printed checklist, tapping each module knob or switch in the app as its pulse fires.
4. Save the preset as "Claude MCP 15" (or any name you like).

The controls and their default CC numbers are defined in [`src/model-15.ts`](src/model-15.ts). The table below is for reference.

#### Model 15 default CC map

| Control                    | CC  | Section     | Notes                             |
| -------------------------- | --- | ----------- | --------------------------------- |
| 921A Frequency             | 20  | oscillators | Master driver pitch               |
| 921A Range                 | 21  | oscillators | switchN: LO/32'/16'/8'/4'/2'      |
| Osc 1 Range                | 22  | oscillators |                                   |
| Osc 1 Frequency            | 23  | oscillators | Fine tune                         |
| Osc 1 Waveform             | 24  | oscillators | switchN: triangle/sawtooth/square |
| Osc 1 Pulse Width          | 25  | oscillators |                                   |
| Osc 2 Range                | 26  | oscillators |                                   |
| Osc 2 Frequency            | 27  | oscillators |                                   |
| Osc 2 Waveform             | 28  | oscillators |                                   |
| Osc 2 Pulse Width          | 29  | oscillators |                                   |
| Osc 3 Range                | 30  | oscillators |                                   |
| Osc 3 Frequency            | 31  | oscillators |                                   |
| Osc 3 Waveform             | 33  | oscillators | (32 reserved: Bank Select LSB)    |
| Osc 3 Pulse Width          | 34  | oscillators |                                   |
| Osc 1 Volume               | 35  | mixer       |                                   |
| Osc 2 Volume               | 36  | mixer       |                                   |
| Osc 3 Volume               | 37  | mixer       |                                   |
| Noise Volume               | 39  | mixer       | (38 reserved: Data Entry LSB)     |
| Noise Color                | 40  | mixer       | switch (white/pink)               |
| External Input Volume      | 41  | mixer       |                                   |
| 904A LPF Keyboard Tracking | 42  | filters     | switchN: off/1/3/2/3/full         |
| 904A LPF Env Amount        | 45  | filters     |                                   |
| 904A LPF Cutoff            | 74  | filters     | MIDI standard Brightness          |
| 904A LPF Emphasis          | 71  | filters     | MIDI standard Resonance           |
| 904B HPF Cutoff            | 60  | filters     |                                   |
| 904C Coupler Balance       | 61  | filters     |                                   |
| Envelope 1 Attack          | 46  | envelopes   | Typically patched to filter       |
| Envelope 1 Decay           | 47  | envelopes   |                                   |
| Envelope 1 Sustain         | 48  | envelopes   |                                   |
| Envelope 1 Release         | 49  | envelopes   |                                   |
| Envelope 2 Attack          | 52  | envelopes   | Typically patched to VCA          |
| Envelope 2 Decay           | 53  | envelopes   |                                   |
| Envelope 2 Sustain         | 54  | envelopes   |                                   |
| Envelope 2 Release         | 55  | envelopes   |                                   |
| VCA 1 Initial Gain         | 56  | amplifiers  |                                   |
| VCA 2 Initial Gain         | 57  | amplifiers  |                                   |
| 960 Step Rate              | 62  | sequencer   |                                   |
| 960 Stage Count            | 63  | sequencer   | switchN: 1–8 steps                |
| Glide Rate                 | 5   | performance | MIDI standard Portamento Time     |
| Glide On/Off               | 65  | performance | MIDI standard Portamento On/Off   |
| Main Volume                | 7   | performance | MIDI standard Channel Volume      |
| Mod Wheel                  | 1   | performance | Fixed by MIDI spec                |
| Pitch Wheel                | —   | performance | 14-bit MIDI Pitch Bend (not a CC) |

---

## Configure your MCP client

Add one server entry per synth. Each must have a unique `MOOG_MCP_PORT_NAME` — if both use the default `Moog MCP Out`, CoreMIDI will rename the second one to `Moog MCP Out1` and the app won't see it.

For Claude Desktop, edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "moog-model-d": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "MOOG_MCP_SYNTH": "model-d",
        "MOOG_MCP_PORT_NAME": "Moog MCP Out",
        "MOOG_MCP_CHANNEL": "1"
      }
    },
    "moog-model-15": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "MOOG_MCP_SYNTH": "model-15",
        "MOOG_MCP_PORT_NAME": "Moog Model 15 Out",
        "MOOG_MCP_CHANNEL": "1"
      }
    }
  }
}
```

For Claude Code, add each server separately:

```bash
claude mcp add moog-model-d  -- env MOOG_MCP_SYNTH=model-d  node $(pwd)/dist/index.js
claude mcp add moog-model-15 -- env MOOG_MCP_SYNTH=model-15 MOOG_MCP_PORT_NAME="Moog Model 15 Out" node $(pwd)/dist/index.js
```

Restart your MCP client. Both sets of Moog tools should appear in the tool palette.

## Talk to the Moogs

Try prompts like:

- _"Play a slow ambient C minor pad on the Model D. Long attack, long release, lots of filter modulation."_
- _"Set up a classic Minimoog bass on the Model D: osc 1 at 16', osc 2 sawtooth slightly detuned, filter cutoff around 30%, emphasis 70%, short envelope. Play a walking bass line in E."_
- _"Play a duet — Model D on bass, Model 15 on melody, in A minor."_
- _"Use the Model 15's 960 sequencer to run an 8-step ostinato while the Model D holds a drone."_
- _"Make wind on the Model 15: noise generator, slow filter modulation, no keyboard notes."_

## Configuration

| Env var              | Default        | Purpose                                                                                                               |
| -------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------- |
| `MOOG_MCP_SYNTH`     | `model-d`      | Which synth to control: `model-d` or `model-15`.                                                                      |
| `MOOG_MCP_PORT_NAME` | `Moog MCP Out` | Name of the virtual CoreMIDI port to create. **Must be unique per running instance.**                                 |
| `MOOG_MCP_USE_PORT`  | _(unset)_      | If set, send to this **existing** MIDI output port name (e.g. `IAC Driver Bus 1`) instead of creating a virtual port. |
| `MOOG_MCP_CHANNEL`   | `1`            | Default MIDI send channel (1–16). Each tool call can override per-call.                                               |

## Routing through IAC instead of a virtual port

If an app doesn't see the virtual port, fall back to the IAC Driver:

1. Open **Audio MIDI Setup** → **Window → Show MIDI Studio**.
2. Double-click **IAC Driver**, check **Device is online**, and add a bus named e.g. `Moog D Bus` / `Moog 15 Bus`.
3. In the app, select the IAC bus as the MIDI input source.
4. Run the server with `MOOG_MCP_USE_PORT="IAC Driver Moog D Bus"`.

## Development

```bash
npm run dev          # tsx watch mode
npm run build        # compile to dist/
npm run list-ports   # show all CoreMIDI ports
```

The architecture is small and code-first by design:

- [`src/model-d.ts`](src/model-d.ts) — Model D control surface map (40 controls). Add or change a knob here.
- [`src/model-15.ts`](src/model-15.ts) — Model 15 control surface map (43 controls across 8 sections).
- [`src/midi-engine.ts`](src/midi-engine.ts) — virtual port + held-note bookkeeping + sequence scheduler.
- [`src/notes.ts`](src/notes.ts) — `"C4"` ↔ MIDI integer conversion.
- [`src/index.ts`](src/index.ts) — MCP server, tool catalog, dispatcher. Reads `MOOG_MCP_SYNTH` at startup to select the active control surface.

## Why this design?

- **Semantic tools, not raw CCs.** The agent calls `set_lpf_cutoff({ value: 0.3 })`, not `send_raw_cc({ controller: 74, value: 38 })`. The CC mapping is a deployment concern, owned by the app's MIDI Learn workflow.
- **Typed positions for switches.** `set_osc1_waveform({ position: "sawtooth" })` is far less error-prone than guessing which CC value maps to which of 7 waveform positions. The server does the math.
- **One server binary, two instruments.** `MOOG_MCP_SYNTH` selects the control surface at startup. Run two instances with different port names to control both synths simultaneously.
- **Sequence scheduling lives server-side.** One `play_sequence` call schedules an entire phrase. The agent doesn't make N round-trips for an N-event sequence.
- **Note names everywhere.** `"C4"`, `"F#3"`, `"Bb2"` all work. So do raw MIDI integers.

## License

MIT.
