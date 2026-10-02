import {
    get,
    push,
    ref,
    runTransaction,
    serverTimestamp,
    set,
    update,
} from 'firebase/database'
import { db } from '../firebase/firebase'
import { loadCharacterIds } from '../data/characters'
import { applyTieResolution, normalizeResults, tally } from '../utils/tally'
import type { FrozenResults, VoteStage } from '../types/voting'

// ---- paths ----
export const paths = {
    voteStage: 'voteStage',
    currentSessionId: 'currentSessionId',
    sessions: 'sessions',
    meta: (sid: string) => `sessions/${sid}/meta`,
    endedAt: (sid: string) => `sessions/${sid}/meta/endedAt`,
    votes: (sid: string) => `sessions/${sid}/votes`,
    results: (sid: string) => `sessions/${sid}/results`,
    revealIndex: (sid: string) => `sessions/${sid}/revealIndex`,
}

export class VotingClosedError extends Error {
    constructor() {
        super('Voting is not open')
        this.name = 'VotingClosedError'
    }
}

// ---- reads ----
export async function getVoteStage(): Promise<VoteStage> {
    return (await get(ref(db, paths.voteStage))).val() ?? 'PREVOTE'
}

export async function getCurrentSessionId(): Promise<string | null> {
    return (await get(ref(db, paths.currentSessionId))).val()
}

export async function getResults(sessionId: string): Promise<FrozenResults | null> {
    return normalizeResults((await get(ref(db, paths.results(sessionId)))).val())
}

async function requireSession(stage: VoteStage): Promise<string> {
    const [current, sid] = await Promise.all([getVoteStage(), getCurrentSessionId()])
    if (current !== stage || !sid) {
        throw new Error(`Expected stage ${stage} with a session, got ${current} / ${sid}`)
    }
    return sid
}

// ---- stage changes ----

/** PREVOTE/RESULTS → VOTING with a fresh session. Returns the new session id. */
export async function startVoting(): Promise<string> {
    if (await getVoteStage() === 'VOTING') {
        throw new Error('Voting is already open')
    }
    const sid = push(ref(db, paths.sessions)).key!
    await update(ref(db), {
        [paths.voteStage]: 'VOTING',
        [paths.currentSessionId]: sid,
        [paths.meta(sid)]: { startedAt: serverTimestamp() },
    })
    return sid
}

/**
 * Records one vote in the current session. Throws VotingClosedError outside VOTING;
 * the database rules reject it too, so a stale client can't sneak one in.
 */
export async function castVote(characterId: string): Promise<void> {
    const [stage, sid] = await Promise.all([getVoteStage(), getCurrentSessionId()])
    if (stage !== 'VOTING' || !sid) throw new VotingClosedError()
    try {
        await push(ref(db, paths.votes(sid)), { characterId, ts: serverTimestamp() })
    } catch (err) {
        // the rules reject votes once voting has closed or moved to a new session
        if (String(err).includes('PERMISSION_DENIED')) throw new VotingClosedError()
        throw err
    }
}

/**
 * VOTING → RESULTS.
 * 1. writes meta/endedAt, after which the rules refuse new votes
 * 2. reads every vote once and tallies them
 * 3. one update(): results, revealIndex = 0, voteStage = RESULTS
 * Safe to retry if it fails partway: the stage stays VOTING until step 3.
 */
export async function endVotingAndFreeze(characterIds?: string[]): Promise<FrozenResults> {
    const sid = await requireSession('VOTING')
    const ids = characterIds ?? await loadCharacterIds()

    await set(ref(db, paths.endedAt(sid)), serverTimestamp())
    const votes = (await get(ref(db, paths.votes(sid)))).val()
    const results = tally(votes, ids)

    await update(ref(db), {
        [paths.results(sid)]: { ...results, frozenAt: serverTimestamp() },
        [paths.revealIndex(sid)]: 0,
        [paths.voteStage]: 'RESULTS',
    })
    return results
}

/** Back to PREVOTE. Old sessions stay in the database. */
export async function resetToPrevote(): Promise<void> {
    await update(ref(db), {
        [paths.voteStage]: 'PREVOTE',
        [paths.currentSessionId]: null,
    })
}

// ---- reveal ----

async function requireResults(): Promise<{ sid: string, results: FrozenResults }> {
    const sid = await requireSession('RESULTS')
    const results = await getResults(sid)
    if (!results) throw new Error('No frozen results for this session')
    return { sid, results }
}

/** Reveals one more card, up to order.length. Returns the new index. */
export async function revealNext(): Promise<number> {
    const { sid, results } = await requireResults()
    const max = results.order.length
    const tx = await runTransaction(ref(db, paths.revealIndex(sid)),
        (cur: number | null) => Math.min((cur ?? 0) + 1, max))
    return tx.snapshot.val()
}

/** Hides the last revealed card, down to 0. Returns the new index. */
export async function revealPrevious(): Promise<number> {
    const sid = await requireSession('RESULTS')
    const tx = await runTransaction(ref(db, paths.revealIndex(sid)),
        (cur: number | null) => Math.max((cur ?? 0) - 1, 0))
    return tx.snapshot.val()
}

/**
 * Picks the winner when the top spot is tied: moves `characterId` to the end of
 * `order`. Only allowed for a tied character, and only before the winner is shown.
 */
export async function resolveTie(characterId: string): Promise<FrozenResults> {
    const { sid, results } = await requireResults()
    const revealed = (await get(ref(db, paths.revealIndex(sid)))).val() ?? 0
    if (revealed >= results.order.length) {
        throw new Error('The winner has already been revealed')
    }
    const resolved = applyTieResolution(results, characterId)
    await set(ref(db, `${paths.results(sid)}/order`), resolved.order)
    return resolved
}

// ---- rehearsal ----

/** Dev only: writes `n` random votes to the current session. */
export async function addFakeVotes(n: number, characterIds?: string[]): Promise<void> {
    const ids = characterIds ?? await loadCharacterIds()
    const sid = await requireSession('VOTING')
    const writes: Record<string, unknown> = {}
    for (let i = 0; i < n; i++) {
        const key = push(ref(db, paths.votes(sid))).key!
        writes[`${paths.votes(sid)}/${key}`] = {
            characterId: ids[Math.floor(Math.random() * ids.length)],
            ts: serverTimestamp(),
        }
    }
    // one multi-path update; the rules still check every vote individually
    await update(ref(db), writes)
}
