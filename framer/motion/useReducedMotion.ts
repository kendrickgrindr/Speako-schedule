/**
 * useReducedMotion
 * Returns true when the user has "(prefers-reduced-motion: reduce)" enabled.
 * Listens for live changes and is SSR-safe (returns false on the server).
 * Use it in every animated component: when true, render the final state immediately.
 */
import * as React from "react"

const QUERY = "(prefers-reduced-motion: reduce)"

export function useReducedMotion(): boolean {
    const [reduced, setReduced] = React.useState<boolean>(() => {
        if (typeof window === "undefined" || !window.matchMedia) return false
        return window.matchMedia(QUERY).matches
    })

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mql = window.matchMedia(QUERY)
        const onChange = () => setReduced(mql.matches)
        onChange()
        if (mql.addEventListener) {
            mql.addEventListener("change", onChange)
            return () => mql.removeEventListener("change", onChange)
        }
        // Safari < 14 fallback
        mql.addListener(onChange)
        return () => mql.removeListener(onChange)
    }, [])

    return reduced
}

export default useReducedMotion
