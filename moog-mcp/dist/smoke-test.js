/**
 * Smoke test for the MIDI side. Run this on your Mac after building:
 *
 *   npm run build && node dist/smoke-test.js
 *
 * It opens the virtual port, plays a short chord, then sweeps the filter
 * cutoff CC over a couple of seconds while a note is held. If you have
 * the Model D app open with the CC map loaded, you should hear it.
 *
 * Set MOOG_MCP_USE_PORT=<existing port name> to send through IAC instead.
 */
import { MoogMidiEngine } from "./midi-engine.js";
import { findControl } from "./model-d.js";
import { parseNote } from "./notes.js";
const portName = process.env.MOOG_MCP_PORT_NAME ?? "Moog MCP Out";
const existing = process.env.MOOG_MCP_USE_PORT;
const channel = parseInt(process.env.MOOG_MCP_CHANNEL ?? "1", 10);
const engine = new MoogMidiEngine({
    virtualPortName: portName,
    existingPortName: existing,
    defaultChannel: channel,
});
console.log(`[smoke-test] using port "${engine.portName}" on channel ${channel}`);
const cutoffCC = findControl("filter_cutoff").defaultCC;
const resonanceCC = findControl("filter_emphasis").defaultCC;
async function main() {
    // 1. Quick C major triad to make sure notes work.
    console.log("[smoke-test] playing C major triad...");
    const notes = ["C4", "E4", "G4"].map(parseNote);
    for (const n of notes)
        engine.noteOn(n, 100);
    await sleep(800);
    for (const n of notes)
        engine.noteOff(n);
    await sleep(200);
    // 2. Hold a low note, sweep the filter from closed to open.
    console.log("[smoke-test] sweeping filter under a held C2...");
    engine.cc(resonanceCC, 96); // bump resonance for an audible sweep
    engine.noteOn(parseNote("C2"), 90);
    const steps = 60;
    const totalMs = 3000;
    for (let i = 0; i <= steps; i++) {
        const v = Math.round((i / steps) * 127);
        engine.cc(cutoffCC, v);
        await sleep(totalMs / steps);
    }
    await sleep(500);
    engine.noteOff(parseNote("C2"));
    engine.cc(cutoffCC, 64); // park cutoff in the middle
    engine.cc(resonanceCC, 0); // and resonance off
    // 3. Clean exit.
    await sleep(200);
    engine.close();
    console.log("[smoke-test] done.");
}
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
main().catch((e) => {
    console.error("[smoke-test] failed:", e);
    engine.close();
    process.exit(1);
});
//# sourceMappingURL=smoke-test.js.map