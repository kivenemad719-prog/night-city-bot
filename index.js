// index.js (discord.js v14)
// IMPORTANT: Put TOKEN in Railway Variables: TOKEN=xxxxx  (do NOT hardcode token here)

const activeApplications = new Set(); // prevents multiple active DM applications per user
const sessions = new Map(); // userId -> { type, step, answers, guildId }

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

// Panels channels (من صورتك شكلهم كده — لو غلط عدّلهم)
const RP_APPLY_PANEL_CHANNEL_ID = "1465803291714785481";       // بانل تقديم RP (لوحده)
const SERVICES_PANEL_CHANNEL_ID = "1465757986684403828";       // بانل خدمات/تكتات/صانع محتوى (واحد)

// Ticket categories
const SUPPORT_CATEGORY_ID = "1473850568811221194";
const APPEAL_CATEGORY_ID  = "1477765907496308897";
const REPORT_CATEGORY_ID  = "1473850252149788867";
const SUGGEST_CATEGORY_ID = "1477766632817426675";

// Admin roles (اللي يقدر يقبل/يرفض ويقفل التذاكر)
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

// Panel markers (to avoid duplicates on restart)
const PANEL_MARKER_RP = "PANEL_RP_APPLY_v1";
const PANEL_MARKER_SERVICES = "PANEL_SERVICES_v1";

// ===================== QUESTIONS =====================
const RP_QUESTIONS = [
  { key: "fullName", q: "📌 **الاسم الكامل للشخصية؟**" },
  { key: "age", q: "🎂 **العمر؟**" },
  { key: "rules", q: "📚 **هل قرأت القوانين؟ اكتب (نعم) + اذكر أهم 3 نقاط فهمتهم**" },
  { key: "experience", q: "🎮 **هل عندك خبرة RP؟ اشرح باختصار**" },
  { key: "story", q: "📝 **اكتب قصة للشخصية 150 كلمة على الأقل**" },
  { key: "mic", q: "🎙️ **هل المايك كويس؟ (نعم/لا) + نوعه لو تعرف**" },
  { key: "commit", q: "✅ **هل تلتزم بالقوانين واحترام الإدارة؟ (نعم/لا)**" },
];

const CREATOR_QUESTIONS = [
  { key: "channelLink", q: "🔗 **رابط القناة/الحساب؟**" },
  { key: "followers", q: "👥 **عدد المتابعين/المشتركين؟**" },
  { key: "contentType", q: "🎥 **نوع المحتوى اللي بتقدمه؟**" },
  { key: "schedule", q: "📅 **جدول النشر (أيام/ساعات)؟**" },
  { key: "why", q: "💡 **ليه عايز تكون صانع محتوى عندنا؟**" },
  { key: "agree", q: "✅ **تتعهد بعدم مخالفة القوانين؟ (نعم/لا)**" },
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
  if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;
  return ADMIN_ROLE_IDS.some((rid) => member.roles.cache.has(rid));
}

function safeTrim(v, max = 1024) {
  if (!v) return "";
  const s = String(v).trim();
  if (!s) return "";
  return s.length > max ? s.slice(0, max - 3) + "..." : s;
}

async function findMarkerMessage(ch, marker) {
  // scan last 50 messages and find an embed footer containing marker
  const msgs = await ch.messages.fetch({ limit: 50 }).catch(() => null);
  if (!msgs) return null;
  for (const [, m] of msgs) {
    const e = m.embeds?.[0];
    const footer = e?.footer?.text || "";
    if (footer.includes(marker)) return m;
  }
  return null;
}

function disableRow(row) {
  const newRow = ActionRowBuilder.from(row);
  newRow.components = newRow.components.map((c) =>
    ButtonBuilder.from(c).setDisabled(true)
  );
  return newRow;
}

