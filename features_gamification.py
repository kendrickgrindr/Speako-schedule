"""
Speako Languages — Player Objectives Backend (Phases 5a, 5b, 5c, 5d)

All features are gated by feature flags in `feature_flags` (defaulting to OFF).
"""
import json
import re
import uuid
import zoneinfo
from datetime import datetime, timedelta, timezone

MAX_RECORDING_BYTES = 512 * 1024  # 512 KB per recording
MAX_RECORDINGS_PER_USER = 30

TIMEZONE_ALIASES = {
    "Thailand (GMT+7)": "Asia/Bangkok",
    "Bangkok (GMT+7)": "Asia/Bangkok",
    "ICT": "Asia/Bangkok",
    "UTC": "UTC",
    "GMT": "UTC",
}

MILESTONE_BADGES = [
    {"id": "first_lesson", "title": "First Step", "description": "Completed your first lesson or activity.", "icon": "🌱", "rule": ("activities", 1)},
    {"id": "streak_5", "title": "5-Day Flame", "description": "Practiced 5 days in a row!", "icon": "🔥", "rule": ("longest_streak", 5)},
    {"id": "stars_100", "title": "100 Stars", "description": "Collected 100 stars across lessons & practice.", "icon": "⭐", "rule": ("total_stars", 100)},
    {"id": "vocab_10", "title": "Word Collector", "description": "Saved 10 tricky words to your Word Vault.", "icon": "📚", "rule": ("vault_count", 10)},
]

AVAILABLE_TOPICS = [
    {"id": "travel", "label": "Travel & Directions"},
    {"id": "food", "label": "Food & Ordering"},
    {"id": "work", "label": "Work & Meetings"},
    {"id": "daily_life", "label": "Daily Life"},
    {"id": "shopping", "label": "Shopping & Bargaining"},
    {"id": "emergencies", "label": "Health & Emergencies"},
    {"id": "culture", "label": "Culture & Introductions"},
]

MASCOT_ITEMS = {
    "outfits": [
        {"id": "default", "label": "Classic Tee", "icon": "👕"},
        {"id": "thai_silk", "label": "Thai Silk", "icon": "👘"},
        {"id": "graduate", "label": "Scholar Robe", "icon": "🎓"},
        {"id": "explorer", "label": "Explorer Vest", "icon": "🧭"},
        {"id": "chef", "label": "Street Food Apron", "icon": "🍜"},
    ],
    "accessories": [
        {"id": "none", "label": "None", "icon": "✨"},
        {"id": "glasses", "label": "Round Glasses", "icon": "👓"},
        {"id": "headphones", "label": "Studio Headphones", "icon": "🎧"},
        {"id": "hat", "label": "Sun Hat", "icon": "👒"},
        {"id": "scarf", "label": "Cozy Scarf", "icon": "🧣"},
    ],
}


def _utc_now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def resolve_tz(tz_name: str):
    if not tz_name:
        return zoneinfo.ZoneInfo("Asia/Bangkok")
    mapped = TIMEZONE_ALIASES.get(tz_name, tz_name)
    m = re.match(r"^(?:GMT|UTC)([+-]\d{1,2})(?::?(\d{2}))?$", mapped.strip(), re.IGNORECASE)
    if m:
        hrs = int(m.group(1))
        mins = int(m.group(2) or 0)
        if hrs < 0:
            mins = -mins
        return timezone(timedelta(hours=hrs, minutes=mins))
    try:
        return zoneinfo.ZoneInfo(mapped)
    except Exception:
        return zoneinfo.ZoneInfo("Asia/Bangkok")


def local_date_str(tz_name: str, now_utc: datetime = None) -> str:
    dt = now_utc or datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(resolve_tz(tz_name)).strftime("%Y-%m-%d")


# =========================================================
# PHASE 5A: WORD VAULT, STREAKS, STARS/XP & MILESTONE BADGES
# =========================================================

