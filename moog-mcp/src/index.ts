#!/usr/bin/env node
/**
 * Moog Model D & Model 15 MIDI MCP Server
 *
 * Exposes the full control surface of either the Moog Model D or Moog Model 15
 * app as MCP tools, plus performance tools for playing notes, sequences, and
 * ambient textures. Which instrument is active is selected at startup via the
 * MOOG_MCP_SYNTH env var ("model-d" or "model-15"; defaults to "model-d").
 *
 * Run two instances simultaneously — each with a unique MOOG_MCP_PORT_NAME —
 * to control both synths at the same time.
 *
 * Transport: stdio (the MCP standard for desktop/local integrations).
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as easymidi from "easymidi";

import {
  CONTROL_SURFACE as MODEL_D_SURFACE,
  SECTIONS as MODEL_D_SECTIONS,
  normalizedToCC,
  positionToCC,
  type ControlSpec,
} from "./model-d.js";
import {
  CONTROL_SURFACE as MODEL_15_SURFACE,
  SECTIONS as MODEL_15_SECTIONS,
} from "./model-15.js";

const SYNTH = (process.env.MOOG_MCP_SYNTH ?? "model-d").toLowerCase();
if (SYNTH !== "model-d" && SYNTH !== "model-15") {
  console.error(`[moog-mcp] Unknown MOOG_MCP_SYNTH "${SYNTH}". Valid values: model-d, model-15.`);
  process.exit(1);
}

const CONTROL_SURFACE = SYNTH === "model-15" ? MODEL_15_SURFACE : MODEL_D_SURFACE;
const SECTIONS = SYNTH === "model-15" ? MODEL_15_SECTIONS : MODEL_D_SECTIONS;
const SYNTH_LABEL = SYNTH === "model-15" ? "Model 15" : "Model D";

function findControl(id: string): ControlSpec {
  const c = CONTROL_SURFACE.find((c) => c.id === id);
  if (!c) {
    throw new Error(
      `Unknown control: "${id}". Available: ${CONTROL_SURFACE.map((c) => c.id).join(", ")}`,
    );
  }
  return c;
}
import { MoogMidiEngine, type SequenceEvent } from "./midi-engine.js";
import { noteName, parseNoteFlexible } from "./notes.js";

// ---- Server config (env-overridable) ----
const VIRTUAL_PORT_NAME = process.env.MOOG_MCP_PORT_NAME ?? "Moog MCP Out";
const EXISTING_PORT = process.env.MOOG_MCP_USE_PORT; // e.g. "IAC Driver Bus 1"
const DEFAULT_CHANNEL = parseInt(process.env.MOOG_MCP_CHANNEL ?? "1", 10);

// ---- Build the engine on startup ----
const engine = new MoogMidiEngine({
  virtualPortName: VIRTUAL_PORT_NAME,
  existingPortName: EXISTING_PORT,
  defaultChannel: DEFAULT_CHANNEL,
});

// Graceful shutdown: silence the synth before exiting.
function shutdown(signal: string) {
  console.error(`[moog-mcp] ${signal} received, panicking and closing port.`);
  try {
    engine.close();
  } catch (e) {
    console.error("[moog-mcp] error during shutdown:", e);
  }
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ---- Tool catalog ----
//
// We expose:
//   1. One tool per synth control (set_<id>) — every knob, switch, and wheel
//      on the active instrument's panel. Control surface is determined by
//      MOOG_MCP_SYNTH at startup (model-d = 40 controls, model-15 = 43 controls).
//   2. Performance tools: play_note, play_chord, play_sequence, panic.
//   3. Introspection tools: list_controls, list_midi_ports, get_active_notes.
//
// Each control tool accepts either a `value` field whose type matches
// the control kind, OR a raw `cc_value` 0..127 escape hatch.

function controlToolName(spec: ControlSpec): string {
  return `set_${spec.id}`;
}

function buildControlTool(spec: ControlSpec): Tool {
  const desc = [
    spec.description,
    "",
    `Panel: ${spec.panelLabel} (${spec.section})`,
  ];

  if (spec.kind === "modWheel") {
    desc.push("Sends MIDI CC1. Value: 0.0 (off) – 1.0 (max).");
    return {
      name: controlToolName(spec),
      description: desc.join("\n"),
      inputSchema: {
        type: "object",
        properties: {
          value: {
            type: "number",
            minimum: 0,
            maximum: 1,
            description: "Modulation amount, 0.0 to 1.0.",
          },
          channel: { type: "integer", minimum: 1, maximum: 16 },
        },
        required: ["value"],
        additionalProperties: false,
      },
    };
  }

  if (spec.kind === "pitchWheel") {
    desc.push("Sends 14-bit MIDI Pitch Bend. Value: -1.0 (full down) – +1.0 (full up). 0 = center.");
    return {
      name: controlToolName(spec),
      description: desc.join("\n"),
      inputSchema: {
        type: "object",
        properties: {
          value: {
            type: "number",
            minimum: -1,
            maximum: 1,
            description: "Pitch bend, -1.0 to +1.0. 0 = no bend.",
          },
          channel: { type: "integer", minimum: 1, maximum: 16 },
        },
        required: ["value"],
        additionalProperties: false,
      },
    };
  }

  desc.push(`Default CC: ${spec.defaultCC}. (Map this CC in the ${SYNTH_LABEL} app's Map CCs panel.)`);

  if (spec.kind === "continuous") {
    desc.push("Value: 0.0 to 1.0. Translates to MIDI CC value 0–127.");
    return {
      name: controlToolName(spec),
      description: desc.join("\n"),
      inputSchema: {
        type: "object",
        properties: {
          value: {
            type: "number",
            minimum: 0,
            maximum: 1,
            description: "Knob position, 0.0 (fully counter-clockwise) to 1.0 (fully clockwise).",
          },
          cc_value: {
            type: "integer",
            minimum: 0,
            maximum: 127,
            description: "Escape hatch: send a raw 0–127 CC value instead.",
          },
          channel: { type: "integer", minimum: 1, maximum: 16 },
        },
        additionalProperties: false,
      },
    };
  }

  if (spec.kind === "switch2") {
    desc.push("Value: boolean (true = on, false = off).");
    return {
      name: controlToolName(spec),
      description: desc.join("\n"),
      inputSchema: {
        type: "object",
        properties: {
          on: { type: "boolean", description: "Switch on/off." },
          cc_value: { type: "integer", minimum: 0, maximum: 127 },
          channel: { type: "integer", minimum: 1, maximum: 16 },
        },
        additionalProperties: false,
      },
    };
  }

  if (spec.kind === "switch3") {
    desc.push('Value: "low" | "mid" | "high".');
    return {
      name: controlToolName(spec),
      description: desc.join("\n"),
      inputSchema: {
        type: "object",
        properties: {
          position: { type: "string", enum: ["low", "mid", "high"] },
          cc_value: { type: "integer", minimum: 0, maximum: 127 },
          channel: { type: "integer", minimum: 1, maximum: 16 },
        },
        required: ["position"],
        additionalProperties: false,
      },
    };
  }

  if (spec.kind === "switchN") {
    const positions = spec.positions ?? [];
    desc.push(`Value: one of [${positions.map((p) => `"${p}"`).join(", ")}].`);
    return {
      name: controlToolName(spec),
      description: desc.join("\n"),
      inputSchema: {
        type: "object",
        properties: {
          position: { type: "string", enum: positions },
          cc_value: { type: "integer", minimum: 0, maximum: 127 },
          channel: { type: "integer", minimum: 1, maximum: 16 },
        },
        required: ["position"],
        additionalProperties: false,
      },
    };
  }

  // Unreachable.
  throw new Error(`Unknown control kind: ${spec.kind}`);
}

// Performance tools.
const PERFORMANCE_TOOLS: Tool[] = [
  {
    name: "play_note",
    description:
      "Play a single note for a given duration. Note can be a name like 'C4', 'F#3', 'Bb-1' or a raw MIDI integer 0–127.",
    inputSchema: {
      type: "object",
      properties: {
        note: {
          oneOf: [
            { type: "string", description: "Note name like 'C4'." },
            { type: "integer", minimum: 0, maximum: 127 },
          ],
        },
        duration_ms: { type: "integer", minimum: 1, default: 500 },
        velocity: { type: "integer", minimum: 1, maximum: 127, default: 100 },
        channel: { type: "integer", minimum: 1, maximum: 16 },
      },
      required: ["note"],
      additionalProperties: false,
    },
  },
  {
    name: "play_chord",
    description:
      "Play multiple notes simultaneously for a given duration. Useful even though the Model D app caps polyphony at 4 voices.",
    inputSchema: {
      type: "object",
      properties: {
        notes: {
          type: "array",
          items: {
            oneOf: [
              { type: "string" },
              { type: "integer", minimum: 0, maximum: 127 },
            ],
          },
          minItems: 1,
          maxItems: 4,
        },
        duration_ms: { type: "integer", minimum: 1, default: 800 },
        velocity: { type: "integer", minimum: 1, maximum: 127, default: 100 },
        channel: { type: "integer", minimum: 1, maximum: 16 },
      },
      required: ["notes"],
      additionalProperties: false,
    },
  },
  {
    name: "play_sequence",
    description:
      "Schedule a timed sequence of MIDI events (notes, CC changes, pitch bends). Returns a sequence id immediately; events fire on a timer. Use this for ambient passages, slow filter sweeps, evolving textures, etc.",
    inputSchema: {
      type: "object",
      properties: {
        events: {
          type: "array",
          description:
            "Event list, each with `at_ms` (offset from start). Kinds: 'note', 'cc', 'pitch_bend'.",
          items: {
            type: "object",
            properties: {
              kind: { type: "string", enum: ["note", "cc", "pitch_bend"] },
              at_ms: { type: "integer", minimum: 0 },
              // note-specific
              note: { oneOf: [{ type: "string" }, { type: "integer" }] },
              duration_ms: { type: "integer", minimum: 1 },
              velocity: { type: "integer", minimum: 1, maximum: 127 },
              // cc-specific
              control: {
                type: "string",
                description:
                  "Either a control id (e.g. 'filter_cutoff') OR omit and supply `controller`.",
              },
              controller: { type: "integer", minimum: 0, maximum: 127 },
              value: { type: "number" },
              cc_value: { type: "integer", minimum: 0, maximum: 127 },
              // common
              channel: { type: "integer", minimum: 1, maximum: 16 },
            },
            required: ["kind", "at_ms"],
          },
        },
      },
      required: ["events"],
      additionalProperties: false,
    },
  },
  {
    name: "cancel_sequence",
    description: "Cancel a sequence by id (returned from play_sequence).",
    inputSchema: {
      type: "object",
      properties: { sequence_id: { type: "string" } },
      required: ["sequence_id"],
      additionalProperties: false,
    },
  },
  {
    name: "panic",
    description:
      "Send All Notes Off + manual note-off for every held note, and cancel all running sequences. Use this if anything sounds stuck.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "list_controls",
    description: `Return the full ${SYNTH_LABEL} control surface map: every knob, switch, and wheel, with default CC numbers and current value semantics.`,
    inputSchema: {
      type: "object",
      properties: {
        section: {
          type: "string",
          enum: SECTIONS,
          description: "Filter to one panel section.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "list_midi_ports",
    description:
      "List all MIDI output ports visible to the OS (so you can verify the Model D app sees the virtual port).",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_active_notes",
    description: "Return the currently held notes.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "send_raw_cc",
    description:
      "Escape hatch: send a raw MIDI Control Change message (controller 0–127, value 0–127).",
    inputSchema: {
      type: "object",
      properties: {
        controller: { type: "integer", minimum: 0, maximum: 127 },
        value: { type: "integer", minimum: 0, maximum: 127 },
        channel: { type: "integer", minimum: 1, maximum: 16 },
      },
      required: ["controller", "value"],
      additionalProperties: false,
    },
  },
];

const CONTROL_TOOLS: Tool[] = CONTROL_SURFACE.map(buildControlTool);
const ALL_TOOLS: Tool[] = [...PERFORMANCE_TOOLS, ...CONTROL_TOOLS];

// ---- MCP server wiring ----

const server = new Server(
  { name: `moog-${SYNTH}`, version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: ALL_TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;
  try {
    return await dispatch(name, args as Record<string, unknown>);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: `Error: ${msg}` }],
      isError: true,
    };
  }
});

async function dispatch(
  name: string,
  args: Record<string, unknown>,
): Promise<{ content: { type: "text"; text: string }[] }> {
  // Performance tools first.
  switch (name) {
    case "play_note":
      return playNote(args);
    case "play_chord":
      return playChord(args);
    case "play_sequence":
      return playSequence(args);
    case "cancel_sequence":
      return cancelSequence(args);
    case "panic":
      return doPanic();
    case "list_controls":
      return listControls(args);
    case "list_midi_ports":
      return listMidiPorts();
    case "get_active_notes":
      return getActiveNotes();
    case "send_raw_cc":
      return sendRawCC(args);
  }

  // Control tools: name === `set_<id>`.
  if (name.startsWith("set_")) {
    const id = name.slice("set_".length);
    return setControl(id, args);
  }

  throw new Error(`Unknown tool: ${name}`);
}

// ---- Tool implementations ----

function playNote(args: Record<string, unknown>) {
  const note = parseNoteFlexible(args.note as string | number);
  const duration_ms = (args.duration_ms as number | undefined) ?? 500;
  const velocity = (args.velocity as number | undefined) ?? 100;
  const channel = args.channel as number | undefined;
  // Fire-and-forget: schedule the release; respond immediately so the agent
  // can keep working in parallel with the sound.
  void engine.playNote({ note, durationMs: duration_ms, velocity, channel });
  return ok(`Played ${noteName(note)} (MIDI ${note}) for ${duration_ms}ms.`);
}

function playChord(args: Record<string, unknown>) {
  const rawNotes = args.notes as (string | number)[];
  const notes = rawNotes.map(parseNoteFlexible);
  const duration_ms = (args.duration_ms as number | undefined) ?? 800;
  const velocity = (args.velocity as number | undefined) ?? 100;
  const channel = args.channel as number | undefined;
  for (const n of notes) engine.noteOn(n, velocity, channel);
  setTimeout(() => {
    for (const n of notes) engine.noteOff(n, channel);
  }, duration_ms);
  return ok(
    `Played chord [${notes.map(noteName).join(", ")}] for ${duration_ms}ms.`,
  );
}

function playSequence(args: Record<string, unknown>) {
  const rawEvents = args.events as Array<Record<string, unknown>>;
  const events: SequenceEvent[] = rawEvents.map((e) => translateSeqEvent(e));
  const id = engine.scheduleSequence(events);
  const horizon = events.reduce(
    (m, e) => Math.max(m, e.atMs + ("durationMs" in e ? e.durationMs : 0)),
    0,
  );
  return ok(
    `Scheduled sequence "${id}" with ${events.length} events. Total duration ~${horizon}ms.`,
  );
}

function translateSeqEvent(e: Record<string, unknown>): SequenceEvent {
  const at_ms = e.at_ms as number;
  const channel = e.channel as number | undefined;
  const kind = e.kind as string;
  if (kind === "note") {
    return {
      kind: "note",
      atMs: at_ms,
      note: parseNoteFlexible(e.note as string | number),
      durationMs: (e.duration_ms as number | undefined) ?? 500,
      velocity: e.velocity as number | undefined,
      channel,
    };
  }
  if (kind === "cc") {
    let controller: number;
    let value: number;
    if (e.control !== undefined) {
      // Use control-id semantics.
      const spec = findControl(e.control as string);
      if (spec.kind === "modWheel") {
        controller = 1;
      } else if (spec.kind === "pitchWheel") {
        throw new Error(
          "pitchWheel cannot be sent as a CC; use kind: 'pitch_bend' instead.",
        );
      } else if (spec.defaultCC === undefined) {
        throw new Error(`Control ${spec.id} has no CC mapping`);
      } else {
        controller = spec.defaultCC;
      }
      value = resolveValueForControl(spec, e);
    } else {
      controller = e.controller as number;
      value =
        (e.cc_value as number | undefined) ??
        Math.round(((e.value as number) ?? 0) * 127);
    }
    return { kind: "cc", atMs: at_ms, controller, value, channel };
  }
  if (kind === "pitch_bend") {
    return {
      kind: "pitchBend",
      atMs: at_ms,
      value: e.value as number,
      channel,
    };
  }
  throw new Error(`Unknown sequence event kind: ${kind}`);
}

/**
 * Resolve a control's value from an args object. Supports:
 *   - cc_value (integer 0..127): always wins
 *   - value (number 0..1) for continuous
 *   - on (boolean) for switch2
 *   - position (string) for switch3 / switchN
 */
