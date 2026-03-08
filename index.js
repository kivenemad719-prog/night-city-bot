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
const FEEDBACK_CHANNEL_ID = "1480098551248715896";
const CONTROL_PANEL_CHANNEL_ID = "1480098674578034698";
const TICKET_LOG_CHANNEL_ID = "1480260733651652698";

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
const PANEL_MARKER_RP = "PANEL_RP_APPLY_v7";
const PANEL_MARKER_SERVICES = "PANEL_SERVICES_v7";
const PANEL_MARKER_CONTROL = "PANEL_CONTROL_v4";

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

  all = all.reverse();

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

function getTicketOwnerFromChannel(channel) {
  const overwrites = channel.permissionOverwrites?.cache;
  if (!overwrites) return null;

  for (const [, ow] of overwrites) {
    if (
      ow.type === 1 &&
      ow.allow.has(PermissionsBitField.Flags.ViewChannel)
    ) {
      if (!ADMIN_ROLE_IDS.includes(ow.id)) {
        return ow.id;
      }
    }
  }
  return null;
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
        `يرجى قراءة القوانين ثم التقديم على الوايت ليست.`
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

  return { embeds:[embed], components:[row] };

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
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!settings.support),

    new ButtonBuilder()
      .setCustomId("ticket_appeal")
      .setLabel(settings.appeal ? "📄 استئناف" : "🚫 استئناف")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!settings.appeal),

    new ButtonBuilder()
      .setCustomId("ticket_report")
      .setLabel(settings.report ? "🚨 شكوى عن لاعب" : "🚫 شكوى")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(!settings.report)

  );

  const row2 = new ActionRowBuilder().addComponents(

    new ButtonBuilder()
      .setCustomId("ticket_suggest")
      .setLabel(settings.suggest ? "💡 اقتراح" : "🚫 اقتراح")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!settings.suggest),

    new ButtonBuilder()
      .setCustomId("start_admin_apply")
      .setLabel(settings.adminApply ? "👮 تقديم على الإدارة" : "🚫 تقديم الإدارة مغلق")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!settings.adminApply),

    new ButtonBuilder()
      .setCustomId("start_creator_apply")
      .setLabel(settings.creatorApply ? "🎥 تقديم صانع محتوى" : "🚫 تقديم صانع محتوى مغلق")
      .setStyle(ButtonStyle.Success)
      .setDisabled(!settings.creatorApply)

  );

  return { embeds:[embed], components:[row1,row2] };

}

async function buildControlPanelPayload() {

  const embed = new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle("🎛️ لوحة تحكم الأزرار")
    .setDescription("من هنا تقدر تفتح وتقفل أي زر في البانلات.")
    .setFooter({ text: `Night City RP • ${PANEL_MARKER_CONTROL}` })
    .setTimestamp();

  const row1 = new ActionRowBuilder().addComponents(

    featureButton("toggle_rpApply","تقديم السيرفر",settings.rpApply),
    featureButton("toggle_support","الدعم الفني",settings.support),
    featureButton("toggle_appeal","الاستئناف",settings.appeal)

  );

  const row2 = new ActionRowBuilder().addComponents(

    featureButton("toggle_report","شكوى عن لاعب",settings.report),
    featureButton("toggle_suggest","الاقتراحات",settings.suggest)

  );

  const row3 = new ActionRowBuilder().addComponents(

    featureButton("toggle_adminApply","تقديم الإدارة",settings.adminApply),
    featureButton("toggle_creatorApply","تقديم صانع محتوى",settings.creatorApply)

  );

  return { embeds:[embed], components:[row1,row2,row3] };

}

// ======================================================
// ENSURE PANELS
// ======================================================

