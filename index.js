const fs = require("fs");
const path = require("path");
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

// ======================================================
// CONFIG
// ======================================================
const TOKEN = process.env.TOKEN;

// ================= CHANNEL IDS =================
const WELCOME_CHANNEL_ID = "1465609782680621254"; // روم الترحيب فقط
const RULES_CHANNEL_ID = "1465786939755200687"; // روم القوانين
const FEEDBACK_CHANNEL_ID = "1480098551248715896"; // روم التقييمات
const CONTROL_PANEL_CHANNEL_ID = "1480098674578034698"; // روم لوحة التحكم

// روم بانل تقديم السيرفر فقط
const RP_APPLY_PANEL_CHANNEL_ID = "1465803291714785481";

// روم بانل الخدمات فقط
const SERVICES_PANEL_CHANNEL_ID = "1465757986684403828";

// ================= REVIEW CHANNEL IDS =================
const RP_REVIEW_CHANNEL_ID = "1477562619001831445";
const CREATOR_REVIEW_CHANNEL_ID = "1477777545767420116";
const ADMIN_REVIEW_CHANNEL_ID = "1479216695938650263";

// ================= VOICE INTERVIEW ROOM =================
const VOICE_ROOM_ID = "1465752669564964935";

// ================= TICKET CATEGORIES =================
const SUPPORT_CATEGORY_ID = "1473850568811221194";
const APPEAL_CATEGORY_ID = "1477765907496308897";
const REPORT_CATEGORY_ID = "1473843823607021579";
const SUGGEST_CATEGORY_ID = "1477766632817426675";

// ================= ADMIN ROLES (3) =================
const ADMIN_ROLE_IDS = [
  "1465798793772666941",
  "1465800480474005569",
  "1467593770898948158",
];

// ================= ACCEPT ROLES =================
const CREATOR_ROLE_ID = "1477845260095979552";
const ADMIN_ACCEPT_ROLE_ID = "1467593770898948158";
const RP_PASS_ROLE_ID = "1477569088988512266";
const RP_REJECT1_ROLE_ID = "1477568923208519681";
const RP_REJECT2_ROLE_ID = "1477569051185119332";

// ================= PANEL MARKERS =================
const PANEL_MARKER_RP = "PANEL_RP_APPLY_v6";
const PANEL_MARKER_SERVICES = "PANEL_SERVICES_v6";
const PANEL_MARKER_CONTROL = "PANEL_CONTROL_v3";

// ======================================================
// QUESTIONS
// ======================================================
const RP_QUESTIONS = [
  { key: "fullName", q: "📌 ما الاسم الكامل للشخصية؟" },
  { key: "age", q: "🎂 كم عمرك؟" },
  { key: "country", q: "🌍 من أي دولة / مدينة؟" },
  { key: "playHours", q: "⏱️ كم ساعة تتواجد يوميًا؟" },
  { key: "experience", q: "🎮 هل لديك خبرة RP؟ اشرح باختصار." },
  { key: "rpMeaning", q: "📖 ما معنى RP بالنسبة لك؟" },
  { key: "powerGaming", q: "🚫 ما معنى PowerGaming؟ مع مثال." },
  { key: "metaGaming", q: "🚫 ما معنى MetaGaming؟ مع مثال." },
  { key: "fearRP", q: "😨 ما معنى FearRP؟ مع مثال." },
  { key: "rules", q: "📚 هل قرأت القوانين؟ اكتب نعم + أهم 5 نقاط فهمتها." },
  { key: "reportAction", q: "🚨 إذا رأيت لاعبًا يكسر القوانين، ماذا تفعل؟" },
  { key: "story", q: "📝 اكتب قصة للشخصية 150 كلمة على الأقل." },
  { key: "mic", q: "🎙️ هل لديك مايك جيد؟ (نعم/لا) + نوعه لو تعرف." },
  { key: "respectAdmin", q: "👮 هل تلتزم بقرارات الإدارة وتحترمها؟ (نعم/لا)" },
  { key: "whyServer", q: "⭐ لماذا تريد الانضمام إلى السيرفر؟" },
];

const CREATOR_QUESTIONS = [
  { key: "platform", q: "🎥 ما المنصة التي تنشر عليها؟" },
  { key: "channelLink", q: "🔗 أرسل رابط القناة / الحساب." },
  { key: "followers", q: "👥 كم عدد المتابعين / المشتركين؟" },
  { key: "contentType", q: "📹 ما نوع المحتوى الذي تقدمه؟" },
  { key: "schedule", q: "📅 ما جدول النشر / البث؟" },
  { key: "rpExperience", q: "🎮 هل لديك خبرة RP؟" },
  { key: "serverPromo", q: "📢 كيف ستفيد السيرفر كمحتوى؟" },
  { key: "quality", q: "🎬 ما جودة المحتوى عندك؟" },
  { key: "activity", q: "⏱️ كم مرة تنشر أسبوعيًا؟" },
  { key: "why", q: "💡 لماذا تريد رتبة صانع محتوى؟" },
  { key: "agree", q: "✅ هل تلتزم بقوانين السيرفر؟ (نعم/لا)" },
];

