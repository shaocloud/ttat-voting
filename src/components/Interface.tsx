import { useState } from "preact/hooks";
import { VoteGrid } from "./VoteGrid";
import { useVoteStage } from "../hooks/useVoteStage";

function hasVoted() {
    return new URLSearchParams(location.search).get('state') === 'voted';
}

function Message({ title, body }: { title: string, body?: string }) {
    return (
        <div className="min-h-svh flex flex-col items-center justify-center text-center px-6 text-stone-900">
            <div className="font-[vcr] text-4xl mb-3">{title}</div>
            {body && <p className="font-[vcr] text-lg">{body}</p>}
        </div>
    )
}

export function Interface() {
    const [voted, setVoted] = useState(hasVoted);
    const { stage, loading } = useVoteStage();

    function onVoted() {
        history.replaceState(null, '', '?state=voted');
        setVoted(true);
    }

    if (voted) return <Message title="Vote received!" body="Thanks. Eyes back on the stage 🃏"/>
    if (loading) return <Message title="Loading…"/>
    if (stage === 'PREVOTE') return <Message title="Voting isn't open yet" body="Hang tight, it opens soon 🃏"/>
    if (stage === 'RESULTS') return <Message title="Voting is closed" body="Eyes on the stage 🃏"/>

    return <VoteGrid onVoted={onVoted}/>
}
