// index.js (discord.js v14) — Night City RP
// Put TOKEN in Railway Variables: TOKEN=xxxxx  (DO NOT hardcode token here)

const {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

// ===================== CONFIG =====================
const TOKEN = process.env.TOKEN;

// Review channels
const RP_REVIEW_CHANNEL_ID = "1477562619001831445";
const CREATOR_REVIEW_CHANNEL_ID = "1477777545767420116";

// ✅ NEW: Admin review channel
const ADMIN_REVIEW_CHANNEL_ID = "1479216695938650263";

// Panels channels
const RP_APPLY_PANEL_CHANNEL_ID = "1465803291714785481";       // بانل تقديم RP (لوحده)
const SERVICES_PANEL_CHANNEL_ID = "1465757986684403828";       // بانل خدمات/تكتات/صانع محتوى/إدارة

// Voice interview room (Voice Channel ID)
const VOICE_ROOM_ID = "1465752669564964935";

// Ticket categories
const SUPPORT_CATEGORY_ID = "1473850568811221194";
const APPEAL_CATEGORY_ID  = "1477765907496308897";
const REPORT_CATEGORY_ID  = "1473850252149788867";
const SUGGEST_CATEGORY_ID = "1477766632817426675";

// Admin roles (who can approve/reject/close tickets)
const ADMIN_ROLE_IDS = [
  "1465798793772666941",
  "1465800480474005569",
  "1467593770898948158",
];

// Roles
const CREATOR_ROLE_ID     = "1477845260095979552";
const RP_PASS_ROLE_ID     = "1477569088988512266";
const RP_REJECT1_ROLE_ID  = "1477568923208519681";
const RP_REJECT2_ROLE_ID  = "1477569051185119332";

// ✅ NEW: Role for accepted admin application
// NOTE: Discord Role IDs are usually 18-19 digits.
// If your ID is missing a digit, this won't work.
const ADMIN_ACCEPT_ROLE_ID = "14675937708948158";

// Panel markers (avoid duplicates on restart)
const PANEL_MARKER_RP = "PANEL_RP_APPLY_v2";
const PANEL_MARKER_SERVICES = "PANEL_SERVICES_v2";

// Anti-spam / sessions
const activeApplications = new Set();           // userId in flow
const sessions = new Map();                     // userId -> {type, step, answers, guildId}
const applyCooldown = new Map();                // userId -> timestamp
const COOLDOWN_MS = 2 * 60 * 1000;              // 2 minutes

// ===================== QUESTIONS =====================
const RP_QUESTIONS = [
  { key: "fullName", q: "📌 *الاسم الكامل للشخصية؟*" },
  { key: "age", q: "🎂 *العمر؟*" },
  { key: "rules", q: "📚 *هل قرأت القوانين؟* اكتب (نعم) + اذكر أهم 3 نقاط فهمتهم." },
  { key: "experience", q: "🎮 *هل عندك خبرة RP؟* اشرح باختصار." },
  { key: "story", q: "📝 *اكتب قصة للشخصية (150 كلمة على الأقل).*" },
  { key: "mic", q: "🎙️ *هل المايك كويس؟* (نعم/لا) + نوعه لو تعرف." },
  { key: "commit", q: "✅ *هل تلتزم بالقوانين واحترام الإدارة؟* (نعم/لا)" },
];

const CREATOR_QUESTIONS = [
  { key: "channelLink", q: "🔗 *رابط القناة/الحساب؟*" },
  { key: "followers", q: "👥 *عدد المتابعين/المشتركين؟*" },
  { key: "contentType", q: "🎥 *نوع المحتوى اللي بتقدمه؟*" },
  { key: "schedule", q: "📅 *جدول النشر/البث؟* (أيام/ساعات)" },
  { key: "why", q: "💡 *ليه عايز تكون صانع محتوى عندنا؟*" },
  { key: "agree", q: "✅ *تتعهد بعدم مخالفة القوانين؟* (نعم/لا)" },
];

// ✅ NEW: Admin application (12 questions)
const ADMIN_QUESTIONS = [
  { key: "discordName", q: "👤 *اسمك في الديسكورد (مع التاغ)؟*" },
  { key: "age", q: "🎂 *عمرك؟*" },
  { key: "timezone", q: "🕒 *بلدك/التوقيت؟*" },
  { key: "activity", q: "⏱️ *كم ساعة تقدر تكون متواجد يوميًا؟*" },
  { key: "experience", q: "🛡️ *هل عندك خبرة إدارة؟ اذكر سيرفرات/مدة/دورك.*" },
  { key: "rules", q: "📚 *اذكر 5 قوانين مهمة في السيرفر من وجهة نظرك.*" },
  { key: "conflict", q: "🤝 *لو اتنين لاعبين بيتخانقوا، هتتصرف إزاي خطوة بخطوة؟*" },
  { key: "metapg", q: "🎮 *اشرح الفرق بين Meta Gaming و Power Gaming + مثال لكل واحد.*" },
  { key: "reports", q: "🚨 *لو جاء بلاغ ضد لاعب مشهور/صديقك، هتتعامل إزاي بدون تحيز؟*" },
  { key: "evidence", q: "📎 *إيه نوع الأدلة اللي تقبلها في البلاغات؟ (فيديو/لوج/سكرين… إلخ)*" },
  { key: "pressure", q: "🧠 *إزاي تتعامل مع ضغط/إهانة من لاعب أثناء المشكلة؟*" },
  { key: "commit", q: "✅ *تتعهد بالحياد والالتزام بالقوانين وعدم إساءة استخدام الصلاحيات؟ (نعم/لا)*" },
];

// ===================== CLIENT =====================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

// ===================== HELPERS =====================
function isAdmin(member) {
  if (!member) return false;
  if (member.permissions?.has(PermissionsBitField.Flags.Administrator)) return true;
  return ADMIN_ROLE_IDS.some((rid) => member.roles?.cache?.has(rid));
}

function safeTrim(v, max = 1024) {
  if (!v) return "";
  const s = String(v).trim();
  if (!s) return "";
  return s.length > max ? s.slice(0, max - 3) + "..." : s;
}

function wordCount(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function tooShortAnswer(text) {
  const t = String(text || "").trim();
  if (t.length < 3) return true;               // "1", ".", "ok"
  if (/^[\d\W_]+$/.test(t) && t.length < 6) return true; // "111", "..", "؟؟"
  return false;
}

async function findMarkerMessage(ch, marker) {
  const msgs = await ch.messages.fetch({ limit: 50 }).catch(() => null);
  if (!msgs) return null;
  for (const [, m] of msgs) {
    const e = m.embeds?.[0];
    const footer = e?.footer?.text || "";
    if (footer.includes(marker)) return m;
  }
  return null;
}

function disableAllComponents(message) {
  const newRows = message.components.map((row) => {
    const r = ActionRowBuilder.from(row);
    r.components = r.components.map((c) => ButtonBuilder.from(c).setDisabled(true));
    return r;
  });
  return newRows;
}

function now() { return Date.now(); }

function inCooldown(userId) {
  const last = applyCooldown.get(userId) || 0;
  return now() - last < COOLDOWN_MS;
}

function setCooldown(userId) { applyCooldown.set(userId, now()); }

function ticketLabel(kind) {
  switch (kind) {
    case "support": return "🧰 دعم فني";
    case "appeal":  return "🧾 استئناف";
    case "report":  return "🚨 بلاغ";
    case "suggest": return "💡 اقتراح";
    default:        return "🎫 تذكرة";
  }
}

function ticketCategory(kind) {
  switch (kind) {
    case "support": return SUPPORT_CATEGORY_ID;
    case "appeal":  return APPEAL_CATEGORY_ID;
    case "report":  return REPORT_CATEGORY_ID;
    case "suggest": return SUGGEST_CATEGORY_ID;
    default:        return SUPPORT_CATEGORY_ID;
  }
}

async function buildTranscript(channel, limit = 100) {
  const msgs = await channel.messages.fetch({ limit }).catch(() => null);
  if (!msgs) return "لا يوجد سجل رسائل.";
  const arr = [...msgs.values()].reverse();
  const lines = arr.map((m) => {
    const time = new Date(m.createdTimestamp).toLocaleString();
    const author = ${m.author?.tag || "Unknown"};
    const content = (m.content || "").replace(/\n/g, " ");
    return [${time}] ${author}: ${content}.trim();
  });
  const text = lines.join("\n");
  return text.length ? text.slice(0, 18000) : "لا يوجد سجل رسائل.";
}

// ===================== EMBEDS (STYLES) =====================
function embedReviewHeader(title) {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(title)
    .setFooter({ text: "Night City RP • Review" })
    .setTimestamp();
}

function embedAcceptRP(guildId) {
  const url = https://discord.com/channels/${guildId}/${VOICE_ROOM_ID};
  return {
    embed: new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle("🎉 تم قبول طلبك!")
      .setDescription(
        "━━━━━━━━━━━━━━━━━━\n" +
        "✅ **تهانينا!**\n\n" +
        "تم قبولك مبدئيًا في السيرفر 👑\n" +
        "اضغط الزر بالأسفل للدخول للمقابلة الصوتية 🎤\n" +
        "━━━━━━━━━━━━━━━━━━"
      )
      .setFooter({ text: "Night City RP • الإدارة" })
      .setTimestamp(),
    row: new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("🎤 دخول المقابلة الصوتية")
        .setStyle(ButtonStyle.Link)
        .setURL(url)
    ),
  };
}

function embedAcceptCreator() {
  return new EmbedBuilder()
    .setColor(0x00ff88)
    .setTitle("🎉 تم قبولك كصانع محتوى!")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━\n" +
      "✅ **مبروك!**\n\n" +
      "تم قبولك ك*صانع محتوى*** في السيرفر 🎥🔥\n" +
      "ابدأ الآن بنشر محتواك وابداعك معنا.\n" +
      "━━━━━━━━━━━━━━━━━━"
    )
    .setFooter({ text: "Night City RP • الإدارة" })
    .setTimestamp();
}

