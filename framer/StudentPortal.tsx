/**
 * Speako — StudentPortal Framer Code Component (Pure React)
 *
 * WHAT CHANGED:
 * 1. Lesson purpose line (`lessonGoal` / `goal`) added under the Next Class title; hidden when missing.
 * 2. Live relative countdown next to the date ("Starts in 2 days 0 hr", updates every minute).
 *    Under 15 minutes: Join button switches to primary (filled teal) with a single shimmer sweep,
 *    and a pulsing "Starts soon" badge (scale 1.0 -> 1.05, 1.6s loop) appears.
 *    Once started: badge displays "In progress."
 * 3. Interactive 3-item Prep Checklist ("Test your mic and camera", "Have a notebook ready",
 *    "Find a quiet place") stored in React state only, with a 200ms check animation when ticked.
 * 4. Course progress indicator ("Lesson 1 of 8") with a teal progress bar filling over 700ms ease-out.
 * 5. Empty-credit warning banner above the Credits card when Thai or English credits equal 0,
 *    with a "Top up" CTA button that opens the Top Up / Credits flow. Hidden when both > 0.
 * 6. Button hierarchy in Upcoming list: "Join" is the only filled (teal) button, "Details" is a
 *    secondary outline button, and "Cancel" is a small muted-red text link at the end of the row
 *    with an inline confirmation step ("Cancel this lesson? You’ll get 1 credit back.").
 * 7. Consistent date format ("Thu 12 Nov, 15:00") across the page, and "Bangkok time (UTC+7)"
 *    shown once near the Upcoming heading.
 * 8. Mobile-first 375px responsive layout: Next Class and Credits cards stack vertically,
 *    action buttons wrap cleanly with >= 44px tap targets, and horizontal scrolling is eliminated.
 *
 * DATA ASSUMPTIONS:
 * - `lesson.date` is a `YYYY-MM-DD` string and `lesson.time` is a 24h `HH:mm` string in Bangkok time (UTC+7).
 * - Both `lesson.lessonGoal` and `lesson.goal` are supported for the one-line lesson purpose.
 * - `progress` provides `{ completed, total }` (where `completed + 1` or `lesson.lessonNumber` indicates the current lesson).
 * - `credits` provides `{ thai, english }` integer balances.
 */
import * as React from "react"
import { useReducedMotion } from "./motion/useReducedMotion"

export interface LessonItem {
    id: string
    lessonNumber?: number
    title: string
    lessonGoal?: string
    goal?: string
    date: string // YYYY-MM-DD
    time: string // HH:mm (24h, UTC+7)
    teacher: string
    course: string
    type: "thai" | "english"
    status: "confirmed" | "completed" | "cancelled"
    meetingUrl?: string
}

export interface ProgressData {
    completed: number
    total: number
}

export interface CreditsData {
    thai: number
    english: number
}

export interface StudentPortalData {
    studentName: string
    nextClass: LessonItem | null
    upcoming: LessonItem[]
    progress: ProgressData
    credits: CreditsData
}

export const SAMPLE_DATA: StudentPortalData = {
    studentName: "Alex",
    nextClass: {
        id: "bk-101",
        lessonNumber: 1,
        title: "Greetings and Polite Words",
        lessonGoal: "You’ll learn 5 phrases for meeting new people.",
        date: "2026-11-12",
        time: "15:00",
        teacher: "Kendrick",
        course: "Basic Thai for Daily Communication",
        type: "thai",
        status: "confirmed",
        meetingUrl: "https://meet.google.com/speako-class",
    },
    upcoming: [
        {
            id: "bk-101",
            lessonNumber: 1,
            title: "Greetings and Polite Words",
            lessonGoal: "You’ll learn 5 phrases for meeting new people.",
            date: "2026-11-12",
            time: "15:00",
            teacher: "Kendrick",
            course: "Basic Thai for Daily Communication",
            type: "thai",
            status: "confirmed",
            meetingUrl: "https://meet.google.com/speako-class",
        },
        {
            id: "bk-102",
            lessonNumber: 2,
            title: "Introducing Yourself Naturally",
            lessonGoal: "You’ll share your name, country, and interests in Thai.",
            date: "2026-11-15",
            time: "10:00",
            teacher: "Kendrick",
            course: "Basic Thai for Daily Communication",
            type: "thai",
            status: "confirmed",
            meetingUrl: "https://meet.google.com/speako-class",
        },
    ],
    progress: { completed: 1, total: 8 },
    credits: { thai: 0, english: 4 },
}

