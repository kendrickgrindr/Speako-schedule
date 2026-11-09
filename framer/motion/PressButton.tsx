/**
 * PressButton
 * Wraps any button/link in an inline-block span that adds a soft teal glow on
 * hover and scales to 0.97 while pressed. The child keeps its own styles.
 * Use around primary CTAs: "Book a free trial lesson", "Join", "Top up".
 * Reduced motion: glow only, no scaling.
 */
import * as React from "react"
import { useReducedMotion } from "./useReducedMotion"

export interface PressButtonProps {
    children?: React.ReactNode
    radius?: number
    style?: React.CSSProperties
}

const CSS = `
.spk-press { display: inline-block; border-radius: var(--spk-radius, 999px); transition: transform 160ms ease-out, box-shadow 220ms ease-out; }
@media (hover: hover) { .spk-press:hover { box-shadow: 0 0 0 4px rgba(15,166,163,.18), 0 6px 18px rgba(15,166,163,.22); } }
.spk-press:active { transform: scale(0.97); }
.spk-press.is-reduced:active { transform: none; }
@media (prefers-reduced-motion: reduce) { .spk-press:active { transform: none; } }
`

export default function PressButton({ children, radius = 999, style }: PressButtonProps) {
    const reduced = useReducedMotion()
    const vars = { "--spk-radius": `${radius}px` } as React.CSSProperties
    return (
        <span className={reduced ? "spk-press is-reduced" : "spk-press"} style={{ ...vars, ...style }}>
            <style>{CSS}</style>
            {children}
        </span>
    )
}
