/**
 * Note name <-> MIDI number conversion.
 *
 * Convention: A4 = 69, middle C = C4 = 60 (MIDI standard / Yamaha).
 * Accepts: "C4", "C#4", "Db4", "C-1" (lowest), "G9" (upper bound is 127).
 */
const NOTE_TO_SEMI = {
    C: 0,
    "C#": 1,
    Db: 1,
    D: 2,
    "D#": 3,
    Eb: 3,
    E: 4,
    Fb: 4,
    "E#": 5,
    F: 5,
    "F#": 6,
    Gb: 6,
    G: 7,
    "G#": 8,
    Ab: 8,
    A: 9,
    "A#": 10,
    Bb: 10,
    B: 11,
    Cb: 11,
    "B#": 0,
};
const NOTE_NAME_RE = /^([A-Ga-g])([#bB]?)(-?\d+)$/;
/** Parse "C4", "F#3", "Bb-1" -> MIDI number 0..127. Throws on invalid input. */
export function parseNote(name) {
    const trimmed = name.trim();
    // Allow plain integers too.
    if (/^\d+$/.test(trimmed)) {
        const n = parseInt(trimmed, 10);
        if (n < 0 || n > 127)
            throw new Error(`MIDI note out of range: ${n}`);
        return n;
    }
    const m = NOTE_NAME_RE.exec(trimmed);
    if (!m)
        throw new Error(`Cannot parse note name: "${name}"`);
    const letter = m[1].toUpperCase();
    let accidental = m[2];
    // Normalize "B" (used as flat in some inputs) -> "b". Capital B is ambiguous,
    // but we already captured the letter; the accidental capture only runs on
    // the optional second group, so a capital B here is uncommon. Fold it.
    if (accidental === "B")
        accidental = "b";
    const octave = parseInt(m[3], 10);
    const key = letter + accidental;
    const semi = NOTE_TO_SEMI[key];
    if (semi === undefined)
        throw new Error(`Unknown note: "${name}"`);
    // MIDI: C-1 = 0, C0 = 12, ..., C4 = 60.
    const midi = (octave + 1) * 12 + semi;
    if (midi < 0 || midi > 127)
        throw new Error(`Note out of MIDI range (0..127): "${name}" -> ${midi}`);
    return midi;
}
const PITCH_CLASS_NAMES = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
];
/** MIDI number -> "C4" style. */
export function noteName(midi) {
    if (midi < 0 || midi > 127)
        throw new Error("MIDI note out of range");
    const pc = PITCH_CLASS_NAMES[midi % 12];
    const octave = Math.floor(midi / 12) - 1;
    return `${pc}${octave}`;
}
/**
 * Parse either a note name or an integer to a MIDI number.
 * Convenience for tool input schemas that accept either.
 */
export function parseNoteFlexible(input) {
    if (typeof input === "number") {
        if (!Number.isInteger(input) || input < 0 || input > 127)
            throw new Error(`MIDI note must be integer 0..127, got ${input}`);
        return input;
    }
    return parseNote(input);
}
//# sourceMappingURL=notes.js.map