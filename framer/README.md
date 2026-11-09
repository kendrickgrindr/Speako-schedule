# Speako Framer & React Code Components

All self-contained React components live in `/Users/kendrick/Desktop/Speako/framer/`:

- **[`ThaiSurvivalKit.tsx`](file:///Users/kendrick/Desktop/Speako/framer/ThaiSurvivalKit.tsx)** — Interactive 4-situation Thai Survival Kit (< 300 lines, zero signup, audio playback at 1.0x and 0.7x, 2-question practice quiz, and result card).
- **[`StudentPortal.tsx`](file:///Users/kendrick/Desktop/Speako/framer/StudentPortal.tsx)** — Improved Student Portal component with lesson goal line, live 1-minute countdown (`Starts soon` / `In progress`), 3-item prep checklist, course progress bar, empty-credit banner, refined button hierarchy with inline cancel confirmation, and consistent `Bangkok time (UTC+7)` date formatting.
- **[`motion/`](file:///Users/kendrick/Desktop/Speako/framer/motion/index.ts)** — Tasteful motion system (`useReducedMotion`, `HeroReveal`, `ToneWave`, `RevealOnScroll`, `LiftCard`, `CountUp`, `PressButton`, `SurvivalKitPhrases`, `ProgressBar`, `GradientBackdrop`, `StartsSoonBadge`).

---

## 1. Thai Survival Kit — Where to Add Audio Files & Booking URL

In [`ThaiSurvivalKit.tsx`](file:///Users/kendrick/Desktop/Speako/framer/ThaiSurvivalKit.tsx#L9-L10):

1. **Booking Link (`Line 10`):**
   Replace `const BOOKING_URL = "[BOOKING_URL]"` with your live booking URL (e.g. `"https://speako-schedule.space"`).
2. **Audio Base Path (`Line 9`):**
   Update `const AUDIO_BASE_PATH = "/audio/"` to your hosted audio folder URL, and upload MP3 clips named:
   - `ordering-food-1.mp3` … `ordering-food-5.mp3`
   - `taking-a-taxi-1.mp3` … `taking-a-taxi-5.mp3`
   - `meeting-parents-1.mp3` … `meeting-parents-5.mp3`
   - `shopping-market-1.mp3` … `shopping-market-5.mp3`
   *(If any audio file is missing or fails to load, the component automatically hides the Play/Slow buttons for that phrase without breaking the page.)*

---

## 2. Motion System — Usage Example

```tsx
import * as React from "react"
import {
    GradientBackdrop,
    HeroReveal,
    ToneWave,
    RevealOnScroll,
    LiftCard,
    CountUp,
    PressButton,
    StartsSoonBadge,
} from "./motion"

export function SpeakoShowcaseExample() {
    return (
        <div>
            {/* 1. Hero section with slow navy<->teal backdrop + word-by-word HeroReveal */}
            <GradientBackdrop style={{ padding: "56px 24px", borderRadius: 24 }}>
                <HeroReveal
                    text="Speak with confidence, one lesson at a time."
                    as="h1"
                    style={{ fontFamily: "Montserrat, sans-serif", fontSize: 36, color: "#0B2A5B" }}
                />
                <div style={{ marginTop: 16 }}>
                    <ToneWave active={false} />
                </div>
            </GradientBackdrop>

            {/* 2. Course card wrapped in RevealOnScroll + LiftCard */}
            <RevealOnScroll delay={80}>
                <LiftCard style={{ padding: 24, borderRadius: 20, background: "#FFFFFF", marginTop: 24 }}>
                    <h3 style={{ fontFamily: "Montserrat, sans-serif", color: "#0B2A5B", margin: 0 }}>
                        Basic Thai for Daily Communication
                    </h3>
                    <p style={{ color: "#64748B", marginTop: 8 }}>
                        <CountUp value={8} suffix=" live 1-on-1 lessons" />
                    </p>
                </LiftCard>
            </RevealOnScroll>

            {/* 3. Pricing card wrapped in LiftCard + PressButton */}
            <RevealOnScroll delay={160}>
                <LiftCard style={{ padding: 24, borderRadius: 20, background: "#0B2A5B", color: "#FFFFFF", marginTop: 20 }}>
                    <h3 style={{ fontFamily: "Montserrat, sans-serif", margin: 0 }}>8 Thai Lessons Package</h3>
                    <div style={{ fontSize: 28, fontWeight: 800, margin: "12px 0" }}>
                        ฿<CountUp value={4490} />
                    </div>
                    <PressButton>
                        <button
                            type="button"
                            style={{
                                minHeight: 44,
                                padding: "10px 20px",
                                borderRadius: 999,
                                border: "none",
                                background: "#0FA6A3",
                                color: "#FFFFFF",
                                fontWeight: 600,
                            }}
                        >
                            Book Free Trial
                        </button>
                    </PressButton>
                </LiftCard>
            </RevealOnScroll>

            {/* 4. "Starts soon" pulsing badge */}
            <div style={{ marginTop: 20 }}>
                <StartsSoonBadge label="Starts soon" active={true} />
            </div>
        </div>
    )
}
```

---

## 3. Placement Checklist (Public Framer Site & Student Portal)

| Component | Where to Place It |
| :--- | :--- |
| `GradientBackdrop` | Behind the top Hero section on the public Framer landing page |
| `HeroReveal` | Main H1 headline inside the public Hero section |
| `ToneWave` | Underneath the Thai course subheadline or inside the Thai Survival Kit header |
| `ThaiSurvivalKit` | Dedicated interactive section below the Hero on the public landing page |
| `SurvivalKitPhrases` | Inside `ThaiSurvivalKit` wrapping the 5 phrases (`mode="phrases"`) and result card (`mode="result"`) |
| `RevealOnScroll` | Section wrappers (Why Speako, Course Cards, How It Works, Pricing Cards) — max 3 motion types per page |
| `LiftCard` | Course overview cards and Pricing tier cards |
| `CountUp` | Lesson counts (`8 lessons`, `16 lessons`), package prices, or student review stats |
| `PressButton` | Primary CTAs (`Book Free Trial`, `Join`, `Top up`) |
| `ProgressBar` | Inside the Student Portal `Next Class` card under the course title (`Lesson 1 of 8`) |
| `StartsSoonBadge` | Next to the class date in the Student Portal `Next Class` card when `< 15 min` away |

---

## 4. Assumptions Made

1. **No Framer Motion dependency required:** All components use pure React + standard CSS keyframes/transitions (`transform` and `opacity` only) so they run cleanly in both Framer and any standalone React setup without extra packages.
2. **Reduced Motion:** Every component reads from `useReducedMotion()` (`prefers-reduced-motion: reduce`) and immediately renders the final state when enabled.
3. **Time Zone & Dates:** Student Portal dates use `Asia/Bangkok` (`Bangkok time (UTC+7)`) and format consistently as `Thu 12 Nov, 15:00`.
4. **No Persistence / Tracking:** Checklist ticks, quiz scores, and UI states live strictly in React component state (`useState`) with zero `localStorage`, cookies, or analytics scripts.
