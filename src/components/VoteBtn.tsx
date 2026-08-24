import type { ThiefDetails } from "../types/voteobject"

interface VoteBtnProps
{
    info : ThiefDetails;
}

export function VoteBtn({ info }: VoteBtnProps) {
    return (
        <div
            className="
            flex flex-col
            w-60 
            rounded-md 
            p-4
            bg-gray-100
            shadow-md
            select-none
            relative"
            >
            <div className="text-xl font-bold absolute top-2 left-2">{info.card}</div>
            <div className="text-xl font-bold absolute bottom-2 right-2 rotate-180">{info.card}</div>
            <img
                src='./assets/default.png'
                alt={info.name}
                className="
                w-9/10
                object-cover
                rounded
                m-auto
                p-2"
            />
            <div
                className="
                ">
                <div>{info.name}</div>
                <div className="text-xs min-h-4">{info.desc}</div>
            </div>
        </div>
    )
}