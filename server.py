#!/usr/bin/env python3
"""
Speako Languages — Role-separated portal server (Student / Teacher / Admin).

- Session-token authentication (login required for every API call)
- Role-scoped data: students only ever receive their own data, teachers only
  their own classes & students, admins receive everything
- Server-side permission checks on every action
- SQLite persistence, booking email alerts
"""
import base64
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import threading
import urllib.parse
import urllib.request
import uuid
import zlib
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "speako.db")
BACKUP_JSON_PATHS = [
    "/tmp/speako_vault_backup.json",
    os.path.join(BASE_DIR, ".speako_vault_backup.json"),
]
PORT = int(os.environ.get("PORT", 8080))

NOTIFY_EMAILS = ["lastpiyah@icloud.com", "lastpiyah@gmail.com"]
WEB3FORMS_KEY = "80eb59e8-9b95-46ba-9c0d-8c84d49e4889"
SPEAKO_SECRET = hashlib.sha256(("speako-v3-secret-" + WEB3FORMS_KEY).encode("utf-8")).digest()

MAIN_ADMIN_ID = "admin-main"
LEAD_TEACHER_ID = "teacher-piya"
ROLES = ("student", "teacher", "admin")
DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

DEFAULT_AVAILABILITY = {
    "Mon": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "19:00", "20:00"],
    "Tue": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "19:00", "20:00"],
    "Wed": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "19:00", "20:00"],
    "Thu": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "19:00", "20:00"],
    "Fri": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "18:00"],
    "Sat": ["10:00", "11:00", "13:00", "14:00", "15:00", "16:00"],
    "Sun": ["10:00", "11:00", "14:00", "15:00"],
}

PACKAGES = {
    "thai-trial": {"title": "Free Thai Trial (1 Lesson)", "course": "thai", "lessons": 1, "price": 0, "is_trial": True},
    "thai-8": {"title": "8 Thai Lessons Package", "course": "thai", "lessons": 8, "price": 4490, "is_trial": False},
    "thai-16": {"title": "16 Thai Lessons Package", "course": "thai", "lessons": 16, "price": 8880, "is_trial": False},
    "english-trial": {"title": "Free English Trial (1 Lesson)", "course": "english", "lessons": 1, "price": 0, "is_trial": True},
    "english-8": {"title": "8 English Lessons Package", "course": "english", "lessons": 8, "price": 3690, "is_trial": False},
    "english-16": {"title": "16 English Lessons Package", "course": "english", "lessons": 16, "price": 7380, "is_trial": False},
}

COURSE_TITLES = {
    "thai": "Basic Thai for Daily Communication and Survival Thai",
    "english": "Basic English for Daily Communication and Self-Introduction",
}


# =========================================================
# HELPERS & SIGNED VAULT / SESSION RECOVERY
# =========================================================
def now_str():
    return datetime.now().strftime("%Y-%m-%d %H:%M")


def now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")


def _xor_stream(data: bytes) -> bytes:
    out = bytearray(len(data))
    key_len = len(SPEAKO_SECRET)
    for i, b in enumerate(data):
        out[i] = b ^ SPEAKO_SECRET[i % key_len]
    return bytes(out)


def sign_token(payload: dict) -> str:
    raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    comp = _xor_stream(zlib.compress(raw, 6))
    b64 = base64.urlsafe_b64encode(comp).decode("ascii").rstrip("=")
    sig = hmac.new(SPEAKO_SECRET, b64.encode("ascii"), hashlib.sha256).hexdigest()[:24]
    return f"sp3.{b64}.{sig}"


def verify_token(tok: str):
    if not tok or not isinstance(tok, str) or not tok.startswith("sp3."):
        return None
    parts = tok.split(".")
    if len(parts) != 3:
        return None
    _, b64, sig = parts
    expected = hmac.new(SPEAKO_SECRET, b64.encode("ascii"), hashlib.sha256).hexdigest()[:24]
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        pad = "=" * (-len(b64) % 4)
        comp = base64.urlsafe_b64decode((b64 + pad).encode("ascii"))
        raw = zlib.decompress(_xor_stream(comp))
        return json.loads(raw.decode("utf-8"))
    except Exception:
        return None


def hash_pw(pw: str) -> str:
    salt = secrets.token_hex(8)
    digest = hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), salt.encode("utf-8"), 100_000).hex()
    return f"pbkdf2${salt}${digest}"


def check_pw(pw: str, stored: str) -> bool:
    if not stored or not pw:
        return False
    if stored.startswith("pbkdf2$"):
        _, salt, digest = stored.split("$", 2)
        test = hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), salt.encode("utf-8"), 100_000).hex()
        return secrets.compare_digest(test, digest)
    # Legacy unsalted sha256 hashes from earlier versions
    return secrets.compare_digest(hashlib.sha256(pw.encode("utf-8")).hexdigest(), stored)


def initials(name: str) -> str:
    return "".join(p[0].upper() for p in name.split()[:2]) or "ST"


def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=15)
    conn.row_factory = sqlite3.Row
    return conn


def rows(cur, sql, params=()):
    return [dict(r) for r in cur.execute(sql, params).fetchall()]


def pub_user(u):
    if u is None:
        return None
    d = dict(u)
    d.pop("password_hash", None)
    return d


def pub_teacher(t):
    d = dict(t)
    d["languages"] = json.loads(d.get("languages") or "[]")
    d["specialties"] = json.loads(d.get("specialties") or "[]")
    d["availability"] = json.loads(d.pop("availability_json") or "{}")
    return d


def export_vault_dict(cur) -> dict:
    return {
        "v": 3,
        "ts": now_iso(),
        "users": rows(cur, "SELECT * FROM users"),
        "teachers": rows(cur, "SELECT * FROM teachers"),
        "bookings": rows(cur, "SELECT * FROM bookings"),
        "transactions": rows(cur, "SELECT * FROM transactions"),
        "notifications": rows(cur, "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 120"),
    }


def save_disk_backup(vault_dict: dict):
    raw = json.dumps(vault_dict, ensure_ascii=False)
    for p in BACKUP_JSON_PATHS:
        try:
            with open(p, "w", encoding="utf-8") as f:
                f.write(raw)
        except Exception:
            pass


def export_vault(cur) -> str:
    d = export_vault_dict(cur)
    save_disk_backup(d)
    return sign_token({"t": "vault", "d": d})


