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
const WELCOME_CHANNEL_ID = "1465609782680621254";
const RULES_CHANNEL_ID = "1465786939755200687";
const FEEDBACK_CHANNEL_ID = "1482272258734161920";
const CONTROL_PANEL_CHANNEL_ID = "1480098674578034698";
const TICKET_LOG_CHANNEL_ID = "1482271256870129806";

const RP_APPLY_PANEL_CHANNEL_ID = "1465803291714785481";
const SERVICES_PANEL_CHANNEL_ID = "1465757986684403828";

const RP_REVIEW_CHANNEL_ID = "1477562619001831445";
const CREATOR_REVIEW_CHANNEL_ID = "1477777545767420116";
const ADMIN_REVIEW_CHANNEL_ID = "1479216695938650263";

// روم مواعيد المقابلات / التقديمات بعد قبول السيرفر
const RP_APPOINTMENTS_CHANNEL_ID = "1465755601937367130";

// ================= RULE LINKS =================
const DISCORD_RULES_LINK = "https://docs.google.com/document/d/1OVjgthyRPQ63sD49ezOjQ8pf-Q8soL5BJdZFFX-UmnM/edit?pli=1&tab=t.0";
const SERVER_RULES_LINK = "https://docs.google.com/document/d/1uCZBWJd5j4JGyacLFM-823YsTAnhSq88R_OfSaZ1Uv8/edit?tab=t.i85m88kkl7vw";

// ================= TICKET CATEGORIES =================
const SUPPORT_CATEGORY_ID = "1473850568811221194";
const APPEAL_CATEGORY_ID = "1477765907496308897";
const REPORT_CATEGORY_ID = "1473843823607021579";
const SUGGEST_CATEGORY_ID = "1477766632817426675";

// ================= ADMIN ROLES =================
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
const PANEL_MARKER_RP = "PANEL_RP_APPLY_v9";
const PANEL_MARKER_SERVICES = "PANEL_SERVICES_v9";
const PANEL_MARKER_CONTROL = "PANEL_CONTROL_v9";
const RULES_PANEL_MARKER = "RULES_PANEL_v9";