const ADMIN_QUESTIONS = [
  { key: "discordName", q: "👤 ما اسمك في الديسكورد مع التاغ؟" },
  { key: "age", q: "🎂 كم عمرك؟" },
  { key: "timezone", q: "🕒 ما توقيتك / دولتك؟" },
  { key: "activity", q: "⏱️ كم ساعة تتواجد يوميًا؟" },
  { key: "experience", q: "🛡️ هل لديك خبرة إدارة؟ اشرح." },
  { key: "rules", q: "📚 اذكر 5 قوانين مهمة من وجهة نظرك." },
  { key: "conflict", q: "🤝 لو لاعبين بيتخانقوا كيف تتصرف؟" },
  { key: "powerGaming", q: "🚫 اشرح PowerGaming مع مثال." },
  { key: "metaGaming", q: "🚫 اشرح MetaGaming مع مثال." },
  { key: "reports", q: "🚨 لو جاءك بلاغ ضد صديقك، كيف تتصرف؟" },
  { key: "evidence", q: "📎 ما الأدلة التي تعتمد عليها؟" },
  { key: "pressure", q: "🧠 كيف تتعامل مع الضغط أو الإساءة أثناء المشكلة؟" },
  { key: "commit", q: "✅ هل تتعهد بالحياد وعدم إساءة استخدام الصلاحيات؟ (نعم/لا)" },
];

// ======================================================
// CLIENT
// ======================================================
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

// ======================================================
// STATE
// ======================================================
const SETTINGS_FILE = path.join(__dirname, "bot_settings.json");

const defaultSettings = {
  rpApply: true,
  support: true,
  appeal: true,
  report: true,
  suggest: true,
  creatorApply: true,
  adminApply: true,
  feedback: true,
};

function loadSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
      return { ...defaultSettings };
    }
    const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return { ...defaultSettings };
  }
}

function saveSettings() {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch {}
}

let settings = loadSettings();

const sessions = new Map();
const activeApplications = new Set();

// ======================================================
// HELPERS
// ======================================================
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
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function tooShortAnswer(text) {
  const t = String(text || "").trim();
  if (t.length < 2) return true;
  if (/^[0-9]+$/.test(t)) return true;
  return false;
}

function endSession(userId) {
  sessions.delete(userId);
  activeApplications.delete(userId);
}

function replyEphemeral(interaction, content) {
  return interaction.reply({
    content,
    flags: MessageFlags.Ephemeral,
  });
}

