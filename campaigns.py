"""
Speako Languages — Self-Running Promotions & Campaigns Engine (Part 2)

Uses `PACKAGES` as the single price source.
Defaults to safe mode: CAMPAIGNS_SCHEDULER=OFF, CAMPAIGNS_DRY_RUN=ON, CAMPAIGNS_KILL_SWITCH=ON.
"""
import json
import uuid
import zoneinfo
from datetime import datetime, timedelta, timezone

BANGKOK_TZ = zoneinfo.ZoneInfo("Asia/Bangkok")
MAX_CHANGES_PER_RUN = 5
MAX_DISCOUNT_PERCENT = 50.0
MAX_EMAILS_PER_RUN = 20
SUPPORTED_TYPES = ("price_promotion", "launch_offer", "free_trial_change", "homepage_banner")
SUPPORTED_STATUSES = ("draft", "scheduled", "active", "paused", "ended")


def bangkok_now(now_utc: datetime = None) -> datetime:
    dt = now_utc or datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(BANGKOK_TZ)


def parse_bangkok_dt(val: str) -> datetime:
    if not val or not str(val).strip():
        return None
    s = str(val).strip()
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=BANGKOK_TZ)
    else:
        dt = dt.astimezone(BANGKOK_TZ)
    return dt


def _utc_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def validate_campaign_safety(camp: dict, packages: dict) -> list:
    """Returns a list of error strings if any safeguard is violated."""
    errors = []
    if not camp.get("end_at"):
        errors.append(f"Campaign '{camp.get('name')}' has no end_at date; refused.")
    disc = float(camp.get("discount_percent") or 0)
    if disc > MAX_DISCOUNT_PERCENT:
        errors.append(f"Campaign '{camp.get('name')}' discount {disc}% exceeds 50% cap.")
    if disc < 0:
        errors.append(f"Campaign '{camp.get('name')}' has negative discount {disc}%.")

    try:
        cfg = json.loads(camp.get("config_json") or "{}")
    except Exception:
        cfg = {}
    pkg_ids = cfg.get("package_ids") or []
    expected_orig = cfg.get("strikethrough_prices") or {}

    for pid in pkg_ids:
        if pid not in packages:
            errors.append(f"Campaign '{camp.get('name')}' references unknown package '{pid}'.")
            continue
        orig_price = int(packages[pid]["price"])
        if pid in expected_orig and int(expected_orig[pid]) != orig_price:
            errors.append(
                f"Campaign '{camp.get('name')}' strikethrough original {expected_orig[pid]} != price source {orig_price} for {pid}."
            )
        if orig_price > 0 and disc > 0:
            new_price = round(orig_price * (1.0 - disc / 100.0))
            if new_price <= 0:
                errors.append(f"Campaign '{camp.get('name')}' drops price of {pid} to <= 0.")
    return errors