function resolveValueForControl(
  spec: ControlSpec,
  args: Record<string, unknown>,
): number {
  if (typeof args.cc_value === "number") {
    if (
      !Number.isInteger(args.cc_value) ||
      args.cc_value < 0 ||
      args.cc_value > 127
    )
      throw new Error("cc_value must be integer 0..127");
    return args.cc_value;
  }
  switch (spec.kind) {
    case "continuous":
    case "modWheel":
      if (typeof args.value !== "number")
        throw new Error("Expected `value` (0.0–1.0) or `cc_value`");
      return normalizedToCC(args.value);
    case "switch2":
      if (typeof args.on !== "boolean")
        throw new Error("Expected `on` boolean or `cc_value`");
      return args.on ? 127 : 0;
    case "switch3": {
      const pos = args.position as "low" | "mid" | "high" | undefined;
      if (pos !== "low" && pos !== "mid" && pos !== "high")
        throw new Error("Expected position 'low'|'mid'|'high'");
      return pos === "low" ? 0 : pos === "mid" ? 64 : 127;
    }
    case "switchN":
      if (typeof args.position !== "string")
        throw new Error(
          `Expected position one of: ${spec.positions?.join(", ")}`,
        );
      return positionToCC(spec, args.position);
    case "pitchWheel":
      throw new Error(
        "Pitch wheel uses pitch-bend, not CC. Use the set_pitch_wheel tool path.",
      );
  }
}