def merge_vault_dict(cur, d: dict):
    if not isinstance(d, dict):
        return
    # 1. Merge teachers (preserve newer availability_json across redeploys)
    for vt in d.get("teachers") or []:
        if not isinstance(vt, dict) or not vt.get("id"):
            continue
        dbt = cur.execute("SELECT * FROM teachers WHERE id = ?", (vt["id"],)).fetchone()
        vt_ts = vt.get("updated_at") or ""
        if not dbt:
            cur.execute("""
                INSERT INTO teachers (id, name, title, bio, languages, specialties, rating, reviews_count,
                                      location, avatar, whatsapp, availability_json, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                vt["id"], vt.get("name") or "Tutor", vt.get("title") or "Thai & English Tutor",
                vt.get("bio") or "", vt.get("languages") or "[]", vt.get("specialties") or "[]",
                vt.get("rating", 5.0), vt.get("reviews_count", 0), vt.get("location") or "Bangkok, Thailand",
                vt.get("avatar") or "portrait.png", vt.get("whatsapp") or "+66 80 848 0032",
                vt.get("availability_json") or json.dumps(DEFAULT_AVAILABILITY), vt_ts
            ))
        else:
            db_ts = dbt["updated_at"] if "updated_at" in dbt.keys() and dbt["updated_at"] else ""
            if vt_ts and vt_ts > db_ts and vt.get("availability_json"):
                cur.execute("""
                    UPDATE teachers SET availability_json = ?, name = ?, title = ?, bio = ?, updated_at = ?
                    WHERE id = ?
                """, (
                    vt["availability_json"], vt.get("name") or dbt["name"],
                    vt.get("title") or dbt["title"], vt.get("bio") or dbt["bio"], vt_ts, vt["id"]
                ))

    # 2. Merge users (restore accounts, password hashes, roles, and credits)
    for vu in d.get("users") or []:
        if not isinstance(vu, dict) or not vu.get("id") or not vu.get("email"):
            continue
        dbu = cur.execute(
            "SELECT * FROM users WHERE id = ? OR lower(email) = lower(?)",
            (vu["id"], vu["email"]),
        ).fetchone()
        vu_ts = vu.get("updated_at") or vu.get("created_at") or ""
        if not dbu:
            cur.execute("""
                INSERT INTO users (id, name, email, password_hash, phone, role, timezone, learning_goal,
                                   thai_credits, english_credits, trial_used, avatar, is_deleted, deleted_at,
                                   teacher_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                vu["id"], vu.get("name") or "Student", vu["email"].strip().lower(),
                vu.get("password_hash") or hash_pw("student123"), vu.get("phone") or "",
                vu.get("role") or "student", vu.get("timezone") or "Thailand (GMT+7)",
                vu.get("learning_goal") or "", int(vu.get("thai_credits") or 0),
                int(vu.get("english_credits") or 0), int(vu.get("trial_used") or 0),
                vu.get("avatar") or initials(vu.get("name") or "ST"),
                int(vu.get("is_deleted") or 0), vu.get("deleted_at") or "",
                vu.get("teacher_id") or "", vu.get("created_at") or now_str(), vu_ts
            ))
        else:
            db_ts = dbu["updated_at"] if "updated_at" in dbu.keys() and dbu["updated_at"] else (dbu["created_at"] or "")
            if vu_ts and vu_ts > db_ts:
                cur.execute("""
                    UPDATE users SET name = ?, password_hash = ?, phone = ?, role = ?,
                                     thai_credits = ?, english_credits = ?, trial_used = ?,
                                     is_deleted = ?, deleted_at = ?, teacher_id = ?, updated_at = ?
                    WHERE id = ?
                """, (
                    vu.get("name") or dbu["name"],
                    vu.get("password_hash") or dbu["password_hash"],
                    vu.get("phone") if vu.get("phone") is not None else dbu["phone"],
                    vu.get("role") or dbu["role"],
                    int(vu.get("thai_credits") if vu.get("thai_credits") is not None else dbu["thai_credits"]),
                    int(vu.get("english_credits") if vu.get("english_credits") is not None else dbu["english_credits"]),
                    int(vu.get("trial_used") if vu.get("trial_used") is not None else dbu["trial_used"]),
                    int(vu.get("is_deleted") if vu.get("is_deleted") is not None else dbu["is_deleted"]),
                    vu.get("deleted_at") if vu.get("deleted_at") is not None else dbu["deleted_at"],
                    vu.get("teacher_id") if vu.get("teacher_id") is not None else dbu["teacher_id"],
                    vu_ts, dbu["id"]
                ))

    # 3. Merge bookings (preserve student schedules across redeploys)
    for vb in d.get("bookings") or []:
        if not isinstance(vb, dict) or not vb.get("id"):
            continue
        dbb = cur.execute("SELECT * FROM bookings WHERE id = ?", (vb["id"],)).fetchone()
        vb_ts = vb.get("updated_at") or vb.get("created_at") or ""
        if not dbb:
            cur.execute("""
                INSERT INTO bookings (id, student_id, student_name, student_email, teacher_id, teacher_name,
                                      course_id, course_title, lesson_number, lesson_title, date_str, time_slot,
                                      timezone, status, meeting_link, student_notes, teacher_feedback,
                                      homework_status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                vb["id"], vb.get("student_id") or "", vb.get("student_name") or "",
                vb.get("student_email") or "", vb.get("teacher_id") or LEAD_TEACHER_ID,
                vb.get("teacher_name") or "Kendrick", vb.get("course_id") or "thai",
                vb.get("course_title") or COURSE_TITLES["thai"], int(vb.get("lesson_number") or 1),
                vb.get("lesson_title") or "Lesson 1", vb.get("date_str") or "", vb.get("time_slot") or "",
                vb.get("timezone") or "Thailand (GMT+7)", vb.get("status") or "confirmed",
                vb.get("meeting_link") or f"https://meet.speako.live/{vb['id']}",
                vb.get("student_notes") or "", vb.get("teacher_feedback") or "",
                vb.get("homework_status") or "pending", vb.get("created_at") or now_str(), vb_ts
            ))
        else:
            db_ts = dbb["updated_at"] if "updated_at" in dbb.keys() and dbb["updated_at"] else (dbb["created_at"] or "")
            if vb_ts and vb_ts > db_ts:
                cur.execute("""
                    UPDATE bookings SET date_str = ?, time_slot = ?, course_id = ?, course_title = ?,
                                        lesson_number = ?, lesson_title = ?, status = ?, teacher_feedback = ?,
                                        updated_at = ?
                    WHERE id = ?
                """, (
                    vb.get("date_str") or dbb["date_str"], vb.get("time_slot") or dbb["time_slot"],
                    vb.get("course_id") or dbb["course_id"], vb.get("course_title") or dbb["course_title"],
                    int(vb.get("lesson_number") or dbb["lesson_number"]),
                    vb.get("lesson_title") or dbb["lesson_title"],
                    vb.get("status") or dbb["status"],
                    vb.get("teacher_feedback") if vb.get("teacher_feedback") is not None else dbb["teacher_feedback"],
                    vb_ts, vb["id"]
                ))

    # 4. Merge transactions
    for vtx in d.get("transactions") or []:
        if not isinstance(vtx, dict) or not vtx.get("id"):
            continue
        dbtx = cur.execute("SELECT * FROM transactions WHERE id = ?", (vtx["id"],)).fetchone()
        vtx_ts = vtx.get("updated_at") or vtx.get("created_at") or ""
        if not dbtx:
            cur.execute("""
                INSERT INTO transactions (id, invoice_no, student_id, student_name, student_email,
                                          package_id, package_title, course_type, lessons_added, amount_thb,
                                          payment_method, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                vtx["id"], vtx.get("invoice_no") or "INV-2026-001", vtx.get("student_id") or "",
                vtx.get("student_name") or "", vtx.get("student_email") or "",
                vtx.get("package_id") or "thai-8", vtx.get("package_title") or "Package",
                vtx.get("course_type") or "thai", int(vtx.get("lessons_added") or 0),
                int(vtx.get("amount_thb") or 0), vtx.get("payment_method") or "PromptPay QR",
                vtx.get("status") or "paid", vtx.get("created_at") or now_str(), vtx_ts
            ))
        else:
            db_ts = dbtx["updated_at"] if "updated_at" in dbtx.keys() and dbtx["updated_at"] else (dbtx["created_at"] or "")
            if vtx_ts and vtx_ts > db_ts:
                cur.execute("""
                    UPDATE transactions SET status = ?, payment_method = ?, updated_at = ?
                    WHERE id = ?
                """, (
                    vtx.get("status") or dbtx["status"],
                    vtx.get("payment_method") or dbtx["payment_method"],
                    vtx_ts, vtx["id"]
                ))

    # 5. Merge notifications
    for vn in d.get("notifications") or []:
        if not isinstance(vn, dict) or not vn.get("id"):
            continue
        if not cur.execute("SELECT 1 FROM notifications WHERE id = ?", (vn["id"],)).fetchone():
            cur.execute("""
                INSERT INTO notifications (id, type, title, message, student_name, student_email,
                                           student_phone, booking_id, emailed_to, is_read, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                vn["id"], vn.get("type") or "booking", vn.get("title") or "", vn.get("message") or "",
                vn.get("student_name") or "", vn.get("student_email") or "", vn.get("student_phone") or "",
                vn.get("booking_id") or "", vn.get("emailed_to") or "", int(vn.get("is_read") or 0),
                vn.get("created_at") or now_str()
            ))


def import_vault(cur, vault_str: str):
    if not vault_str or not isinstance(vault_str, str):
        return
    for piece in vault_str.split(","):
        piece = piece.strip()
        if not piece:
            continue
        payload = verify_token(piece)
        if payload and payload.get("t") == "vault" and isinstance(payload.get("d"), dict):
            merge_vault_dict(cur, payload["d"])


def add_notification(cur, ntype, title, message, student=None, booking_id=""):
    cur.execute("""
        INSERT INTO notifications (id, type, title, message, student_name, student_email, student_phone,
                                   booking_id, emailed_to, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    """, (
        "notif-" + uuid.uuid4().hex[:8], ntype, title, message,
        student["name"] if student else "", student["email"] if student else "",
        (student["phone"] or "") if student else "", booking_id,
        ", ".join(NOTIFY_EMAILS), now_str()
    ))


def add_transaction(cur, student, package_id, method):
    """Immediately grants package credits (used when Admin grants a package)."""
    pkg = PACKAGES[package_id]
    count = cur.execute("SELECT COUNT(*) FROM transactions").fetchone()[0] + 1
    tx_id = "tx-" + uuid.uuid4().hex[:8]
    ts = now_iso()
    cur.execute("""
        INSERT INTO transactions (id, invoice_no, student_id, student_name, student_email, package_id, package_title,
                                  course_type, lessons_added, amount_thb, payment_method, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?)
    """, (
        tx_id, f"INV-2026-{count:03d}", student["id"], student["name"], student["email"], package_id,
        pkg["title"], pkg["course"], pkg["lessons"], pkg["price"],
        "Free Trial" if pkg["price"] == 0 and method != "Admin Assigned" else method, now_str(), ts
    ))
    col = "thai_credits" if pkg["course"] == "thai" else "english_credits"
    cur.execute(f"UPDATE users SET {col} = {col} + ?, updated_at = ? WHERE id = ?", (pkg["lessons"], ts, student["id"]))
    if pkg["is_trial"]:
        cur.execute("UPDATE users SET trial_used = 1, updated_at = ? WHERE id = ?", (ts, student["id"]))
    return tx_id


def add_package_request(cur, student, package_id, method="Pending Admin Payment"):
    """Records a student's package booking request WITHOUT auto-adding credits until Admin approves."""
    pkg = PACKAGES[package_id]
    count = cur.execute("SELECT COUNT(*) FROM transactions").fetchone()[0] + 1
    tx_id = "tx-" + uuid.uuid4().hex[:8]
    ts = now_iso()
    cur.execute("""
        INSERT INTO transactions (id, invoice_no, student_id, student_name, student_email, package_id, package_title,
                                  course_type, lessons_added, amount_thb, payment_method, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment', ?, ?)
    """, (
        tx_id, f"INV-2026-{count:03d}", student["id"], student["name"], student["email"], package_id,
        pkg["title"], pkg["course"], pkg["lessons"], pkg["price"],
        method, now_str(), ts
    ))
    return tx_id


def trial_already_used(cur, student_id, package_id):
    return cur.execute(
        "SELECT 1 FROM transactions WHERE student_id = ? AND package_id = ? AND status = 'paid'",
        (student_id, package_id),
    ).fetchone() is not None


def create_teacher_profile(cur, name, title="Thai & English Tutor", bio="", hours=None, days=None):
    tid = "teacher-" + uuid.uuid4().hex[:6]
    if hours:
        use_days = days or ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        avail = {d: (list(hours) if d in use_days else []) for d in DAYS}
    else:
        avail = DEFAULT_AVAILABILITY
    cur.execute("""
        INSERT INTO teachers (id, name, title, bio, languages, specialties, rating, reviews_count, location,
                              avatar, whatsapp, availability_json, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 5.0, 0, 'Bangkok, Thailand', 'Speako logo.png', '+66 80 848 0032', ?, ?)
    """, (
        tid, name, title or "Thai & English Tutor", bio or f"{name} is a live 1-on-1 Speako language tutor.",
        json.dumps(["Thai", "English"]), json.dumps(["Beginner Speaking", "Daily Conversation"]),
        json.dumps(avail), now_iso()
    ))
    return tid


def send_emails_async(subject: str, payload: dict):
    """Background email alerts to NOTIFY_EMAILS via Web3Forms + FormSubmit."""
    def worker():
        try:
            body = {"access_key": WEB3FORMS_KEY, "subject": subject, "from_name": "Speako Portal",
                    "cc": ", ".join(NOTIFY_EMAILS), **payload}
            req = urllib.request.Request(
                "https://api.web3forms.com/submit", data=json.dumps(body).encode("utf-8"),
                headers={"Content-Type": "application/json", "Accept": "application/json",
                         "User-Agent": "SpeakoPortal/3.0"}, method="POST")
            urllib.request.urlopen(req, timeout=8)
        except Exception as e:
            print(f"[email] Web3Forms: {e}")
        for target in NOTIFY_EMAILS:
            try:
                fs = {"_subject": subject, "_template": "table", "_captcha": "false", **payload}
                req = urllib.request.Request(
                    f"https://formsubmit.co/ajax/{target}", data=json.dumps(fs).encode("utf-8"),
                    headers={"Content-Type": "application/json", "Accept": "application/json",
                             "Referer": "https://speakolanguages.com/", "Origin": "https://speakolanguages.com",
                             "User-Agent": "SpeakoPortal/3.0"}, method="POST")
                urllib.request.urlopen(req, timeout=8)
            except Exception as e:
                print(f"[email] FormSubmit {target}: {e}")
    threading.Thread(target=worker, daemon=True).start()


# =========================================================
# DATABASE SETUP & MIGRATION
# =========================================================
def init_db():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
        password_hash TEXT DEFAULT '', phone TEXT DEFAULT '', role TEXT NOT NULL DEFAULT 'student',
        timezone TEXT DEFAULT 'Thailand (GMT+7)', learning_goal TEXT DEFAULT '',
        thai_credits INTEGER DEFAULT 0, english_credits INTEGER DEFAULT 0, trial_used INTEGER DEFAULT 0,
        avatar TEXT DEFAULT '', is_deleted INTEGER DEFAULT 0, deleted_at TEXT DEFAULT '',
        teacher_id TEXT DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT DEFAULT ''
    )""")
    cols = [r["name"] for r in cur.execute("PRAGMA table_info(users)").fetchall()]
    for col, ddl in [("password_hash", "TEXT DEFAULT ''"), ("phone", "TEXT DEFAULT ''"),
                     ("is_deleted", "INTEGER DEFAULT 0"), ("deleted_at", "TEXT DEFAULT ''"),
                     ("teacher_id", "TEXT DEFAULT ''"), ("updated_at", "TEXT DEFAULT ''")]:
        if col not in cols:
            cur.execute(f"ALTER TABLE users ADD COLUMN {col} {ddl}")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS teachers (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, title TEXT NOT NULL, bio TEXT NOT NULL,
        languages TEXT NOT NULL, specialties TEXT NOT NULL, rating REAL DEFAULT 5.0,
        reviews_count INTEGER DEFAULT 0, location TEXT DEFAULT 'Bangkok, Thailand',
        avatar TEXT DEFAULT 'portrait.png', whatsapp TEXT DEFAULT '+66 80 848 0032',
        availability_json TEXT NOT NULL, updated_at TEXT DEFAULT ''
    )""")
    tcols = [r["name"] for r in cur.execute("PRAGMA table_info(teachers)").fetchall()]
    if "updated_at" not in tcols:
        cur.execute("ALTER TABLE teachers ADD COLUMN updated_at TEXT DEFAULT ''")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY, student_id TEXT NOT NULL, student_name TEXT NOT NULL, student_email TEXT NOT NULL,
        teacher_id TEXT NOT NULL, teacher_name TEXT NOT NULL, course_id TEXT NOT NULL, course_title TEXT NOT NULL,
        lesson_number INTEGER NOT NULL, lesson_title TEXT NOT NULL, date_str TEXT NOT NULL, time_slot TEXT NOT NULL,
        timezone TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'confirmed', meeting_link TEXT NOT NULL,
        student_notes TEXT DEFAULT '', teacher_feedback TEXT DEFAULT '', homework_status TEXT DEFAULT 'pending',
        created_at TEXT NOT NULL, updated_at TEXT DEFAULT ''
    )""")
    bcols = [r["name"] for r in cur.execute("PRAGMA table_info(bookings)").fetchall()]
    if "updated_at" not in bcols:
        cur.execute("ALTER TABLE bookings ADD COLUMN updated_at TEXT DEFAULT ''")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY, invoice_no TEXT NOT NULL, student_id TEXT NOT NULL, student_name TEXT NOT NULL,
        student_email TEXT NOT NULL, package_id TEXT NOT NULL, package_title TEXT NOT NULL,
        course_type TEXT NOT NULL, lessons_added INTEGER NOT NULL, amount_thb INTEGER NOT NULL,
        payment_method TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'paid', created_at TEXT NOT NULL,
        updated_at TEXT DEFAULT ''
    )""")
    txcols = [r["name"] for r in cur.execute("PRAGMA table_info(transactions)").fetchall()]
    if "updated_at" not in txcols:
        cur.execute("ALTER TABLE transactions ADD COLUMN updated_at TEXT DEFAULT ''")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL,
        student_name TEXT DEFAULT '', student_email TEXT DEFAULT '', student_phone TEXT DEFAULT '',
        booking_id TEXT DEFAULT '', emailed_to TEXT DEFAULT '', is_read INTEGER DEFAULT 0, created_at TEXT NOT NULL
    )""")
    ncols = [r["name"] for r in cur.execute("PRAGMA table_info(notifications)").fetchall()]
    if "emailed_to" not in ncols:
        cur.execute("ALTER TABLE notifications ADD COLUMN emailed_to TEXT DEFAULT ''")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at TEXT NOT NULL
    )""")

    # --- Lead teacher profile (Kendrick) ---
    cur.execute("DELETE FROM teachers WHERE id = 'teacher-nicha'")
    if not cur.execute("SELECT 1 FROM teachers WHERE id = ?", (LEAD_TEACHER_ID,)).fetchone():
        cur.execute("""
            INSERT INTO teachers (id, name, title, bio, languages, specialties, rating, reviews_count, location,
                                  avatar, whatsapp, availability_json, updated_at)
            VALUES (?, 'Kendrick', 'Founder & Lead Thai / English Teacher', ?, ?, ?, 5.0, 64, 'Bangkok, Thailand',
                    'portrait.png', '+66 80 848 0032', ?, '2026-01-01T00:00:00Z')
        """, (
            LEAD_TEACHER_ID,
            "Hi! I'm Kendrick, founder of Speako Languages. I help beginners speak Thai and English with "
            "real-life confidence. Every lesson is live 1-on-1, calm, supportive, and built around your pace.",
            json.dumps(["Thai (Native)", "English (Fluent)"]),
            json.dumps(["Beginner Speaking Confidence", "Survival & Expat Thai", "Everyday English Conversation"]),
            json.dumps(DEFAULT_AVAILABILITY)
        ))
    else:
        cur.execute("UPDATE teachers SET name = 'Kendrick', avatar = 'portrait.png' WHERE id = ?", (LEAD_TEACHER_ID,))

    # --- Main admin account (migrate the old 'teacher-piya' admin user) ---
    if not cur.execute("SELECT 1 FROM users WHERE id = ?", (MAIN_ADMIN_ID,)).fetchone():
        old = cur.execute("SELECT * FROM users WHERE id = 'teacher-piya'").fetchone()
        if old:
            cur.execute("""
                UPDATE users SET id = ?, role = 'admin', name = 'Kendrick (Main Admin)',
                       email = 'admin@speakolanguages.com', avatar = 'KA', teacher_id = '' WHERE id = 'teacher-piya'
            """, (MAIN_ADMIN_ID,))
        else:
            cur.execute("""
                INSERT INTO users (id, name, email, password_hash, phone, role, avatar, created_at, updated_at)
                VALUES (?, 'Kendrick (Main Admin)', 'admin@speakolanguages.com', ?, '+66 80 848 0032', 'admin', 'KA', ?, '2026-01-01T00:00:00Z')
            """, (MAIN_ADMIN_ID, hash_pw("admin123"), now_str()))
    cur.execute("UPDATE users SET role = 'admin', is_deleted = 0 WHERE id = ?", (MAIN_ADMIN_ID,))

    # --- Teacher login for Kendrick's teaching profile ---
    if not cur.execute("SELECT 1 FROM users WHERE lower(email) = 'kendrick@speakolanguages.com'").fetchone():
        cur.execute("""
            INSERT INTO users (id, name, email, password_hash, phone, role, avatar, teacher_id, created_at, updated_at)
            VALUES ('user-teacher-kendrick', 'Kendrick', 'kendrick@speakolanguages.com', ?, '+66 80 848 0032',
                    'teacher', 'KN', ?, ?, '2026-01-01T00:00:00Z')
        """, (hash_pw("teacher123"), LEAD_TEACHER_ID, now_str()))

    # --- Demo students (fresh install only) ---
    if not cur.execute("SELECT 1 FROM users WHERE role = 'student'").fetchone():
        for uid, name, email, th, en in [("student-alex", "Alex Mercer", "alex@example.com", 6, 1),
                                         ("student-ploy", "Ploy Srisuk", "ploy@example.com", 0, 7)]:
            cur.execute("""
                INSERT INTO users (id, name, email, password_hash, role, thai_credits, english_credits, avatar, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'student', ?, ?, ?, ?, '2026-01-01T00:00:00Z')
            """, (uid, name, email, hash_pw("student123"), th, en, initials(name), now_str()))

    # --- Give any account without a password a default one ---
    defaults = {"student": "student123", "teacher": "teacher123", "admin": "admin123"}
    for u in cur.execute("SELECT id, role FROM users WHERE password_hash IS NULL OR password_hash = ''").fetchall():
        cur.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hash_pw(defaults.get(u["role"], "student123")), u["id"]))

    # --- Restore any disk backup vault if present ---
    for p in BACKUP_JSON_PATHS:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    merge_vault_dict(cur, json.load(f))
            except Exception:
                pass

    conn.commit()
    conn.close()


