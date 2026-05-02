#!/usr/bin/env node
/**
 * Quick utility: list all MIDI ports visible on this system.
 * Run with `npm run list-ports`.
 */
import * as easymidi from "easymidi";
console.log("MIDI Outputs:");
for (const o of easymidi.getOutputs())
    console.log(`  - ${o}`);
console.log("\nMIDI Inputs:");
for (const i of easymidi.getInputs())
    console.log(`  - ${i}`);
//# sourceMappingURL=list-ports.js.map