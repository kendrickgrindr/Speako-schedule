/**
 * CountUp
 * Counts from 0 to `value` when it enters the viewport (~1.2s, ease-out).
 * Use for stats: "500+ lessons taught", "4.9 rating", "98% stay after trial".
 * Reduced motion: shows the final number immediately.
 */
import * as React from "react"
import { useReducedMotion } from "./useReducedMotion"

export interface CountUpProps {
    value: number
    suffix?: string
    prefix?: string
    duration?: number
    decimals?: number
    style?: React.CSSProperties
    className?: string
}

export default function CountUp({
    value,
    suffix = "",
    prefix = "",
    duration = 1200,
    decimals = 0,
    style,
    className,
}: CountUpProps) {
    const reduced = useReducedMotion()
    const ref = React.useRef<HTMLSpanElement>(null)
    const [current, setCurrent] = React.useState(0)

    React.useEffect(() => {
        if (reduced) return
        const el = ref.current
        let raf = 0
        const run = () => {
            const start = performance.now()
            const tick = (now: number) => {
                const t = Math.min(1, (now - start) / duration)
                const eased = 1 - Math.pow(1 - t, 3)
                setCurrent(value * eased)
                if (t < 1) raf = requestAnimationFrame(tick)
            }
            raf = requestAnimationFrame(tick)
        }
        if (!el || typeof IntersectionObserver === "undefined") {
            run()
            return () => cancelAnimationFrame(raf)
        }
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    io.disconnect()
                    run()
                }
            },
            { threshold: 0.3 }
        )
        io.observe(el)
        return () => {
            io.disconnect()
            cancelAnimationFrame(raf)
        }
    }, [reduced, value, duration])

    const shown = reduced ? value : current
    return (
        <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums", ...style }}>
            {prefix}
            {shown.toFixed(decimals)}
            {suffix}
        </span>
    )
}
