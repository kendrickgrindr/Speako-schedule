/**
 * Speako Languages — Role-Separated Private Portal Engine
 * Pages:
 *   - /index.html   -> Private Sign In & Student Sign-Up Gateway (auto-routes by role)
 *   - /student.html -> Private Student Portal (only their own schedule, booking, class details/slides, credits & refunds)
 *   - /teacher.html -> Teacher Workspace (student schedules, fix/reschedule/cancel, availability hours, slides)
 *   - /admin.html   -> Main Admin Control Center (all accounts, credits/packages, trash/recover, all schedules, teachers, email alerts)
 */

const PORTAL_PAGES = {
  student: "student.html",
  teacher: "teacher.html",
  admin: "admin.html",
};

const ALL_HOURS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00"
];

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATE = {
  portal: document.body.dataset.portal || "login",
  token: localStorage.getItem("speako_token") || "",
  tab: "",
  authMode: "signin", // 'signin' | 'signup'
  user: null,
  teachers: [],
  busy: [],
  bookings: [],
  transactions: [],
  notifications: [],
  users: [],
  students: [],
  my_teacher: null,
  notify_emails: ["lastpiyah@icloud.com", "lastpiyah@gmail.com"],
  main_admin_id: "admin-main",

  // Booking wizard state (Student)
  bookTeacherId: "teacher-piya",
  bookCourseId: "thai",
  bookLessonNum: 1,
  bookDateOffset: 0,
  bookSelectedDate: "",
  bookSelectedTime: "10:00",
  bookSelectedPackageId: "",
  bookNotes: "",

  // Curriculum & Pricing filter
  curriculumCourse: "thai",
  pricingCourse: "thai",

  // Admin filters
  adminRoleFilter: "all",
  adminSearch: "",
  adminShowTrash: false,

  // Student Portal UI states (in-memory only, no localStorage)
  prepChecklist: { 0: false, 1: false, 2: false },
  confirmCancelBookingId: "",

  // Interactive Thai Survival Kit state (in-memory only)
  skSituationId: "",
  skMode: "cards", // 'cards' | 'phrases' | 'quiz' | 'result'
  skQuizQuestions: [],
  skQuizIdx: 0,
  skQuizScore: 0,
  skQuizSelected: "",
  skFailedAudio: {},
};

const PREP_CHECKLIST_ITEMS = [
  "Test your mic and camera",
  "Have a notebook ready",
  "Find a quiet place",
];

const SURVIVAL_AUDIO_BASE = "/audio/";
const SURVIVAL_KIT_DATA = {
  "ordering-food": {
    id: "ordering-food",
    title: "Ordering food",
    icon: "🍜",
    phrases: [
      { thai: "ขอเมนูหน่อยครับ/ค่ะ", romanization: "khǒr mee-nuu nòi khrap/kha", meaning: "Can I have the menu, please?", audioUrl: `${SURVIVAL_AUDIO_BASE}ordering-food-1.mp3` },
      { thai: "เอาอันนี้ครับ/ค่ะ", romanization: "ao an níi khrap/kha", meaning: "I'll have this one.", audioUrl: `${SURVIVAL_AUDIO_BASE}ordering-food-2.mp3` },
      { thai: "ไม่เผ็ดนะครับ/คะ", romanization: "mâi phèt ná khrap/kha", meaning: "Not spicy, please.", audioUrl: `${SURVIVAL_AUDIO_BASE}ordering-food-3.mp3` },
      { thai: "ขอน้ำเปล่าหนึ่งขวดครับ/ค่ะ", romanization: "khǒr náam plàao nùeng khùat khrap/kha", meaning: "One bottle of water, please.", audioUrl: `${SURVIVAL_AUDIO_BASE}ordering-food-4.mp3` },
      { thai: "เช็คบิลด้วยครับ/ค่ะ", romanization: "chék bin dûai khrap/kha", meaning: "The bill, please.", audioUrl: `${SURVIVAL_AUDIO_BASE}ordering-food-5.mp3` },
    ],
  },
  "taking-a-taxi": {
    id: "taking-a-taxi",
    title: "Taking a taxi",
    icon: "🚕",
    phrases: [
      { thai: "ไปสนามบินได้ไหมครับ/คะ", romanization: "pai sà-nǎam-bin dâi mǎi khrap/kha", meaning: "Can you go to the airport?", audioUrl: `${SURVIVAL_AUDIO_BASE}taking-a-taxi-1.mp3` },
      { thai: "เปิดมิเตอร์ด้วยครับ/ค่ะ", romanization: "pòet mí-dtôe dûai khrap/kha", meaning: "Please use the meter.", audioUrl: `${SURVIVAL_AUDIO_BASE}taking-a-taxi-2.mp3` },
      { thai: "เลี้ยวซ้ายตรงนี้ครับ/ค่ะ", romanization: "líao sáai dtrong níi khrap/kha", meaning: "Turn left here.", audioUrl: `${SURVIVAL_AUDIO_BASE}taking-a-taxi-3.mp3` },
      { thai: "จอดตรงนี้ครับ/ค่ะ", romanization: "jòt dtrong níi khrap/kha", meaning: "Stop here, please.", audioUrl: `${SURVIVAL_AUDIO_BASE}taking-a-taxi-4.mp3` },
      { thai: "เท่าไหร่ครับ/คะ", romanization: "thâo-rài khrap/kha", meaning: "How much is it?", audioUrl: `${SURVIVAL_AUDIO_BASE}taking-a-taxi-5.mp3` },
    ],
  },
  "meeting-parents": {
    id: "meeting-parents",
    title: "Meeting a friend’s parents",
    icon: "🙏",
    phrases: [
      { thai: "สวัสดีครับ/ค่ะ", romanization: "sà-wàt-dii khrap/kha", meaning: "Hello (polite greeting).", audioUrl: `${SURVIVAL_AUDIO_BASE}meeting-parents-1.mp3` },
      { thai: "ยินดีที่ได้รู้จักครับ/ค่ะ", romanization: "yin-dii thîi dâi rúu-jàk khrap/kha", meaning: "Nice to meet you.", audioUrl: `${SURVIVAL_AUDIO_BASE}meeting-parents-2.mp3` },
      { thai: "ขอบคุณที่เชิญมานะครับ/คะ", romanization: "khòp-khun thîi choen maa ná khrap/kha", meaning: "Thank you for inviting me.", audioUrl: `${SURVIVAL_AUDIO_BASE}meeting-parents-3.mp3` },
      { thai: "อาหารอร่อยมากครับ/ค่ะ", romanization: "aa-hǎan à-ròi mâak khrap/kha", meaning: "The food is delicious.", audioUrl: `${SURVIVAL_AUDIO_BASE}meeting-parents-4.mp3` },
      { thai: "ขอตัวก่อนนะครับ/คะ", romanization: "khǒr dtua gòn ná khrap/kha", meaning: "Please excuse me, I have to go.", audioUrl: `${SURVIVAL_AUDIO_BASE}meeting-parents-5.mp3` },
    ],
  },
  "shopping-market": {
    id: "shopping-market",
    title: "Shopping at a market",
    icon: "🛍️",
    phrases: [
      { thai: "อันนี้เท่าไหร่ครับ/คะ", romanization: "an níi thâo-rài khrap/kha", meaning: "How much is this?", audioUrl: `${SURVIVAL_AUDIO_BASE}shopping-market-1.mp3` },
      { thai: "ขอดูหน่อยได้ไหมครับ/คะ", romanization: "khǒr duu nòi dâi mǎi khrap/kha", meaning: "Can I take a look?", audioUrl: `${SURVIVAL_AUDIO_BASE}shopping-market-2.mp3` },
      { thai: "แพงไปหน่อยครับ/ค่ะ", romanization: "phaeng pai nòi khrap/kha", meaning: "It's a bit expensive.", audioUrl: `${SURVIVAL_AUDIO_BASE}shopping-market-3.mp3` },
      { thai: "ลดได้ไหมครับ/คะ", romanization: "lót dâi mǎi khrap/kha", meaning: "Can you give me a discount?", audioUrl: `${SURVIVAL_AUDIO_BASE}shopping-market-4.mp3` },
      { thai: "เอาสองอันครับ/ค่ะ", romanization: "ao sǒng an khrap/kha", meaning: "I'll take two.", audioUrl: `${SURVIVAL_AUDIO_BASE}shopping-market-5.mp3` },
    ],
  },
};

function formatConsistentDateTime(dateStr, timeSlot) {
  const dt = new Date(`${dateStr}T${timeSlot || "00:00"}:00+07:00`);
  if (isNaN(dt.getTime())) return `${dateStr}, ${timeSlot}`;
  const wk = dt.toLocaleDateString("en-GB", { weekday: "short", timeZone: "Asia/Bangkok" });
  const day = dt.toLocaleDateString("en-GB", { day: "2-digit", timeZone: "Asia/Bangkok" });
  const mon = dt.toLocaleDateString("en-GB", { month: "short", timeZone: "Asia/Bangkok" });
  return `${wk} ${day} ${mon}, ${timeSlot}`;
}

function getLessonCountdown(dateStr, timeSlot) {
  const targetMs = new Date(`${dateStr}T${timeSlot || "00:00"}:00+07:00`).getTime();
  if (isNaN(targetMs)) return { label: "", state: "future" };
  const diffMin = Math.floor((targetMs - Date.now()) / 60000);
  if (diffMin <= 0 && diffMin > -60) return { label: "In progress", state: "live" };
  if (diffMin <= -60) return { label: "Completed", state: "past" };
  if (diffMin < 15) return { label: "Starts soon", state: "soon" };
  const days = Math.floor(diffMin / 1440);
  const hours = Math.floor((diffMin % 1440) / 60);
  const mins = diffMin % 60;
  if (days > 0) return { label: `Starts in ${days} day${days > 1 ? "s" : ""} ${hours} hr`, state: "future" };
  if (hours > 0) return { label: `Starts in ${hours} hr ${mins} min`, state: "future" };
  return { label: `Starts in ${mins} min`, state: "future" };
}

function getLessonObj(courseId, lessonNum) {
  const course = getCourse(courseId);
  const lessons = course?.lessons || [];
  return lessons.find((l) => Number(l.number) === Number(lessonNum)) || lessons[0] || null;
}

function getLessonGoalText(courseId, lessonNum) {
  const found = getLessonObj(courseId, lessonNum);
  return found?.lessonGoal || found?.goal || "";
}

function syncModalLessonSelect(courseSelectId, lessonSelectId) {
  const cEl = document.getElementById(courseSelectId);
  const lEl = document.getElementById(lessonSelectId);
  if (!cEl || !lEl) return;
  const course = getCourse(cEl.value);
  const currentVal = Number(lEl.value) || 1;
  lEl.innerHTML = (course?.lessons || [])
    .map(
      (l) =>
        `<option value="${l.number}" ${l.number === currentVal ? "selected" : ""}>Lesson ${l.number}: ${esc(l.title)}</option>`
    )
    .join("");
}

// =========================================================
// UTILITIES & API CLIENT
// =========================================================
function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getCourse(courseId) {
  const courses = window.SPEAKO_DATA?.courses || {};
  if (Array.isArray(courses)) {
    return courses.find((c) => c.id === courseId) || courses[0];
  }
  return courses[courseId] || courses.thai || Object.values(courses)[0];
}

function asArray(val) {
  if (Array.isArray(val)) return val;
  if (val) return [String(val)];
  return [];
}

function getUpcomingDays(count = 7, startOffset = 0) {
  const out = [];
  const base = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + startOffset + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dow = d.toLocaleDateString("en-US", { weekday: "short" });
    const monthShort = d.toLocaleDateString("en-US", { month: "short" });
    out.push({
      dateStr: `${yyyy}-${mm}-${dd}`,
      dow,
      dom: d.getDate(),
      monthShort,
      fullLabel: `${dow}, ${monthShort} ${d.getDate()}`,
    });
  }
  return out;
}

function parseDateBadge(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (isNaN(d)) return { m: "DAY", d: "--", dow: "" };
  return {
    m: d.toLocaleDateString("en-US", { month: "short" }),
    d: d.getDate(),
    dow: d.toLocaleDateString("en-US", { weekday: "short" }),
  };
}

