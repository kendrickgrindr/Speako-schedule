/**
 * ThaiSurvivalKit — Speako Framer code component (pure React, no "framer" import).
 * Pick a real-life situation -> get 5 polite Thai phrases with audio -> 2-question
 * practice -> result card with booking CTA. No signup, no storage, React state only.
 * Audio: files live at AUDIO_BASE_PATH + "<situation-id>-<n>.mp3". Missing files hide Play/Slow.
 */
import * as React from "react"

const AUDIO_BASE_PATH = "/audio/"
const BOOKING_URL = "[BOOKING_URL]"

type Phrase = { thai: string; romanization: string; meaning: string; audioUrl: string }
type Situation = { id: string; title: string; icon: string; phrases: Phrase[] }

const a = (id: string, n: number) => `${AUDIO_BASE_PATH}${id}-${n}.mp3`

export const SURVIVAL_KIT: { situations: Situation[] } = {
    situations: [
        { id: "ordering-food", title: "Ordering food", icon: "🍜", phrases: [
            { thai: "ขอเมนูหน่อยครับ/ค่ะ", romanization: "khǒr mee-nuu nòi khrap/kha", meaning: "Can I have the menu, please?", audioUrl: a("ordering-food", 1) },
            { thai: "เอาอันนี้ครับ/ค่ะ", romanization: "ao an níi khrap/kha", meaning: "I'll have this one.", audioUrl: a("ordering-food", 2) },
            { thai: "ไม่เผ็ดนะครับ/คะ", romanization: "mâi phèt ná khrap/kha", meaning: "Not spicy, please.", audioUrl: a("ordering-food", 3) },
            { thai: "ขอน้ำเปล่าหนึ่งขวดครับ/ค่ะ", romanization: "khǒr náam plàao nùeng khùat khrap/kha", meaning: "One bottle of water, please.", audioUrl: a("ordering-food", 4) },
            { thai: "เช็คบิลด้วยครับ/ค่ะ", romanization: "chék bin dûai khrap/kha", meaning: "The bill, please.", audioUrl: a("ordering-food", 5) },
        ] },
        { id: "taking-a-taxi", title: "Taking a taxi", icon: "🚕", phrases: [
            { thai: "ไปสนามบินได้ไหมครับ/คะ", romanization: "pai sà-nǎam-bin dâi mǎi khrap/kha", meaning: "Can you go to the airport?", audioUrl: a("taking-a-taxi", 1) },
            { thai: "เปิดมิเตอร์ด้วยครับ/ค่ะ", romanization: "pòet mí-dtôe dûai khrap/kha", meaning: "Please use the meter.", audioUrl: a("taking-a-taxi", 2) },
            { thai: "เลี้ยวซ้ายตรงนี้ครับ/ค่ะ", romanization: "líao sáai dtrong níi khrap/kha", meaning: "Turn left here.", audioUrl: a("taking-a-taxi", 3) },
            { thai: "จอดตรงนี้ครับ/ค่ะ", romanization: "jòt dtrong níi khrap/kha", meaning: "Stop here, please.", audioUrl: a("taking-a-taxi", 4) },
            { thai: "เท่าไหร่ครับ/คะ", romanization: "thâo-rài khrap/kha", meaning: "How much is it?", audioUrl: a("taking-a-taxi", 5) },
        ] },
        { id: "meeting-parents", title: "Meeting a friend's parents", icon: "🙏", phrases: [
            { thai: "สวัสดีครับ/ค่ะ", romanization: "sà-wàt-dii khrap/kha", meaning: "Hello (polite greeting).", audioUrl: a("meeting-parents", 1) },
            { thai: "ยินดีที่ได้รู้จักครับ/ค่ะ", romanization: "yin-dii thîi dâi rúu-jàk khrap/kha", meaning: "Nice to meet you.", audioUrl: a("meeting-parents", 2) },
            { thai: "ขอบคุณที่เชิญมานะครับ/คะ", romanization: "khòp-khun thîi choen maa ná khrap/kha", meaning: "Thank you for inviting me.", audioUrl: a("meeting-parents", 3) },
            { thai: "อาหารอร่อยมากครับ/ค่ะ", romanization: "aa-hǎan à-ròi mâak khrap/kha", meaning: "The food is delicious.", audioUrl: a("meeting-parents", 4) },
            { thai: "ขอตัวก่อนนะครับ/คะ", romanization: "khǒr dtua gòn ná khrap/kha", meaning: "Please excuse me, I have to go.", audioUrl: a("meeting-parents", 5) },
        ] },
        { id: "shopping-market", title: "Shopping at a market", icon: "🛍️", phrases: [
            { thai: "อันนี้เท่าไหร่ครับ/คะ", romanization: "an níi thâo-rài khrap/kha", meaning: "How much is this?", audioUrl: a("shopping-market", 1) },
            { thai: "ขอดูหน่อยได้ไหมครับ/คะ", romanization: "khǒr duu nòi dâi mǎi khrap/kha", meaning: "Can I take a look?", audioUrl: a("shopping-market", 2) },
            { thai: "แพงไปหน่อยครับ/ค่ะ", romanization: "phaeng pai nòi khrap/kha", meaning: "It's a bit expensive.", audioUrl: a("shopping-market", 3) },
            { thai: "ลดได้ไหมครับ/คะ", romanization: "lót dâi mǎi khrap/kha", meaning: "Can you give me a discount?", audioUrl: a("shopping-market", 4) },
            { thai: "เอาสองอันครับ/ค่ะ", romanization: "ao sǒng an khrap/kha", meaning: "I'll take two.", audioUrl: a("shopping-market", 5) },
        ] },
    ],
}

