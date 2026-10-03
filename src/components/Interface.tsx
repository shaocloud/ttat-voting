import { useEffect, useState } from "preact/hooks";
import { VoteGrid } from "./VoteGrid";
import { useVoteStage } from "../hooks/useVoteStage";
import { watchVotes } from "../firebase/firebase";
import { useCharacters } from "../hooks/useCharacters";

// testing aids: reset button on the results screen + a "dev build" footer.
// flip to false before the real show.
export const DEV_MODE = true;

const VOTED_KEY = 'ttat-voted';

function hasVoted() {
    if (new URLSearchParams(location.search).get('state') === 'voted') return true;
    try { return localStorage.getItem(VOTED_KEY) === '1'; } catch { return false; }
}

function VoteTable() {
    const [counts, setCounts] = useState<Record<string, number> | null>(null);
    const { byId } = useCharacters();

    useEffect(() => watchVotes(setCounts), []);

    if (!counts) return <p className="font-[vcr] text-stone-500">Loading…</p>;

    // RTDB hands back an array (with holes) when keys are small integers
    const rows = Object.entries(counts)
        .filter(([, n]) => n != null)
        .sort(([a], [b]) => Number(a) - Number(b));

    if (rows.length === 0) return <p className="font-[vcr] text-stone-500">No votes yet</p>;

    return (
        <table className="font-[vcr] text-lg w-full max-w-xs">
            <thead>
                <tr className="border-b-2 border-stone-900">
                    <th className="text-left py-1">id</th>
                    <th className="text-left py-1">name</th>
                    <th className="text-right py-1">votes</th>
                </tr>
            </thead>
            <tbody>
                {rows.map(([id, n]) => (
                    <tr key={id} className="border-b border-stone-300">
                        <td className="text-left py-1">{id}</td>
                        <td className="text-left py-1">{byId[id]?.name}</td>
                        <td className="text-right py-1">{n}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
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
    // VoteGrid outlives `voted` briefly, as an overlay playing its exit animation
    const [showGrid, setShowGrid] = useState(() => !hasVoted());
    const { stage, loading } = useVoteStage();

    function onVoted() {
        try { localStorage.setItem(VOTED_KEY, '1'); } catch {}
        history.replaceState(null, '', '?state=voted');
        // screen swap happens later via onReveal, once the "VOTED" animation has played.
        // A refresh before that lands on the voted screen via hasVoted().
    }

    function resetVoted() {
        try { localStorage.removeItem(VOTED_KEY); } catch {}
        history.replaceState(null, '', location.pathname);
        setVoted(false);
        setShowGrid(true);
    }
    
//    if (voted) return <Message title="Vote received!" body="Thanks. Eyes back on the stage 🃏"/>
    if (loading) return <Message title="Loading…"/>
    if (stage === 'PREVOTE') return <Message title="Voting isn't open yet" body="Hang tight, it opens soon 🃏"/>
    if (stage === 'RESULTS') return <Message title="Voting is closed" body="Eyes on the stage 🃏"/>

    const received = voted && (
        <div className="min-h-svh flex flex-col items-center justify-center text-center px-6 text-stone-900 gap-6">
            <div>
                <div className="font-[vcr] text-4xl mb-3">Vote received!</div>
                <p className="font-[vcr] text-lg">🃏 Thanks! 🃏</p>
            </div>
            <VoteTable/>
            {DEV_MODE && (
                <button
                    type="button"
                    onClick={resetVoted}
                    className="rounded-lg border-2 border-dashed border-stone-500 text-stone-600 px-4 py-2 font-[vcr] text-sm">
                    Reset vote (dev)
                </button>
            )}
        </div>
    );

    return (
        <div style={DEV_MODE ? { '--dev-footer': 'calc(1.5rem + env(safe-area-inset-bottom))' } : undefined}>
            {received}
            {showGrid && <VoteGrid onVoted={onVoted} onReveal={() => setVoted(true)} onDone={() => setShowGrid(false)}/>}
            {DEV_MODE && (
                <div className="fixed bottom-0 inset-x-0 z-50 h-(--dev-footer) pb-[env(safe-area-inset-bottom)] bg-red-600 text-white font-[vcr] text-sm flex items-center justify-center pointer-events-none">
                    dev build
                </div>
            )}
        </div>
    )
}