function embedAcceptAdmin() {
  return new EmbedBuilder()
    .setColor(0x00ff88)
    .setTitle("👮 تم قبولك كإدارة!")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━\n" +
      "✅ **مبروك!**\n\n" +
      "تم قبولك كـ *إدارة* في السيرفر.\n" +
      "التزم بالقوانين والحياد، وأي إساءة استخدام للصلاحيات تؤدي للعقوبة.\n" +
      "━━━━━━━━━━━━━━━━━━"
    )
    .setFooter({ text: "Night City RP • الإدارة" })
    .setTimestamp();
}

function embedReject(reason, title = "❌ تم رفض طلبك") {
  return new EmbedBuilder()
    .setColor(0xff2d2d)
    .setTitle(title)
    .setDescription(
      "━━━━━━━━━━━━━━━━━━\n" +
      "⚠️ **سبب الرفض:**\n" +
      ${safeTrim(reason, 1500)}\n +
      "━━━━━━━━━━━━━━━━━━"
    )
    .setFooter({ text: "Night City RP • الإدارة" })
    .setTimestamp();
}

// ===================== PANELS =====================
async function ensurePanels(guild) {
  // RP Panel
  if (RP_APPLY_PANEL_CHANNEL_ID) {
    const ch = await guild.channels.fetch(RP_APPLY_PANEL_CHANNEL_ID).catch(() => null);
    if (ch && ch.isTextBased()) {
      const exists = await findMarkerMessage(ch, PANEL_MARKER_RP);
      if (!exists) {
        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle("📝 تقديم السيرفر (RP)")
          .setDescription("اضغط الزر بالأسفل لبدء التقديم في الخاص (DM).")
          .setFooter({ text: Night City RP • ${PANEL_MARKER_RP} });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("start_rp_apply")
            .setLabel("🚀 بدء تقديم RP")
            .setStyle(ButtonStyle.Primary)
        );

        await ch.send({ embeds: [embed], components: [row] }).catch(() => {});
      }
    }
  }

  // Services Panel (tickets + creator + admin apply)
  if (SERVICES_PANEL_CHANNEL_ID) {
    const ch = await guild.channels.fetch(SERVICES_PANEL_CHANNEL_ID).catch(() => null);
    if (ch && ch.isTextBased()) {
      const exists = await findMarkerMessage(ch, PANEL_MARKER_SERVICES);

      const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle("🛠️ خدمات السيرفر")
        .setDescription("اختر الخدمة المطلوبة من الأزرار بالأسفل.")
        .setFooter({ text: Night City RP • ${PANEL_MARKER_SERVICES} });

      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("ticket_support").setLabel("🧰 دعم فني").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("ticket_appeal").setLabel("🧾 استئناف").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("ticket_report").setLabel("🚨 بلاغ").setStyle(ButtonStyle.Danger)
      );

      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("ticket_suggest").setLabel("💡 اقتراح").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("start_creator_apply").setLabel("🎥 تقديم صانع محتوى").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("start_admin_apply").setLabel("👮 تقديم إدارة").setStyle(ButtonStyle.Primary)
      );

      if (!exists) {
        await ch.send({ embeds: [embed], components: [row1, row2] }).catch(() => {});
      } else {
        // لو موجود قديم: عدّله عشان يضيف زر الإدارة بدون ما يعمل سبام رسائل
        const hasAdminBtn = exists.components?.some(r => r.components?.some(c => c.customId === "start_admin_apply"));
        if (!hasAdminBtn) {
          await exists.edit({ embeds: [embed], components: [row1, row2] }).catch(() => {});
        }
      }
    }
  }
}

