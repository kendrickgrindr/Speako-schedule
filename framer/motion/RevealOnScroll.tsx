/**
 * RevealOnScroll
 * Fades and slides children up 20px when they enter the viewport
 * (IntersectionObserver, threshold 0.15). Runs once, then disconnects.
 * Use for section blocks: course cards, testimonials, pricing rows.
 * Reduced motion: children render in place immediately.
 */
import * as React from "react"
import { useReducedMotion } from "./useReducedMotion"

export interface RevealOnScrollProps {
    children?: React.ReactNode
    delay?: number
    duration?: number
    style?: React.CSSProperties
    className?: string
}

export default function RevealOnScroll({ children, delay = 0, duration = 500, style, className }: RevealOnScrollProps) {
    const reduced = useReducedMotion()
    const ref = React.useRef<HTMLDivElement>(null)
    const [shown, setShown] = React.useState(false)

    React.useEffect(() => {
        if (reduced) return
        const el = ref.current
        if (!el || typeof IntersectionObserver === "undefined") {
            setShown(true)
            return
        }
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setShown(true)
                    io.disconnect()
                }
            },
            { threshold: 0.15 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [reduced])

    const visible = reduced || shown
    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(20px)",
                transition: reduced
                    ? "none"
                    : `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms cubic-bezier(.2,.7,.2,1) ${delay}ms`,
                ...style,
            }}
        >
            {children}
        </div>
    )
}
