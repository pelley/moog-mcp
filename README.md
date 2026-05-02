# Moog Model D MCP Server

A Model Context Protocol (MCP) server that exposes the **full Moog Model D control surface** as semantically named tools, so an LLM agent (Claude, etc.) can play notes, twiddle knobs, flip switches, and improvise ambient synth textures on your Mac copy of the **Minimoog Model D** app — and, with a little extra mapping, the **Model 15** app too.

Built in TypeScript on top of:

- `@modelcontextprotocol/sdk` — MCP server transport (stdio)
- `easymidi` — virtual MIDI port creation (CoreMIDI on macOS)

## What you get

- **One tool per panel control.** `set_filter_cutoff`, `set_oscillator_1_waveform`, `set_filter_emphasis`, `set_loudness_attack`, `set_glide_on`, `set_mod_wheel`, `set_pitch_wheel` — every knob, switch, and wheel on the Model D's panel is its own tool with a meaningful name and a typed value (number, boolean, or enum of named positions).
- **Performance tools.** `play_note`, `play_chord`, `play_sequence`, `pitch_bend`, `panic`, `get_active_notes`.
- **Sequence scheduling** for ambient textures: drop a list of timed events (notes + CC changes + bends) and the server schedules them with millisecond precision.
- **Safe panic.** The agent (or you) can stop everything cleanly: All Notes Off plus an explicit Note Off for every held note.
- **Virtual port out of the box.** A CoreMIDI source named `Moog MCP Out` appears in the Model D app's MIDI Input list. No IAC fiddling required (though you can route through IAC if you prefer — see below).

## Quick start

```bash
git clone <this-repo>
cd moog-model-d-mcp
npm install
npm run build
```

### 1. Verify your MIDI ports

```bash
npm run list-ports
```

You should see your existing CoreMIDI devices. After you start the server (next step), `Moog MCP Out` will join the list.

### 2. Set up the Model D app

1. Open the **Minimoog Model D** app on your Mac.
2. Go to **Settings → MIDI**.
3. Make sure **MIDI In** is enabled.
4. The app should auto-discover the `Moog MCP Out` port once the server is running. Select it as a MIDI input source.
5. **Receive Channel:** set to `1` (or whatever you set `MOOG_MCP_CHANNEL` to).

### 3. Build the CC Map preset (one-time setup)

The Model D app uses **user-defined CC mapping** rather than a fixed factory chart. You map each control once, save it as a CC Map preset, and from then on the server's named tools will hit the right knobs.

In the app: **Settings → MIDI → Map CCs**.

For each control listed in [`src/model-d.ts`](src/model-d.ts):