// ===================== DM FLOWS =====================
async function startDmFlow(user, guild, type) {
  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return;

  if (inCooldown(user.id)) {
    try { await user.send("⏳ انتظر قليلاً قبل بدء تقديم جديد."); } catch {}
    return;
  }

  if (activeApplications.has(user.id)) {
    try { await user.send("⚠️ لديك تقديم مفتوح بالفعل، أكمل التقديم أولاً."); } catch {}
    return;
  }

  // RP restrictions
  if (type === "rp") {
    if (member.roles.cache.has(RP_REJECT2_ROLE_ID)) {
      try { await user.send("⛔ تم رفض طلبك نهائيًا ولا يمكنك التقديم مرة أخرى."); } catch {}
      return;
    }
    if (member.roles.cache.has(RP_PASS_ROLE_ID)) {
      try { await user.send("✅ أنت مقبول بالفعل في السيرفر. لا تحتاج إعادة تقديم."); } catch {}
      return;
    }
  }

  activeApplications.add(user.id);
  setCooldown(user.id);

  const questions =
    type === "rp" ? RP_QUESTIONS :
    type === "creator" ? CREATOR_QUESTIONS :
    ADMIN_QUESTIONS;

  sessions.set(user.id, {
    type,
    step: 0,
    answers: {},
    guildId: guild.id,
  });

  try {
    await user.send(
      type === "rp"
        ? "✅ **بدأنا تقديم RP.**\nاكتب الإجابة سؤال بسؤال.\n⚠️ الإجابات القصيرة مثل (1) سيتم رفضها."
        : type === "creator"
        ? "✅ **بدأنا تقديم صانع محتوى.**\nاكتب الإجابة سؤال بسؤال.\n⚠️ الإجابات القصيرة مثل (1) سيتم رفضها."
        : "✅ **بدأنا تقديم الإدارة.**\nاكتب الإجابة سؤال بسؤال.\n⚠️ الإجابات القصيرة مثل (1) سيتم رفضها."
    );
    await user.send(questions[0].q);
  } catch {
    activeApplications.delete(user.id);
    sessions.delete(user.id);
  }
}

