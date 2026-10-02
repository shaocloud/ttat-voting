import { useEffect, useState } from "preact/hooks";
import { useVoteStage } from "../hooks/useVoteStage";
import { useCurrentSession } from "../hooks/useCurrentSession";
import { useVoteStream } from "../hooks/useVoteStream";
import { useResults } from "../hooks/useResults";
import { useCharacters } from "../hooks/useCharacters";
import {
    addFakeVotes,
    endVotingAndFreeze,
    resetToPrevote,
    resolveTie,
    revealNext,
    revealPrevious,
    startVoting,
} from "../services/voteService";

// placeholder control panel: logic only, no styling effort
export function AdminPage() {
    const { stage, loading } = useVoteStage();
    const { sessionId } = useCurrentSession();
    const { totalCount, newVotes, drain } = useVoteStream(sessionId);
    const { results, revealIndex } = useResults(stage === "RESULTS" ? sessionId : null);
    const { byId } = useCharacters();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // the admin page only needs the count, not the animation queue
    useEffect(() => { if (newVotes.length) drain(); }, [newVotes]);

    async function run(action: () => Promise<unknown>) {
        setBusy(true);
        setError(null);
        try {
            await action();
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setBusy(false);
        }
    }

    const name = (id: string) => byId[id]?.name ?? id;
    const button = "rounded border-2 border-stone-900 px-4 py-2 font-[vcr] disabled:opacity-40";
    const winnerShown = !!results && revealIndex >= results.order.length;

    return (
        <div className="min-h-screen bg-stone-100 text-stone-900 p-6 font-[vcr] space-y-4">
            <h1 className="text-3xl">Admin</h1>
            <div>Stage: <b>{loading ? "…" : stage}</b></div>
            <div>Session: {sessionId ?? "none"}</div>
            <div>Votes: {totalCount}</div>

            <div className="flex flex-wrap gap-2">
                <button className={button} disabled={busy || stage === "VOTING"} onClick={() => run(startVoting)}>Start Voting</button>
                <button className={button} disabled={busy || stage !== "VOTING"} onClick={() => run(() => addFakeVotes(10))}>Add 10 Fake Votes</button>
                <button className={button} disabled={busy || stage !== "VOTING"} onClick={() => run(endVotingAndFreeze)}>End Voting</button>
                <button className={button} disabled={busy || stage !== "RESULTS"} onClick={() => run(revealNext)}>Next Card</button>
                <button className={button} disabled={busy || stage !== "RESULTS"} onClick={() => run(revealPrevious)}>Previous Card</button>
                <button
                    className={button}
                    disabled={busy}
                    onClick={() => confirm("Reset to PREVOTE? The current session stays in the database.") && run(resetToPrevote)}>
                    Reset
                </button>
            </div>

            {error && <div className="text-red-700">{error}</div>}

            {results && (
                <div className="space-y-2">
                    <div>Revealed {revealIndex} / {results.order.length}</div>
                    {results.tiedForFirst && (
                        <div className="space-y-2">
                            <div>Tie for first: pick the winner{winnerShown && " (already revealed)"}</div>
                            <div className="flex flex-wrap gap-2">
                                {results.tiedForFirst.map((id) => (
                                    <button
                                        key={id}
                                        className={button}
                                        disabled={busy || winnerShown}
                                        onClick={() => run(() => resolveTie(id))}>
                                        {name(id)}{results.order[results.order.length - 1] === id && " ✓"}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <ol className="list-decimal pl-6">
                        {results.order.map((id, i) => (
                            <li key={id} className={i < revealIndex ? "" : "opacity-40"}>
                                {name(id)}: {results.counts[id] ?? 0}
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}