const PREP_ITEMS = [
    "Test your mic and camera",
    "Have a notebook ready",
    "Find a quiet place",
]

export interface CurriculumLesson {
    number: number
    title: string
    goal: string
    highlights: string[]
    slideDeckUrl: string
}

export const THAI_LESSONS_1_TO_8: CurriculumLesson[] = [
    {
        number: 1,
        title: "Greetings and Polite Words",
        goal: "Greet people politely and use essential Thai courtesy words from day one.",
        highlights: ["สวัสดี (sà-wàt-dii)", "ขอบคุณ (khàwp-khun)", "ขอโทษ / ไม่เป็นไร", "ครับ / ค่ะ / คะ"],
        slideDeckUrl: "lessons/lesson1.html",
    },
    {
        number: 2,
        title: "Self-Introduction",
        goal: "Introduce yourself with your name, country, and polite questions in Thai.",
        highlights: ["ผม/ฉันชื่อ...", "ผม/ฉันมาจาก...", "ยินดีที่ได้รู้จัก", "คุณชื่ออะไร"],
        slideDeckUrl: "lessons/speako-lesson-2.html",
    },
    {
        number: 3,
        title: "Numbers, Time, and Basic Questions",
        goal: "Use Thai numbers, tell time, and ask essential everyday questions.",
        highlights: ["Numbers 0–100+", "กี่โมงแล้ว (What time?)", "เท่าไหร่ (How much?)", "ที่ไหน (Where?)"],
        slideDeckUrl: "lessons/lesson-3-numbers-time-questions.html",
    },
    {
        number: 4,
        title: "Ordering Food and Drinks",
        goal: "Order food and drinks politely, customize spice levels, and ask for the bill.",
        highlights: ["ขอ...หน่อย / เอา...", "เผ็ด / ไม่เผ็ด", "อร่อยมาก", "เช็คบิลด้วยครับ/ค่ะ"],
        slideDeckUrl: "lessons/speako-lesson-4-food-and-drinks.html",
    },
    {
        number: 5,
        title: "Directions and Transportation",
        goal: "Ask where places are, understand directions, and ride taxis, BTS, and MRT in Thai.",
        highlights: ["...อยู่ที่ไหน", "ตรงไป / เลี้ยวซ้าย / เลี้ยวขวา", "ใกล้ / ไกล", "หยุดที่นี่ครับ/ค่ะ"],
        slideDeckUrl: "lessons/lesson5.html",
    },
    {
        number: 6,
        title: "Shopping and Prices",
        goal: "Ask prices, point out items, bargain politely at markets, and pay by cash or card.",
        highlights: ["อันนี้เท่าไหร่", "ลดหน่อยได้ไหม", "ถูกกว่านี้ได้ไหม", "จ่ายด้วยบัตรได้ไหม"],
        slideDeckUrl: "lessons/lesson6.html",
    },
    {
        number: 7,
        title: "Daily Needs and Common Situations",
        goal: "Handle real-life needs, communication breakdowns, and emergencies calmly in Thai.",
        highlights: ["ช่วยหน่อยได้ไหม", "พูดช้าๆ ได้ไหม", "ห้องน้ำอยู่ที่ไหน", "มีไวไฟไหม / ไม่สบาย"],
        slideDeckUrl: "lessons/lesson7.html",
    },
    {
        number: 8,
        title: "Review and Role Play",
        goal: "Combine all 7 lessons into realistic Thai conversations across a full day in Thailand.",
        highlights: ["Morning at a Café", "Afternoon in a Taxi", "Night Market Bargaining", "Surprise Problem & Free-Talk"],
        slideDeckUrl: "lessons/lesson8.html",
    },
]