function endSession(userId) {
  sessions.delete(userId);
  activeApplications.delete(userId);
}

// ===================== SUBMIT TO REVIEW =====================
async function submitRpToReview(guild, userId, answers) {
  const ch = await guild.channels.fetch(RP_REVIEW_CHANNEL_ID).catch(() => null);
  if (!ch || !ch.isTextBased()) return;

  const embed = embedReviewHeader("📩 طلب RP جديد")
    .addFields(
      { name: "👤 الاسم", value: safeTrim(answers.fullName, 256) || "-", inline: true },
      { name: "🎂 العمر", value: safeTrim(answers.age, 256) || "-", inline: true },
      { name: "📚 القوانين", value: safeTrim(answers.rules, 1024) || "-", inline: false },
      { name: "🎮 خبرة RP", value: safeTrim(answers.experience, 1024) || "-", inline: false },
      { name: "📝 القصة (150 كلمة+)", value: safeTrim(answers.story, 1024) || "-", inline: false },
      { name: "🎙️ المايك", value: safeTrim(answers.mic, 256) || "-", inline: true },
      { name: "✅ الالتزام", value: safeTrim(answers.commit, 256) || "-", inline: true }
    )
    .setFooter({ text: user:${userId} });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(approve_rp_${userId}).setLabel("✅ قبول").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(reject_rp_${userId}).setLabel("❌ رفض").setStyle(ButtonStyle.Danger)
  );

  await ch.send({ embeds: [embed], components: [row] }).catch(() => {});
}

