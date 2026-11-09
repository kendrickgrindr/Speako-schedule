/**
 * GradientBackdrop
 * Very slow navy <-> teal gradient drift behind the hero (<15% opacity, ~20s loop).
 * CSS only: oversized gradient layers animate transform/opacity.
 * Pauses when the tab is hidden (visibilitychange -> animation-play-state).
 * Use as the first child of the hero section; place hero content in `children`.
 * Reduced motion: static gradient.
 */
import * as React from "react"
import { useReducedMotion } from "./useReducedMotion"

export interface GradientBackdropProps {
    children?: React.ReactNode
    opacity?: number // max 0.15 recommended
    style?: React.CSSProperties
}

const CSS = `
@keyframes spk-gb-a { 0%,100% { transform: translate3d(-10%, -6%, 0) scale(1); opacity: 1; } 50% { transform: translate3d(8%, 6%, 0) scale(1.08); opacity: .7; } }
@keyframes spk-gb-b { 0%,100% { transform: translate3d(10%, 8%, 0) scale(1.05); opacity: .6; } 50% { transform: translate3d(-8%, -4%, 0) scale(1); opacity: 1; } }
.spk-gb-layer { position: absolute; inset: -40%; pointer-events: none; will-change: transform, opacity; }
.spk-gb-a { background: radial-gradient(closest-side, #0B2A5B, transparent 70%); animation: spk-gb-a 20s ease-in-out infinite; }
.spk-gb-b { background: radial-gradient(closest-side, #0FA6A3, transparent 70%); animation: spk-gb-b 20s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .spk-gb-layer { animation: none !important; } }
`

export default function GradientBackdrop({ children, opacity = 0.12, style }: GradientBackdropProps) {
    const reduced = useReducedMotion()
    const [hidden, setHidden] = React.useState(false)

    React.useEffect(() => {
        if (typeof document === "undefined") return
        const onVis = () => setHidden(document.hidden)
        onVis()
        document.addEventListener("visibilitychange", onVis)
        return () => document.removeEventListener("visibilitychange", onVis)
    }, [])

    const layerStyle: React.CSSProperties = reduced
        ? { animation: "none" }
        : { animationPlayState: hidden ? "paused" : "running" }

    return (
        <div style={{ position: "relative", overflow: "hidden", isolation: "isolate", ...style }}>
            <style>{CSS}</style>
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, opacity: Math.min(opacity, 0.15), zIndex: -1 }}>
                <div className="spk-gb-layer spk-gb-a" style={layerStyle} />
                <div className="spk-gb-layer spk-gb-b" style={layerStyle} />
            </div>
            {children}
        </div>
    )
}
