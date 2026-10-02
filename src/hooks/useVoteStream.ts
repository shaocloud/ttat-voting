import { useCallback, useEffect, useState } from 'preact/hooks'
import { get, onChildAdded, ref, type Unsubscribe } from 'firebase/database'
import { db } from '../firebase/firebase'
import { paths } from '../services/voteService'
import type { Vote } from '../types/voting'

export interface VoteEvent extends Vote {
    key: string
}

/**
 * Live vote count plus a queue of votes that arrived *after* mount, for animation.
 *
 * Existing votes are fetched once and only counted, so refreshing the page
 * mid-voting doesn't replay them. `onChildAdded` then skips every key from that
 * first fetch. Any vote that lands between the fetch and the listener still
 * counts as new, so none are missed.
 *
 * Call `drain(n)` once the UI has handled the first `n` queued votes (default: all).
 */
export function useVoteStream(sessionId: string | null) {
    const [totalCount, setTotalCount] = useState(0)
    const [newVotes, setNewVotes] = useState<VoteEvent[]>([])

    useEffect(() => {
        setTotalCount(0)
        setNewVotes([])
        if (!sessionId) return

        const votesRef = ref(db, paths.votes(sessionId))
        let cancelled = false
        let unsubscribe: Unsubscribe | null = null

        get(votesRef).then((snap) => {
            if (cancelled) return
            const seen = new Set(Object.keys(snap.val() ?? {}))
            setTotalCount(seen.size)

            unsubscribe = onChildAdded(votesRef, (child) => {
                const key = child.key!
                if (seen.has(key)) return
                seen.add(key)
                setTotalCount((n) => n + 1)
                setNewVotes((queue) => [...queue, { key, ...child.val() }])
            })
        })

        return () => {
            cancelled = true
            unsubscribe?.()
        }
    }, [sessionId])

    const drain = useCallback((n?: number) => {
        setNewVotes((queue) => (n === undefined ? [] : queue.slice(n)))
    }, [])

    return { totalCount, newVotes, drain }
}
