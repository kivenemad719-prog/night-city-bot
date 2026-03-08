// index.js — Night City RP Bot (discord.js v14)
// ضع TOKEN في Railway Variables فقط
// لا تضع التوكن داخل الملف

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
  MessageFlags,
} = require("discord.js");

// ===================== CONFIG =====================
const TOKEN = process.env.TOKEN;

// Review channels
const RP_REVIEW_CHANNEL_ID = "1477562619001831445";
const CREATOR_REVIEW_CHANNEL_ID = "1477777545767420116";
const ADMIN_REVIEW_CHANNEL_ID = "1479216695938650263";

// Panels channels
const RP_APPLY_PANEL_CHANNEL_ID = "1465803291714785481"; // بانل تقديم السيرفر
const SERVICES_PANEL_CHANNEL_ID = "1465757986684403828"; // بانل الخدمات

// Voice interview room
const VOICE_ROOM_ID = "1465752669564964935";

// Ticket categories
const SUPPORT_CATEGORY_ID = "1473850568811221194";
const APPEAL_CATEGORY_ID = "1477765907496308897";
const REPORT_CATEGORY_ID = "1473850252149788867";
const SUGGEST_CATEGORY_ID = "1477766632817426675";

// Admin roles (صلاحية الإدارة)
const ADMIN_ROLE_IDS = [
  "1465798793772666941",
  "1465800480474005569",
  "1467593770898948158",
];

// Roles
const CREATOR_ROLE_ID = "1477845260095979552";
const RP_PASS_ROLE_ID = "1477569088988512266";
const RP_REJECT1_ROLE_ID = "1477568923208519681";
const RP_REJECT2_ROLE_ID = "1477569051185119332";
// Welcome system
const WELCOME_CHANNEL_ID = "1465609782680621254"
const RULES_CHANNEL_ID = "1465786939755200687"
const APPLY_CHANNEL_ID = "1465803291714785481"

// رول الإدارة عند القبول
// لو الرول ما اتضافش، راجع الـ ID ده
const ADMIN_ACCEPT_ROLE_ID = "1467593770898948158";

// Panel markers
const PANEL_MARKER_RP = "PANEL_RP_APPLY_v3";
const PANEL_MARKER_SERVICES = "PANEL_SERVICES_v3";

// ===================== MEMORY =====================
const activeApplications = new Set(); // userId
const sessions = new Map(); // userId -> { type, step, answers, guildId }
const applyCooldown = new Map(); // userId -> timestamp
const COOLDOWN_MS = 60 * 1000; // 1 minute

// ===================== QUESTIONS =====================
const RP_QUESTIONS = [
  { key: "fullName", q: "📌 **ما الاسم الكامل للشخصية؟**" },
  { key: "age", q: "🎂 **كم عمر الشخصية؟**" },
  { key: "country", q: "🌍 **من أي دولة / مدينة؟**" },
  { key: "playHours", q: "⏱️ **كم ساعة تقدر تتواجد يوميًا؟**" },
  { key: "experience", q: "🎮 **هل عندك خبرة RP؟ اذكر أين وكم مدة لعبت.**" },
  { key: "rpMeaning", q: "📖 **اشرح ما معنى RP بالنسبة لك.**" },
  { key: "powerGaming", q: "🚫 **ما معنى PowerGaming؟ اشرح مع مثال.**" },
  { key: "metaGaming", q: "🚫 **ما معنى MetaGaming؟ اشرح مع مثال.**" },
  { key: "fearRP", q: "😨 **ما معنى FearRP؟ اشرح مع مثال.**" },
  { key: "rules", q: "📚 **هل قرأت القوانين؟ اكتب نعم + اذكر أهم 5 نقاط فهمتها.**" },
  { key: "reportAction", q: "🚨 **إذا رأيت لاعبًا يكسر القوانين، ماذا ستفعل؟**" },
  { key: "story", q: "📝 **اكتب قصة للشخصية 150 كلمة على الأقل.**" },
  { key: "mic", q: "🎙️ **هل لديك مايك جيد؟ (نعم/لا) + نوعه لو تعرف**" },
  { key: "respectAdmin", q: "👮 **هل تلتزم بقرارات الإدارة وتحترمها؟ (نعم/لا)**" },
  { key: "whyServer", q: "⭐ **لماذا تريد الانضمام إلى هذا السيرفر؟**" },
];

