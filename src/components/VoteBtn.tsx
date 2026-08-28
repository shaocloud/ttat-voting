import type { ThiefDetails } from "../types/voteobject"

interface VoteBtnProps
{
    info : ThiefDetails;
}

export function VoteBtn({ info }: VoteBtnProps) {
    function cardSuit(style : string){
        let suit = info.card[1];
        const colDict = {
            "♥": "text-red-600",
            "♠": "text-blue-800",
            "♦": "text-red-400",
            "♣": "text-green-900",
        }
        if(suit.includes("❤"))
        {
            suit = `♥`
        }
        return (
            <div className={`
                flex flex-col 
                items-center leading-[0.9]
                text-4xl
                font-bold 
                text-black
                ${colDict[suit]}
                absolute 
                ${style}`}>  
                <span>{info.card[0]}</span>
                <span>{suit}</span>
            </div>
        )
    }

    return (
        <div
            className="
            flex flex-col
            w-60 
            h-84
            rounded-lg
            inset-ring-16
            inset-ring-white/70
            bg-gray-100
            bg-cover
            shadow-md

            relative"
            style="
            background-image: url('./assets/default.png')"
            >
            {cardSuit("top-2 left-2")}
            {cardSuit("bottom-2 right-2 rotate-180")}
            <div
                className="
                    font-[vcr]
                    font-semibold
                    text-white
                    text-shadow-ctr
                    absolute
                    bottom-5
                    left-5">
                <div className="text-xl min-h-4">{info.name}</div>
                <div className="text-xs min-h-4">{info.desc?.replaceAll('"','')}</div>
            </div>
        </div>
    )
}