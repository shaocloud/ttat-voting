import { useState, type ReactNode } from "react"

const BASE = import.meta.env.BASE_URL
const FALLBACK = `${BASE}assets/default.png`

interface CardBgProps
{
    name : string;
    // default-card decorations (suit corners, text); only rendered when there's no art
    children? : ReactNode;
}

function cardSrc(name : string) {
    // "Mun Yee" -> "munyee"
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "")
    return `${BASE}assets/char_cards/${slug}.png`
}

export function CardBg({ name, children }: CardBgProps) {
    const src = cardSrc(name);
    // remember which src failed, so a new name gets a fresh attempt
    const [failed, setFailed] = useState<string | null>(null);
    const noArt = failed === src;

    return (
        <div className={`
            relative
            w-full
            aspect-850/1350
            drop-shadow-lg            
            ${noArt ? "rounded-xl bg-gray-100" : ""}`}>
            <img
                src={noArt ? FALLBACK : src}
                onError={() => setFailed(src)}
                alt=""
                draggable={false}
                className={`
                    absolute inset-0
                    w-full h-full
                    object-cover object-center
                    pointer-events-none
                    ${noArt ? "rounded-xl" : ""}`}
            />
            {noArt && (
                <>
                    {/* the ring lives here: a parent's inset-ring would be painted *under* the img */}
                    <div className="absolute inset-0 rounded-xl inset-ring-12 inset-ring-white/70 pointer-events-none" />
                    {children}
                </>
            )}
        </div>
    )
}