async function submitCreatorToReview(guild, userId, answers) {
  const ch = await guild.channels.fetch(CREATOR_REVIEW_CHANNEL_ID).catch(() => null);
  if (!ch || !ch.isTextBased()) return;

  const embed = embedReviewHeader("🎥 طلب صانع محتوى جديد")
    .addFields(
      { name: "🔗 رابط القناة", value: safeTrim(answers.channelLink, 1024) || "-", inline: false },
      { name: "👥 المتابعين", value: safeTrim(answers.followers, 256) || "-", inline: true },
      { name: "🎥 نوع المحتوى", value: safeTrim(answers.contentType, 1024) || "-", inline: false },
      { name: "📅 الجدول", value: safeTrim(answers.schedule, 1024) || "-", inline: false },
      { name: "💡 السبب", value: safeTrim(answers.why, 1024) || "-", inline: false },
      { name: "✅ الالتزام", value: safeTrim(answers.agree, 256) || "-", inline: true }
    )
    .setFooter({ text: user:${userId} });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(approve_creator_${userId}).setLabel("✅ قبول").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(reject_creator_${userId}).setLabel("❌ رفض").setStyle(ButtonStyle.Danger)
  );

  await ch.send({ embeds: [embed], components: [row] }).catch(() => {});
}

async function submitAdminToReview(guild, userId, answers) {
  const ch = await guild.channels.fetch(ADMIN_REVIEW_CHANNEL_ID).catch(() => null);
  if (!ch || !ch.isTextBased()) return;

  const embed = embedReviewHeader("👮 طلب إدارة جديد")
    .addFields(
      { name: "👤 ديسكورد", value: safeTrim(answers.discordName, 256) || "-", inline: true },
      { name: "🎂 العمر", value: safeTrim(answers.age, 256) || "-", inline: true },
      { name: "🕒 التوقيت", value: safeTrim(answers.timezone, 256) || "-", inline: true },
      { name: "⏱️ التواجد", value: safeTrim(answers.activity, 1024) || "-", inline: false },
      { name: "🛡️ الخبرة", value: safeTrim(answers.experience, 1024) || "-", inline: false },
      { name: "📚 القوانين", value: safeTrim(answers.rules, 1024) || "-", inline: false },
      { name: "🤝 حل المشاكل", value: safeTrim(answers.conflict, 1024) || "-", inline: false },
      { name: "🎮 Meta/PG", value: safeTrim(answers.metapg, 1024) || "-", inline: false },
      { name: "🚨 البلاغات (بدون تحيز)", value: safeTrim(answers.reports, 1024) || "-", inline: false },
      { name: "📎 الأدلة", value: safeTrim(answers.evidence, 1024) || "-", inline: false },
      { name: "🧠 تحت الضغط", value: safeTrim(answers.pressure, 1024) || "-", inline: false },
      { name: "✅ تعهد", value: safeTrim(answers.commit, 256) || "-", inline: true }
    )
    .setFooter({ text: user:${userId} });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(approve_admin_${userId}).setLabel("✅ قبول").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(reject_admin_${userId}).setLabel("❌ رفض").setStyle(ButtonStyle.Danger)
  );

  await ch.send({ embeds: [embed], components: [row] }).catch(() => {});
}

