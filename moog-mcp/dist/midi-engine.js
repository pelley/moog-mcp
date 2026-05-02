/**
 * MIDI engine for the Moog MCP server.
 *
 * Owns a single virtual MIDI output port (so the Model D / Model 15 app
 * sees us as a MIDI input device). Tracks held notes for safe panic, and
 * provides timed-sequence playback so the agent can compose phrases.
 */
import * as easymidi from "easymidi";
export class MoogMidiEngine {
    output;
    opts;
    active = new Map();
    sequences = new Map();
    seqCounter = 0;
    constructor(opts) {
        this.opts = opts;
        if (opts.existingPortName) {
            const outputs = easymidi.getOutputs();
            if (!outputs.includes(opts.existingPortName)) {
                throw new Error(`MIDI output port "${opts.existingPortName}" not found. Available: ${outputs.join(", ") || "(none)"}`);
            }
            this.output = new easymidi.Output(opts.existingPortName);
        }
        else {
            // Second arg `true` creates a virtual port (CoreMIDI on macOS).
            this.output = new easymidi.Output(opts.virtualPortName, true);
        }
    }
    get portName() {
        return this.opts.existingPortName ?? this.opts.virtualPortName;
    }
    /** Convert 1-based MIDI channel to 0-based wire channel. */
    ch(channel) {
        const c = channel ?? this.opts.defaultChannel;
        if (c < 1 || c > 16)
            throw new Error(`Channel must be 1..16, got ${c}`);
        return c - 1;
    }
    /** Send Note On immediately. */
    noteOn(note, velocity = 100, channel) {
        this.assertNote(note);
        this.assertVelocity(velocity);
        const c = this.ch(channel);
        const msg = { note, velocity, channel: c };
        this.output.send("noteon", msg);
        const key = `${c}:${note}`;
        // If already active, release the old one's timer.
        const prev = this.active.get(key);
        if (prev?.releaseTimer)
            clearTimeout(prev.releaseTimer);
        this.active.set(key, {
            note,
            channel: c,
            startedAt: Date.now(),
        });
    }
    /** Send Note Off immediately. */
    noteOff(note, channel) {
        this.assertNote(note);
        const c = this.ch(channel);
        const msg = { note, velocity: 0, channel: c };
        this.output.send("noteoff", msg);
        const key = `${c}:${note}`;
        const a = this.active.get(key);
        if (a?.releaseTimer)
            clearTimeout(a.releaseTimer);
        this.active.delete(key);
    }
    /**
     * Play a single note for `durationMs`, then auto-release.
     * Returns a promise that resolves when the note is released.
     */
    playNote(opts) {
        const { note, velocity = 100, durationMs, channel } = opts;
        if (durationMs < 0)
            throw new Error("durationMs must be >= 0");
        this.noteOn(note, velocity, channel);
        return new Promise((resolve) => {
            const t = setTimeout(() => {
                this.noteOff(note, channel);
                resolve();
            }, durationMs);
            const c = this.ch(channel);
            const a = this.active.get(`${c}:${note}`);
            if (a)
                a.releaseTimer = t;
        });
    }
    /** Send a Control Change message. */
    cc(controller, value, channel) {
        this.assertCC(controller);
        this.assertCCValue(value);
        const c = this.ch(channel);
        const msg = {
            controller,
            value,
            channel: c,
        };
        this.output.send("cc", msg);
    }
    /**
     * Send 14-bit pitch bend. value is -1.0..+1.0.
     * 0.0 = center (8192 in raw 14-bit form).
     */
    pitchBend(value, channel) {
        if (value < -1 || value > 1)
            throw new Error("pitchBend value must be -1.0..+1.0");
        const c = this.ch(channel);
        // Map -1..+1 to 0..16383, center 8192.
        const raw = Math.round((value + 1) * 8191.5);
        const clamped = Math.max(0, Math.min(16383, raw));
        const msg = { value: clamped, channel: c };
        this.output.send("pitch", msg);
    }
    /**
     * Schedule a sequence of MIDI events. Returns a sequence id that can be
     * passed to cancelSequence(). The sequence runs asynchronously; this method
     * returns once all events are scheduled (not when they finish playing).
     */
    scheduleSequence(events) {
        const id = `seq-${++this.seqCounter}`;
        const seq = {
            id,
            startedAt: Date.now(),
            cancelled: false,
            timers: [],
        };
        this.sequences.set(id, seq);
        for (const ev of events) {
            const t = setTimeout(() => {
                if (seq.cancelled)
                    return;
                this.dispatchEvent(ev);
            }, Math.max(0, ev.atMs));
            seq.timers.push(t);
        }
        // Self-cleanup after the last event + a small grace window.
        const horizon = events.reduce((m, e) => Math.max(m, e.atMs + ("durationMs" in e ? e.durationMs : 0)), 0);
        const cleanup = setTimeout(() => {
            this.sequences.delete(id);
        }, horizon + 250);
        seq.timers.push(cleanup);
        return id;
    }
    cancelSequence(id) {
        const seq = this.sequences.get(id);
        if (!seq)
            return false;
        seq.cancelled = true;
        for (const t of seq.timers)
            clearTimeout(t);
        this.sequences.delete(id);
        return true;
    }
    cancelAllSequences() {
        const n = this.sequences.size;
        for (const id of Array.from(this.sequences.keys())) {
            this.cancelSequence(id);
        }
        return n;
    }
    dispatchEvent(ev) {
        switch (ev.kind) {
            case "note": {
                // Fire and schedule release.
                this.noteOn(ev.note, ev.velocity ?? 100, ev.channel);
                setTimeout(() => {
                    // Only release if we haven't already (e.g., via panic).
                    const c = this.ch(ev.channel);
                    if (this.active.has(`${c}:${ev.note}`)) {
                        this.noteOff(ev.note, ev.channel);
                    }
                }, ev.durationMs);
                return;
            }
            case "cc":
                this.cc(ev.controller, ev.value, ev.channel);
                return;
            case "pitchBend":
                this.pitchBend(ev.value, ev.channel);
                return;
        }
    }
    /**
     * Send All Notes Off + manual note-off for all currently held notes.
     * Belt-and-suspenders: some synths ignore CC123, so we explicitly release.
     */
    panic() {
        const cancelled = this.cancelAllSequences();
        let released = 0;
        for (const [, a] of this.active) {
            if (a.releaseTimer)
                clearTimeout(a.releaseTimer);
            const msg = {
                note: a.note,
                velocity: 0,
                channel: a.channel,
            };
            this.output.send("noteoff", msg);
            released++;
        }
        this.active.clear();
        // Send All Notes Off (CC123) on every channel for good measure.
        for (let c = 0; c < 16; c++) {
            const msg = {
                controller: 123,
                value: 0,
                channel: c,
            };
            this.output.send("cc", msg);
        }
        return { releasedNotes: released, cancelledSequences: cancelled };
    }
    /** List currently active (held) notes. */
    getActiveNotes() {
        const now = Date.now();
        return [...this.active.values()].map((a) => ({
            note: a.note,
            channel: a.channel + 1,
            heldForMs: now - a.startedAt,
        }));
    }
    close() {
        this.panic();
        this.output.close();
    }
    // ---- validation helpers ----
    assertNote(n) {
        if (!Number.isInteger(n) || n < 0 || n > 127)
            throw new Error(`MIDI note must be 0..127, got ${n}`);
    }
    assertVelocity(v) {
        if (!Number.isInteger(v) || v < 1 || v > 127)
            throw new Error(`Velocity must be 1..127, got ${v}`);
    }
    assertCC(c) {
        if (!Number.isInteger(c) || c < 0 || c > 127)
            throw new Error(`CC controller must be 0..127, got ${c}`);
    }
    assertCCValue(v) {
        if (!Number.isInteger(v) || v < 0 || v > 127)
            throw new Error(`CC value must be 0..127, got ${v}`);
    }
}
//# sourceMappingURL=midi-engine.js.map