import { useEffect, useState } from 'preact/hooks'
import { onValue, ref } from 'firebase/database'
import { db } from '../firebase/firebase'
import { paths } from '../services/voteService'
import { normalizeResults } from '../utils/tally'
import type { FrozenResults } from '../types/voting'

/**
 * Live frozen results and reveal index for a session. The cards to show are
 * `results.order.slice(0, revealIndex)`; the winner is shown when
 * `revealIndex === results.order.length`.
 */
export function useResults(sessionId: string | null) {
    const [results, setResults] = useState<FrozenResults | null>(null)
    const [revealIndex, setRevealIndex] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setResults(null)
        setRevealIndex(0)
        if (!sessionId) {
            setLoading(false)
            return
        }
        setLoading(true)

        const offResults = onValue(ref(db, paths.results(sessionId)), (snap) => {
            setResults(normalizeResults(snap.val()))
            setLoading(false)
        })
        const offIndex = onValue(ref(db, paths.revealIndex(sessionId)), (snap) => {
            setRevealIndex(snap.val() ?? 0)
        })

        return () => {
            offResults()
            offIndex()
        }
    }, [sessionId])

    return { results, revealIndex, loading }
}
