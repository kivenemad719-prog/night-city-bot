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
  MessageFlags
} = require("discord.js");

/* ================= CONFIG ================= */

const TOKEN = process.env.TOKEN;

/* ================= CHANNEL IDS ================= */

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

const RP_APPOINTMENTS_CHANNEL_ID = "1465755601937367130";

/* ================= RULE LINKS ================= */

const DISCORD_RULES_LINK =
"https://docs.google.com/document/d/1OVjgthyRPQ63sD49ezOjQ8pf-Q8soL5BJdZFFX-UmnM/edit?usp=sharing";

const SERVER_RULES_LINK =
"https://docs.google.com/document/d/1uCZBWJd5j4JGyacLFM-823YsTAnhSq88R_OfSaZ1Uv8/edit?usp=sharing";

/* ================= TICKET CATEGORIES ================= */

const SUPPORT_CATEGORY_ID = "1473850568811221194";
const APPEAL_CATEGORY_ID = "1477765907496308897";
const REPORT_CATEGORY_ID = "1473843823607021579";
const SUGGEST_CATEGORY_ID = "1477766632817426675";

/* ================= ADMIN ROLES ================= */

const ADMIN_ROLE_IDS = [
  "1465798793772666941",
  "1465800480474005569",
  "1467593770898948158"
];

/* ================= ACCEPT ROLES ================= */

const CREATOR_ROLE_ID = "1477845260095979552";
const ADMIN_ACCEPT_ROLE_ID = "1467593770898948158";
const RP_PASS_ROLE_ID = "1477569088988512266";
const RP_REJECT1_ROLE_ID = "1477568923208519681";
const RP_REJECT2_ROLE_ID = "1477569051185119332";

/* ================= PANEL MARKERS ================= */

const PANEL_MARKER_RP = "PANEL_RP_APPLY_v9";
const PANEL_MARKER_SERVICES = "PANEL_SERVICES_v9";
const PANEL_MARKER_CONTROL = "PANEL_CONTROL_v9";
const RULES_PANEL_MARKER = "RULES_PANEL_v9";

/* ================= QUESTIONS ================= */

const RP_QUESTIONS = [
  { key:"fullName", q:"📌 ما الاسم الكامل للشخصية؟" },
  { key:"age", q:"🎂 كم عمر الشخصية؟" },
  { key:"country", q:"🌍 من أي دولة / مدينة؟" },
  { key:"playHours", q:"⏱️ كم ساعة تتواجد يوميًا؟" },
  { key:"experience", q:"🎮 هل لديك خبرة RP؟ اشرح باختصار." },
  { key:"rpMeaning", q:"📖 ما معنى RP بالنسبة لك؟" },
  { key:"powerGaming", q:"🚫 ما معنى PowerGaming؟ مع مثال." },
  { key:"metaGaming", q:"🚫 ما معنى MetaGaming؟ مع مثال." },
  { key:"fearRP", q:"😨 ما معنى FearRP؟ مع مثال." },
  { key:"rules", q:"📚 هل قرأت القوانين؟ اكتب نعم + أهم 5 نقاط فهمتها." },
  { key:"reportAction", q:"🚨 إذا رأيت لاعبًا يكسر القوانين، ماذا تفعل؟" },
  { key:"story", q:"📝 اكتب قصة للشخصية 150 كلمة على الأقل." },
  { key:"mic", q:"🎙️ هل لديك مايك جيد؟" },
  { key:"respectAdmin", q:"👮 هل تلتزم بقرارات الإدارة؟" },
  { key:"whyServer", q:"⭐ لماذا تريد الانضمام إلى هذا السيرفر؟" }
];

/* ================= CLIENT ================= */

const client = new Client({
  intents:[
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials:[Partials.Channel]
});

/* ================= STATE ================= */

const sessions = new Map();
const ticketMeta = new Map();

/* ================= HELPERS ================= */

function isAdmin(member){

if(!member) return false;

if(member.permissions?.has(PermissionsBitField.Flags.Administrator))
return true;

return ADMIN_ROLE_IDS.some(id => member.roles.cache.has(id));

}

function replyEphemeral(interaction,msg){

return interaction.reply({
content:msg,
flags:MessageFlags.Ephemeral
});

}

async function createTicket(interaction,type){

const guild = interaction.guild;

const categoryMap = {
support:SUPPORT_CATEGORY_ID,
appeal:APPEAL_CATEGORY_ID,
report:REPORT_CATEGORY_ID,
suggest:SUGGEST_CATEGORY_ID
};

const category = categoryMap[type];

const channel = await guild.channels.create({

name:`${type}-${interaction.user.username}`,
type:ChannelType.GuildText,
parent:category,

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

});

const row = new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("ticket_close")
.setLabel("🔒 إغلاق التذكرة")
.setStyle(ButtonStyle.Danger)

);

await channel.send({

content:`<@${interaction.user.id}>`,
components:[row]

});

interaction.reply({
content:`✅ تم فتح التذكرة ${channel}`,
flags:MessageFlags.Ephemeral
});

}

client.on("interactionCreate",async interaction=>{

if(!interaction.isButton()) return;

const id = interaction.customId;

/* ===== RP APPLY ===== */

if(id === "start_rp_apply"){

const user = interaction.user;

try{

const dm = await user.createDM();

sessions.set(user.id,{
step:0,
answers:[],
questions:RP_QUESTIONS
});

await dm.send("📝 بدأ التقديم على السيرفر");

await dm.send(RP_QUESTIONS[0].q);

interaction.reply({
content:"📩 تم إرسال الأسئلة في الخاص",
flags:MessageFlags.Ephemeral
});

}catch{

interaction.reply({
content:"❌ افتح الخاص أولاً",
flags:MessageFlags.Ephemeral
});

}

}

if(id === "ticket_support")
return createTicket(interaction,"support");

if(id === "ticket_appeal")
return createTicket(interaction,"appeal");

if(id === "ticket_report")
return createTicket(interaction,"report");

if(id === "ticket_suggest")
return createTicket(interaction,"suggest");

});

client.on("messageCreate",async message=>{

if(message.author.bot) return;
if(message.guild) return;

const session = sessions.get(message.author.id);
if(!session) return;

session.answers.push(message.content);
session.step++;

if(session.step < session.questions.length){

message.channel.send(session.questions[session.step].q);

}else{

message.channel.send("✅ تم إرسال طلبك للإدارة");

  const review = await client.channels.fetch(RP_REVIEW_CHANNEL_ID);

const embed = new EmbedBuilder()

.setColor("#5865F2")
.setTitle("📋 طلب تقديم جديد")
.setDescription(
session.questions.map((q,i)=>
`**${q.q}**\n${session.answers[i]}`
).join("\n\n")
)

.setFooter({text:`User ID: ${message.author.id}`})
.setTimestamp();

await review.send({embeds:[embed]});

sessions.delete(message.author.id);

}

});

client.once("ready",()=>{

console.log(`✅ ${client.user.tag} online`);

});

if(!TOKEN){

console.log("❌ ضع TOKEN في Railway");

}else{

client.login(TOKEN);

}

