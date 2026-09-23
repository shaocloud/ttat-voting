import type { ThiefDetails } from "../types/voteobject"

interface VoteBtnProps
{
    info : ThiefDetails;
}

const colDict: Record<string, string> = {
    "♥": "text-red-600",
    "♠": "text-blue-800",
    "♦": "text-yellow-600",
    "♣": "text-green-900",
}

export function suitOf(card : string) {
    let suit = card[1];
    if(suit.includes("❤"))
    {
        suit = `♥`
    }
    return { rank: card[0], suit, color: colDict[suit] };
}

export function VoteBtn({ info }: VoteBtnProps) {
    const { rank, suit, color } = suitOf(info.card);

    function cardSuit(style : string){
        return (
            <div className={`
                flex flex-col
                items-center leading-[0.9]
                text-4xl
                font-bold
                text-black
                ${color}
                absolute
                ${style}`}>
                <span>{rank}</span>
                <span>{suit}</span>
            </div>
        )
    }

    return (
        <div
            className="
            flex flex-col
            w-full
            aspect-5/7
            rounded-xl
            inset-ring-12
            inset-ring-white/70
            bg-gray-100
            bg-cover
            bg-center
            shadow-lg

            relative"
            style="
            background-image: url('./assets/default.png')"
            >
            {cardSuit("top-3 left-3")}
            {cardSuit("bottom-3 right-3 rotate-180")}
            <div
                className="
                    font-[vcr]
                    font-semibold
                    text-white
                    text-shadow-ctr
                    absolute
                    bottom-6
                    left-6
                    right-14">
                <div className="text-3xl min-h-4">{info.name}</div>
                <div className="text-sm min-h-4">{info.desc}</div>
            </div>
        </div>
    )
}