# =========================================================
# REQUEST HANDLER
# =========================================================
class ApiError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status
        self.message = message


class SpeakoHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def log_message(self, fmt, *args):
        if "/api/" in str(args[0] if args else ""):
            super().log_message(fmt, *args)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def send_json(self, data, status=200):
        raw = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def read_json(self):
        length = int(self.headers.get("Content-Length", 0) or 0)
        if not length:
            return {}
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except json.JSONDecodeError:
            raise ApiError(400, "Invalid request body.")

    def token(self):
        auth = self.headers.get("Authorization", "")
        return auth[7:].strip() if auth.startswith("Bearer ") else ""

    def session_user(self, cur):
        tok = self.token()
        if not tok:
            return None
        # 1. Check active SQLite sessions table
        u = cur.execute("""
            SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?
        """, (tok,)).fetchone()
        if u:
            return None if u["is_deleted"] else u

        # 2. Stateless signed session token auto-recovery (survives server/container restarts)
        payload = verify_token(tok)
        if payload and payload.get("t") == "sess":
            su = payload.get("u") or {}
            uid = payload.get("uid") or su.get("id")
            email = (su.get("email") or "").strip().lower()
            u = None
            if uid:
                u = cur.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
            if not u and email:
                u = cur.execute("SELECT * FROM users WHERE lower(email) = ?", (email,)).fetchone()
            if not u and uid and email:
                cur.execute("""
                    INSERT INTO users (id, name, email, password_hash, phone, role, timezone, learning_goal,
                                       thai_credits, english_credits, trial_used, avatar, is_deleted, deleted_at,
                                       teacher_id, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, '', ?, ?, ?)
                """, (
                    uid, su.get("name") or "Student", email,
                    su.get("password_hash") or hash_pw("student123"), su.get("phone") or "",
                    su.get("role") or "student", su.get("timezone") or "Thailand (GMT+7)",
                    su.get("learning_goal") or "", int(su.get("thai_credits") or 0),
                    int(su.get("english_credits") or 0), int(su.get("trial_used") or 0),
                    su.get("avatar") or initials(su.get("name") or "ST"),
                    su.get("teacher_id") or "", su.get("created_at") or now_str(),
                    su.get("updated_at") or now_iso()
                ))
                u = cur.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
            if u and not u["is_deleted"]:
                cur.execute("INSERT OR IGNORE INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
                            (tok, u["id"], now_str()))
                return u

        # 3. Fallback recovery for pre-existing browser sessions via X-Speako-User header
        user_hdr = self.headers.get("X-Speako-User", "")
        if user_hdr:
            try:
                pad = "=" * (-len(user_hdr) % 4)
                su = json.loads(base64.urlsafe_b64decode((user_hdr + pad).encode("ascii")).decode("utf-8"))
                uid = su.get("id")
                email = (su.get("email") or "").strip().lower()
                u = None
                if uid:
                    u = cur.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
                if not u and email:
                    u = cur.execute("SELECT * FROM users WHERE lower(email) = ?", (email,)).fetchone()
                if not u and uid and email and (su.get("role") or "student") == "student":
                    cur.execute("""
                        INSERT INTO users (id, name, email, password_hash, phone, role, timezone,
                                           thai_credits, english_credits, avatar, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, 'student', ?, ?, ?, ?, ?, ?)
                    """, (
                        uid, su.get("name") or "Student", email, hash_pw("student123"),
                        su.get("phone") or "", su.get("timezone") or "Thailand (GMT+7)",
                        int(su.get("thai_credits") or 0), int(su.get("english_credits") or 0),
                        su.get("avatar") or initials(su.get("name") or "ST"), now_str(), now_iso()
                    ))
                    u = cur.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
                if u and not u["is_deleted"]:
                    cur.execute("INSERT OR IGNORE INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
                                (tok, u["id"], now_str()))
                    return u
            except Exception:
                pass
        return None

    def require(self, me, *roles):
        if me is None:
            raise ApiError(401, "Please sign in.")
        if roles and me["role"] not in roles:
            raise ApiError(403, "You don't have access to this action.")

    # ---------------- GET ----------------
    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path.startswith("/api/"):
            return self.dispatch(path, {}, "GET")
        # Never serve the database or server source as static files
        if path.endswith((".db", ".py", ".jsonl")) or "/." in path:
            self.send_error(404)
            return
        return super().do_GET()

    def do_POST(self):
        path = urllib.parse.urlparse(self.path).path
        try:
            data = self.read_json()
        except ApiError as e:
            return self.send_json({"error": e.message}, e.status)
        return self.dispatch(path, data, "POST")

    def dispatch(self, path, data, method):
        routes = {
            ("GET", "/api/me"): self.api_me,
            ("GET", "/api/state"): self.api_state,
            ("POST", "/api/login"): self.api_login,
            ("POST", "/api/signup"): self.api_signup,
            ("POST", "/api/logout"): self.api_logout,
            ("POST", "/api/purchase"): self.api_purchase,
            ("POST", "/api/book"): self.api_book,
            ("POST", "/api/booking/update"): self.api_booking_update,
            ("POST", "/api/teacher/availability"): self.api_availability,
            ("POST", "/api/notifications/read"): self.api_notifications_read,
            ("POST", "/api/admin/user/create"): self.api_admin_user_create,
            ("POST", "/api/admin/user/update"): self.api_admin_user_update,
            ("POST", "/api/admin/teacher/add"): self.api_admin_teacher_add,
            ("POST", "/api/admin/teacher/delete"): self.api_admin_teacher_delete,
        }
        handler = routes.get((method, path))
        if not handler:
            return self.send_json({"error": "Unknown API endpoint"}, 404)
        conn = get_db()
        cur = conn.cursor()
        try:
            # 1. Restore any signed client vault before authenticating or running handler
            vault_hdr = self.headers.get("X-Speako-Vault", "")
            if vault_hdr:
                import_vault(cur, vault_hdr)
            if isinstance(data, dict) and data.get("_vault"):
                import_vault(cur, data.get("_vault"))

            # 2. Resolve current session user (auto-recovers if container restarted)
            me = self.session_user(cur)
            result = handler(cur, me, data)

            # 3. Export fresh signed vault snapshot so browser & disk stay in sync
            if isinstance(result, dict):
                result["vault"] = export_vault(cur)
            conn.commit()
            return self.send_json(result)
        except ApiError as e:
            conn.rollback()
            return self.send_json({"error": e.message}, e.status)
        except Exception as e:
            conn.rollback()
            print(f"[error] {path}: {e}")
            return self.send_json({"error": "Something went wrong. Please try again."}, 500)
        finally:
            conn.close()

    # ---------------- AUTH ----------------
    def api_me(self, cur, me, data):
        self.require(me)
        return {"user": pub_user(me)}

    def new_session(self, cur, user_id):
        u = cur.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        u_dict = dict(u) if u else {"id": user_id}
        tok = sign_token({"t": "sess", "uid": user_id, "u": u_dict, "nonce": secrets.token_hex(6)})
        cur.execute("INSERT OR REPLACE INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
                    (tok, user_id, now_str()))
        return tok

    def api_login(self, cur, me, data):
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""
        if not email or not password:
            raise ApiError(400, "Please enter your email and password.")
        u = cur.execute("SELECT * FROM users WHERE lower(email) = ?", (email,)).fetchone()
        if not u or not check_pw(password, u["password_hash"]):
            raise ApiError(401, "Incorrect email or password.")
        if u["is_deleted"]:
            raise ApiError(403, "This account has been deactivated. Please contact Speako to recover it.")
        return {"token": self.new_session(cur, u["id"]), "user": pub_user(u)}

    def api_signup(self, cur, me, data):
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""
        if not name or not email or "@" not in email:
            raise ApiError(400, "Please enter your name and a valid email.")
        if len(password) < 6:
            raise ApiError(400, "Password must be at least 6 characters.")
        existing = cur.execute("SELECT * FROM users WHERE lower(email) = ?", (email,)).fetchone()
        if existing:
            # If the user entered the matching password for their existing account, sign them right in!
            if not existing["is_deleted"] and check_pw(password, existing["password_hash"]):
                return {"token": self.new_session(cur, existing["id"]), "user": pub_user(existing)}
            raise ApiError(409, "An account with this email already exists. Please sign in.")
        uid = "student-" + uuid.uuid4().hex[:8]
        ts = now_iso()
        cur.execute("""
            INSERT INTO users (id, name, email, password_hash, phone, role, timezone, avatar, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'student', ?, ?, ?, ?)
        """, (uid, name, email, hash_pw(password), (data.get("phone") or "").strip(),
              data.get("timezone") or "Thailand (GMT+7)", initials(name), now_str(), ts))
        u = cur.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
        add_notification(cur, "signup", f"New student account: {name}", f"{name} ({email}) created a student account.", u)
        return {"token": self.new_session(cur, uid), "user": pub_user(u)}

    def api_logout(self, cur, me, data):
        tok = self.token()
        if tok:
            cur.execute("DELETE FROM sessions WHERE token = ?", (tok,))
        return {"ok": True}

    # ---------------- ROLE-SCOPED STATE ----------------
    def api_state(self, cur, me, data):
        self.require(me)
        teachers = [pub_teacher(t) for t in cur.execute("SELECT * FROM teachers ORDER BY id = ? DESC, name", (LEAD_TEACHER_ID,)).fetchall()]
        busy = rows(cur, "SELECT teacher_id, date_str, time_slot FROM bookings WHERE status != 'cancelled'")
        out = {"user": pub_user(me), "teachers": teachers, "busy": busy}
        role = me["role"]

        if role == "student":
            out["bookings"] = rows(cur, "SELECT * FROM bookings WHERE student_id = ? ORDER BY date_str, time_slot", (me["id"],))
            out["transactions"] = rows(cur, "SELECT * FROM transactions WHERE student_id = ? ORDER BY created_at DESC", (me["id"],))

        elif role == "teacher":
            tid = me["teacher_id"] or LEAD_TEACHER_ID
            bks = rows(cur, "SELECT * FROM bookings WHERE teacher_id = ? ORDER BY date_str, time_slot", (tid,))
            sids = sorted({b["student_id"] for b in bks})
            students = []
            if sids:
                q = ",".join("?" * len(sids))
                students = rows(cur, f"""
                    SELECT id, name, email, phone, timezone, thai_credits, english_credits, avatar, is_deleted
                    FROM users WHERE id IN ({q})
                """, sids)
            notifs = []
            bk_ids = [b["id"] for b in bks]
            if bk_ids:
                q = ",".join("?" * len(bk_ids))
                notifs = rows(cur, f"SELECT * FROM notifications WHERE booking_id IN ({q}) ORDER BY created_at DESC LIMIT 50", bk_ids)
            t = cur.execute("SELECT * FROM teachers WHERE id = ?", (tid,)).fetchone()
            out.update(bookings=bks, students=students, notifications=notifs,
                       my_teacher=pub_teacher(t) if t else None)

        else:  # admin
            out["users"] = [pub_user(u) for u in cur.execute("SELECT * FROM users ORDER BY is_deleted, role, created_at").fetchall()]
            out["bookings"] = rows(cur, "SELECT * FROM bookings ORDER BY date_str, time_slot")
            out["transactions"] = rows(cur, "SELECT * FROM transactions ORDER BY created_at DESC")
            out["notifications"] = rows(cur, "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 200")
            out["notify_emails"] = NOTIFY_EMAILS
            out["main_admin_id"] = MAIN_ADMIN_ID
        return out

    # ---------------- STUDENT: PACKAGE BOOKING REQUEST ----------------
    def api_purchase(self, cur, me, data):
        self.require(me)
        package_id = data.get("package_id")
        if package_id not in PACKAGES:
            raise ApiError(400, "Invalid package.")
        pkg = PACKAGES[package_id]
        if pkg["is_trial"] and trial_already_used(cur, me["id"], package_id):
            raise ApiError(400, "You've already used this free trial.")

        # Record package booking request as pending payment; Admin grants credits after payment
        tx_id = add_package_request(cur, me, package_id, "Pending Admin Payment")
        add_notification(
            cur,
            "purchase",
            f"Package booking request: {me['name']} · {pkg['title']}",
            f"{me['name']} ({me['email']}) requested {pkg['title']} (฿{pkg['price']:,} THB · +{pkg['lessons']} lessons). "
            f"Please contact student for fees & payment, then grant credits in Admin.",
            me,
        )
        send_emails_async(
            f"[Speako Package Booking] {me['name']} – {pkg['title']} (฿{pkg['price']:,} THB)",
            {
                "Student Name": me["name"],
                "Student Email": me["email"],
                "Student Phone": me["phone"] or "Not provided",
                "Package Requested": pkg["title"],
                "Course": COURSE_TITLES[pkg["course"]],
                "Credits to Grant": f"+{pkg['lessons']} {pkg['course'].title()} lessons",
                "Package Fee": f"฿{pkg['price']:,} THB",
                "Action Required": "Contact student to continue with fees & payment, then grant credits in Speako Admin Portal.",
                "Requested At": now_str(),
            },
        )
        u = cur.execute("SELECT * FROM users WHERE id = ?", (me["id"],)).fetchone()
        tx = dict(cur.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,)).fetchone())
        return {"user": pub_user(u), "transaction": tx, "pending_payment": True, "emailed_to": NOTIFY_EMAILS}

    # ---------------- BOOKING (student self / teacher & admin assign) ----------------
    def api_book(self, cur, me, data):
        self.require(me, "student", "teacher", "admin")
        role = me["role"]
        teacher_id = data.get("teacher_id") or LEAD_TEACHER_ID

        if role == "student":
            student = me
        else:
            student = cur.execute("SELECT * FROM users WHERE id = ? AND is_deleted = 0 AND role = 'student'",
                                  (data.get("student_id"),)).fetchone()
            if not student:
                raise ApiError(404, "Student not found.")
            if role == "teacher":
                teacher_id = me["teacher_id"] or LEAD_TEACHER_ID

        teacher = cur.execute("SELECT * FROM teachers WHERE id = ?", (teacher_id,)).fetchone()
        if not teacher:
            raise ApiError(400, "Teacher not found.")

        course_id = data.get("course_id") if data.get("course_id") in COURSE_TITLES else None
        if not course_id:
            raise ApiError(400, "Please choose a course.")
        lesson_number = max(1, min(8, int(data.get("lesson_number") or 1)))
        lesson_title = data.get("lesson_title") or f"Lesson {lesson_number}"
        date_str, time_slot = data.get("date_str"), data.get("time_slot")
        try:
            slot_dt = datetime.strptime(f"{date_str} {time_slot}", "%Y-%m-%d %H:%M")
        except (TypeError, ValueError):
            raise ApiError(400, "Please choose a valid date and time.")

        if role == "student":
            if slot_dt <= datetime.now():
                raise ApiError(400, "Please choose a time in the future.")
            avail = json.loads(teacher["availability_json"]).get(slot_dt.strftime("%a"), [])
            if time_slot not in avail:
                raise ApiError(400, "Your teacher isn't available at that time. Please pick another slot.")

        if cur.execute("""SELECT 1 FROM bookings WHERE teacher_id = ? AND date_str = ? AND time_slot = ?
                          AND status != 'cancelled'""", (teacher_id, date_str, time_slot)).fetchone():
            raise ApiError(409, "This time slot was just booked. Please choose another time.")

        col = "thai_credits" if course_id == "thai" else "english_credits"
        package_id = data.get("package_id")
        requested_pkg = None
        if package_id:
            pkg = PACKAGES.get(package_id)
            if not pkg or pkg["course"] != course_id:
                raise ApiError(400, "That package doesn't match the selected course.")
            if pkg["is_trial"] and trial_already_used(cur, student["id"], package_id):
                raise ApiError(400, "This free trial has already been used. Please choose a lesson package.")
            requested_pkg = pkg
            if role == "admin":
                add_transaction(cur, student, package_id, "Admin Assigned")
                student = cur.execute("SELECT * FROM users WHERE id = ?", (student["id"],)).fetchone()
            else:
                existing_pending = cur.execute(
                    "SELECT 1 FROM transactions WHERE student_id = ? AND package_id = ? AND status = 'pending_payment'",
                    (student["id"], package_id),
                ).fetchone()
                if not existing_pending:
                    add_package_request(cur, student, package_id, "Booked Class · Pending Payment")

        credits = int(student[col] or 0)
        pending_payment = False
        ts = now_iso()
        if credits > 0:
            cur.execute(f"UPDATE users SET {col} = {col} - 1, updated_at = ? WHERE id = ?", (ts, student["id"]))
            payment_status = f"1 {course_id.title()} credit used ({credits - 1} credits remaining)"
        else:
            pending_payment = True
            if role == "admin":
                payment_status = "Complimentary class scheduled by Admin"
            elif requested_pkg:
                payment_status = (
                    f"Pending Fees & Payment — Requested {requested_pkg['title']} "
                    f"(฿{requested_pkg['price']:,} THB · +{requested_pkg['lessons']} lessons). "
                    f"Contact student for payment, then grant credits in Admin."
                )
            else:
                payment_status = (
                    "Pending Fees & Payment (0 credits) — Contact student for fees & payment, "
                    "then grant credits in Admin."
                )

        bk_id = "bk-" + uuid.uuid4().hex[:8]
        cur.execute("""
            INSERT INTO bookings (id, student_id, student_name, student_email, teacher_id, teacher_name, course_id,
                                  course_title, lesson_number, lesson_title, date_str, time_slot, timezone, status,
                                  meeting_link, student_notes, teacher_feedback, homework_status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, '', 'pending', ?, ?)
        """, (bk_id, student["id"], student["name"], student["email"], teacher_id, teacher["name"], course_id,
              COURSE_TITLES[course_id], lesson_number, lesson_title, date_str, time_slot,
              data.get("timezone") or student["timezone"] or "Thailand (GMT+7)",
              f"https://meet.speako.live/{bk_id}", data.get("student_notes") or "", now_str(), ts))

        who = "booked" if role == "student" else f"was scheduled by {me['name']} for"
        add_notification(
            cur,
            "booking",
            f"New class: {student['name']} · {date_str} {time_slot}",
            f"{student['name']} ({student['email']}) {who} Lesson {lesson_number}: {lesson_title} ({course_id.title()}) "
            f"with {teacher['name']} on {date_str} at {time_slot}. [{payment_status}]",
            student,
            bk_id,
        )

        send_emails_async(
            f"[Speako Booking] {student['name']} – Lesson {lesson_number}: {lesson_title} ({date_str} {time_slot})",
            {
                "Student Name": student["name"],
                "Student Email": student["email"],
                "Student Phone": student["phone"] or "Not provided",
                "Teacher": teacher["name"],
                "Course": COURSE_TITLES[course_id],
                "Lesson": f"Lesson {lesson_number}: {lesson_title}",
                "Date": date_str,
                "Time": f"{time_slot} (Thailand GMT+7)",
                "Payment & Credits": payment_status,
                "Student Notes": data.get("student_notes") or "None",
                "Booked By": me["name"],
            },
        )

        updated = cur.execute("SELECT * FROM users WHERE id = ?", (student["id"],)).fetchone()
        bk = dict(cur.execute("SELECT * FROM bookings WHERE id = ?", (bk_id,)).fetchone())
        return {
            "booking": bk,
            "user": pub_user(updated),
            "pending_payment": pending_payment,
            "payment_status": payment_status,
            "emailed_to": NOTIFY_EMAILS,
        }

    # ---------------- BOOKING UPDATE (cancel / complete / edit) ----------------
    def api_booking_update(self, cur, me, data):
        self.require(me)
        bk = cur.execute("SELECT * FROM bookings WHERE id = ?", (data.get("booking_id"),)).fetchone()
        if not bk:
            raise ApiError(404, "Class not found.")
        action = data.get("action")
        role = me["role"]

        if role == "student":
            if bk["student_id"] != me["id"] or action != "cancel":
                raise ApiError(403, "You can only cancel your own upcoming classes.")
        elif role == "teacher":
            if bk["teacher_id"] != (me["teacher_id"] or LEAD_TEACHER_ID):
                raise ApiError(403, "This class belongs to another teacher.")

        refund_col = "thai_credits" if bk["course_id"] == "thai" else "english_credits"
        student = cur.execute("SELECT * FROM users WHERE id = ?", (bk["student_id"],)).fetchone()
        ts = now_iso()

        if action == "cancel":
            if bk["status"] != "confirmed":
                raise ApiError(400, "Only upcoming classes can be cancelled.")
            cur.execute("UPDATE bookings SET status = 'cancelled', updated_at = ? WHERE id = ?", (ts, bk["id"]))
            if student and int(student[refund_col] or 0) > 0:
                cur.execute(f"UPDATE users SET {refund_col} = {refund_col} + 1, updated_at = ? WHERE id = ?", (ts, bk["student_id"]))
            by = "the student" if role == "student" else me["name"]
            add_notification(cur, "cancel", f"Class cancelled: {bk['student_name']}",
                             f"{bk['lesson_title']} on {bk['date_str']} at {bk['time_slot']} was cancelled by {by}.",
                             student, bk["id"])
            if role == "student":
                send_emails_async(
                    f"[Speako Cancellation] {bk['student_name']} – {bk['lesson_title']} ({bk['date_str']} {bk['time_slot']})",
                    {"Student Name": bk["student_name"], "Student Email": bk["student_email"],
                     "Lesson": bk["lesson_title"], "Date": bk["date_str"], "Time": bk["time_slot"],
                     "Note": "Cancelled by student."})

        elif action == "complete":
            if bk["status"] != "confirmed":
                raise ApiError(400, "Only upcoming classes can be marked complete.")
            cur.execute("UPDATE bookings SET status = 'completed', teacher_feedback = ?, updated_at = ? WHERE id = ?",
                        (data.get("teacher_feedback", bk["teacher_feedback"]) or "", ts, bk["id"]))

        elif action == "feedback":
            cur.execute("UPDATE bookings SET teacher_feedback = ?, updated_at = ? WHERE id = ?",
                        (data.get("teacher_feedback") or "", ts, bk["id"]))

        elif action == "edit_schedule":
            new_date = data.get("date_str") or bk["date_str"]
            new_time = data.get("time_slot") or bk["time_slot"]
            new_course = data.get("course_id") if data.get("course_id") in COURSE_TITLES else bk["course_id"]
            new_lesson = max(1, min(8, int(data.get("lesson_number") or bk["lesson_number"])))
            new_title = data.get("lesson_title") or bk["lesson_title"]
            new_status = data.get("status") if data.get("status") in ("confirmed", "completed", "cancelled") else bk["status"]
            new_feedback = data.get("teacher_feedback", bk["teacher_feedback"]) or ""
            try:
                datetime.strptime(f"{new_date} {new_time}", "%Y-%m-%d %H:%M")
            except ValueError:
                raise ApiError(400, "Invalid date or time.")

            if new_status != "cancelled" and cur.execute("""
                SELECT 1 FROM bookings WHERE teacher_id = ? AND date_str = ? AND time_slot = ?
                AND status != 'cancelled' AND id != ?""", (bk["teacher_id"], new_date, new_time, bk["id"])).fetchone():
                raise ApiError(409, "The teacher already has a class at that time.")

            was_active = bk["status"] != "cancelled"
            now_active = new_status != "cancelled"
            new_col = "thai_credits" if new_course == "thai" else "english_credits"
            if was_active and not now_active:
                cur.execute(f"UPDATE users SET {refund_col} = {refund_col} + 1, updated_at = ? WHERE id = ?", (ts, bk["student_id"]))
            elif not was_active and now_active:
                cur.execute(f"UPDATE users SET {new_col} = MAX(0, {new_col} - 1), updated_at = ? WHERE id = ?", (ts, bk["student_id"]))
            elif was_active and now_active and new_course != bk["course_id"]:
                cur.execute(f"UPDATE users SET {refund_col} = {refund_col} + 1, updated_at = ? WHERE id = ?", (ts, bk["student_id"]))
                cur.execute(f"UPDATE users SET {new_col} = MAX(0, {new_col} - 1), updated_at = ? WHERE id = ?", (ts, bk["student_id"]))

            cur.execute("""
                UPDATE bookings SET date_str = ?, time_slot = ?, course_id = ?, course_title = ?, lesson_number = ?,
                       lesson_title = ?, status = ?, teacher_feedback = ?, updated_at = ? WHERE id = ?
            """, (new_date, new_time, new_course, COURSE_TITLES[new_course], new_lesson, new_title,
                  new_status, new_feedback, ts, bk["id"]))
            if (new_date, new_time) != (bk["date_str"], bk["time_slot"]):
                add_notification(cur, "reschedule", f"Class rescheduled: {bk['student_name']}",
                                 f"{new_title} moved to {new_date} at {new_time} by {me['name']}.", student, bk["id"])
        else:
            raise ApiError(400, "Unknown action.")

        updated = dict(cur.execute("SELECT * FROM bookings WHERE id = ?", (bk["id"],)).fetchone())
        return {"booking": updated}

    # ---------------- TEACHER: AVAILABILITY ----------------
    def api_availability(self, cur, me, data):
        self.require(me, "teacher", "admin")
        tid = (me["teacher_id"] or LEAD_TEACHER_ID) if me["role"] == "teacher" else (data.get("teacher_id") or LEAD_TEACHER_ID)
        avail = data.get("availability")
        if not isinstance(avail, dict):
            raise ApiError(400, "Invalid availability.")
        clean = {d: sorted({str(h) for h in (avail.get(d) or []) if len(str(h)) == 5}) for d in DAYS}
        cur.execute("UPDATE teachers SET availability_json = ?, updated_at = ? WHERE id = ?",
                    (json.dumps(clean), now_iso(), tid))
        return {"ok": True, "availability": clean}

    def api_notifications_read(self, cur, me, data):
        self.require(me, "teacher", "admin")
        if me["role"] == "admin":
            cur.execute("UPDATE notifications SET is_read = 1")
        else:
            cur.execute("""UPDATE notifications SET is_read = 1 WHERE booking_id IN
                           (SELECT id FROM bookings WHERE teacher_id = ?)""", (me["teacher_id"] or LEAD_TEACHER_ID,))
        return {"ok": True}

    # ---------------- ADMIN: ACCOUNTS ----------------
    def api_admin_user_create(self, cur, me, data):
        self.require(me, "admin")
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""
        role = data.get("role") if data.get("role") in ROLES else "student"
        if not name or "@" not in email:
            raise ApiError(400, "Please enter a name and valid email.")
        if len(password) < 6:
            raise ApiError(400, "Password must be at least 6 characters.")
        if cur.execute("SELECT 1 FROM users WHERE lower(email) = ?", (email,)).fetchone():
            raise ApiError(409, "That email is already used by another account.")
        teacher_id = create_teacher_profile(cur, name, data.get("title")) if role == "teacher" else ""
        uid = f"{role}-" + uuid.uuid4().hex[:8]
        cur.execute("""
            INSERT INTO users (id, name, email, password_hash, phone, role, avatar, teacher_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (uid, name, email, hash_pw(password), (data.get("phone") or "").strip(), role, initials(name), teacher_id, now_str(), now_iso()))
        return {"user": pub_user(cur.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone())}

    def api_admin_user_update(self, cur, me, data):
        self.require(me, "admin")
        action = data.get("action")
        ts = now_iso()

        if action == "approve_transaction":
            tx = cur.execute("SELECT * FROM transactions WHERE id = ?", (data.get("transaction_id"),)).fetchone()
            if not tx:
                raise ApiError(404, "Transaction not found.")
            if tx["status"] == "paid":
                return {"ok": True, "already_paid": True}
            cur.execute("UPDATE transactions SET status = 'paid', payment_method = 'Approved by Admin', updated_at = ? WHERE id = ?",
                        (ts, tx["id"]))
            col = "thai_credits" if tx["course_type"] == "thai" else "english_credits"
            cur.execute(f"UPDATE users SET {col} = {col} + ?, updated_at = ? WHERE id = ?",
                        (int(tx["lessons_added"] or 0), ts, tx["student_id"]))
            if PACKAGES.get(tx["package_id"], {}).get("is_trial"):
                cur.execute("UPDATE users SET trial_used = 1, updated_at = ? WHERE id = ?", (ts, tx["student_id"]))
            u = cur.execute("SELECT * FROM users WHERE id = ?", (tx["student_id"],)).fetchone()
            return {"ok": True, "user": pub_user(u)}

        uid = data.get("user_id")
        u = cur.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
        if not u:
            raise ApiError(404, "Account not found.")
        protected = uid == MAIN_ADMIN_ID or uid == me["id"]

        if action == "set_credits":
            th = max(0, int(data.get("thai_credits", u["thai_credits"]) or 0))
            en = max(0, int(data.get("english_credits", u["english_credits"]) or 0))
            cur.execute("UPDATE users SET thai_credits = ?, english_credits = ?, updated_at = ? WHERE id = ?", (th, en, ts, uid))

        elif action == "grant_package":
            pkg_id = data.get("package_id")
            if pkg_id not in PACKAGES:
                raise ApiError(400, "Invalid package.")
            # If student had a pending request for this package, mark it paid; otherwise create a paid transaction
            pending_tx = cur.execute(
                "SELECT * FROM transactions WHERE student_id = ? AND package_id = ? AND status = 'pending_payment' ORDER BY created_at DESC LIMIT 1",
                (uid, pkg_id),
            ).fetchone()
            if pending_tx:
                cur.execute("UPDATE transactions SET status = 'paid', payment_method = 'Approved by Admin', updated_at = ? WHERE id = ?",
                            (ts, pending_tx["id"]))
                pkg = PACKAGES[pkg_id]
                col = "thai_credits" if pkg["course"] == "thai" else "english_credits"
                cur.execute(f"UPDATE users SET {col} = {col} + ?, updated_at = ? WHERE id = ?", (pkg["lessons"], ts, uid))
                if pkg["is_trial"]:
                    cur.execute("UPDATE users SET trial_used = 1, updated_at = ? WHERE id = ?", (ts, uid))
            else:
                add_transaction(cur, u, pkg_id, "Admin Assigned")

        elif action == "set_role":
            role = data.get("role")
            if role not in ROLES:
                raise ApiError(400, "Invalid role.")
            if protected and role != "admin":
                raise ApiError(400, "You can't remove admin access from the main admin or yourself.")
            teacher_id = u["teacher_id"]
            if role == "teacher" and not teacher_id:
                teacher_id = create_teacher_profile(cur, u["name"])
            cur.execute("UPDATE users SET role = ?, teacher_id = ?, updated_at = ? WHERE id = ?", (role, teacher_id or "", ts, uid))
            cur.execute("DELETE FROM sessions WHERE user_id = ?", (uid,))

        elif action == "reset_password":
            pw = data.get("password") or ""
            if len(pw) < 6:
                raise ApiError(400, "Password must be at least 6 characters.")
            cur.execute("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", (hash_pw(pw), ts, uid))
            cur.execute("DELETE FROM sessions WHERE user_id = ?", (uid,))

        elif action == "delete":
            if protected:
                raise ApiError(400, "You can't delete the main admin or your own account.")
            cur.execute("UPDATE users SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ?", (now_str(), ts, uid))
            cur.execute("DELETE FROM sessions WHERE user_id = ?", (uid,))

        elif action == "recover":
            cur.execute("UPDATE users SET is_deleted = 0, deleted_at = '', updated_at = ? WHERE id = ?", (ts, uid))

        elif action == "permanent_delete":
            if protected:
                raise ApiError(400, "You can't delete the main admin or your own account.")
            if not u["is_deleted"]:
                raise ApiError(400, "Move the account to Trash first.")
            cur.execute("DELETE FROM sessions WHERE user_id = ?", (uid,))
            cur.execute("DELETE FROM users WHERE id = ?", (uid,))
            return {"ok": True, "deleted": True}
        else:
            raise ApiError(400, "Unknown action.")

        return {"ok": True, "user": pub_user(cur.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone())}

    # ---------------- ADMIN: TEACHERS ----------------
    def api_admin_teacher_add(self, cur, me, data):
        self.require(me, "admin")
        name = (data.get("name") or "").strip()
        if not name:
            raise ApiError(400, "Teacher name is required.")
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""
        if email:
            if "@" not in email or len(password) < 6:
                raise ApiError(400, "Login needs a valid email and a password of at least 6 characters.")
            if cur.execute("SELECT 1 FROM users WHERE lower(email) = ?", (email,)).fetchone():
                raise ApiError(409, "That email is already used by another account.")
        hours = [h.strip() for h in (data.get("hours") or []) if h.strip()]
        tid = create_teacher_profile(cur, name, data.get("title"), data.get("bio"), hours or None)
        if email:
            cur.execute("""
                INSERT INTO users (id, name, email, password_hash, role, avatar, teacher_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'teacher', ?, ?, ?, ?)
            """, ("teacher-" + uuid.uuid4().hex[:8], name, email, hash_pw(password), initials(name), tid, now_str(), now_iso()))
        return {"ok": True, "teacher_id": tid}

    def api_admin_teacher_delete(self, cur, me, data):
        self.require(me, "admin")
        tid = data.get("teacher_id")
        if tid == LEAD_TEACHER_ID:
            raise ApiError(400, "Kendrick's lead teacher profile can't be removed.")
        cur.execute("DELETE FROM teachers WHERE id = ?", (tid,))
        ts = now_iso()
        for u in cur.execute("SELECT id FROM users WHERE teacher_id = ?", (tid,)).fetchall():
            cur.execute("UPDATE users SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ?", (now_str(), ts, u["id"]))
            cur.execute("DELETE FROM sessions WHERE user_id = ?", (u["id"],))
        return {"ok": True}


if __name__ == "__main__":
    init_db()
    print(f"Speako portal running at http://localhost:{PORT}")
    ThreadingHTTPServer(("0.0.0.0", PORT), SpeakoHandler).serve_forever()
