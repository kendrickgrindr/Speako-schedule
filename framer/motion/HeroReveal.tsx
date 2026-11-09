/**
 * HeroReveal
 * Fades a headline up word by word on load (400ms per word, 60ms stagger).
 * Use for the hero headline on the public site.
 * Reduced motion: the full headline is shown immediately.
 */
import * as React from "react"
import { useReducedMotion } from "./useReducedMotion"

export interface HeroRevealProps {
    text: string
    as?: "h1" | "h2" | "h3" | "p" | "span" | "div"
    style?: React.CSSProperties
    className?: string
    stagger?: number
}

const CSS = `
@keyframes spk-hero-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
.spk-hero-word { display: inline-block; opacity: 0; animation: spk-hero-up 400ms cubic-bezier(.2,.7,.2,1) forwards; will-change: transform, opacity; }
.spk-hero-word.is-static { opacity: 1; animation: none; }
@media (prefers-reduced-motion: reduce) { .spk-hero-word { opacity: 1; animation: none; } }
`

export default function HeroReveal({ text, as = "h1", style, className, stagger = 60 }: HeroRevealProps) {
    const reduced = useReducedMotion()
    const Tag = as
    const words = text.split(/\s+/).filter(Boolean)
    return (
        <Tag
            className={className}
            aria-label={text}
            style={{ fontFamily: "Montserrat, sans-serif", color: "#0B2A5B", margin: 0, ...style }}
        >
            <style>{CSS}</style>
            {words.map((w, i) => (
                <React.Fragment key={i}>
                    <span
                        aria-hidden="true"
                        className={reduced ? "spk-hero-word is-static" : "spk-hero-word"}
                        style={reduced ? undefined : { animationDelay: `${i * stagger}ms` }}
                    >
                        {w}
                    </span>
                    {i < words.length - 1 ? " " : null}
                </React.Fragment>
            ))}
        </Tag>
    )
}