// ===================== PANELS =====================
async function ensurePanels(guild) {
  // RP Apply Panel
  if (RP_APPLY_PANEL_CHANNEL_ID && !String(RP_APPLY_PANEL_CHANNEL_ID).startsWith("PUT_")) {
    const ch = await guild.channels.fetch(RP_APPLY_PANEL_CHANNEL_ID).catch(() => null);
    if (ch && ch.isTextBased()) {
      const exists = await findMarkerMessage(ch, PANEL_MARKER_RP);
      if (!exists) {
        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle("📝 تقديم RP")
          .setDescription("اضغط الزر بالأسفل لبدء التقديم في الخاص (DM).")
          .setFooter({ text: `Night City RP • ${PANEL_MARKER_RP}` });

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

  // Services Panel (tickets + creator apply)
  if (SERVICES_PANEL_CHANNEL_ID && !String(SERVICES_PANEL_CHANNEL_ID).startsWith("PUT_")) {
    const ch = await guild.channels.fetch(SERVICES_PANEL_CHANNEL_ID).catch(() => null);
    if (ch && ch.isTextBased()) {
      const exists = await findMarkerMessage(ch, PANEL_MARKER_SERVICES);
      if (!exists) {
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
          new ButtonBuilder().setCustomId("start_creator_apply").setLabel("🎥 تقديم صانع محتوى").setStyle(ButtonStyle.Success)
        );

        await ch.send({ embeds: [embed], components: [row1, row2] }).catch(() => {});
      }
    }
  }
}

// ===================== DM FLOW =====================
async function startDmFlow(user, guild, type) {
  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return;

  // منع فتح أكثر من تقديم
  if (activeApplications.has(user.id)) {
    try { await user.send("⚠️ لديك تقديم مفتوح بالفعل، أكمل التقديم أولاً."); } catch {}
    return;
  }

  // منع التقديم لو رفض نهائي (RP فقط)
  if (type === "rp" && member.roles.cache.has(RP_REJECT2_ROLE_ID)) {
    try { await user.send("⛔ تم رفض طلبك نهائياً ولا يمكنك التقديم مرة أخرى."); } catch {}
    return;
  }

  // منع إعادة التقديم لو مقبول بالفعل (RP فقط)
  if (type === "rp" && member.roles.cache.has(RP_PASS_ROLE_ID)) {
    try { await user.send("✅ أنت مقبول بالفعل في السيرفر. لا تحتاج إعادة تقديم."); } catch {}
    return;
  }

  activeApplications.add(user.id);

  // Create session
  const questions = type === "rp" ? RP_QUESTIONS : CREATOR_QUESTIONS;
  sessions.set(user.id, {
    type,
    step: 0,
    answers: {},
    guildId: guild.id,
  });

  // Send start + first question
  await user.send(
    type === "rp"
      ? "✅ **بدأنا تقديم RP.**\nاكتب الإجابة سؤال بسؤال."
      : "✅ **بدأنا تقديم صانع محتوى.**\nاكتب الإجابة سؤال بسؤال."
  );

  await user.send(questions[0].q);
}

function endSession(userId) {
  sessions.delete(userId);
  activeApplications.delete(userId);
}

// ===================== SUBMIT TO REVIEW =====================
async function submitRpToReview(guild, userId, answers) {
  const ch = await guild.channels.fetch(RP_REVIEW_CHANNEL_ID).catch(() => null);
  if (!ch || !ch.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("📩 طلب RP جديد")
    .addFields(
      { name: "👤 الاسم", value: safeTrim(answers.fullName, 256) || "-", inline: true },
      { name: "🎂 العمر", value: safeTrim(answers.age, 256) || "-", inline: true },
      { name: "📚 قرأت القوانين", value: safeTrim(answers.rules, 256) || "-", inline: false },
      { name: "🎮 خبرة RP", value: safeTrim(answers.experience, 1024) || "-", inline: false },
      { name: "📝 القصة (150 كلمة+)", value: safeTrim(answers.story, 1024) || "-", inline: false },
      { name: "🎙️ مايك", value: safeTrim(answers.mic, 256) || "-", inline: true },
      { name: "✅ الالتزام", value: safeTrim(answers.commit, 256) || "-", inline: true }
    )
    .setFooter({ text: `user:${userId}` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`approve_rp_${userId}`)
      .setLabel("✅ قبول")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`reject_rp_${userId}`)
      .setLabel("❌ رفض")
      .setStyle(ButtonStyle.Danger)
  );

  await ch.send({ embeds: [embed], components: [row] }).catch(() => {});
}

async function submitCreatorToReview(guild, userId, answers) {
  const ch = await guild.channels.fetch(CREATOR_REVIEW_CHANNEL_ID).catch(() => null);
  if (!ch || !ch.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setColor(0x00ff88)
    .setTitle("🎥 طلب صانع محتوى جديد")
    .addFields(
      { name: "🔗 رابط القناة", value: safeTrim(answers.channelLink, 1024) || "-", inline: false },
      { name: "👥 المتابعين", value: safeTrim(answers.followers, 256) || "-", inline: true },
      { name: "🎥 نوع المحتوى", value: safeTrim(answers.contentType, 1024) || "-", inline: false },
      { name: "📅 جدول النشر", value: safeTrim(answers.schedule, 1024) || "-", inline: false },
      { name: "💡 السبب", value: safeTrim(answers.why, 1024) || "-", inline: false },
      { name: "✅ الالتزام", value: safeTrim(answers.agree, 256) || "-", inline: true }
    )
    .setFooter({ text: `user:${userId}` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`approve_creator_${userId}`)
      .setLabel("✅ قبول")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`reject_creator_${userId}`)
      .setLabel("❌ رفض")
      .setStyle(ButtonStyle.Danger)
  );

  await ch.send({ embeds: [embed], components: [row] }).catch(() => {});
}

// ===================== TICKETS =====================
function categoryForTicket(kind) {
  if (kind === "support") return SUPPORT_CATEGORY_ID;
  if (kind === "appeal") return APPEAL_CATEGORY_ID;
  if (kind === "report") return REPORT_CATEGORY_ID;
  if (kind === "suggest") return SUGGEST_CATEGORY_ID;
  return SUPPORT_CATEGORY_ID;
}

function labelForTicket(kind) {
  if (kind === "support") return "دعم فني";
  if (kind === "appeal") return "استئناف";
  if (kind === "report") return "بلاغ";
  if (kind === "suggest") return "اقتراح";
  return "تذكرة";
}

async function createTicket(interaction, kind) {
  const guild = interaction.guild;
  const member = interaction.member;
  if (!guild || !member) return;

  const parentId = categoryForTicket(kind);
  const parent = await guild.channels.fetch(parentId).catch(() => null);
  if (!parent || parent.type !== ChannelType.GuildCategory) {
    return interaction.reply({ content: "❌ كاتيجوري التذاكر غير موجود/ID غلط.", ephemeral: true });
  }

  // Create channel name
  const base = `${kind}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9\-]/g, "");
  const name = base.length > 80 ? base.slice(0, 80) : base;

  const ch = await guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent: parentId,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
      ...ADMIN_ROLE_IDS.map((rid) => ({
        id: rid,
        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
      })),
    ],
  }).catch(() => null);

  if (!ch) return interaction.reply({ content: "❌ فشل إنشاء التذكرة.", ephemeral: true });

  await sendTicketIntro(ch, member, labelForTicket(kind));
  return interaction.reply({ content: `✅ تم إنشاء تذكرتك: ${ch}`, ephemeral: true });
}

async function sendTicketIntro(ch, opener, kindLabel) {
  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle(`📩 تذكرة: ${kindLabel}`)
    .setDescription(`أهلاً <@${opener.user.id}> 👋\nاكتب مشكلتك هنا، وسيتم الرد عليك من الإدارة.`)
    .setFooter({ text: "Night City RP • ticket" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("🔒 إغلاق التذكرة")
      .setStyle(ButtonStyle.Danger)
  );

  await ch.send({ embeds: [embed], components: [row] }).catch(() => {});
}

// ===================== MODAL (REJECTION REASON) =====================
async function openRejectModal(interaction, type, userId) {
  const modal = new ModalBuilder()
    .setCustomId(`modal_reject_${type}_${userId}`)
    .setTitle("سبب الرفض");

  const reasonInput = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("اكتب سبب الرفض")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
  await interaction.showModal(modal);
}

// ===================== EVENTS =====================
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  for (const [, guild] of client.guilds.cache) {
    await ensurePanels(guild).catch(() => {});
  }
});

// Button interactions
client.on("interactionCreate", async (interaction) => {
  try {
    // ===== Buttons =====
    if (interaction.isButton()) {
      const { customId } = interaction;

      // RP apply panel
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

      // Creator apply (from services panel)
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

      // Tickets
      if (customId === "ticket_support") return createTicket(interaction, "support");
      if (customId === "ticket_appeal") return createTicket(interaction, "appeal");
      if (customId === "ticket_report") return createTicket(interaction, "report");
      if (customId === "ticket_suggest") return createTicket(interaction, "suggest");

      // Close ticket
      if (customId === "close_ticket") {
        const member = interaction.member;
        if (!member || !isAdmin(member)) {
          return interaction.reply({ content: "❌ هذا الزر للإدارة فقط.", ephemeral: true });
        }
        await interaction.reply({ content: "✅ سيتم إغلاق التذكرة خلال ثوانٍ.", ephemeral: true });
        setTimeout(() => interaction.channel?.delete().catch(() => {}), 1500);
        return;
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
          // roles
          await target.roles.remove(RP_REJECT1_ROLE_ID).catch(() => {});
          await target.roles.remove(RP_REJECT2_ROLE_ID).catch(() => {});
          await target.roles.add(RP_PASS_ROLE_ID).catch(() => {});

          // DM nice embed
          try {
            await target.send({
              embeds: [
                new EmbedBuilder()
                  .setColor(0x00ff88)
                  .setTitle("🎉 تم قبول طلبك!")
                  .setDescription("✅ تهانينا!\nتم قبولك في السيرفر.\nاضغط الزر بالأسفل للدخول.")
                  .setFooter({ text: "Night City RP • الإدارة" })
                  .setTimestamp(),
              ],
            });
          } catch {}

          // Update message (disable buttons)
          const msg = interaction.message;
          const row = msg.components?.[0];
          if (row) await interaction.update({ content: "✅ تم القبول.", components: [disableRow(row)] }).catch(() => {});
          else await interaction.update({ content: "✅ تم القبول.", components: [] }).catch(() => {});
          return;
        }

        // Reject -> open modal to get reason
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
          // DM nice embed
try {
  await target.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle("🎉 تم قبول طلبك!")
        .setDescription("✅ تهانينا!\nتم قبولك مبدئيًا في السيرفر.\nاضغط الزر بالأسفل للدخول للمقابلة الصوتية.")
        .setFooter({ text: "Night City RP • الإدارة" })
        .setTimestamp(),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("🎤 دخول المقابلة الصوتية")
          .setStyle(ButtonStyle.Link)
          .setURL("https://discord.com/channels/1465609781837303873/1465752669564964935")
      )
    ]
  });
} catch {}

          const msg = interaction.message;
          const row = msg.components?.[0];
          if (row) await interaction.update({ content: "✅ تم قبول صانع المحتوى.", components: [disableRow(row)] }).catch(() => {});
          else await interaction.update({ content: "✅ تم قبول صانع المحتوى.", components: [] }).catch(() => {});
          return;
        }

        return openRejectModal(interaction, "creator", userId);
      }
    }

    // ===== Modal submit =====
    if (interaction.isModalSubmit()) {
      const id = interaction.customId;

      if (id.startsWith("modal_reject_")) {
        const parts = id.split("_"); // modal reject type userId
        // format: modal_reject_{type}_{userId}
        const type = parts[2];
        const userId = parts.slice(3).join("_"); // safe
        const reason = interaction.fields.getTextInputValue("reason");

        const target = await interaction.guild.members.fetch(userId).catch(() => null);

        if (type === "rp") {
          if (target) {
            // 1st reject -> add reject1, 2nd -> reject2 final
            if (!target.roles.cache.has(RP_REJECT1_ROLE_ID)) {
              await target.roles.add(RP_REJECT1_ROLE_ID).catch(() => {});
            } else {
              await target.roles.remove(RP_REJECT1_ROLE_ID).catch(() => {});
              await target.roles.add(RP_REJECT2_ROLE_ID).catch(() => {});
            }

            try {
              await target.send({
                embeds: [
                  new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle("❌ تم رفض طلبك")
                    .setDescription(`**سبب الرفض:**\n${safeTrim(reason, 1500)}`)
                    .setFooter({ text: "Night City RP • الإدارة" })
                    .setTimestamp(),
                ],
              });
            } catch {}
          }

          const msg = interaction.message;
          const row = msg.components?.[0];
          await interaction.update({
            content: `❌ تم الرفض بواسطة ${interaction.user}.`,
            components: row ? [disableRow(row)] : [],
          }).catch(() => {});
          return;
        }

        if (type === "creator") {
          if (target) {
            try {
              await target.send({
                embeds: [
                  new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle("❌ تم رفض طلب صانع المحتوى")
                    .setDescription(`**سبب الرفض:**\n${safeTrim(reason, 1500)}`)
                    .setFooter({ text: "Night City RP • الإدارة" })
                    .setTimestamp(),
                ],
              });
            } catch {}
          }

          const msg = interaction.message;
          const row = msg.components?.[0];
          await interaction.update({
            content: `❌ تم رفض صانع المحتوى بواسطة ${interaction.user}.`,
            components: row ? [disableRow(row)] : [],
          }).catch(() => {});
          return;
        }
      }
    }
  } catch (e) {
    console.log("interaction error:", e?.message || e);
    if (interaction.isRepliable() && !interaction.replied) {
      interaction.reply({ content: "❌ حصل خطأ. راجع اللوج.", ephemeral: true }).catch(() => {});
    }
  }
});

// DM handler (Q/A)
client.on("messageCreate", async (msg) => {
  try {
    if (msg.author.bot) return;
    if (msg.guild) return; // only DM
    const session = sessions.get(msg.author.id);
    if (!session) return;

    const guild = await client.guilds.fetch(session.guildId).catch(() => null);
    if (!guild) {
      endSession(msg.author.id);
      return;
    }

    const questions = session.type === "rp" ? RP_QUESTIONS : CREATOR_QUESTIONS;
    const current = questions[session.step];
    if (!current) {
      endSession(msg.author.id);
      return;
    }

    // save answer
    session.answers[current.key] = safeTrim(msg.content, 2000);
    session.step += 1;
    sessions.set(msg.author.id, session);

    // next
    if (session.step < questions.length) {
      await msg.author.send(questions[session.step].q);
      return;
    }

    // done -> submit
    await msg.author.send("✅ تم استلام التقديم. سيتم مراجعته من الإدارة قريباً.");

    if (session.type === "rp") {
      await submitRpToReview(guild, msg.author.id, session.answers);
    } else {
      await submitCreatorToReview(guild, msg.author.id, session.answers);
    }

    endSession(msg.author.id);
  } catch (e) {
    console.log("dm flow error:", e?.message || e);
  }
});

// ===================== START =====================
if (!TOKEN) {
  console.log("❌ Missing TOKEN env var. Put TOKEN in Railway variables.");
} else {
  client.login(TOKEN).catch((e) => console.log("Login error:", e?.message || e));
}
