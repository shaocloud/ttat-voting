import type { ThiefDetails } from "../types/voteobject";

// quote-aware CSV parse; handles commas and "" inside quoted fields
export function parseCsv(text: string): string[][] {
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

export function parseCharacters(csvText: string): ThiefDetails[] {
    const [headers, ...lines] = parseCsv(csvText.trim());

    return lines.map((cells) => {
        const row = Object.fromEntries(headers.map((h, i) => [h, cells[i]]));
        const rank_vals: string[] = String(row.card).split(' ');

        return {
            id: Number(row.id),
            name: row.name,
            card: rank_vals[0][0] + rank_vals[1],
            desc: row.desc || null,
            caption: row.caption?.replace(/^"|"$/g, '').trim() || null,
            url: row.url || null,
        };
    });
}

let cached: Promise<ThiefDetails[]> | null = null;

export function loadCharacters(): Promise<ThiefDetails[]> {
    cached ??= fetch('/assets/chars.csv')
        .then((res) => res.text())
        .then(parseCharacters)
        .catch((err) => { cached = null; throw err; });
    return cached;
}

// characterIds as stored in the database ("0".."13")
export async function loadCharacterIds(): Promise<string[]> {
    return (await loadCharacters()).map((c) => String(c.id));
}
