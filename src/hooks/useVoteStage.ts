import { useEffect, useState } from 'preact/hooks'
import { onValue, ref } from 'firebase/database'
import { db } from '../firebase/firebase'
import { paths } from '../services/voteService'
import type { VoteStage } from '../types/voting'

/** Live `/voteStage`. Defaults to PREVOTE when the node is empty. */
export function useVoteStage(): { stage: VoteStage, loading: boolean } {
    const [stage, setStage] = useState<VoteStage | null>(null)

    useEffect(() => onValue(ref(db, paths.voteStage), (snap) => {
        setStage(snap.val() ?? 'PREVOTE')
    }), [])

    return { stage: stage ?? 'PREVOTE', loading: stage === null }
}