async function ensurePanels(guild){

  const rpChannel = await guild.channels.fetch(RP_APPLY_PANEL_CHANNEL_ID).catch(()=>null)

  if(rpChannel?.isTextBased()){

    const old = await findMarkerMessage(rpChannel,PANEL_MARKER_RP)

    const payload = await buildRpPanelPayload()

    if(!old) await rpChannel.send(payload)
    else await old.edit(payload)

  }

  const servicesChannel = await guild.channels.fetch(SERVICES_PANEL_CHANNEL_ID).catch(()=>null)

  if(servicesChannel?.isTextBased()){

    const old = await findMarkerMessage(servicesChannel,PANEL_MARKER_SERVICES)

    const payload = await buildServicesPanelPayload()

    if(!old) await servicesChannel.send(payload)
    else await old.edit(payload)

  }

  const controlChannel = await guild.channels.fetch(CONTROL_PANEL_CHANNEL_ID).catch(()=>null)

  if(controlChannel?.isTextBased()){

    const old = await findMarkerMessage(controlChannel,PANEL_MARKER_CONTROL)

    const payload = await buildControlPanelPayload()

    if(!old) await controlChannel.send(payload)
    else await old.edit(payload)

  }

}

// ======================================================
// READY
// ======================================================

client.once("clientReady", async ()=>{

  console.log(`✅ Logged in as ${client.user.tag}`);

  for(const [,guild] of client.guilds.cache){

    await ensurePanels(guild).catch(()=>{})

  }

});
// ======================================================
// APPLICATION FLOW
// ======================================================

async function startDmFlow(user, guild, type) {

  const member = await guild.members.fetch(user.id).catch(()=>null)
  if(!member) return {ok:false}

  if(activeApplications.has(user.id)){
    return {ok:false, reason:"active"}
  }

  activeApplications.add(user.id)

  const questions =
  type==="rp"
  ? RP_QUESTIONS
  : type==="creator"
  ? CREATOR_QUESTIONS
  : ADMIN_QUESTIONS

  sessions.set(user.id,{
    type,
    step:0,
    answers:{},
    guildId:guild.id
  })

  try{

    await user.send("✅ بدأنا التقديم في الخاص. يرجى الإجابة على الأسئلة.")

    await user.send(questions[0].q)

    return {ok:true}

  }catch{

    endSession(user.id)

    return {ok:false, reason:"dm_closed"}

  }

}

// ======================================================
// REVIEW SEND
// ======================================================

async function submitToReview(guild,userId,type,answers){

  let chId

  if(type==="rp") chId = RP_REVIEW_CHANNEL_ID
  if(type==="creator") chId = CREATOR_REVIEW_CHANNEL_ID
  if(type==="admin") chId = ADMIN_REVIEW_CHANNEL_ID

  const ch = await guild.channels.fetch(chId).catch(()=>null)

  if(!ch) return

  const embed = new EmbedBuilder()
  .setColor("#5865f2")
  .setTitle("📩 طلب جديد")
  .setFooter({text:`user:${userId}`})
  .setTimestamp()

  Object.keys(answers).forEach(k=>{
    embed.addFields({
      name:k,
      value:safeTrim(answers[k],1024),
      inline:false
    })
  })

  const row = new ActionRowBuilder().addComponents(

    new ButtonBuilder()
    .setCustomId(`approve_${type}_${userId}`)
    .setLabel("✅ قبول")
    .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
    .setCustomId(`reject_${type}_${userId}`)
    .setLabel("❌ رفض")
    .setStyle(ButtonStyle.Danger)

  )

  ch.send({
    embeds:[embed],
    components:[row]
  })

}

// ======================================================
// DM HANDLER
// ======================================================

