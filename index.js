require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: ["CHANNEL"]
});

/* ================== الإعدادات ================== */

const GUILD_ID = "1465609781837303873";

const RP_PANEL_CHANNEL_ID = "1465803291714785481";
const TICKETS_PANEL_CHANNEL_ID = "1465757986684403828";

const RP_CATEGORY_ID = "1477562083355656202";
const SUPPORT_CATEGORY_ID = "1473850568811221194";
const REPORT_CATEGORY_ID = "1473843823607021579";
const APPEAL_CATEGORY_ID = "1477765907496308897";

const RP_APPROVAL_CHANNEL_ID = "1477562619001831445";
const CREATOR_APPROVAL_CHANNEL_ID = "1477777545767420116";

const RP_PASS_ROLE_ID = "1477569088988512266";
const RP_REJECT1_ROLE_ID = "1477568923208519681";
const RP_REJECT2_ROLE_ID = "1477569051185119332";
const CREATOR_ROLE_ID = "1477845260095979552";

const STAFF_ROLE_IDS = [
  "1465798793772666941",
  "1465800480474005569",
  "1467593770898948158",
];

/* ================== وظائف مساعدة ================== */

function isStaff(member) {
  return STAFF_ROLE_IDS.some(id => member.roles.cache.has(id));
}

async function createTicket(interaction, categoryId, name) {
  const guild = interaction.guild;

  const channel = await guild.channels.create({
    name: `${name}-${interaction.user.username}`,
    type: ChannelType.GuildText,
    parent: categoryId,
    permissionOverwrites: [
      { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      {
        id: interaction.user.id,
        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
      },
      ...STAFF_ROLE_IDS.map(id => ({
        id,
        allow: [PermissionsBitField.Flags.ViewChannel],
      })),
    ],
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("🔒 إغلاق التيكت")
      .setStyle(ButtonStyle.Danger)
  );

const ticketEmbed = new EmbedBuilder()
.setColor(0x2b2d31)
.setTitle(" تذكرة دعم جديدة")
.setDescription(`
━━━━━━━━━━━━━━━━━━

👋 أهلاً ${interaction.user}

برجاء شرح مشكلتك بالتفصيل.
سيتم الرد عليك من قبل الإدارة قريبًا.

🔒 بالأسفل زر إغلاق التذكرة.

━━━━━━━━━━━━━━━━━━
`)
.setFooter({ text: "Night City RP • Support System" })
.setTimestamp();

await channel.send({
  embeds: [ticketEmbed],
  components: [row]
});

  return channel;
}

/* ================== البنلات ================== */

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  const guild = await client.guilds.fetch(GUILD_ID);

  const rpChannel = await guild.channels.fetch(RP_PANEL_CHANNEL_ID);

const messages = await rpChannel.messages.fetch({ limit: 10 });
const exists = messages.find(m => m.author.id === client.user.id);

if (!exists) {

await rpChannel.send({
embeds: [new EmbedBuilder()
.setTitle("📋 تقديم السيرفر")
.setDescription("اضغط للتقديم")
.setColor(0x2b2d31)],
components: [
new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId("open_rp")
.setLabel("📄 تقديم RP")
.setStyle(ButtonStyle.Success)
)
]
});


  const ticketChannel = await guild.channels.fetch(TICKETS_PANEL_CHANNEL_ID);
  const messages = await rpChannel.messages.fetch({ limit: 10 });
const exists = messages.find(m => m.author.id === client.user.id);

if (!exists) {          
                                              
  await ticketChannel.send({
    embeds: [new EmbedBuilder()
      .setTitle("🎫 نظام التيكتات")
      .setDescription("اختر الخدمة")
      .setColor(0x2b2d31)],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("open_creator").setLabel("🎥 صانع محتوى").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("open_support").setLabel("🛠 دعم").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("open_report").setLabel("⚠ شكوى").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("open_appeal").setLabel("🔓 استئناف").setStyle(ButtonStyle.Primary)
      )
    ]
  });
});

/* ================== DM سؤال سؤال ================== */

