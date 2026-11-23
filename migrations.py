"""
Speako Languages — Database Migrations

Idempotent, versioned SQLite schema migrations.
Never drops or rewrites existing data.
"""
import json
from datetime import datetime, timezone


def _utc_now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


DEFAULT_FLAGS = {
    "MINDMAP_5A": False,
    "MINDMAP_5B": False,
    "MINDMAP_5C": False,
    "MINDMAP_5D_SOCIAL": False,
    "CAMPAIGNS_SCHEDULER": False,
    "CAMPAIGNS_DRY_RUN": True,
    "CAMPAIGNS_KILL_SWITCH": True,
    "MARKETING_EMAIL_SENDING": False,
}


def _ensure_migrations_table(cur):
    cur.execute("""
    CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
    )""")


def _ensure_flags_table(cur):
    cur.execute("""
    CREATE TABLE IF NOT EXISTS feature_flags (
        key TEXT PRIMARY KEY,
        enabled INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
    )""")
    now = _utc_now()
    for k, default_val in DEFAULT_FLAGS.items():
        cur.execute(
            "INSERT OR IGNORE INTO feature_flags (key, enabled, updated_at) VALUES (?, ?, ?)",
            (k, 1 if default_val else 0, now),
        )


def _m001_mindmap_5a(cur):
    """Phase 5a: Word Vault, Daily Speaking Streaks, Stars/XP & Milestone Badges."""
    cur.execute("""
    CREATE TABLE IF NOT EXISTS word_vault (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        course_id TEXT NOT NULL,
        lesson_number INTEGER NOT NULL DEFAULT 1,
        phrase TEXT NOT NULL,
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        UNIQUE(user_id, course_id, phrase)
    )""")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS user_activity_days (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        activity_date TEXT NOT NULL,
        activity_type TEXT NOT NULL,
        ref_id TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        UNIQUE(user_id, activity_date, activity_type, ref_id)
    )""")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS user_streaks (
        user_id TEXT PRIMARY KEY,
        current_streak INTEGER NOT NULL DEFAULT 0,
        longest_streak INTEGER NOT NULL DEFAULT 0,
        last_active_date TEXT DEFAULT '',
        timezone TEXT DEFAULT 'Asia/Bangkok',
        updated_at TEXT NOT NULL
    )""")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS user_xp_events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        event_key TEXT NOT NULL,
        event_type TEXT NOT NULL,
        stars INTEGER NOT NULL DEFAULT 0,
        xp INTEGER NOT NULL DEFAULT 0,
        description TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        UNIQUE(user_id, event_key)
    )""")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS user_badges (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        badge_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT DEFAULT '🏅',
        earned_at TEXT NOT NULL,
        UNIQUE(user_id, badge_id)
    )""")


def _m002_mindmap_5b(cur):
    """Phase 5b: Voice Recordings, Best Scores, Custom Phrase Decks."""
    cur.execute("""
    CREATE TABLE IF NOT EXISTS voice_recordings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        course_id TEXT NOT NULL DEFAULT 'thai',
        lesson_number INTEGER NOT NULL DEFAULT 1,
        phrase TEXT NOT NULL,
        mime_type TEXT NOT NULL DEFAULT 'audio/webm',
        audio_b64 TEXT NOT NULL,
        byte_size INTEGER NOT NULL DEFAULT 0,
        duration_ms INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
    )""")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS phrase_scores (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        course_id TEXT NOT NULL,
        phrase TEXT NOT NULL,
        best_score REAL NOT NULL DEFAULT 0,
        last_score REAL NOT NULL DEFAULT 0,
        attempts INTEGER NOT NULL DEFAULT 0,
        improved INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL,
        UNIQUE(user_id, course_id, phrase)
    )""")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS custom_decks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        course_id TEXT NOT NULL DEFAULT 'thai',
        items_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )""")


