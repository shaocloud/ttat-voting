import { useState } from "preact/hooks";
import { VoteGrid } from "./VoteGrid";

function hasVoted() {
    return new URLSearchParams(location.search).get('state') === 'voted';
}

export function Interface() {
    const [voted, setVoted] = useState(hasVoted);

    function onVoted() {
        history.replaceState(null, '', '?state=voted');
        setVoted(true);
    }

    if (voted) {
        return (
            <div className="min-h-svh flex flex-col items-center justify-center text-center px-6 text-stone-900">
                <div className="font-[vcr] text-4xl mb-3">Vote received!</div>
                <p className="font-[vcr] text-lg">Thanks. Eyes back on the stage 🃏</p>
            </div>
        )
    }

    return <VoteGrid onVoted={onVoted}/>
}
