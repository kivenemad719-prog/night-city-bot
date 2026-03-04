// index.js (Discord.js v14)
// IMPORTANT: Put TOKEN in Railway env variables. DO NOT hardcode token here.

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

// =====================
// CONFIG (Fill missing)
// =====================

// 🔥 Put your TOKEN in Railway Variables: TOKEN=xxxxx
const TOKEN = process.env.TOKEN;

// ===== Channels =====
const RP_REVIEW_CHANNEL_ID = "1477562619001831445"; // مراجعة RP
const CREATOR_REVIEW_CHANNEL_ID = "1477777545767420116"; // مراجعة صانع محتوى

// لازم تحطهم:
const RP_APPLY_PANEL_CHANNEL_ID = "1465803291714785481"; // بانل تقديم RP على السيرفر
const SERVICES_PANEL_CHANNEL_ID = "1465757986684403828"; // بانل خدمات (دعم/استئناف/بلاغ/اقتراح/تقديم صانع محتوى)

// (اختياري) قناة المقابلة الصوتية للزر في DM عند القبول:
const VOICE_INTERVIEW_CHANNEL_ID = "https://discord.com/channels/1465609781837303873/1465752669564964935";

// ===== Ticket Categories =====
const SUPPORT_CATEGORY_ID = "1473850568811221194";
const APPEAL_CATEGORY_ID = "1477765907496308897";
const REPORT_CATEGORY_ID = "1473850252149788867";
const SUGGEST_CATEGORY_ID = "1477766632817426675";

// ===== Roles =====
const STAFF_ROLE_IDS = [
  "1465798793772666941",
  "1465800480474005569",
  "1467593770898948158",
];

const CREATOR_ROLE_ID = "1477845260095979552";
const RP_PASS_ROLE_ID = "1477569088988512266";
const RP_REJECT1_ROLE_ID = "1477568923208519681";
const RP_REJECT2_ROLE_ID = "1477569051185119332";

// ===== Panel markers (to avoid duplicates) =====
const PANEL_MARKER_RP = "NC_RP_PANEL_v1";
const PANEL_MARKER_SERVICES = "NC_SERVICES_PANEL_v1";

// =====================
// Client
// =====================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User],
});

// =====================
// In-memory sessions
// =====================
/**
 * sessions Map:
 * userId => {
 *   type: "rp" | "creator",
 *   step: number,
 *   answers: object,
 *   guildId: string
 * }
 */
const sessions = new Map();

const RP_QUESTIONS = [
  { key: "fullName", q: "📌 الاسم الكامل للشخصية؟" },
  { key: "age", q: "📌 العمر؟" },
  { key: "rules", q: "📌 هل قرأت القوانين؟ (نعم/لا)" },
  { key: "experience", q: "📌 خبرتك في الـ RP؟ (اكتب مختصر)" },
  { key: "story", q: "📌 اكتب قصة 150 كلمة على الأقل." },
  { key: "mic", q: "📌 هل عندك مايك كويس؟ (نعم/لا)" },
  { key: "commit", q: "📌 هل تلتزم بقوانين السيرفر؟ (نعم/لا)" },
];

const CREATOR_QUESTIONS = [
  { key: "name", q: "🎥 اسمك الحقيقي أو اسمك المعروف؟" },
  { key: "age", q: "🎥 العمر؟" },
  { key: "channelLink", q: "🎥 رابط القناة/الحساب (YouTube/TikTok/Twitch...)؟" },
  { key: "followers", q: "🎥 عدد المتابعين/المشتركين؟" },
  { key: "contentType", q: "🎥 نوع المحتوى؟" },
  { key: "schedule", q: "🎥 كم مرة تنشر أسبوعيًا؟" },
  { key: "why", q: "🎥 لماذا تريد الانضمام كصانع محتوى؟" },
  { key: "agree", q: "🎥 هل تلتزم بقوانين السيرفر وعدم الإساءة؟ (نعم/لا)" },
];

// =====================
// Helpers
// =====================
function isStaffMember(member) {
  if (!member) return false;
  return STAFF_ROLE_IDS.some((rid) => member.roles.cache.has(rid));
}

