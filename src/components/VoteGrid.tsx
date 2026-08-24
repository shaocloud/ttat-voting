import type { ThiefDetails } from "../types/voteobject"
import { VoteBtn } from "./VoteBtn"

export function VoteGrid() {
    const vals : ThiefDetails[] = [
    {
        "name": "Shao",
        "desc": "ChickenShopBoss",
        "card": "K♣️",
        "id": 0,
        "url": "shao.jpg"
    },
    {
        "name": "Bing",
        "desc": "The Informant",
        "card": "Q♣️",
        "id": 1,
        "url": "bing.jpg"
    },
    {
        "name": "Ping",
        "desc": "The Wheelman",
        "card": "J♣️",
        "id": 2,
        "url": "ping.jpg"
    },
    ]
    return (
        <div className="flex gap-2 p-4">
            {vals.map((value) => (
                <VoteBtn key={value.id} info={value}/>
            ))}
        </div>
    )
}