// ======================================================
// QUESTIONS
// ======================================================
const RP_QUESTIONS = [
  { key: "fullName", q: "📌 ما الاسم الكامل للشخصية؟" },
  { key: "age", q: "🎂 كم عمر الشخصية؟" },
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
  { key: "whyServer", q: "⭐ لماذا تريد الانضمام إلى هذا السيرفر؟" },
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
const RATINGS_FILE = path.join(__dirname, "rated_tickets.json");

const defaultSettings = {
  rpApply: true,
  support: true,
  appeal: true,
  report: true,
  suggest: true,
  creatorApply: true,
  adminApply: true,
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

function loadRatedTickets() {
  try {
    if (!fs.existsSync(RATINGS_FILE)) {
      fs.writeFileSync(RATINGS_FILE, JSON.stringify([], null, 2));
      return new Set();
    }
    const raw = fs.readFileSync(RATINGS_FILE, "utf8");
    const arr = JSON.parse(raw);
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveRatedTickets() {
  try {
    fs.writeFileSync(RATINGS_FILE, JSON.stringify([...ratedTickets], null, 2));
  } catch {}
}

let settings = loadSettings();
const ratedTickets = loadRatedTickets();

const sessions = new Map();
const activeApplications = new Set();
const ticketMeta = new Map();

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
    newRow.components = newRow.components.map((c) =>
      ButtonBuilder.from(c).setDisabled(true)
    );
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

function ticketIntro(kind) {
  switch (kind) {
    case "support":
      return "أهلاً بك في تذكرة الدعم الفني 👋\nاكتب مشكلتك بالتفصيل وسيتم الرد عليك من الإدارة.";
    case "appeal":
      return "أهلاً بك في تذكرة الاستئناف 📄\nاكتب سبب الاستئناف وكل التفاصيل المهمة.";
    case "report":
      return "أهلاً بك في تذكرة الشكوى 🚨\nاذكر اسم اللاعب والمخالفة والأدلة إن وجدت.";
    case "suggest":
      return "أهلاً بك في تذكرة الاقتراح 💡\nاكتب اقتراحك بشكل واضح ومفيد.";
    default:
      return "اكتب طلبك هنا.";
  }
}

function formatDuration(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}h ${m}m ${s}s`;
}

async function buildTranscript(channel) {
  let all = [];
  let lastId;

  while (true) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;

    const batch = await channel.messages.fetch(options).catch(() => null);
    if (!batch || batch.size === 0) break;

    all.push(...batch.values());
    lastId = batch.last().id;

    if (batch.size < 100) break;
  }

  all = all.reverse().slice(-100);

  let text = `Transcript for #${channel.name}\n`;
  text += `Generated at: ${new Date().toISOString()}\n`;
  text += "====================================================\n\n";

  for (const m of all) {
    const created = new Date(m.createdTimestamp).toLocaleString("en-US");
    const content = m.content || "[no text]";
    const attachments =
      m.attachments.size > 0
        ? ` | Attachments: ${[...m.attachments.values()].map((a) => a.url).join(", ")}`
        : "";
    text += `[${created}] ${m.author.tag}: ${content}${attachments}\n`;
  }

  return text;
}

// ======================================================
// EMBEDS
// ======================================================
function buildWelcomeEmbed(member) {
  return new EmbedBuilder()
    .setColor(0x2b6cff)
    .setTitle("👋 Welcome To Night City RP")
    .setDescription(
      `مرحباً <@${member.id}>\n\n` +
      `أهلاً بك في **Night City RP**\n\n` +
      `يرجى قراءة القوانين أولاً ثم التقديم على السيرفر من الزر بالأسفل.`
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setFooter({ text: "Night City RP" })
    .setTimestamp();
}

function buildRulesEmbed() {
  return new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle("📜 قوانين السيرفر")
    .setDescription("اضغط على الأزرار بالأسفل لقراءة القوانين.")
    .setFooter({ text: `Night City RP • ${RULES_PANEL_MARKER}` })
    .setTimestamp();
}

function rpAcceptPayload(guildId) {
  const url = `https://discord.com/channels/${guildId}/${RP_APPOINTMENTS_CHANNEL_ID}`;
  return {
    embed: new EmbedBuilder()
      .setColor("#00ff88")
      .setTitle("🏙️ تم قبول طلبك في السيرفر!")
      .setDescription(
        "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
        "🎉 **تهانينا!**\n\n" +
        "تم قبولك **مبدئيًا** في التقديم الإلكتروني.\n\n" +
        "تم منحك الرول الخاصة بالقبول.\n\n" +
        "اضغط الزر بالأسفل للدخول إلى **مواعيد التقديمات / المقابلات**.\n\n" +
        "━━━━━━━━━━━━━━━━━━━━━━"
      )
      .setFooter({ text: "Night City RP • الإدارة" })
      .setTimestamp(),
    row: new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("📅 دخول مواعيد التقديمات")
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
      "تم قبولك في **برنامج صناع المحتوى**.\n\n" +
      "تم منحك رتبة **صانع محتوى** بنجاح.\n\n" +
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
      "تم قبولك في **فريق الإدارة**.\n\n" +
      "تم منحك رتبة الإدارة بنجاح.\n\n" +
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
        : "هذه هي **المرة الأولى للرفض**، ويمكنك إعادة التقديم لاحقًا.")
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
.setDescription(
"اضغط الزر بالأسفل لبدء التقديم على الوايت ليست.\n" +
"سيتم إرسال الأسئلة في الخاص (DM)."
)
.setFooter({ text: `Night City RP • ${PANEL_MARKER_RP}` });

const row = new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("start_rp_apply")
.setLabel(settings.rpApply ? "🚀 بدء تقديم السيرفر" : "🚫 التقديم مغلق")
.setStyle(settings.rpApply ? ButtonStyle.Primary : ButtonStyle.Secondary)
.setDisabled(!settings.rpApply)

);

return {
embeds:[embed],
components:[row]
};

}


// ======================================================
// SERVICES PANEL
// ======================================================

async function buildServicesPanelPayload(){

const embed = new EmbedBuilder()
.setColor(0x2b2d31)
.setTitle("🛠️ خدمات السيرفر")
.setDescription("اختر الخدمة المطلوبة من الأزرار بالأسفل.")
.setFooter({ text:`Night City RP • ${PANEL_MARKER_SERVICES}` });

const row1 = new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("ticket_support")
.setLabel(settings.support ? "🧰 دعم فني" : "🚫 الدعم مغلق")
.setStyle(ButtonStyle.Secondary)
.setDisabled(!settings.support),

new ButtonBuilder()
.setCustomId("ticket_appeal")
.setLabel(settings.appeal ? "📄 استئناف" : "🚫 الاستئناف مغلق")
.setStyle(ButtonStyle.Secondary)
.setDisabled(!settings.appeal),

new ButtonBuilder()
.setCustomId("ticket_report")
.setLabel(settings.report ? "🚨 شكوى عن لاعب" : "🚫 الشكاوى مغلقة")
.setStyle(ButtonStyle.Danger)
.setDisabled(!settings.report)

);

const row2 = new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("ticket_suggest")
.setLabel(settings.suggest ? "💡 اقتراح" : "🚫 الاقتراحات مغلقة")
.setStyle(ButtonStyle.Secondary)
.setDisabled(!settings.suggest),

new ButtonBuilder()
.setCustomId("start_admin_apply")
.setLabel(settings.adminApply ? "👮 تقديم الإدارة" : "🚫 التقديم مغلق")
.setStyle(ButtonStyle.Primary)
.setDisabled(!settings.adminApply),

new ButtonBuilder()
.setCustomId("start_creator_apply")
.setLabel(settings.creatorApply ? "🎥 تقديم صانع محتوى" : "🚫 التقديم مغلق")
.setStyle(ButtonStyle.Success)
.setDisabled(!settings.creatorApply)

);

return {
embeds:[embed],
components:[row1,row2]
};

}


// ======================================================
// CONTROL PANEL
// ======================================================

async function buildControlPanelPayload(){

const embed = new EmbedBuilder()
.setColor(0xf1c40f)
.setTitle("🎛️ لوحة التحكم")
.setDescription("من هنا يمكنك فتح أو إغلاق الأزرار.")
.setFooter({ text:`Night City RP • ${PANEL_MARKER_CONTROL}` });

const row1 = new ActionRowBuilder().addComponents(

featureButton("toggle_rpApply","تقديم السيرفر",settings.rpApply),
featureButton("toggle_support","الدعم الفني",settings.support),
featureButton("toggle_appeal","الاستئناف",settings.appeal)

);

const row2 = new ActionRowBuilder().addComponents(

featureButton("toggle_report","شكوى لاعب",settings.report),
featureButton("toggle_suggest","الاقتراحات",settings.suggest),
featureButton("toggle_adminApply","تقديم الإدارة",settings.adminApply)

);

const row3 = new ActionRowBuilder().addComponents(

featureButton("toggle_creatorApply","تقديم صانع محتوى",settings.creatorApply)

);

return {
embeds:[embed],
components:[row1,row2,row3]
};

}


// ======================================================
// RULES PANEL
// ======================================================

async function buildRulesPanelPayload(){

const embed = buildRulesEmbed();

const row = new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setLabel("📜 قوانين الديسكورد")
.setStyle(ButtonStyle.Link)
.setURL(DISCORD_RULES_LINK),

new ButtonBuilder()
.setLabel("🎮 قوانين السيرفر")
.setStyle(ButtonStyle.Link)
.setURL(SERVER_RULES_LINK)

);

return {
embeds:[embed],
components:[row]
};

}


