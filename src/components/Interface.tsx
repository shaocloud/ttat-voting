import { useEffect, useState } from "preact/hooks";
import { VoteGrid } from "./VoteGrid";
import { watchVotes } from "../firebase/firebase";

const VOTED_KEY = 'ttat-voted';

function hasVoted() {
    if (new URLSearchParams(location.search).get('state') === 'voted') return true;
    try { return localStorage.getItem(VOTED_KEY) === '1'; } catch { return false; }
}

function VoteTable() {
    const [counts, setCounts] = useState<Record<string, number> | null>(null);

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
                    <th className="text-right py-1">votes</th>
                </tr>
            </thead>
            <tbody>
                {rows.map(([id, n]) => (
                    <tr key={id} className="border-b border-stone-300">
                        <td className="text-left py-1">{id}</td>
                        <td className="text-right py-1">{n}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export function Interface() {
    const [voted, setVoted] = useState(hasVoted);

    function onVoted() {
        try { localStorage.setItem(VOTED_KEY, '1'); } catch {}
        history.replaceState(null, '', '?state=voted');
        setVoted(true);
    }

    function resetVoted() {
        try { localStorage.removeItem(VOTED_KEY); } catch {}
        history.replaceState(null, '', location.pathname);
        setVoted(false);
    }

    if (voted) {
        return (
            <div className="min-h-svh flex flex-col items-center justify-center text-center px-6 text-stone-900 gap-6">
                <div>
                    <div className="font-[vcr] text-4xl mb-3">Vote received!</div>
                    <p className="font-[vcr] text-lg">Thanks. Eyes back on the stage 🃏</p>
                </div>
                <VoteTable/>
                {import.meta.env.DEV && (
                    <button
                        type="button"
                        onClick={resetVoted}
                        className="rounded-lg border-2 border-dashed border-stone-500 text-stone-600 px-4 py-2 font-[vcr] text-sm">
                        Reset vote (dev)
                    </button>
                )}
            </div>
        )
    }

    return <VoteGrid onVoted={onVoted}/>
}