function encodeUserHeader(u) {
  if (!u || !u.id) return "";
  try {
    const raw = JSON.stringify({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || "",
      role: u.role || "student",
      timezone: u.timezone || "Thailand (GMT+7)",
      thai_credits: u.thai_credits || 0,
      english_credits: u.english_credits || 0,
      avatar: u.avatar || "ST",
    });
    return btoa(unescape(encodeURIComponent(raw)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  } catch (_) {
    return "";
  }
}

async function api(path, body = null) {
  const headers = { Accept: "application/json" };
  const tok = STATE.token || localStorage.getItem("speako_token") || "";
  if (tok) {
    STATE.token = tok;
    headers["Authorization"] = `Bearer ${tok}`;
  }
  const vault = localStorage.getItem("speako_vault_v3") || "";
  if (vault) {
    headers["X-Speako-Vault"] = vault;
  }
  let cachedUser = STATE.user;
  if (!cachedUser) {
    try {
      cachedUser = JSON.parse(localStorage.getItem("speako_user_cache") || "null");
    } catch (_) {}
  }
  const userHdr = encodeUserHeader(cachedUser);
  if (userHdr) {
    headers["X-Speako-User"] = userHdr;
  }
  const opts = { method: body ? "POST" : "GET", headers };
  if (body) {
    headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(path, opts);
  const data = await res.json().catch(() => ({}));
  if (data && data.vault) {
    localStorage.setItem("speako_vault_v3", data.vault);
  }
  if (data && data.user) {
    localStorage.setItem("speako_user_cache", JSON.stringify(data.user));
  }
  if (!res.ok) {
    if (res.status === 401 && STATE.portal !== "login" && path === "/api/state") {
      localStorage.removeItem("speako_token");
      window.location.href = "index.html";
    }
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

function showToast(msg) {
  const wrap = document.getElementById("toast-container");
  if (!wrap) return;
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => {
    t.classList.add("fade-out");
    setTimeout(() => t.remove(), 260);
  }, 3400);
}

function openModal(html, fullscreen = false) {
  const bd = document.getElementById("modal-backdrop");
  const sheet = document.getElementById("modal-sheet");
  if (!bd || !sheet) return;
  bd.classList.remove("closing");
  sheet.className = fullscreen ? "modal-sheet fullscreen-deck" : "modal-sheet";
  sheet.innerHTML = html;
  bd.classList.add("open");
}

function closeModal() {
  const bd = document.getElementById("modal-backdrop");
  if (!bd || !bd.classList.contains("open")) return;
  bd.classList.add("closing");
  setTimeout(() => {
    bd.classList.remove("open", "closing");
    const sheet = document.getElementById("modal-sheet");
    if (sheet) sheet.innerHTML = "";
  }, 210);
}

function openSlideDeck(url, title) {
  openModal(
    `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding:0 6px;">
      <div>
        <span class="pill-tag">Interactive Slide Deck</span>
        <strong style="margin-left:10px;font-size:16px;">${esc(title)}</strong>
      </div>
      <div style="display:flex;gap:8px;">
        <a href="${esc(url)}" target="_blank" class="btn btn-ghost btn-sm">Open Full Tab ↗</a>
        <button class="btn btn-dark btn-sm" onclick="closeModal()">Done</button>
      </div>
    </div>
    <iframe class="deck-iframe" src="${esc(url)}" title="${esc(title)}"></iframe>
  `,
    true
  );
}

// =========================================================
// INITIALIZATION & STRICT ROLE GUARD
// =========================================================
async function initPortal() {
  const days = getUpcomingDays(7, 0);
  STATE.bookSelectedDate = days[1]?.dateStr || days[0].dateStr;

  if (STATE.portal === "login") {
    if (STATE.token) {
      try {
        const { user } = await api("/api/me");
        if (user && PORTAL_PAGES[user.role]) {
          window.location.href = PORTAL_PAGES[user.role];
          return;
        }
      } catch (_) {
        localStorage.removeItem("speako_token");
        STATE.token = "";
      }
    }
    renderLoginGateway();
    return;
  }

  // Protected role portals (student.html / teacher.html / admin.html)
  if (!STATE.token) {
    window.location.href = "index.html";
    return;
  }

  try {
    await refreshState();
  } catch (err) {
    localStorage.removeItem("speako_token");
    window.location.href = "index.html";
    return;
  }

  // Strict Role Separation Check: redirect if logged-in role doesn't match current page
  const actualRole = STATE.user?.role;
  if (actualRole !== STATE.portal) {
    window.location.href = PORTAL_PAGES[actualRole] || "index.html";
    return;
  }

  const defaultTabs = {
    student: "schedule",
    teacher: "schedule",
    admin: "accounts",
  };
  STATE.tab = defaultTabs[STATE.portal] || "schedule";
  updateTopNavbar();
  renderCurrentPortal(false);
}

async function refreshState() {
  const data = await api("/api/state");
  STATE.user = data.user;
  STATE.teachers = data.teachers || [];
  STATE.busy = data.busy || [];
  STATE.bookings = data.bookings || [];
  STATE.transactions = data.transactions || [];
  STATE.notifications = data.notifications || [];
  STATE.users = data.users || [];
  STATE.students = data.students || [];
  STATE.my_teacher = data.my_teacher || STATE.teachers[0] || null;
  if (data.notify_emails) STATE.notify_emails = data.notify_emails;
  if (data.main_admin_id) STATE.main_admin_id = data.main_admin_id;
  if (STATE.teachers.length && !STATE.teachers.some((t) => t.id === STATE.bookTeacherId)) {
    STATE.bookTeacherId = STATE.teachers[0].id;
  }
  updateTopNavbar();
}

function updateTopNavbar() {
  if (!STATE.user) return;
  const av = document.getElementById("nav-avatar");
  const nm = document.getElementById("nav-user-name");
  const cr = document.getElementById("nav-user-credits");
  if (av) {
    const isKendrick =
      STATE.portal === "teacher" ||
      STATE.portal === "admin" ||
      (STATE.user.name || "").toLowerCase().includes("kendrick");
    if (isKendrick) {
      av.classList.add("has-photo");
      av.innerHTML = `<img src="portrait.png" alt="Kendrick" />`;
    } else {
      av.classList.remove("has-photo");
      av.textContent = STATE.user.avatar || "SP";
    }
  }
  if (nm) nm.textContent = (STATE.user.name || "").split(" (")[0].split(" ")[0] || STATE.user.name;

  if (STATE.portal === "student" && cr) {
    const total = (STATE.user.thai_credits || 0) + (STATE.user.english_credits || 0);
    cr.textContent = `${total} cr`;
  } else if (STATE.portal === "teacher" && cr) {
    const upcomingCount = STATE.bookings.filter((b) => b.status === "confirmed").length;
    cr.textContent = `${upcomingCount}`;
  } else if (STATE.portal === "admin") {
    const unread = STATE.notifications.filter((n) => !n.is_read).length;
    const badge = document.getElementById("admin-unread-badge");
    if (badge) {
      badge.innerHTML = unread > 0 ? `<span class="notif-badge">${unread}</span>` : "";
    }
  }
}

function switchTab(tabName) {
  if (STATE.tab === tabName) return;
  STATE.tab = tabName;
  document.querySelectorAll(".seg-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
  renderCurrentPortal(true);
}

function renderCurrentPortal(withFade = false) {
  const main = document.getElementById("app-main");
  if (!main) return;

  const paint = () => {
    if (STATE.portal === "student") renderStudentPortal(main);
    else if (STATE.portal === "teacher") renderTeacherPortal(main);
    else if (STATE.portal === "admin") renderAdminPortal(main);
    else renderLoginGateway();
  };

  paint();
  if (withFade) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

async function signOut() {
  try {
    await api("/api/logout", {});
  } catch (_) {}
  localStorage.removeItem("speako_token");
  localStorage.removeItem("speako_user_cache");
  STATE.token = "";
  window.location.href = "index.html";
}

// =========================================================
// 1. PRIVATE LOGIN & SIGN-UP GATEWAY (/index.html)
//    + INTERACTIVE THAI SURVIVAL KIT (No signup required)
// =========================================================
function renderLoginGateway() {
  const main = document.getElementById("app-main");
  if (!main) return;

  main.innerHTML = `
    <div style="max-width:740px;width:100%;margin:0 auto;">
      <div style="max-width:460px;width:100%;margin:0 auto;" class="anim-up">
        <div style="text-align:center;margin-bottom:24px;">
          <img src="Speako logo.png" alt="Speako" style="width:52px;height:52px;object-fit:contain;margin-bottom:10px;" />
          <h1 style="font-size:clamp(26px,5vw,32px);">Speako Private Portal</h1>
          <p style="font-size:14.5px;color:var(--muted);margin-top:6px;">
            Sign in to your private account to view your 1-on-1 schedule, lessons, and class credits.
          </p>
        </div>

        <div class="card" style="padding:28px 22px;">
          <div class="segmented-nav" style="width:100%;margin-bottom:22px;">
            <button class="seg-btn ${STATE.authMode === "signin" ? "active" : ""}" style="flex:1;" onclick="STATE.authMode='signin';renderLoginGateway()">Sign In</button>
            <button class="seg-btn ${STATE.authMode === "signup" ? "active" : ""}" style="flex:1;" onclick="STATE.authMode='signup';renderLoginGateway()">Sign Up</button>
          </div>

          ${
            STATE.authMode === "signin"
              ? `
            <form onsubmit="handleSignIn(event)" style="display:flex;flex-direction:column;gap:15px;">
              <div>
                <label style="font-size:12.5px;font-weight:600;color:var(--muted);display:block;margin-bottom:6px;">Email Address</label>
                <input id="login-email" type="email" class="input-clean" placeholder="you@example.com" autocomplete="email" required />
              </div>
              <div>
                <label style="font-size:12.5px;font-weight:600;color:var(--muted);display:block;margin-bottom:6px;">Password</label>
                <input id="login-password" type="password" class="input-clean" placeholder="••••••••" autocomplete="current-password" required />
              </div>
              <button type="submit" class="btn btn-primary btn-lg" style="width:100%;margin-top:6px;">Sign In</button>
            </form>
          `
              : `
            <form onsubmit="handleSignUp(event)" style="display:flex;flex-direction:column;gap:13px;">
              <div>
                <label style="font-size:12.5px;font-weight:600;color:var(--muted);display:block;margin-bottom:5px;">Your Name</label>
                <input id="signup-name" type="text" class="input-clean" placeholder="e.g. Sarah Jenkins" required />
              </div>
              <div>
                <label style="font-size:12.5px;font-weight:600;color:var(--muted);display:block;margin-bottom:5px;">Email Address</label>
                <input id="signup-email" type="email" class="input-clean" placeholder="sarah@example.com" autocomplete="email" required />
              </div>
              <div>
                <label style="font-size:12.5px;font-weight:600;color:var(--muted);display:block;margin-bottom:5px;">WhatsApp / Phone (Optional)</label>
                <input id="signup-phone" type="text" class="input-clean" placeholder="+66 8X XXX XXXX" />
              </div>
              <div>
                <label style="font-size:12.5px;font-weight:600;color:var(--muted);display:block;margin-bottom:5px;">Password (min 6 characters)</label>
                <input id="signup-password" type="password" class="input-clean" placeholder="Create a private password" autocomplete="new-password" required minlength="6" />
              </div>
              <button type="submit" class="btn btn-primary btn-lg" style="width:100%;margin-top:4px;">Create Private Account</button>
            </form>
          `
          }

          <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--line);text-align:center;font-size:12.5px;color:var(--muted);">
            🔒 Your account and 1-on-1 class schedule are strictly private.
          </div>
        </div>
      </div>

      <!-- Interactive Thai Survival Kit (First-time visitors, no signup needed) -->
      <div id="survival-kit-mount" style="margin-top:32px;">
        ${renderThaiSurvivalKitSection()}
      </div>
    </div>
  `;
}

async function handleSignIn(e) {
  e.preventDefault();
  const email = document.getElementById("login-email")?.value.trim();
  const password = document.getElementById("login-password")?.value;
  await performLogin(email, password);
}

async function performLogin(email, password) {
  try {
    const res = await api("/api/login", { email, password });
    localStorage.setItem("speako_token", res.token);
    STATE.token = res.token;
    const target = PORTAL_PAGES[res.user.role] || "student.html";
    window.location.href = target;
  } catch (err) {
    showToast(err.message);
  }
}

async function handleSignUp(e) {
  e.preventDefault();
  const name = document.getElementById("signup-name")?.value.trim();
  const email = document.getElementById("signup-email")?.value.trim();
  const phone = document.getElementById("signup-phone")?.value.trim();
  const password = document.getElementById("signup-password")?.value;
  try {
    const res = await api("/api/signup", { name, email, phone, password });
    localStorage.setItem("speako_token", res.token);
    STATE.token = res.token;
    window.location.href = "student.html";
  } catch (err) {
    showToast(err.message);
  }
}

// =========================================================
// 2. STUDENT PORTAL (/student.html)
//    Strictly Private to the Logged-In Student:
//    - My Schedule & Timetable
//    - Book a Private 1-on-1 Class
//    - Class Details & Interactive Slides
//    - Credits, Packages & Refunds
// =========================================================
function renderStudentPortal(main) {
  if (STATE.tab === "schedule") renderStudentSchedule(main);
  else if (STATE.tab === "book") renderStudentBooking(main);
  else if (STATE.tab === "lessons") renderStudentLessons(main);
  else if (STATE.tab === "credits") renderStudentCredits(main);
}

function renderStudentSchedule(main) {
  const u = STATE.user;
  const upcoming = STATE.bookings.filter((b) => b.status === "confirmed");
  const past = STATE.bookings.filter((b) => b.status !== "confirmed");
  const nextClass = upcoming[0] || null;
  const teacher = STATE.teachers[0] || {
    id: "teacher-piya",
    name: "Kendrick",
    title: "Founder & Lead Thai / English Teacher",
    avatar: "portrait.png",
    availability: {},
  };

  const cd = nextClass ? getLessonCountdown(nextClass.date_str, nextClass.time_slot) : null;
  const isUrgentOrLive = cd && (cd.state === "soon" || cd.state === "live");
  const nextLessonObj = nextClass ? getLessonObj(nextClass.course_id, nextClass.lesson_number) : null;
  const lessonGoal = nextClass ? getLessonGoalText(nextClass.course_id, nextClass.lesson_number) : "";
  const totalCourseLessons = 8;
  const currentLessonNum = nextClass ? Math.min(totalCourseLessons, Math.max(1, Number(nextClass.lesson_number) || 1)) : 1;
  const progressRatio = (currentLessonNum / totalCourseLessons).toFixed(2);
  const hasEmptyCredit = (u.thai_credits || 0) <= 0 || (u.english_credits || 0) <= 0;

  main.innerHTML = `
    <div class="page-hero">
      <div>
        <span class="pill-tag">🔒 Private Portal</span>
        <h1 style="margin-top:8px;">Hi, ${esc(u.name.split(" ")[0])}.</h1>
        <p>Your private 1-on-1 schedule, timetable, and class credits.</p>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-ghost" onclick="switchTab('credits')">Credits</button>
        <button class="btn btn-primary" onclick="switchTab('book')">+ Book</button>
      </div>
    </div>

    <!-- Top Bento: Next Class + Remaining Credits -->
    <div class="bento-grid anim-up">
      ${
        nextClass
          ? `
        <div class="card next-class-card">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
              <span class="pill-tag dark"><span class="live-dot"></span> Next Class · ${esc(formatConsistentDateTime(nextClass.date_str, nextClass.time_slot))}</span>
              ${
                cd && cd.label
                  ? `<span id="next-class-countdown" class="np-countdown ${cd.state === "soon" ? "soon" : cd.state === "live" ? "live" : ""}">${esc(cd.label)}</span>`
                  : ""
              }
            </div>
            <h2 style="font-size:26px;margin-top:16px;">Lesson ${nextClass.lesson_number}: ${esc(nextClass.lesson_title)}</h2>
            ${lessonGoal ? `<p class="np-goal">${esc(lessonGoal)}</p>` : ""}
            <p style="color:rgba(255,255,255,0.78);font-size:14px;margin-top:8px;">
              ${esc(nextClass.course_title)} · Teacher: <strong>${esc(nextClass.teacher_name)}</strong>
            </p>

            <!-- Course Progress Bar -->
            <div class="np-progress">
              <div class="np-progress-label">
                <span>Lesson ${currentLessonNum} of ${totalCourseLessons}</span>
                <span>${Math.round((currentLessonNum / totalCourseLessons) * 100)}%</span>
              </div>
              <div class="np-progress-track">
                <div class="np-progress-fill" style="--p:${progressRatio};"></div>
              </div>
            </div>

            <!-- 3-Item Prep Checklist -->
            <ul class="np-checklist">
              ${PREP_CHECKLIST_ITEMS.map((item, idx) => {
                const done = !!STATE.prepChecklist[idx];
                return `
                  <li>
                    <button type="button" class="np-check ${done ? "done" : ""}" onclick="togglePrepChecklist(${idx})">
                      <span class="box">${done ? `<span>✓</span>` : ""}</span>
                      <span class="label">${esc(item)}</span>
                    </button>
                  </li>
                `;
              }).join("")}
            </ul>
          </div>

          <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:22px;align-items:center;">
            <a href="${esc(nextClass.meeting_link)}" target="_blank" rel="noopener" class="btn ${isUrgentOrLive ? "btn-primary btn-join-active" : "btn-white"}">Join ↗</a>
            ${
              nextLessonObj?.slideDeckUrl
                ? `<button class="btn btn-outline" onclick="openSlideDeck('${esc(nextLessonObj.slideDeckUrl)}','Lesson ${nextClass.lesson_number}: ${esc(nextClass.lesson_title)}')">Slides ↗</button>`
                : ""
            }
            <button class="btn btn-outline" onclick="openStudentLessonDetail('${esc(nextClass.course_id)}', ${nextClass.lesson_number})">Details</button>
          </div>
        </div>
      `
          : `
        <div class="card next-class-card">
          <div>
            <span class="pill-tag dark">Private 1-on-1</span>
            <h2 style="font-size:26px;margin-top:14px;">No upcoming class</h2>
            <p style="color:rgba(255,255,255,0.78);font-size:14.5px;margin-top:8px;max-width:460px;">
              Pick any open time slot on ${esc(teacher.name)}'s live weekly schedule to book your next lesson.
            </p>
          </div>
          <div style="margin-top:22px;display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="switchTab('book')">Book →</button>
            <button class="btn btn-outline" onclick="switchTab('lessons')">Lessons</button>
          </div>
        </div>
      `
      }

      <!-- Right Column: Empty-Credit Banner + Credits Summary -->
      <div style="display:flex;flex-direction:column;gap:14px;">
        ${
          hasEmptyCredit
            ? `
          <div class="credit-banner">
            <span><span class="dot"></span>You have no credits left. Top up to book your next lesson.</span>
            <button class="btn btn-primary btn-sm" onclick="switchTab('credits')">Top Up</button>
          </div>
        `
            : ""
        }
        <div class="card" style="flex:1;display:flex;flex-direction:column;justify-content:space-between;">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:12.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);">Credits</span>
              <button class="btn btn-ghost btn-sm" onclick="switchTab('credits')">+ Top Up</button>
            </div>
            <div class="grid-2" style="margin-top:16px;gap:12px;">
              <div style="padding:16px;border-radius:16px;background:rgba(255,255,255,0.55);">
                <div style="font-size:12px;font-weight:600;color:var(--muted);">🇹🇭 Thai</div>
                <div style="font-size:32px;font-weight:800;font-family:var(--font-display);margin-top:4px;color:var(--navy);">${u.thai_credits}</div>
                <div style="font-size:11.5px;color:var(--muted);">remaining</div>
              </div>
              <div style="padding:16px;border-radius:16px;background:rgba(255,255,255,0.55);">
                <div style="font-size:12px;font-weight:600;color:var(--muted);">🇬🇧 English</div>
                <div style="font-size:32px;font-weight:800;font-family:var(--font-display);margin-top:4px;color:var(--teal-dark);">${u.english_credits}</div>
                <div style="font-size:11.5px;color:var(--muted);">remaining</div>
              </div>
            </div>
          </div>
          <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;font-size:13px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div class="avatar-circle has-photo" style="width:32px;height:32px;">
                <img src="${esc(teacher.avatar || "portrait.png")}" alt="${esc(teacher.name)}" />
              </div>
              <span style="color:var(--muted);">Teacher: <strong style="color:var(--ink);">${esc(teacher.name)}</strong></span>
            </div>
            <span class="pill-tag">1-on-1</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Upcoming Bookings List -->
    <div style="margin-bottom:36px;" class="anim-up">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
        <h3 style="font-size:20px;">Upcoming (${upcoming.length})</h3>
        <span class="tz-note">Bangkok time (UTC+7)</span>
      </div>
      ${
        upcoming.length === 0
          ? `<div class="card" style="text-align:center;padding:36px;color:var(--muted);">No upcoming bookings yet.</div>`
          : `
        <div class="list-group">
          ${upcoming
            .map((b) => {
              const db = parseDateBadge(b.date_str);
              const isConfirming = STATE.confirmCancelBookingId === b.id;
              const bkLesson = getLessonObj(b.course_id, b.lesson_number);
              return `
              <div class="list-row">
                <div style="display:flex;align-items:center;gap:16px;">
                  <div class="date-badge">
                    <span class="m">${esc(db.m)}</span>
                    <span class="d">${esc(db.d)}</span>
                  </div>
                  <div>
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                      <span class="pill-tag">${b.course_id === "thai" ? "🇹🇭 Thai" : "🇬🇧 English"}</span>
                      <strong style="font-size:15.5px;">Lesson ${b.lesson_number}: ${esc(b.lesson_title)}</strong>
                    </div>
                    <div style="font-size:13px;color:var(--muted);margin-top:4px;">
                      <strong>${esc(formatConsistentDateTime(b.date_str, b.time_slot))}</strong> · ${esc(b.teacher_name)}
                    </div>
                  </div>
                </div>
                ${
                  isConfirming
                    ? `
                  <div class="cancel-confirm">
                    <span>Cancel this lesson? You’ll get 1 credit back.</span>
                    <button class="btn btn-primary btn-sm" style="background:var(--coral);border-color:transparent;" onclick="studentCancelBooking('${esc(b.id)}')">Yes, cancel</button>
                    <button class="btn btn-outline btn-sm" onclick="STATE.confirmCancelBookingId='';renderCurrentPortal(false)">Keep</button>
                  </div>
                `
                    : `
                  <div class="upcoming-actions">
                    <a href="${esc(b.meeting_link)}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">Join</a>
                    ${
                      bkLesson?.slideDeckUrl
                        ? `<button class="btn btn-outline btn-sm" onclick="openSlideDeck('${esc(bkLesson.slideDeckUrl)}','Lesson ${b.lesson_number}: ${esc(b.lesson_title)}')">Slides</button>`
                        : ""
                    }
                    <button class="btn btn-outline btn-sm" onclick="openStudentLessonDetail('${esc(b.course_id)}', ${b.lesson_number})">Details</button>
                    <button type="button" class="link-cancel" onclick="STATE.confirmCancelBookingId='${esc(b.id)}';renderCurrentPortal(false)">Cancel</button>
                  </div>
                `
                }
              </div>
            `;
            })
            .join("")}
        </div>
      `
      }
    </div>

    <!-- Interactive Weekly Timetable & Teacher Availability Matcher -->
    <div style="margin-bottom:36px;" class="anim-up">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
        <div>
          <h3 style="font-size:20px;">My Weekly Timetable &amp; ${esc(teacher.name)}'s Open Slots</h3>
          <p style="font-size:13.5px;color:var(--muted);">Click any teal <strong>+ Open</strong> slot to book your private 1-on-1 lesson at that time.</p>
        </div>
        <div style="display:flex;gap:12px;font-size:12.5px;align-items:center;flex-wrap:wrap;">
          <span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--navy);margin-right:5px;"></span>My Booked Class</span>
          <span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--teal);margin-right:5px;"></span>Open Slot</span>
        </div>
      </div>
      ${renderStudentWeeklyTimetable(teacher)}
    </div>

    <!-- Completed & Cancelled Class History + Teacher Feedback -->
    ${
      past.length > 0
        ? `
      <div class="anim-up">
        <h3 style="font-size:20px;margin-bottom:14px;">Past &amp; Cancelled Classes (${past.length})</h3>
        <div class="list-group">
          ${past
            .map((b) => {
              const db = parseDateBadge(b.date_str);
              const bkLesson = getLessonObj(b.course_id, b.lesson_number);
              return `
              <div class="list-row">
                <div style="display:flex;align-items:center;gap:16px;">
                  <div class="date-badge" style="opacity:0.7;">
                    <span class="m">${esc(db.m)}</span>
                    <span class="d">${esc(db.d)}</span>
                  </div>
                  <div>
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                      <strong style="font-size:15px;">Lesson ${b.lesson_number}: ${esc(b.lesson_title)}</strong>
                      <span class="pill-tag ${b.status === "completed" ? "" : "red"}">${esc(b.status)}</span>
                    </div>
                    <div style="font-size:13px;color:var(--muted);margin-top:3px;">
                      ${esc(formatConsistentDateTime(b.date_str, b.time_slot))} · Teacher: ${esc(b.teacher_name)}
                    </div>
                    ${
                      b.teacher_feedback
                        ? `<div style="margin-top:8px;padding:8px 12px;border-radius:10px;background:var(--teal-soft);color:var(--navy);font-size:13px;"><strong>Teacher Note:</strong> ${esc(b.teacher_feedback)}</div>`
                        : ""
                    }
                  </div>
                </div>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                  ${
                    bkLesson?.slideDeckUrl
                      ? `<button class="btn btn-outline btn-sm" onclick="openSlideDeck('${esc(bkLesson.slideDeckUrl)}','Lesson ${b.lesson_number}: ${esc(b.lesson_title)}')">Slides</button>`
                      : ""
                  }
                  <button class="btn btn-outline btn-sm" onclick="openStudentLessonDetail('${esc(b.course_id)}', ${b.lesson_number})">Details</button>
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
    `
        : ""
    }
  `;
}

function togglePrepChecklist(idx) {
  STATE.prepChecklist[idx] = !STATE.prepChecklist[idx];
  renderCurrentPortal(false);
}

function renderStudentWeeklyTimetable(teacher) {
  const days = getUpcomingDays(7, 0);
  const avail = teacher.availability || {};
  const hours = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "19:00", "20:00"];

  let html = `<div class="timetable-wrap"><div class="tt-grid">`;
  html += `<div class="tt-cell tt-head">UTC+7</div>`;
  for (const d of days) {
    html += `<div class="tt-cell tt-head"><span>${esc(d.dow)}</span><strong>${esc(d.monthShort)} ${d.dom}</strong></div>`;
  }

  for (const hr of hours) {
    html += `<div class="tt-cell" style="font-weight:600;color:var(--muted);background:#FAFAFC;">${hr}</div>`;
    for (const d of days) {
      const myBk = STATE.bookings.find(
        (b) => b.date_str === d.dateStr && b.time_slot === hr && b.status === "confirmed"
      );
      const slotUnavailable = STATE.busy.some(
        (b) => b.teacher_id === teacher.id && b.date_str === d.dateStr && b.time_slot === hr
      );
      const teacherOpen = (avail[d.dow] || []).includes(hr);

      if (myBk) {
        html += `<div class="tt-cell"><div class="tt-chip-booked" onclick="openStudentLessonDetail('${esc(myBk.course_id)}', ${myBk.lesson_number})" title="Lesson ${myBk.lesson_number}: ${esc(myBk.lesson_title)}">My Class · L${myBk.lesson_number}</div></div>`;
      } else if (teacherOpen && !slotUnavailable) {
        html += `<div class="tt-cell"><button class="tt-chip-open" onclick="jumpToBookSlot('${d.dateStr}','${hr}')">+ Open</button></div>`;
      } else {
        // Strictly private: never expose other students' bookings
        html += `<div class="tt-cell"><span style="color:var(--line-strong);">—</span></div>`;
      }
    }
  }
  html += `</div></div>`;
  return html;
}

function jumpToBookSlot(dateStr, timeSlot) {
  STATE.bookSelectedDate = dateStr;
  STATE.bookSelectedTime = timeSlot;
  switchTab("book");
}

async function studentCancelBooking(bookingId) {
  try {
    STATE.confirmCancelBookingId = "";
    await api("/api/booking/update", { booking_id: bookingId, action: "cancel" });
    await refreshState();
    renderCurrentPortal(false);
    showToast("Class cancelled — 1 lesson credit refunded to your account.");
  } catch (err) {
    showToast(err.message);
  }
}

// ---------------- STUDENT: BOOK A PRIVATE CLASS ----------------
function renderStudentBooking(main) {
  const teacher = STATE.teachers.find((t) => t.id === STATE.bookTeacherId) || STATE.teachers[0] || {
    id: "teacher-piya",
    name: "Kendrick",
    title: "Founder & Lead Thai / English Teacher",
    bio: "Live 1-on-1 Thai and English lessons tailored to your pace.",
    avatar: "portrait.png",
    availability: {},
  };
  const course = getCourse(STATE.bookCourseId);
  const lessons = course?.lessons || [];
  const days = getUpcomingDays(7, STATE.bookDateOffset);
  if (!days.some((d) => d.dateStr === STATE.bookSelectedDate)) {
    STATE.bookSelectedDate = days[0].dateStr;
  }
  const selectedDayObj = days.find((d) => d.dateStr === STATE.bookSelectedDate) || days[0];
  const rawSlots = (teacher?.availability || {})[selectedDayObj.dow] || [];
  // Filter to only open slots so other students' bookings are never exposed
  const openSlots = rawSlots.filter(
    (slot) =>
      !STATE.busy.some(
        (b) => b.teacher_id === teacher.id && b.date_str === STATE.bookSelectedDate && b.time_slot === slot
      )
  );
  if (openSlots.length && !openSlots.includes(STATE.bookSelectedTime)) {
    STATE.bookSelectedTime = openSlots[0];
  }

  const creditsForCourse =
    STATE.bookCourseId === "thai" ? STATE.user.thai_credits : STATE.user.english_credits;
  const pkgsForCourse = window.SPEAKO_DATA?.pricing?.[STATE.bookCourseId] || [];
  const selectedLessonObj = lessons.find((l) => l.number === STATE.bookLessonNum) || lessons[0] || {
    number: 1,
    title: "Lesson 1",
    goal: "",
  };

  main.innerHTML = `
    <div class="page-hero">
      <div>
        <span class="pill-tag">1-on-1 Private Booking</span>
        <h1 style="margin-top:8px;">Book Your Private Class</h1>
        <p>Choose your course, lesson topic, and preferred time with ${esc(teacher.name)}.</p>
      </div>
    </div>

    <!-- Meet Your Teacher Card -->
    <div class="card anim-up" style="margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
        <div style="display:flex;align-items:center;gap:18px;">
          <div class="teacher-photo-frame">
            <img src="${esc(teacher.avatar || "portrait.png")}" alt="${esc(teacher.name)}" />
          </div>
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span class="pill-tag">Your Teacher</span>
              <span style="font-size:13px;font-weight:600;color:var(--amber);">★★★★★ 5.0</span>
            </div>
            <h3 style="font-size:22px;margin-top:4px;">${esc(teacher.name)}</h3>
            <p style="font-size:13.5px;color:var(--muted);max-width:560px;margin-top:2px;">${esc(teacher.bio)}</p>
          </div>
        </div>
        ${
          STATE.teachers.length > 1
            ? `
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px;">Choose Teacher</label>
            <select class="input-clean" onchange="STATE.bookTeacherId=this.value;renderCurrentPortal(false)">
              ${STATE.teachers
                .map(
                  (t) =>
                    `<option value="${esc(t.id)}" ${t.id === teacher.id ? "selected" : ""}>${esc(t.name)} — ${esc(t.title)}</option>`
                )
                .join("")}
            </select>
          </div>
        `
            : `<span class="pill-tag">🔒 1-on-1 Private Session</span>`
        }
      </div>
    </div>

    <div class="bento-grid anim-up">
      <!-- Left: Course, Lesson, Date & Time -->
      <div class="card" style="display:flex;flex-direction:column;gap:24px;">
        <!-- 1. Choose Language Course -->
        <div>
          <label style="font-size:12.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);display:block;margin-bottom:10px;">
            1. Choose Course
          </label>
          <div class="choice-pills">
            <button type="button" class="choice-card ${STATE.bookCourseId === "thai" ? "selected" : ""}" onclick="STATE.bookCourseId='thai';STATE.bookSelectedPackageId='';renderCurrentPortal(false)">
              <div>
                <div style="font-weight:700;font-size:15px;">🇹🇭 Basic Thai</div>
                <div style="font-size:12.5px;color:var(--muted);">Daily &amp; Survival Speaking (8 Lessons)</div>
              </div>
              <span class="pill-tag">${STATE.user.thai_credits} credits</span>
            </button>
            <button type="button" class="choice-card ${STATE.bookCourseId === "english" ? "selected" : ""}" onclick="STATE.bookCourseId='english';STATE.bookSelectedPackageId='';renderCurrentPortal(false)">
              <div>
                <div style="font-weight:700;font-size:15px;">🇬🇧 Basic English</div>
                <div style="font-size:12.5px;color:var(--muted);">Daily Conversation &amp; Intro (8 Lessons)</div>
              </div>
              <span class="pill-tag">${STATE.user.english_credits} credits</span>
            </button>
          </div>
        </div>

        <!-- 2. Choose Lesson Topic -->
        <div>
          <label style="font-size:12.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);display:block;margin-bottom:8px;">
            2. Select Lesson Topic (Lessons 1–8)
          </label>
          <select class="input-clean" onchange="STATE.bookLessonNum=Number(this.value);renderCurrentPortal(false)">
            ${lessons
              .map(
                (l) =>
                  `<option value="${l.number}" ${l.number === STATE.bookLessonNum ? "selected" : ""}>Lesson ${l.number}: ${esc(l.title)} — ${esc(l.goal)}</option>`
              )
              .join("")}
          </select>
        </div>

        <!-- 3. Select Date -->
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <label style="font-size:12.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);">
              3. Pick a Date
            </label>
            <div style="display:flex;gap:6px;">
              <button type="button" class="btn btn-ghost btn-sm" ${STATE.bookDateOffset <= 0 ? "disabled" : ""} onclick="STATE.bookDateOffset=Math.max(0,STATE.bookDateOffset-7);renderCurrentPortal(false)">← Prev</button>
              <button type="button" class="btn btn-ghost btn-sm" onclick="STATE.bookDateOffset+=7;renderCurrentPortal(false)">Next 7 Days →</button>
            </div>
          </div>
          <div class="date-strip">
            ${days
              .map(
                (d) => `
              <button type="button" class="day-pill ${d.dateStr === STATE.bookSelectedDate ? "selected" : ""}" onclick="STATE.bookSelectedDate='${d.dateStr}';renderCurrentPortal(false)">
                <div class="dow">${esc(d.dow)}</div>
                <div class="dom">${d.dom}</div>
                <div class="dow" style="font-size:10px;">${esc(d.monthShort)}</div>
              </button>
            `
              )
              .join("")}
          </div>
        </div>

        <!-- 4. Select Teacher Available Time Slot -->
        <div>
          <label style="font-size:12.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);display:block;margin-bottom:10px;">
            4. Available Time Slots (${esc(selectedDayObj.fullLabel)} · GMT+7)
          </label>
          ${
            openSlots.length === 0
              ? `<div style="padding:18px;border-radius:14px;background:var(--bg);color:var(--muted);font-size:14px;">No open slots left on ${esc(selectedDayObj.fullLabel)}. Please select another day above.</div>`
              : `
            <div class="time-grid">
              ${openSlots
                .map((slot) => {
                  const isSelected = STATE.bookSelectedTime === slot;
                  return `
                  <button type="button" class="time-pill ${isSelected ? "selected" : ""}" onclick="STATE.bookSelectedTime='${slot}';renderCurrentPortal(false)">
                    ${slot}
                  </button>
                `;
                })
                .join("")}
            </div>
          `
          }
        </div>

        <!-- Optional Package Selection if student has 0 credits -->
        ${
          creditsForCourse <= 0
            ? `
          <div style="padding:18px;border-radius:18px;background:#FFF8EB;border:1px solid rgba(255,149,0,0.25);">
            <div style="font-weight:700;font-size:14px;color:#9A5B00;margin-bottom:6px;">
              You currently have 0 ${STATE.bookCourseId === "thai" ? "Thai" : "English"} credits.
            </div>
            <div style="font-size:13px;color:var(--muted);margin-bottom:12px;">
              You can book your class slot right now! Optionally select a package below — Kendrick will receive an email to continue with fees &amp; payment and add the credits to your account.
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${pkgsForCourse
                .map(
                  (p) => `
                <div class="choice-card ${STATE.bookSelectedPackageId === p.id ? "selected" : ""}" style="padding:12px 16px;" onclick="STATE.bookSelectedPackageId='${p.id}';renderCurrentPortal(false)">
                  <div>
                    <strong>${esc(p.title)}</strong> (${p.lessons} lesson${p.lessons > 1 ? "s" : ""})
                  </div>
                  <strong style="color:var(--navy);">฿${p.price.toLocaleString()}</strong>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }

        <div>
          <label style="font-size:12.5px;font-weight:600;color:var(--muted);display:block;margin-bottom:6px;">Private Note for ${esc(teacher.name)} (Optional)</label>
          <input type="text" class="input-clean" placeholder="e.g. I want to focus on pronunciation and ordering food" value="${esc(STATE.bookNotes)}" oninput="STATE.bookNotes=this.value" />
        </div>
      </div>

      <!-- Right: Summary Card -->
      <div class="card" style="display:flex;flex-direction:column;justify-content:space-between;height:fit-content;position:sticky;top:88px;">
        <div>
          <span class="pill-tag">🔒 Private 1-on-1 Summary</span>
          <h3 style="font-size:22px;margin-top:12px;">${esc(course?.shortTitle || "Course")}</h3>
          <p style="font-size:14px;color:var(--muted);margin-top:4px;">
            Lesson ${selectedLessonObj.number}: ${esc(selectedLessonObj.title)}
          </p>

          <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:12px;font-size:14px;">
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--muted);">Student</span>
              <strong>${esc(STATE.user.name)} (Private)</strong>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--muted);">Teacher</span>
              <strong>${esc(teacher.name)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--muted);">Date</span>
              <strong>${esc(STATE.bookSelectedDate)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--muted);">Time</span>
              <strong>${esc(STATE.bookSelectedTime)} (1 hr · GMT+7)</strong>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--muted);">Your Credits</span>
              <strong>${creditsForCourse > 0 ? `${creditsForCourse} available` : "0 (Admin will grant after payment)"}</strong>
            </div>
          </div>
        </div>

        <button class="btn btn-primary btn-lg" style="width:100%;margin-top:24px;" ${openSlots.length === 0 ? "disabled" : ""} onclick="submitStudentBooking()">
          Confirm Private Booking
        </button>
      </div>
    </div>
  `;
}

async function submitStudentBooking() {
  const course = getCourse(STATE.bookCourseId);
  const lessonObj = (course?.lessons || []).find((l) => l.number === STATE.bookLessonNum) || course?.lessons?.[0];
  try {
    const res = await api("/api/book", {
      teacher_id: STATE.bookTeacherId,
      course_id: STATE.bookCourseId,
      lesson_number: STATE.bookLessonNum,
      lesson_title: lessonObj?.title || `Lesson ${STATE.bookLessonNum}`,
      date_str: STATE.bookSelectedDate,
      time_slot: STATE.bookSelectedTime,
      package_id: STATE.bookSelectedPackageId || undefined,
      student_notes: STATE.bookNotes,
    });
    await refreshState();
    openModal(`
      <div style="text-align:center;padding:12px 6px;">
        <div class="apple-check-circle">✓</div>
        <span class="pill-tag">Confirmed &amp; Teacher Notified</span>
        <h2 style="font-size:26px;margin-top:10px;">Your Private Class is Booked!</h2>
        <p style="color:var(--muted);font-size:14.5px;margin-top:6px;">
          <strong>Lesson ${res.booking.lesson_number}: ${esc(res.booking.lesson_title)}</strong> with <strong>${esc(res.booking.teacher_name)}</strong>
        </p>
        <div style="margin:20px 0;padding:16px;border-radius:16px;background:var(--bg);font-size:14px;">
          <div><strong>Date:</strong> ${esc(res.booking.date_str)} at <strong>${esc(res.booking.time_slot)}</strong></div>
          <div style="margin-top:8px;font-size:13px;color:var(--ink);">
            ${
              res.pending_payment
                ? `<strong>Next Step (Fees &amp; Credits):</strong> An email has been sent to <strong>${esc(res.booking.teacher_name)}</strong> to follow up with you regarding fees &amp; payment, and then grant your lesson credits.`
                : `Your teacher has been notified by email and 1 lesson credit has been applied.`
            }
          </div>
        </div>
        <button class="btn btn-primary btn-lg" style="width:100%;" onclick="closeModal();switchTab('schedule')">View My Schedule</button>
      </div>
    `);
  } catch (err) {
    showToast(err.message);
  }
}

// ---------------- STUDENT: CLASS DETAILS & SLIDES ----------------
function renderStudentLessons(main) {
  const course = getCourse(STATE.curriculumCourse);
  const lessons = course?.lessons || [];

  main.innerHTML = `
    <div class="page-hero">
      <div>
        <span class="pill-tag">8-Lesson Structured Curriculum</span>
        <h1 style="margin-top:8px;">Class Details &amp; Interactive Slides</h1>
        <p>${esc(course?.subtitle || "Click any lesson to inspect vocabulary, grammar, role-plays, and interactive slide decks.")}</p>
      </div>
      <div class="segmented-nav">
        <button class="seg-btn ${STATE.curriculumCourse === "thai" ? "active" : ""}" onclick="STATE.curriculumCourse='thai';renderCurrentPortal(false)">🇹🇭 Basic Thai (8)</button>
        <button class="seg-btn ${STATE.curriculumCourse === "english" ? "active" : ""}" onclick="STATE.curriculumCourse='english';renderCurrentPortal(false)">🇬🇧 Basic English (8)</button>
      </div>
    </div>

    <div class="grid-2 anim-up">
      ${lessons
        .map((l) => {
          const hasSlide = Boolean(l.slideDeckUrl);
          const practicePreview = asArray(l.speakingPractice)[0] || "";
          return `
          <div class="card card-interactive" onclick="openStudentLessonDetail('${esc(course.id)}', ${l.number})">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;flex-wrap:wrap;">
              <span class="pill-tag">Lesson ${l.number} of 8</span>
              ${
                hasSlide
                  ? `<span class="pill-tag" style="background:#EEF2FF;color:#3730A3;">✦ Interactive Slide Deck + Audio</span>`
                  : `<span class="pill-tag gray">1-on-1 Lesson Plan</span>`
              }
            </div>
            <h3 style="font-size:20px;">${esc(l.title)}</h3>
            <p style="font-size:14px;color:var(--muted);margin-top:6px;">${esc(l.goal)}</p>

            <div style="margin-top:14px;display:flex;flex-wrap:wrap;gap:6px;">
              ${asArray(l.whatToTeach)
                .slice(0, 3)
                .map((item) => `<span style="font-size:12px;padding:4px 10px;border-radius:99px;background:var(--bg);color:var(--ink);">${esc(item)}</span>`)
                .join("")}
            </div>

            <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;gap:10px;">
              <span style="font-size:12.5px;color:var(--muted);">${esc(practicePreview)}</span>
              <span style="font-size:13px;font-weight:700;color:var(--teal-dark);white-space:nowrap;">View Details →</span>
            </div>
          </div>
        `;
        })
        .join("")}
    </div>
  `;
}

function openStudentLessonDetail(courseId, lessonNum) {
  const course = getCourse(courseId);
  const l = (course?.lessons || []).find((x) => x.number === Number(lessonNum));
  if (!l) return;

  const whatToTeach = asArray(l.whatToTeach);
  const grammarFocus = asArray(l.grammarFocus || l.patterns);
  const vocabulary = asArray(l.vocabulary);
  const speakingPractice = asArray(l.speakingPractice);
  const homework = asArray(l.homework);

  openModal(`
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span class="pill-tag">${courseId === "thai" ? "🇹🇭 Basic Thai" : "🇬🇧 Basic English"} · Lesson ${l.number} of 8</span>
        <button class="btn btn-ghost btn-sm" onclick="closeModal()">✕ Close</button>
      </div>
      <h2 style="font-size:26px;">Lesson ${l.number}: ${esc(l.title)}</h2>
      <p style="color:var(--muted);font-size:14.5px;margin-top:6px;"><strong>Lesson Goal:</strong> ${esc(l.goal)}</p>

      ${
        l.slideDeckUrl
          ? `
        <div style="margin-top:18px;padding:16px 18px;border-radius:16px;background:var(--teal-soft);display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
          <div>
            <strong style="color:var(--navy);">✦ Interactive Classroom Slide Deck + Audio</strong>
            <div style="font-size:12.5px;color:var(--muted);">Practice pronunciation, tone marks, and dialogues with built-in audio.</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="openSlideDeck('${esc(l.slideDeckUrl)}','Lesson ${l.number}: ${esc(l.title)}')">Launch Slide Deck ↗</button>
        </div>
      `
          : ""
      }

      <div style="margin-top:20px;display:flex;flex-direction:column;gap:14px;">
        <div style="padding:16px;border-radius:16px;background:var(--bg);">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">What You Will Learn</div>
          <ul style="padding-left:18px;font-size:14px;display:flex;flex-direction:column;gap:5px;">
            ${whatToTeach.map((v) => `<li>${esc(v)}</li>`).join("")}
          </ul>
        </div>

        <div class="grid-2" style="gap:12px;">
          <div style="padding:16px;border-radius:16px;background:var(--bg);min-width:0;">
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">Key Vocabulary</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              ${vocabulary.map((v) => `<span class="pill-tag vocab-pill">${esc(v)}</span>`).join("")}
            </div>
          </div>
          <div style="padding:16px;border-radius:16px;background:var(--bg);min-width:0;">
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">Grammar &amp; Sentence Focus</div>
            <ul style="padding-left:18px;font-size:13.5px;display:flex;flex-direction:column;gap:4px;">
              ${grammarFocus.map((g) => `<li>${esc(g)}</li>`).join("")}
            </ul>
          </div>
        </div>

        <div style="padding:16px;border-radius:16px;background:var(--bg);font-size:14px;">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:6px;">Live 1-on-1 Speaking Practice</div>
          <ul style="padding-left:18px;display:flex;flex-direction:column;gap:4px;">
            ${speakingPractice.map((s) => `<li>${esc(s)}</li>`).join("")}
          </ul>
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--muted);margin:12px 0 6px;">Homework &amp; Review</div>
          <ul style="padding-left:18px;display:flex;flex-direction:column;gap:4px;">
            ${homework.map((h) => `<li>${esc(h)}</li>`).join("")}
          </ul>
        </div>
      </div>

      <div style="margin-top:22px;display:flex;gap:10px;justify-content:flex-end;">
        ${
          STATE.portal === "student"
            ? `<button class="btn btn-primary" onclick="closeModal();STATE.bookCourseId='${esc(courseId)}';STATE.bookLessonNum=${l.number};switchTab('book')">Book This Lesson →</button>`
            : `<button class="btn btn-dark" onclick="closeModal()">Close</button>`
        }
      </div>
    </div>
  `);
}

// ---------------- STUDENT: CREDITS, PACKAGES & RECEIPTS ----------------
function renderStudentCredits(main) {
  const u = STATE.user;
  const pkgs = window.SPEAKO_DATA?.pricing?.[STATE.pricingCourse] || [];

  main.innerHTML = `
    <div class="page-hero">
      <div>
        <span class="pill-tag">Accounting &amp; Packages</span>
        <h1 style="margin-top:8px;">Credits, Packages &amp; Receipts</h1>
        <p>Select a lesson package below — Kendrick will receive an email to arrange fees &amp; payment and add the credits to your account.</p>
      </div>
      <div class="segmented-nav">
        <button class="seg-btn ${STATE.pricingCourse === "thai" ? "active" : ""}" onclick="STATE.pricingCourse='thai';renderCurrentPortal(false)">🇹🇭 Thai Packages</button>
        <button class="seg-btn ${STATE.pricingCourse === "english" ? "active" : ""}" onclick="STATE.pricingCourse='english';renderCurrentPortal(false)">🇬🇧 English Packages</button>
      </div>
    </div>

    <!-- Current Credit Balance Banner -->
    <div class="grid-2 anim-up" style="margin-bottom:28px;">
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <span class="pill-tag">🇹🇭 Thai Balance</span>
          <h2 style="font-size:36px;margin-top:8px;">${u.thai_credits} <span style="font-size:16px;font-weight:500;color:var(--muted);">lessons remaining</span></h2>
        </div>
        <button class="btn btn-primary btn-sm" onclick="STATE.bookCourseId='thai';switchTab('book')">Book Thai</button>
      </div>
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <span class="pill-tag">🇬🇧 English Balance</span>
          <h2 style="font-size:36px;margin-top:8px;">${u.english_credits} <span style="font-size:16px;font-weight:500;color:var(--muted);">lessons remaining</span></h2>
        </div>
        <button class="btn btn-primary btn-sm" onclick="STATE.bookCourseId='english';switchTab('book')">Book English</button>
      </div>
    </div>

    <!-- Official Pricing Cards -->
    <div class="grid-3 anim-up" style="margin-bottom:40px;">
      ${pkgs
        .map(
          (p) => `
        <div class="price-card ${p.darkCard ? "dark-trial" : ""}">
          ${p.featuredBadge ? `<div class="start-here-badge">${esc(p.featuredBadge)}</div>` : ""}
          <div>
            <span class="pill-tag ${p.darkCard ? "dark" : ""}">${esc(p.badge)}</span>
            <h3 style="font-size:22px;margin-top:12px;${p.darkCard ? "color:#fff;" : ""}">${esc(p.title)}</h3>
            <div style="margin-top:14px;display:flex;align-items:baseline;gap:6px;">
              <span class="price-amount">${esc(p.currency)}${p.price.toLocaleString()}</span>
              <span style="font-size:13px;opacity:0.75;">${esc(p.unit || p.currencySuffix || "THB")}</span>
            </div>
          </div>
          <ul class="price-features">
            ${(p.features || []).map((f) => `<li><span class="check-dot">✓</span><span>${esc(f)}</span></li>`).join("")}
          </ul>
          <button class="btn ${p.darkCard ? "btn-primary" : "btn-dark"}" style="width:100%;" onclick="studentPurchasePackage('${esc(p.id)}')">
            ${esc(p.cta)} (+${p.lessons})
          </button>
        </div>
      `
        )
        .join("")}
    </div>

    <!-- Invoices & Receipts -->
    <div class="anim-up">
      <h3 style="font-size:20px;margin-bottom:14px;">My Private Invoices &amp; Package Requests (${STATE.transactions.length})</h3>
      ${
        STATE.transactions.length === 0
          ? `<div class="card" style="text-align:center;color:var(--muted);padding:32px;">No package transactions yet.</div>`
          : `
        <div class="list-group">
          ${STATE.transactions
            .map(
              (tx) => `
            <div class="list-row">
              <div>
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                  <strong>${esc(tx.package_title)}</strong>
                  ${
                    tx.status === "pending_payment"
                      ? `<span class="pill-tag amber">⏳ Pending Payment · +${tx.lessons_added} credits on approval</span>`
                      : `<span class="pill-tag">✓ Paid · +${tx.lessons_added} credits</span>`
                  }
                  <span class="pill-tag gray">${esc(tx.invoice_no)}</span>
                </div>
                <div style="font-size:13px;color:var(--muted);margin-top:4px;">
                  ${esc(tx.created_at)} · ${esc(tx.payment_method)}
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:12px;">
                <strong style="font-size:16px;">฿${Number(tx.amount_thb).toLocaleString()}</strong>
                <button class="btn btn-ghost btn-sm" onclick="window.print()">Print Receipt</button>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `
      }
    </div>
  `;
}

async function studentPurchasePackage(packageId) {
  try {
    const res = await api("/api/purchase", { package_id: packageId, payment_method: "Pending Admin Payment" });
    await refreshState();
    renderCurrentPortal(false);
    const tx = res.transaction || {};
    STATE.bookCourseId = tx.course_type || STATE.pricingCourse || "thai";
    STATE.bookSelectedPackageId = packageId;
    openModal(`
      <div style="text-align:center;padding:12px 6px;">
        <div class="apple-check-circle">✓</div>
        <span class="pill-tag">Booking Request Emailed to Kendrick</span>
        <h2 style="font-size:25px;margin-top:10px;">${esc(tx.package_title || "Package Requested")}</h2>
        <p style="color:var(--muted);font-size:14.5px;margin-top:8px;">
          We have sent an email notification to <strong>Kendrick</strong> regarding your booking for
          <strong>${esc(tx.package_title)}</strong> (<strong>฿${Number(tx.amount_thb || 0).toLocaleString()} THB</strong>).
        </p>
        <div style="margin:18px 0;padding:16px;border-radius:16px;background:var(--bg);font-size:13.5px;color:var(--ink);text-align:left;">
          <div><strong>1. Fees &amp; Payment:</strong> Kendrick will contact you shortly to arrange payment.</div>
          <div style="margin-top:6px;"><strong>2. Credits Added by Admin:</strong> Once confirmed, Kendrick will add <strong>+${tx.lessons_added || 1} lesson credit${(tx.lessons_added || 1) > 1 ? "s" : ""}</strong> to your account.</div>
          <div style="margin-top:6px;"><strong>3. Schedule Your Class:</strong> You can also pick your preferred class date &amp; time right now!</div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-lg" style="flex:1;" onclick="closeModal()">Done</button>
          <button class="btn btn-primary btn-lg" style="flex:2;" onclick="closeModal();switchTab('book')">Pick Class Date &amp; Time →</button>
        </div>
      </div>
    `);
  } catch (err) {
    showToast(err.message);
  }
}

// =========================================================
// 3. TEACHER WORKSPACE (/teacher.html)
//    Duties: Student Schedules, Fix/Reschedule/Cancel, Availability Hours, Slides
// =========================================================
function renderTeacherPortal(main) {
  if (STATE.tab === "schedule") renderTeacherSchedule(main);
  else if (STATE.tab === "availability") renderTeacherAvailability(main);
  else if (STATE.tab === "students") renderTeacherStudents(main);
  else if (STATE.tab === "slides") renderTeacherSlides(main);
}

function renderTeacherSchedule(main) {
  const upcoming = STATE.bookings.filter((b) => b.status === "confirmed");
  const past = STATE.bookings.filter((b) => b.status !== "confirmed");

  main.innerHTML = `
    <div class="page-hero">
      <div>
        <span class="pill-tag">Teacher · ${esc(STATE.user.name)}</span>
        <h1 style="margin-top:8px;">Schedules</h1>
        <p>Manage, reschedule, complete, or cancel student classes.</p>
      </div>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-ghost" onclick="switchTab('availability')">Hours</button>
        <button class="btn btn-primary" onclick="openAssignClassModal()">+ Schedule</button>
      </div>
    </div>

    <!-- Upcoming Student Sessions -->
    <div style="margin-bottom:34px;" class="anim-up">
      <h3 style="font-size:20px;margin-bottom:14px;">Upcoming (${upcoming.length})</h3>
      ${
        upcoming.length === 0
          ? `<div class="card" style="text-align:center;color:var(--muted);padding:34px;">No upcoming classes.</div>`
          : `
        <div class="list-group">
          ${upcoming.map((b) => renderManagedBookingRow(b)).join("")}
        </div>
      `
      }
    </div>

    <!-- Completed & Cancelled Sessions -->
    ${
      past.length > 0
        ? `
      <div class="anim-up">
        <h3 style="font-size:20px;margin-bottom:14px;">History (${past.length})</h3>
        <div class="list-group">
          ${past.map((b) => renderManagedBookingRow(b)).join("")}
        </div>
      </div>
    `
        : ""
    }
  `;
}

function renderManagedBookingRow(b) {
  const db = parseDateBadge(b.date_str);
  const bkLesson = getLessonObj(b.course_id, b.lesson_number);
  return `
    <div class="list-row">
      <div style="display:flex;align-items:center;gap:16px;">
        <div class="date-badge">
          <span class="m">${esc(db.m)}</span>
          <span class="d">${esc(db.d)}</span>
        </div>
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span class="pill-tag">${b.course_id === "thai" ? "🇹🇭 Thai" : "🇬🇧 English"}</span>
            <strong style="font-size:15.5px;">${esc(b.student_name)}</strong>
            <span style="font-size:13px;color:var(--muted);">${esc(b.student_email)}</span>
            <span class="pill-tag ${b.status === "confirmed" ? "" : b.status === "completed" ? "gray" : "red"}">${esc(b.status)}</span>
          </div>
          <div style="font-size:13.5px;margin-top:4px;">
            Lesson ${b.lesson_number}: <strong>${esc(b.lesson_title)}</strong> · ${esc(b.date_str)} · <strong>${esc(b.time_slot)}</strong>
          </div>
          ${b.student_notes ? `<div style="font-size:12.5px;color:var(--muted);margin-top:3px;">Note: "${esc(b.student_notes)}"</div>` : ""}
          ${b.teacher_feedback ? `<div style="font-size:12.5px;color:var(--teal-dark);margin-top:3px;">Feedback: "${esc(b.teacher_feedback)}"</div>` : ""}
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        ${
          bkLesson?.slideDeckUrl
            ? `<button class="btn btn-outline btn-sm" onclick="openSlideDeck('${esc(bkLesson.slideDeckUrl)}','Lesson ${b.lesson_number}: ${esc(b.lesson_title)}')">Slides ↗</button>`
            : ""
        }
        <button class="btn btn-ghost btn-sm" onclick="openEditScheduleModal('${esc(b.id)}')">Edit</button>
        ${
          b.status === "confirmed"
            ? `
          <button class="btn btn-primary btn-sm" onclick="markBookingComplete('${esc(b.id)}')">Complete</button>
          <button class="btn btn-ghost btn-sm" style="color:var(--red);" onclick="cancelStudentBooking('${esc(b.id)}')">Cancel</button>
        `
            : ""
        }
      </div>
    </div>
  `;
}

function openEditScheduleModal(bookingId) {
  const b = STATE.bookings.find((x) => x.id === bookingId);
  if (!b) return;
  const course = getCourse(b.course_id);

  openModal(`
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <span class="pill-tag">Schedule Control</span>
        <button class="btn btn-ghost btn-sm" onclick="closeModal()">✕ Close</button>
      </div>
      <h2 style="font-size:24px;">Fix / Reschedule Class</h2>
      <p style="font-size:14px;color:var(--muted);margin-bottom:18px;">
        Student: <strong>${esc(b.student_name)}</strong> (${esc(b.student_email)})
      </p>

      <form onsubmit="submitEditSchedule(event, '${esc(b.id)}')" style="display:flex;flex-direction:column;gap:14px;">
        <div class="grid-2">
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:5px;">Date (YYYY-MM-DD)</label>
            <input id="edit-bk-date" type="date" class="input-clean" value="${esc(b.date_str)}" required />
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:5px;">Time Slot (GMT+7)</label>
            <select id="edit-bk-time" class="input-clean">
              ${ALL_HOURS.map((h) => `<option value="${h}" ${h === b.time_slot ? "selected" : ""}>${h}</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="grid-2">
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:5px;">Course</label>
            <select id="edit-bk-course" class="input-clean" onchange="syncModalLessonSelect('edit-bk-course','edit-bk-lesson')">
              <option value="thai" ${b.course_id === "thai" ? "selected" : ""}>🇹🇭 Basic Thai</option>
              <option value="english" ${b.course_id === "english" ? "selected" : ""}>🇬🇧 Basic English</option>
            </select>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:5px;">Lesson Number (1–8)</label>
            <select id="edit-bk-lesson" class="input-clean">
              ${(course?.lessons || [])
                .map(
                  (l) =>
                    `<option value="${l.number}" ${l.number === b.lesson_number ? "selected" : ""}>Lesson ${l.number}: ${esc(l.title)}</option>`
                )
                .join("")}
            </select>
          </div>
        </div>

        <div>
          <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:5px;">Class Status (Setting to Cancelled refunds 1 credit)</label>
          <select id="edit-bk-status" class="input-clean">
            <option value="confirmed" ${b.status === "confirmed" ? "selected" : ""}>Confirmed (Upcoming)</option>
            <option value="completed" ${b.status === "completed" ? "selected" : ""}>Completed</option>
            <option value="cancelled" ${b.status === "cancelled" ? "selected" : ""}>Cancelled (Refund 1 credit)</option>
          </select>
        </div>

        <div>
          <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:5px;">Teacher Feedback / Post-Class Notes</label>
          <textarea id="edit-bk-feedback" class="input-clean" rows="3" placeholder="Write pronunciation tips, homework, or progress notes for ${esc(b.student_name)}...">${esc(b.teacher_feedback)}</textarea>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px;">
          <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Schedule Changes</button>
        </div>
      </form>
    </div>
  `);
}

async function submitEditSchedule(e, bookingId) {
  e.preventDefault();
  const date_str = document.getElementById("edit-bk-date")?.value;
  const time_slot = document.getElementById("edit-bk-time")?.value;
  const course_id = document.getElementById("edit-bk-course")?.value;
  const lesson_number = Number(document.getElementById("edit-bk-lesson")?.value || 1);
  const status = document.getElementById("edit-bk-status")?.value;
  const teacher_feedback = document.getElementById("edit-bk-feedback")?.value;
  const course = getCourse(course_id);
  const lesson_title = (course?.lessons || []).find((l) => l.number === lesson_number)?.title || `Lesson ${lesson_number}`;

  try {
    await api("/api/booking/update", {
      booking_id: bookingId,
      action: "edit_schedule",
      date_str,
      time_slot,
      course_id,
      lesson_number,
      lesson_title,
      status,
      teacher_feedback,
    });
    closeModal();
    await refreshState();
    renderCurrentPortal(false);
    showToast("Student schedule updated.");
  } catch (err) {
    showToast(err.message);
  }
}

async function markBookingComplete(bookingId) {
  const note = prompt("Optional post-class feedback note for the student:", "Great speaking practice today! Keep reviewing today's vocabulary.");
  if (note === null) return;
  try {
    await api("/api/booking/update", { booking_id: bookingId, action: "complete", teacher_feedback: note });
    await refreshState();
    renderCurrentPortal(false);
    showToast("Class marked complete & feedback saved.");
  } catch (err) {
    showToast(err.message);
  }
}

async function cancelStudentBooking(bookingId) {
  if (!confirm("Cancel this student's class and refund 1 credit to their balance?")) return;
  try {
    await api("/api/booking/update", { booking_id: bookingId, action: "cancel" });
    await refreshState();
    renderCurrentPortal(false);
    showToast("Class cancelled and 1 credit refunded to student.");
  } catch (err) {
    showToast(err.message);
  }
}

function openAssignClassModal(preselectedStudentId = "") {
  const studentList =
    STATE.portal === "admin"
      ? STATE.users.filter((u) => u.role === "student" && !u.is_deleted)
      : STATE.students.filter((u) => !u.is_deleted);

  const today = getUpcomingDays(1, 1)[0].dateStr;

  openModal(`
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <span class="pill-tag">Schedule Student Class</span>
        <button class="btn btn-ghost btn-sm" onclick="closeModal()">✕ Close</button>
      </div>
      <h2 style="font-size:24px;">Assign a 1-on-1 Class</h2>
      <p style="font-size:14px;color:var(--muted);margin-bottom:18px;">
        Schedule a class directly onto a student's private timetable.
      </p>

      <form onsubmit="submitAssignedBooking(event)" style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:5px;">Select Student</label>
          <select id="assign-student" class="input-clean" required>
            ${studentList
              .map(
                (s) =>
                  `<option value="${esc(s.id)}" ${s.id === preselectedStudentId ? "selected" : ""}>${esc(s.name)} (${esc(s.email)}) — TH:${s.thai_credits} / EN:${s.english_credits}</option>`
              )
              .join("")}
          </select>
        </div>

        ${
          STATE.portal === "admin"
            ? `
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:5px;">Select Teacher</label>
            <select id="assign-teacher" class="input-clean">
              ${STATE.teachers.map((t) => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join("")}
            </select>
          </div>
        `
            : ""
        }

        <div class="grid-2">
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:5px;">Course</label>
            <select id="assign-course" class="input-clean" onchange="syncModalLessonSelect('assign-course','assign-lesson')">
              <option value="thai">🇹🇭 Basic Thai</option>
              <option value="english">🇬🇧 Basic English</option>
            </select>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:5px;">Lesson Number (1–8)</label>
            <select id="assign-lesson" class="input-clean">
              ${(getCourse("thai")?.lessons || [])
                .map((l) => `<option value="${l.number}">Lesson ${l.number}: ${esc(l.title)}</option>`)
                .join("")}
            </select>
          </div>
        </div>

        <div class="grid-2">
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:5px;">Date</label>
            <input id="assign-date" type="date" class="input-clean" value="${today}" required />
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:5px;">Time Slot</label>
            <select id="assign-time" class="input-clean">
              ${ALL_HOURS.map((h) => `<option value="${h}" ${h === "10:00" ? "selected" : ""}>${h}</option>`).join("")}
            </select>
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px;">
          <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Schedule Class</button>
        </div>
      </form>
    </div>
  `);
}

async function submitAssignedBooking(e) {
  e.preventDefault();
  const student_id = document.getElementById("assign-student")?.value;
  const teacher_id = document.getElementById("assign-teacher")?.value || STATE.my_teacher?.id || "teacher-piya";
  const course_id = document.getElementById("assign-course")?.value;
  const lesson_number = Number(document.getElementById("assign-lesson")?.value || 1);
  const date_str = document.getElementById("assign-date")?.value;
  const time_slot = document.getElementById("assign-time")?.value;
  const course = getCourse(course_id);
  const lesson_title = (course?.lessons || []).find((l) => l.number === lesson_number)?.title || `Lesson ${lesson_number}`;

  try {
    await api("/api/book", {
      student_id,
      teacher_id,
      course_id,
      lesson_number,
      lesson_title,
      date_str,
      time_slot,
    });
    closeModal();
    await refreshState();
    renderCurrentPortal(false);
    showToast("Class scheduled for student!");
  } catch (err) {
    showToast(err.message);
  }
}

// ---------------- TEACHER: AVAILABILITY HOURS ----------------
function renderTeacherAvailability(main) {
  const teacher = STATE.my_teacher || STATE.teachers[0];
  if (!teacher) return;
  const avail = teacher.availability || {};

  main.innerHTML = `
    <div class="page-hero">
      <div>
        <span class="pill-tag">Weekly Teaching Hours</span>
        <h1 style="margin-top:8px;">My Availability Schedule</h1>
        <p>Click any hour below to toggle when students can book 1-on-1 classes with you.</p>
      </div>
    </div>

    <div class="card anim-up">
      <div style="display:flex;flex-direction:column;gap:18px;">
        ${DAYS_SHORT.map((day) => {
          const daySlots = avail[day] || [];
          return `
            <div style="display:grid;grid-template-columns:90px 1fr;gap:14px;align-items:center;padding-bottom:14px;border-bottom:1px solid var(--line);">
              <div>
                <strong style="font-size:15px;">${day}</strong>
                <div style="font-size:12px;color:var(--muted);">${daySlots.length} hrs open</div>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:8px;">
                ${ALL_HOURS.map((hr) => {
                  const isOn = daySlots.includes(hr);
                  return `<button type="button" class="avail-hour-chip ${isOn ? "on" : ""}" onclick="toggleTeacherHour('${esc(teacher.id)}','${day}','${hr}')">${hr}</button>`;
                }).join("")}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

async function toggleTeacherHour(teacherId, day, hour) {
  const teacher = STATE.teachers.find((t) => t.id === teacherId) || STATE.my_teacher;
  if (!teacher) return;
  const avail = JSON.parse(JSON.stringify(teacher.availability || {}));
  const list = new Set(avail[day] || []);
  if (list.has(hour)) list.delete(hour);
  else list.add(hour);
  avail[day] = Array.from(list).sort();

  try {
    await api("/api/teacher/availability", { teacher_id: teacherId, availability: avail });
    await refreshState();
    renderCurrentPortal(false);
    showToast(`Updated ${day} ${hour} availability.`);
  } catch (err) {
    showToast(err.message);
  }
}

// ---------------- TEACHER: MY STUDENTS ----------------
function renderTeacherStudents(main) {
  main.innerHTML = `
    <div class="page-hero">
      <div>
        <span class="pill-tag">Assigned Roster</span>
        <h1 style="margin-top:8px;">My Students (${STATE.students.length})</h1>
        <p>Students who have booked 1-on-1 lessons with you.</p>
      </div>
      <button class="btn btn-primary" onclick="openAssignClassModal()">+ Schedule Class</button>
    </div>

    ${
      STATE.students.length === 0
        ? `<div class="card" style="text-align:center;color:var(--muted);padding:34px;">No students assigned yet.</div>`
        : `
      <div class="list-group anim-up">
        ${STATE.students
          .map(
            (s) => `
          <div class="list-row">
            <div style="display:flex;align-items:center;gap:14px;">
              <div class="avatar-circle">${esc(s.avatar || "ST")}</div>
              <div>
                <strong style="font-size:15.5px;">${esc(s.name)}</strong>
                <div style="font-size:13px;color:var(--muted);">${esc(s.email)} ${s.phone ? `· ${esc(s.phone)}` : ""}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="pill-tag">🇹🇭 ${s.thai_credits} credits</span>
              <span class="pill-tag">🇬🇧 ${s.english_credits} credits</span>
              <button class="btn btn-ghost btn-sm" onclick="openAssignClassModal('${esc(s.id)}')">+ Book Class</button>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `
    }
  `;
}

// ---------------- TEACHER: SLIDE DECKS ----------------
function renderTeacherSlides(main) {
  renderStudentLessons(main);
}

// =========================================================
// 4. MAIN ADMIN CONTROL CENTER (/admin.html)
//    Duties: Full Control Over All Accounts (Credits, Packages, Roles, Delete & Recover),
//            All Student Schedules, Teachers (+ Add Teacher), Invoices, Email Alerts
// =========================================================
function renderAdminPortal(main) {
  if (STATE.tab === "accounts") renderAdminAccounts(main);
  else if (STATE.tab === "schedules") renderAdminSchedules(main);
  else if (STATE.tab === "teachers") renderAdminTeachers(main);
  else if (STATE.tab === "invoices") renderAdminInvoices(main);
  else if (STATE.tab === "alerts") renderAdminAlerts(main);
}

function renderAdminAccounts(main) {
  const activeUsers = STATE.users.filter((u) => !u.is_deleted);
  const trashedUsers = STATE.users.filter((u) => u.is_deleted);

  const filtered = activeUsers.filter((u) => {
    if (STATE.adminRoleFilter !== "all" && u.role !== STATE.adminRoleFilter) return false;
    if (STATE.adminSearch) {
      const q = STATE.adminSearch.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  main.innerHTML = `
    <div class="page-hero">
      <div>
        <span class="pill-tag">Main Admin</span>
        <h1 style="margin-top:8px;">Accounts</h1>
        <p>Manage credits, packages, roles, and account recovery.</p>
      </div>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-ghost" onclick="STATE.adminShowTrash=!STATE.adminShowTrash;renderCurrentPortal(false)">
          Trash (${trashedUsers.length})
        </button>
        <button class="btn btn-primary" onclick="openAdminCreateUserModal()">+ Account</button>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="card anim-up" style="padding:18px 22px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;">
      <div class="segmented-nav">
        <button class="seg-btn ${STATE.adminRoleFilter === "all" ? "active" : ""}" onclick="STATE.adminRoleFilter='all';renderCurrentPortal(false)">All (${activeUsers.length})</button>
        <button class="seg-btn ${STATE.adminRoleFilter === "student" ? "active" : ""}" onclick="STATE.adminRoleFilter='student';renderCurrentPortal(false)">Students (${activeUsers.filter((u) => u.role === "student").length})</button>
        <button class="seg-btn ${STATE.adminRoleFilter === "teacher" ? "active" : ""}" onclick="STATE.adminRoleFilter='teacher';renderCurrentPortal(false)">Teachers (${activeUsers.filter((u) => u.role === "teacher").length})</button>
        <button class="seg-btn ${STATE.adminRoleFilter === "admin" ? "active" : ""}" onclick="STATE.adminRoleFilter='admin';renderCurrentPortal(false)">Admins (${activeUsers.filter((u) => u.role === "admin").length})</button>
      </div>
      <input type="search" class="input-clean" style="max-width:260px;" placeholder="Search..." value="${esc(STATE.adminSearch)}" oninput="STATE.adminSearch=this.value;renderCurrentPortal(false)" />
    </div>

    <!-- Active Accounts List -->
    <div class="list-group anim-up" style="margin-bottom:36px;">
      ${filtered
        .map((u) => {
          const isMain = u.id === STATE.main_admin_id;
          const isKendrickUser = (u.name || "").toLowerCase().includes("kendrick");
          return `
          <div class="list-row" style="flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:14px;min-width:240px;">
              ${
                isKendrickUser
                  ? `<div class="avatar-circle has-photo" style="width:36px;height:36px;"><img src="portrait.png" alt="${esc(u.name)}" /></div>`
                  : `<div class="avatar-circle" style="width:36px;height:36px;background:${u.role === "admin" ? "#B91C1C" : u.role === "teacher" ? "#3730A3" : "var(--navy)"};">${esc(u.avatar || "SP")}</div>`
              }
              <div>
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                  <strong style="font-size:15.5px;">${esc(u.name)}</strong>
                  <span class="role-portal-badge ${esc(u.role)}">${esc(u.role)}</span>
                </div>
                <div style="font-size:13px;color:var(--muted);margin-top:2px;">
                  ${esc(u.email)} ${u.phone ? `· ${esc(u.phone)}` : ""}
                </div>
              </div>
            </div>

            <!-- Quick Credit Stepper & Controls -->
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <div style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.6);padding:5px 10px;border-radius:99px;font-size:12.5px;">
                <span>🇹🇭 <strong>${u.thai_credits}</strong></span>
                <button class="btn btn-ghost btn-sm" style="padding:2px 8px;" onclick="adminQuickCredit('${esc(u.id)}', ${Math.max(0, u.thai_credits - 1)}, ${u.english_credits})">−</button>
                <button class="btn btn-ghost btn-sm" style="padding:2px 8px;" onclick="adminQuickCredit('${esc(u.id)}', ${u.thai_credits + 1}, ${u.english_credits})">+</button>
              </div>

              <div style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.6);padding:5px 10px;border-radius:99px;font-size:12.5px;">
                <span>🇬🇧 <strong>${u.english_credits}</strong></span>
                <button class="btn btn-ghost btn-sm" style="padding:2px 8px;" onclick="adminQuickCredit('${esc(u.id)}', ${u.thai_credits}, ${Math.max(0, u.english_credits - 1)})">−</button>
                <button class="btn btn-ghost btn-sm" style="padding:2px 8px;" onclick="adminQuickCredit('${esc(u.id)}', ${u.thai_credits}, ${u.english_credits + 1})">+</button>
              </div>

              <button class="btn btn-ghost btn-sm" onclick="openAdminManageAccountModal('${esc(u.id)}')">Manage</button>
              ${
                !isMain
                  ? `<button class="btn btn-ghost btn-sm" style="color:var(--red);" onclick="adminDeleteUser('${esc(u.id)}', '${esc(u.name)}')">Delete</button>`
                  : ""
              }
            </div>
          </div>
        `;
        })
        .join("")}
    </div>

    <!-- Deleted Accounts Trash & Recovery -->
    <div class="anim-up">
      <h3 style="font-size:20px;margin-bottom:14px;">Trash (${trashedUsers.length})</h3>
      ${
        trashedUsers.length === 0
          ? `<div class="card" style="padding:24px;color:var(--muted);font-size:14px;">Trash is empty.</div>`
          : `
        <div class="list-group">
          ${trashedUsers
            .map(
              (u) => `
            <div class="list-row">
              <div>
                <div style="display:flex;align-items:center;gap:8px;">
                  <strong>${esc(u.name)}</strong>
                  <span class="role-portal-badge ${esc(u.role)}">${esc(u.role)}</span>
                  <span class="pill-tag red">Deleted</span>
                </div>
                <div style="font-size:13px;color:var(--muted);">${esc(u.email)} · TH ${u.thai_credits} / EN ${u.english_credits}</div>
              </div>
              <div style="display:flex;gap:8px;">
                <button class="btn btn-primary btn-sm" onclick="adminRecoverUser('${esc(u.id)}')">Recover</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--red);" onclick="adminPermanentDeleteUser('${esc(u.id)}')">Remove</button>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `
      }
    </div>
  `;
}

async function adminQuickCredit(userId, thai_credits, english_credits) {
  try {
    await api("/api/admin/user/update", {
      user_id: userId,
      action: "set_credits",
      thai_credits,
      english_credits,
    });
    await refreshState();
    renderCurrentPortal(false);
    showToast("Credits updated.");
  } catch (err) {
    showToast(err.message);
  }
}

function openAdminManageAccountModal(userId) {
  const u = STATE.users.find((x) => x.id === userId);
  if (!u) return;

  openModal(`
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <span class="pill-tag">Main Admin Account Control</span>
        <button class="btn btn-ghost btn-sm" onclick="closeModal()">✕ Close</button>
      </div>
      <h2 style="font-size:24px;">Manage ${esc(u.name)}</h2>
      <p style="font-size:13.5px;color:var(--muted);margin-bottom:18px;">${esc(u.email)}</p>

      <!-- 1. Set Exact Credits -->
      <div style="padding:16px;border-radius:16px;background:var(--bg);margin-bottom:14px;">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:10px;">Set Exact Class Credits</div>
        <div class="grid-2" style="margin-bottom:10px;">
          <div>
            <label style="font-size:12px;color:var(--muted);">🇹🇭 Thai Credits</label>
            <input id="adm-th-cr" type="number" min="0" class="input-clean" value="${u.thai_credits}" />
          </div>
          <div>
            <label style="font-size:12px;color:var(--muted);">🇬🇧 English Credits</label>
            <input id="adm-en-cr" type="number" min="0" class="input-clean" value="${u.english_credits}" />
          </div>
        </div>
        <button class="btn btn-dark btn-sm" onclick="adminSaveExactCredits('${esc(u.id)}')">Save Credits</button>
      </div>

      <!-- 2. Grant Official Package & Invoice -->
      <div style="padding:16px;border-radius:16px;background:var(--bg);margin-bottom:14px;">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:10px;">Grant Package (+ Credits &amp; Receipt)</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <select id="adm-pkg-select" class="input-clean" style="flex:1;">
            <option value="thai-trial">Free Thai Trial (+1 TH)</option>
            <option value="thai-8">8 Thai Lessons (+8 TH · ฿4,490)</option>
            <option value="thai-16">16 Thai Lessons (+16 TH · ฿8,880)</option>
            <option value="english-trial">Free English Trial (+1 EN)</option>
            <option value="english-8">8 English Lessons (+8 EN · ฿3,690)</option>
            <option value="english-16">16 English Lessons (+16 EN · ฿7,380)</option>
          </select>
          <button class="btn btn-primary btn-sm" onclick="adminGrantPackage('${esc(u.id)}')">Grant Package</button>
        </div>
      </div>

      <!-- 3. Change Role & Reset Password -->
      <div class="grid-2" style="gap:12px;">
        <div style="padding:16px;border-radius:16px;background:var(--bg);">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">Account Role</div>
          <select id="adm-role-select" class="input-clean" style="margin-bottom:8px;">
            <option value="student" ${u.role === "student" ? "selected" : ""}>Student</option>
            <option value="teacher" ${u.role === "teacher" ? "selected" : ""}>Teacher</option>
            <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
          </select>
          <button class="btn btn-ghost btn-sm" style="width:100%;" onclick="adminChangeRole('${esc(u.id)}')">Update Role</button>
        </div>

        <div style="padding:16px;border-radius:16px;background:var(--bg);">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">Reset Password</div>
          <input id="adm-new-pw" type="text" class="input-clean" placeholder="New password (min 6)" style="margin-bottom:8px;" />
          <button class="btn btn-ghost btn-sm" style="width:100%;" onclick="adminResetPassword('${esc(u.id)}')">Set Password</button>
        </div>
      </div>
    </div>
  `);
}

async function adminSaveExactCredits(userId) {
  const th = Number(document.getElementById("adm-th-cr")?.value || 0);
  const en = Number(document.getElementById("adm-en-cr")?.value || 0);
  await adminQuickCredit(userId, th, en);
  closeModal();
}

async function adminGrantPackage(userId) {
  const package_id = document.getElementById("adm-pkg-select")?.value;
  try {
    await api("/api/admin/user/update", { user_id: userId, action: "grant_package", package_id });
    closeModal();
    await refreshState();
    renderCurrentPortal(false);
    showToast("Package granted to account!");
  } catch (err) {
    showToast(err.message);
  }
}

async function adminChangeRole(userId) {
  const role = document.getElementById("adm-role-select")?.value;
  try {
    await api("/api/admin/user/update", { user_id: userId, action: "set_role", role });
    closeModal();
    await refreshState();
    renderCurrentPortal(false);
    showToast(`Account role updated to ${role}.`);
  } catch (err) {
    showToast(err.message);
  }
}

async function adminResetPassword(userId) {
  const password = document.getElementById("adm-new-pw")?.value;
  try {
    await api("/api/admin/user/update", { user_id: userId, action: "reset_password", password });
    closeModal();
    showToast("Password updated.");
  } catch (err) {
    showToast(err.message);
  }
}

async function adminDeleteUser(userId, name) {
  if (!confirm(`Move "${name}" to Trash? You can recover this account anytime from the Trash section.`)) return;
  try {
    await api("/api/admin/user/update", { user_id: userId, action: "delete" });
    await refreshState();
    renderCurrentPortal(false);
    showToast("Account moved to Trash (recoverable).");
  } catch (err) {
    showToast(err.message);
  }
}

async function adminRecoverUser(userId) {
  try {
    await api("/api/admin/user/update", { user_id: userId, action: "recover" });
    await refreshState();
    renderCurrentPortal(false);
    showToast("Account recovered and active again!");
  } catch (err) {
    showToast(err.message);
  }
}

async function adminPermanentDeleteUser(userId) {
  if (!confirm("Permanently delete this account? This cannot be undone.")) return;
  try {
    await api("/api/admin/user/update", { user_id: userId, action: "permanent_delete" });
    await refreshState();
    renderCurrentPortal(false);
    showToast("Account permanently deleted.");
  } catch (err) {
    showToast(err.message);
  }
}

function openAdminCreateUserModal() {
  openModal(`
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <span class="pill-tag">Create Account</span>
        <button class="btn btn-ghost btn-sm" onclick="closeModal()">✕ Close</button>
      </div>
      <h2 style="font-size:24px;">Create New Account</h2>
      <form onsubmit="submitAdminCreateUser(event)" style="display:flex;flex-direction:column;gap:13px;margin-top:14px;">
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--muted);">Full Name</label>
          <input id="new-u-name" type="text" class="input-clean" required placeholder="e.g. Nida Srisuk" />
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--muted);">Email Address</label>
          <input id="new-u-email" type="email" class="input-clean" required placeholder="nida@example.com" />
        </div>
        <div class="grid-2">
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--muted);">Account Role</label>
            <select id="new-u-role" class="input-clean">
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--muted);">Password (min 6)</label>
            <input id="new-u-pw" type="text" class="input-clean" value="speako123" required minlength="6" />
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px;">
          <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Account</button>
        </div>
      </form>
    </div>
  `);
}

async function submitAdminCreateUser(e) {
  e.preventDefault();
  try {
    await api("/api/admin/user/create", {
      name: document.getElementById("new-u-name")?.value,
      email: document.getElementById("new-u-email")?.value,
      role: document.getElementById("new-u-role")?.value,
      password: document.getElementById("new-u-pw")?.value,
    });
    closeModal();
    await refreshState();
    renderCurrentPortal(false);
    showToast("New account created!");
  } catch (err) {
    showToast(err.message);
  }
}

// ---------------- ADMIN: ALL STUDENT SCHEDULES ----------------
function renderAdminSchedules(main) {
  renderTeacherSchedule(main);
}

// ---------------- ADMIN: TEACHERS MANAGEMENT ----------------
function renderAdminTeachers(main) {
  main.innerHTML = `
    <div class="page-hero">
      <div>
        <span class="pill-tag">Teachers Roster</span>
        <h1 style="margin-top:8px;">Teachers &amp; Availability (${STATE.teachers.length})</h1>
        <p>Kendrick is your active lead teacher. You can add additional teachers anytime.</p>
      </div>
      <button class="btn btn-primary" onclick="openAddTeacherModal()">+ Add New Teacher</button>
    </div>

    <div class="grid-2 anim-up">
      ${STATE.teachers
        .map(
          (t) => `
        <div class="card" style="display:flex;flex-direction:column;justify-content:space-between;gap:16px;">
          <div style="display:flex;align-items:center;gap:16px;">
            <div class="teacher-photo-frame" style="width:72px;height:72px;border-radius:20px;">
              <img src="${esc(t.avatar || "portrait.png")}" alt="${esc(t.name)}" />
            </div>
            <div>
              <span class="pill-tag">${t.id === "teacher-piya" ? "Lead Teacher" : "Speako Tutor"}</span>
              <h3 style="font-size:21px;margin-top:4px;">${esc(t.name)}</h3>
              <div style="font-size:13px;color:var(--muted);">${esc(t.title)}</div>
            </div>
          </div>
          <p style="font-size:13.5px;color:var(--muted);">${esc(t.bio)}</p>
          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid var(--line);">
            <button class="btn btn-ghost btn-sm" onclick="STATE.my_teacher=STATE.teachers.find(x=>x.id==='${esc(t.id)}');openAdminTeacherAvailModal('${esc(t.id)}')">Edit Weekly Hours</button>
            ${
              t.id !== "teacher-piya"
                ? `<button class="btn btn-ghost btn-sm" style="color:var(--red);" onclick="adminRemoveTeacher('${esc(t.id)}')">Remove</button>`
                : `<span style="font-size:12px;color:var(--muted);">Primary Tutor</span>`
            }
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

function openAddTeacherModal() {
  openModal(`
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <span class="pill-tag">Add Teacher</span>
        <button class="btn btn-ghost btn-sm" onclick="closeModal()">✕ Close</button>
      </div>
      <h2 style="font-size:24px;">Add New Teacher</h2>
      <form onsubmit="submitAddTeacher(event)" style="display:flex;flex-direction:column;gap:13px;margin-top:14px;">
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--muted);">Teacher Name</label>
          <input id="t-add-name" type="text" class="input-clean" required placeholder="e.g. Kru Fai" />
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--muted);">Title / Specialty</label>
          <input id="t-add-title" type="text" class="input-clean" value="Thai & English Tutor" />
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--muted);">Short Bio</label>
          <textarea id="t-add-bio" class="input-clean" rows="2" placeholder="Supportive 1-on-1 language tutor..."></textarea>
        </div>
        <div class="grid-2">
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--muted);">Teacher Login Email (Optional)</label>
            <input id="t-add-email" type="email" class="input-clean" placeholder="fai@speakolanguages.com" />
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--muted);">Login Password</label>
            <input id="t-add-pw" type="text" class="input-clean" value="teacher123" />
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px;">
          <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Add Teacher</button>
        </div>
      </form>
    </div>
  `);
}

async function submitAddTeacher(e) {
  e.preventDefault();
  try {
    await api("/api/admin/teacher/add", {
      name: document.getElementById("t-add-name")?.value,
      title: document.getElementById("t-add-title")?.value,
      bio: document.getElementById("t-add-bio")?.value,
      email: document.getElementById("t-add-email")?.value,
      password: document.getElementById("t-add-pw")?.value,
    });
    closeModal();
    await refreshState();
    renderCurrentPortal(false);
    showToast("New teacher added!");
  } catch (err) {
    showToast(err.message);
  }
}

function openAdminTeacherAvailModal(teacherId) {
  const t = STATE.teachers.find((x) => x.id === teacherId);
  if (!t) return;
  closeModal();
  const main = document.getElementById("app-main");
  STATE.my_teacher = t;
  renderTeacherAvailability(main);
}

async function adminRemoveTeacher(teacherId) {
  if (!confirm("Remove this teacher profile?")) return;
  try {
    await api("/api/admin/teacher/delete", { teacher_id: teacherId });
    await refreshState();
    renderCurrentPortal(false);
    showToast("Teacher removed.");
  } catch (err) {
    showToast(err.message);
  }
}

// ---------------- ADMIN: INVOICES & REVENUE ----------------
function renderAdminInvoices(main) {
  const paidRevenue = STATE.transactions
    .filter((tx) => tx.status !== "pending_payment")
    .reduce((sum, tx) => sum + Number(tx.amount_thb || 0), 0);
  const pendingCount = STATE.transactions.filter((tx) => tx.status === "pending_payment").length;
  main.innerHTML = `
    <div class="page-hero">
      <div>
        <span class="pill-tag">Accounting Ledger</span>
        <h1 style="margin-top:8px;">Revenue &amp; Student Package Requests</h1>
        <p>
          Confirmed revenue: <strong>฿${paidRevenue.toLocaleString()} THB</strong> ·
          Pending payment requests: <strong>${pendingCount}</strong>
        </p>
      </div>
    </div>

    <div class="list-group anim-up">
      ${
        STATE.transactions.length === 0
          ? `<div style="padding:32px;text-align:center;color:var(--muted);">No transactions recorded yet.</div>`
          : STATE.transactions
              .map(
                (tx) => `
          <div class="list-row" style="flex-wrap:wrap;">
            <div>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <strong>${esc(tx.student_name)}</strong>
                <span class="pill-tag">${esc(tx.package_title)}</span>
                ${
                  tx.status === "pending_payment"
                    ? `<span class="pill-tag amber">⏳ Pending Payment (+${tx.lessons_added} credits)</span>`
                    : `<span class="pill-tag">✓ Paid (+${tx.lessons_added} credits)</span>`
                }
                <span class="pill-tag gray">${esc(tx.invoice_no)}</span>
              </div>
              <div style="font-size:13px;color:var(--muted);margin-top:3px;">
                ${esc(tx.student_email)} · ${esc(tx.created_at)} · ${esc(tx.payment_method)}
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
              <strong style="font-size:16px;">฿${Number(tx.amount_thb).toLocaleString()}</strong>
              ${
                tx.status === "pending_payment"
                  ? `<button class="btn btn-primary btn-sm" onclick="adminApproveTransaction('${esc(tx.id)}')">Approve &amp; Grant +${tx.lessons_added} Credits</button>`
                  : ""
              }
            </div>
          </div>
        `
              )
              .join("")
      }
    </div>
  `;
}

async function adminApproveTransaction(txId) {
  try {
    await api("/api/admin/user/update", { action: "approve_transaction", transaction_id: txId });
    await refreshState();
    renderCurrentPortal(false);
    showToast("Payment approved and credits added to student account!");
  } catch (err) {
    showToast(err.message);
  }
}

// ---------------- ADMIN: EMAIL & BOOKING ALERTS INBOX ----------------
function renderAdminAlerts(main) {
  main.innerHTML = `
    <div class="page-hero">
      <div>
        <span class="pill-tag">Real-Time Notification Feed</span>
        <h1 style="margin-top:8px;">Booking &amp; Email Alerts Inbox</h1>
        <p>Every student booking automatically emails <strong>${STATE.notify_emails.join("</strong> &amp; <strong>")}</strong> and logs here.</p>
      </div>
      <button class="btn btn-ghost" onclick="markAllAlertsRead()">Mark All Read</button>
    </div>

    <div class="list-group anim-up">
      ${
        STATE.notifications.length === 0
          ? `<div style="padding:32px;text-align:center;color:var(--muted);">No booking alerts yet.</div>`
          : STATE.notifications
              .map(
                (n) => `
          <div class="list-row" style="${n.is_read ? "" : "background:#F4FBF9;"}">
            <div>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                ${!n.is_read ? `<span class="live-dot"></span>` : ""}
                <strong>${esc(n.title)}</strong>
                <span class="pill-tag gray">${esc(n.created_at)}</span>
              </div>
              <div style="font-size:13.5px;color:var(--ink);margin-top:4px;">${esc(n.message)}</div>
              ${
                n.emailed_to
                  ? `<div style="font-size:12px;color:var(--muted);margin-top:4px;">✉ Dispatched to: ${esc(n.emailed_to)}</div>`
                  : ""
              }
            </div>
          </div>
        `
              )
              .join("")
      }
    </div>
  `;
}

async function markAllAlertsRead() {
  try {
    await api("/api/notifications/read", {});
    await refreshState();
    renderCurrentPortal(false);
    showToast("All notifications marked as read.");
  } catch (err) {
    showToast(err.message);
  }
}

// =========================================================
// INTERACTIVE THAI SURVIVAL KIT (No signup required)
// =========================================================
const SK_AUDIO_CACHE = {};

function renderThaiSurvivalKitSection() {
  const situations = Object.values(SURVIVAL_KIT_DATA);
  const current = SURVIVAL_KIT_DATA[STATE.skSituationId] || null;

  if (!current || STATE.skMode === "cards") {
    return `
      <div class="card" style="padding:26px 20px;">
        <div style="text-align:center;margin-bottom:18px;">
          <span class="pill-tag">🇹🇭 Free Interactive Guide · No Signup Required</span>
          <h2 style="font-size:clamp(22px,4.5vw,28px);margin-top:8px;color:var(--navy);">Thai Survival Kit</h2>
          <p style="font-size:14px;color:var(--muted);margin-top:4px;">
            Pick a real-life situation in Thailand to hear &amp; practice 5 essential polite phrases.
          </p>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:12px;">
          ${situations
            .map(
              (s) => `
            <button type="button" class="choice-card" style="min-height:108px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;padding:16px 12px;" onclick="skSelectSituation('${esc(s.id)}')">
              <span style="font-size:30px;line-height:1;">${s.icon}</span>
              <strong style="font-size:14px;color:var(--navy);">${esc(s.title)}</strong>
            </button>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  if (STATE.skMode === "phrases") {
    return `
      <div class="card" style="padding:26px 20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
          <div>
            <span class="pill-tag">${current.icon} ${esc(current.title)}</span>
            <h2 style="font-size:22px;margin-top:6px;color:var(--navy);">5 Essential Phrases</h2>
          </div>
          <button type="button" class="btn btn-outline btn-sm" onclick="skReset()">← All situations</button>
        </div>
        <div style="display:grid;gap:12px;">
          ${current.phrases
            .map((p, idx) => {
              const key = `${current.id}-${idx}`;
              const hideAudio = !!STATE.skFailedAudio[key];
              return `
              <div style="padding:16px;border-radius:18px;background:rgba(255,255,255,0.82);border:1px solid var(--line);animation:viewFadeIn 0.36s var(--spring) ${idx * 80}ms backwards;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
                  <div>
                    <div style="font-size:20px;font-weight:700;color:var(--navy);">${esc(p.thai)}</div>
                    <div style="font-size:14px;font-weight:600;color:var(--teal-dark);margin-top:2px;">“${esc(p.romanization)}”</div>
                    <div style="font-size:14px;color:var(--ink);margin-top:4px;">${esc(p.meaning)}</div>
                  </div>
                  ${
                    hideAudio
                      ? ""
                      : `
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                      <button type="button" class="btn btn-primary btn-sm" onmouseenter="skPreloadAudio('${esc(p.audioUrl)}','${key}')" onclick="skPlayAudio('${esc(p.audioUrl)}','${esc(p.thai)}',1,'${key}')">▶ Play</button>
                      <button type="button" class="btn btn-outline btn-sm" onmouseenter="skPreloadAudio('${esc(p.audioUrl)}','${key}')" onclick="skPlayAudio('${esc(p.audioUrl)}','${esc(p.thai)}',0.7,'${key}')">🐢 Slow (0.7x)</button>
                    </div>
                  `
                  }
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
        <div style="margin-top:20px;text-align:center;">
          <button type="button" class="btn btn-primary btn-lg" style="width:100%;max-width:320px;" onclick="skStartPractice()">Practice These Phrases →</button>
        </div>
      </div>
    `;
  }

  if (STATE.skMode === "quiz") {
    const q = STATE.skQuizQuestions[STATE.skQuizIdx];
    return `
      <div class="card" style="padding:26px 20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <span class="pill-tag">Practice ${STATE.skQuizIdx + 1} of ${STATE.skQuizQuestions.length}</span>
          <span style="font-size:13px;font-weight:600;color:var(--muted);">Score: ${STATE.skQuizScore}/${STATE.skQuizQuestions.length}</span>
        </div>
        <h3 style="font-size:22px;color:var(--navy);">${esc(q.phrase.thai)}</h3>
        <p style="font-size:14.5px;color:var(--teal-dark);font-weight:600;margin-top:4px;">“${esc(q.phrase.romanization)}”</p>
        <p style="font-size:13.5px;color:var(--muted);margin-top:10px;">Tap the correct English meaning:</p>
        <div style="display:grid;gap:10px;margin-top:14px;">
          ${q.options
            .map(
              (opt) => `
            <button type="button" class="btn btn-outline" style="justify-content:flex-start;text-align:left;width:100%;" onclick="skAnswerQuiz('${esc(opt)}')">
              ${esc(opt)}
            </button>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  // Result card
  return `
    <div class="card next-class-card" style="padding:28px 22px;text-align:center;">
      <span class="pill-tag dark" style="margin:0 auto 12px;">Practice Score: ${STATE.skQuizScore} / ${STATE.skQuizQuestions.length}</span>
      <h2 style="font-size:clamp(22px,4.5vw,28px);color:#fff;">You’re ready for ${esc(current.title.toLowerCase())}... almost.</h2>
      <p style="color:rgba(255,255,255,0.86);font-size:14.5px;max-width:520px;margin:10px auto 0;">
        In Thai, 5 tones completely change the meaning of these words — and most beginners get tones wrong without live feedback.
      </p>
      <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:12px;margin-top:22px;">
        <button type="button" class="btn btn-primary btn-lg" onclick="STATE.authMode='signup';renderLoginGateway();window.scrollTo({top:0,behavior:'smooth'})">Book a free trial lesson</button>
        <button type="button" class="btn btn-outline btn-lg" onclick="skReset()">Try another situation</button>
      </div>
    </div>
  `;
}

function refreshSurvivalKitMount() {
  const mount = document.getElementById("survival-kit-mount");
  if (mount) mount.innerHTML = renderThaiSurvivalKitSection();
}

function skSelectSituation(id) {
  STATE.skSituationId = id;
  STATE.skMode = "phrases";
  refreshSurvivalKitMount();
}

function skReset() {
  STATE.skMode = "cards";
  STATE.skSituationId = "";
  refreshSurvivalKitMount();
}

function skPreloadAudio(url, key) {
  if (SK_AUDIO_CACHE[url] || STATE.skFailedAudio[key]) return;
  try {
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = url;
    SK_AUDIO_CACHE[url] = audio;
  } catch (_) {}
}

function skPlayAudio(url, thaiText, rate, key) {
  try {
    const audio = SK_AUDIO_CACHE[url] || new Audio(url);
    SK_AUDIO_CACHE[url] = audio;
    audio.currentTime = 0;
    audio.playbackRate = rate || 1.0;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // Fallback to native Thai speech synthesis if MP3 file is not uploaded yet,
        // or hide buttons if speech synthesis is also unavailable
        if ("speechSynthesis" in window && thaiText) {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(thaiText.replace("/ค่ะ", "").replace("/คะ", ""));
          utter.lang = "th-TH";
          utter.rate = rate || 1.0;
          window.speechSynthesis.speak(utter);
        } else {
          STATE.skFailedAudio[key] = true;
          refreshSurvivalKitMount();
        }
      });
    }
  } catch (_) {
    STATE.skFailedAudio[key] = true;
    refreshSurvivalKitMount();
  }
}

function skStartPractice() {
  const current = SURVIVAL_KIT_DATA[STATE.skSituationId];
  if (!current) return;
  const shuffled = [...current.phrases].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, 2);
  STATE.skQuizQuestions = picked.map((p) => {
    const distractors = current.phrases
      .filter((x) => x.meaning !== p.meaning)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
      .map((x) => x.meaning);
    const options = [p.meaning, ...distractors].sort(() => Math.random() - 0.5);
    return { phrase: p, options };
  });
  STATE.skQuizIdx = 0;
  STATE.skQuizScore = 0;
  STATE.skMode = "quiz";
  refreshSurvivalKitMount();
}

function skAnswerQuiz(selectedMeaning) {
  const q = STATE.skQuizQuestions[STATE.skQuizIdx];
  if (q && selectedMeaning === q.phrase.meaning) {
    STATE.skQuizScore += 1;
  }
  if (STATE.skQuizIdx + 1 < STATE.skQuizQuestions.length) {
    STATE.skQuizIdx += 1;
  } else {
    STATE.skMode = "result";
  }
  refreshSurvivalKitMount();
}

// =========================================================
// LIVING BACKGROUND (BUFFER-STYLE FLOATING THAI LETTERS
// THAT FOLLOW CURSOR SLOWLY), MASCOT & COUNTDOWN TICKER
// =========================================================
const MASCOT_QUOTES = [
  { th: "สวัสดีครับ! (sà-wàt-dii khráp)", en: "Tap me for a quick Thai tip!" },
  { th: "ไม่เป็นไร (mâi bpen rai)", en: "No worries — practice step by step!" },
  { th: "ขอบคุณครับ (khòp-khun khráp)", en: "Ready for your 1-on-1 lesson?" },
  { th: "เก่งมาก! (gèng mâak!)", en: "You're doing great!" },
];

const THAI_FLOAT_LETTERS = [
  { ch: "ก", sub: "gaw", x: 7, y: 14, color: "#0B2A5B", bg: "#EEF4FF", pull: 1.05 },
  { ch: "ข", sub: "khǎw", x: 24, y: 12, color: "#14A3A0", bg: "#EBFBFA", pull: 0.9 },
  { ch: "ค", sub: "khaw", x: 6, y: 34, color: "#E15B48", bg: "#FFF1EE", pull: 1.15 },
  { ch: "ง", sub: "ngaw", x: 21, y: 46, color: "#D97706", bg: "#FFF8EB", pull: 1.2 },
  { ch: "จ", sub: "jaw", x: 10, y: 58, color: "#2563EB", bg: "#EFF6FF", pull: 1.0 },
  { ch: "ช", sub: "chaw", x: 18, y: 66, color: "#0D9488", bg: "#F0FDFA", pull: 1.1 },
  { ch: "ด", sub: "daw", x: 4, y: 82, color: "#16A34A", bg: "#F0FDF4", pull: 0.85 },
  { ch: "ต", sub: "dtaw", x: 21, y: 83, color: "#DB2777", bg: "#FDF2F8", pull: 0.95 },
  { ch: "ถ", sub: "thǎw", x: 40, y: 88, color: "#0B2A5B", bg: "#F1F5F9", pull: 0.9 },
  { ch: "ท", sub: "thaw", x: 56, y: 88, color: "#2563EB", bg: "#EFF6FF", pull: 0.95 },
  { ch: "น", sub: "naw", x: 76, y: 11, color: "#0284C7", bg: "#F0F9FF", pull: 0.9 },
  { ch: "บ", sub: "baw", x: 82, y: 34, color: "#475569", bg: "#F8FAFC", pull: 1.05 },
  { ch: "ป", sub: "bpaw", x: 92, y: 33, color: "#E11D48", bg: "#FFF1F2", pull: 0.95 },
  { ch: "พ", sub: "phaw", x: 81, y: 58, color: "#0B2A5B", bg: "#F1F5F9", pull: 1.15 },
  { ch: "ม", sub: "maw", x: 95, y: 58, color: "#0D9488", bg: "#F0FDFA", pull: 0.9 },
  { ch: "ส", sub: "sǎw", x: 88, y: 71, color: "#2563EB", bg: "#EFF6FF", pull: 1.1 },
  { ch: "อ", sub: "aw", x: 92, y: 87, color: "#EA580C", bg: "#FFF7ED", pull: 0.85 },
];

function initBackgroundAndMascot() {
  if (!document.querySelector(".bg-motion")) {
    const bg = document.createElement("div");
    bg.className = "bg-motion";
    bg.setAttribute("aria-hidden", "true");
    bg.innerHTML = `
      <div class="bg-grid"></div>
      <div class="bg-blob b1"></div>
      <div class="bg-blob b2"></div>
      <div class="bg-blob b3"></div>
      <div class="thai-float-layer" id="thai-float-layer">
        ${THAI_FLOAT_LETTERS.map(
          (item, i) => `
          <div class="thai-float-tile" data-idx="${i}" style="left:${item.x}%;top:${item.y}%;--tile-color:${item.color};--tile-bg:${item.bg};">
            <span class="thai-char">${item.ch}</span>
            <span class="thai-sub">${item.sub}</span>
          </div>
        `
        ).join("")}
      </div>
    `;
    document.body.prepend(bg);
    initThaiLettersCursorFollow();
  }

  if (!document.querySelector(".mascot-buddy")) {
    const buddy = document.createElement("div");
    buddy.className = "mascot-buddy";
    buddy.innerHTML = `
      <button type="button" class="mascot-face" aria-label="Kendrick Mascot Tip" onclick="cycleMascotTip(true)">
        <img src="mascot/smile.jpg" class="on" alt="Kendrick Smile" />
        <img src="mascot/wink.jpg" alt="Kendrick Wink" />
        <img src="mascot/laugh.jpg" alt="Kendrick Laugh" />
      </button>
      <div id="mascot-bubble" class="mascot-bubble">
        <span>สวัสดีครับ!</span>
        <small>Tap Kendrick for a Thai tip</small>
      </div>
    `;
    document.body.appendChild(buddy);
    setTimeout(() => cycleMascotTip(false), 1800);
    setInterval(() => cycleMascotTip(false), 12000);
  }

  // Update Next Class countdown every 60 seconds
  setInterval(() => {
    if (STATE.portal === "student" && STATE.tab === "schedule") {
      const el = document.getElementById("next-class-countdown");
      const upcoming = STATE.bookings.filter((b) => b.status === "confirmed");
      const nextClass = upcoming[0];
      if (el && nextClass) {
        const cd = getLessonCountdown(nextClass.date_str, nextClass.time_slot);
        el.textContent = cd.label;
        el.className = `np-countdown ${cd.state === "soon" ? "soon" : cd.state === "live" ? "live" : ""}`;
      }
    }
  }, 60000);
}

function initThaiLettersCursorFollow() {
  const tiles = Array.from(document.querySelectorAll(".thai-float-tile"));
  if (!tiles.length) return;

  const state = tiles.map((el, i) => ({
    el,
    cfg: THAI_FLOAT_LETTERS[i] || THAI_FLOAT_LETTERS[0],
    cx: 0,
    cy: 0,
    phase: i * 0.85,
  }));

  let pointerActive = false;
  let mouseX = window.innerWidth * 0.5;
  let mouseY = window.innerHeight * 0.5;

  window.addEventListener(
    "pointermove",
    (e) => {
      pointerActive = true;
      mouseX = e.clientX;
      mouseY = e.clientY;
    },
    { passive: true }
  );

  document.addEventListener("mouseleave", () => {
    pointerActive = false;
  });

  function tick(now) {
    const t = (now || 0) * 0.0012;
    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 800;

    for (let i = 0; i < state.length; i++) {
      const s = state[i];
      const homeX = (s.cfg.x / 100) * vw;
      const homeY = (s.cfg.y / 100) * vh;

      // Gentle ambient float before & during cursor movement
      const bobX = Math.sin(t + s.phase) * 5.5;
      const bobY = Math.cos(t * 0.9 + s.phase) * 6.5;

      let targetX = bobX;
      let targetY = bobY;

      if (pointerActive) {
        const dx = mouseX - homeX;
        const dy = mouseY - homeY;
        const dist = Math.hypot(dx, dy) || 1;
        // Smooth attraction toward cursor (like buffer.com hero tiles):
        // closer tiles pull in more strongly + a gentle global drift toward the cursor
        const proximity = Math.max(0.18, 1 - Math.min(dist / 900, 0.82));
        const maxPull = 95 * (s.cfg.pull || 1) * proximity;
        const pullRatio = Math.min(0.26 * (s.cfg.pull || 1), maxPull / dist);
        targetX += dx * pullRatio;
        targetY += dy * pullRatio;
      }

      // Slow, silky interpolation so letters follow the cursor gracefully
      s.cx += (targetX - s.cx) * 0.032;
      s.cy += (targetY - s.cy) * 0.032;

      s.el.style.transform = `translate3d(${s.cx.toFixed(2)}px, ${s.cy.toFixed(2)}px, 0)`;
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

let mascotIdx = 0;
let mascotBubbleTimer = null;
function cycleMascotTip(showBubble = true) {
  const imgs = document.querySelectorAll(".mascot-face img");
  if (imgs.length) {
    mascotIdx = (mascotIdx + 1) % imgs.length;
    imgs.forEach((im, i) => im.classList.toggle("on", i === mascotIdx));
  }
  const bubble = document.getElementById("mascot-bubble");
  if (bubble && showBubble) {
    const q = MASCOT_QUOTES[Math.floor(Math.random() * MASCOT_QUOTES.length)];
    bubble.innerHTML = `<span>${esc(q.th)}</span><small>${esc(q.en)}</small>`;
    bubble.classList.add("show");
    clearTimeout(mascotBubbleTimer);
    mascotBubbleTimer = setTimeout(() => bubble.classList.remove("show"), 4500);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initBackgroundAndMascot();
  initPortal();
});
