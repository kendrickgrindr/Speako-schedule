/**
 * ProgressBar
 * Teal bar that fills from 0 to `value`% on mount over 700ms ease-out
 * (animates transform: scaleX with transform-origin left).
 * Use for course progress in the portal and "Lesson X of Y" on course pages.
 * Reduced motion: renders filled immediately.
 */
import * as React from "react"
import { useReducedMotion } from "./useReducedMotion"

export interface ProgressBarProps {
    value: number // 0-100
    height?: number
    color?: string
    track?: string
    label?: string
    style?: React.CSSProperties
}

export default function ProgressBar({
    value,
    height = 8,
    color = "#0FA6A3",
    track = "#E6EEF5",
    label = "Progress",
    style,
}: ProgressBarProps) {
    const reduced = useReducedMotion()
    const pct = Math.max(0, Math.min(100, value))
    const [ready, setReady] = React.useState(false)

    React.useEffect(() => {
        const id = requestAnimationFrame(() => setReady(true))
        return () => cancelAnimationFrame(id)
    }, [])

    const filled = reduced || ready
    return (
        <div
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            style={{ width: "100%", height, borderRadius: height, background: track, overflow: "hidden", ...style }}
        >
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background: color,
                    borderRadius: height,
                    transformOrigin: "left center",
                    transform: `scaleX(${filled ? pct / 100 : 0})`,
                    transition: reduced ? "none" : "transform 700ms cubic-bezier(.16,1,.3,1)",
                }}
            />
        </div>
    )
}
