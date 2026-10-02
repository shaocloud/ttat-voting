import { useEffect, useState } from 'preact/hooks'
import { onValue, ref } from 'firebase/database'
import { db } from '../firebase/firebase'
import { paths } from '../services/voteService'

/** Live `/currentSessionId` (null in PREVOTE). */
export function useCurrentSession(): { sessionId: string | null, loading: boolean } {
    const [sessionId, setSessionId] = useState<string | null | undefined>(undefined)

    useEffect(() => onValue(ref(db, paths.currentSessionId), (snap) => {
        setSessionId(snap.val())
    }), [])

    return { sessionId: sessionId ?? null, loading: sessionId === undefined }
}
