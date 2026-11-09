/**
 * StartsSoonBadge
 * Small teal pill that pulses (scale 1 -> 1.05, 1.6s loop).
 * Use in the Student Portal next to a lesson starting in < 15 minutes.
 * Reduced motion: static badge.
 */
import * as React from "react"
import { useReducedMotion } from "./useReducedMotion"

export interface StartsSoonBadgeProps {
    label?: string
    style?: React.CSSProperties
}

const CSS = `
@keyframes spk-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
.spk-soon { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px;
  background: rgba(15,166,163,.14); color: #0B7F7C; font: 700 12px/1.4 Inter, sans-serif; letter-spacing: .02em;
  animation: spk-pulse 1.6s ease-in-out infinite; }
.spk-soon.is-reduced { animation: none; }
.spk-soon-dot { width: 6px; height: 6px; border-radius: 50%; background: #0FA6A3; }
@media (prefers-reduced-motion: reduce) { .spk-soon { animation: none; } }
`

export default function StartsSoonBadge({ label = "Starts soon", style }: StartsSoonBadgeProps) {
    const reduced = useReducedMotion()
    return (
        <span className={reduced ? "spk-soon is-reduced" : "spk-soon"} style={style} role="status">
            <style>{CSS}</style>
            <span className="spk-soon-dot" aria-hidden="true" />
            {label}
        </span>
    )
}
