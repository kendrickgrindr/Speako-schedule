/**
 * Speako — Complete Course & Curriculum Data (from Speako PJ.pdf & Pricing Specs)
 */
window.SPEAKO_DATA = {
  brand: {
    name: "Speako",
    headline: "Speak with confidence, one lesson at a time.",
    subheadline: "Live 1-on-1 English and Thai tutoring for beginners who want practical communication, flexible scheduling, and personal support.",
    intro: "Speako offers live private tutoring for students who want to improve English or Thai from the basics. Lessons focus on real communication, simple explanations, and step-by-step progress. Whether the goal is daily conversation, self-introduction, survival Thai, or beginner English, each lesson is designed to help students speak more clearly and feel more confident.",
    taglines: [
      "Speak with confidence.",
      "Learn language the easy way.",
      "Real lessons. Real speaking.",
      "Step by step to fluency.",
      "Your bridge to better communication."
    ],
    whySpeako: [
      { title: "Live 1-on-1 tutoring", desc: "Private, personal sessions tailored 100% to your pace, comfort level, and goals.", icon: "video" },
      { title: "Flexible scheduling", desc: "Book your preferred date and time slot that matches directly with your teacher's live calendar.", icon: "calendar" },
      { title: "Beginner-friendly lessons", desc: "No intimidating grammar theory. Start from zero and build sentences step by step.", icon: "smile" },
      { title: "English & Thai support", desc: "Lessons can be taught using both English and Thai explanations so you always understand clearly.", icon: "globe" },
      { title: "Practical daily speaking", desc: "Role-play real-life situations: cafes, markets, directions, introductions, and daily life.", icon: "message" },
      { title: "Personal attention & feedback", desc: "Receive live pronunciation coaching, post-class notes, and interactive slide decks.", icon: "award" }
    ],
    howItWorks: [
      { step: 1, title: "Choose a course", desc: "Pick Beginner Thai for Daily & Survival Communication or Beginner English for Daily Life." },
      { step: 2, title: "Book a preferred time", desc: "Match your schedule with Piya or our tutors using the live interactive timetable." },
      { step: 3, title: "Join a live 1-on-1 lesson", desc: "Connect via your Student Portal with interactive slide decks and audio pronunciation." },
      { step: 4, title: "Practice with support", desc: "Speak in realistic role-plays with gentle, immediate feedback in English & Thai." },
      { step: 5, title: "Build confidence step by step", desc: "Track your 8-lesson progress, review homework, and speak naturally in real life." }
    ],
    philosophy: [
      "Start with real communication.",
      "Keep lessons simple and focused.",
      "Build confidence through repetition and practice.",
      "Use English and Thai when needed for clarity.",
      "Make every lesson useful in daily life."
    ]
  },

  pricing: {
    thai: [
      {
        id: "thai-trial",
        badge: "สวัสดี · Thai lessons",
        featuredBadge: "START HERE",
        title: "Free Thai trial",
        price: 0,
        currency: "฿",
        unit: "1 Thai lesson",
        lessons: 1,
        course: "thai",
        darkCard: true,
        cta: "Book Free Thai Trial",
        features: [
          "1 live 1-on-1 Thai lesson",
          "Meet your tutor",
          "Find the right level for you"
        ]
      },
      {
        id: "thai-8",
        badge: "สวัสดี · Thai lessons",
        title: "8 Thai lessons",
        price: 4490,
        currency: "฿",
        currencySuffix: "THB",
        lessons: 8,
        course: "thai",
        darkCard: false,
        cta: "Book 8 Thai Lessons",
        features: [
          "Live 1-on-1 Thai lessons, 1 hour each",
          "Personalized lessons",
          "Speaking practice",
          "Feedback and support",
          "Homework and review when needed"
        ]
      },
      {
        id: "thai-16",
        badge: "สวัสดี · Thai lessons",
        title: "16 Thai lessons",
        price: 8880,
        currency: "฿",
        currencySuffix: "THB",
        lessons: 16,
        course: "thai",
        darkCard: false,
        cta: "Book 16 Thai Lessons",
        features: [
          "Live 1-on-1 Thai lessons, 1 hour each",
          "Personalized lessons",
          "Speaking practice",
          "Feedback and support",
          "Homework and review when needed"
        ]
      }
    ],
    english: [
      {
        id: "english-trial",
        badge: "Hello · English lessons",
        featuredBadge: "START HERE",
        title: "Free English trial",
        price: 0,
        currency: "฿",
        unit: "1 English lesson",
        lessons: 1,
        course: "english",
        darkCard: true,
        cta: "Book Free English Trial",
        features: [
          "1 live 1-on-1 English lesson",
          "Meet your tutor",
          "Find the right level for you"
        ]
      },
      {
        id: "english-8",
        badge: "Hello · English lessons",
        title: "8 English lessons",
        price: 3690,
        currency: "฿",
        currencySuffix: "THB",
        lessons: 8,
        course: "english",
        darkCard: false,
        cta: "Book 8 English Lessons",
        features: [
          "Live 1-on-1 English lessons, 1 hour each",
          "Personalized lessons",
          "Speaking practice",
          "Feedback and support",
          "Homework and review when needed"
        ]
      },
      {
        id: "english-16",
        badge: "Hello · English lessons",
        title: "16 English lessons",
        price: 7380,
        currency: "฿",
        currencySuffix: "THB",
        lessons: 16,
        course: "english",
        darkCard: false,
        cta: "Book 16 English Lessons",
        features: [
          "Live 1-on-1 English lessons, 1 hour each",
          "Personalized lessons",
          "Speaking practice",
          "Feedback and support",
          "Homework and review when needed"
        ]
      }
    ]
  },

  courses: {
    thai: {
      id: "thai",
      badge: "สวัสดี · Beginner Thai",
      shortTitle: "Thai Course",
      title: "Basic Thai for Daily Communication and Survival Thai",
      subtitle: "A beginner Thai course for non-Thai speakers who want to communicate in Thailand. Lessons cover greetings, polite words, food, directions, shopping, and survival Thai.",
      description: "This beginner Thai course helps non-Thai speakers communicate in everyday situations in Thailand. Lessons focus on practical phrases, polite communication, and simple conversations for real life.",
      whoItIsFor: [
        "Foreigners living in Thailand.",
        "Tourists who want useful Thai.",
        "Expats and digital nomads.",
        "Beginners who want speaking-first Thai."
      ],
      outcomes: [
        "Greet people politely.",
        "Introduce themselves.",
        "Ask and answer basic questions.",
        "Order food and drinks.",
        "Ask for directions.",
        "Shop and ask prices.",
        "Use polite Thai expressions correctly."
      ],
      format: [
        "8 lessons total (or 16-lesson extended mastery).",
        "1 hour per lesson.",
        "Live 1-on-1 tutoring.",
        "English and Thai support when needed."
      ],
      persona: "Non-Thai speakers who live in Thailand or plan to travel there, need practical speaking, want polite communication, and prefer simple explanations with repetition.",
      lessons: [
        {
          number: 1,
          title: "Greetings and Polite Words",
          lessonGoal: "Greet people politely and use essential Thai courtesy words from day one.",
          goal: "Help the student greet people politely and use basic courtesy in Thai.",
          whatToTeach: [
            "สวัสดี (sà-wàt-dii — hello / goodbye)",
            "ขอบคุณ (khàwp-khun — thank you)",
            "ขอโทษ (khǎw-thôot — sorry / excuse me)",
            "ไม่เป็นไร (mâi bpen rai — it’s okay / no problem)",
            "ครับ / ค่ะ / คะ (khráp / khâ / khá — polite endings)",
            "ใช่ / ไม่ใช่ (châi / mâi châi — yes / no) & ได้ / ไม่ได้ (dâai / mâi dâai — can / cannot)"
          ],
          grammarFocus: [
            "Polite particles: ครับ (khráp) for men, ค่ะ (khâ) for statements & คะ (khá) for questions for women",
            "Simple greeting and courtesy patterns: สวัสดีครับ/ค่ะ, ขอบคุณมากครับ/ค่ะ",
            "Asking how someone is: สบายดีไหมครับ/คะ (sà-baai-dii mái khráp/khá)"
          ],
          vocabulary: [
            "สวัสดี (sà-wàt-dii — hello)",
            "ขอบคุณ (khàwp-khun — thank you)",
            "ขอโทษ (khǎw-thôot — excuse me / sorry)",
            "ไม่เป็นไร (mâi bpen rai — no problem)",
            "สบายดี (sà-baai-dii — doing well)",
            "ใช่ / ไม่ใช่ (châi / mâi châi — yes / no)",
            "ได้ / ไม่ได้ (dâai / mâi dâai — can / cannot)"
          ],
          speakingPractice: [
            "Repeat greetings with accurate tone and polite particles (ครับ / ค่ะ / คะ).",
            "Role-play greeting a café staff member and thanking them politely.",
            "Role-play apologizing when bumping into someone and replying ไม่เป็นไร."
          ],
          homework: [
            "Practice saying all greetings and polite endings aloud 10 times.",
            "Use สวัสดีครับ/ค่ะ and ขอบคุณครับ/ค่ะ in 3 real-life interactions."
          ],
          slideDeckUrl: "lessons/lesson1.html"
        },
        {
          number: 2,
          title: "Self-Introduction",
          lessonGoal: "Introduce yourself with your name, country, and polite questions in Thai.",
          goal: "Help the student introduce themselves in Thai.",
          whatToTeach: [
            "ผม/ฉันชื่อ... (phǒm/chǎn chûue... — My name is…)",
            "ผม/ฉันมาจาก... (phǒm/chǎn maa jàak... — I am from…)",
            "ยินดีที่ได้รู้จักครับ/ค่ะ (yin-dii thîi dâai rúu-jàk — Nice to meet you)",
            "คุณชื่ออะไรครับ/คะ (khun chûue à-rai — What is your name?)",
            "คุณมาจากประเทศอะไรครับ/คะ (khun maa jàak bprà-thêet à-rai — Which country are you from?)",
            "พูดภาษาไทยได้นิดหน่อย (phûut phaa-sǎa thai dâai nít-nàwy — I can speak a little Thai)"
          ],
          grammarFocus: [
            "First-person pronouns: ผม (phǒm — male) and ฉัน (chǎn — female)",
            "Self-introduction structure: Subject + ชื่อ (name) / มาจาก (come from) + Noun",
            "Polite question and answer patterns with อะไร (à-rai — what) and ไหม (mái — yes/no)"
          ],
          vocabulary: [
            "ผม / ฉัน (phǒm / chǎn — I)",
            "คุณ (khun — you)",
            "ชื่อ (chûue — name)",
            "มาจาก (maa jàak — come from)",
            "ประเทศ (bprà-thêet — country)",
            "คนไทย / คนต่างชาติ (Thai person / foreigner)",
            "ยินดีที่ได้รู้จัก (nice to meet you)"
          ],
          speakingPractice: [
            "Introduce yourself naturally with your name, country, and city.",
            "Ask and answer a partner’s name and nationality.",
            "Role-play meeting a new Thai friend at a café or coworking space."
          ],
          homework: [
            "Write and practice your 4-sentence Thai self-introduction aloud.",
            "Introduce yourself in Thai to at least one person this week."
          ],
          slideDeckUrl: "lessons/speako-lesson-2.html"
        },
        {
          number: 3,
          title: "Numbers, Time, and Basic Questions",
          lessonGoal: "Use Thai numbers, tell time, and ask essential everyday questions.",
          goal: "Help the student understand and use numbers, time, and simple question patterns.",
          whatToTeach: [
            "Numbers in Thai 0–100+ (ศูนย์, หนึ่ง, สอง, สาม... สิบ, ยี่สิบ, ร้อย)",
            "กี่โมงแล้วครับ/คะ (gìi moong láew — What time is it?)",
            "เท่าไหร่ครับ/คะ (thâo-rài — How much is it?)",
            "ที่ไหนครับ/คะ (thîi-nǎi — Where?)",
            "อะไร / ใคร / กี่อัน (à-rai / khrai / gìi an — What / Who / How many?)",
            "Basic counting and classifiers for daily life"
          ],
          grammarFocus: [
            "Number building rules: 11 = สิบเอ็ด (sìp-èt), 20 = ยี่สิบ (yîi-sìp), tens + units",
            "Question word placement at the end of Thai sentences (อยู่ที่ไหน, เท่าไหร่, กี่โมง)",
            "Counting items with Noun + Number + Classifier (เช่น สองอัน — sǎawng an)"
          ],
          vocabulary: [
            "หนึ่ง–สิบ (1–10)",
            "ยี่สิบ / ร้อย (20 / 100)",
            "บาท (bàat — Thai baht)",
            "กี่โมง (gìi moong — what time)",
            "นาที (naa-thii — minute)",
            "เท่าไหร่ (thâo-rài — how much)",
            "ที่ไหน (thîi-nǎi — where)",
            "วันนี้ / พรุ่งนี้ (today / tomorrow)"
          ],
          speakingPractice: [
            "Count numbers 1–100 aloud with clear tones.",
            "Ask and answer the time and daily schedules.",
            "Practice rapid question-and-answer drills using เท่าไหร่, ที่ไหน, and กี่โมง."
          ],
          homework: [
            "Practice counting from 1 to 100 in Thai.",
            "Write 5 simple question-and-answer pairs using เท่าไหร่, ที่ไหน, and กี่โมง."
          ],
          slideDeckUrl: "lessons/lesson-3-numbers-time-questions.html"
        },
        {
          number: 4,
          title: "Ordering Food and Drinks",
          lessonGoal: "Order food and drinks politely, customize spice levels, and ask for the bill.",
          goal: "Help the student order food politely in a restaurant or cafe.",
          whatToTeach: [
            "ขอ...หน่อยครับ/ค่ะ (khǎaw ... nàwy — May I have..., please?)",
            "เอา...ครับ/ค่ะ (ao ... — I’ll take / I’d like...)",
            "เผ็ด / ไม่เผ็ด / เผ็ดนิดหน่อย (phèt / mâi phèt / phèt nít-nàwy — spicy / not spicy / a little spicy)",
            "อร่อยมาก (à-ràwy mâak — very delicious)",
            "ข้าว, ก๋วยเตี๋ยว, น้ำเปล่า, กาแฟ, ชาไทย (rice, noodles, water, coffee, Thai tea)",
            "เก็บเงินด้วยครับ/ค่ะ / เช็คบิลด้วยครับ/ค่ะ (check/bill, please)"
          ],
          grammarFocus: [
            "Polite food & drink request patterns: ขอ + Item + หน่อยครับ/ค่ะ and เอา + Item + ครับ/ค่ะ",
            "Customizing orders: ไม่ใส่พริก (no chili), ไม่หวาน (not sweet), เย็น / ร้อน (iced / hot)",
            "Ordering quantities with classifiers: น้ำเปล่าหนึ่งขวด (1 bottle of water), กาแฟเย็นหนึ่งแก้ว (1 iced coffee)"
          ],
          vocabulary: [
            "ขอ...หน่อย (khǎaw...nàwy — may I have)",
            "เอา (ao — take / want)",
            "เมนู (mee-nuu — menu)",
            "ข้าวผัด / ผัดไทย (fried rice / Pad Thai)",
            "น้ำเปล่า / กาแฟ (water / coffee)",
            "เผ็ด / ไม่เผ็ด (spicy / not spicy)",
            "อร่อย (à-ràwy — delicious)",
            "เช็คบิล (chék-bin — bill please)"
          ],
          speakingPractice: [
            "Order a full meal and drink in a restaurant role-play.",
            "Customize spice and sweetness levels politely.",
            "Ask for the menu, extra water, and the bill."
          ],
          homework: [
            "Learn 10 food and drink words from the slide deck.",
            "Practice ordering your favorite Thai dish and drink aloud."
          ],
          slideDeckUrl: "lessons/speako-lesson-4-food-and-drinks.html"
        },
        {
          number: 5,
          title: "Directions and Transportation",
          lessonGoal: "Ask where places are, understand directions, and ride taxis, BTS, and MRT in Thai.",
          goal: "Help the student ask for and understand directions in Thai.",
          whatToTeach: [
            "ไปไหน (bpai nǎi — where are you going?) & ...อยู่ที่ไหน (... yùu thîi-nǎi — where is ...?)",
            "ตรงไป (dtrong bpai — go straight), เลี้ยวซ้าย (líao sáai — turn left), เลี้ยวขวา (líao khwǎa — turn right)",
            "ใกล้ / ไกล (glâi / glai — near / far) & ที่นี่ / ที่นั่น (thîi-nîi / thîi-nân — here / there)",
            "ตลาดอยู่ที่ไหนครับ/คะ (Where is the market?) & ไปตลาดยังไงครับ/คะ (How do I get to the market?)",
            "ใช้เวลากี่นาทีครับ/คะ (How many minutes does it take?) & หยุดที่นี่ครับ/ค่ะ (Stop here, please)",
            "แท็กซี่ (taxi), รถเมล์ (bus), รถไฟ (train), รถไฟฟ้า (BTS), รถไฟใต้ดิน (MRT), โรงแรม (hotel), ตลาด (market)"
          ],
          grammarFocus: [
            "Location pattern: [Place] + อยู่ที่ไหนครับ/คะ (Where is [Place]?)",
            "How-to-go pattern: ไป + [Place] + ยังไงครับ/คะ (How do I get to [Place]?)",
            "Sequencing directions: ตรงไปแล้วเลี้ยวซ้าย (Go straight, then turn left) & taxi commands: ไปโรงแรมครับ/ค่ะ, หยุดที่นี่ครับ/ค่ะ"
          ],
          vocabulary: [
            "ไปไหน (bpai nǎi — where going?)",
            "...อยู่ที่ไหน (... yùu thîi-nǎi — where is...?)",
            "ตรงไป (dtrong bpai — go straight)",
            "เลี้ยวซ้าย / เลี้ยวขวา (turn left / turn right)",
            "ใกล้ / ไกล (glâi / glai — near / far)",
            "ที่นี่ / ที่นั่น (thîi-nîi / thîi-nân — here / there)",
            "ถนน / ซอย (thà-nǒn / saawy — road / soi)",
            "ตลาด / โรงแรม / แผนที่ (market / hotel / map)",
            "แท็กซี่ / รถเมล์ / รถไฟ / รถไฟฟ้า / รถไฟใต้ดิน (taxi / bus / train / BTS / MRT)",
            "หยุดที่นี่ (yùt thîi-nîi — stop here)"
          ],
          speakingPractice: [
            "Role-play 1: Ask a local on the street where the market is and whether it is far.",
            "Role-play 2: Tell a taxi driver your destination, ask how many minutes it takes, and ask to stop here.",
            "Give and follow step-by-step directions using ตรงไป, เลี้ยวซ้าย, and เลี้ยวขวา."
          ],
          homework: [
            "Memorize the direction words.",
            "Practice asking how to get to 3 places (for example the market, the hotel, the train station)."
          ],
          slideDeckUrl: "lessons/lesson5.html"
        },
        {
          number: 6,
          title: "Shopping and Prices",
          lessonGoal: "Ask prices, point out items, bargain politely at markets, and pay by cash or card.",
          goal: "Help the student buy things and ask prices in Thai.",
          whatToTeach: [
            "อันนี้เท่าไหร่ครับ/คะ (an-níi thâo-rài — How much is this one?)",
            "เอาอันนี้ครับ/ค่ะ (ao an-níi — I’ll take this one) & ขอดูหน่อยครับ/ค่ะ (khǎaw duu nàwy — Can I take a look?)",
            "มี...ไหมครับ/คะ (mii ... mái — Do you have ...?) & ไม่เอา (mâi ao — no thanks / I don’t want it)",
            "แพงไปครับ/ค่ะ (phaaeng bpai — That’s too expensive) & ลดหน่อยได้ไหมครับ/คะ (lót nàwy dâai mái — Can you give a small discount?)",
            "ถูกกว่านี้ได้ไหมครับ/คะ (thùuk gwàa níi dâai mái — Can it be cheaper?)",
            "ทั้งหมดเท่าไหร่ครับ/คะ (tháng-mòt thâo-rài — How much in total?) & จ่ายด้วยบัตรได้ไหมครับ/คะ (Can I pay by card?)"
          ],
          grammarFocus: [
            "Demonstrative pronouns: อันนี้ (an-níi — this one) and อันนั้น (an-nán — that one)",
            "Polite bargaining patterns: ลดหน่อยได้ไหมครับ/คะ & ถูกกว่านี้ได้ไหมครับ/คะ (normal at markets, not in malls or fixed-price shops)",
            "Payment & availability questions: มี + [Item] + ไหมครับ/คะ and จ่ายด้วย + [เงินสด / บัตร] + ได้ไหมครับ/คะ"
          ],
          vocabulary: [
            "ซื้อ / ขาย (súue / khǎai — buy / sell)",
            "ร้าน / ตลาด (ráan / dtà-làat — shop / market)",
            "เงิน / เงินสด / บัตร (ngern / ngern-sòt / bàt — money / cash / card)",
            "จ่าย / ราคา (jàai / raa-khaa — pay / price)",
            "แพง / ถูก (phaaeng / thùuk — expensive / cheap)",
            "อันนี้ / อันนั้น (an-níi / an-nán — this one / that one)",
            "ลด / ทอนเงิน (lót / thaawn ngern — discount / change)",
            "ได้ / ไม่ได้ / ไม่เอา (can / cannot / no thanks)",
            "ทั้งหมด (tháng-mòt — total / all)"
          ],
          speakingPractice: [
            "Practice hearing and saying real Thai prices: 80 baht (แปดสิบบาท), 120 baht (หนึ่งร้อยยี่สิบบาท), 200 baht (สองร้อยบาท).",
            "Role-play 1 (Market): Ask to look at an item, ask the price, bargain politely from 80 to 70 baht, and buy it.",
            "Role-play 2 (Paying): Ask for the total price and ask if you can pay by credit card."
          ],
          homework: [
            "Practice saying 5 prices in Thai.",
            "Write a short shopping dialogue and read it aloud."
          ],
          slideDeckUrl: "lessons/lesson6.html"
        },
        {
          number: 7,
          title: "Daily Needs and Common Situations",
          lessonGoal: "Handle real-life needs, communication breakdowns, and emergencies calmly in Thai.",
          goal: "Help the student handle simple real-life situations in Thai.",
          whatToTeach: [
            "ช่วยหน่อยได้ไหมครับ/คะ (chûai nàwy dâai mái — Can you help me, please?) & ช่วยด้วย (chûai dûai — help!)",
            "พูดช้าๆ ได้ไหมครับ/คะ (phûut cháa-cháa dâai mái — Can you speak slowly?) & พูดอีกทีได้ไหมครับ/คะ (Can you say that again?)",
            "ไม่เข้าใจ (mâi khâo-jai — I don’t understand) & แปลว่าอะไรครับ/คะ (bplaa wâa à-rai — What does that mean?)",
            "ห้องน้ำอยู่ที่ไหนครับ/คะ (hâawng-náam yùu thîi-nǎi — Where is the bathroom?)",
            "มีไวไฟไหมครับ/คะ (mii wai-fai mái — Do you have Wi-Fi?) & รหัสอะไรครับ/คะ (rá-hàt à-rai — What is the password?)",
            "ไม่สบายครับ/ค่ะ (mâi sà-baai — I don’t feel well) & ต้องไปโรงพยาบาลครับ/ค่ะ (I need to go to the hospital)"
          ],
          grammarFocus: [
            "Polite ability/request pattern: [Action] + ได้ไหมครับ/คะ (Can you [Action]?)",
            "Expressing needs & wants: ต้องการ (dtâawng-gaan — need) and อยากได้ (yàak dâai — want to have)",
            "Clarification & medical survival phrases: ไม่เข้าใจ, พูดช้าๆ ได้ไหม, ไม่สบาย, เจ็บ (jèp — hurt/pain)"
          ],
          vocabulary: [
            "ช่วย / ช่วยด้วย (chûai / chûai dûai — help / help!)",
            "เข้าใจ / ไม่เข้าใจ (khâo-jai / mâi khâo-jai — understand / don’t understand)",
            "พูดช้าๆ / อีกที (phûut cháa-cháa / ìik-thii — speak slowly / one more time)",
            "ต้องการ / อยากได้ (dtâawng-gaan / yàak dâai — need / want to have)",
            "ห้องน้ำ (hâawng-náam — bathroom / toilet)",
            "โทรศัพท์ / ไวไฟ / รหัส (thoo-rá-sàp / wai-fai / rá-hàt — phone / Wi-Fi / password)",
            "แบตหมด / ปัญหา (bàaet mòt / bpan-hǎa — battery dead / problem)",
            "ไม่สบาย / เจ็บ (mâi sà-baai / jèp — sick / hurt)",
            "โรงพยาบาล / ร้านขายยา / ตำรวจ (hospital / pharmacy / police)"
          ],
          speakingPractice: [
            "Role-play 1 (Asking for help): Ask where the bathroom is, ask someone to speak slowly, and follow directions.",
            "Role-play 2 (At a pharmacy): Explain that you don’t feel well (ไม่สบาย) and need medicine (ต้องการยา).",
            "Practice asking for Wi-Fi and passwords at a café and handling communication breakdowns."
          ],
          homework: [
            "Memorize 10 survival phrases.",
            "Practice saying them aloud until they feel natural."
          ],
          slideDeckUrl: "lessons/lesson7.html"
        },
        {
          number: 8,
          title: "Review and Role Play",
          lessonGoal: "Combine all 7 lessons into realistic Thai conversations across a full day in Thailand.",
          goal: "Help the student use all the course language in realistic conversations.",
          whatToTeach: [
            "Comprehensive review of Lessons 1–7: greetings, self-introduction, numbers & time, ordering food, directions & transport, shopping & bargaining, and daily needs/survival.",
            "Phrase Builder review: ขอ/เอา..., ...อยู่ที่ไหน, ...เท่าไหร่, ...ได้ไหม across multiple real-life situations.",
            "4-Part 'A Day in Thailand' Simulation: Morning at a Café, Afternoon in a Taxi, Evening at a Night Market, and Solving a Surprise Problem."
          ],
          grammarFocus: [
            "Combining core patterns: ขอ + [item] + หน่อย, [place] + อยู่ที่ไหน, [item] + เท่าไหร่, and [action] + ได้ไหม",
            "Natural conversation flow: Opening politely (ขอโทษครับ/ค่ะ) -> Asking/Ordering -> Follow-up question -> Closing politely (ขอบคุณครับ/ค่ะ)",
            "Consistent politeness particles: ครับ (khráp) for men; ค่ะ (khâ) for statements and คะ (khá) for questions for women"
          ],
          vocabulary: [
            "All essential vocabulary from Lessons 1–7",
            "Greetings & Introductions (สวัสดี, ชื่อ, มาจาก, ยินดีที่ได้รู้จัก)",
            "Numbers, Time & Prices (เท่าไหร่, กี่โมง, บาท, ทั้งหมด)",
            "Food & Café (ขอ...หน่อย, เอา..., ไม่เผ็ด, เช็คบิล, ไวไฟ)",
            "Directions & Transport (อยู่ที่ไหน, ตรงไป, เลี้ยวซ้าย/ขวา, หยุดที่นี่)",
            "Shopping & Survival (ลดหน่อยได้ไหม, ช่วยหน่อยได้ไหม, พูดช้าๆ ได้ไหม, ห้องน้ำ)"
          ],
          speakingPractice: [
            "Scene 1 (Morning at a Café): Greet staff, introduce yourself, order iced coffee & fried rice (not spicy), ask for Wi-Fi, and ask for the bill.",
            "Scene 2 (Afternoon in a Taxi): Tell the driver to go to the market, ask how many minutes it takes, give directions, and ask to stop here.",
            "Scene 3 (Evening at a Night Market): Ask the price, bargain politely, buy items, and pay.",
            "Scene 4 (Surprise Problem) + 3-Minute Free-Talk Challenge with personalized teacher feedback."
          ],
          homework: [
            "Keep using your Thai every day: greet people, order food, ask prices, and make small talk!",
            "Review any phrases from Lessons 1–8 using the interactive slide decks and audio buttons."
          ],
          slideDeckUrl: "lessons/lesson8.html"
        }
      ]
    },

    english: {
      id: "english",
      badge: "Hello · Beginner English",
      shortTitle: "English Course",
      title: "Basic English for Daily Communication and Self-Introduction",
      subtitle: "A beginner English course focused on greetings, self-introduction, basic grammar, daily routines, and simple conversations. Perfect for learners who want to speak in everyday situations.",
      description: "This beginner English course helps students improve basic grammar and daily communication. The lessons focus on speaking, asking and answering questions, introducing yourself, and using English in real-life situations.",
      whoItIsFor: [
        "Beginner English learners.",
        "Adults who want practical communication.",
        "Students who want more confidence speaking.",
        "Learners who need simple explanations and personal support."
      ],
      outcomes: [
        "Introduce themselves.",
        "Ask and answer simple questions.",
        "Talk about daily routines.",
        "Describe family and hobbies.",
        "Communicate about everyday life with more confidence."
      ],
      format: [
        "8 lessons total (or 16-lesson extended mastery).",
        "1 hour per lesson.",
        "Live 1-on-1 tutoring.",
        "English and Thai support when needed."
      ],
      persona: "Beginner adult learners aged 24–35. This includes people working in hospitality, service, office, or retail who want to speak basic English for daily life and work. They feel nervous speaking and prefer simple explanations and practical lessons.",
      lessons: [
        {
          number: 1,
          title: "Greetings and Introductions",
          goal: "Help the student introduce themselves and use basic greetings in a short conversation.",
          whatToTeach: [
            "Hello, hi, good morning, good afternoon, good evening.",
            "Goodbye, bye, see you later.",
            "My name is… / I’m… / I’m from…",
            "Nice to meet you.",
            "What’s your name? / Where are you from?"
          ],
          grammarFocus: ["Subject pronouns: I, you", "Verb be: am, are", "Basic question forms"],
          vocabulary: ["Name", "country", "city", "friend", "meet", "introduce"],
          speakingPractice: [
            "Teacher models a short conversation.",
            "Student repeats and personalizes it.",
            "Student answers simple questions about name and country.",
            "Student introduces themself in 3 to 5 sentences."
          ],
          homework: [
            "Write 5 introduction sentences.",
            "Record a short self-introduction and listen back."
          ],
          slideDeckUrl: null
        },
        {
          number: 2,
          title: "Pronouns and Be Verb",
          goal: "Help the student build basic sentences using pronouns and the verb be.",
          whatToTeach: [
            "I, you, he, she, it, we, they.",
            "am, is, are.",
            "I am a student. / She is my friend. / They are from Thailand.",
            "Is he a teacher? / Are you ready?"
          ],
          grammarFocus: ["Subject pronouns", "Present tense of be", "Affirmative, negative, and question forms"],
          vocabulary: ["Student", "teacher", "friend", "doctor", "worker", "Thai", "English"],
          speakingPractice: [
            "Match pronouns with correct be verb.",
            "Make true sentences about yourself and other people.",
            "Ask and answer yes/no questions."
          ],
          homework: [
            "Write 8 sentences using am, is, and are.",
            "Practice reading them aloud."
          ],
          slideDeckUrl: null
        },
        {
          number: 3,
          title: "Personal Information",
          goal: "Help the student talk about basic personal details.",
          whatToTeach: [
            "Name, age, job, nationality, phone number, email, city.",
            "What do you do?",
            "How old are you?",
            "Where do you live?",
            "What’s your phone number?"
          ],
          grammarFocus: ["Question words: what, where, how old", "Short answers"],
          vocabulary: ["Name", "age", "job", "work", "live", "email", "phone"],
          speakingPractice: [
            "Fill in a personal information form.",
            "Ask and answer partner questions.",
            "Give a short profile about yourself."
          ],
          homework: [
            "Complete a personal profile sheet.",
            "Practice answering 5 personal questions."
          ],
          slideDeckUrl: null
        },
        {
          number: 4,
          title: "Questions and Answers",
          goal: "Help the student ask and answer simple everyday questions.",
          whatToTeach: [
            "What, where, who, how, when.",
            "Do you like…?",
            "What do you do?",
            "Where are you going?",
            "How are you?",
            "When do you study?"
          ],
          grammarFocus: ["WH-questions", "Yes/no questions", "Short answers"],
          vocabulary: ["Daily life words and common action words"],
          speakingPractice: [
            "Build questions from prompts.",
            "Role-play short Q&A exchanges.",
            "Practice asking follow-up questions."
          ],
          homework: [
            "Write 10 simple questions.",
            "Answer them in full sentences."
          ],
          slideDeckUrl: null
        },
        {
          number: 5,
          title: "Daily Routines",
          goal: "Help the student talk about their everyday schedule.",
          whatToTeach: [
            "Wake up, brush teeth, eat breakfast, go to work, study, have lunch, go home, sleep.",
            "In the morning, in the afternoon, in the evening.",
            "At 7 o’clock, at noon, at night."
          ],
          grammarFocus: ["Simple present tense", "Frequency words: always, usually, often, sometimes"],
          vocabulary: ["Routine", "morning", "afternoon", "evening", "lunch", "dinner", "bed", "work", "study"],
          speakingPractice: [
            "Describe a normal day.",
            "Ask and answer routine questions.",
            "Compare your routine with the student’s routine."
          ],
          homework: [
            "Write 8 sentences about your daily routine.",
            "Record a 1-minute speaking practice."
          ],
          slideDeckUrl: null
        },
        {
          number: 6,
          title: "Family and People",
          goal: "Help the student talk about family members and describe people.",
          whatToTeach: [
            "Mother, father, sister, brother, husband, wife, son, daughter.",
            "Tall, short, young, old, kind, friendly.",
            "This is my… / He is… / She is…"
          ],
          grammarFocus: ["Possessive words: my, your, his, her", "Simple descriptive sentences"],
          vocabulary: ["Family", "people", "relationships", "appearance", "personality"],
          speakingPractice: [
            "Show a family tree and describe it.",
            "Talk about one family member.",
            "Describe a friend or classmate."
          ],
          homework: [
            "Draw a simple family tree and label it in English.",
            "Write 5 sentences about your family."
          ],
          slideDeckUrl: null
        },
        {
          number: 7,
          title: "Likes and Hobbies",
          goal: "Help the student talk about preferences and free-time activities.",
          whatToTeach: [
            "I like… / I don’t like… / Do you like…?",
            "Hobbies: reading, cooking, music, movies, travel, sports, shopping.",
            "In my free time…"
          ],
          grammarFocus: ["Like / don’t like", "Simple opinion statements", "Questions about preferences"],
          vocabulary: ["Hobby", "free time", "music", "movie", "book", "game", "travel", "sport"],
          speakingPractice: [
            "Ask and answer hobby questions.",
            "Make a list of favorite activities.",
            "Give short opinions."
          ],
          homework: [
            "Write 5 things you like and 5 things you don’t like.",
            "Practice speaking for 1 minute about hobbies."
          ],
          slideDeckUrl: null
        },
        {
          number: 8,
          title: "Review and Speaking Practice",
          goal: "Help the student use all the course language in real conversations.",
          whatToTeach: [
            "Review all previous lesson vocabulary and grammar.",
            "Review self-introduction, personal information, questions, routines, family, and hobbies.",
            "Practice complete short conversations."
          ],
          grammarFocus: ["Review of am/is/are", "Review of WH-questions", "Review of simple present and like/don’t like"],
          vocabulary: ["All key vocabulary from the course"],
          speakingPractice: [
            "Role-play greetings and introductions.",
            "Role-play daily life situations.",
            "Answer mixed questions from the teacher.",
            "Give a full self-introduction and short daily-life conversation."
          ],
          homework: [
            "Review notes from all lessons.",
            "Prepare a final speaking practice answer."
          ],
          slideDeckUrl: null
        }
      ]
    }
  },

  testimonials: [
    {
      name: "Daniel K.",
      role: "Digital Nomad in Bangkok",
      course: "8 Thai Lessons",
      quote: "After just 3 lessons with Piya, I could introduce myself, count prices at the market, and order food politely without switching to English. The interactive slide decks make reviewing so easy!",
      rating: 5
    },
    {
      name: "Nattaya W.",
      role: "Hospitality Coordinator",
      course: "8 English Lessons",
      quote: "I used to feel so nervous speaking to foreign guests at work. Piya explains everything clearly in both Thai and English. Now I can hold daily conversations with real confidence.",
      rating: 5
    },
    {
      name: "Marcus L.",
      role: "Expat in Chiang Mai",
      course: "16 Thai Lessons",
      quote: "Booking my schedule every week takes 10 seconds, and having all my lesson notes, homework, and slides inside my student timetable keeps me consistent.",
      rating: 5
    }
  ],

  faqs: [
    {
      q: "How do the lessons work?",
      a: "Lessons are live and private, one-on-one sessions. Each class focuses on practical communication and speaking practice tailored to your exact pace."
    },
    {
      q: "How long is each lesson?",
      a: "Each lesson is 1 full hour (60 minutes) of live 1-on-1 tutoring."
    },
    {
      q: "What courses are available?",
      a: "Two structured beginner courses are available: Basic English for Daily Communication and Self-Introduction, and Basic Thai for Daily Communication and Survival Thai."
    },
    {
      q: "What language is used in class?",
      a: "Lessons can be taught in Thai and English depending on the student’s level and comfort—so you never feel lost."
    },
    {
      q: "Can the schedule be chosen?",
      a: "Yes! Students can view their teacher's live availability calendar and book the exact dates and times that work best for them."
    },
    {
      q: "Are the lessons live or recorded?",
      a: "All lessons are 100% live 1-on-1 sessions, not pre-recorded videos."
    },
    {
      q: "How much does it cost?",
      a: "You can start with a ฿0 Free Trial lesson (1 full lesson to meet your tutor and find your level). For Thai, packages are ฿4,490 THB (8 lessons) or ฿8,880 THB (16 lessons). For English, packages are ฿3,690 THB (8 lessons) or ฿7,380 THB (16 lessons)."
    },
    {
      q: "What is included in the course?",
      a: "Live 1-on-1 tutoring, personalized lesson guidance, interactive slide decks with audio pronunciation, speaking practice, feedback, and homework review."
    },
    {
      q: "Will there be homework?",
      a: "Yes. Short, practical homework tasks are given after each lesson to help you review and practice speaking between classes."
    },
    {
      q: "What can students expect after finishing?",
      a: "Students will be able to communicate in basic daily situations, introduce themselves, ask and answer simple questions, and feel much more confident speaking."
    }
  ]
};