function safeTrim(str, max = 1024) {
  if (!str) return "";
  const s = String(str);
  return s.length > max ? s.slice(0, max - 3) + "..." : s;
}

function voiceChannelLink(guildId) {
  if (!VOICE_INTERVIEW_CHANNEL_ID || VOICE_INTERVIEW_CHANNEL_ID.startsWith("PUT_")) return null;
  return `https://discord.com/channels/${guildId}/${VOICE_INTERVIEW_CHANNEL_ID}`;
}

async function findMarkerMessage(channel, marker) {
  // search last 50 messages for marker in embed footer
  const msgs = await channel.messages.fetch({ limit: 50 }).catch(() => null);
  if (!msgs) return null;

  return msgs.find((m) => {
    const emb = m.embeds?.[0];
    const footer = emb?.footer?.text || "";
    return footer.includes(marker);
  }) || null;
}

async function ensurePanels(guild) {
  // RP Apply Panel
  if (RP_APPLY_PANEL_CHANNEL_ID && !RP_APPLY_PANEL_CHANNEL_ID.startsWith("PUT_")) {
    const ch = await guild.channels.fetch(RP_APPLY_PANEL_CHANNEL_ID).catch(() => null);
    if (ch && ch.isTextBased()) {
      const exists = await findMarkerMessage(ch, PANEL_MARKER_RP);
      if (!exists) {
        const embed = new EmbedBuilder()
          .setColor(0x2b2d31)
          .setTitle("📜 تقديم RP")
          .setDescription("اضغط الزر لبدء التقديم في الخاص (DM).")
          .setFooter({ text: `Night City RP • ${PANEL_MARKER_RP}` });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("start_rp_apply")
            .setLabel("ابدأ تقديم RP")
            .setStyle(ButtonStyle.Success)
        );

        await ch.send({ embeds: [embed], components: [row] }).catch(() => {});
      }
    }
  }

  // Services Panel
  if (SERVICES_PANEL_CHANNEL_ID && !SERVICES_PANEL_CHANNEL_ID.startsWith("PUT_")) {
    const ch = await guild.channels.fetch(SERVICES_PANEL_CHANNEL_ID).catch(() => null);
    if (ch && ch.isTextBased()) {
      const exists = await findMarkerMessage(ch, PANEL_MARKER_SERVICES);
      if (!exists) {
        const embed = new EmbedBuilder()
          .setColor(0x2b2d31)
          .setTitle("🧩 خدمات السيرفر")
          .setDescription("اختر الخدمة المطلوبة من الأزرار بالأسفل.")
          .setFooter({ text: `Night City RP • ${PANEL_MARKER_SERVICES}` });

        const row1 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("ticket_support").setLabel("📩 دعم فني").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("ticket_appeal").setLabel("⚖️ استئناف").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("ticket_report").setLabel("🚨 بلاغ").setStyle(ButtonStyle.Danger)
        );

        const row2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("ticket_suggest").setLabel("💡 اقتراح").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("start_creator_apply").setLabel("🎥 تقديم صانع محتوى").setStyle(ButtonStyle.Primary)
        );

        await ch.send({ embeds: [embed], components: [row1, row2] }).catch(() => {});
      }
    }
  }
}

async function startDmFlow(user, guild, type) {
  // Create session
  const questions = type === "rp" ? RP_QUESTIONS : CREATOR_QUESTIONS;
  sessions.set(user.id, {
    type,
    step: 0,
    answers: {},
    guildId: guild.id,
  });

  // Send first question
  await user.send(
    type === "rp"
      ? "✅ بدأنا تقديم RP.\nاكتب الإجابة سؤال بسؤال."
      : "✅ بدأنا تقديم صانع محتوى.\nاكتب الإجابة سؤال بسؤال."
  );

  await user.send(questions[0].q);
}