async function startDMQuestions(user, type) {

  const rpQuestions = [
    "الاسم الكامل للشخصية؟",
    "العمر؟",
    "المهنة؟",
    "الفرق بين Meta و Power Gaming؟",
    "اكتب قصة 150 كلمة على الأقل"
  ];

  const creatorQuestions = [
    "المنصة؟",
    "عدد المتابعين؟",
    "متوسط المشاهدات؟",
    "كم ساعة بث أسبوعيًا؟",
    "لماذا تريد تمثيل السيرفر؟"
  ];

  const questions = type === "rp" ? rpQuestions : creatorQuestions;
  const answers = [];
  const dm = await user.createDM();

  for (let i = 0; i < questions.length; i++) {

    await dm.send(`📌 ${questions[i]}`);

    const collected = await dm.awaitMessages({
      filter: m => m.author.id === user.id,
      max: 1,
      time: 600000
    });

    if (!collected.size) return dm.send("❌ انتهى الوقت.");

    const reply = collected.first().content;

    if (type === "rp" && i === questions.length - 1) {
      if (reply.trim().split(/\s+/).length < 150) {
        await dm.send("❌ القصة أقل من 150 كلمة.");
        return;
      }
    }

    answers.push(reply);
  }

  const guild = await client.guilds.fetch(GUILD_ID);
  const approvalChannel = await guild.channels.fetch(
    type === "rp" ? RP_APPROVAL_CHANNEL_ID : CREATOR_APPROVAL_CHANNEL_ID
  );

  const embed = new EmbedBuilder()
    .setTitle(type === "rp" ? "طلب RP جديد" : "طلب صانع محتوى جديد")
    .setDescription(answers.join("\n\n"))
    .setFooter({ text: user.id })
    .setColor(0x2b2d31);

  await approvalChannel.send({
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("approve").setLabel("✅ قبول").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("reject").setLabel("❌ رفض").setStyle(ButtonStyle.Danger)
      )
    ]
  });

  await dm.send("✅ تم إرسال طلبك للإدارة.");
}

/* ================== التفاعلات ================== */

