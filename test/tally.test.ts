import { describe, expect, it } from "vitest";
import { applyTieResolution, normalizeResults, tally } from "../src/utils/tally";
import type { Vote } from "../src/types/voting";

const ids = ["0", "1", "2", "3", "10"];

function votesFor(...characterIds: string[]): Record<string, Vote> {
    return Object.fromEntries(characterIds.map((characterId, i) => [`k${i}`, { characterId, ts: i }]));
}

describe("tally", () => {
    it("includes zero-vote characters at the start", () => {
        const r = tally(votesFor("3", "3", "1"), ids);
        expect(r.order).toEqual(["0", "2", "10", "1", "3"]);
        expect(r.counts).toEqual({ "0": 0, "1": 1, "2": 0, "3": 2, "10": 0 });
        expect(r.tiedForFirst).toBeUndefined();
    });

    it("breaks non-winner ties by numeric id, regardless of vote order", () => {
        const a = tally(votesFor("10", "2", "3", "3", "3"), ids);
        const b = tally(votesFor("3", "2", "3", "10", "3"), ids);
        expect(a.order).toEqual(["0", "1", "2", "10", "3"]);
        expect(b.order).toEqual(a.order);
    });

    it("is identical across repeated tallies", () => {
        const votes = votesFor("1", "2", "2", "0", "10", "10", "10");
        const first = tally(votes, ids, () => 0.5, 1);
        for (let i = 0; i < 5; i++) expect(tally(votes, ids, () => 0.5, 1)).toEqual(first);
    });

    it("flags a tie for first and picks the winner with rng", () => {
        const votes = votesFor("1", "1", "3", "3", "0");
        const low = tally(votes, ids, () => 0);
        const high = tally(votes, ids, () => 0.99);
        expect(low.tiedForFirst).toEqual(["1", "3"]);
        expect(low.order).toEqual(["2", "10", "0", "3", "1"]);
        expect(high.order).toEqual(["2", "10", "0", "1", "3"]);
    });

    it("treats an empty session as everyone tied", () => {
        const r = tally({}, ids, () => 0);
        expect(Object.values(r.counts).every((n) => n === 0)).toBe(true);
        expect(r.tiedForFirst).toEqual(["0", "1", "2", "3", "10"]);
        expect(r.order[r.order.length - 1]).toBe("0");
        expect(tally(null, ids, () => 0).order).toEqual(r.order);
    });

    it("ignores votes for unknown characters", () => {
        const r = tally(votesFor("99", "2"), ids);
        expect(r.counts["99"]).toBeUndefined();
        expect(r.order[r.order.length - 1]).toBe("2");
    });

    it("handles zero or one character", () => {
        expect(tally({}, []).order).toEqual([]);
        expect(tally(votesFor("1"), ["1"]).tiedForFirst).toBeUndefined();
    });
});

describe("applyTieResolution", () => {
    it("moves the chosen tied character last", () => {
        const r = tally(votesFor("1", "3"), ids, () => 0.99); // random pick: "3"
        expect(r.order[r.order.length - 1]).toBe("3");
        expect(applyTieResolution(r, "1").order).toEqual(["0", "2", "10", "3", "1"]);
    });

    it("rejects characters that are not tied for first", () => {
        const r = tally(votesFor("1", "3"), ids);
        expect(() => applyTieResolution(r, "0")).toThrow();
        expect(() => applyTieResolution(tally(votesFor("1"), ids), "1")).toThrow();
    });
});

describe("normalizeResults", () => {
    it("turns array-shaped counts back into a record", () => {
        const r = normalizeResults({ order: ["0", "1"], counts: [2, 5], frozenAt: 1 });
        expect(r).toEqual({ order: ["0", "1"], counts: { "0": 2, "1": 5 }, frozenAt: 1 });
    });

    it("returns null for missing results", () => {
        expect(normalizeResults(null)).toBeNull();
    });
});