client.on("messageCreate", async msg=>{

  if(msg.author.bot) return
  if(msg.guild) return

  const session = sessions.get(msg.author.id)
  if(!session) return

  const guild = await client.guilds.fetch(session.guildId).catch(()=>null)
  if(!guild) return

  const questions =
  session.type==="rp"
  ? RP_QUESTIONS
  : session.type==="creator"
  ? CREATOR_QUESTIONS
  : ADMIN_QUESTIONS

  const current = questions[session.step]

  const answer = msg.content

  if(tooShortAnswer(answer)){
    return msg.author.send("❌ الإجابة قصيرة جدًا.")
  }

  if(session.type==="rp" && current.key==="story"){
    if(wordCount(answer) < 150){
      return msg.author.send("❌ قصة الشخصية يجب أن تكون 150 كلمة على الأقل.")
    }
  }

  session.answers[current.key] = answer

  session.step++

  if(session.step < questions.length){

    msg.author.send(questions[session.step].q)

  }else{

    msg.author.send("✅ تم إرسال التقديم للإدارة.")

    submitToReview(guild,msg.author.id,session.type,session.answers)

    endSession(msg.author.id)

  }

})

// ======================================================
// TICKET SYSTEM
// ======================================================

async function createTicket(interaction,kind){

  const guild = interaction.guild
  const member = interaction.member

  const categoryId = ticketCategory(kind)

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
          PermissionsBitField.Flags.SendMessages
        ]
      },

      ...ADMIN_ROLE_IDS.map(r=>({

        id:r,

        allow:[
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]

      }))

    ]

  })

  ticketMeta.set(channel.id,{
    owner:interaction.user.id,
    createdAt:Date.now()
  })

  const embed = new EmbedBuilder()
  .setColor("#2b2d31")
  .setTitle(`🎫 ${ticketLabel(kind)}`)
  .setDescription("اكتب طلبك هنا وسيتم الرد عليك.")

  const row = new ActionRowBuilder().addComponents(

    new ButtonBuilder()
    .setCustomId("ticket_close")
    .setLabel("🔒 إغلاق التذكرة")
    .setStyle(ButtonStyle.Danger)

  )

  channel.send({
    content:`<@${interaction.user.id}>`,
    embeds:[embed],
    components:[row]
  })

  return replyEphemeral(interaction,`✅ تم إنشاء التذكرة: ${channel}`)

}

// ======================================================
// INTERACTIONS
// ======================================================

