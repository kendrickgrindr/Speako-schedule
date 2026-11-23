import json
import os
import sqlite3
import tempfile
import unittest
from datetime import datetime, timedelta, timezone

import campaigns
import features_gamification
import migrations
import server


class SpeakoSuiteTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.tmp.close()
        self.orig_db_path = server.DB_PATH
        server.DB_PATH = self.tmp.name
        server.init_db()
        self.conn = sqlite3.connect(self.tmp.name)
        self.conn.row_factory = sqlite3.Row
        self.cur = self.conn.cursor()

    def tearDown(self):
        self.conn.close()
        server.DB_PATH = self.orig_db_path
        if os.path.exists(self.tmp.name):
            os.unlink(self.tmp.name)

    def test_01_default_flags(self):
        flags = migrations.get_flags(self.cur)
        self.assertFalse(flags["MINDMAP_5A"])
        self.assertFalse(flags["MINDMAP_5B"])
        self.assertFalse(flags["MINDMAP_5C"])
        self.assertFalse(flags["MINDMAP_5D_SOCIAL"])
        self.assertFalse(flags["CAMPAIGNS_SCHEDULER"])
        self.assertTrue(flags["CAMPAIGNS_DRY_RUN"])
        self.assertTrue(flags["CAMPAIGNS_KILL_SWITCH"])
        self.assertFalse(flags["MARKETING_EMAIL_SENDING"])

    def test_02_phase5a_streaks_timezone_and_reset(self):
        uid = "student-alex"
        # Day 1: 2026-11-24 18:00 UTC -> 2026-11-25 01:00 Asia/Bangkok
        t1 = datetime(2026, 11, 24, 18, 0, tzinfo=timezone.utc)
        s1 = features_gamification.record_daily_activity(self.cur, uid, "lesson", "l1", "Asia/Bangkok", now_utc=t1)
        self.assertEqual(s1["streak"]["current_streak"], 1)
        self.assertEqual(s1["streak"]["last_active_date"], "2026-11-25")

        # Same Bangkok day (2026-11-25 10:00 UTC = 17:00 BKK) -> still 1
        t1b = datetime(2026, 11, 25, 10, 0, tzinfo=timezone.utc)
        s1b = features_gamification.record_daily_activity(self.cur, uid, "audio", "a1", "Asia/Bangkok", now_utc=t1b)
        self.assertEqual(s1b["streak"]["current_streak"], 1)

        # Next Bangkok day -> streak becomes 2
        t2 = datetime(2026, 11, 26, 10, 0, tzinfo=timezone.utc)
        s2 = features_gamification.record_daily_activity(self.cur, uid, "practice", "p1", "Asia/Bangkok", now_utc=t2)
        self.assertEqual(s2["streak"]["current_streak"], 2)

        # Missed a day (2026-11-28) -> effective streak resets to 0 before activity, then 1 after activity
        t_missed = datetime(2026, 11, 28, 10, 0, tzinfo=timezone.utc)
        summary_before = features_gamification.get_gamification_summary(self.cur, uid, "Asia/Bangkok", now_utc=t_missed)
        self.assertEqual(summary_before["streak"]["current_streak"], 0)
        self.assertEqual(summary_before["streak"]["longest_streak"], 2)

        s3 = features_gamification.record_daily_activity(self.cur, uid, "lesson", "l2", "Asia/Bangkok", now_utc=t_missed)
        self.assertEqual(s3["streak"]["current_streak"], 1)
        self.assertEqual(s3["streak"]["longest_streak"], 2)

    def test_03_phase5a_idempotent_xp_and_vault(self):
        uid = "student-alex"
        first = features_gamification.award_xp(self.cur, uid, "lesson:1", "lesson", 10, 25, "Lesson 1")
        second = features_gamification.award_xp(self.cur, uid, "lesson:1", "lesson", 10, 25, "Lesson 1")
        self.assertTrue(first)
        self.assertFalse(second)
        summary = features_gamification.get_gamification_summary(self.cur, uid, "Asia/Bangkok")
        self.assertEqual(summary["stars"], 10)
        self.assertEqual(summary["xp"], 25)
        self.assertTrue(any(b["badge_id"] == "first_lesson" for b in summary["badges"]))

        vault = features_gamification.add_word_vault(self.cur, uid, "thai", 1, "สวัสดี", "Hello")
        self.assertEqual(len(vault), 1)
        searched = features_gamification.get_word_vault(self.cur, uid, "สวัสดี")
        self.assertEqual(len(searched), 1)

    def test_04_phase5b_recordings_scores_decks(self):
        uid = "student-alex"
        too_big = "a" * (features_gamification.MAX_RECORDING_BYTES + 10)
        with self.assertRaises(ValueError):
            features_gamification.save_voice_recording(self.cur, uid, "thai", 1, "สวัสดี", "audio/webm", too_big, 1000)

        recs = features_gamification.save_voice_recording(self.cur, uid, "thai", 1, "สวัสดี", "audio/webm", "SGVsbG8=", 1200)
        self.assertEqual(len(recs), 1)
        s1 = features_gamification.save_phrase_score(self.cur, uid, "thai", "สวัสดี", 72)
        self.assertTrue(s1["improved"])
        s2 = features_gamification.save_phrase_score(self.cur, uid, "thai", "สวัสดี", 88)
        self.assertTrue(s2["improved"])
        self.assertEqual(s2["best_score"], 88)

        decks = features_gamification.save_custom_deck(self.cur, uid, "My Trip", "thai", ["สวัสดี", "ขอบคุณ"])
        self.assertEqual(len(decks), 1)

    def test_05_phase5c_preferences(self):
        uid = "student-alex"
        prefs = features_gamification.save_user_preferences(
            self.cur, uid, mascot_outfit="thai_silk", mascot_accessory="glasses", favorite_topics=["travel", "food"]
        )
        self.assertEqual(prefs["mascot_outfit"], "thai_silk")
        self.assertEqual(prefs["favorite_topics"], ["travel", "food"])

    def test_06_phase5d_privacy_and_moderation(self):
        features_gamification.award_xp(self.cur, "student-alex", "k1", "lesson", 10, 50)
        features_gamification.award_xp(self.cur, "student-ploy", "k2", "lesson", 10, 30)
        # Opt out Alex
        features_gamification.update_social_profile(self.cur, "student-alex", leaderboard_opt_out=True)
        lb = features_gamification.get_leaderboard(self.cur, "global", "all")
        names = [r["name"] for r in lb]
        self.assertNotIn("Alex Mercer", names)
        self.assertIn("Ploy Srisuk", names)
        # Only name and xp keys
        self.assertEqual(set(lb[0].keys()), {"name", "xp"})

        # Moderation
        notes = features_gamification.create_study_note(self.cur, "student-ploy", "Ploy", "Great tip!")
        nid = notes[0]["id"]
        features_gamification.report_or_hide_note(self.cur, "student-alex", nid, action="teacher_remove", is_staff=True)
        self.assertEqual(len(features_gamification.list_study_notes(self.cur, "global")), 0)

    def test_07_campaigns_kill_switch_and_dry_run(self):
        self.cur.execute("""
            INSERT INTO campaigns (id, name, campaign_type, status, start_at, end_at, timezone, description, config_json, banner_text, discount_percent, created_at, updated_at)
            VALUES ('c-test', 'Test Flash', 'price_promotion', 'scheduled', '2026-11-23T23:00:00', '2026-11-24T02:00:00', 'Asia/Bangkok', 'Midnight flash', '{"package_ids":["thai-8"]}', 'Flash!', 20, '2026-11-23T00:00:00Z', '2026-11-23T00:00:00Z')
        """)
        # 1. Kill switch ON -> paused
        now_active = datetime(2026, 11, 23, 17, 30, tzinfo=timezone.utc)  # 00:30 BKK Nov 24
        log1 = campaigns.run_campaign_scheduler(self.cur, server.PACKAGES, {"CAMPAIGNS_KILL_SWITCH": True, "CAMPAIGNS_DRY_RUN": True}, now_utc=now_active)
        self.assertEqual(log1["status"], "paused")
        self.assertEqual(len(log1["changes"]), 0)

        # 2. Kill switch OFF, Dry-run ON -> logs transition, DB unchanged
        log2 = campaigns.run_campaign_scheduler(self.cur, server.PACKAGES, {"CAMPAIGNS_KILL_SWITCH": False, "CAMPAIGNS_DRY_RUN": True}, now_utc=now_active)
        self.assertEqual(log2["status"], "ok")
        self.assertEqual(len(log2["changes"]), 1)
        self.assertEqual(log2["changes"][0]["to"], "active")
        row = self.cur.execute("SELECT status FROM campaigns WHERE id = 'c-test'").fetchone()
        self.assertEqual(row["status"], "scheduled")

    def test_08_campaigns_midnight_idempotency_checkout_and_existing_prices(self):
        self.cur.execute("""
            INSERT INTO campaigns (id, name, campaign_type, status, start_at, end_at, timezone, description, config_json, banner_text, discount_percent, created_at, updated_at)
            VALUES ('c-mid', 'Midnight Flash', 'price_promotion', 'scheduled', '2026-11-23T23:00:00', '2026-11-24T02:00:00', 'Asia/Bangkok', 'Midnight flash', '{"package_ids":["thai-8"]}', 'Flash!', 20, '2026-11-23T00:00:00Z', '2026-11-23T00:00:00Z')
        """)
        # Existing transaction before campaign
        alex = dict(self.cur.execute("SELECT * FROM users WHERE id = 'student-alex'").fetchone())
        tx_before = server.add_package_request(self.cur, alex, "thai-8", "Pending Admin Payment")
        orig_tx_amount = self.cur.execute("SELECT amount_thb FROM transactions WHERE id = ?", (tx_before,)).fetchone()["amount_thb"]
        self.assertEqual(orig_tx_amount, 4490)

        live_flags = {"CAMPAIGNS_KILL_SWITCH": False, "CAMPAIGNS_DRY_RUN": False}
        # Activate at 00:30 BKK (17:30 UTC) crossing midnight
        now_active = datetime(2026, 11, 23, 17, 30, tzinfo=timezone.utc)
        log1 = campaigns.run_campaign_scheduler(self.cur, server.PACKAGES, live_flags, now_utc=now_active)
        self.assertEqual(log1["changes"][0]["to"], "active")

        # Idempotent second run at 00:35 BKK -> 0 changes
        log2 = campaigns.run_campaign_scheduler(self.cur, server.PACKAGES, live_flags, now_utc=now_active + timedelta(minutes=5))
        self.assertEqual(len(log2["changes"]), 0)

        # Display-to-checkout quote matches
        pricing = campaigns.get_effective_pricing(self.cur, server.PACKAGES, live_flags, now_utc=now_active)
        expected_disc = round(4490 * 0.8)
        self.assertEqual(pricing["packages"]["thai-8"]["effective_price"], expected_disc)
        self.assertEqual(pricing["packages"]["thai-8"]["strikethrough_price"], 4490)

        quote = campaigns.create_checkout_quote(self.cur, "student-alex", "thai-8", server.PACKAGES, live_flags, now_utc=now_active)
        self.assertEqual(quote["quoted_price"], expected_disc)

        # End campaign at 02:05 BKK (19:05 UTC)
        now_ended = datetime(2026, 11, 23, 19, 5, tzinfo=timezone.utc)
        log3 = campaigns.run_campaign_scheduler(self.cur, server.PACKAGES, live_flags, now_utc=now_ended)
        self.assertEqual(log3["changes"][0]["to"], "ended")

        # Existing transaction before campaign kept its original 4490 price
        after_tx_amount = self.cur.execute("SELECT amount_thb FROM transactions WHERE id = ?", (tx_before,)).fetchone()["amount_thb"]
        self.assertEqual(after_tx_amount, 4490)

    def test_09_campaign_safeguards_halt_on_bad_discount_and_missing_end(self):
        self.cur.execute("""
            INSERT INTO campaigns (id, name, campaign_type, status, start_at, end_at, timezone, description, config_json, banner_text, discount_percent, created_at, updated_at)
            VALUES ('c-bad', 'Bad 60%', 'price_promotion', 'scheduled', '2026-11-23T00:00:00', '2026-11-30T00:00:00', 'Asia/Bangkok', 'Too deep', '{"package_ids":["thai-8"]}', 'Bad!', 60, '2026-11-23T00:00:00Z', '2026-11-23T00:00:00Z')
        """)
        log = campaigns.run_campaign_scheduler(self.cur, server.PACKAGES, {"CAMPAIGNS_KILL_SWITCH": False, "CAMPAIGNS_DRY_RUN": True})
        self.assertEqual(log["status"], "halted_error")
        self.assertTrue(len(log["errors"]) > 0)

        # Missing end_at refused
        with self.assertRaises(ValueError):
            self.cur.execute("""
                INSERT INTO campaigns (id, name, campaign_type, status, start_at, end_at, timezone, description, config_json, banner_text, discount_percent, created_at, updated_at)
                VALUES ('c-noend', 'No End', 'homepage_banner', 'draft', '2026-11-23T00:00:00', '', 'Asia/Bangkok', 'No end', '{}', 'Hi', 0, '2026-11-23T00:00:00Z', '2026-11-23T00:00:00Z')
            """)
            campaigns.set_campaign_status(self.cur, "c-noend", "active")


if __name__ == "__main__":
    unittest.main(verbosity=2)