async function submitRpToReview(guild, userId, answers) {
  const ch = await guild.channels.fetch(RP_REVIEW_CHANNEL_ID).catch(() => null);
  if (!ch || !ch.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("📨 طلب RP جديد")
    .addFields(
      { name: "👤 الاسم", value: safeTrim(answers.fullName, 256) || "—", inline: true },
      { name: "🎂 العمر", value: safeTrim(answers.age, 256) || "—", inline: true },
      { name: "📖 قرأت القوانين؟", value: safeTrim(answers.rules, 256) || "—", inline: true },
      { name: "🎮 خبرة RP", value: safeTrim(answers.experience, 1024) || "—" },
      { name: "📝 القصة (150 كلمة+)", value: safeTrim(answers.story, 1024) || "—" },
      { name: "🎤 مايك", value: safeTrim(answers.mic, 256) || "—", inline: true },
      { name: "✅ التزام", value: safeTrim(answers.commit, 256) || "—", inline: true }
    )
    .setFooter({ text: `user:${userId}` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`approve_rp_${userId}`).setLabel("✅ قبول").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`reject_rp_${userId}`).setLabel("❌ رفض").setStyle(ButtonStyle.Danger)
  );

  await ch.send({ embeds: [embed], components: [row] });
}

async function submitCreatorToReview(guild, userId, answers) {
  const ch = await guild.channels.fetch(CREATOR_REVIEW_CHANNEL_ID).catch(() => null);
  if (!ch || !ch.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setColor(0x00b37e)
    .setTitle("🎥 طلب صانع محتوى")
    .addFields(
      { name: "👤 الاسم", value: safeTrim(answers.name, 256) || "—", inline: true },
      { name: "🎂 العمر", value: safeTrim(answers.age, 256) || "—", inline: true },
      { name: "🔗 رابط القناة", value: safeTrim(answers.channelLink, 1024) || "—" },
      { name: "👥 المتابعين", value: safeTrim(answers.followers, 256) || "—", inline: true },
      { name: "🎮 نوع المحتوى", value: safeTrim(answers.contentType, 1024) || "—" },
      { name: "📅 جدول النشر", value: safeTrim(answers.schedule, 1024) || "—" },
      { name: "📝 السبب", value: safeTrim(answers.why, 1024) || "—" },
      { name: "✅ التزام", value: safeTrim(answers.agree, 256) || "—", inline: true }
    )
    .setFooter({ text: `user:${userId}` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`approve_creator_${userId}`).setLabel("✅ قبول").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`reject_creator_${userId}`).setLabel("❌ رفض").setStyle(ButtonStyle.Danger)
  );

  await ch.send({ embeds: [embed], components: [row] });
}

function disableRow(row) {
  const newRow = ActionRowBuilder.from(row);
  newRow.components = newRow.components.map((c) => ButtonBuilder.from(c).setDisabled(true));
  return newRow;
}

async function openRejectModal(interaction, type, userId) {
  const modal = new ModalBuilder()
    .setCustomId(`modal_reject_${type}_${userId}`)
    .setTitle("سبب الرفض");

  const reasonInput = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("اكتب سبب الرفض")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(400);

  modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
  await interaction.showModal(modal);
}

async function createTicketChannel(guild, opener, categoryId, prefix) {
  const parent = await guild.channels.fetch(categoryId).catch(() => null);
  if (!parent) return null;

  // Channel name
  const base = opener.user.username.toLowerCase().replace(/[^a-z0-9-_]/g, "").slice(0, 16) || "user";
  const name = `${prefix}-${base}`;

  // Permission overwrites
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionsBitField.Flags.ViewChannel],
    },
    {
      id: opener.user.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.AttachFiles,
        PermissionsBitField.Flags.EmbedLinks,
      ],
    },
    ...STAFF_ROLE_IDS.map((rid) => ({
      id: rid,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.ManageMessages,
      ],
    })),
  ];

  const ch = await guild.channels
    .create({
      name,
      type: ChannelType.GuildText,
      parent: parent.id,
      permissionOverwrites: overwrites,
    })
    .catch(() => null);

  return ch;
}