// ======================================================
// ENSURE PANELS
// ======================================================

async function ensurePanels(guild){

// RP PANEL
const rpChannel = await guild.channels.fetch(RP_APPLY_PANEL_CHANNEL_ID).catch(()=>null);

if(rpChannel?.isTextBased()){

const old = await findMarkerMessage(rpChannel,PANEL_MARKER_RP);
const payload = await buildRpPanelPayload();

if(!old)
await rpChannel.send(payload);
else
await old.edit(payload);

}


// SERVICES PANEL
const servicesChannel = await guild.channels.fetch(SERVICES_PANEL_CHANNEL_ID).catch(()=>null);

if(servicesChannel?.isTextBased()){

const old = await findMarkerMessage(servicesChannel,PANEL_MARKER_SERVICES);
const payload = await buildServicesPanelPayload();

if(!old)
await servicesChannel.send(payload);
else
await old.edit(payload);

}


// CONTROL PANEL
const controlChannel = await guild.channels.fetch(CONTROL_PANEL_CHANNEL_ID).catch(()=>null);

if(controlChannel?.isTextBased()){

const old = await findMarkerMessage(controlChannel,PANEL_MARKER_CONTROL);
const payload = await buildControlPanelPayload();

if(!old)
await controlChannel.send(payload);
else
await old.edit(payload);

}


// RULES PANEL
const rulesChannel = await guild.channels.fetch(RULES_CHANNEL_ID).catch(()=>null);

if(rulesChannel?.isTextBased()){

const old = await findMarkerMessage(rulesChannel,RULES_PANEL_MARKER);
const payload = await buildRulesPanelPayload();

if(!old)
await rulesChannel.send(payload);
else
await old.edit(payload);

}

}
// ======================================================
// TICKETS
// ======================================================

