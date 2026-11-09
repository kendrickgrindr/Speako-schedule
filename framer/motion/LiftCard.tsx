/**
 * LiftCard
 * Card wrapper that rises 4px with a soft shadow on hover — only on devices
 * that really hover (@media (hover: hover)). On touch devices it presses to scale 0.98.
 * Use for course cards, pricing cards and teacher cards.
 * Reduced motion: no movement (shadow change only).
 */
import * as React from "react"
import { useReducedMotion } from "./useReducedMotion"

export interface LiftCardProps {
    children?: React.ReactNode
    style?: React.CSSProperties
    className?: string
}

const CSS = `
.spk-lift { position: relative; border-radius: 20px; background: #fff; transition: transform 240ms ease-out, box-shadow 240ms ease-out; box-shadow: 0 1px 3px rgba(11,42,91,.08); }
@media (hover: hover) {
  .spk-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(11,42,91,.12); }
}
@media (hover: none) {
  .spk-lift:active { transform: scale(0.98); }
}
.spk-lift.is-reduced, .spk-lift.is-reduced:hover, .spk-lift.is-reduced:active { transform: none; }
@media (prefers-reduced-motion: reduce) { .spk-lift, .spk-lift:hover, .spk-lift:active { transform: none; } }
`

export default function LiftCard({ children, style, className }: LiftCardProps) {
    const reduced = useReducedMotion()
    const cls = ["spk-lift", reduced ? "is-reduced" : "", className || ""].filter(Boolean).join(" ")
    return (
        <div className={cls} style={style}>
            <style>{CSS}</style>
            {children}
        </div>
    )
}