client.on("interactionCreate", async interaction=>{

  if(interaction.isButton()){

    const {customId} = interaction

    if(customId==="start_rp_apply"){
      const res = await startDmFlow(interaction.user,interaction.guild,"rp")
      if(!res.ok) return replyEphemeral(interaction,"❌ لا يمكن بدء التقديم.")
      return replyEphemeral(interaction,"✅ تم إرسال التقديم في الخاص.")
    }

    if(customId==="start_creator_apply"){
      const res = await startDmFlow(interaction.user,interaction.guild,"creator")
      if(!res.ok) return replyEphemeral(interaction,"❌ لا يمكن بدء التقديم.")
      return replyEphemeral(interaction,"✅ تم إرسال التقديم في الخاص.")
    }

    if(customId==="start_admin_apply"){
      const res = await startDmFlow(interaction.user,interaction.guild,"admin")
      if(!res.ok) return replyEphemeral(interaction,"❌ لا يمكن بدء التقديم.")
      return replyEphemeral(interaction,"✅ تم إرسال التقديم في الخاص.")
    }

    if(customId==="ticket_support") return createTicket(interaction,"support")
    if(customId==="ticket_appeal") return createTicket(interaction,"appeal")
    if(customId==="ticket_report") return createTicket(interaction,"report")
    if(customId==="ticket_suggest") return createTicket(interaction,"suggest")

    if(customId==="ticket_close"){

      const member = interaction.member

      if(!isAdmin(member)){
        return replyEphemeral(interaction,"❌ هذا الزر للإدارة فقط.")
      }

      const modal = new ModalBuilder()
      .setCustomId("modal_ticket_close")
      .setTitle("سبب إغلاق التذكرة")

      const input = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("اكتب السبب")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)

      modal.addComponents(new ActionRowBuilder().addComponents(input))

      return interaction.showModal(modal)

    }

    if(customId.startsWith("ticket_rate_")){

      const stars = customId.split("_")[2]

      const ch = await interaction.guild.channels.fetch(FEEDBACK_CHANNEL_ID).catch(()=>null)

      if(ch){

        const embed = new EmbedBuilder()
        .setColor("#FFD700")
        .setTitle("⭐ تقييم تذكرة")
        .addFields(
          {name:"العضو",value:`<@${interaction.user.id}>`,inline:true},
          {name:"التقييم",value:`${stars}/5`,inline:true}
        )
        .setTimestamp()

        ch.send({embeds:[embed]})

      }

      return interaction.reply({
        content:"✅ شكراً لتقييمك.",
        flags:MessageFlags.Ephemeral
      })

    }

  }

  if(interaction.isModalSubmit()){

    if(interaction.customId==="modal_ticket_close"){

      const reason = interaction.fields.getTextInputValue("reason")

      const meta = ticketMeta.get(interaction.channel.id)

      const ownerId = meta?.owner

      const duration = meta ? formatDuration(Date.now() - meta.createdAt) : "Unknown"

      const transcript = await buildTranscript(interaction.channel)

      const fileName = `transcript-${Date.now()}.txt`

      fs.writeFileSync(fileName,transcript)

      const log = await interaction.guild.channels.fetch(TICKET_LOG_CHANNEL_ID).catch(()=>null)

      if(log){

        const embed = new EmbedBuilder()
        .setColor("#ffaa00")
        .setTitle("📄 Ticket Closed")
        .addFields(
          {name:"Closed By",value:`<@${interaction.user.id}>`,inline:true},
          {name:"Duration",value:duration,inline:true},
          {name:"Reason",value:reason}
        )
        .setTimestamp()

        log.send({
          embeds:[embed],
          files:[fileName]
        })

      }

      if(ownerId){

        const user = await client.users.fetch(ownerId).catch(()=>null)

        if(user){

          const row = new ActionRowBuilder().addComponents(

            new ButtonBuilder().setCustomId("ticket_rate_5").setLabel("⭐⭐⭐⭐⭐").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("ticket_rate_4").setLabel("⭐⭐⭐⭐").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("ticket_rate_3").setLabel("⭐⭐⭐").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("ticket_rate_2").setLabel("⭐⭐").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("ticket_rate_1").setLabel("⭐").setStyle(ButtonStyle.Danger)

          )

          user.send({
            embeds:[
              new EmbedBuilder()
              .setColor("#ff9900")
              .setTitle("📩 تم إغلاق تذكرتك")
              .setDescription(`السبب:\n${reason}\n\n⭐ قيم تجربتك`)
            ],
            components:[row],
            files:[fileName]
          }).catch(()=>{})

        }

      }

      await interaction.reply({
        content:"✅ سيتم إغلاق التذكرة.",
        flags:MessageFlags.Ephemeral
      })

      setTimeout(()=>interaction.channel.delete().catch(()=>{}),4000)

    }

  }

})

// ======================================================
// WELCOME
// ======================================================

client.on("guildMemberAdd", async member=>{

  const ch = member.guild.channels.cache.get(WELCOME_CHANNEL_ID)

  if(!ch) return

  const row = new ActionRowBuilder().addComponents(

    new ButtonBuilder()
    .setLabel("📜 قوانين السيرفر")
    .setStyle(ButtonStyle.Link)
    .setURL(`https://discord.com/channels/${member.guild.id}/${RULES_CHANNEL_ID}`),

    new ButtonBuilder()
    .setLabel("📝 نموذج التقديم على الوايت ليست")
    .setStyle(ButtonStyle.Link)
    .setURL(`https://discord.com/channels/${member.guild.id}/${RP_APPLY_PANEL_CHANNEL_ID}`)

  )

  ch.send({
    content:`<@${member.id}>`,
    embeds:[buildWelcomeEmbed(member)],
    components:[row]
  })

})

// ======================================================
// START
// ======================================================

if(!TOKEN){
  console.log("❌ Missing TOKEN")
}else{
  client.login(TOKEN)
}