// ===================== TICKETS =====================
async function sendTicketIntro(channel, openerUserId, kind) {
  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle🎫 ${ticketLabel(kind)}`)
    .setDescription(
     أهلاً <@${openerUserId}> 👋\n` +
      اكتب مشكلتك/طلبك هنا بالتفصيل، وسيتم الرد عليك من الإدارة.\n\n +
     🔒 للإغلاق: الإدارة تضغط زر **إغلاق التذكرة** وتكتب السبب.`
    )
    .setFooter({ text: "Night City RP • Tickets" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("🔒 إغلاق التذكرة")
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({ embeds: [embed], components: [row] }).catch(() => {});
}

async function createTicket(interaction, kind) {
  const guild = interaction.guild;
  const member = interaction.member;
  if (!guild || !member) return;

  const categoryId = ticketCategory(kind);
  const category = await guild.channels.fetch(categoryId).catch(() => null);
  if (!category || category.type !== ChannelType.GuildCategory) {
    return interaction.reply({ content: "❌ كاتيجوري التذاكر غير صحيح (ID غلط).", ephemeral: true });
  }

  const existing = guild.channels.cache.find(
    (c) =>
      c.parentId === categoryId &&
      c.type === ChannelType.GuildText &&
      c.permissionOverwrites?.cache?.has(interaction.user.id)
  );
  if (existing) {
    return interaction.reply({ content: ⚠️ لديك تذكرة مفتوحة بالفعل: ${existing}, ephemeral: true });
  }

  const base = ${kind}-${interaction.user.username}.toLowerCase().replace(/[^a-z0-9\-]/g, "");
  const name = base.length > 80 ? base.slice(0, 80) : base;

  const channel = await guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent: categoryId,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      {
        id: interaction.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.AttachFiles,
        ],
      },
      ...ADMIN_ROLE_IDS.map((rid) => ({
        id: rid,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.ManageChannels,
        ],
      })),
    ],
  }).catch(() => null);

  if (!channel) return interaction.reply({ content: "❌ فشل إنشاء التذكرة.", ephemeral: true });

  await sendTicketIntro(channel, interaction.user.id, kind);
  return interaction.reply({ content: ✅ تم إنشاء تذكرتك: ${channel}, ephemeral: true });
}

// ===================== MODALS =====================
async function openRejectModal(interaction, type, userId) {
  const modal = new ModalBuilder()
    .setCustomId(modal_reject_${type}_${userId})
    .setTitle("سبب الرفض");

  const input = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("اكتب سبب الرفض")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  await interaction.showModal(modal);
}

async function openCloseTicketModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId("modal_ticket_close")
    .setTitle("إغلاق التذكرة");

  const input = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("سبب الإغلاق")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  await interaction.showModal(modal);
}

// ===================== EVENTS =====================
client.once("ready", async () => {
  console.log(✅ Logged in as ${client.user.tag});
  for (const [, guild] of client.guilds.cache) {
    await ensurePanels(guild).catch(() => {});
  }
});

// Buttons + Modals
client.on("interactionCreate", async (interaction) => {
  try {
    // ================= BUTTONS =================
    if (interaction.isButton()) {
      const { customId } = interaction;

      // Start RP Apply
      if (customId === "start_rp_apply") {
        const guild = interaction.guild;
        if (!guild) return interaction.reply({ content: "❌ هذا الزر يعمل داخل السيرفر فقط.", ephemeral: true });

        try {
          await startDmFlow(interaction.user, guild, "rp");
          return interaction.reply({ content: "✅ تم إرسال أسئلة التقديم في الخاص (DM).", ephemeral: true });
        } catch {
          return interaction.reply({
            content: "❌ لا أستطيع إرسال DM لك. افتح الخاص (Allow DMs) ثم جرّب مرة أخرى.",
            ephemeral: true,
          });
        }
      }

      // Start Creator Apply
      if (customId === "start_creator_apply") {
        const guild = interaction.guild;
        if (!guild) return interaction.reply({ content: "❌ هذا الزر يعمل داخل السيرفر فقط.", ephemeral: true });

        try {
          await startDmFlow(interaction.user, guild, "creator");
          return interaction.reply({ content: "✅ تم إرسال أسئلة تقديم صانع محتوى في الخاص (DM).", ephemeral: true });
        } catch {
          return interaction.reply({
            content: "❌ لا أستطيع إرسال DM لك. افتح الخاص (Allow DMs) ثم جرّب مرة أخرى.",
            ephemeral: true,
          });
        }
      }

      // ✅ NEW: Start Admin Apply
      if (customId === "start_admin_apply") {
        const guild = interaction.guild;
        if (!guild) return interaction.reply({ content: "❌ هذا الزر يعمل داخل السيرفر فقط.", ephemeral: true });

        try {
          await startDmFlow(interaction.user, guild, "admin");
          return interaction.reply({ content: "✅ تم إرسال أسئلة تقديم الإدارة في الخاص (DM).", ephemeral: true });
        } catch {
          return interaction.reply({
            content: "❌ لا أستطيع إرسال DM لك. افتح الخاص (Allow DMs) ثم جرّب مرة أخرى.",
            ephemeral: true,
          });
        }
      }

      // Tickets
      if (customId === "ticket_support") return createTicket(interaction, "support");
      if (customId === "ticket_appeal")  return createTicket(interaction, "appeal");
      if (customId === "ticket_report")  return createTicket(interaction, "report");
      if (customId === "ticket_suggest") return createTicket(interaction, "suggest");

      // Close ticket button (admin only)
      if (customId === "ticket_close") {
        const member = interaction.member;
        if (!member || !isAdmin(member)) {
          return interaction.reply({ content: "❌ زر الإغلاق للإدارة فقط.", ephemeral: true });
        }
        return openCloseTicketModal(interaction);
      }

      // Approve / Reject RP
      if (customId.startsWith("approve_rp_") || customId.startsWith("reject_rp_")) {
        const member = interaction.member;
        if (!member || !isAdmin(member)) {
          return interaction.reply({ content: "❌ ليس لديك صلاحية.", ephemeral: true });
        }

        const userId = customId.replace("approve_rp_", "").replace("reject_rp_", "");
        const target = await interaction.guild.members.fetch(userId).catch(() => null);
        if (!target) return interaction.reply({ content: "❌ العضو غير موجود.", ephemeral: true });

        if (customId.startsWith("approve_rp_")) {
          await target.roles.remove(RP_REJECT1_ROLE_ID).catch(() => {});
          await target.roles.remove(RP_REJECT2_ROLE_ID).catch(() => {});
          await target.roles.add(RP_PASS_ROLE_ID).catch(() => {});

          try {
            const { embed, row } = embedAcceptRP(interaction.guild.id);
            await target.send({ embeds: [embed], components: [row] });
          } catch {}

          const newRows = disableAllComponents(interaction.message);
          await interaction.update({ content: "✅ تم القبول.", components: newRows }).catch(() => {});
          return;
        }

        return openRejectModal(interaction, "rp", userId);
      }

      // Approve / Reject Creator
      if (customId.startsWith("approve_creator_") || customId.startsWith("reject_creator_")) {
        const member = interaction.member;
        if (!member || !isAdmin(member)) {
          return interaction.reply({ content: "❌ ليس لديك صلاحية.", ephemeral: true });
        }

        const userId = customId.replace("approve_creator_", "").replace("reject_creator_", "");
        const target = await interaction.guild.members.fetch(userId).catch(() => null);
        if (!target) return interaction.reply({ content: "❌ العضو غير موجود.", ephemeral: true });

        if (customId.startsWith("approve_creator_")) {
          await target.roles.add(CREATOR_ROLE_ID).catch(() => {});
          try { await target.send({ embeds: [embedAcceptCreator()] }); } catch {}

          const newRows = disableAllComponents(interaction.message);
          await interaction.update({ content: "✅ تم قبول صانع المحتوى.", components: newRows }).catch(() => {});
          return;
        }

        return openRejectModal(interaction, "creator", userId);
      }

      // ✅ NEW: Approve / Reject Admin
      if (customId.startsWith("approve_admin_") || customId.startsWith("reject_admin_")) {
        const member = interaction.member;
        if (!member || !isAdmin(member)) {
          return interaction.reply({ content: "❌ ليس لديك صلاحية.", ephemeral: true });
        }

        const userId = customId.replace("approve_admin_", "").replace("reject_admin_", "");
        const target = await interaction.guild.members.fetch(userId).catch(() => null);
        if (!target) return interaction.reply({ content: "❌ العضو غير موجود.", ephemeral: true });

        if (customId.startsWith("approve_admin_")) {
          await target.roles.add(ADMIN_ACCEPT_ROLE_ID).catch(() => {});
          try { await target.send({ embeds: [embedAcceptAdmin()] }); } catch {}

          const newRows = disableAllComponents(interaction.message);
          await interaction.update({ content: "✅ تم قبول الإدارة.", components: newRows }).catch(() => {});
          return;
        }

        return openRejectModal(interaction, "admin", userId);
      }
    }

    // ================= MODALS =================
    if (interaction.isModalSubmit()) {
      const id = interaction.customId;

      // Reject modal (rp/creator/admin)
      if (id.startsWith("modal_reject_")) {
        const parts = id.split("_");
        const type = parts[2];
        const userId = parts.slice(3).join("_");
        const reason = interaction.fields.getTextInputValue("reason");

        const target = await interaction.guild.members.fetch(userId).catch(() => null);

        if (type === "rp") {
          if (target) {
            if (!target.roles.cache.has(RP_REJECT1_ROLE_ID)) {
              await target.roles.add(RP_REJECT1_ROLE_ID).catch(() => {});
            } else {
              await target.roles.remove(RP_REJECT1_ROLE_ID).catch(() => {});
              await target.roles.add(RP_REJECT2_ROLE_ID).catch(() => {});
            }
            try { await target.send({ embeds: [embedReject(reason, "❌ تم رفض طلبك")] }); } catch {}
          }

          const newRows = disableAllComponents(interaction.message);
          await interaction.update({ content: ❌ تم الرفض بواسطة ${interaction.user}., components: newRows }).catch(() => {});
          return;
        }

        if (type === "creator") {
          if (target) {
            try { await target.send({ embeds: [embedReject(reason, "❌ تم رفض طلب صانع المحتوى")] }); } catch {}
          }
          const newRows = disableAllComponents(interaction.message);
          await interaction.update({ content: ❌ تم رفض صانع المحتوى بواسطة ${interaction.user}., components: newRows }).catch(() => {});
          return;
        }

        if (type === "admin") {
          if (target) {
            try { await target.send({ embeds: [embedReject(reason, "❌ تم رفض طلب الإدارة")] }); } catch {}
          }
          const newRows = disableAllComponents(interaction.message);
          await interaction.update({ content: ❌ تم رفض الإدارة بواسطة ${interaction.user}., components: newRows }).catch(() => {});
          return;
        }
      }

      // Ticket close modal
      if (id === "modal_ticket_close") {
        const member = interaction.member;
        if (!member || !isAdmin(member)) {
          return interaction.reply({ content: "❌ ليس لديك صلاحية.", ephemeral: true });
        }

        const reason = interaction.fields.getTextInputValue("reason");

        const overwrites = interaction.channel.permissionOverwrites.cache;
        const ownerOverwrite = overwrites.find((o) => o.type === 1); // Member overwrite
        const ownerId = ownerOverwrite?.id;

        const transcript = await buildTranscript(interaction.channel, 100);

        if (ownerId) {
          const user = await client.users.fetch(ownerId).catch(() => null);
          if (user) {
            try {
              await user.send({
                embeds: [
                  new EmbedBuilder()
                    .setColor(0xff2d2d)
                    .setTitle("🔒 تم إغلاق التذكرة")
                    .setDescription(**السبب:**\n${safeTrim(reason, 1500)})
                    .setFooter({ text: "Night City RP • Tickets" })
                    .setTimestamp(),
                ],
              });
              await user.send("📄 **Transcript (آخر 100 رسالة):**\n```txt\n" + transcript + "\n```");
            } catch {}
          }
        }

        await interaction.reply({ content: "✅ سيتم إغلاق التذكرة الآن.", ephemeral: true }).catch(() => {});
        setTimeout(() => interaction.channel.delete().catch(() => {}), 1500);
        return;
      }
    }
  } catch (e) {
    console.log("interaction error:", e?.message || e);
    if (interaction.isRepliable() && !interaction.replied) {
      interaction.reply({ content: "❌ حصل خطأ. راجع اللوج.", ephemeral: true }).catch(() => {});
    }
  }
});

// ===================== DM handler (Q/A) =====================
client.on("messageCreate", async (msg) => {
  try {
    if (msg.author.bot) return;
    if (msg.guild) return; // DM only

    const session = sessions.get(msg.author.id);
    if (!session) return;

    const guild = await client.guilds.fetch(session.guildId).catch(() => null);
    if (!guild) {
      endSession(msg.author.id);
      return;
    }

    const questions =
      session.type === "rp" ? RP_QUESTIONS :
      session.type === "creator" ? CREATOR_QUESTIONS :
      ADMIN_QUESTIONS;

    const current = questions[session.step];
    if (!current) {
      endSession(msg.author.id);
      return;
    }

    // Quality filter
    if (tooShortAnswer(msg.content)) {
      await msg.author.send("❌ الإجابة قصيرة/غير مفهومة. اكتب إجابة واضحة من فضلك.");
      return;
    }

    // Story check (RP only)
    if (session.type === "rp" && current.key === "story") {
      if (wordCount(msg.content) < 150) {
        await msg.author.send("❌ القصة لازم تكون *150 كلمة على الأقل*. اكتب قصة أطول من فضلك.");
        return;
      }
    }

    session.answers[current.key] = safeTrim(msg.content, 2000);
    session.step += 1;
    sessions.set(msg.author.id, session);

    if (session.step < questions.length) {
      await msg.author.send(questions[session.step].q);
      return;
    }

    await msg.author.send("✅ تم استلام التقديم وإرساله للإدارة للمراجعة.");

    if (session.type === "rp") {
      await submitRpToReview(guild, msg.author.id, session.answers);
    } else if (session.type === "creator") {
      await submitCreatorToReview(guild, msg.author.id, session.answers);
    } else {
      await submitAdminToReview(guild, msg.author.id, session.answers);
    }

    endSession(msg.author.id);
  } catch (e) {
    console.log("dm flow error:", e?.message || e);
  }
});

// ===================== START =====================
require('dotenv').config();

const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.log("❌ TOKEN not found. Put it in .env or Railway Variables.");
  process.exit(1);
}

client.login(TOKEN);