def run_campaign_scheduler(cur, packages: dict, flags: dict, now_utc: datetime = None) -> dict:
    """
    Evaluate scheduled/active campaigns in Asia/Bangkok time.
    Respects CAMPAIGNS_KILL_SWITCH, CAMPAIGNS_DRY_RUN, MAX_CHANGES_PER_RUN, and safety checks.
    Logs every run into `campaign_run_logs`.
    """
    now_bkk = bangkok_now(now_utc)
    started_at = now_bkk.strftime("%Y-%m-%dT%H:%M:%S%z")
    dry_run = bool(flags.get("CAMPAIGNS_DRY_RUN", True))
    kill_switch = bool(flags.get("CAMPAIGNS_KILL_SWITCH", True))

    changes = []
    skips = []
    errors = []
    status = "ok"

    if kill_switch:
        skips.append({"reason": "CAMPAIGNS_KILL_SWITCH is ON (paused). No campaigns evaluated."})
        log_entry = _save_run_log(cur, started_at, dry_run, kill_switch, changes, skips, errors, "paused")
        return log_entry

    rows = cur.execute("SELECT * FROM campaigns WHERE status IN ('scheduled', 'active') ORDER BY start_at ASC").fetchall()
    change_count = 0

    for row in rows:
        camp = dict(row)
        cid = camp["id"]
        cstatus = camp["status"]

        if not camp.get("end_at"):
            skips.append({"campaign_id": cid, "name": camp["name"], "reason": "warning: no end_at date; activation refused"})
            continue

        try:
            start_dt = parse_bangkok_dt(camp["start_at"])
            end_dt = parse_bangkok_dt(camp["end_at"])
        except Exception as exc:
            errors.append({"campaign_id": cid, "error": f"Invalid date format: {exc}"})
            status = "halted_error"
            break

        safety_errs = validate_campaign_safety(camp, packages)
        if safety_errs:
            errors.extend([{"campaign_id": cid, "error": e} for e in safety_errs])
            status = "halted_error"
            break

        target_status = None
        if cstatus == "scheduled" and start_dt <= now_bkk < end_dt:
            target_status = "active"
        elif cstatus in ("scheduled", "active") and now_bkk >= end_dt:
            target_status = "ended"

        if not target_status:
            skips.append({"campaign_id": cid, "name": camp["name"], "reason": f"remains {cstatus}"})
            continue

        if change_count >= MAX_CHANGES_PER_RUN:
            skips.append({"campaign_id": cid, "name": camp["name"], "reason": f"max changes per run ({MAX_CHANGES_PER_RUN}) reached"})
            continue

        change_count += 1
        changes.append({
            "campaign_id": cid,
            "name": camp["name"],
            "from": cstatus,
            "to": target_status,
            "dry_run": dry_run,
        })

        if not dry_run:
            cur.execute(
                "UPDATE campaigns SET status = ?, updated_at = ? WHERE id = ?",
                (target_status, _utc_iso(), cid),
            )
            if target_status == "active" and flags.get("MARKETING_EMAIL_SENDING", False):
                _queue_marketing_emails(cur, camp)

    log_entry = _save_run_log(cur, started_at, dry_run, kill_switch, changes, skips, errors, status)
    return log_entry


def _queue_marketing_emails(cur, camp: dict):
    """Idempotent, opt-in only, rate-limited marketing email logger (never sends to non-opt-in)."""
    opted_in = cur.execute(
        "SELECT id, email, unsubscribe_token FROM users WHERE role = 'student' AND is_deleted = 0 AND marketing_opt_in = 1 LIMIT ?",
        (MAX_EMAILS_PER_RUN,),
    ).fetchall()
    now = _utc_iso()
    for u in opted_in:
        cur.execute("""
            INSERT OR IGNORE INTO campaign_email_logs (id, campaign_id, user_id, email, sent_at)
            VALUES (?, ?, ?, ?, ?)
        """, (str(uuid.uuid4()), camp["id"], u["id"], u["email"], now))


def _save_run_log(cur, started_at, dry_run, kill_switch, changes, skips, errors, status):
    lid = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO campaign_run_logs (id, started_at, dry_run, kill_switch, changes_json, skips_json, errors_json, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        lid,
        started_at,
        1 if dry_run else 0,
        1 if kill_switch else 0,
        json.dumps(changes),
        json.dumps(skips),
        json.dumps(errors),
        status,
    ))
    return {
        "id": lid,
        "started_at": started_at,
        "dry_run": dry_run,
        "kill_switch": kill_switch,
        "changes": changes,
        "skips": skips,
        "errors": errors,
        "status": status,
    }