const CREATOR_QUESTIONS = [
  { key: "platform", q: "🎥 **ما المنصة التي تنشر عليها؟ (YouTube / TikTok / Twitch / Kick...)**" },
  { key: "channelLink", q: "🔗 **ارسل رابط القناة / الحساب.**" },
  { key: "followers", q: "👥 **كم عدد المتابعين / المشتركين؟**" },
  { key: "contentType", q: "📹 **ما نوع المحتوى الذي تقدمه؟**" },
  { key: "schedule", q: "📅 **ما جدول النشر / البث عندك؟**" },
  { key: "rpExperience", q: "🎮 **هل عندك خبرة في سيرفرات RP؟ اشرح باختصار.**" },
  { key: "serverPromo", q: "📢 **كيف ستفيد السيرفر كمحتوى؟**" },
  { key: "quality", q: "🎬 **ما جودة المحتوى عندك؟ (1080p/720p...)**" },
  { key: "activity", q: "⏱️ **كم مرة تنشر أو تبث أسبوعيًا؟**" },
  { key: "why", q: "💡 **لماذا تريد أن تكون صانع محتوى عندنا؟**" },
  { key: "agree", q: "✅ **هل تلتزم بقوانين السيرفر وعدم الإساءة؟ (نعم/لا)**" },
];

const ADMIN_QUESTIONS = [
  { key: "discordName", q: "👤 **ما اسمك في الديسكورد مع التاغ؟**" },
  { key: "age", q: "🎂 **كم عمرك؟**" },
  { key: "timezone", q: "🕒 **ما دولتك / توقيتك؟**" },
  { key: "activity", q: "⏱️ **كم ساعة تقدر تتواجد يوميًا؟**" },
  { key: "experience", q: "🛡️ **هل عندك خبرة إدارة؟ اذكر السيرفرات / المدة / الرتبة.**" },
  { key: "rules", q: "📚 **اذكر 5 قوانين مهمة في السيرفر من وجهة نظرك.**" },
  { key: "conflict", q: "🤝 **لو لاعبين بيتخانقوا، كيف تتصرف خطوة بخطوة؟**" },
  { key: "powerGaming", q: "🚫 **اشرح PowerGaming مع مثال.**" },
  { key: "metaGaming", q: "🚫 **اشرح MetaGaming مع مثال.**" },
  { key: "reports", q: "🚨 **لو جاءك بلاغ ضد صديقك أو لاعب معروف، كيف تتصرف بدون تحيز؟**" },
  { key: "evidence", q: "📎 **ما الأدلة التي تعتمد عليها في البلاغات؟**" },
  { key: "pressure", q: "🧠 **كيف تتعامل مع ضغط أو إهانة من لاعب أثناء المشكلة؟**" },
  { key: "commit", q: "✅ **هل تتعهد بالحياد وعدم إساءة استخدام الصلاحيات؟ (نعم/لا)**" },
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
  if (t.length < 3) return true;
  if (/^[\d\W_]+$/.test(t) && t.length < 6) return true;
  return false;
}

function now() {
  return Date.now();
}

function inCooldown(userId) {
  const last = applyCooldown.get(userId) || 0;
  return now() - last < COOLDOWN_MS;
}

function setCooldown(userId) {
  applyCooldown.set(userId, now());
}

function endSession(userId) {
  sessions.delete(userId);
  activeApplications.delete(userId);
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
  const rows = message.components.map((row) => {
    const r = ActionRowBuilder.from(row);
    r.components = r.components.map((c) => ButtonBuilder.from(c).setDisabled(true));
    return r;
  });
  return rows;
}

function replyEphemeral(interaction, content) {
  return interaction.reply({
    content,
    flags: MessageFlags.Ephemeral,
  });
}

function followupEphemeral(interaction, content) {
  return interaction.followUp({
    content,
    flags: MessageFlags.Ephemeral,
  });
}

function ticketLabel(kind) {
  switch (kind) {
    case "support": return "🧰 دعم فني";
    case "appeal": return "🧾 استئناف";
    case "report": return "🚨 بلاغ";
    case "suggest": return "💡 اقتراح";
    default: return "🎫 تذكرة";
  }
}