async function sendTicketIntro(ch, opener, kindLabel) {
  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle(`📩 تذكرة ${kindLabel}`)
    .setDescription(`أهلًا <@${opener.user.id}> 👋\nاكتب رسالتك هنا، وسيتم الرد عليك من الإدارة.`)
    .setFooter({ text: `Night City RP • ticket` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("🔒 إغلاق التذكرة")
      .setStyle(ButtonStyle.Danger)
  );

  await ch.send({ embeds: [embed], components: [row] });
}

// =====================
// Ready
// =====================
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Ensure panels in all guilds the bot is in
  for (const [, guild] of client.guilds.cache) {
    await ensurePanels(guild).catch(() => {});
  }
});

// =====================
// DM message handler (Q/A)
// =====================
client.on("messageCreate", async (msg) => {
  try {
    if (msg.author.bot) return;
    if (msg.guild) return; // only DM
    const session = sessions.get(msg.author.id);
    if (!session) return;

    const guild = await client.guilds.fetch(session.guildId).catch(() => null);
    if (!guild) {
      sessions.delete(msg.author.id);
      return;
    }

    const questions = session.type === "rp" ? RP_QUESTIONS : CREATOR_QUESTIONS;
    const current = questions[session.step];
    if (!current) return;

    // Save answer
    session.answers[current.key] = msg.content?.trim() || "";
    session.step += 1;

    // Next question or finish
    if (session.step < questions.length) {
      sessions.set(msg.author.id, session);
      await msg.author.send(questions[session.step].q);
      return;
    }

    // Finish
    sessions.delete(msg.author.id);

    if (session.type === "rp") {
      await msg.author.send("✅ تم استلام تقديم RP وتم إرساله للإدارة للمراجعة.");
      await submitRpToReview(guild, msg.author.id, session.answers);
    } else {
      await msg.author.send("✅ تم استلام تقديم صانع محتوى وتم إرساله للإدارة للمراجعة.");
      await submitCreatorToReview(guild, msg.author.id, session.answers);
    }
  } catch (e) {
    // ignore
  }
});

