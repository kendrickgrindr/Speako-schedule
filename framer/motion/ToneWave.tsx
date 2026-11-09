/**
 * ToneWave
 * Small inline SVG teal line that cycles through the five Thai tone contours
 * (mid, low, falling, high, rising) by cross-fading stacked paths (opacity only).
 * ~2.4s per full cycle (1.2s when `active`). Pauses when off screen.
 * Use next to the Thai course card, the Survival Kit intro, or the hero.
 * Reduced motion: static, shows the first tone only.
 */
import * as React from "react"
import { useReducedMotion } from "./useReducedMotion"

export interface ToneWaveProps {
    active?: boolean
    showLabel?: boolean
    width?: number
    height?: number
    color?: string
    style?: React.CSSProperties
}

const TONES: { name: string; d: string }[] = [
    { name: "Mid", d: "M6 20 C40 20 80 20 114 20" },
    { name: "Low", d: "M6 24 C40 26 80 29 114 32" },
    { name: "Falling", d: "M6 18 C36 6 70 8 114 34" },
    { name: "High", d: "M6 16 C40 15 80 11 114 6" },
    { name: "Rising", d: "M6 22 C36 34 76 32 114 6" },
]

export default function ToneWave({
    active = false,
    showLabel = false,
    width = 120,
    height = 40,
    color = "#0FA6A3",
    style,
}: ToneWaveProps) {
    const reduced = useReducedMotion()
    const [index, setIndex] = React.useState(0)
    const [visible, setVisible] = React.useState(true)
    const ref = React.useRef<HTMLSpanElement>(null)

    React.useEffect(() => {
        const el = ref.current
        if (!el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0 })
        io.observe(el)
        return () => io.disconnect()
    }, [])

    React.useEffect(() => {
        if (reduced || !visible) return
        const step = (active ? 1200 : 2400) / TONES.length
        const id = window.setInterval(() => setIndex((i) => (i + 1) % TONES.length), step)
        return () => window.clearInterval(id)
    }, [reduced, visible, active])

    const shown = reduced ? 0 : index
    const fade = active ? 160 : 260

    return (
        <span
            ref={ref}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, verticalAlign: "middle", ...style }}
        >
            <svg width={width} height={height} viewBox="0 0 120 40" role="img" aria-label="Thai tone contours">
                {TONES.map((t, i) => (
                    <path
                        key={t.name}
                        d={t.d}
                        fill="none"
                        stroke={color}
                        strokeWidth={3}
                        strokeLinecap="round"
                        style={{
                            opacity: i === shown ? 1 : 0,
                            transition: reduced ? "none" : `opacity ${fade}ms ease-in-out`,
                        }}
                    />
                ))}
            </svg>
            {showLabel && (
                <span
                    aria-live="off"
                    style={{ font: "600 12px Inter, sans-serif", color: "#64748B", minWidth: 52 }}
                >
                    {TONES[shown].name} tone
                </span>
            )}
        </span>
    )
}
