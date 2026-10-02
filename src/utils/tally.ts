import type { FrozenResults, Vote } from "../types/voting";

// character ids are numeric strings; compare as numbers so "10" sorts after "2"
function byId(a: string, b: string) {
    return Number(a) - Number(b) || a.localeCompare(b);
}

/**
 * Turns a session's raw votes into the frozen reveal order.
 * - every character appears, zero-vote ones first
 * - equal counts are ordered by character id, so a re-tally never reshuffles
 * - if several characters share the top count, they are listed in
 *   `tiedForFirst` and one of them (picked with `rng`) goes last
 */
export function tally(
    votes: Record<string, Vote> | null | undefined,
    characterIds: string[],
    rng: () => number = Math.random,
    frozenAt: number = Date.now(),
): FrozenResults {
    const counts: Record<string, number> = {};
    for (const id of characterIds) counts[id] = 0;
    for (const vote of Object.values(votes ?? {})) {
        // votes for unknown characters are ignored (the rules should prevent them anyway)
        if (vote && vote.characterId in counts) counts[vote.characterId]++;
    }

    const order = [...characterIds].sort((a, b) => counts[a] - counts[b] || byId(a, b));
    const results: FrozenResults = { order, counts, frozenAt };
    if (order.length < 2) return results;

    const top = counts[order[order.length - 1]];
    const tied = order.filter((id) => counts[id] === top);
    if (tied.length > 1) {
        results.tiedForFirst = tied;
        const winner = tied[Math.min(tied.length - 1, Math.floor(rng() * tied.length))];
        results.order = moveToEnd(order, winner);
    }
    return results;
}

/** Admin override for a tie: makes `characterId` the winner. */
export function applyTieResolution(results: FrozenResults, characterId: string): FrozenResults {
    if (!results.tiedForFirst?.includes(characterId)) {
        throw new Error(`${characterId} is not tied for first`);
    }
    return { ...results, order: moveToEnd(results.order, characterId) };
}

function moveToEnd(order: string[], id: string) {
    return [...order.filter((x) => x !== id), id];
}

/**
 * RTDB turns objects with keys "0".."n" into arrays on read, so `counts`
 * can come back as an array. Normalise it back to a plain record.
 */
export function normalizeResults(raw: any): FrozenResults | null {
    if (!raw || !Array.isArray(raw.order)) return null;
    const results: FrozenResults = {
        order: raw.order,
        counts: Object.assign({}, raw.counts),
        frozenAt: raw.frozenAt,
    };
    if (Array.isArray(raw.tiedForFirst)) results.tiedForFirst = raw.tiedForFirst;
    return results;
}