async function followEphemeral(interaction, content) {
  return interaction.followUp({
    content,
    flags: MessageFlags.Ephemeral,
  });
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

function reviewFieldsFromQuestions(questions, answers) {
  return questions.map((q) => ({
    name: q.q.slice(0, 256),
    value: safeTrim(answers[q.key], 1024) || "-",
    inline: false,
  }));
}

function disableMessageComponents(message) {
  const rows = message.components.map((row) => {
    const newRow = ActionRowBuilder.from(row);
    newRow.components = newRow.components.map((c) => ButtonBuilder.from(c).setDisabled(true));
    return newRow;
  });
  return rows;
}

function featureButton(customId, label, enabled) {
  return new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(`${enabled ? "🟢" : "🔴"} ${label}`)
    .setStyle(enabled ? ButtonStyle.Success : ButtonStyle.Danger);
}

function ticketLabel(kind) {
  switch (kind) {
    case "support":
      return "🧰 دعم فني";
    case "appeal":
      return "📄 استئناف";
    case "report":
      return "🚨 شكوى عن لاعب";
    case "suggest":
      return "💡 اقتراح";
    default:
      return "🎫 تذكرة";
  }
}

function ticketCategory(kind) {
  switch (kind) {
    case "support":
      return SUPPORT_CATEGORY_ID;
    case "appeal":
      return APPEAL_CATEGORY_ID;
    case "report":
      return REPORT_CATEGORY_ID;
    case "suggest":
      return SUGGEST_CATEGORY_ID;
    default:
      return SUPPORT_CATEGORY_ID;
  }
}

// ======================================================
// PRETTY EMBEDS
// ======================================================
function buildWelcomeEmbed(member) {
  return new EmbedBuilder()
    .setColor(0x2b6cff)
    .setTitle("👋 Welcome To Night City RP")
    .setDescription(
      `مرحباً <@${member.id}>\n\n` +
      `أهلاً بك في **Night City Roleplay**\n\n` +
      `يرجى قراءة القوانين ثم التقديم على الوايت ليست.\n` +
      `ويمكنك أيضًا تقييم السيرفر من الزر بالأسفل.`
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setFooter({ text: "Night City RP" })
    .setTimestamp();
}

function rpAcceptEmbed(guildId) {
  const url = `https://discord.com/channels/${guildId}/${VOICE_ROOM_ID}`;
  return {
    embed: new EmbedBuilder()
      .setColor("#00ff88")
      .setTitle("🏙️ تم قبولك في السيرفر!")
      .setDescription(
        "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
        "🎉 **مبروك!**\n\n" +
        "تم قبول طلبك في **Night City RP**.\n\n" +
        "الخطوة التالية هي إجراء **المقابلة الصوتية**.\n\n" +
        "اضغط الزر بالأسفل للدخول إلى غرفة المقابلة.\n\n" +
        "يرجى الالتزام بالقوانين واحترام الإدارة.\n\n" +
        "━━━━━━━━━━━━━━━━━━━━━━"
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
    .setColor("#00ff88")
    .setTitle("🎥 تم قبولك كصانع محتوى!")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      "🎉 **مبروك!**\n\n" +
      "تم قبولك في **برنامج صناع المحتوى** في سيرفر\n" +
      "**Night City RP**.\n\n" +
      "يمكنك الآن نشر محتوى السيرفر\n" +
      "والمساهمة في نمو المجتمع.\n\n" +
      "نتمنى لك التوفيق.\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setFooter({ text: "Night City RP • الإدارة" })
    .setTimestamp();
}

function adminAcceptEmbed() {
  return new EmbedBuilder()
    .setColor("#00ff88")
    .setTitle("🛡️ تم قبولك في الإدارة!")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      "🎉 **مبروك!**\n\n" +
      "تم قبولك في **فريق إدارة Night City RP**.\n\n" +
      "تم منحك الرتبة بنجاح.\n\n" +
      "نرجو منك الالتزام بالقوانين\n" +
      "والتعامل باحترام مع جميع اللاعبين.\n\n" +
      "يمنع إساءة استخدام الصلاحيات.\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setFooter({ text: "Night City RP • الإدارة" })
    .setTimestamp();
}

function rpRejectEmbed(reason, finalReject = false) {
  return new EmbedBuilder()
    .setColor(0xff2d2d)
    .setTitle(finalReject ? "⛔ تم رفض طلبك نهائيًا" : "❌ تم رفض طلبك في السيرفر")
    .setDescription(
      `⭐ **سبب الرفض:**\n${safeTrim(reason, 1500)}\n\n` +
      (finalReject
        ? "تم رفضك **نهائيًا** ولا يمكنك التقديم مرة أخرى."
        : "يمكنك إعادة التقديم لاحقًا بعد تحسين مستواك.")
    )
    .setFooter({ text: "Night City RP • الإدارة" })
    .setTimestamp();
}

function creatorRejectEmbed(reason) {
  return new EmbedBuilder()
    .setColor(0xff2d2d)
    .setTitle("❌ تم رفض طلب صانع المحتوى")
    .setDescription(`🎥 **سبب الرفض:**\n${safeTrim(reason, 1500)}`)
    .setFooter({ text: "Night City RP • الإدارة" })
    .setTimestamp();
}

function adminRejectEmbed(reason) {
  return new EmbedBuilder()
    .setColor(0xff2d2d)
    .setTitle("❌ تم رفض طلب الإدارة")
    .setDescription(`🛡️ **سبب الرفض:**\n${safeTrim(reason, 1500)}`)
    .setFooter({ text: "Night City RP • الإدارة" })
    .setTimestamp();
}

// ======================================================
// PANELS BUILDERS
// ======================================================
async function buildRpPanelPayload() {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("📝 التقديم على السيرفر")
    .setDescription("اضغط الزر بالأسفل لبدء التقديم على الوايت ليست في الخاص (DM).")
    .setFooter({ text: `Night City RP • ${PANEL_MARKER_RP}` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("start_rp_apply")
      .setLabel(settings.rpApply ? "🚀 بدء تقديم السيرفر" : "🚫 تقديم السيرفر مغلق")
      .setStyle(settings.rpApply ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(!settings.rpApply)
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
    new ButtonBuilder()
      .setCustomId("ticket_support")
      .setLabel(settings.support ? "🧰 دعم فني" : "🚫 دعم فني")
      .setStyle(settings.support ? ButtonStyle.Secondary : ButtonStyle.Secondary)
      .setDisabled(!settings.support),

    new ButtonBuilder()
      .setCustomId("ticket_appeal")
      .setLabel(settings.appeal ? "📄 استئناف" : "🚫 استئناف")
      .setStyle(settings.appeal ? ButtonStyle.Secondary : ButtonStyle.Secondary)
      .setDisabled(!settings.appeal),

    new ButtonBuilder()
      .setCustomId("ticket_report")
      .setLabel(settings.report ? "🚨 شكوى عن لاعب" : "🚫 شكوى")
      .setStyle(settings.report ? ButtonStyle.Danger : ButtonStyle.Secondary)
      .setDisabled(!settings.report)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_suggest")
      .setLabel(settings.suggest ? "💡 اقتراح" : "🚫 اقتراح")
      .setStyle(settings.suggest ? ButtonStyle.Secondary : ButtonStyle.Secondary)
      .setDisabled(!settings.suggest),

    new ButtonBuilder()
      .setCustomId("start_admin_apply")
      .setLabel(settings.adminApply ? "👮 تقديم على الإدارة" : "🚫 تقديم الإدارة مغلق")
      .setStyle(settings.adminApply ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(!settings.adminApply),

    new ButtonBuilder()
      .setCustomId("start_creator_apply")
      .setLabel(settings.creatorApply ? "🎥 تقديم صانع محتوى" : "🚫 تقديم صانع محتوى مغلق")
      .setStyle(settings.creatorApply ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setDisabled(!settings.creatorApply)
  );

  return { embeds: [embed], components: [row1, row2] };
}

async function buildControlPanelPayload() {
  const embed = new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle("🎛️ لوحة تحكم الأزرار")
    .setDescription("من هنا تقدر تفتح وتقفل أي زر في البانلات.")
    .setFooter({ text: `Night City RP • ${PANEL_MARKER_CONTROL}` })
    .setTimestamp();

  const row1 = new ActionRowBuilder().addComponents(
    featureButton("toggle_rpApply", "تقديم السيرفر", settings.rpApply),
    featureButton("toggle_support", "الدعم الفني", settings.support),
    featureButton("toggle_appeal", "الاستئناف", settings.appeal)
  );

  const row2 = new ActionRowBuilder().addComponents(
    featureButton("toggle_report", "شكوى عن لاعب", settings.report),
    featureButton("toggle_suggest", "الاقتراحات", settings.suggest),
    featureButton("toggle_feedback", "التقييم", settings.feedback)
  );

  const row3 = new ActionRowBuilder().addComponents(
    featureButton("toggle_adminApply", "تقديم الإدارة", settings.adminApply),
    featureButton("toggle_creatorApply", "تقديم صانع محتوى", settings.creatorApply)
  );

  return { embeds: [embed], components: [row1, row2, row3] };
}

async function ensurePanels(guild) {
  const rpChannel = await guild.channels.fetch(RP_APPLY_PANEL_CHANNEL_ID).catch(() => null);
  if (rpChannel?.isTextBased()) {
    const old = await findMarkerMessage(rpChannel, PANEL_MARKER_RP);
    const payload = await buildRpPanelPayload();
    if (!old) await rpChannel.send(payload).catch(() => {});
    else await old.edit(payload).catch(() => {});
  }

  const servicesChannel = await guild.channels.fetch(SERVICES_PANEL_CHANNEL_ID).catch(() => null);
  if (servicesChannel?.isTextBased()) {
    const old = await findMarkerMessage(servicesChannel, PANEL_MARKER_SERVICES);
    const payload = await buildServicesPanelPayload();
    if (!old) await servicesChannel.send(payload).catch(() => {});
    else await old.edit(payload).catch(() => {});
  }

  const controlChannel = await guild.channels.fetch(CONTROL_PANEL_CHANNEL_ID).catch(() => null);
  if (controlChannel?.isTextBased()) {
    const old = await findMarkerMessage(controlChannel, PANEL_MARKER_CONTROL);
    const payload = await buildControlPanelPayload();
    if (!old) await controlChannel.send(payload).catch(() => {});
    else await old.edit(payload).catch(() => {});
  }
}

// ======================================================
// WELCOME
// ======================================================
client.on("guildMemberAdd", async (member) => {
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!channel) return;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("📜 قوانين السيرفر")
      .setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/channels/${member.guild.id}/${RULES_CHANNEL_ID}`),

    new ButtonBuilder()
      .setLabel("📝 نموذج التقديم على الوايت ليست")
      .setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/channels/${member.guild.id}/${RP_APPLY_PANEL_CHANNEL_ID}`),

    new ButtonBuilder()
      .setCustomId("open_feedback")
      .setLabel("⭐ تقييم السيرفر")
      .setStyle(settings.feedback ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(!settings.feedback)
  );

  await channel.send({
    content: `<@${member.id}>`,
    embeds: [buildWelcomeEmbed(member)],
    components: [row],
  }).catch(() => {});
});

// ======================================================
// READY / RESTORE
// ======================================================
client.once("clientReady", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  for (const [, guild] of client.guilds.cache) {
    await ensurePanels(guild).catch(() => {});
  }
});

client.on("messageDelete", async (message) => {
  try {
    const footer = message.embeds?.[0]?.footer?.text || "";
    if (!footer.includes(PANEL_MARKER_RP) && !footer.includes(PANEL_MARKER_SERVICES) && !footer.includes(PANEL_MARKER_CONTROL)) return;
    if (!message.guildId) return;
    const guild = await client.guilds.fetch(message.guildId).catch(() => null);
    if (!guild) return;
    await ensurePanels(guild).catch(() => {});
  } catch {}
});

// ======================================================
// APPLICATION FLOW
// ======================================================
async function startDmFlow(user, guild, type) {
  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return { ok: false, reason: "member" };

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

  const questions =
    type === "rp"
      ? RP_QUESTIONS
      : type === "creator"
      ? CREATOR_QUESTIONS
      : ADMIN_QUESTIONS;

  sessions.set(user.id, {
    type,
    step: 0,
    answers: {},
    guildId: guild.id,
  });

  try {
    const intro =
      type === "rp"
        ? "✅ بدأنا تقديم السيرفر في الخاص.\nأجب على الأسئلة بدقة.\n⚠️ قصة الشخصية يجب أن تكون 150 كلمة على الأقل."
        : type === "creator"
        ? "✅ بدأنا تقديم صانع المحتوى في الخاص.\nأجب على الأسئلة بدقة."
        : "✅ بدأنا تقديم الإدارة في الخاص.\nأجب على الأسئلة بدقة.";

    await user.send(intro);
    await user.send(questions[0].q);

    return { ok: true };
  } catch {
    endSession(user.id);
    return { ok: false, reason: "dm_closed" };
  }
}

// ======================================================
// REVIEW SEND
// ======================================================
async function submitRpToReview(guild, userId, answers) {
  const ch = await guild.channels.fetch(RP_REVIEW_CHANNEL_ID).catch(() => null);
  if (!ch?.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("📩 طلب انضمام جديد للسيرفر")
    .addFields(reviewFieldsFromQuestions(RP_QUESTIONS, answers))
    .setFooter({ text: `user:${userId}` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`approve_rp_${userId}`).setLabel("✅ قبول").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`reject_rp_${userId}`).setLabel("❌ رفض").setStyle(ButtonStyle.Danger)
  );

  await ch.send({ embeds: [embed], components: [row] }).catch(() => {});
}

async function submitCreatorToReview(guild, userId, answers) {
  const ch = await guild.channels.fetch(CREATOR_REVIEW_CHANNEL_ID).catch(() => null);
  if (!ch?.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setColor(0x00c853)
    .setTitle("🎥 طلب صانع محتوى جديد")
    .addFields(reviewFieldsFromQuestions(CREATOR_QUESTIONS, answers))
    .setFooter({ text: `user:${userId}` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`approve_creator_${userId}`).setLabel("✅ قبول").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`reject_creator_${userId}`).setLabel("❌ رفض").setStyle(ButtonStyle.Danger)
  );

  await ch.send({ embeds: [embed], components: [row] }).catch(() => {});
}

async function submitAdminToReview(guild, userId, answers) {
  const ch = await guild.channels.fetch(ADMIN_REVIEW_CHANNEL_ID).catch(() => null);
  if (!ch?.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setColor(0xff9800)
    .setTitle("🛡️ طلب إدارة جديد")
    .addFields(reviewFieldsFromQuestions(ADMIN_QUESTIONS, answers))
    .setFooter({ text: `user:${userId}` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`approve_admin_${userId}`).setLabel("✅ قبول").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`reject_admin_${userId}`).setLabel("❌ رفض").setStyle(ButtonStyle.Danger)
  );

  await ch.send({ embeds: [embed], components: [row] }).catch(() => {});
}

// ======================================================
// TICKETS
// ======================================================
async function createTicket(interaction, kind) {
  const guild = interaction.guild;
  const member = interaction.member;
  if (!guild || !member) return;

  const categoryId = ticketCategory(kind);
  const category = await guild.channels.fetch(categoryId).catch(() => null);
  if (!category || category.type !== ChannelType.GuildCategory) {
    return replyEphemeral(interaction, "❌ كاتيجوري التذاكر غير صحيحة أو غير موجودة.");
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

  const channel = await guild.channels.create({
    name: `${kind}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9\-]/g, "").slice(0, 80),
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

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle(`🎫 ${ticketLabel(kind)}`)
    .setDescription(
      `أهلاً <@${interaction.user.id}> 👋\n` +
      `اكتب طلبك هنا بالتفصيل، وسيتم الرد عليك من الإدارة.\n\n` +
      `🔒 زر إغلاق التذكرة مخصص لفريق الإدارة فقط.`
    )
    .setFooter({ text: "Night City RP • Tickets" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("🔒 إغلاق التذكرة")
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({
    content: `<@${interaction.user.id}>`,
    embeds: [embed],
    components: [row],
  }).catch(() => {});

  return replyEphemeral(interaction, `✅ تم إنشاء التذكرة بنجاح: ${channel}`);
}

// ======================================================
// MODALS
// ======================================================
async function openRejectModal(interaction, type, userId) {
  const title =
    type === "rp"
      ? "سبب رفض تقديم السيرفر"
      : type === "creator"
      ? "سبب رفض صانع المحتوى"
      : "سبب رفض الإدارة";

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

async function openFeedbackReasonModal(interaction, stars) {
  const modal = new ModalBuilder()
    .setCustomId(`modal_feedback_${stars}`)
    .setTitle(`سبب التقييم (${stars} نجوم)`);

  const input = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("اكتب سبب التقييم")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  await interaction.showModal(modal);
}

// ======================================================
// INTERACTIONS
// ======================================================
client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isButton()) {
      const { customId } = interaction;

      // ===== CONTROL =====
      if (customId.startsWith("toggle_")) {
        const member = interaction.member;
        if (!member || !isAdmin(member)) {
          return replyEphemeral(interaction, "❌ هذا الإجراء مخصص لفريق الإدارة فقط.");
        }

        const map = {
          toggle_rpApply: "rpApply",
          toggle_support: "support",
          toggle_appeal: "appeal",
          toggle_report: "report",
          toggle_suggest: "suggest",
          toggle_feedback: "feedback",
          toggle_adminApply: "adminApply",
          toggle_creatorApply: "creatorApply",
        };

        const key = map[customId];
        if (!key) return;

        settings[key] = !settings[key];
        saveSettings();

        const payload = await buildControlPanelPayload();
        await interaction.update(payload).catch(() => {});

        for (const [, guild] of client.guilds.cache) {
          await ensurePanels(guild).catch(() => {});
        }
        return;
      }

      // ===== FEEDBACK =====
      if (customId === "open_feedback") {
        if (!settings.feedback) {
          return replyEphemeral(interaction, "⚠️ التقييم مغلق حاليًا.");
        }

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("feedback_5").setLabel("⭐⭐⭐⭐⭐").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("feedback_4").setLabel("⭐⭐⭐⭐").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("feedback_3").setLabel("⭐⭐⭐").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("feedback_2").setLabel("⭐⭐").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("feedback_1").setLabel("⭐").setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({
          content: "اختر تقييمك للسيرفر:",
          components: [row],
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
        return;
      }

      if (customId.startsWith("feedback_")) {
        const stars = customId.split("_")[1];
        return openFeedbackReasonModal(interaction, stars);
      }

      // ===== RP APPLY =====
      if (customId === "start_rp_apply") {
        if (!settings.rpApply) {
          return replyEphemeral(interaction, "⚠️ التقديم على السيرفر مغلق حاليًا.");
        }

        const result = await startDmFlow(interaction.user, interaction.guild, "rp");
        if (!result.ok) {
          if (result.reason === "active") {
            return replyEphemeral(interaction, "⚠️ لديك تقديم مفتوح بالفعل، أكمله أولًا.");
          }
          if (result.reason === "final_reject") {
            return replyEphemeral(interaction, "⛔ تم رفض طلبك نهائيًا ولا يمكنك التقديم مرة أخرى.");
          }
          if (result.reason === "already_accepted") {
            return replyEphemeral(interaction, "✅ أنت مقبول بالفعل في السيرفر.");
          }
          if (result.reason === "dm_closed") {
            return replyEphemeral(interaction, "❌ لا يمكن إرسال النموذج لك. افتح الخاص (DM) ثم أعد المحاولة.");
          }
          return replyEphemeral(interaction, "❌ تعذر بدء التقديم.");
        }

        return replyEphemeral(interaction, "✅ تم إرسال نموذج التقديم إلى الخاص (DM).");
      }

      // ===== CREATOR APPLY =====
      if (customId === "start_creator_apply") {
        if (!settings.creatorApply) {
          return replyEphemeral(interaction, "⚠️ تقديم صانع المحتوى مغلق حاليًا.");
        }

        const result = await startDmFlow(interaction.user, interaction.guild, "creator");
        if (!result.ok) {
          if (result.reason === "active") {
            return replyEphemeral(interaction, "⚠️ لديك تقديم مفتوح بالفعل، أكمله أولًا.");
          }
          if (result.reason === "dm_closed") {
            return replyEphemeral(interaction, "❌ لا يمكن إرسال النموذج لك. افتح الخاص (DM) ثم أعد المحاولة.");
          }
          return replyEphemeral(interaction, "❌ تعذر بدء التقديم.");
        }

        return replyEphemeral(interaction, "✅ تم إرسال نموذج صانع المحتوى إلى الخاص (DM).");
      }

      // ===== ADMIN APPLY =====
      if (customId === "start_admin_apply") {
        if (!settings.adminApply) {
          return replyEphemeral(interaction, "⚠️ تقديم الإدارة مغلق حاليًا.");
        }

        const result = await startDmFlow(interaction.user, interaction.guild, "admin");
        if (!result.ok) {
          if (result.reason === "active") {
            return replyEphemeral(interaction, "⚠️ لديك تقديم مفتوح بالفعل، أكمله أولًا.");
          }
          if (result.reason === "dm_closed") {
            return replyEphemeral(interaction, "❌ لا يمكن إرسال النموذج لك. افتح الخاص (DM) ثم أعد المحاولة.");
          }
          return replyEphemeral(interaction, "❌ تعذر بدء التقديم.");
        }

        return replyEphemeral(interaction, "✅ تم إرسال نموذج الإدارة إلى الخاص (DM).");
      }

      // ===== TICKETS =====
      if (customId === "ticket_support") {
        if (!settings.support) return replyEphemeral(interaction, "⚠️ الدعم الفني مغلق حاليًا.");
        return createTicket(interaction, "support");
      }

      if (customId === "ticket_appeal") {
        if (!settings.appeal) return replyEphemeral(interaction, "⚠️ الاستئناف مغلق حاليًا.");
        return createTicket(interaction, "appeal");
      }

      if (customId === "ticket_report") {
        if (!settings.report) return replyEphemeral(interaction, "⚠️ الشكاوى عن اللاعبين مغلقة حاليًا.");
        return createTicket(interaction, "report");
      }

      if (customId === "ticket_suggest") {
        if (!settings.suggest) return replyEphemeral(interaction, "⚠️ الاقتراحات مغلقة حاليًا.");
        return createTicket(interaction, "suggest");
      }

      // ===== TICKET CLOSE =====
      if (customId === "ticket_close") {
        const member = interaction.member;
        if (!member || !isAdmin(member)) {
          return replyEphemeral(interaction, "❌ هذا الإجراء مخصص لفريق الإدارة فقط.");
        }

        await interaction.reply({
          content: "✅ سيتم إغلاق التذكرة خلال لحظات.",
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});

        setTimeout(() => interaction.channel?.delete().catch(() => {}), 1500);
        return;
      }

      // ===== APPROVE/REJECT RP =====
      if (customId.startsWith("approve_rp_") || customId.startsWith("reject_rp_")) {
        const member = interaction.member;
        if (!member || !isAdmin(member)) {
          return replyEphemeral(interaction, "❌ هذا الإجراء مخصص لفريق الإدارة فقط.");
        }

        const userId = customId.replace("approve_rp_", "").replace("reject_rp_", "");
        const target = await interaction.guild.members.fetch(userId).catch(() => null);
        if (!target) return replyEphemeral(interaction, "❌ تعذر العثور على العضو.");

        if (customId.startsWith("approve_rp_")) {
          await target.roles.remove(RP_REJECT1_ROLE_ID).catch(() => {});
          await target.roles.remove(RP_REJECT2_ROLE_ID).catch(() => {});
          await target.roles.add(RP_PASS_ROLE_ID).catch(() => {});

          try {
            const { embed, row } = rpAcceptEmbed(interaction.guild.id);
            await target.send({ embeds: [embed], components: [row] });
          } catch {}

          const rows = disableMessageComponents(interaction.message);
          await interaction.update({
            content: `✅ تم قبول تقديم السيرفر بواسطة ${interaction.user}.`,
            components: rows,
          }).catch(() => {});
          return;
        }

        return openRejectModal(interaction, "rp", userId);
      }

      // ===== APPROVE/REJECT CREATOR =====
      if (customId.startsWith("approve_creator_") || customId.startsWith("reject_creator_")) {
        const member = interaction.member;
        if (!member || !isAdmin(member)) {
          return replyEphemeral(interaction, "❌ هذا الإجراء مخصص لفريق الإدارة فقط.");
        }

        const userId = customId.replace("approve_creator_", "").replace("reject_creator_", "");
        const target = await interaction.guild.members.fetch(userId).catch(() => null);
        if (!target) return replyEphemeral(interaction, "❌ تعذر العثور على العضو.");

        if (customId.startsWith("approve_creator_")) {
          await target.roles.add(CREATOR_ROLE_ID).catch(() => {});
          try {
            await target.send({ embeds: [creatorAcceptEmbed()] });
          } catch {}

          const rows = disableMessageComponents(interaction.message);
          await interaction.update({
            content: `✅ تم قبول طلب صانع المحتوى بواسطة ${interaction.user}.`,
            components: rows,
          }).catch(() => {});
          return;
        }

        return openRejectModal(interaction, "creator", userId);
      }

      // ===== APPROVE/REJECT ADMIN =====
      if (customId.startsWith("approve_admin_") || customId.startsWith("reject_admin_")) {
        const member = interaction.member;
        if (!member || !isAdmin(member)) {
          return replyEphemeral(interaction, "❌ هذا الإجراء مخصص لفريق الإدارة فقط.");
        }

        const userId = customId.replace("approve_admin_", "").replace("reject_admin_", "");
        const target = await interaction.guild.members.fetch(userId).catch(() => null);
        if (!target) return replyEphemeral(interaction, "❌ تعذر العثور على العضو.");

        if (customId.startsWith("approve_admin_")) {
          await target.roles.add(ADMIN_ACCEPT_ROLE_ID).catch(() => {});
          try {
            await target.send({ embeds: [adminAcceptEmbed()] });
          } catch {}

          const rows = disableMessageComponents(interaction.message);
          await interaction.update({
            content: `✅ تم قبول طلب الإدارة بواسطة ${interaction.user}.`,
            components: rows,
          }).catch(() => {});
          return;
        }

        return openRejectModal(interaction, "admin", userId);
      }
    }

    // ===== MODAL SUBMIT =====
    if (interaction.isModalSubmit()) {
      const id = interaction.customId;

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

          const rows = disableMessageComponents(interaction.message);
          await interaction.update({
            content: `❌ تم رفض تقديم السيرفر بواسطة ${interaction.user}.`,
            components: rows,
          }).catch(() => {});
          return;
        }

        if (type === "creator") {
          if (target) {
            try {
              await target.send({ embeds: [creatorRejectEmbed(reason)] });
            } catch {}
          }

          const rows = disableMessageComponents(interaction.message);
          await interaction.update({
            content: `❌ تم رفض طلب صانع المحتوى بواسطة ${interaction.user}.`,
            components: rows,
          }).catch(() => {});
          return;
        }

        if (type === "admin") {
          if (target) {
            try {
              await target.send({ embeds: [adminRejectEmbed(reason)] });
            } catch {}
          }

          const rows = disableMessageComponents(interaction.message);
          await interaction.update({
            content: `❌ تم رفض طلب الإدارة بواسطة ${interaction.user}.`,
            components: rows,
          }).catch(() => {});
          return;
        }
      }

      if (id.startsWith("modal_feedback_")) {
        const stars = id.split("_")[2];
        const reason = interaction.fields.getTextInputValue("reason");
        const ch = await interaction.guild.channels.fetch(FEEDBACK_CHANNEL_ID).catch(() => null);

        if (ch?.isTextBased()) {
          const embed = new EmbedBuilder()
            .setColor(0xffd54f)
            .setTitle("⭐ تقييم جديد للسيرفر")
            .addFields(
              { name: "العضو", value: `<@${interaction.user.id}>`, inline: true },
              { name: "عدد النجوم", value: `${stars}`, inline: true },
              { name: "السبب", value: safeTrim(reason, 1024), inline: false }
            )
            .setFooter({ text: `user:${interaction.user.id}` })
            .setTimestamp();

          await ch.send({ embeds: [embed] }).catch(() => {});
        }

        await interaction.reply({
          content: "✅ تم إرسال تقييمك بنجاح إلى الإدارة، شكرًا لك.",
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
        return;
      }
    }
  } catch (e) {
    console.log("interaction error:", e?.message || e);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      interaction.reply({
        content: "❌ حدث خطأ غير متوقع، فضلاً راجع السجل.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => {});
    }
  }
});

// ======================================================
// DM HANDLER
// ======================================================
client.on("messageCreate", async (msg) => {
  try {
    if (msg.author.bot) return;
    if (msg.guild) return;

    const session = sessions.get(msg.author.id);
    if (!session) return;

    const guild = await client.guilds.fetch(session.guildId).catch(() => null);
    if (!guild) {
      endSession(msg.author.id);
      return;
    }

    const questions =
      session.type === "rp"
        ? RP_QUESTIONS
        : session.type === "creator"
        ? CREATOR_QUESTIONS
        : ADMIN_QUESTIONS;

    const current = questions[session.step];
    if (!current) {
      endSession(msg.author.id);
      return;
    }

    const answer = safeTrim(msg.content, 2000);
    // ================= AGE CHECK =================
if (session.type === "rp" && current.key === "age") {

  const ageNumber = parseInt(answer.match(/\d+/)?.[0]);

  if (!ageNumber) {
    await msg.author.send("❌ يرجى كتابة العمر بشكل صحيح.");
    return;
  }

  if (ageNumber < 16) {
    await msg.author.send(
      "❌ تم رفض التقديم.\n\nسبب الرفض:\n• السن أقل من الحد المطلوب (16)."
    );

    endSession(msg.author.id);
    return;
  }
}

// ================= LOW QUALITY ANSWERS =================
const badAnswers = [
  "idk",
  "لا اعرف",
  "ما اعرف",
  "unknown",
  "none",
];

if (badAnswers.includes(answer.toLowerCase())) {
  await msg.author.send("❌ الإجابة غير واضحة. يرجى كتابة شرح بسيط.");
  return;
}

    if (tooShortAnswer(answer)) {
      await msg.author.send("❌ الإجابة قصيرة جدًا أو غير واضحة. فضلاً أعد كتابة إجابة مفهومة.");
      return;
    }

if (session.type === "rp" && current.key === "story") {

  let rejectReasons = [];

  // شرط عدد الكلمات
  if (wordCount(answer) < 150) {
    rejectReasons.push("القصة أقل من 150 كلمة");
  }

  // كشف AI (محسن)
  const aiPatterns = [
    "في عالم",
    "تدور أحداث",
    "منذ صغره",
    "كبر وهو",
    "في أحد الأيام",
    "لطالما كان",
    "بدأت القصة",
    "كان يعيش",
    "في مدينة",
  ];

  let aiScore = 0;
  for (const pattern of aiPatterns) {
    if (answer.includes(pattern)) {
      aiScore++;
    }
  }

  if (aiScore >= 4) {
    rejectReasons.push("القصة تبدو مولدة بمساعدة الذكاء الاصطناعي");
  }

  // لو في أسباب رفض
  if (rejectReasons.length > 0) {
    await msg.author.send(
      "❌ تم رفض التقديم.\n\nسبب الرفض:\n• " +
      rejectReasons.join("\n• ")
    );

    endSession(msg.author.id);
    return;
  }
}
    session.answers[current.key] = answer;
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

// ======================================================
// START
// ======================================================
if (!TOKEN) {
  console.log("❌ Missing TOKEN env var. Put TOKEN in Railway variables.");
} else {
  client.login(TOKEN).catch((e) => console.log("Login error:", e?.message || e));
}

