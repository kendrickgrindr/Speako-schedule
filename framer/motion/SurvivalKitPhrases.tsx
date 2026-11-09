/**
 * SurvivalKitPhrases — Staggers the 5 situation phrases in (80ms stagger) and
 * scales/fades the result card in (0.96 -> 1.0 over 300ms).
 * Usage: wrap phrase list items with <SurvivalKitPhrases mode="phrases"> or
 * wrap the final result card with <SurvivalKitPhrases mode="result">.
 */
import * as React from "react"
import { useReducedMotion } from "./useReducedMotion"

export interface SurvivalKitPhrasesProps {
    mode?: "phrases" | "result"
    staggerMs?: number
    children: React.ReactNode
    style?: React.CSSProperties
}

export default function SurvivalKitPhrases({
    mode = "phrases",
    staggerMs = 80,
    children,
    style,
}: SurvivalKitPhrasesProps) {
    const reduced = useReducedMotion()

    if (mode === "result") {
        return (
            <div
                style={{
                    animation: reduced ? "none" : "skResultPop 300ms cubic-bezier(0.22, 1, 0.36, 1) both",
                    ...style,
                }}
            >
                <style>{`@keyframes skResultPop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }`}</style>
                {children}
            </div>
        )
    }

    const items = React.Children.toArray(children)
    return (
        <div style={style}>
            <style>{`@keyframes skPhraseSlide { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            {items.map((child, idx) => (
                <div
                    key={idx}
                    style={
                        reduced
                            ? undefined
                            : {
                                  opacity: 0,
                                  animation: `skPhraseSlide 380ms cubic-bezier(0.22, 1, 0.36, 1) ${idx * staggerMs}ms forwards`,
                              }
                    }
                >
                    {child}
                </div>
            ))}
        </div>
    )
}
