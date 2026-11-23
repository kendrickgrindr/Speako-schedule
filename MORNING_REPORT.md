# Speako Languages — Morning Report

**Branch:** `feat/mindmap-and-campaigns`  
**Database Backup:** `speako.db.backup_20261124` (created before any migrations)  
**Test Suite:** `python3 -m unittest discover -s tests -v` — **9/9 passing**

---

## 1. Codebase Summary (Pre-Change Audit)
- **Project Structure:** Python `ThreadingHTTPServer` + SQLite (`server.py`, `speako.db`) serving static HTML/CSS/JS portals (`index.html`, `student.html`, `teacher.html`, `admin.html`, `app.js`, `data.js`, `styles.css`), interactive lesson decks (`lesson1.html`–`lesson8.html`), neural Thai audio (`audio/speako-tts.js` + `.mp3` clips), and teacher blog (`post/`).
- **Database Schema (Original):** `users`, `teachers`, `bookings`, `transactions`, `notifications`, `sessions`, `posts`. No campaign/promotion tables existed in `speako.db`; promotion rules were documented in `pricing.md` and `SPEAKO_PRICING_STANDARDS.md`.
- **Single Price Source:** `PACKAGES` dictionary in `server.py` (lines 53–60, THB prices: `thai-trial: 0`, `thai-8: 4490`, `thai-16: 8880`, `english-trial: 0`, `english-8: 3690`, `english-16: 7380`), mirrored in `data.js` (`window.SPEAKO_DATA.pricing`).
- **Lesson Decks & Audio:** `lesson1.html`–`lesson8.html` embed `audio/speako-tts.js` which maps normalized Thai phrases to hashed `.mp3` files.
- **Student Dashboard:** `renderStudentSchedule` in `app.js` renders the Next Class card, 8-lesson progress bar, 3-item prep checklist, credit balances, and upcoming/past bookings.

---

## 2. What Was Completed

### Part 1: Speako Player Objectives (`features_gamification.py`, `features.js`, `app.js`, `student.html`)
- **Phase 5a (`MINDMAP_5A`, default OFF):**
  - **Bookmark tricky words:** Star button (`☆`/`★`) on lesson vocabulary + "My Word Vault" modal with search, audio playback, and delete.
  - **Daily speaking streaks:** Timezone-aware (`Asia/Bangkok`, `Thailand (GMT+7)`, `UTC`, etc.) daily activity tracking, flame counter, current/longest streak, and missed-day reset.
  - **Collect stars & milestone badges:** Idempotent XP/star awards (`UNIQUE(user_id, event_key)`) and milestone badges (`first_lesson`, `streak_5`, `stars_100`, `vocab_10`).
- **Phase 5b (`MINDMAP_5B`, default OFF):**
  - **Record your voice:** `MediaRecorder` in-browser recording next to lesson vocabulary, graceful permission-denied handling, 512 KB per-recording limit, max 30 recordings per user, private to student, with delete.
  - **Beat your best scores:** Saves best/last scores per phrase and flags improvements. *Limit:* Currently uses a duration-match heuristic (`targetMs = max(1000, phrase.length * 90)`) rather than phoneme-level ASR/pronunciation scoring.
  - **Custom phrase decks:** Students can create, name, and delete custom phrase decks.
- **Phase 5c (`MINDMAP_5C`, default OFF):**
  - **Customize mascot:** Outfit & accessory picker saved per student (currently uses emoji/icon placeholders so final artwork can be swapped in easily via `MASCOT_ITEMS` in `features_gamification.py`).
  - **Pick favorite topics:** Topic selector (`travel`, `food`, `work`, `daily_life`, `shopping`, `emergencies`, `culture`) plus optional free-text learning goal.
- **Phase 5d (`MINDMAP_5D_SOCIAL`, default OFF):**
  - **Class leaderboards:** Weekly and all-time XP returning **only** `name` and `xp`, with student opt-out toggle.
  - **Cheer on friends & share study notes:** Group notes + 👏 cheers, with user report (auto-hides at 2 reports), self-hide, and teacher/admin removal.
  - **Practice together:** Peer practice sessions (`peer_practice_sessions`) kept completely separate from `bookings`.

### Part 2: Self-Running Promotions & Campaigns (`campaigns.py`, `server.py`, `admin.html`, `features.js`)
- Seeded initial `draft` campaigns from `pricing.md` / `SPEAKO_PRICING_STANDARDS.md` into `campaigns` table.
- Scheduler evaluates `scheduled` → `active` and `active` → `ended` in `Asia/Bangkok`, handles midnight-crossing windows, and refuses campaigns without `end_at`.
- Safeguards: `CAMPAIGNS_KILL_SWITCH` (ON), `CAMPAIGNS_DRY_RUN` (ON), `MAX_CHANGES_PER_RUN = 5`, halts on discount > 50%, price <= 0, or mismatched strikethrough original.
- Display-to-checkout quote locking (`checkout_quotes`) honors the price the student saw for 30 minutes even if a campaign ends mid-checkout. Existing `transactions` and `bookings` are never altered.
- Admin `Campaigns` tab lists campaigns, run logs, pause/resume, global kill switch, dry-run trigger, and homepage/pricing previews.