def _m003_mindmap_5c(cur):
    """Phase 5c: Mascot Customization & Favorite Topics."""
    cur.execute("""
    CREATE TABLE IF NOT EXISTS user_preferences (
        user_id TEXT PRIMARY KEY,
        mascot_outfit TEXT NOT NULL DEFAULT 'default',
        mascot_accessory TEXT NOT NULL DEFAULT 'none',
        mascot_mood TEXT NOT NULL DEFAULT 'happy',
        favorite_topics_json TEXT NOT NULL DEFAULT '[]',
        updated_at TEXT NOT NULL
    )""")


def _m004_mindmap_5d_social(cur):
    """Phase 5d: Social (Leaderboards opt-out, Cheers/Study Notes with moderation, Peer Practice)."""
    cur.execute("""
    CREATE TABLE IF NOT EXISTS social_profiles (
        user_id TEXT PRIMARY KEY,
        leaderboard_opt_out INTEGER NOT NULL DEFAULT 0,
        group_id TEXT NOT NULL DEFAULT 'global',
        updated_at TEXT NOT NULL
    )""")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS study_notes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        author_name TEXT NOT NULL,
        group_id TEXT NOT NULL DEFAULT 'global',
        content TEXT NOT NULL,
        cheers_count INTEGER NOT NULL DEFAULT 0,
        is_hidden INTEGER NOT NULL DEFAULT 0,
        removed_by_teacher INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
    )""")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS note_cheers (
        id TEXT PRIMARY KEY,
        note_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        reaction TEXT NOT NULL DEFAULT '👏',
        created_at TEXT NOT NULL,
        UNIQUE(note_id, user_id)
    )""")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS note_reports (
        id TEXT PRIMARY KEY,
        note_id TEXT NOT NULL,
        reporter_id TEXT NOT NULL,
        reason TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        UNIQUE(note_id, reporter_id)
    )""")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS peer_practice_sessions (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL DEFAULT 'global',
        creator_id TEXT NOT NULL,
        creator_name TEXT NOT NULL,
        partner_id TEXT DEFAULT '',
        partner_name TEXT DEFAULT '',
        topic TEXT NOT NULL DEFAULT 'Daily Conversation',
        mode TEXT NOT NULL DEFAULT 'text',
        messages_json TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'open',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )""")


