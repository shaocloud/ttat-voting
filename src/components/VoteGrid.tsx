import { useEffect, useState } from "preact/hooks";
import type { ThiefDetails } from "../types/voteobject"
import { VoteBtn } from "./VoteBtn"

export function VoteGrid() {
    const [vals, setVals] = useState<ThiefDetails[]>([]);

    const vars : ThiefDetails[] = [
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

    useEffect(() => {
        fetch('./assets/chars.csv')
            .then((res) => res.text())
            .then((csvText) => {
                const [headerLine, ...lines] = csvText.trim().split('\n');
                const headers = headerLine.split(',');

                const data: ThiefDetails[] = lines.map((line) => {
                    const cells = line.split(',');
                    const row = Object.fromEntries(headers.map((h, i) => [h, cells[i]]));
                    const rank_vals : string[] = String(row.card).split(' ');

                    return {
                        id: Number(row.id),
                        name: row.name,
                        card: rank_vals[0][0] + rank_vals[1],
                        desc: row.desc || null,
                        url: row.url || null,
                    };
                });

                setVals(data);
            });
    }, []);

    return (
        <div className="grid grid-cols-2 gap-3 p-3">
            {vals.map((value) => (
                <VoteBtn key={value.id} info={value}/>
            ))}
        </div>
    )
}