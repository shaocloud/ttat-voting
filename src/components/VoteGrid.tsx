import { useEffect, useRef, useState } from "preact/hooks";
import type { ThiefDetails } from "../types/voteobject"
import { VoteBtn, suitOf } from "./VoteBtn"
import { TiltCard, requestTiltPermission } from "./TiltCard"
import { castVote } from "../firebase/firebase";

// card width: as wide as the phone allows, but short enough that
// the chips + vote bar still fit below it without scrolling
const CARD_W = "min(76vw, calc((100svh - 18rem) * 5 / 7), 24rem)";
// confirm-modal card: fills the space left above the description sheet
const MODAL_CARD_W = "min(72vw, calc((100svh - 18rem) * 5 / 7), 22rem)";

// quote-aware CSV parse; handles commas and "" inside quoted fields
function parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (quoted) {
            if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
            else if (c === '"') quoted = false;
            else cell += c;
        } else if (c === '"') quoted = true;
        else if (c === ',') { row.push(cell); cell = ""; }
        else if (c === '\n' || c === '\r') {
            if (c === '\r' && text[i + 1] === '\n') i++;
            row.push(cell); rows.push(row); row = []; cell = "";
        }
        else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
}

interface VoteGridProps {
    onVoted: () => void;
}

export function VoteGrid({ onVoted }: VoteGridProps) {
    const [vals, setVals] = useState<ThiefDetails[]>([]);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scroller = useRef<HTMLDivElement>(null);
    const slides = useRef(new Map<number, HTMLDivElement>());

    const vars : ThiefDetails[] = [
    {
        "name": "Shao",
        "desc": "ChickenShopBoss",
        "card": "K♣️",
        "id": 0,
        "url": "shao.jpg",
        "caption": null
    },
    {
        "name": "Bing",
        "desc": "The Informant",
        "card": "Q♣️",
        "id": 1,
        "url": "bing.jpg",
        "caption": null
    },
    {
        "name": "Ping",
        "desc": "The Wheelman",
        "card": "J♣️",
        "id": 2,
        "url": "ping.jpg",
        "caption": null
    },
    ]

    useEffect(() => {
        fetch('./assets/chars.csv')
            .then((res) => res.text())
            .then((csvText) => {
                const [headers, ...lines] = parseCsv(csvText.trim());

                const data: ThiefDetails[] = lines.map((cells) => {
                    const row = Object.fromEntries(headers.map((h, i) => [h, cells[i]]));
                    const rank_vals : string[] = String(row.card).split(' ');

                    return {
                        id: Number(row.id),
                        name: row.name,
                        card: rank_vals[0][0] + rank_vals[1],
                        desc: row.desc || null,
                        caption: row.caption?.replace(/^"|"$/g, '').trim() || null,
                        url: row.url || null,
                    };
                });

                setVals(data);
                setActiveId(data[0]?.id ?? null);
            });
    }, []);

    // whichever card is mostly in view is the one being voted for
    useEffect(() => {
        if (!scroller.current || vals.length === 0) return;
        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    setActiveId(Number((entry.target as HTMLElement).dataset.id));
                }
            }
        }, { root: scroller.current, threshold: 0.6 });
        slides.current.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [vals]);

    function jumpTo(id: number) {
        slides.current.get(id)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    async function confirmVote() {
        if (activeId === null) return;
        setSending(true);
        setError(null);
        try {
            await castVote(activeId);
            onVoted();
        } catch {
            setError("Couldn't send your vote. Please try again.");
            setSending(false);
        }
    }

    const active = vals.find((v) => v.id === activeId);
    const activeSuit = suitOf(active?.card ?? "  ");

    return (
        <div className="flex flex-col min-h-svh pb-28">
            <h1 className="font-[vcr] text-center text-2xl text-stone-900 pt-5 pb-3">
                Swipe to pick your thief
            </h1>

            <div
                ref={scroller}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar py-2"
                style={{ paddingInline: `calc(50% - ${CARD_W} / 2)` }}>
                {vals.map((value) => (
                    <div
                        key={value.id}
                        data-id={value.id}
                        ref={(el) => { if (el) slides.current.set(value.id, el); else slides.current.delete(value.id); }}
                        className={`snap-center shrink-0 transition-transform duration-200
                            ${value.id === activeId ? 'scale-100' : 'scale-90 opacity-70'}`}
                        style={{ width: CARD_W }}>
                        <VoteBtn info={value}/>
                    </div>
                ))}
            </div>

            {/* jump strip: every card at a glance, tap to jump */}
            <div className="grid grid-cols-4 gap-1.5 px-4 pt-4 max-w-md mx-auto w-full">
                {vals.map((value) => {
                    const name = value.name || `#${value.id}`;
                    const { rank, suit, color } = suitOf(value.card);
                    const isActive = value.id === activeId;
                    return (
                        <button
                            key={value.id}
                            type="button"
                            aria-label={value.name}
                            onClick={() => jumpTo(value.id)}
                            className={`rounded-md py-1.5 text-base font-bold leading-none ${color}
                                ${isActive ? 'bg-white ring-2 ring-stone-900 shadow' : 'bg-white/60'}`}>
                            {name}
                        </button>
                    );
                })}
            </div>

            <div className="fixed bottom-0 inset-x-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-stone-900/40 to-transparent">
                <button
                    type="button"
                    disabled={!active}
                    onClick={() => { requestTiltPermission(); setConfirming(true); }}
                    className="w-full max-w-md mx-auto block rounded-xl bg-stone-900 text-white font-[vcr] text-xl py-4 shadow-lg disabled:opacity-50">
                    {active ? <>Vote for {active.name} <span className="text-white">{activeSuit.rank}{activeSuit.suit}</span></> : 'Loading…'}
                </button>
            </div>

            {confirming && active && (
                <div
                    className="fixed inset-0 bg-black/60 flex flex-col items-center justify-end z-10"
                    onClick={() => !sending && setConfirming(false)}>
                    {/* card centred in whatever space the sheet leaves above it */}
                    <div className="flex-1 min-h-0 w-full flex items-center justify-center py-4">
                        <div className="animate-card-pop" onClick={(e) => e.stopPropagation()}>
                            <TiltCard style={{ width: MODAL_CARD_W }}>
                                <VoteBtn info={active}/>
                            </TiltCard>
                        </div>
                    </div>
                    <div
                        className="w-full max-w-md mx-auto bg-stone-50 text-stone-900 rounded-t-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] max-h-[45svh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}>
                        {active.caption && (
                            <p className="text-sm text-stone-700 whitespace-pre-line mb-4">{active.caption}</p>
                        )}
                        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                disabled={sending}
                                onClick={() => setConfirming(false)}
                                className="flex-1 rounded-xl border-2 border-stone-900 py-3 font-[vcr] text-lg disabled:opacity-50">
                                Back
                            </button>
                            <button
                                type="button"
                                disabled={sending}
                                onClick={confirmVote}
                                className="flex-[2] rounded-xl bg-stone-900 text-white py-3 font-[vcr] text-lg disabled:opacity-50">
                                {sending ? 'Sending…' : 'Confirm vote'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