---

## 3. Migrations Added (`migrations.py`)
1. `001_mindmap_5a`: `word_vault`, `user_activity_days`, `user_streaks`, `user_xp_events`, `user_badges`
2. `002_mindmap_5b`: `voice_recordings`, `phrase_scores`, `custom_decks`
3. `003_mindmap_5c`: `user_preferences`
4. `004_mindmap_5d_social`: `social_profiles`, `study_notes`, `note_cheers`, `note_reports`, `peer_practice_sessions`
5. `005_campaigns_and_promotions`: `users.marketing_opt_in`, `users.unsubscribe_token`, `campaigns`, `campaign_run_logs`, `checkout_quotes`, `campaign_email_logs`, plus `feature_flags` and `schema_migrations`.

---

## 4. Feature Flags Summary (Verified by `test_01_default_flags`)
| Flag | Default Value | Status |
| :--- | :--- | :--- |
| `MINDMAP_5A` | `OFF` (`False`) | Verified |
| `MINDMAP_5B` | `OFF` (`False`) | Verified |
| `MINDMAP_5C` | `OFF` (`False`) | Verified |
| `MINDMAP_5D_SOCIAL` | `OFF` (`False`) | Verified |
| `CAMPAIGNS_SCHEDULER` | `OFF` (`False`) | Verified |
| `CAMPAIGNS_DRY_RUN` | `ON` (`True`) | Verified |
| `CAMPAIGNS_KILL_SWITCH` | `ON` (`True`, paused) | Verified |
| `MARKETING_EMAIL_SENDING` | `OFF` (`False`) | Verified |

---

## 5. Sample Dry-Run Scheduler Log (Simulated)
```json
{
  "started_at": "2026-11-24T00:30:00+0700",
  "dry_run": true,
  "kill_switch": false,
  "status": "ok",
  "changes": [
    {
      "campaign_id": "c-test",
      "name": "Test Flash",
      "from": "scheduled",
      "to": "active",
      "dry_run": true
    }
  ],
  "skips": [],
  "errors": []
}
```

---

## 6. Test Results
Command: `python3 -m unittest discover -s tests -v`
- `test_01_default_flags` — OK
- `test_02_phase5a_streaks_timezone_and_reset` — OK
- `test_03_phase5a_idempotent_xp_and_vault` — OK
- `test_04_phase5b_recordings_scores_decks` — OK
- `test_05_phase5c_preferences` — OK
- `test_06_phase5d_privacy_and_moderation` — OK
- `test_07_campaigns_kill_switch_and_dry_run` — OK
- `test_08_campaigns_midnight_idempotency_checkout_and_existing_prices` — OK
- `test_09_campaign_safeguards_halt_on_bad_discount_and_missing_end` — OK

---

## 7. Privacy & Moderation Review (Before Enabling `MINDMAP_5D_SOCIAL`)
- **Leaderboard Privacy:** Only `name` and `xp` are returned; students can opt out via `leaderboard_opt_out`. Confirm whether you want display names truncated (e.g., first name + last initial) before enabling.
- **Study Notes Moderation:** Notes auto-hide at 2 reports and teachers/admins can remove any note (`removed_by_teacher = 1`). Confirm if you want pre-moderation or keyword filtering before opening to students.
- **Peer Practice:** Currently text/audio exchange metadata; keep separate from live 1-on-1 teacher bookings.

---

## 8. Open Questions for You (Decisions Affecting Students or Money)
1. **Currency Reconciliation:** `pricing.md` / `SPEAKO_PRICING_STANDARDS.md` list USD prices (`$99`, `$179`), while `server.py` `PACKAGES` uses THB (`4490`, `8880`, `3690`, `7380`). Seeded campaigns apply percentage discounts against `server.py` `PACKAGES` (THB). Confirm if USD checkout should also be added or if THB remains the live portal source.
2. **Pronunciation Scoring (5b):** Confirm whether duration-match scoring is sufficient for v1 or if you want Whisper/ASR integration later.
3. **Marketing Emails:** `campaign_email_logs` tracks opt-in sends idempotently, but actual SMTP/Web3Forms dispatch for bulk marketing is disabled (`MARKETING_EMAIL_SENDING=OFF`).

---

## 9. How to Review & Enable Each Feature
1. Review commits on branch `feat/mindmap-and-campaigns`: `git log --oneline -n 5`
2. Run tests locally: `python3 -m unittest discover -s tests -v`
3. Start server locally (`python3 server.py`), sign in as Admin (`admin@speakolanguages.com`), and open the **Campaigns** tab to inspect seeded campaigns and run a dry-run check.
4. Enable any Phase flag in SQLite when ready:
   ```sql
   UPDATE feature_flags SET enabled = 1 WHERE key = 'MINDMAP_5A';
   ```
5. Only disable `CAMPAIGNS_DRY_RUN` and `CAMPAIGNS_KILL_SWITCH` after verifying campaign dates and THB prices in the Admin Campaigns tab.