function setControl(id: string, args: Record<string, unknown>) {
  const spec = findControl(id);
  const channel = args.channel as number | undefined;

  if (spec.kind === "pitchWheel") {
    if (typeof args.value !== "number")
      throw new Error("Expected `value` (-1.0 to +1.0)");
    engine.pitchBend(args.value, channel);
    return ok(`Pitch wheel set to ${args.value.toFixed(3)}.`);
  }

  if (spec.kind === "modWheel") {
    const cc = resolveValueForControl(spec, args);
    engine.cc(1, cc, channel); // mod wheel is fixed at CC1
    return ok(`Mod wheel (CC1) set to ${cc}.`);
  }

  if (spec.defaultCC === undefined)
    throw new Error(`Control ${id} has no CC mapping`);
  const cc = resolveValueForControl(spec, args);
  engine.cc(spec.defaultCC, cc, channel);

  return ok(
    `${spec.panelLabel} -> CC${spec.defaultCC} = ${cc}` +
      (spec.kind === "switchN" && typeof args.position === "string"
        ? ` ("${args.position}")`
        : "") +
      (spec.kind === "switch2" && typeof args.on === "boolean"
        ? ` (${args.on ? "ON" : "OFF"})`
        : ""),
  );
}

function cancelSequence(args: Record<string, unknown>) {
  const id = args.sequence_id as string;
  const cancelled = engine.cancelSequence(id);
  return ok(cancelled ? `Cancelled ${id}.` : `No sequence ${id} found.`);
}