function ticketCategory(kind) {
  switch (kind) {
    case "support": return SUPPORT_CATEGORY_ID;
    case "appeal": return APPEAL_CATEGORY_ID;
    case "report": return REPORT_CATEGORY_ID;
    case "suggest": return SUGGEST_CATEGORY_ID;
    default: return SUPPORT_CATEGORY_ID;
  }
}

async function buildTranscript(channel, limit = 100) {
  const msgs = await channel.messages.fetch({ limit }).catch(() => null);
  if (!msgs) return "لا يوجد سجل.";
  const arr = [...msgs.values()].reverse();
  const lines = arr.map((m) => {
    const time = new Date(m.createdTimestamp).toLocaleString();
    const author = m.author?.tag || "Unknown";
    const content = m.content || "";
    return `[${time}] ${author}: ${content}`.trim();
  });
  return lines.join("\n").slice(0, 18000) || "لا يوجد سجل.";
}

function reviewFieldsFromQuestions(questions, answers) {
  const out = [];
  for (const q of questions) {
    out.push({
      name: q.q.replace(/\*\*/g, "").slice(0, 256),
      value: safeTrim(answers[q.key], 1024) || "-",
      inline: false,
    });
  }
  return out;
}

// ===================== EMBEDS =====================
function reviewHeader(title, userId) {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(title)
    .setFooter({ text: `user:${userId}` })
    .setTimestamp();
}

function rpAcceptEmbed(guildId) {
  const url = `https://discord.com/channels/${guildId}/${VOICE_ROOM_ID}`;
  return {
    embed: new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle("🎉 تم قبول طلبك في السيرفر!")
      .setDescription(
        "━━━━━━━━━━━━━━━━━━\n" +
        "✅ **تهانينا!**\n\n" +
        "تم قبولك **مبدئيًا** في السيرفر.\n" +
        "اضغط الزر بالأسفل للدخول إلى **المقابلة الصوتية**.\n" +
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

function creatorAcceptEmbed() {
  return new EmbedBuilder()
    .setColor(0x00ff88)
    .setTitle("🎥 تم قبولك كصانع محتوى!")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━\n" +
      "✅ **مبروك!**\n\n" +
      "تم قبولك في **برنامج صناع المحتوى** بالسيرفر.\n" +
      "يرجى الالتزام بالقوانين وتمثيل السيرفر بشكل جيد.\n" +
      "━━━━━━━━━━━━━━━━━━"
    )
    .setFooter({ text: "Night City RP • الإدارة" })
    .setTimestamp();
}

function adminAcceptEmbed() {
  return new EmbedBuilder()
    .setColor(0x00ff88)
    .setTitle("🛡️ تم قبولك في الإدارة!")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━\n" +
      "✅ **مبروك!**\n\n" +
      "تم قبولك في **فريق الإدارة**.\n" +
      "تم منحك الرول، والرجاء الالتزام بالحياد وعدم إساءة استخدام الصلاحيات.\n" +
      "━━━━━━━━━━━━━━━━━━"
    )
    .setFooter({ text: "Night City RP • الإدارة" })
    .setTimestamp();
}

function rpRejectEmbed(reason, finalReject = false) {
  return new EmbedBuilder()
    .setColor(0xff2d2d)
    .setTitle(finalReject ? "⛔ تم رفض طلبك نهائيًا" : "❌ تم رفض طلبك في السيرفر")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━\n" +
      "⭐ **سبب الرفض:**\n" +
      `${safeTrim(reason, 1500)}\n\n` +
      (finalReject
        ? "تم رفضك **نهائيًا** ولا يمكنك التقديم مرة أخرى."
        : "يمكنك إعادة التقديم بعد تحسين مستواك.")
      + "\n━━━━━━━━━━━━━━━━━━"
    )
    .setFooter({ text: "Night City RP • الإدارة" })
    .setTimestamp();
}

function creatorRejectEmbed(reason) {
  return new EmbedBuilder()
    .setColor(0xff2d2d)
    .setTitle("❌ تم رفض طلب صانع المحتوى")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━\n" +
      "🎥 **سبب الرفض:**\n" +
      `${safeTrim(reason, 1500)}\n\n` +
      "يمكنك التقديم مرة أخرى لاحقًا بعد تحسين المحتوى أو النشاط.\n" +
      "━━━━━━━━━━━━━━━━━━"
    )
    .setFooter({ text: "Night City RP • الإدارة" })
    .setTimestamp();
}

