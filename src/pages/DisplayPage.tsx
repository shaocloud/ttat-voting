import { useEffect, useState } from "preact/hooks";
import { useVoteStage } from "../hooks/useVoteStage";
import { useCurrentSession } from "../hooks/useCurrentSession";
import { useVoteStream } from "../hooks/useVoteStream";
import { useResults } from "../hooks/useResults";
import { useCharacters } from "../hooks/useCharacters";

// placeholder projector view: prints state as text; animations come later
export function DisplayPage() {
    const { stage, loading } = useVoteStage();
    const { sessionId } = useCurrentSession();
    const { totalCount, newVotes, drain } = useVoteStream(stage === "VOTING" ? sessionId : null);
    const { results, revealIndex } = useResults(stage === "RESULTS" ? sessionId : null);
    const { byId } = useCharacters();
    const [lastVote, setLastVote] = useState<string | null>(null);

    // stand-in for the ballot animation: show the latest new vote, then clear the queue
    useEffect(() => {
        if (!newVotes.length) return;
        setLastVote(newVotes[newVotes.length - 1].characterId);
        drain(newVotes.length);
    }, [newVotes]);

    const name = (id: string) => byId[id]?.name ?? id;
    const revealed = results?.order.slice(0, revealIndex) ?? [];
    const winnerShown = !!results && revealIndex === results.order.length;

    return (
        <div className="min-h-screen bg-stone-950 text-white font-[vcr] flex flex-col items-center justify-center gap-6 text-center p-8">
            <div className="text-8xl">{loading ? "…" : stage}</div>

            {stage === "VOTING" && (
                <>
                    <div className="text-6xl">{totalCount} votes</div>
                    {lastVote && <div className="text-2xl opacity-60">new vote: {name(lastVote)}</div>}
                </>
            )}

            {stage === "RESULTS" && results && (
                <ol className="text-3xl space-y-2">
                    {revealed.map((id, i) => (
                        <li key={id}>
                            {winnerShown && i === revealed.length - 1
                                ? <span className="text-red-500">GUILTY: {name(id)} ({results.counts[id] ?? 0})</span>
                                : <>{name(id)} ({results.counts[id] ?? 0})</>}
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}