type Question = { phrase: Phrase; options: string[] }
type View = "pick" | "phrases" | "quiz" | "result"

function shuffle<T>(arr: T[]): T[] {
    const out = arr.slice()
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
}

function buildQuiz(s: Situation): Question[] {
    return shuffle(s.phrases).slice(0, 2).map((p) => {
        const wrong = shuffle(s.phrases.filter((x) => x !== p)).slice(0, 3).map((x) => x.meaning)
        return { phrase: p, options: shuffle([p.meaning, ...wrong]) }
    })
}

function useReducedMotion(): boolean {
    const [r, setR] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const m = window.matchMedia("(prefers-reduced-motion: reduce)")
        const on = () => setR(m.matches)
        on()
        m.addEventListener?.("change", on)
        return () => m.removeEventListener?.("change", on)
    }, [])
    return r
}

const CSS = `
.sk{box-sizing:border-box;width:100%;max-width:720px;margin:0 auto;padding:24px 16px;font-family:Inter,system-ui,sans-serif;color:#1F2937;background:#F7F8FA;border-radius:24px;overflow-x:hidden}
.sk *{box-sizing:border-box}
.sk h2,.sk h3{font-family:Montserrat,system-ui,sans-serif;color:#0B2A5B;margin:0}
.sk h2{font-size:clamp(22px,5vw,30px);line-height:1.2}
.sk p{margin:0}
.sk-sub{color:#64748B;font-size:15px;margin-top:8px!important;line-height:1.5}
.sk-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:20px}
@media(min-width:640px){.sk-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
.sk-card{min-height:112px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:16px 10px;border:2px solid transparent;border-radius:20px;background:#fff;box-shadow:0 1px 3px rgba(11,42,91,.08);cursor:pointer;font:600 14px/1.3 Inter,sans-serif;color:#0B2A5B;text-align:center;transition:transform .2s ease,border-color .2s ease}
.sk-card:hover,.sk-card:focus-visible{border-color:#0FA6A3;outline:none}
.sk-card:active{transform:scale(.98)}
.sk-icon{font-size:30px}
.sk-btn{min-height:44px;padding:10px 18px;border-radius:999px;border:2px solid #0FA6A3;background:#fff;color:#0B7F7C;font:600 15px Inter,sans-serif;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;transition:transform .15s ease,background .2s ease}
.sk-btn:active{transform:scale(.97)}
.sk-btn:focus-visible{outline:3px solid rgba(15,166,163,.4);outline-offset:2px}
.sk-primary{background:#0FA6A3;color:#fff}
.sk-primary:hover{background:#0B7F7C;border-color:#0B7F7C}
.sk-small{min-height:44px;min-width:44px;padding:8px 14px;font-size:14px}
.sk-back{border:none;background:none;color:#64748B;padding:10px 0;min-height:44px;font:600 14px Inter,sans-serif;cursor:pointer}
.sk-list{list-style:none;padding:0;margin:16px 0 0;display:grid;gap:12px}
.sk-phrase{background:#fff;border-radius:18px;padding:16px;box-shadow:0 1px 3px rgba(11,42,91,.08)}
.sk-thai{font-size:22px;font-weight:600;color:#0B2A5B;line-height:1.4;word-break:break-word}
.sk-rom{color:#0B7F7C;font-size:15px;margin-top:2px!important}
.sk-mean{color:#1F2937;font-size:15px;margin-top:4px!important}
.sk-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
@keyframes sk-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes sk-pop{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
.sk-anim-in{opacity:0;animation:sk-in 400ms cubic-bezier(.2,.7,.2,1) forwards}
.sk-anim-pop{animation:sk-pop 300ms ease-out both}
.sk-opt{width:100%;text-align:left;justify-content:flex-start;border-color:#E2E8F0;color:#1F2937;border-radius:16px}
.sk-opt.is-right{border-color:#0FA6A3;background:rgba(15,166,163,.1)}
.sk-opt.is-wrong{border-color:#F47C6B;background:rgba(244,124,107,.08)}
.sk-result{background:#0B2A5B;color:#fff;border-radius:24px;padding:24px 20px;margin-top:8px}
.sk-result h3{color:#fff;font-size:22px;line-height:1.3}
.sk-result p{color:#DCE6F2;line-height:1.5;margin-top:10px!important}
.sk-score{display:inline-block;margin-bottom:12px;padding:4px 12px;border-radius:999px;background:#F47C6B;color:#fff;font-weight:700;font-size:13px}
.sk-result .sk-btn:not(.sk-primary){background:transparent;color:#fff;border-color:rgba(255,255,255,.5)}
@media(prefers-reduced-motion:reduce){.sk-anim-in,.sk-anim-pop{animation:none;opacity:1}}
`