function doPanic() {
  const r = engine.panic();
  return ok(
    `Panic: released ${r.releasedNotes} note(s), cancelled ${r.cancelledSequences} sequence(s).`,
  );
}

function listControls(args: Record<string, unknown>) {
  const section = args.section as string | undefined;
  const filtered = section
    ? CONTROL_SURFACE.filter((c) => c.section === section)
    : CONTROL_SURFACE;
  const lines = filtered.map((c) => {
    const cc = c.defaultCC !== undefined ? `CC${c.defaultCC}` : c.kind;
    const positions = c.positions ? ` [${c.positions.join(" | ")}]` : "";
    return `  ${c.id} (${cc}) — ${c.panelLabel}${positions}`;
  });
  const header =
    `${SYNTH_LABEL} control surface (${filtered.length} controls` +
    (section ? ` in ${section}` : "") +
    "):\n";
  return ok(header + lines.join("\n"));
}

function listMidiPorts() {
  const outputs = easymidi.getOutputs();
  const inputs = easymidi.getInputs();
  return ok(
    [
      `MIDI engine port: "${engine.portName}" (${EXISTING_PORT ? "existing" : "virtual"}).`,
      `Default channel: ${DEFAULT_CHANNEL}.`,
      "",
      "Visible MIDI outputs:",
      ...outputs.map((o) => `  - ${o}`),
      "",
      "Visible MIDI inputs:",
      ...inputs.map((i) => `  - ${i}`),
    ].join("\n"),
  );
}

function getActiveNotes() {
  const active = engine.getActiveNotes();
  if (active.length === 0) return ok("No notes currently held.");
  return ok(
    "Active notes:\n" +
      active
        .map(
          (a) =>
            `  ${noteName(a.note)} (MIDI ${a.note}) on ch${a.channel}, held ${a.heldForMs}ms`,
        )
        .join("\n"),
  );
}

function sendRawCC(args: Record<string, unknown>) {
  const controller = args.controller as number;
  const value = args.value as number;
  const channel = args.channel as number | undefined;
  engine.cc(controller, value, channel);
  return ok(`Sent CC${controller} = ${value}.`);
}

function ok(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

// ---- Boot ----

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `[moog-mcp] Ready (${SYNTH_LABEL}). ${EXISTING_PORT ? `Sending to existing port "${EXISTING_PORT}".` : `Created virtual port "${VIRTUAL_PORT_NAME}".`} Default channel: ${DEFAULT_CHANNEL}. Tools exposed: ${ALL_TOOLS.length}.`,
  );
}

main().catch((err) => {
  console.error("[moog-mcp] fatal:", err);
  process.exit(1);
});