def get_effective_pricing(cur, packages: dict, flags: dict, now_utc: datetime = None) -> dict:
    """
    Computes live package prices from single source `packages`.
    Only applies active campaigns when kill_switch is OFF and dry_run is OFF.
    """
    now_bkk = bangkok_now(now_utc)
    result = {}
    for pid, pkg in packages.items():
        result[pid] = {
            **pkg,
            "id": pid,
            "original_price": int(pkg["price"]),
            "effective_price": int(pkg["price"]),
            "strikethrough_price": None,
            "discount_percent": 0.0,
            "campaign_id": "",
            "campaign_name": "",
        }

    if flags.get("CAMPAIGNS_KILL_SWITCH", True) or flags.get("CAMPAIGNS_DRY_RUN", True):
        return {"packages": result, "banner": None}

    active_rows = cur.execute("SELECT * FROM campaigns WHERE status = 'active' ORDER BY discount_percent DESC").fetchall()
    banner = None
    for row in active_rows:
        camp = dict(row)
        start_dt = parse_bangkok_dt(camp["start_at"])
        end_dt = parse_bangkok_dt(camp["end_at"]) if camp.get("end_at") else None
        if not end_dt or not (start_dt <= now_bkk < end_dt):
            continue
        if camp.get("banner_text") and not banner:
            banner = {"campaign_id": camp["id"], "name": camp["name"], "text": camp["banner_text"]}

        disc = float(camp.get("discount_percent") or 0)
        if disc <= 0 or disc > MAX_DISCOUNT_PERCENT:
            continue
        try:
            cfg = json.loads(camp.get("config_json") or "{}")
        except Exception:
            cfg = {}
        for pid in (cfg.get("package_ids") or []):
            if pid in result and result[pid]["original_price"] > 0 and result[pid]["discount_percent"] == 0:
                orig = result[pid]["original_price"]
                eff = round(orig * (1.0 - disc / 100.0))
                if eff > 0:
                    result[pid]["effective_price"] = eff
                    result[pid]["strikethrough_price"] = orig
                    result[pid]["discount_percent"] = disc
                    result[pid]["campaign_id"] = camp["id"]
                    result[pid]["campaign_name"] = camp["name"]

    return {"packages": result, "banner": banner}


def create_checkout_quote(cur, user_id: str, package_id: str, packages: dict, flags: dict, now_utc: datetime = None) -> dict:
    pricing = get_effective_pricing(cur, packages, flags, now_utc=now_utc)
    if package_id not in pricing["packages"]:
        raise ValueError("Invalid package.")
    p = pricing["packages"][package_id]
    qid = str(uuid.uuid4())
    now = now_utc or datetime.now(timezone.utc)
    exp = now + timedelta(minutes=30)
    cur.execute("""
        INSERT INTO checkout_quotes (id, user_id, package_id, campaign_id, original_price, quoted_price, discount_percent, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        qid,
        user_id,
        package_id,
        p["campaign_id"],
        p["original_price"],
        p["effective_price"],
        p["discount_percent"],
        now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        exp.strftime("%Y-%m-%dT%H:%M:%SZ"),
    ))
    return {
        "quote_id": qid,
        "package_id": package_id,
        "original_price": p["original_price"],
        "quoted_price": p["effective_price"],
        "discount_percent": p["discount_percent"],
        "campaign_id": p["campaign_id"],
    }


def list_campaigns_and_logs(cur):
    camps = [dict(r) for r in cur.execute("SELECT * FROM campaigns ORDER BY start_at ASC").fetchall()]
    logs = [dict(r) for r in cur.execute("SELECT * FROM campaign_run_logs ORDER BY started_at DESC LIMIT 30").fetchall()]
    for l in logs:
        for k in ("changes", "skips", "errors"):
            try:
                l[k] = json.loads(l.get(f"{k}_json") or "[]")
            except Exception:
                l[k] = []
    return {"campaigns": camps, "logs": logs}


def set_campaign_status(cur, campaign_id: str, new_status: str):
    if new_status not in SUPPORTED_STATUSES:
        raise ValueError("Invalid status.")
    row = cur.execute("SELECT * FROM campaigns WHERE id = ?", (campaign_id,)).fetchone()
    if not row:
        raise ValueError("Campaign not found.")
    if new_status in ("scheduled", "active") and not row["end_at"]:
        raise ValueError("Campaign with no end date cannot be activated or scheduled.")
    cur.execute("UPDATE campaigns SET status = ?, updated_at = ? WHERE id = ?", (new_status, _utc_iso(), campaign_id))
    return dict(cur.execute("SELECT * FROM campaigns WHERE id = ?", (campaign_id,)).fetchone())