def get_word_vault(cur, user_id: str, query: str = ""):
    if query:
        q = f"%{query.strip()}%"
        rows = cur.execute(
            "SELECT * FROM word_vault WHERE user_id = ? AND (phrase LIKE ? OR notes LIKE ?) ORDER BY created_at DESC",
            (user_id, q, q),
        ).fetchall()
    else:
        rows = cur.execute(
            "SELECT * FROM word_vault WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def add_word_vault(cur, user_id: str, course_id: str, lesson_number: int, phrase: str, notes: str = ""):
    phrase = (phrase or "").strip()
    if not phrase:
        raise ValueError("Phrase is required.")
    wid = str(uuid.uuid4())
    now = _utc_now()
    cur.execute("""
        INSERT OR IGNORE INTO word_vault (id, user_id, course_id, lesson_number, phrase, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (wid, user_id, course_id or "thai", int(lesson_number or 1), phrase, (notes or "").strip(), now))
    _check_and_award_badges(cur, user_id)
    return get_word_vault(cur, user_id)


def remove_word_vault(cur, user_id: str, word_id: str):
    cur.execute("DELETE FROM word_vault WHERE id = ? AND user_id = ?", (word_id, user_id))
    return get_word_vault(cur, user_id)


def compute_effective_streak(streak_row, tz_name: str, now_utc: datetime = None) -> dict:
    today = local_date_str(tz_name, now_utc)
    yesterday = (datetime.strptime(today, "%Y-%m-%d") - timedelta(days=1)).strftime("%Y-%m-%d")
    if not streak_row:
        return {"current_streak": 0, "longest_streak": 0, "last_active_date": "", "timezone": tz_name or "Asia/Bangkok"}
    last = streak_row["last_active_date"] or ""
    cur_s = int(streak_row["current_streak"] or 0)
    long_s = int(streak_row["longest_streak"] or 0)
    if last not in (today, yesterday):
        cur_s = 0
    return {
        "current_streak": cur_s,
        "longest_streak": long_s,
        "last_active_date": last,
        "timezone": streak_row["timezone"] or tz_name or "Asia/Bangkok",
    }


def record_daily_activity(cur, user_id: str, activity_type: str, ref_id: str = "", tz_name: str = "Asia/Bangkok", now_utc: datetime = None):
    if activity_type not in ("lesson", "practice", "audio"):
        raise ValueError("Invalid activity_type.")
    today = local_date_str(tz_name, now_utc)
    yesterday = (datetime.strptime(today, "%Y-%m-%d") - timedelta(days=1)).strftime("%Y-%m-%d")
    now = _utc_now()

    cur.execute("""
        INSERT OR IGNORE INTO user_activity_days (id, user_id, activity_date, activity_type, ref_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (str(uuid.uuid4()), user_id, today, activity_type, ref_id or "", now))

    row = cur.execute("SELECT * FROM user_streaks WHERE user_id = ?", (user_id,)).fetchone()
    if not row:
        cur_s, long_s = 1, 1
    else:
        last = row["last_active_date"] or ""
        prev_cur = int(row["current_streak"] or 0)
        prev_long = int(row["longest_streak"] or 0)
        if last == today:
            cur_s = max(1, prev_cur)
        elif last == yesterday:
            cur_s = prev_cur + 1
        else:
            cur_s = 1
        long_s = max(prev_long, cur_s)

    cur.execute("""
        INSERT OR REPLACE INTO user_streaks (user_id, current_streak, longest_streak, last_active_date, timezone, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, cur_s, long_s, today, tz_name or "Asia/Bangkok", now))

    # Idempotent XP/Stars for this activity
    event_key = f"{activity_type}:{today}:{ref_id or 'daily'}"
    stars = 10 if activity_type == "lesson" else 5
    xp = 25 if activity_type == "lesson" else 10
    award_xp(cur, user_id, event_key, activity_type, stars, xp, f"Completed {activity_type} ({today})")
    _check_and_award_badges(cur, user_id)

    return get_gamification_summary(cur, user_id, tz_name, now_utc=now_utc)


def award_xp(cur, user_id: str, event_key: str, event_type: str, stars: int, xp: int, description: str = "") -> bool:
    """Idempotent XP & Stars award. Returns True if newly awarded, False if already existed."""
    existing = cur.execute(
        "SELECT 1 FROM user_xp_events WHERE user_id = ? AND event_key = ?",
        (user_id, event_key),
    ).fetchone()
    if existing:
        return False
    cur.execute("""
        INSERT INTO user_xp_events (id, user_id, event_key, event_type, stars, xp, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (str(uuid.uuid4()), user_id, event_key, event_type, int(stars), int(xp), description, _utc_now()))
    _check_and_award_badges(cur, user_id)
    return True


def _check_and_award_badges(cur, user_id: str):
    totals = cur.execute(
        "SELECT COALESCE(SUM(stars), 0) AS s, COALESCE(SUM(xp), 0) AS x, COUNT(*) AS c FROM user_xp_events WHERE user_id = ?",
        (user_id,),
    ).fetchone()
    streak = cur.execute("SELECT longest_streak FROM user_streaks WHERE user_id = ?", (user_id,)).fetchone()
    vault_cnt = cur.execute("SELECT COUNT(*) AS c FROM word_vault WHERE user_id = ?", (user_id,)).fetchone()["c"]
    metrics = {
        "activities": int(totals["c"] or 0),
        "total_stars": int(totals["s"] or 0),
        "total_xp": int(totals["x"] or 0),
        "longest_streak": int(streak["longest_streak"] if streak else 0),
        "vault_count": int(vault_cnt or 0),
    }
    now = _utc_now()
    for b in MILESTONE_BADGES:
        metric_name, threshold = b["rule"]
        if metrics.get(metric_name, 0) >= threshold:
            cur.execute("""
                INSERT OR IGNORE INTO user_badges (id, user_id, badge_id, title, description, icon, earned_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (str(uuid.uuid4()), user_id, b["id"], b["title"], b["description"], b["icon"], now))


def get_gamification_summary(cur, user_id: str, tz_name: str = "Asia/Bangkok", now_utc: datetime = None):
    streak_row = cur.execute("SELECT * FROM user_streaks WHERE user_id = ?", (user_id,)).fetchone()
    streak = compute_effective_streak(streak_row, tz_name, now_utc=now_utc)
    totals = cur.execute(
        "SELECT COALESCE(SUM(stars), 0) AS stars, COALESCE(SUM(xp), 0) AS xp FROM user_xp_events WHERE user_id = ?",
        (user_id,),
    ).fetchone()
    badges = [dict(r) for r in cur.execute("SELECT * FROM user_badges WHERE user_id = ? ORDER BY earned_at DESC", (user_id,)).fetchall()]
    vault = get_word_vault(cur, user_id)
    return {
        "streak": streak,
        "stars": int(totals["stars"] or 0),
        "xp": int(totals["xp"] or 0),
        "badges": badges,
        "available_badges": MILESTONE_BADGES,
        "word_vault": vault,
    }


# =========================================================
# PHASE 5B: VOICE RECORDING, BEST SCORES, CUSTOM DECKS
# =========================================================

def save_voice_recording(cur, user_id: str, course_id: str, lesson_number: int, phrase: str, mime_type: str, audio_b64: str, duration_ms: int = 0):
    phrase = (phrase or "").strip()
    if not phrase or not audio_b64:
        raise ValueError("Phrase and audio data are required.")
    byte_size = len(audio_b64.encode("utf-8"))
    if byte_size > MAX_RECORDING_BYTES:
        raise ValueError(f"Recording exceeds maximum size limit ({MAX_RECORDING_BYTES // 1024} KB).")
    cnt = cur.execute("SELECT COUNT(*) AS c FROM voice_recordings WHERE user_id = ?", (user_id,)).fetchone()["c"]
    if cnt >= MAX_RECORDINGS_PER_USER:
        raise ValueError(f"Recording limit reached ({MAX_RECORDINGS_PER_USER}). Please delete an older recording first.")
    rid = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO voice_recordings (id, user_id, course_id, lesson_number, phrase, mime_type, audio_b64, byte_size, duration_ms, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (rid, user_id, course_id or "thai", int(lesson_number or 1), phrase, mime_type or "audio/webm", audio_b64, byte_size, int(duration_ms or 0), _utc_now()))
    return list_voice_recordings(cur, user_id)


def list_voice_recordings(cur, user_id: str):
    rows = cur.execute(
        "SELECT id, user_id, course_id, lesson_number, phrase, mime_type, audio_b64, byte_size, duration_ms, created_at FROM voice_recordings WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,),
    ).fetchall()
    return [dict(r) for r in rows]


def delete_voice_recording(cur, user_id: str, recording_id: str):
    cur.execute("DELETE FROM voice_recordings WHERE id = ? AND user_id = ?", (recording_id, user_id))
    return list_voice_recordings(cur, user_id)


def save_phrase_score(cur, user_id: str, course_id: str, phrase: str, score: float):
    phrase = (phrase or "").strip()
    if not phrase:
        raise ValueError("Phrase is required.")
    score = max(0.0, min(100.0, float(score)))
    existing = cur.execute(
        "SELECT * FROM phrase_scores WHERE user_id = ? AND course_id = ? AND phrase = ?",
        (user_id, course_id or "thai", phrase),
    ).fetchone()
    now = _utc_now()
    if not existing:
        cur.execute("""
            INSERT INTO phrase_scores (id, user_id, course_id, phrase, best_score, last_score, attempts, improved, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?)
        """, (str(uuid.uuid4()), user_id, course_id or "thai", phrase, score, score, now))
        improved = True
        best = score
    else:
        prev_best = float(existing["best_score"] or 0.0)
        improved = score > prev_best
        best = max(prev_best, score)
        cur.execute("""
            UPDATE phrase_scores SET best_score = ?, last_score = ?, attempts = attempts + 1, improved = ?, updated_at = ?
            WHERE id = ?
        """, (best, score, 1 if improved else 0, now, existing["id"]))
    return {"phrase": phrase, "score": score, "best_score": best, "improved": improved}


def list_phrase_scores(cur, user_id: str):
    return [dict(r) for r in cur.execute("SELECT * FROM phrase_scores WHERE user_id = ? ORDER BY updated_at DESC", (user_id,)).fetchall()]


def save_custom_deck(cur, user_id: str, title: str, course_id: str, items: list, deck_id: str = ""):
    title = (title or "").strip()
    if not title:
        raise ValueError("Deck title is required.")
    items = [str(x).strip() for x in (items or []) if str(x).strip()]
    now = _utc_now()
    if deck_id:
        cur.execute("""
            UPDATE custom_decks SET title = ?, course_id = ?, items_json = ?, updated_at = ?
            WHERE id = ? AND user_id = ?
        """, (title, course_id or "thai", json.dumps(items, ensure_ascii=False), now, deck_id, user_id))
    else:
        cur.execute("""
            INSERT INTO custom_decks (id, user_id, title, course_id, items_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (str(uuid.uuid4()), user_id, title, course_id or "thai", json.dumps(items, ensure_ascii=False), now, now))
    return list_custom_decks(cur, user_id)


def list_custom_decks(cur, user_id: str):
    rows = cur.execute("SELECT * FROM custom_decks WHERE user_id = ? ORDER BY updated_at DESC", (user_id,)).fetchall()
    out = []
    for r in rows:
        d = dict(r)
        try:
            d["items"] = json.loads(d.get("items_json") or "[]")
        except Exception:
            d["items"] = []
        out.append(d)
    return out


def delete_custom_deck(cur, user_id: str, deck_id: str):
    cur.execute("DELETE FROM custom_decks WHERE id = ? AND user_id = ?", (deck_id, user_id))
    return list_custom_decks(cur, user_id)


# =========================================================
# PHASE 5C: MASCOT CUSTOMIZATION & TOPIC PREFERENCES
# =========================================================

def get_user_preferences(cur, user_id: str):
    row = cur.execute("SELECT * FROM user_preferences WHERE user_id = ?", (user_id,)).fetchone()
    if not row:
        return {
            "user_id": user_id,
            "mascot_outfit": "default",
            "mascot_accessory": "none",
            "mascot_mood": "happy",
            "favorite_topics": [],
            "catalog": MASCOT_ITEMS,
            "available_topics": AVAILABLE_TOPICS,
        }
    d = dict(row)
    try:
        topics = json.loads(d.get("favorite_topics_json") or "[]")
    except Exception:
        topics = []
    return {
        "user_id": user_id,
        "mascot_outfit": d["mascot_outfit"],
        "mascot_accessory": d["mascot_accessory"],
        "mascot_mood": d["mascot_mood"],
        "favorite_topics": topics,
        "catalog": MASCOT_ITEMS,
        "available_topics": AVAILABLE_TOPICS,
    }


def save_user_preferences(cur, user_id: str, mascot_outfit: str = None, mascot_accessory: str = None, mascot_mood: str = None, favorite_topics: list = None, learning_goal: str = None):
    cur_prefs = get_user_preferences(cur, user_id)
    outfit = mascot_outfit if mascot_outfit is not None else cur_prefs["mascot_outfit"]
    acc = mascot_accessory if mascot_accessory is not None else cur_prefs["mascot_accessory"]
    mood = mascot_mood if mascot_mood is not None else cur_prefs["mascot_mood"]
    topics = favorite_topics if favorite_topics is not None else cur_prefs["favorite_topics"]
    cur.execute("""
        INSERT OR REPLACE INTO user_preferences (user_id, mascot_outfit, mascot_accessory, mascot_mood, favorite_topics_json, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, outfit, acc, mood, json.dumps(topics), _utc_now()))
    if learning_goal is not None:
        cur.execute("UPDATE users SET learning_goal = ?, updated_at = ? WHERE id = ?", (learning_goal.strip(), _utc_now(), user_id))
    return get_user_preferences(cur, user_id)


# =========================================================
# PHASE 5D: SOCIAL (LEADERBOARD OPT-OUT, NOTES/CHEERS, PEER PRACTICE)
# =========================================================

def get_social_profile(cur, user_id: str):
    row = cur.execute("SELECT * FROM social_profiles WHERE user_id = ?", (user_id,)).fetchone()
    if not row:
        return {"user_id": user_id, "leaderboard_opt_out": False, "group_id": "global"}
    return {"user_id": user_id, "leaderboard_opt_out": bool(row["leaderboard_opt_out"]), "group_id": row["group_id"]}


def update_social_profile(cur, user_id: str, leaderboard_opt_out: bool, group_id: str = "global"):
    cur.execute("""
        INSERT OR REPLACE INTO social_profiles (user_id, leaderboard_opt_out, group_id, updated_at)
        VALUES (?, ?, ?, ?)
    """, (user_id, 1 if leaderboard_opt_out else 0, group_id or "global", _utc_now()))
    return get_social_profile(cur, user_id)


def get_leaderboard(cur, group_id: str = "global", period: str = "all"):
    """Returns ONLY name and XP for opted-in students."""
    date_filter = ""
    params = [group_id or "global"]
    if period == "weekly":
        week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")
        date_filter = "AND x.created_at >= ?"
        params.append(week_ago)

    sql = f"""
        SELECT u.name AS name, COALESCE(SUM(x.xp), 0) AS xp
        FROM users u
        LEFT JOIN social_profiles sp ON sp.user_id = u.id
        LEFT JOIN user_xp_events x ON x.user_id = u.id {date_filter}
        WHERE u.role = 'student' AND u.is_deleted = 0
          AND COALESCE(sp.leaderboard_opt_out, 0) = 0
          AND COALESCE(sp.group_id, 'global') = ?
        GROUP BY u.id, u.name
        ORDER BY xp DESC, u.name ASC
        LIMIT 25
    """
    if period == "weekly":
        # Reorder params: date_filter is before group_id in SQL
        params = [week_ago, group_id or "global"]
    return [dict(r) for r in cur.execute(sql, params).fetchall()]


def list_study_notes(cur, group_id: str = "global"):
    return [dict(r) for r in cur.execute("""
        SELECT id, user_id, author_name, group_id, content, cheers_count, created_at
        FROM study_notes
        WHERE group_id = ? AND is_hidden = 0 AND removed_by_teacher = 0
        ORDER BY created_at DESC LIMIT 50
    """, (group_id or "global",)).fetchall()]


def create_study_note(cur, user_id: str, author_name: str, content: str, group_id: str = "global"):
    content = (content or "").strip()
    if not content:
        raise ValueError("Note content cannot be empty.")
    cur.execute("""
        INSERT INTO study_notes (id, user_id, author_name, group_id, content, cheers_count, is_hidden, removed_by_teacher, created_at)
        VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?)
    """, (str(uuid.uuid4()), user_id, author_name, group_id or "global", content[:400], _utc_now()))
    return list_study_notes(cur, group_id)


def cheer_study_note(cur, user_id: str, note_id: str, reaction: str = "👏"):
    res = cur.execute("""
        INSERT OR IGNORE INTO note_cheers (id, note_id, user_id, reaction, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (str(uuid.uuid4()), note_id, user_id, reaction or "👏", _utc_now()))
    if res.rowcount > 0:
        cur.execute("UPDATE study_notes SET cheers_count = cheers_count + 1 WHERE id = ?", (note_id,))
    return {"ok": True}


def report_or_hide_note(cur, user_id: str, note_id: str, action: str = "report", reason: str = "", is_staff: bool = False):
    if action == "teacher_remove" and is_staff:
        cur.execute("UPDATE study_notes SET removed_by_teacher = 1 WHERE id = ?", (note_id,))
    elif action == "hide":
        cur.execute("UPDATE study_notes SET is_hidden = 1 WHERE id = ? AND user_id = ?", (note_id, user_id))
    else:
        cur.execute("""
            INSERT OR IGNORE INTO note_reports (id, note_id, reporter_id, reason, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (str(uuid.uuid4()), note_id, user_id, (reason or "").strip(), _utc_now()))
        cnt = cur.execute("SELECT COUNT(*) AS c FROM note_reports WHERE note_id = ?", (note_id,)).fetchone()["c"]
        if cnt >= 2:
            cur.execute("UPDATE study_notes SET is_hidden = 1 WHERE id = ?", (note_id,))
    return {"ok": True}


def list_peer_practice(cur, group_id: str = "global"):
    rows = cur.execute("""
        SELECT * FROM peer_practice_sessions WHERE group_id = ? ORDER BY updated_at DESC LIMIT 30
    """, (group_id or "global",)).fetchall()
    out = []
    for r in rows:
        d = dict(r)
        try:
            d["messages"] = json.loads(d.get("messages_json") or "[]")
        except Exception:
            d["messages"] = []
        out.append(d)
    return out


def create_peer_practice(cur, user_id: str, user_name: str, topic: str, mode: str = "text", group_id: str = "global"):
    now = _utc_now()
    sid = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO peer_practice_sessions (id, group_id, creator_id, creator_name, topic, mode, messages_json, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, '[]', 'open', ?, ?)
    """, (sid, group_id or "global", user_id, user_name, topic or "Daily Conversation", mode if mode in ("text", "audio") else "text", now, now))
    return list_peer_practice(cur, group_id)


def join_or_message_peer_practice(cur, user_id: str, user_name: str, session_id: str, message: str = ""):
    row = cur.execute("SELECT * FROM peer_practice_sessions WHERE id = ?", (session_id,)).fetchone()
    if not row:
        raise ValueError("Practice session not found.")
    msgs = json.loads(row["messages_json"] or "[]")
    partner_id = row["partner_id"]
    partner_name = row["partner_name"]
    status = row["status"]
    if row["creator_id"] != user_id and not partner_id:
        partner_id = user_id
        partner_name = user_name
        status = "active"
    if message and message.strip():
        msgs.append({"sender_id": user_id, "sender_name": user_name, "text": message.strip()[:300], "at": _utc_now()})
    cur.execute("""
        UPDATE peer_practice_sessions SET partner_id = ?, partner_name = ?, status = ?, messages_json = ?, updated_at = ?
        WHERE id = ?
    """, (partner_id, partner_name, status, json.dumps(msgs, ensure_ascii=False), _utc_now(), session_id))
    return list_peer_practice(cur, row["group_id"])