export function formatSpeakoDateTime(dateStr: string, timeStr: string): string {
    const dt = new Date(`${dateStr}T${timeStr || "00:00"}:00+07:00`)
    if (isNaN(dt.getTime())) return `${dateStr}, ${timeStr}`
    const wk = dt.toLocaleDateString("en-GB", { weekday: "short", timeZone: "Asia/Bangkok" })
    const day = dt.toLocaleDateString("en-GB", { day: "2-digit", timeZone: "Asia/Bangkok" })
    const mon = dt.toLocaleDateString("en-GB", { month: "short", timeZone: "Asia/Bangkok" })
    return `${wk} ${day} ${mon}, ${timeStr}`
}

function getCountdownState(dateStr: string, timeStr: string, nowMs: number) {
    const targetMs = new Date(`${dateStr}T${timeStr || "00:00"}:00+07:00`).getTime()
    if (isNaN(targetMs)) return { label: "", state: "future" as const }
    const diffMin = Math.floor((targetMs - nowMs) / 60000)
    if (diffMin <= 0 && diffMin > -60) {
        return { label: "In progress", state: "in-progress" as const }
    }
    if (diffMin <= -60) {
        return { label: "Completed", state: "past" as const }
    }
    if (diffMin < 15) {
        return { label: "Starts soon", state: "soon" as const }
    }
    const days = Math.floor(diffMin / 1440)
    const hours = Math.floor((diffMin % 1440) / 60)
    const mins = diffMin % 60
    if (days > 0) {
        return { label: `Starts in ${days} day${days > 1 ? "s" : ""} ${hours} hr`, state: "future" as const }
    }
    if (hours > 0) {
        return { label: `Starts in ${hours} hr ${mins} min`, state: "future" as const }
    }
    return { label: `Starts in ${mins} min`, state: "future" as const }
}

export interface StudentPortalProps {
    data?: StudentPortalData
    onTopUp?: () => void
    onJoin?: (lesson: LessonItem) => void
    onDetails?: (lesson: LessonItem) => void
    onCancel?: (lessonId: string) => void
}