export default function ThaiSurvivalKit() {
    const reduced = useReducedMotion()
    const [view, setView] = React.useState<View>("pick")
    const [sit, setSit] = React.useState<Situation | null>(null)
    const [failed, setFailed] = React.useState<Set<string>>(() => new Set())
    const [quiz, setQuiz] = React.useState<Question[]>([])
    const [qIndex, setQIndex] = React.useState(0)
    const [picked, setPicked] = React.useState<string | null>(null)
    const [score, setScore] = React.useState(0)
    const audioRef = React.useRef<HTMLAudioElement | null>(null)
    const topRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => () => audioRef.current?.pause(), [])

    const scrollTop = () => topRef.current?.scrollIntoView?.({ block: "start", behavior: reduced ? "auto" : "smooth" })

    const prepare = (url: string): HTMLAudioElement | null => {
        if (typeof Audio === "undefined" || failed.has(url)) return null
        if (audioRef.current && audioRef.current.dataset.src === url) return audioRef.current
        audioRef.current?.pause()
        const el = new Audio()
        el.preload = "auto"
        el.dataset.src = url
        el.addEventListener("error", () => setFailed((prev) => new Set(prev).add(url)))
        el.src = url
        audioRef.current = el
        return el
    }

    const play = (url: string, rate: number) => {
        const el = prepare(url)
        if (!el) return
        el.playbackRate = rate
        try { el.currentTime = 0 } catch { /* not seekable yet */ }
        el.play().catch(() => { /* blocked or missing: error listener handles missing */ })
    }

    const choose = (s: Situation) => { setSit(s); setView("phrases"); scrollTop() }
    const startQuiz = () => { if (!sit) return; setQuiz(buildQuiz(sit)); setQIndex(0); setScore(0); setPicked(null); setView("quiz") }
    const answer = (opt: string) => {
        if (picked) return
        setPicked(opt)
        if (opt === quiz[qIndex].phrase.meaning) setScore((s) => s + 1)
    }
    const next = () => {
        setPicked(null)
        if (qIndex + 1 < quiz.length) setQIndex(qIndex + 1)
        else setView("result")
    }
    const reset = () => { setSit(null); setView("pick"); audioRef.current?.pause(); scrollTop() }

    return (
        <div className="sk" ref={topRef}>
            <style>{CSS}</style>

            {view === "pick" && (
                <section aria-labelledby="sk-h">
                    <h2 id="sk-h">Thai Survival Kit</h2>
                    <p className="sk-sub">Pick a situation. Get 5 phrases you can use today. No signup.</p>
                    <div className="sk-grid">
                        {SURVIVAL_KIT.situations.map((s) => (
                            <button key={s.id} className="sk-card" onClick={() => choose(s)}>
                                <span className="sk-icon" aria-hidden="true">{s.icon}</span>
                                {s.title}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {view === "phrases" && sit && (
                <section aria-labelledby="sk-ph">
                    <button className="sk-back" onClick={reset}>← All situations</button>
                    <h2 id="sk-ph"><span aria-hidden="true">{sit.icon}</span> {sit.title}</h2>
                    <p className="sk-sub">Say “khrap” if you’re male, “kha” if you’re female.</p>
                    <ul className="sk-list">
                        {sit.phrases.map((p, i) => {
                            const ok = !failed.has(p.audioUrl)
                            return (
                                <li key={p.audioUrl} className={reduced ? "sk-phrase" : "sk-phrase sk-anim-in"} style={reduced ? undefined : { animationDelay: `${i * 80}ms` }}>
                                    <p className="sk-thai" lang="th">{p.thai}</p>
                                    <p className="sk-rom">{p.romanization}</p>
                                    <p className="sk-mean">{p.meaning}</p>
                                    {ok && (
                                        <div className="sk-row">
                                            <button className="sk-btn sk-small" aria-label={`Play: ${p.meaning}`} onPointerEnter={() => prepare(p.audioUrl)} onFocus={() => prepare(p.audioUrl)} onClick={() => play(p.audioUrl, 1)}>▶ Play</button>
                                            <button className="sk-btn sk-small" aria-label={`Play slowly: ${p.meaning}`} onPointerEnter={() => prepare(p.audioUrl)} onFocus={() => prepare(p.audioUrl)} onClick={() => play(p.audioUrl, 0.7)}>🐢 Slow</button>
                                        </div>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                    <div className="sk-row" style={{ marginTop: 20 }}>
                        <button className="sk-btn sk-primary" onClick={startQuiz}>Practice</button>
                    </div>
                </section>
            )}

            {view === "quiz" && sit && quiz[qIndex] && (
                <section aria-live="polite">
                    <p className="sk-sub" style={{ marginTop: 0 }}>Question {qIndex + 1} of {quiz.length}</p>
                    <h2 style={{ marginTop: 8 }}>What does this mean?</h2>
                    <p className="sk-thai" lang="th" style={{ marginTop: 12 }}>{quiz[qIndex].phrase.thai}</p>
                    <p className="sk-rom">{quiz[qIndex].phrase.romanization}</p>
                    <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                        {quiz[qIndex].options.map((opt) => {
                            const right = opt === quiz[qIndex].phrase.meaning
                            const cls = picked ? (right ? " is-right" : opt === picked ? " is-wrong" : "") : ""
                            return (
                                <button key={opt} className={`sk-btn sk-opt${cls}`} onClick={() => answer(opt)} aria-pressed={picked === opt} disabled={!!picked && !right && opt !== picked}>
                                    {opt}
                                </button>
                            )
                        })}
                    </div>
                    {picked && (
                        <div className="sk-row" style={{ marginTop: 16 }}>
                            <button className="sk-btn sk-primary" onClick={next}>{qIndex + 1 < quiz.length ? "Next" : "See result"}</button>
                        </div>
                    )}
                </section>
            )}

            {view === "result" && sit && (
                <section className={reduced ? "sk-result" : "sk-result sk-anim-pop"} aria-live="polite">
                    <span className="sk-score">{score}/{quiz.length} correct</span>
                    <h3>You’re ready for {sit.title.toLowerCase()}... almost.</h3>
                    <p>Thai has 5 tones, and the same sound can mean different things — most beginners get tones wrong without a teacher listening.</p>
                    <div className="sk-row" style={{ marginTop: 20 }}>
                        <a className="sk-btn sk-primary" href={BOOKING_URL}>Book a free trial lesson</a>
                        <button className="sk-btn" onClick={reset}>Try another situation</button>
                    </div>
                </section>
            )}
        </div>
    )
}