async function createTicket(interaction, kind) {

const guild = interaction.guild;
const member = interaction.member;

if(!guild || !member) return;

const categoryId = ticketCategory(kind);

const category = await guild.channels.fetch(categoryId).catch(()=>null);

if(!category || category.type !== ChannelType.GuildCategory){

return replyEphemeral(interaction,"❌ كاتيجوري التذاكر غير موجودة");

}

// منع فتح تذكرتين

const existing = guild.channels.cache.find(c =>
c.parentId === categoryId &&
c.permissionOverwrites.cache.has(interaction.user.id)
);

if(existing){

return replyEphemeral(interaction,`⚠️ لديك تذكرة مفتوحة بالفعل: ${existing}`);

}

// إنشاء التذكرة

const channel = await guild.channels.create({

name:`${kind}-${interaction.user.username}`,

type:ChannelType.GuildText,

parent:categoryId,

permissionOverwrites:[

{
id:guild.roles.everyone.id,
deny:[PermissionsBitField.Flags.ViewChannel]
},

{
id:interaction.user.id,
allow:[
PermissionsBitField.Flags.ViewChannel,
PermissionsBitField.Flags.SendMessages,
PermissionsBitField.Flags.ReadMessageHistory
]
},

...ADMIN_ROLE_IDS.map(rid=>({

id:rid,

allow:[
PermissionsBitField.Flags.ViewChannel,
PermissionsBitField.Flags.SendMessages,
PermissionsBitField.Flags.ReadMessageHistory,
PermissionsBitField.Flags.ManageChannels
]

}))

]

}).catch(()=>null);

if(!channel)
return replyEphemeral(interaction,"❌ فشل إنشاء التذكرة");

ticketMeta.set(channel.id,{
owner:interaction.user.id,
type:kind,
createdAt:Date.now()
});

const embed = new EmbedBuilder()

.setColor(0x2b2d31)

.setTitle(`🎫 ${ticketLabel(kind)}`)

.setDescription(ticketIntro(kind))

.setFooter({text:"Night City RP • Tickets"})

.setTimestamp();

const row = new ActionRowBuilder().addComponents(

new ButtonBuilder()

.setCustomId("ticket_close")

.setLabel("🔒 إغلاق التذكرة")

.setStyle(ButtonStyle.Danger)

);

await channel.send({

content:`<@${interaction.user.id}>`,

embeds:[embed],

components:[row]

});

return replyEphemeral(interaction,`✅ تم إنشاء التذكرة: ${channel}`);

}


// ======================================================
// CLOSE TICKET MODAL
// ======================================================

async function openCloseTicketModal(interaction){

const modal = new ModalBuilder()

.setCustomId("modal_close_ticket")

.setTitle("سبب إغلاق التذكرة");

const reason = new TextInputBuilder()

.setCustomId("reason")

.setLabel("اكتب سبب الإغلاق")

.setStyle(TextInputStyle.Paragraph)

.setRequired(true);

modal.addComponents(

new ActionRowBuilder().addComponents(reason)

);

await interaction.showModal(modal);

}


// ======================================================
// RATING SYSTEM
// ======================================================

function buildRatingRow(ticketId){

return new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId(`rate_5_${ticketId}`)
.setLabel("⭐⭐⭐⭐⭐")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId(`rate_4_${ticketId}`)
.setLabel("⭐⭐⭐⭐")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId(`rate_3_${ticketId}`)
.setLabel("⭐⭐⭐")
.setStyle(ButtonStyle.Secondary),

new ButtonBuilder()
.setCustomId(`rate_2_${ticketId}`)
.setLabel("⭐⭐")
.setStyle(ButtonStyle.Secondary),

new ButtonBuilder()
.setCustomId(`rate_1_${ticketId}`)
.setLabel("⭐")
.setStyle(ButtonStyle.Danger)

);

}


// ======================================================
// SEND RATING DM
// ======================================================

async function sendRatingDM(userId, ticketId){

try{

const user = await client.users.fetch(userId);

await user.send({

content:"⭐ قم بتقييم تجربتك مع التذكرة",

components:[buildRatingRow(ticketId)]

});

}catch{}

}


// ======================================================
// TRANSCRIPT + CLOSE
// ======================================================