def _m005_campaigns_and_promotions(cur):
    """Part 2: Self-running Campaigns & Promotions + Safeguards + Logs + Marketing Opt-in."""
    ucols = [r["name"] for r in cur.execute("PRAGMA table_info(users)").fetchall()]
    if "marketing_opt_in" not in ucols:
        cur.execute("ALTER TABLE users ADD COLUMN marketing_opt_in INTEGER DEFAULT 0")
    if "unsubscribe_token" not in ucols:
        cur.execute("ALTER TABLE users ADD COLUMN unsubscribe_token TEXT DEFAULT ''")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        campaign_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        start_at TEXT NOT NULL,
        end_at TEXT NOT NULL DEFAULT '',
        timezone TEXT NOT NULL DEFAULT 'Asia/Bangkok',
        description TEXT NOT NULL DEFAULT '',
        config_json TEXT NOT NULL DEFAULT '{}',
        banner_text TEXT DEFAULT '',
        discount_percent REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )""")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS campaign_run_logs (
        id TEXT PRIMARY KEY,
        started_at TEXT NOT NULL,
        dry_run INTEGER NOT NULL DEFAULT 1,
        kill_switch INTEGER NOT NULL DEFAULT 1,
        changes_json TEXT NOT NULL DEFAULT '[]',
        skips_json TEXT NOT NULL DEFAULT '[]',
        errors_json TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'ok'
    )""")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS checkout_quotes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        package_id TEXT NOT NULL,
        campaign_id TEXT DEFAULT '',
        original_price INTEGER NOT NULL,
        quoted_price INTEGER NOT NULL,
        discount_percent REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
    )""")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS campaign_email_logs (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        email TEXT NOT NULL,
        sent_at TEXT NOT NULL,
        UNIQUE(campaign_id, user_id)
    )""")

    # Seed initial campaign definitions from pricing.md / SPEAKO_PRICING_STANDARDS.md as 'draft' (inactive)
    now = _utc_now()
    seed_campaigns = [
        (
            "camp-launch-starter-17",
            "Starter 17% Launch Offer",
            "launch_offer",
            "draft",
            "2026-12-01T00:00:00",
            "2026-12-31T23:59:59",
            "17% off 8-lesson packages (Launch Offer).",
            json.dumps({"package_ids": ["thai-8", "english-8"], "discount_percent": 17}),
            "Launch Offer: Save 17% on 8-Lesson Starter Packages!",
            17.0,
        ),
        (
            "camp-songkran-25",
            "Songkran Travel Ready Festival",
            "price_promotion",
            "draft",
            "2027-04-10T00:00:00",
            "2027-04-16T23:59:59",
            "25% off 8 & 16-lesson packages for Songkran.",
            json.dumps({"package_ids": ["thai-8", "thai-16", "english-8", "english-16"], "discount_percent": 25}),
            "Songkran Special: 25% off all 1-on-1 lesson packages!",
            25.0,
        ),
        (
            "camp-banner-trial",
            "Free Trial Weekend Banner",
            "homepage_banner",
            "draft",
            "2026-12-05T00:00:00",
            "2026-12-06T23:59:59",
            "Homepage banner highlighting free 1-on-1 trial lessons.",
            json.dumps({"package_ids": [], "discount_percent": 0}),
            "Weekend Special: Book your Free 1-on-1 Thai or English Trial today!",
            0.0,
        ),
    ]
    for cid, name, ctype, status, start_at, end_at, desc, cfg, banner, disc in seed_campaigns:
        cur.execute("""
            INSERT OR IGNORE INTO campaigns
            (id, name, campaign_type, status, start_at, end_at, timezone, description, config_json, banner_text, discount_percent, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'Asia/Bangkok', ?, ?, ?, ?, ?, ?)
        """, (cid, name, ctype, status, start_at, end_at, desc, cfg, banner, disc, now, now))


MIGRATIONS = [
    ("001_mindmap_5a", "Phase 5a: Word Vault, Streaks, XP & Badges", _m001_mindmap_5a),
    ("002_mindmap_5b", "Phase 5b: Voice Recording, Best Scores, Custom Decks", _m002_mindmap_5b),
    ("003_mindmap_5c", "Phase 5c: Mascot Customization & Favorite Topics", _m003_mindmap_5c),
    ("004_mindmap_5d_social", "Phase 5d: Social Leaderboards, Notes, Cheers, Practice", _m004_mindmap_5d_social),
    ("005_campaigns_and_promotions", "Part 2: Campaigns, Safeguards, Logs & Checkout Quotes", _m005_campaigns_and_promotions),
]


def run_migrations(conn):
    cur = conn.cursor()
    _ensure_migrations_table(cur)
    _ensure_flags_table(cur)
    applied = {r["id"] for r in cur.execute("SELECT id FROM schema_migrations").fetchall()}
    for mid, mname, fn in MIGRATIONS:
        if mid not in applied:
            fn(cur)
            cur.execute(
                "INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?)",
                (mid, mname, _utc_now()),
            )
    conn.commit()


def get_flags(cur):
    rows = cur.execute("SELECT key, enabled FROM feature_flags").fetchall()
    flags = dict(DEFAULT_FLAGS)
    for r in rows:
        flags[r["key"]] = bool(r["enabled"])
    return flags


def set_flag(cur, key, enabled):
    if key not in DEFAULT_FLAGS:
        raise ValueError(f"Unknown feature flag: {key}")
    cur.execute(
        "INSERT OR REPLACE INTO feature_flags (key, enabled, updated_at) VALUES (?, ?, ?)",
        (key, 1 if enabled else 0, _utc_now()),
    )