export default function StudentPortal({
    data = SAMPLE_DATA,
    onTopUp,
    onJoin,
    onDetails,
    onCancel,
}: StudentPortalProps) {
    const reduced = useReducedMotion()
    const [activeTab, setActiveTab] = React.useState<"schedule" | "book" | "lessons" | "credits">("schedule")
    const [checked, setChecked] = React.useState<Record<number, boolean>>({})
    const [confirmCancelId, setConfirmCancelId] = React.useState<string | null>(null)
    const [upcomingList, setUpcomingList] = React.useState<LessonItem[]>(data.upcoming)
    const [credits, setCredits] = React.useState<CreditsData>(data.credits)
    const [nowMs, setNowMs] = React.useState<number>(() => Date.now())
    const [barFilled, setBarFilled] = React.useState<boolean>(reduced)

    React.useEffect(() => {
        if (reduced) {
            setBarFilled(true)
            return
        }
        const t = window.setTimeout(() => setBarFilled(true), 60)
        return () => window.clearTimeout(t)
    }, [reduced])

    React.useEffect(() => {
        const iv = window.setInterval(() => setNowMs(Date.now()), 60000)
        return () => window.clearInterval(iv)
    }, [])

    const nextClass = upcomingList[0] || data.nextClass
    const countdown = nextClass ? getCountdownState(nextClass.date, nextClass.time, nowMs) : null
    const isUrgentOrLive = countdown?.state === "soon" || countdown?.state === "in-progress"
    const lessonPurpose = nextClass?.lessonGoal || nextClass?.goal || ""
    const totalLessons = Math.max(1, data.progress.total || 8)
    const currentLessonNum = Math.min(totalLessons, Math.max(1, data.progress.completed || nextClass?.lessonNumber || 1))
    const progressPct = Math.round((currentLessonNum / totalLessons) * 100)
    const hasZeroCredit = credits.thai <= 0 || credits.english <= 0
    const totalCredits = credits.thai + credits.english

    function handleConfirmCancel(lesson: LessonItem) {
        setUpcomingList((prev) => prev.filter((item) => item.id !== lesson.id))
        setCredits((prev) => ({
            ...prev,
            [lesson.type]: prev[lesson.type] + 1,
        }))
        setConfirmCancelId(null)
        onCancel?.(lesson.id)
    }

    return (
        <div className="sp-root">
            <style>{`
                .sp-root {
                    box-sizing: border-box;
                    width: 100%;
                    max-width: 1080px;
                    margin: 0 auto;
                    padding: 16px 14px 48px;
                    background: #F7F8FA;
                    color: #1F2937;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    overflow-x: hidden;
                }
                .sp-root *, .sp-root *::before, .sp-root *::after { box-sizing: border-box; }
                .sp-h1, .sp-h2, .sp-h3 {
                    font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
                    margin: 0;
                    letter-spacing: -0.02em;
                }
                .sp-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 10px;
                    padding: 10px 14px;
                    background: #FFFFFF;
                    border-radius: 999px;
                    box-shadow: 0 4px 18px rgba(11, 42, 91, 0.06);
                    margin-bottom: 24px;
                }
                .sp-brand { display: flex; align-items: center; gap: 8px; font-weight: 800; color: #0B2A5B; font-size: 18px; }
                .sp-badge-role {
                    background: rgba(15, 166, 163, 0.14);
                    color: #0B7F7C;
                    font-size: 11px;
                    font-weight: 700;
                    padding: 4px 10px;
                    border-radius: 999px;
                    text-transform: uppercase;
                }
                .sp-tabs { display: flex; gap: 4px; background: #F7F8FA; padding: 4px; border-radius: 999px; overflow-x: auto; max-width: 100%; }
                .sp-tab {
                    min-height: 44px;
                    padding: 8px 14px;
                    border-radius: 999px;
                    border: none;
                    background: transparent;
                    color: #64748B;
                    font-weight: 600;
                    font-size: 13.5px;
                    cursor: pointer;
                }
                .sp-tab.active { background: #FFFFFF; color: #0B2A5B; box-shadow: 0 2px 8px rgba(11, 42, 91, 0.08); }
                .sp-user { display: flex; align-items: center; gap: 8px; }
                .sp-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 12px;
                    border-radius: 999px;
                    background: #F7F8FA;
                    font-size: 13px;
                    font-weight: 600;
                    color: #0B2A5B;
                }
                .sp-bento {
                    display: grid;
                    grid-template-columns: 1.35fr 0.65fr;
                    gap: 20px;
                    margin-bottom: 28px;
                }
                @media (max-width: 768px) {
                    .sp-bento { grid-template-columns: 1fr; }
                    .sp-header { border-radius: 20px; }
                }
                .sp-next-card {
                    background: #0B2A5B;
                    color: #FFFFFF;
                    border-radius: 24px;
                    padding: 24px 20px;
                    box-shadow: 0 18px 40px rgba(11, 42, 91, 0.16);
                }
                .sp-card {
                    background: #FFFFFF;
                    border-radius: 24px;
                    padding: 22px 20px;
                    box-shadow: 0 8px 26px rgba(11, 42, 91, 0.06);
                }
                .sp-countdown {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 5px 11px;
                    border-radius: 999px;
                    font-size: 12px;
                    font-weight: 700;
                    background: rgba(255, 255, 255, 0.14);
                    color: #FFFFFF;
                }
                .sp-countdown.soon {
                    background: #0FA6A3;
                    animation: ${reduced ? "none" : "spPulse 1.6s ease-in-out infinite"};
                }
                .sp-countdown.in-progress { background: #F47C6B; }
                @keyframes spPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                .sp-progress-track {
                    height: 8px;
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.18);
                    overflow: hidden;
                    margin-top: 6px;
                }
                .sp-progress-fill {
                    height: 100%;
                    width: 100%;
                    background: #0FA6A3;
                    border-radius: 999px;
                    transform-origin: left center;
                    transform: scaleX(${barFilled ? progressPct / 100 : 0});
                    transition: ${reduced ? "none" : "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)"};
                }
                .sp-check-item {
                    width: 100%;
                    min-height: 44px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 12px;
                    border-radius: 14px;
                    border: 1px solid rgba(255, 255, 255, 0.16);
                    background: rgba(255, 255, 255, 0.06);
                    color: #FFFFFF;
                    font-size: 13.5px;
                    text-align: left;
                    cursor: pointer;
                }
                .sp-check-box {
                    width: 22px;
                    height: 22px;
                    border-radius: 6px;
                    border: 2px solid rgba(255, 255, 255, 0.6);
                    display: grid;
                    place-items: center;
                    flex-shrink: 0;
                    font-size: 13px;
                    font-weight: 800;
                }
                .sp-check-item.done { background: rgba(15, 166, 163, 0.22); }
                .sp-check-item.done .sp-check-box { background: #0FA6A3; border-color: #0FA6A3; }
                .sp-check-item.done .sp-check-mark {
                    animation: ${reduced ? "none" : "spCheckAnim 200ms ease-out"};
                }
                @keyframes spCheckAnim {
                    from { opacity: 0; transform: scale(0.4); }
                    to { opacity: 1; transform: scale(1); }
                }
                .sp-btn {
                    min-height: 44px;
                    padding: 10px 18px;
                    border-radius: 999px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    text-decoration: none;
                    border: 1.5px solid transparent;
                    transition: transform 180ms ease, background 180ms ease;
                }
                .sp-btn:active { transform: scale(0.97); }
                .sp-btn-primary { background: #0FA6A3; color: #FFFFFF; }
                .sp-btn-white { background: #FFFFFF; color: #0B2A5B; }
                .sp-btn-outline { background: transparent; color: #0B2A5B; border-color: rgba(11, 42, 91, 0.24); }
                .sp-next-card .sp-btn-outline { color: #FFFFFF; border-color: rgba(255, 255, 255, 0.45); }
                .sp-shimmer { position: relative; overflow: hidden; }
                .sp-shimmer::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.5) 50%, transparent 70%);
                    transform: translateX(-120%);
                    animation: ${reduced ? "none" : "spShimmer 900ms ease-out 1 forwards"};
                }
                @keyframes spShimmer { to { transform: translateX(120%); } }
                .sp-cancel-link {
                    min-height: 44px;
                    padding: 0 8px;
                    background: none;
                    border: none;
                    color: #F47C6B;
                    font-size: 13px;
                    font-weight: 600;
                    text-decoration: underline;
                    cursor: pointer;
                    margin-left: auto;
                }
                .sp-banner {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 12px;
                    padding: 14px 16px;
                    margin-bottom: 14px;
                    border-radius: 18px;
                    background: #FFFFFF;
                    border: 1.5px solid #F47C6B;
                    font-size: 13.5px;
                    font-weight: 600;
                    color: #1F2937;
                }
                .sp-upcoming-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 14px;
                    padding: 18px;
                    border-bottom: 1px solid rgba(11, 42, 91, 0.08);
                }
                .sp-upcoming-row:last-child { border-bottom: none; }
                .sp-actions {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                @media (max-width: 520px) {
                    .sp-actions { width: 100%; }
                }
            `}</style>

            {/* Header */}
            <header className="sp-header">
                <div className="sp-brand">
                    <span>Speako</span>
                    <span className="sp-badge-role">STUDENT</span>
                </div>
                <nav className="sp-tabs" aria-label="Student Portal Tabs">
                    {(["schedule", "book", "lessons", "credits"] as const).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            className={`sp-tab ${activeTab === tab ? "active" : ""}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </nav>
                <div className="sp-user">
                    <span className="sp-chip">{totalCredits} cr</span>
                    <button type="button" className="sp-btn sp-btn-outline" style={{ padding: "8px 14px" }}>
                        Exit
                    </button>
                </div>
            </header>

            {/* Greeting */}
            <div style={{ marginBottom: 20 }}>
                <h1 className="sp-h1" style={{ fontSize: "clamp(24px, 4vw, 32px)", color: "#0B2A5B" }}>
                    Hi, {data.studentName}.
                </h1>
            </div>

            {activeTab === "schedule" ? (
                <>
                    <div className="sp-bento">
                        {/* Dark Next Class Card */}
                        {nextClass ? (
                            <div className="sp-next-card">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#0FA6A3" }}>
                                        Next Class · {formatSpeakoDateTime(nextClass.date, nextClass.time)}
                                    </span>
                                    {countdown && countdown.label && (
                                        <span className={`sp-countdown ${countdown.state}`}>{countdown.label}</span>
                                    )}
                                </div>

                                <h2 className="sp-h2" style={{ fontSize: "clamp(20px, 3.5vw, 25px)", marginTop: 12 }}>
                                    Lesson {nextClass.lessonNumber || 1}: {nextClass.title}
                                </h2>

                                {lessonPurpose ? (
                                    <p style={{ margin: "6px 0 0", fontSize: 14.5, color: "rgba(255,255,255,0.88)" }}>
                                        {lessonPurpose}
                                    </p>
                                ) : null}

                                <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "rgba(255,255,255,0.74)" }}>
                                    {nextClass.course} · Teacher: <strong>{nextClass.teacher}</strong>
                                </p>

                                {/* Course Progress */}
                                <div style={{ marginTop: 14 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "rgba(255,255,255,0.82)" }}>
                                        <span>Lesson {currentLessonNum} of {totalLessons}</span>
                                        <span>{progressPct}%</span>
                                    </div>
                                    <div className="sp-progress-track">
                                        <div className="sp-progress-fill" />
                                    </div>
                                </div>

                                {/* 3-Item Prep Checklist */}
                                <div style={{ marginTop: 18, display: "grid", gap: 8 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "rgba(255,255,255,0.7)" }}>
                                        Before Class Checklist
                                    </div>
                                    {PREP_ITEMS.map((item, idx) => {
                                        const isDone = !!checked[idx]
                                        return (
                                            <button
                                                key={item}
                                                type="button"
                                                className={`sp-check-item ${isDone ? "done" : ""}`}
                                                onClick={() => setChecked((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                                            >
                                                <span className="sp-check-box">
                                                    {isDone ? <span className="sp-check-mark">✓</span> : null}
                                                </span>
                                                <span style={{ textDecoration: isDone ? "line-through" : "none", opacity: isDone ? 0.75 : 1 }}>
                                                    {item}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* Actions */}
                                <div className="sp-actions" style={{ marginTop: 20 }}>
                                    <a
                                        href={nextClass.meetingUrl || "#"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => onJoin?.(nextClass)}
                                        className={`sp-btn ${isUrgentOrLive ? "sp-btn-primary sp-shimmer" : "sp-btn-white"}`}
                                    >
                                        Join
                                    </a>
                                    <button
                                        type="button"
                                        className="sp-btn sp-btn-outline"
                                        onClick={() => onDetails?.(nextClass)}
                                    >
                                        Details
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="sp-next-card">
                                <h2 className="sp-h2" style={{ fontSize: 22 }}>No upcoming class</h2>
                                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 8 }}>
                                    Book your next 1-on-1 lesson anytime.
                                </p>
                            </div>
                        )}

                        {/* Right Column: Empty-Credit Banner + Credits Card */}
                        <div>
                            {hasZeroCredit && (
                                <div className="sp-banner">
                                    <span>You have no credits left. Top up to book your next lesson.</span>
                                    <button
                                        type="button"
                                        className="sp-btn sp-btn-primary"
                                        onClick={() => {
                                            setActiveTab("credits")
                                            onTopUp?.()
                                        }}
                                    >
                                        Top up
                                    </button>
                                </div>
                            )}

                            <div className="sp-card">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>
                                        Credits
                                    </span>
                                    <button
                                        type="button"
                                        className="sp-btn sp-btn-outline"
                                        style={{ padding: "6px 14px" }}
                                        onClick={() => {
                                            setActiveTab("credits")
                                            onTopUp?.()
                                        }}
                                    >
                                        + Top Up
                                    </button>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
                                    <div style={{ padding: 14, borderRadius: 16, background: "#F7F8FA" }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>Thai</div>
                                        <div className="sp-h2" style={{ fontSize: 28, color: "#0B2A5B", marginTop: 4 }}>{credits.thai}</div>
                                        <div style={{ fontSize: 12, color: "#64748B" }}>remaining</div>
                                    </div>
                                    <div style={{ padding: 14, borderRadius: 16, background: "#F7F8FA" }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>English</div>
                                        <div className="sp-h2" style={{ fontSize: 28, color: "#0FA6A3", marginTop: 4 }}>{credits.english}</div>
                                        <div style={{ fontSize: 12, color: "#64748B" }}>remaining</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming List */}
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                            <h3 className="sp-h3" style={{ fontSize: 19, color: "#0B2A5B" }}>
                                Upcoming ({upcomingList.length})
                            </h3>
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#64748B" }}>
                                Bangkok time (UTC+7)
                            </span>
                        </div>

                        <div className="sp-card" style={{ padding: 0 }}>
                            {upcomingList.length === 0 ? (
                                <div style={{ padding: 28, textAlign: "center", color: "#64748B" }}>
                                    No upcoming lessons scheduled.
                                </div>
                            ) : (
                                upcomingList.map((lesson) => (
                                    <div key={lesson.id} className="sp-upcoming-row">
                                        <div>
                                            <div style={{ fontWeight: 700, color: "#0B2A5B", fontSize: 15.5 }}>
                                                Lesson {lesson.lessonNumber || 1}: {lesson.title}
                                            </div>
                                            <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
                                                {formatSpeakoDateTime(lesson.date, lesson.time)} · {lesson.teacher}
                                            </div>
                                        </div>

                                        {confirmCancelId === lesson.id ? (
                                            <div className="sp-actions">
                                                <span style={{ fontSize: 13, fontWeight: 600, color: "#1F2937" }}>
                                                    Cancel this lesson? You’ll get 1 credit back.
                                                </span>
                                                <button
                                                    type="button"
                                                    className="sp-btn sp-btn-primary"
                                                    style={{ background: "#F47C6B" }}
                                                    onClick={() => handleConfirmCancel(lesson)}
                                                >
                                                    Confirm
                                                </button>
                                                <button
                                                    type="button"
                                                    className="sp-btn sp-btn-outline"
                                                    onClick={() => setConfirmCancelId(null)}
                                                >
                                                    Keep
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="sp-actions">
                                                <a
                                                    href={lesson.meetingUrl || "#"}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="sp-btn sp-btn-primary"
                                                    onClick={() => onJoin?.(lesson)}
                                                >
                                                    Join
                                                </a>
                                                <button
                                                    type="button"
                                                    className="sp-btn sp-btn-outline"
                                                    onClick={() => onDetails?.(lesson)}
                                                >
                                                    Details
                                                </button>
                                                <button
                                                    type="button"
                                                    className="sp-cancel-link"
                                                    onClick={() => setConfirmCancelId(lesson.id)}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            ) : activeTab === "lessons" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                    {THAI_LESSONS_1_TO_8.map((l) => (
                        <div key={l.number} className="sp-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 12 }}>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                                    <span className="sp-badge-role">Lesson {l.number} of 8</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: "#EEF2FF", color: "#3730A3" }}>
                                        ✦ Interactive Slide Deck + Audio
                                    </span>
                                </div>
                                <h3 className="sp-h3" style={{ fontSize: 18, color: "#0B2A5B" }}>{l.title}</h3>
                                <p style={{ fontSize: 13.5, color: "#64748B", margin: "6px 0 0" }}>{l.goal}</p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                                    {l.highlights.map((h) => (
                                        <span key={h} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 999, background: "#F7F8FA", color: "#1F2937" }}>
                                            {h}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid rgba(11, 42, 91, 0.08)" }}>
                                <a href={l.slideDeckUrl} target="_blank" rel="noopener noreferrer" className="sp-btn sp-btn-primary" style={{ padding: "8px 14px", fontSize: 13 }}>
                                    Launch Slides ↗
                                </a>
                                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0B7F7C" }}>Lesson {l.number}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="sp-card">
                    <h2 className="sp-h2" style={{ fontSize: 20, color: "#0B2A5B", textTransform: "capitalize" }}>
                        {activeTab}
                    </h2>
                    <p style={{ color: "#64748B", fontSize: 14, marginTop: 8 }}>
                        Your existing {activeTab} view stays active here.
                    </p>
                </div>
            )}
        </div>
    )
}
