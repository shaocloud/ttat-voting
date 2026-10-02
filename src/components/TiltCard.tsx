import type { ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";

const MAX_TILT = 12; // degrees
const SMOOTHING = 0.15; // lerp factor per frame

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// iOS 13+ gates motion sensors behind a permission prompt that must be
// triggered from a user gesture; everywhere else this is a no-op
export function requestTiltPermission() {
    const DOE = (globalThis as any).DeviceOrientationEvent;
    if (typeof DOE?.requestPermission === 'function') {
        DOE.requestPermission().catch(() => {});
    }
}

interface TiltCardProps {
    children: ComponentChildren;
    className?: string;
    style?: Record<string, string>;
}

export function TiltCard({ children, className = "", style }: TiltCardProps) {
    const outer = useRef<HTMLDivElement>(null);
    const inner = useRef<HTMLDivElement>(null);
    const shine = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const target = { x: 0, y: 0 }; // x: rotateX, y: rotateY
        const current = { x: 0, y: 0 };
        let rest: { beta: number, gamma: number } | null = null;
        let frame = 0;

        function onOrientation(e: DeviceOrientationEvent) {
            if (e.beta === null || e.gamma === null) return;
            // whatever angle the phone is held at when the card opens is "flat"
            rest ??= { beta: e.beta, gamma: e.gamma };
            target.x = clamp(-(e.beta - rest.beta), -MAX_TILT, MAX_TILT);
            target.y = clamp(e.gamma - rest.gamma, -MAX_TILT, MAX_TILT);
        }

        function onPointerMove(e: PointerEvent) {
            if (e.pointerType === 'touch' || !outer.current) return;
            const r = outer.current.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            target.x = clamp(-py * 2 * MAX_TILT, -MAX_TILT, MAX_TILT);
            target.y = clamp(px * 2 * MAX_TILT, -MAX_TILT, MAX_TILT);
        }

        function onPointerLeave() {
            target.x = 0;
            target.y = 0;
        }

        function tick() {
            current.x += (target.x - current.x) * SMOOTHING;
            current.y += (target.y - current.y) * SMOOTHING;
            if (inner.current) {
                inner.current.style.transform = `rotateX(${current.x}deg) rotateY(${current.y}deg)`;
            }
            if (shine.current) {
                // light source sits opposite the tilt, so the glare slides across
                const sx = 50 + (current.y / MAX_TILT) * 40;
                const sy = 50 - (current.x / MAX_TILT) * 40;
                const strength = 0.12 + (Math.hypot(current.x, current.y) / MAX_TILT) * 0.2;
                shine.current.style.background =
                    `radial-gradient(circle at ${sx}% ${sy}%, rgba(255,255,255,${strength}), transparent 60%)`;
            }
            frame = requestAnimationFrame(tick);
        }

        const el = outer.current;
        window.addEventListener('deviceorientation', onOrientation);
        el?.addEventListener('pointermove', onPointerMove);
        el?.addEventListener('pointerleave', onPointerLeave);
        frame = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('deviceorientation', onOrientation);
            el?.removeEventListener('pointermove', onPointerMove);
            el?.removeEventListener('pointerleave', onPointerLeave);
        };
    }, []);

    return (
        <div ref={outer} className={className} style={{ perspective: '800px', ...style }}>
            <div
                ref={inner}
                className="relative rounded-xl will-change-transform"
                style={{ transformStyle: 'preserve-3d' }}>
                {children}
                <div
                    ref={shine}
                    className="absolute inset-0 rounded-xl pointer-events-none mix-blend-overlay"/>
            </div>
        </div>
    );
}
