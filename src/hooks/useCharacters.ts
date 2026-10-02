import { useEffect, useState } from 'preact/hooks'
import { loadCharacters } from '../data/characters'
import type { ThiefDetails } from '../types/voteobject'

/** Characters from chars.csv, keyed by their database id ("0".."13"). */
export function useCharacters() {
    const [characters, setCharacters] = useState<ThiefDetails[]>([])

    useEffect(() => {
        loadCharacters().then(setCharacters)
    }, [])

    const byId = Object.fromEntries(characters.map((c) => [String(c.id), c]))
    return { characters, byId }
}