1. Tap the control on the panel (it'll highlight, awaiting MIDI Learn).
2. Either:
   - **Easy way:** in another terminal, run a probe — `node -e "const m = require('easymidi'); const o = new m.Output('Moog MCP Out', true); setTimeout(() => { o.send('cc', { controller: 74, value: 64, channel: 0 }); }, 500);"` (replace `74` with the desired CC). The first CC the app sees will be assigned.
   - **Manual way:** double-tap the control in the Map CCs view and type the CC number directly.
3. After you've assigned every control, **save** the map: **Save/Load CC Map → Save → "Claude MCP"** (or any name you like).

The default CC numbers chosen by the server are listed below. They avoid reserved CCs (0, 6, 32, 38, 64, 96–101, 120–127) and give the panel a coherent left-to-right walk.

#### Default CC map

| Control                     | CC  | Notes                               |
| --------------------------- | --- | ----------------------------------- |
| Tune                        | 20  |                                     |
| Glide rate                  | 5   | MIDI standard Portamento Time       |
| Modulation Mix              | 21  |                                     |
| Osc 1 Range                 | 22  | switchN: LO/32'/16'/8'/4'/2'        |
| Osc 1 Waveform              | 23  | switchN, 7 wave shapes              |
| Osc 2 Range                 | 24  |                                     |
| Osc 2 Frequency             | 25  |                                     |
| Osc 2 Waveform              | 26  |                                     |
| Osc 3 Range                 | 27  |                                     |
| Osc 3 Frequency             | 28  |                                     |
| Osc 3 Waveform              | 29  |                                     |
| Oscillator Modulation       | 30  | switch                              |
| Osc 3 Keyboard Control      | 31  | switch                              |
| Osc 1 Volume                | 33  |                                     |
| Osc 1 On/Off                | 34  | switch                              |
| External Input Volume       | 35  |                                     |
| External Input On/Off       | 36  | switch                              |
| Osc 2 Volume                | 37  |                                     |
| Osc 2 On/Off                | 39  | switch (38 reserved: Data Entry LSB) |
| Noise Volume                | 40  |                                     |
| Noise On/Off                | 41  | switch                              |
| Noise Color                 | 42  | switch (white/pink)                 |
| Osc 3 Volume                | 43  |                                     |
| Osc 3 On/Off                | 44  | switch                              |
| Filter Cutoff               | 74  | MIDI standard Brightness            |
| Filter Emphasis (Resonance) | 71  | MIDI standard Resonance             |
| Filter Contour Amount       | 45  |                                     |
| Filter Attack               | 46  |                                     |
| Filter Decay                | 47  |                                     |
| Filter Sustain              | 48  |                                     |
| Filter Modulation           | 49  | switch                              |
| Keyboard Control 1          | 50  | switch                              |
| Keyboard Control 2          | 51  | switch                              |
| Loudness Attack             | 52  |                                     |
| Loudness Decay              | 53  |                                     |
| Loudness Sustain            | 54  |                                     |
| Decay Switch                | 55  | switch                              |
| Main Output Volume          | 7   | MIDI standard Channel Volume        |
| Main Output On/Off          | 56  | switch                              |
| A-440 Tuning Tone           | 57  | switch                              |
| Glide On/Off                | 65  | MIDI standard Portamento On/Off     |
| Mod Wheel                   | 1   | Fixed by MIDI spec                  |
| Pitch Wheel                 | —   | 14-bit MIDI Pitch Bend (not a CC)   |

You can override defaults by setting environment variables or editing `src/model-d.ts` before building.

### 4. Configure your MCP client

Add the server to your MCP client's config. For Claude Desktop, edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "moog-model-d": {
      "command": "node",
      "args": ["/absolute/path/to/moog-model-d-mcp/dist/index.js"],
      "env": {
        "MOOG_MCP_PORT_NAME": "Moog MCP Out",
        "MOOG_MCP_CHANNEL": "1"
      }
    }
  }
}
```

For Claude Code, run from the repo:

```bash
claude mcp add moog-model-d -- node $(pwd)/dist/index.js
```

Restart your MCP client. The Moog tools should appear in the tool palette.

### 5. Talk to the Moog

Try prompts like:

- _"Play a slow ambient C minor pad. Long attack, long release, lots of filter modulation, just floating."_
- _"Set up a classic Minimoog bass: oscillator 1 at 16', oscillator 2 sawtooth slightly detuned, filter cutoff around 30%, emphasis around 70%, short envelope. Then play a walking bass line in E."_
- _"Slowly sweep the filter cutoff from closed to fully open over 8 seconds while holding a low D drone."_
- _"Make a sound like wind. No keyboard notes — use the noise generator with a slow filter modulation."_

## Configuration

| Env var               | Default       | Purpose                                                                                                                |
| --------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `MOOG_MCP_PORT_NAME`  | `Moog MCP Out` | Name of the virtual CoreMIDI port to create.                                                                           |
| `MOOG_MCP_USE_PORT`   | _(unset)_     | If set, send to this **existing** MIDI output port name (e.g. `IAC Driver Bus 1`) instead of creating a virtual port. |
| `MOOG_MCP_CHANNEL`    | `1`           | Default MIDI send channel (1–16). Each tool can override per call.                                                     |

## Routing through IAC instead of a virtual port

If the Model D app doesn't see `Moog MCP Out` for some reason, fall back to the IAC Driver:

1. Open **Audio MIDI Setup** → **Window → Show MIDI Studio**.
2. Double-click **IAC Driver**, check **Device is online**, and add a bus named e.g. `Moog Bus`.
3. In the Model D app, select `IAC Driver Moog Bus` as the MIDI input source.
4. Run the server with `MOOG_MCP_USE_PORT="IAC Driver Moog Bus"`.

## Using with the Model 15 app

The Model 15 is modular, so its CC implementation depends on what you've patched. The default behaviour:

- The note-playing tools (`play_note`, `play_chord`, `play_sequence` with `note` events) work immediately — Model 15 responds to standard MIDI notes.
- For knob automation, the Model 15 has its own MIDI Learn workflow (the **Settings → MIDI → MIDI Learn** panel). Map controls to whatever CC numbers you like and use the `send_raw_cc` tool, or extend [`src/model-d.ts`](src/model-d.ts) with a parallel control surface for whatever modules you've patched.

A future enhancement would be to ship a second control-surface file for common Model 15 patches (West Coast, East Coast, etc.).

## Development

```bash
npm run dev          # tsx watch mode
npm run build        # compile to dist/
npm run list-ports   # show all CoreMIDI ports
```

The architecture is small and code-first by design:

- [`src/model-d.ts`](src/model-d.ts) — declarative control surface map. Add or change a knob here.
- [`src/midi-engine.ts`](src/midi-engine.ts) — virtual port + held-note bookkeeping + sequence scheduler.
- [`src/notes.ts`](src/notes.ts) — `"C4"` ↔ MIDI integer conversion.
- [`src/index.ts`](src/index.ts) — MCP server, tool catalog, dispatcher.

## Why this design?

- **Semantic tools, not raw CCs.** The agent shouldn't need to know that filter cutoff is CC74. It just calls `set_filter_cutoff({ value: 0.3 })`. The CC mapping is a deployment concern, owned by the Model D app's MIDI Learn workflow plus the table in [`src/model-d.ts`](src/model-d.ts).
- **Typed positions for switches.** `set_oscillator_1_waveform({ position: "sawtooth" })` is far less error-prone than guessing what CC value 0..127 corresponds to which of the 7 waveform positions on the panel. The server does the math.
- **Sequence scheduling lives server-side.** The agent shouldn't have to make N tool calls for an N-event sequence — that defeats the purpose. One `play_sequence` call, fire-and-forget, with a cancellation handle.
- **Note names everywhere.** `"C4"`, `"F#3"`, `"Bb-1"` all work. So do raw integers.

## License

MIT.