client.on("interactionCreate", async interaction => {

  if (interaction.isButton()) {

    const member = await interaction.guild.members.fetch(interaction.user.id);

    if (interaction.customId === "open_rp") {
      if (member.roles.cache.has(RP_REJECT2_ROLE_ID))
        return interaction.reply({ content: "❌ تم رفضك نهائيًا.", ephemeral: true });

      await interaction.reply({ content: "📩 تم إرسال الأسئلة في الخاص.", ephemeral: true });
      return startDMQuestions(interaction.user, "rp");
    }

    if (interaction.customId === "open_creator") {
      await interaction.reply({ content: "📩 تم إرسال الأسئلة في الخاص.", ephemeral: true });
      return startDMQuestions(interaction.user, "creator");
    }

    if (interaction.customId === "open_support")
      return interaction.reply({ content: "جاري فتح تيكت...", ephemeral: true })
        .then(() => createTicket(interaction, SUPPORT_CATEGORY_ID, "support"));

    if (interaction.customId === "open_report")
      return interaction.reply({ content: "جاري فتح تيكت...", ephemeral: true })
        .then(() => createTicket(interaction, REPORT_CATEGORY_ID, "report"));

    if (interaction.customId === "open_appeal")
      return interaction.reply({ content: "جاري فتح تيكت...", ephemeral: true })
        .then(() => createTicket(interaction, APPEAL_CATEGORY_ID, "appeal"));

    if (interaction.customId === "approve") {

      if (!isStaff(member))
        return interaction.reply({ content: "❌ ليس لديك صلاحية", ephemeral: true });

      const userId = interaction.message.embeds[0].footer.text;
      const target = await interaction.guild.members.fetch(userId);
      const isRP = interaction.channelId === RP_APPROVAL_CHANNEL_ID;

      if (isRP) {
        await target.roles.remove(RP_REJECT1_ROLE_ID).catch(()=>{});
        await target.roles.add(RP_PASS_ROLE_ID);
      } else {
        await target.roles.add(CREATOR_ROLE_ID);
      }

      try {
        const approveEmbed = new EmbedBuilder()
.setColor(0x00ff88)
.setTitle("🎉 تم قبول طلبك!")
.setDescription(
`━━━━━━━━━━━━━━━━━━
✅ **تهانينا!**

تم قبولك مبدئيًا 👑

اضغط الزر بالأسفل للدخول إلى التقديم الصوتي 🎙
━━━━━━━━━━━━━━━━━━`
)
.setFooter({ text: "Night City RP • الإدارة" })
.setTimestamp();

const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setLabel("🎙 دخول التقديم الصوتي")
    .setStyle(ButtonStyle.Link)
    .setURL("https://discord.com/channels/1465609781837303873/1465752669564964935")
);

await target.send({
  embeds: [approveEmbed],
  components: [row]
});
      } catch {}

      return interaction.update({ content: "تم القبول ✅", embeds: [], components: [] });
    }

    if (interaction.customId === "reject") {

      if (!isStaff(member))
        return interaction.reply({ content: "❌ ليس لديك صلاحية", ephemeral: true });

      const modal = new ModalBuilder()
        .setCustomId(`reject_${interaction.message.embeds[0].footer.text}`)
        .setTitle("سبب الرفض");

      const input = new TextInputBuilder()
        .setCustomId("reason")
        .setLabel("اكتب سبب الرفض")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return interaction.showModal(modal);
    }

    if (interaction.customId === "close_ticket") {

      if (!isStaff(member))
        return interaction.reply({ content: "❌ ليس لديك صلاحية", ephemeral: true });

      const modal = new ModalBuilder()
        .setCustomId("close_reason")
        .setTitle("سبب إغلاق التيكت");

      const input = new TextInputBuilder()
        .setCustomId("reason")
        .setLabel("اكتب سبب الإغلاق")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return interaction.showModal(modal);
    }
  }
  if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith("reject_")) {

        const userId = interaction.customId.replace("reject_", "");
        const target = await interaction.guild.members.fetch(userId);

        const reason = interaction.fields.getTextInputValue("reason");

        if (!target.roles.cache.has(RP_REJECT1_ROLE_ID)) {
    await target.roles.add(RP_REJECT1_ROLE_ID);
} else {
    await target.roles.remove(RP_REJECT1_ROLE_ID).catch(() => {});
    await target.roles.add(RP_REJECT2_ROLE_ID);
}

        try {
            await target.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle("❌ تم رفض طلبك")
                        .setDescription(`**سبب الرفض:**\n${reason}`)
                        .setFooter({ text: "Night City RP • الإدارة" })
                        .setTimestamp()
                ]
            });
        } catch (err) {}

        await interaction.update({
            content: `❌ تم الرفض بواسطة ${interaction.user}`,
            embeds: [],
            components: []
        });
    }
}



    


const rejectEmbed = new EmbedBuilder()
.setColor(0xff0000)
.setTitle("🚫 تم رفض طلبك")
.setDescription(`
________________

**نعتذر لإزعاجك**

تم مراجعة طلبك من قبل الإدارة ولم يتم قبوله

⭐ **سبب الرفض:**

${reason}

يمكنك إعادة التقديم بعد تطوير مستواك 💪
`)
.setThumbnail("https://cdn.discordapp.com/attachments/1466112784587821189/1478302405102931998/ChatGPT_Image_Feb_24_2026_05_21_31_PM.png?ex=69a7e7e6&is=69a69666&hm=95ca57ac20282a192298032bfa9030aee634a79ff551428535b00bc3dbb344dd&") // حط لوجو سيرفرك هنا
.setFooter({ text: "Night City RP • نظام التقديم" })
.setTimestamp();


      return interaction.reply({ content: "تم الرفض وإرسال السبب.", ephemeral: true });
    }

    if (interaction.customId === "close_reason") {

      const ticketOwner = interaction.channel.permissionOverwrites.cache
        .filter(p => p.type === 1 && p.allow.has(PermissionsBitField.Flags.ViewChannel))
        .first();

      try {
        const user = await client.users.fetch(ticketOwner.id);
        await user.send(`🔒 تم إغلاق التيكت.\n\n📌 السبب:\n${reason}`);
      } catch {}

      await interaction.reply({ content: "جاري إغلاق التيكت...", ephemeral: true });

      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 3000);
    }
});


client.login(process.env.TOKEN);