function adminRejectEmbed(reason) {
  return new EmbedBuilder()
    .setColor(0xff2d2d)
    .setTitle("❌ تم رفض طلب الإدارة")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━\n" +
      "🛡️ **سبب الرفض:**\n" +
      `${safeTrim(reason, 1500)}\n\n` +
      "يمكنك التقديم لاحقًا بعد تحسين المستوى والخبرة.\n" +
      "━━━━━━━━━━━━━━━━━━"
    )
    .setFooter({ text: "Night City RP • الإدارة" })
    .setTimestamp();
}

// ===================== PANELS =====================
async function buildRpPanelPayload() {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("📝 تقديم السيرفر (RP)")
    .setDescription("اضغط الزر بالأسفل لبدء التقديم في الخاص (DM).")
    .setFooter({ text: `Night City RP • ${PANEL_MARKER_RP}` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("start_rp_apply")
      .setLabel("🚀 بدء تقديم RP")
      .setStyle(ButtonStyle.Primary)
  );

  return { embeds: [embed], components: [row] };
}

async function buildServicesPanelPayload() {
  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle("🛠️ خدمات السيرفر")
    .setDescription("اختر الخدمة المطلوبة من الأزرار بالأسفل.")
    .setFooter({ text: `Night City RP • ${PANEL_MARKER_SERVICES}` });

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

  return { embeds: [embed], components: [row1, row2] };
}

async function ensurePanels(guild) {
  // RP Panel
  {
    const ch = await guild.channels.fetch(RP_APPLY_PANEL_CHANNEL_ID).catch(() => null);
    if (ch && ch.isTextBased()) {
      const exists = await findMarkerMessage(ch, PANEL_MARKER_RP);
      const payload = await buildRpPanelPayload();
      if (!exists) {
        await ch.send(payload).catch(() => {});
      } else {
        await exists.edit(payload).catch(() => {});
      }
    }
  }

  // Services Panel
  {
    const ch = await guild.channels.fetch(SERVICES_PANEL_CHANNEL_ID).catch(() => null);
    if (ch && ch.isTextBased()) {
      const exists = await findMarkerMessage(ch, PANEL_MARKER_SERVICES);
      const payload = await buildServicesPanelPayload();
      if (!exists) {
        await ch.send(payload).catch(() => {});
      } else {
        await exists.edit(payload).catch(() => {});
      }
    }
  }
}

// ===================== APPLICATION FLOW =====================
async function startDmFlow(user, guild, type) {
  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return { ok: false, reason: "member" };

  if (inCooldown(user.id)) {
    return { ok: false, reason: "cooldown" };
  }

  if (activeApplications.has(user.id)) {
    return { ok: false, reason: "active" };
  }

  if (type === "rp") {
    if (member.roles.cache.has(RP_REJECT2_ROLE_ID)) {
      return { ok: false, reason: "final_reject" };
    }
    if (member.roles.cache.has(RP_PASS_ROLE_ID)) {
      return { ok: false, reason: "already_accepted" };
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
    const intro =
      type === "rp"
        ? "✅ **بدأنا تقديم السيرفر (RP).**\nاكتب الإجابة سؤال بسؤال.\n⚠️ الإجابات القصيرة مثل (1) سيتم رفضها."
        : type === "creator"
        ? "✅ **بدأنا تقديم صانع المحتوى.**\nاكتب الإجابة سؤال بسؤال.\n⚠️ الإجابات القصيرة مثل (1) سيتم رفضها."
        : "✅ **بدأنا تقديم الإدارة.**\nاكتب الإجابة سؤال بسؤال.\n⚠️ الإجابات القصيرة مثل (1) سيتم رفضها.";

    await user.send(intro);
    await user.send(questions[0].q);

    return { ok: true };
  } catch {
    endSession(user.id);
    return { ok: false, reason: "dm_closed" };
  }
}

async function submitRpToReview(guild, userId, answers) {
  const ch = await guild.channels.fetch(RP_REVIEW_CHANNEL_ID).catch(() => null);
  if (!ch || !ch.isTextBased()) return;

  const embed = reviewHeader("📩 طلب انضمام جديد للسيرفر", userId)
    .addFields(reviewFieldsFromQuestions(RP_QUESTIONS, answers));

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`approve_rp_${userId}`).setLabel("✅ قبول").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`reject_rp_${userId}`).setLabel("❌ رفض").setStyle(ButtonStyle.Danger)
  );

  await ch.send({ embeds: [embed], components: [row] }).catch(() => {});
}

