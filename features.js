/**
 * Speako Languages — Modular Player Objectives (Phases 5a–5d) & Admin Campaigns UI
 * Every student feature is strictly gated by STATE.flags (default OFF).
 */

window.SPEAKO_FEATURES = (function () {
  let activeRecorder = null;
  let recordedChunks = [];

  function flags() {
    return (window.STATE && window.STATE.flags) || {};
  }

  function isOn(flagName) {
    return Boolean(flags()[flagName]);
  }

  // ---------------- PHASE 5A: STREAKS, XP, BADGES, WORD VAULT ----------------
  function renderDashboardGamification() {
    if (!isOn("MINDMAP_5A")) return "";
    const g = STATE.gamification || { streak: { current_streak: 0, longest_streak: 0 }, stars: 0, xp: 0, badges: [], word_vault: [] };
    const st = g.streak || { current_streak: 0, longest_streak: 0 };
    const earnedIds = new Set((g.badges || []).map((b) => b.badge_id));
    const allBadges = g.available_badges || [];

    return `
      <div class="card anim-up" style="margin-top:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:14px;background:#FFF7ED;border:1px solid #FED7AA;">
              <span style="font-size:22px;">🔥</span>
              <div>
                <div style="font-size:18px;font-weight:800;color:#C2410C;">${st.current_streak || 0} Day Streak</div>
                <div style="font-size:11.5px;color:#9A3412;">Best: ${st.longest_streak || 0} days</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:14px;background:#FEFCE8;border:1px solid #FEF08A;">
              <span style="font-size:22px;">⭐</span>
              <div>
                <div style="font-size:18px;font-weight:800;color:#A16207;">${g.stars || 0} Stars · ${g.xp || 0} XP</div>
                <div style="font-size:11.5px;color:#854D0E;">${(g.badges || []).length} / ${allBadges.length} Badges</div>
              </div>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-outline btn-sm" onclick="SPEAKO_FEATURES.openWordVaultModal()">📚 Word Vault (${(g.word_vault || []).length})</button>
            <button class="btn btn-primary btn-sm" onclick="SPEAKO_FEATURES.logDailyPractice()">✓ Log Today's Practice</button>
          </div>
        </div>
        ${
          allBadges.length > 0
            ? `<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">
                ${allBadges
                  .map((b) => {
                    const has = earnedIds.has(b.id);
                    return `<span class="pill-tag ${has ? "" : "gray"}" style="opacity:${has ? 1 : 0.55};" title="${esc(b.description)}">${b.icon} ${esc(b.title)}${has ? " ✓" : ""}</span>`;
                  })
                  .join("")}
              </div>`
            : ""
        }
      </div>
    `;
  }

  async function logDailyPractice() {
    try {
      const res = await api("/api/activity", { activity_type: "practice", ref_id: "dashboard" });
      STATE.gamification = res.gamification;
      showToast("Daily practice logged! Streak & XP updated.");
      renderCurrentPortal(false);
    } catch (e) {
      showToast(e.message);
    }
  }

  async function toggleVaultWord(courseId, lessonNumber, phrase) {
    if (!isOn("MINDMAP_5A")) return;
    const vault = (STATE.gamification && STATE.gamification.word_vault) || [];
    const existing = vault.find((w) => w.phrase === phrase && w.course_id === courseId);
    try {
      if (existing) {
        const res = await api("/api/vault/remove", { id: existing.id });
        STATE.gamification.word_vault = res.word_vault;
        showToast("Removed from Word Vault");
      } else {
        const res = await api("/api/vault/add", { course_id: courseId, lesson_number: lessonNumber, phrase });
        STATE.gamification = res.gamification || STATE.gamification;
        STATE.gamification.word_vault = res.word_vault;
        showToast("Saved to Word Vault ★");
      }
      renderCurrentPortal(false);
    } catch (e) {
      showToast(e.message);
    }
  }

  function openWordVaultModal(searchQuery = "") {
    if (!isOn("MINDMAP_5A")) return;
    const vault = (STATE.gamification && STATE.gamification.word_vault) || [];
    const q = (searchQuery || "").toLowerCase();
    const filtered = q ? vault.filter((w) => w.phrase.toLowerCase().includes(q) || (w.notes || "").toLowerCase().includes(q)) : vault;

    openModal(`
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <span class="pill-tag">📚 My Word Vault</span>
          <button class="btn btn-ghost btn-sm" onclick="closeModal()">✕ Close</button>
        </div>
        <h2 style="font-size:22px;">Saved Tricky Words (${vault.length})</h2>
        <input class="input" style="margin:12px 0;" placeholder="Search saved words..." value="${esc(searchQuery)}" oninput="SPEAKO_FEATURES.openWordVaultModal(this.value)" />
        ${
          filtered.length === 0
            ? `<div style="padding:24px;text-align:center;color:var(--muted);">No saved words match. Star any word in a lesson!</div>`
            : `<div style="display:flex;flex-direction:column;gap:8px;max-height:360px;overflow-y:auto;">
                ${filtered
                  .map(
                    (w) => `
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:12px;background:var(--bg);gap:10px;">
                    <div>
                      <strong>${esc(w.phrase)}</strong>
                      <div style="font-size:12px;color:var(--muted);">${esc(w.course_id)} · Lesson ${w.lesson_number}</div>
                    </div>
                    <div style="display:flex;gap:6px;">
                      <button class="btn btn-ghost btn-sm" onclick="SPEAKO_FEATURES.playPhraseAudio('${esc(w.phrase)}')">🔊</button>
                      <button class="btn btn-ghost btn-sm" style="color:#DC2626;" onclick="SPEAKO_FEATURES.removeVaultItem('${esc(w.id)}')">✕</button>
                    </div>
                  </div>
                `
                  )
                  .join("")}
              </div>`
        }
      </div>
    `);
  }

  async function removeVaultItem(id) {
    try {
      const res = await api("/api/vault/remove", { id });
      STATE.gamification.word_vault = res.word_vault;
      openWordVaultModal();
    } catch (e) {
      showToast(e.message);
    }
  }

  function playPhraseAudio(phrase) {
    if (window.SpeakoTTS && typeof window.SpeakoTTS.play === "function") {
      const ok = window.SpeakoTTS.play(phrase);
      if (ok) return;
    }
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(phrase);
      window.speechSynthesis.speak(u);
    } else {
      showToast("Audio playback unavailable on this device.");
    }
  }

  // ---------------- PHASE 5B: VOICE RECORDING, BEST SCORES, CUSTOM DECKS ----------------
  async function startOrStopRecording(courseId, lessonNumber, phrase, btnEl) {
    if (!isOn("MINDMAP_5B")) return;
    if (activeRecorder && activeRecorder.state === "recording") {
      activeRecorder.stop();
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast("Microphone recording is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunks = [];
      const startedAt = Date.now();
      activeRecorder = new MediaRecorder(stream);
      if (btnEl) btnEl.textContent = "⏹ Stop";

      activeRecorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) recordedChunks.push(ev.data);
      };
      activeRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (btnEl) btnEl.textContent = "🎙️ Record";
        const durationMs = Date.now() - startedAt;
        const blob = new Blob(recordedChunks, { type: activeRecorder.mimeType || "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const b64 = String(reader.result || "").split(",")[1] || "";
            const res = await api("/api/recordings/save", {
              course_id: courseId,
              lesson_number: lessonNumber,
              phrase,
              mime_type: blob.type || "audio/webm",
              audio_b64: b64,
              duration_ms: durationMs,
            });
            STATE.voice_recordings = res.voice_recordings;
            // Simple duration-match score (target ~1500ms-2500ms)
            const targetMs = Math.max(1000, phrase.length * 90);
            const diff = Math.abs(durationMs - targetMs);
            const score = Math.max(40, Math.round(100 - (diff / targetMs) * 50));
            const sres = await api("/api/scores/save", { course_id: courseId, phrase, score });
            STATE.phrase_scores = sres.phrase_scores;
            const sr = sres.score_result || {};
            showToast(`Saved! Score: ${sr.score}% (Best: ${sr.best_score}%${sr.improved ? " · New Best! 🎉" : ""})`);
          } catch (err) {
            showToast(err.message);
          }
        };
        reader.readAsDataURL(blob);
      };
      activeRecorder.start();
    } catch (err) {
      showToast("Microphone permission denied or unavailable.");
    }
  }

  function openCustomDecksModal() {
    if (!isOn("MINDMAP_5B")) return;
    const decks = STATE.custom_decks || [];
    openModal(`
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <span class="pill-tag">🃏 Custom Phrase Decks</span>
          <button class="btn btn-ghost btn-sm" onclick="closeModal()">✕ Close</button>
        </div>
        <h2 style="font-size:22px;">My Custom Decks (${decks.length})</h2>
        <div style="margin:12px 0;padding:12px;border-radius:12px;background:var(--bg);display:flex;flex-direction:column;gap:8px;">
          <input id="new-deck-title" class="input" placeholder="Deck name (e.g., Chiang Mai Trip)" />
          <textarea id="new-deck-items" class="input" rows="3" placeholder="One phrase per line..."></textarea>
          <button class="btn btn-primary btn-sm" onclick="SPEAKO_FEATURES.createCustomDeck()">+ Save Custom Deck</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;max-height:260px;overflow-y:auto;">
          ${decks
            .map(
              (d) => `
            <div style="padding:10px 12px;border-radius:12px;background:var(--bg);display:flex;justify-content:space-between;align-items:center;">
              <div>
                <strong>${esc(d.title)}</strong>
                <div style="font-size:12px;color:var(--muted);">${(d.items || []).length} phrases</div>
              </div>
              <button class="btn btn-ghost btn-sm" style="color:#DC2626;" onclick="SPEAKO_FEATURES.deleteCustomDeck('${esc(d.id)}')">Delete</button>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `);
  }

  async function createCustomDeck() {
    const title = document.getElementById("new-deck-title")?.value || "";
    const raw = document.getElementById("new-deck-items")?.value || "";
    const items = raw.split("\n").map((s) => s.trim()).filter(Boolean);
    try {
      const res = await api("/api/decks/save", { title, course_id: STATE.curriculumCourse || "thai", items });
      STATE.custom_decks = res.custom_decks;
      openCustomDecksModal();
    } catch (e) {
      showToast(e.message);
    }
  }

  async function deleteCustomDeck(id) {
    try {
      const res = await api("/api/decks/delete", { id });
      STATE.custom_decks = res.custom_decks;
      openCustomDecksModal();
    } catch (e) {
      showToast(e.message);
    }
  }

  // ---------------- PHASE 5C: MASCOT CUSTOMIZER & TOPICS ----------------
  function renderMascotAndTopicsCard() {
    if (!isOn("MINDMAP_5C")) return "";
    const prefs = STATE.preferences || { mascot_outfit: "default", mascot_accessory: "none", favorite_topics: [], catalog: { outfits: [], accessories: [] }, available_topics: [] };
    const outfitObj = (prefs.catalog?.outfits || []).find((o) => o.id === prefs.mascot_outfit) || { icon: "👕", label: "Classic Tee" };
    const accObj = (prefs.catalog?.accessories || []).find((a) => a.id === prefs.mascot_accessory) || { icon: "✨", label: "None" };
    return `
      <div class="card anim-up" style="margin-top:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div>
          <span class="pill-tag">🎨 Mascot &amp; Topics</span>
          <div style="margin-top:6px;font-size:14px;">
            Outfit: <strong>${outfitObj.icon} ${esc(outfitObj.label)}</strong> · Accessory: <strong>${accObj.icon} ${esc(accObj.label)}</strong>
          </div>
          <div style="font-size:12.5px;color:var(--muted);margin-top:4px;">
            Topics: ${(prefs.favorite_topics || []).length ? prefs.favorite_topics.map(esc).join(", ") : "None selected yet"}
          </div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="SPEAKO_FEATURES.openCustomizeModal()">Customize Mascot &amp; Topics</button>
      </div>
    `;
  }

  function openCustomizeModal() {
    if (!isOn("MINDMAP_5C")) return;
    const prefs = STATE.preferences || { mascot_outfit: "default", mascot_accessory: "none", favorite_topics: [], catalog: { outfits: [], accessories: [] }, available_topics: [] };
    const selectedTopics = new Set(prefs.favorite_topics || []);
    openModal(`
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <span class="pill-tag">🎨 Customize Mascot &amp; Topics</span>
          <button class="btn btn-ghost btn-sm" onclick="closeModal()">✕ Close</button>
        </div>
        <label style="font-size:13px;font-weight:700;">Mascot Outfit</label>
        <select id="pref-outfit" class="input" style="margin:6px 0 12px;">
          ${(prefs.catalog?.outfits || []).map((o) => `<option value="${esc(o.id)}" ${o.id === prefs.mascot_outfit ? "selected" : ""}>${o.icon} ${esc(o.label)}</option>`).join("")}
        </select>
        <label style="font-size:13px;font-weight:700;">Mascot Accessory</label>
        <select id="pref-acc" class="input" style="margin:6px 0 12px;">
          ${(prefs.catalog?.accessories || []).map((a) => `<option value="${esc(a.id)}" ${a.id === prefs.mascot_accessory ? "selected" : ""}>${a.icon} ${esc(a.label)}</option>`).join("")}
        </select>
        <label style="font-size:13px;font-weight:700;">Favorite Topics</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 12px;">
          ${(prefs.available_topics || [])
            .map(
              (t) => `<label style="display:inline-flex;align-items:center;gap:4px;padding:6px 10px;border-radius:99px;background:var(--bg);font-size:12.5px;cursor:pointer;">
                <input type="checkbox" class="pref-topic-cb" value="${esc(t.id)}" ${selectedTopics.has(t.id) ? "checked" : ""} /> ${esc(t.label)}
              </label>`
            )
            .join("")}
        </div>
        <label style="font-size:13px;font-weight:700;">Optional Free-Text Goal</label>
        <input id="pref-goal" class="input" style="margin:6px 0 14px;" value="${esc(STATE.user?.learning_goal || "")}" placeholder="Optional personal goal..." />
        <button class="btn btn-primary" style="width:100%;" onclick="SPEAKO_FEATURES.savePreferences()">Save Preferences</button>
      </div>
    `);
  }

  async function savePreferences() {
    const mascot_outfit = document.getElementById("pref-outfit")?.value || "default";
    const mascot_accessory = document.getElementById("pref-acc")?.value || "none";
    const favorite_topics = Array.from(document.querySelectorAll(".pref-topic-cb:checked")).map((el) => el.value);
    const learning_goal = document.getElementById("pref-goal")?.value || "";
    try {
      const res = await api("/api/preferences/save", { mascot_outfit, mascot_accessory, favorite_topics, learning_goal });
      STATE.preferences = res.preferences;
      if (STATE.user) STATE.user.learning_goal = learning_goal;
      closeModal();
      showToast("Mascot & topics saved!");
      renderCurrentPortal(false);
    } catch (e) {
      showToast(e.message);
    }
  }

  // ---------------- PHASE 5D: SOCIAL (FLAG OFF BY DEFAULT) ----------------
  function renderSocialCard() {
    if (!isOn("MINDMAP_5D_SOCIAL")) return "";
    const lb = STATE.leaderboard_weekly || [];
    const notes = STATE.study_notes || [];
    const sp = STATE.social_profile || { leaderboard_opt_out: false };
    return `
      <div class="card anim-up" style="margin-top:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <h3>🤝 Class Community</h3>
          <label style="font-size:12.5px;display:flex;align-items:center;gap:6px;cursor:pointer;">
            <input type="checkbox" ${sp.leaderboard_opt_out ? "checked" : ""} onchange="SPEAKO_FEATURES.toggleLeaderboardOptOut(this.checked)" />
            Opt out of leaderboard
          </label>
        </div>
        <div class="grid-2" style="margin-top:14px;gap:16px;">
          <div>
            <strong style="font-size:13px;">🏆 Weekly XP Leaderboard</strong>
            <div style="margin-top:8px;display:flex;flex-direction:column;gap:6px;">
              ${lb.slice(0, 5).map((r, i) => `<div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 10px;border-radius:8px;background:var(--bg);"><span>#${i + 1} ${esc(r.name)}</span><strong>${r.xp} XP</strong></div>`).join("") || "<div style='color:var(--muted);font-size:13px;'>No entries yet.</div>"}
            </div>
          </div>
          <div>
            <strong style="font-size:13px;">💬 Shared Study Notes</strong>
            <div style="margin-top:8px;display:flex;gap:6px;">
              <input id="social-note-input" class="input" placeholder="Share a quick study tip..." />
              <button class="btn btn-primary btn-sm" onclick="SPEAKO_FEATURES.postStudyNote()">Post</button>
            </div>
            <div style="margin-top:8px;display:flex;flex-direction:column;gap:6px;max-height:180px;overflow-y:auto;">
              ${notes.slice(0, 5).map((n) => `<div style="font-size:12.5px;padding:8px 10px;border-radius:8px;background:var(--bg);display:flex;justify-content:space-between;gap:8px;"><span><strong>${esc(n.author_name)}:</strong> ${esc(n.content)}</span><button class="btn btn-ghost btn-sm" onclick="SPEAKO_FEATURES.cheerNote('${esc(n.id)}')">👏 ${n.cheers_count || 0}</button></div>`).join("")}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function toggleLeaderboardOptOut(optOut) {
    try {
      const res = await api("/api/social/profile", { leaderboard_opt_out: optOut });
      STATE.social_profile = res.social_profile;
      await refreshState();
      renderCurrentPortal(false);
    } catch (e) {
      showToast(e.message);
    }
  }

  async function postStudyNote() {
    const content = document.getElementById("social-note-input")?.value || "";
    try {
      const res = await api("/api/social/notes/create", { content });
      STATE.study_notes = res.study_notes;
      renderCurrentPortal(false);
    } catch (e) {
      showToast(e.message);
    }
  }

  async function cheerNote(noteId) {
    try {
      await api("/api/social/notes/cheer", { note_id: noteId });
      await refreshState();
      renderCurrentPortal(false);
    } catch (e) {
      showToast(e.message);
    }
  }

  // ---------------- PART 2: ADMIN CAMPAIGNS ----------------
  function renderAdminCampaigns(main) {
    const camps = STATE.campaigns || [];
    const logs = STATE.campaign_logs || [];
    const f = flags();
    const killOn = Boolean(f.CAMPAIGNS_KILL_SWITCH !== false);
    const dryOn = Boolean(f.CAMPAIGNS_DRY_RUN !== false);

    main.innerHTML = `
      <div class="page-hero">
        <div>
          <span class="pill-tag">Automated Promotions</span>
          <h1 style="margin-top:8px;">Campaigns &amp; Safeguards</h1>
          <p>Dry-run mode: <strong>${dryOn ? "ON (Safe)" : "OFF"}</strong> · Kill Switch: <strong>${killOn ? "ON (All Paused)" : "OFF"}</strong></p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn ${killOn ? "btn-primary" : "btn-dark"}" onclick="SPEAKO_FEATURES.toggleKillSwitch(${!killOn})">
            ${killOn ? "Resume Scheduler (Flip Kill Switch OFF)" : "🛑 PAUSE EVERYTHING (Kill Switch ON)"}
          </button>
          <button class="btn btn-outline" onclick="SPEAKO_FEATURES.runCampaignDryRun()">▶ Run Scheduler Check</button>
        </div>
      </div>

      <div class="card" style="margin-bottom:20px;">
        <h3>Campaigns (${camps.length})</h3>
        <div class="list-group" style="margin-top:12px;">
          ${camps
            .map(
              (c) => `
            <div class="list-row">
              <div>
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                  <strong>${esc(c.name)}</strong>
                  <span class="pill-tag">${esc(c.status)}</span>
                  <span class="pill-tag gray">${esc(c.campaign_type)}</span>
                  ${c.discount_percent > 0 ? `<span class="pill-tag amber">${c.discount_percent}% off</span>` : ""}
                </div>
                <div style="font-size:12.5px;color:var(--muted);margin-top:4px;">
                  ${esc(c.start_at)} → ${esc(c.end_at || "NO END DATE")} (${esc(c.timezone)}) · ${esc(c.description)}
                </div>
              </div>
              <div style="display:flex;gap:6px;">
                <button class="btn btn-ghost btn-sm" onclick="SPEAKO_FEATURES.previewCampaign('${esc(c.id)}')">Preview</button>
                ${
                  c.status === "paused"
                    ? `<button class="btn btn-outline btn-sm" onclick="SPEAKO_FEATURES.setCampaignStatus('${esc(c.id)}','scheduled')">Resume</button>`
                    : `<button class="btn btn-outline btn-sm" onclick="SPEAKO_FEATURES.setCampaignStatus('${esc(c.id)}','paused')">Pause</button>`
                }
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      <div class="card">
        <h3>Scheduler Run Logs (${logs.length})</h3>
        <div class="list-group" style="margin-top:12px;">
          ${
            logs.length === 0
              ? `<div style="padding:16px;color:var(--muted);">No runs logged yet. Click "Run Scheduler Check" above.</div>`
              : logs
                  .map(
                    (l) => `
                <div class="list-row">
                  <div>
                    <strong>${esc(l.started_at)}</strong> · <span class="pill-tag">${esc(l.status)}</span>
                    <span class="pill-tag gray">dry_run=${l.dry_run ? "ON" : "OFF"}</span>
                    <span class="pill-tag gray">kill_switch=${l.kill_switch ? "ON" : "OFF"}</span>
                    <div style="font-size:12.5px;color:var(--muted);margin-top:4px;">
                      Changes: ${(l.changes || []).length} · Skips: ${(l.skips || []).length} · Errors: ${(l.errors || []).length}
                    </div>
                  </div>
                </div>
              `
                  )
                  .join("")
          }
        </div>
      </div>
    `;
  }

  async function toggleKillSwitch(enabled) {
    try {
      const res = await api("/api/admin/campaigns/kill-switch", { enabled });
      STATE.flags = res.flags;
      showToast(enabled ? "Kill switch ON — all campaigns paused." : "Kill switch OFF.");
      renderCurrentPortal(false);
    } catch (e) {
      showToast(e.message);
    }
  }

  async function runCampaignDryRun() {
    try {
      const res = await api("/api/admin/campaigns/run", {});
      STATE.campaigns = res.campaigns;
      STATE.campaign_logs = res.logs;
      showToast(`Scheduler run complete (${res.run_log?.status || "ok"})`);
      renderCurrentPortal(false);
    } catch (e) {
      showToast(e.message);
    }
  }

  async function setCampaignStatus(campaignId, status) {
    try {
      await api("/api/admin/campaigns/status", { campaign_id: campaignId, status });
      await refreshState();
      renderCurrentPortal(false);
    } catch (e) {
      showToast(e.message);
    }
  }

  function previewCampaign(campaignId) {
    const c = (STATE.campaigns || []).find((x) => x.id === campaignId);
    if (!c) return;
    openModal(`
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <span class="pill-tag">Campaign Preview</span>
          <button class="btn btn-ghost btn-sm" onclick="closeModal()">✕ Close</button>
        </div>
        <h3>Homepage Banner Preview</h3>
        <div style="margin:10px 0 18px;padding:14px 16px;border-radius:14px;background:var(--navy);color:#fff;">
          <strong>${esc(c.banner_text || c.name)}</strong>
        </div>
        <h3>Pricing Page Preview</h3>
        <p style="font-size:13.5px;color:var(--muted);margin-top:6px;">
          Discount: <strong>${c.discount_percent || 0}%</strong> · Window: ${esc(c.start_at)} to ${esc(c.end_at || "N/A")} (${esc(c.timezone)})
        </p>
      </div>
    `);
  }

  return {
    isOn,
    renderDashboardGamification,
    logDailyPractice,
    toggleVaultWord,
    openWordVaultModal,
    removeVaultItem,
    playPhraseAudio,
    startOrStopRecording,
    openCustomDecksModal,
    createCustomDeck,
    deleteCustomDeck,
    renderMascotAndTopicsCard,
    openCustomizeModal,
    savePreferences,
    renderSocialCard,
    toggleLeaderboardOptOut,
    postStudyNote,
    cheerNote,
    renderAdminCampaigns,
    toggleKillSwitch,
    runCampaignDryRun,
    setCampaignStatus,
    previewCampaign,
  };
})();