// =====================
// Interactions
// =====================
client.on("interactionCreate", async (interaction) => {
  try {
    // ===== Buttons =====
    if (interaction.isButton()) {
      const { customId } = interaction;

      // Start RP apply
      if (customId === "start_rp_apply") {
        const guild = interaction.guild;
        if (!guild) return interaction.reply({ content: "هذا الزر يعمل داخل السيرفر فقط.", ephemeral: true });

        // Try DM
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

      // Start Creator apply
      if (customId === "start_creator_apply") {
        const guild = interaction.guild;
        if (!guild) return interaction.reply({ content: "هذا الزر يعمل داخل السيرفر فقط.", ephemeral: true });

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
      if (customId === "ticket_support" || customId === "ticket_appeal" || customId === "ticket_report" || customId === "ticket_suggest") {
        const guild = interaction.guild;
        if (!guild) return;

        const member = await guild.members.fetch(interaction.user.id).catch(() => null);
        if (!member) return;

        let categoryId = SUPPORT_CATEGORY_ID;
        let prefix = "support";
        let label = "الدعم الفني";

        if (customId === "ticket_appeal") {
          categoryId = APPEAL_CATEGORY_ID;
          prefix = "appeal";
          label = "الاستئناف";
        } else if (customId === "ticket_report") {
          categoryId = REPORT_CATEGORY_ID;
          prefix = "report";
          label = "البلاغ";
        } else if (customId === "ticket_suggest") {
          categoryId = SUGGEST_CATEGORY_ID;
          prefix = "suggest";
          label = "الاقتراح";
        }

        const ch = await createTicketChannel(guild, interaction, categoryId, prefix);
        if (!ch) return interaction.reply({ content: "❌ لم أستطع إنشاء التذكرة. تأكد من الصلاحيات/الكاتجوري.", ephemeral: true });

        await sendTicketIntro(ch, interaction, label);
        return interaction.reply({ content: `✅ تم فتح تذكرتك: ${ch}`, ephemeral: true });
      }

      // Close ticket
      if (customId === "close_ticket") {
        // Only in a ticket channel (we'll allow staff + opener)
        const ch = interaction.channel;
        if (!ch || !interaction.guild) return;

        const modal = new ModalBuilder().setCustomId("modal_close_ticket").setTitle("إغلاق التذكرة");
        const reason = new TextInputBuilder()
          .setCustomId("reason")
          .setLabel("سبب الإغلاق")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(400);

        modal.addComponents(new ActionRowBuilder().addComponents(reason));
        return interaction.showModal(modal);
      }

      // Approve / Reject RP or Creator
      if (customId.startsWith("approve_rp_") || customId.startsWith("reject_rp_") || customId.startsWith("approve_creator_") || customId.startsWith("reject_creator_")) {
        if (!interaction.guild) return;
        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (!isStaffMember(member)) {
          return interaction.reply({ content: "❌ هذا للطاقم فقط.", ephemeral: true });
        }

        const parts = customId.split("_"); // approve|reject, rp|creator, userId
        const action = parts[0];
        const type = parts[1];
        const userId = parts[2];

        if (action === "reject") {
          return openRejectModal(interaction, type, userId);
        }

        // approve
        const target = await interaction.guild.members.fetch(userId).catch(() => null);
        if (!target) return interaction.reply({ content: "❌ لم أستطع إيجاد العضو.", ephemeral: true });

        if (type === "rp") {
          // Remove reject roles, add pass
          await target.roles.remove(RP_REJECT1_ROLE_ID).catch(() => {});
          await target.roles.remove(RP_REJECT2_ROLE_ID).catch(() => {});
          await target.roles.add(RP_PASS_ROLE_ID).catch(() => {});
        } else {
          await target.roles.add(CREATOR_ROLE_ID).catch(() => {});
        }

        // DM nice embed
        try {
          if (type === "rp") {
            const link = voiceChannelLink(interaction.guild.id);
            const embed = new EmbedBuilder()
              .setColor(0x00ff88)
              .setTitle("🎉 تم قبول طلبك!")
              .setDescription("✅ تهانينا!\nتم قبولك مبدئياً.\nاضغط الزر بالأسفل للدخول للمقابلة الصوتية.")
              .setFooter({ text: "Night City RP • الإدارة" })
              .setTimestamp();

            const rows = [];
            if (link) {
              rows.push(
                new ActionRowBuilder().addComponents(
                  new ButtonBuilder().setLabel("🎤 دخول المقابلة الصوتية").setStyle(ButtonStyle.Link).setURL(link)
                )
              );
            }
            await target.send({ embeds: [embed], components: rows }).catch(() => {});
          } else {
            const embed = new EmbedBuilder()
              .setColor(0x00ff88)
              .setTitle("🎥 تم قبولك كصانع محتوى!")
              .setDescription("✅ تهانينا!\nتم قبول طلبك كصانع محتوى.")
              .setFooter({ text: "Night City RP • الإدارة" })
              .setTimestamp();

            await target.send({ embeds: [embed] }).catch(() => {});
          }
        } catch {}

        // Update review message (disable buttons + mark accepted)
        const oldEmbed = interaction.message.embeds?.[0];
        const newEmbed = oldEmbed
          ? EmbedBuilder.from(oldEmbed).setColor(0x00ff88).setTitle("✅ تم القبول")
          : new EmbedBuilder().setColor(0x00ff88).setTitle("✅ تم القبول");

        const comps = interaction.message.components?.map(disableRow) || [];
        await interaction.update({ embeds: [newEmbed], components: comps }).catch(async () => {
          await interaction.reply({ content: "✅ تم القبول.", ephemeral: true }).catch(() => {});
        });
        return;
      }
    }

    // ===== Modals =====
    if (interaction.isModalSubmit()) {
      const { customId } = interaction;

      // Reject modal
      if (customId.startsWith("modal_reject_")) {
        if (!interaction.guild) return;
        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (!isStaffMember(member)) {
          return interaction.reply({ content: "❌ هذا للطاقم فقط.", ephemeral: true });
        }

        const [, , type, userId] = customId.split("_"); // modal reject type userId
        const reason = interaction.fields.getTextInputValue("reason");

        const target = await interaction.guild.members.fetch(userId).catch(() => null);
        if (!target) return interaction.reply({ content: "❌ لم أستطع إيجاد العضو.", ephemeral: true });

        if (type === "rp") {
          // Reject logic: first -> RP_REJECT1, second -> RP_REJECT2 (final)
          const hasR1 = target.roles.cache.has(RP_REJECT1_ROLE_ID);
          const hasR2 = target.roles.cache.has(RP_REJECT2_ROLE_ID);

          if (hasR2) {
            // already final
          } else if (!hasR1) {
            await target.roles.add(RP_REJECT1_ROLE_ID).catch(() => {});
          } else {
            await target.roles.remove(RP_REJECT1_ROLE_ID).catch(() => {});
            await target.roles.add(RP_REJECT2_ROLE_ID).catch(() => {});
          }

          // DM nice reject embed
          const finalNow = target.roles.cache.has(RP_REJECT2_ROLE_ID);
          const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle(finalNow ? "⛔ تم رفض طلبك نهائياً" : "❌ تم رفض طلبك")
            .setDescription(`⭐ **سبب الرفض:**\n${safeTrim(reason, 900)}\n\n${finalNow ? "هذا الرفض نهائي." : "يمكنك إعادة التقديم بعد تحسين مستواك."}`)
            .setFooter({ text: "Night City RP • الإدارة" })
            .setTimestamp();

          await target.send({ embeds: [embed] }).catch(() => {});
        } else {
          // creator reject
          const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("❌ تم رفض طلب صانع محتوى")
            .setDescription(`⭐ **سبب الرفض:**\n${safeTrim(reason, 900)}\n\nيمكنك إعادة التقديم لاحقاً.`)
            .setFooter({ text: "Night City RP • الإدارة" })
            .setTimestamp();

          await target.send({ embeds: [embed] }).catch(() => {});
        }

        // Update review message (disable buttons + mark rejected)
        const oldEmbed = interaction.message.embeds?.[0];
        const newEmbed = oldEmbed
          ? EmbedBuilder.from(oldEmbed).setColor(0xff0000).setTitle("❌ تم الرفض").setDescription(`سبب الرفض:\n${safeTrim(reason, 900)}`)
          : new EmbedBuilder().setColor(0xff0000).setTitle("❌ تم الرفض").setDescription(`سبب الرفض:\n${safeTrim(reason, 900)}`);

        const comps = interaction.message.components?.map(disableRow) || [];
        await interaction.update({ embeds: [newEmbed], components: comps }).catch(async () => {
          await interaction.reply({ content: "✅ تم الرفض.", ephemeral: true }).catch(() => {});
        });
        return;
      }

      // Close ticket modal
      if (customId === "modal_close_ticket") {
        const reason = interaction.fields.getTextInputValue("reason");
        const ch = interaction.channel;
        const guild = interaction.guild;
        if (!ch || !guild) return;

        // Find opener: first overwrite that is a user (not bot/staff). We'll just DM the user who has access besides staff.
        let openerId = null;
        for (const [id, ow] of ch.permissionOverwrites.cache) {
          if (id === guild.roles.everyone.id) continue;
          if (STAFF_ROLE_IDS.includes(id)) continue;
          // if it's a member id
          openerId = id;
          break;
        }

        if (openerId) {
          const user = await client.users.fetch(openerId).catch(() => null);
          if (user) {
            const embed = new EmbedBuilder()
              .setColor(0xffaa00)
              .setTitle("🔒 تم إغلاق التذكرة")
              .setDescription(`⭐ **السبب:**\n${safeTrim(reason, 900)}`)
              .setFooter({ text: "Night City RP • الدعم" })
              .setTimestamp();
            await user.send({ embeds: [embed] }).catch(() => {});
          }
        }

        await interaction.reply({ content: "✅ جاري إغلاق التذكرة...", ephemeral: true }).catch(() => {});
        setTimeout(() => {
          ch.delete().catch(() => {});
        }, 3000);
        return;
      }
    }
  } catch (e) {
    // ignore hard failures
  }
});

// =====================
// Login
// =====================
if (!TOKEN) {
  console.error("Missing TOKEN env var. Set TOKEN in Railway Variables.");
  process.exit(1);
}

client.login(TOKEN);