async function submitCreatorToReview(guild, userId, answers) {
  const ch = await guild.channels.fetch(CREATOR_REVIEW_CHANNEL_ID).catch(() => null);
  if (!ch || !ch.isTextBased()) return;

  const embed = reviewHeader("🎥 طلب صانع محتوى جديد", userId)
    .addFields(reviewFieldsFromQuestions(CREATOR_QUESTIONS, answers));

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`approve_creator_${userId}`).setLabel("✅ قبول").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`reject_creator_${userId}`).setLabel("❌ رفض").setStyle(ButtonStyle.Danger)
  );

  await ch.send({ embeds: [embed], components: [row] }).catch(() => {});
}

async function submitAdminToReview(guild, userId, answers) {
  const ch = await guild.channels.fetch(ADMIN_REVIEW_CHANNEL_ID).catch(() => null);
  if (!ch || !ch.isTextBased()) return;

  const embed = reviewHeader("🛡️ طلب إدارة جديد", userId)
    .addFields(reviewFieldsFromQuestions(ADMIN_QUESTIONS, answers));

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`approve_admin_${userId}`).setLabel("✅ قبول").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`reject_admin_${userId}`).setLabel("❌ رفض").setStyle(ButtonStyle.Danger)
  );

  await ch.send({ embeds: [embed], components: [row] }).catch(() => {});
}