async function closeTicket(interaction, reason){

const channel = interaction.channel;

const meta = ticketMeta.get(channel.id);

if(!meta) return;

const duration = Date.now() - meta.createdAt;

const transcript = await buildTranscript(channel);

const fileName = `ticket-${channel.id}.txt`;

const filePath = path.join(__dirname,fileName);

fs.writeFileSync(filePath,transcript);


// إرسال اللوجات

const logChannel = await interaction.guild.channels.fetch(TICKET_LOG_CHANNEL_ID).catch(()=>null);

if(logChannel?.isTextBased()){

const embed = new EmbedBuilder()

.setColor(0xff0000)

.setTitle("📁 Ticket Closed")

.addFields(

{name:"Owner",value:`<@${meta.owner}>`,inline:true},

{name:"Closed By",value:`${interaction.user}`,inline:true},

{name:"Duration",value:formatDuration(duration),inline:true},

{name:"Reason",value:safeTrim(reason,1000)}

)

.setTimestamp();

await logChannel.send({

embeds:[embed],

files:[filePath]

}).catch(()=>{});

}


// إرسال transcript للعضو

try{

const user = await client.users.fetch(meta.owner);

await user.send({

content:"📁 Transcript التذكرة",

files:[filePath]

});

}catch{}


// إرسال التقييم

await sendRatingDM(meta.owner,channel.id);


// حذف التذكرة

setTimeout(()=>{

channel.delete().catch(()=>{});

fs.unlinkSync(filePath);

},3000);

}
// ======================================================
// INTERACTIONS
// ======================================================

client.on("interactionCreate", async (interaction)=>{

try{

// ================= BUTTONS =================

if(interaction.isButton()){

const {customId} = interaction;

// ===== RP APPLY =====

if(customId === "start_rp_apply"){

if(!settings.rpApply)
return replyEphemeral(interaction,"⚠️ التقديم مغلق حالياً");

return replyEphemeral(interaction,"📩 تم إرسال نموذج التقديم في الخاص");

}


// ===== CREATOR APPLY =====

if(customId === "start_creator_apply"){

if(!settings.creatorApply)
return replyEphemeral(interaction,"⚠️ التقديم مغلق حالياً");

return replyEphemeral(interaction,"📩 تم إرسال نموذج التقديم في الخاص");

}


// ===== ADMIN APPLY =====

if(customId === "start_admin_apply"){

if(!settings.adminApply)
return replyEphemeral(interaction,"⚠️ التقديم مغلق حالياً");

return replyEphemeral(interaction,"📩 تم إرسال نموذج التقديم في الخاص");

}


// ===== TICKETS =====

if(customId === "ticket_support")
return createTicket(interaction,"support");

if(customId === "ticket_appeal")
return createTicket(interaction,"appeal");

if(customId === "ticket_report")
return createTicket(interaction,"report");

if(customId === "ticket_suggest")
return createTicket(interaction,"suggest");


// ===== CLOSE TICKET =====

if(customId === "ticket_close"){

if(!isAdmin(interaction.member))
return replyEphemeral(interaction,"❌ هذا الزر للإدارة فقط");

return openCloseTicketModal(interaction);

}


// ===== RATING =====

if(customId.startsWith("rate_")){

const parts = customId.split("_");

const stars = parts[1];

const ticketId = parts[2];

const key = `${interaction.user.id}_${ticketId}`;

if(ratedTickets.has(key)){

return interaction.reply({

content:"❌ لقد قمت بتقييم هذه التذكرة بالفعل",

flags:MessageFlags.Ephemeral

}).catch(()=>{});

}

ratedTickets.add(key);

saveRatedTickets();

const ch = await client.channels.fetch(FEEDBACK_CHANNEL_ID).catch(()=>null);

if(ch?.isTextBased()){

const embed = new EmbedBuilder()

.setColor("#FFD700")

.setTitle("⭐ تقييم تذكرة")

.addFields(

{name:"العضو",value:`<@${interaction.user.id}>`,inline:true},

{name:"التقييم",value:`${stars}/5`,inline:true},

{name:"رقم التذكرة",value:ticketId}

)

.setTimestamp();

await ch.send({embeds:[embed]}).catch(()=>{});

}

return interaction.reply({

content:"✅ تم إرسال تقييمك بنجاح",

flags:MessageFlags.Ephemeral

}).catch(()=>{});

}

}


// ================= MODALS =================

if(interaction.isModalSubmit()){

// ===== CLOSE TICKET =====

if(interaction.customId === "modal_close_ticket"){

const reason = interaction.fields.getTextInputValue("reason");

await interaction.reply({

content:"🔒 سيتم إغلاق التذكرة...",

flags:MessageFlags.Ephemeral

});

await closeTicket(interaction,reason);

}

}

}catch(e){

console.log("interaction error:",e);

}

});


// ======================================================
// READY
// ======================================================

client.once("clientReady", async ()=>{

console.log(`✅ Logged in as ${client.user.tag}`);

for(const [,guild] of client.guilds.cache){

await ensurePanels(guild).catch(()=>{});

}

});


// ======================================================
// START
// ======================================================

if(!TOKEN){

console.log("❌ ضع TOKEN في Railway");

}else{

client.login(TOKEN).catch(console.error);

}
