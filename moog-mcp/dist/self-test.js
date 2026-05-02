/**
 * Smoke test for the pure (non-MIDI) logic. Verifies note parsing,
 * control surface lookups, and value -> CC translation.
 *
 * Run: npx tsx src/self-test.ts
 */
import { parseNote, parseNoteFlexible, noteName } from "./notes.js";
import { CONTROL_SURFACE, findControl, normalizedToCC, positionToCC, } from "./model-d.js";
let pass = 0;
let fail = 0;
function eq(label, actual, expected) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) {
        pass++;
        console.log(`  ✓ ${label}`);
    }
    else {
        fail++;
        console.error(`  ✗ ${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}
function throws(label, fn) {
    try {
        fn();
        fail++;
        console.error(`  ✗ ${label}: expected throw, but did not`);
    }
    catch {
        pass++;
        console.log(`  ✓ ${label}`);
    }
}
console.log("=== Note parsing ===");
eq("C4 = 60", parseNote("C4"), 60);
eq("A4 = 69", parseNote("A4"), 69);
eq("C-1 = 0", parseNote("C-1"), 0);
eq("G9 = 127", parseNote("G9"), 127);
eq("F#3 = 54", parseNote("F#3"), 54);
eq("Gb3 = 54 (enharmonic)", parseNote("Gb3"), 54);
eq("Bb-1 = 10", parseNote("Bb-1"), 10);
eq('"60" parses to 60', parseNoteFlexible("60"), 60);
eq("60 (number) parses to 60", parseNoteFlexible(60), 60);
throws("invalid note throws", () => parseNote("Q4"));
throws("out-of-range throws", () => parseNote("C12"));
console.log("\n=== Note name round-trip ===");
eq("60 -> C4", noteName(60), "C4");
eq("0 -> C-1", noteName(0), "C-1");
eq("127 -> G9", noteName(127), "G9");
eq("69 -> A4", noteName(69), "A4");
console.log("\n=== Control surface ===");
const cutoff = findControl("filter_cutoff");
eq("filter_cutoff defaults to CC74", cutoff.defaultCC, 74);
eq("filter_cutoff is continuous", cutoff.kind, "continuous");
const wave = findControl("osc1_waveform");
eq("osc1_waveform has 7 positions", wave.positions?.length, 7);
eq("positionToCC: triangle = 0", positionToCC(wave, "triangle"), 0);
eq("positionToCC: narrow-pulse = 127", positionToCC(wave, "narrow-pulse"), 127);
eq("positionToCC: middle waveform sits in middle", positionToCC(wave, "reverse-sawtooth"), Math.round((3 * 127) / 6));
throws("Unknown position throws", () => positionToCC(wave, "wobble"));
console.log("\n=== Value normalization ===");
eq("0.0 -> 0", normalizedToCC(0), 0);
eq("0.5 -> 64", normalizedToCC(0.5), 64);
eq("1.0 -> 127", normalizedToCC(1), 127);
eq("clamp negative", normalizedToCC(-0.5), 0);
eq("clamp over 1", normalizedToCC(2), 127);
console.log("\n=== Control surface coverage ===");
const expectedSections = [
    "controllers",
    "oscillator-bank",
    "mixer",
    "modifiers",
    "output",
    "performance",
];
for (const section of expectedSections) {
    const count = CONTROL_SURFACE.filter((c) => c.section === section).length;
    console.log(`  ${section}: ${count} controls`);
}
const ids = CONTROL_SURFACE.map((c) => c.id);
const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
eq("no duplicate ids", dupIds, []);
const ccs = CONTROL_SURFACE.map((c) => c.defaultCC).filter((n) => n !== undefined);
const dupCCs = ccs.filter((cc, i) => ccs.indexOf(cc) !== i);
eq("no duplicate CCs", dupCCs, []);
// Sanity: no use of reserved CCs (0, 6, 32, 38, 64, 96-101, 120-127).
const reserved = new Set([0, 6, 32, 38, 64, 96, 97, 98, 99, 100, 101, 120, 121, 122, 123, 124, 125, 126, 127]);
const violations = ccs.filter((cc) => reserved.has(cc));
eq("no reserved CC collisions", violations, []);
console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
//# sourceMappingURL=self-test.js.map