// ===================== TICKETS =====================
async function sendTicketIntro(channel, openerUserId, kind) {
  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle(`🎫 ${ticketLabel(kind)}`)
    .setDescription(
      `أهلاً <@${openerUserId}> 👋\n` +
      `اكتب طلبك أو مشكلتك هنا بالتفصيل.\n` +
      `الإدارة سترد عليك هنا.\n\n` +
      `🔒 للإغلاق: الإدارة تضغط زر **إغلاق التذكرة** وتكتب السبب.`
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
    return replyEphemeral(interaction, "❌ كاتيجوري التذاكر غير صحيح.");
  }

  const existing = guild.channels.cache.find(
    (c) =>
      c.parentId === categoryId &&
      c.type === ChannelType.GuildText &&
      c.permissionOverwrites?.cache?.has(interaction.user.id)
  );

  if (existing) {
    return replyEphemeral(interaction, `⚠️ لديك تذكرة مفتوحة بالفعل: ${existing}`);
  }

  const base = `${kind}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9\-]/g, "");
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

  if (!channel) return replyEphemeral(interaction, "❌ فشل إنشاء التذكرة.");

  await sendTicketIntro(channel, interaction.user.id, kind);
  return replyEphemeral(interaction, `✅ تم إنشاء تذكرتك: ${channel}`);
}

// ===================== MODALS =====================
async function openRejectModal(interaction, type, userId) {
  const title =
    type === "rp" ? "سبب رفض تقديم السيرفر" :
    type === "creator" ? "سبب رفض صانع المحتوى" :
    "سبب رفض الإدارة";

  const modal = new ModalBuilder()
    .setCustomId(`modal_reject_${type}_${userId}`)
    .setTitle(title);

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
    .setLabel("اكتب سبب الإغلاق")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  await interaction.showModal(modal);
}

// ===================== READY =====================
client.once("clientReady", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  for (const [, guild] of client.guilds.cache) {
    await ensurePanels(guild).catch(() => {});
  }
});

// ===================== RESTORE PANELS IF DELETED =====================
client.on("messageDelete", async (message) => {
  try {
    if (!message.guildId) return;
    const footer = message.embeds?.[0]?.footer?.text || "";
    if (!footer.includes(PANEL_MARKER_RP) && !footer.includes(PANEL_MARKER_SERVICES)) return;

    const guild = await client.guilds.fetch(message.guildId).catch(() => null);
    if (!guild) return;

    await ensurePanels(guild).catch(() => {});
  } catch {}
});

// ===================== INTERACTIONS =====================
client.on("interactionCreate", async (interaction) => {
  try {
    // ================= BUTTONS =================
    if (interaction.isButton()) {
      const { customId } = interaction;

      // ===== START RP APPLY =====
      if (customId === "start_rp_apply") {
        const guild = interaction.guild;
        if (!guild) return replyEphemeral(interaction, "❌ هذا الزر يعمل داخل السيرفر فقط.");

        const result = await startDmFlow(interaction.user, guild, "rp");

        if (!result.ok) {
          if (result.reason === "final_reject") {
            return replyEphemeral(interaction, "⛔ تم رفض طلبك نهائيًا ولا يمكنك التقديم مرة أخرى.");
          }
          if (result.reason === "already_accepted") {
            return replyEphemeral(interaction, "✅ أنت بالفعل مقبول في السيرفر.");
          }
          if (result.reason === "active") {
            return replyEphemeral(interaction, "⚠️ لديك تقديم مفتوح بالفعل، أكمله أولًا.");
          }
          if (result.reason === "cooldown") {
            return replyEphemeral(interaction, "⏳ انتظر قليلًا قبل بدء تقديم جديد.");
          }
          if (result.reason === "dm_closed") {
            return replyEphemeral(interaction, "❌ لا أستطيع إرسال DM لك. افتح الخاص ثم جرّب مرة أخرى.");
          }
          return replyEphemeral(interaction, "❌ حدث خطأ أثناء بدء التقديم.");
        }

        return replyEphemeral(interaction, "✅ تم إرسال أسئلة تقديم السيرفر في الخاص (DM).");
      }

      // ===== START CREATOR APPLY =====
      if (customId === "start_creator_apply") {
        const guild = interaction.guild;
        if (!guild) return replyEphemeral(interaction, "❌ هذا الزر يعمل داخل السيرفر فقط.");

        const result = await startDmFlow(interaction.user, guild, "creator");
        if (!result.ok) {
          if (result.reason === "active") return replyEphemeral(interaction, "⚠️ لديك تقديم مفتوح بالفعل.");
          if (result.reason === "cooldown") return replyEphemeral(interaction, "⏳ انتظر قليلًا قبل التقديم من جديد.");
          if (result.reason === "dm_closed") return replyEphemeral(interaction, "❌ افتح الخاص (DM) ثم جرّب مرة أخرى.");
          return replyEphemeral(interaction, "❌ حدث خطأ أثناء بدء التقديم.");
        }

        return replyEphemeral(interaction, "✅ تم إرسال أسئلة تقديم صانع المحتوى في الخاص (DM).");
      }

      // ===== START ADMIN APPLY =====
      if (customId === "start_admin_apply") {
        const guild = interaction.guild;
        if (!guild) return replyEphemeral(interaction, "❌ هذا الزر يعمل داخل السيرفر فقط.");

        const result = await startDmFlow(interaction.user, guild, "admin");
        if (!result.ok) {
          if (result.reason === "active") return replyEphemeral(interaction, "⚠️ لديك تقديم مفتوح بالفعل.");
          if (result.reason === "cooldown") return replyEphemeral(interaction, "⏳ انتظر قليلًا قبل التقديم من جديد.");
          if (result.reason === "dm_closed") return replyEphemeral(interaction, "❌ افتح الخاص (DM) ثم جرّب مرة أخرى.");
          return replyEphemeral(interaction, "❌ حدث خطأ أثناء بدء التقديم.");
        }

        return replyEphemeral(interaction, "✅ تم إرسال أسئلة تقديم الإدارة في الخاص (DM).");
      }

      // ===== TICKETS =====
      if (customId === "ticket_support") return createTicket(interaction, "support");
      if (customId === "ticket_appeal") return createTicket(interaction, "appeal");
      if (customId === "ticket_report") return createTicket(interaction, "report");
      if (customId === "ticket_suggest") return createTicket(interaction, "suggest");

      // ===== CLOSE TICKET =====
      if (customId === "ticket_close") {
        const member = interaction.member;
        if (!member || !isAdmin(member)) {
          return replyEphemeral(interaction, "❌ زر الإغلاق للإدارة فقط.");
        }
        return openCloseTicketModal(interaction);
      }

      // ===== RP APPROVE / REJECT =====
      if (customId.startsWith("approve_rp_") || customId.startsWith("reject_rp_")) {
        const member = interaction.member;
        if (!member || !isAdmin(member)) return replyEphemeral(interaction, "❌ ليس لديك صلاحية.");

        const userId = customId.replace("approve_rp_", "").replace("reject_rp_", "");
        const target = await interaction.guild.members.fetch(userId).catch(() => null);
        if (!target) return replyEphemeral(interaction, "❌ العضو غير موجود.");

        if (customId.startsWith("approve_rp_")) {
          await target.roles.remove(RP_REJECT1_ROLE_ID).catch(() => {});
          await target.roles.remove(RP_REJECT2_ROLE_ID).catch(() => {});
          await target.roles.add(RP_PASS_ROLE_ID).catch(() => {});

          try {
            const { embed, row } = rpAcceptEmbed(interaction.guild.id);
            await target.send({ embeds: [embed], components: [row] });
          } catch {}

          const newRows = disableAllComponents(interaction.message);
          await interaction.update({
            content: `✅ تم قبول تقديم السيرفر بواسطة ${interaction.user}.`,
            components: newRows,
          }).catch(() => {});
          return;
        }

        return openRejectModal(interaction, "rp", userId);
      }

      // ===== CREATOR APPROVE / REJECT =====
      if (customId.startsWith("approve_creator_") || customId.startsWith("reject_creator_")) {
        const member = interaction.member;
        if (!member || !isAdmin(member)) return replyEphemeral(interaction, "❌ ليس لديك صلاحية.");

        const userId = customId.replace("approve_creator_", "").replace("reject_creator_", "");
        const target = await interaction.guild.members.fetch(userId).catch(() => null);
        if (!target) return replyEphemeral(interaction, "❌ العضو غير موجود.");

        if (customId.startsWith("approve_creator_")) {
          await target.roles.add(CREATOR_ROLE_ID).catch(() => {});

          try {
            await target.send({ embeds: [creatorAcceptEmbed()] });
          } catch {}

          const newRows = disableAllComponents(interaction.message);
          await interaction.update({
            content: `✅ تم قبول صانع المحتوى بواسطة ${interaction.user}.`,
            components: newRows,
          }).catch(() => {});
          return;
        }

        return openRejectModal(interaction, "creator", userId);
      }

      // ===== ADMIN APPROVE / REJECT =====
      if (customId.startsWith("approve_admin_") || customId.startsWith("reject_admin_")) {
        const member = interaction.member;
        if (!member || !isAdmin(member)) return replyEphemeral(interaction, "❌ ليس لديك صلاحية.");

        const userId = customId.replace("approve_admin_", "").replace("reject_admin_", "");
        const target = await interaction.guild.members.fetch(userId).catch(() => null);
        if (!target) return replyEphemeral(interaction, "❌ العضو غير موجود.");

        if (customId.startsWith("approve_admin_")) {
          await target.roles.add(ADMIN_ACCEPT_ROLE_ID).catch(() => {});

          try {
            await target.send({ embeds: [adminAcceptEmbed()] });
          } catch {}

          const newRows = disableAllComponents(interaction.message);
          await interaction.update({
            content: `✅ تم قبول الإدارة بواسطة ${interaction.user}.`,
            components: newRows,
          }).catch(() => {});
          return;
        }

        return openRejectModal(interaction, "admin", userId);
      }
    }

    // ================= MODAL SUBMITS =================
    if (interaction.isModalSubmit()) {
      const id = interaction.customId;

      // ===== REJECT MODAL =====
      if (id.startsWith("modal_reject_")) {
        const parts = id.split("_");
        const type = parts[2];
        const userId = parts.slice(3).join("_");
        const reason = interaction.fields.getTextInputValue("reason");

        const target = await interaction.guild.members.fetch(userId).catch(() => null);

        if (type === "rp") {
          let finalReject = false;

          if (target) {
            if (!target.roles.cache.has(RP_REJECT1_ROLE_ID)) {
              await target.roles.add(RP_REJECT1_ROLE_ID).catch(() => {});
            } else {
              await target.roles.remove(RP_REJECT1_ROLE_ID).catch(() => {});
              await target.roles.add(RP_REJECT2_ROLE_ID).catch(() => {});
              finalReject = true;
            }

            try {
              await target.send({ embeds: [rpRejectEmbed(reason, finalReject)] });
            } catch {}
          }

          const newRows = disableAllComponents(interaction.message);
          await interaction.update({
            content: `❌ تم رفض تقديم السيرفر بواسطة ${interaction.user}.`,
            components: newRows,
          }).catch(() => {});
          return;
        }

        if (type === "creator") {
          if (target) {
            try {
              await target.send({ embeds: [creatorRejectEmbed(reason)] });
            } catch {}
          }

          const newRows = disableAllComponents(interaction.message);
          await interaction.update({
            content: `❌ تم رفض صانع المحتوى بواسطة ${interaction.user}.`,
            components: newRows,
          }).catch(() => {});
          return;
        }

        if (type === "admin") {
          if (target) {
            try {
              await target.send({ embeds: [adminRejectEmbed(reason)] });
            } catch {}
          }

          const newRows = disableAllComponents(interaction.message);
          await interaction.update({
            content: `❌ تم رفض طلب الإدارة بواسطة ${interaction.user}.`,
            components: newRows,
          }).catch(() => {});
          return;
        }
      }

      // ===== CLOSE TICKET MODAL =====
      if (id === "modal_ticket_close") {
        const member = interaction.member;
        if (!member || !isAdmin(member)) return replyEphemeral(interaction, "❌ ليس لديك صلاحية.");

        const reason = interaction.fields.getTextInputValue("reason");

        const overwrites = interaction.channel.permissionOverwrites.cache;
        const ownerOverwrite = overwrites.find((o) => o.type === 1); // member overwrite
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
                    .setDescription(`**سبب الإغلاق:**\n${safeTrim(reason, 1500)}`)
                    .setFooter({ text: "Night City RP • Tickets" })
                    .setTimestamp(),
                ],
              });

              await user.send("📄 **Transcript (آخر 100 رسالة):**\n```txt\n" + transcript + "\n```");
            } catch {}
          }
        }

        await interaction.reply({
          content: "✅ سيتم إغلاق التذكرة الآن.",
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});

        setTimeout(() => interaction.channel.delete().catch(() => {}), 1500);
        return;
      }
    }
  } catch (e) {
    console.log("interaction error:", e?.message || e);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      interaction.reply({
        content: "❌ حصل خطأ. راجع اللوج.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => {});
    }
  }
});

// ===================== DM HANDLER =====================
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

    if (tooShortAnswer(msg.content)) {
      await msg.author.send("❌ الإجابة قصيرة أو غير واضحة. اكتب إجابة مفهومة.");
      return;
    }

    if (session.type === "rp" && current.key === "story") {
      if (wordCount(msg.content) < 150) {
        await msg.author.send("❌ قصة الشخصية يجب أن تكون **150 كلمة على الأقل**.");
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

client.on("guildMemberAdd", async (member) => {

 const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
 if (!channel) return;

 const embed = new EmbedBuilder()
  .setColor(0x2b6cff)
  .setTitle(" Welcome To Night City RP")
  .setDescription(مرحباً ${member}

أهلاً بك في **Night City Roleplay**

يرجى قراءة القوانين أولاً ثم التقديم على الوايت ليست.)
  .setThumbnail(member.user.displayAvatarURL())
  .setFooter({ text: "Night City RP" })
  .setTimestamp();

 const row = new ActionRowBuilder().addComponents(

  new ButtonBuilder()
   .setLabel(" قوانين السيرفر")
   .setStyle(ButtonStyle.Link)
   .setURL(https://discord.com/channels/${member.guild.id}/${RULES_CHANNEL_ID})

  new ButtonBuilder()
   .setLabel(" التقديم على الوايت ليست")
   .setStyle(ButtonStyle.Link)
   .setURL(https://discord.com/channels/${member.guild.id}/${RULES_CHANNEL_ID})
 );

 channel.send({
  content: ${member},
  embeds: [embed],
  components: [row]
 });

})
// ===================== START =====================
if (!TOKEN) {
  console.log("❌ Missing TOKEN env var. Put TOKEN in Railway Variables.");
} else {
  client.login(TOKEN).catch((e) => console.log("Login error:", e?.message || e));
}    



