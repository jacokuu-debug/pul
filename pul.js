const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

// ===== CONFIG =====
const BOT_TOKEN = "8466964240:AAFnraSAV1Dif2rzj76E6-OWum2bhgNFJFk"; // Bot token
const ADMIN_IDS = [8309765828];  // Admin ID

// ===== BOT =====
const bot = new Telegraf(BOT_TOKEN);

// ===== DATA =====
let db = { users: {}, pendingPayments: {} };
const DATA_FILE = './bot_db.json';
if (fs.existsSync(DATA_FILE)) {
  try { db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch(e) { console.error("DB parse error:", e); }
}
function saveDB() { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); }

// ===== MENYU =====
const mainMenu = Markup.keyboard([
  ['💰 Robux sotib olish'],
  ['💳 Balansni ko‘rish'],
  ['🔗 Mening linkim'],
  ['💸 Robux yechib olish'],
  ['📞 Adminga murojaat']
]).resize();

// Robux paketlari
const robuxPackages = [
  { amount: 40, price: 6000 },
  { amount: 80, price: 12000 },
  { amount: 120, price: 19000 },
  { amount: 160, price: 25000 },
  { amount: 200, price: 32000 },
  { amount: 240, price: 38000 },
  { amount: 280, price: 45000 },
  { amount: 320, price: 50000 },
  { amount: 360, price: 58000 },
  { amount: 400, price: 61000 },
  { amount: 500, price: 65000 },
  { amount: 540, price: 72000 },
  { amount: 580, price: 79000 },
  { amount: 620, price: 86000 },
  { amount: 660, price: 100000 },
  { amount: 700, price: 106000 },
  { amount: 740, price: 121000 },
  { amount: 780, price: 128000 },
  { amount: 820, price: 130000 },
  { amount: 2200, price: 265000 },
  { amount: 5250, price: 660000 },
  { amount: 11000, price: 1310000 },
  { amount: 26400, price: 2620000 },
];

// ===== HELPERS =====
function ensureUser(userId, username) {
  if (!db.users[userId]) {
    db.users[userId] = {
      username: username || 'Foydalanuvchi',
      balance: 0,
      ref: null
    };
    saveDB();
  }
}

// ===== START =====
bot.start((ctx) => {
  const userId = ctx.from.id;
  ensureUser(userId, ctx.from.username);

  // Referral
  if (ctx.startPayload) {
    const refId = parseInt(ctx.startPayload);
    if (refId && refId !== userId && db.users[refId] && !db.users[userId].ref) {
      db.users[userId].ref = refId;
      const bonus = 4; // referral bonus 4 ROBUX
      db.users[refId].balance += bonus;
      saveDB();

      ADMIN_IDS.forEach(admin => {
        ctx.telegram.sendMessage(admin, `📣 Referral\n@${db.users[refId].username} sizning link orqali yangi foydalanuvchi qo‘shildi. ${bonus} ROBUX qo‘shildi.`);
      });
    }
  }

  ctx.reply('Assalomu aleykum! Kerakli xizmatni tanlang:', mainMenu);
});

// ===== ROBUX SOTISH =====
bot.hears('💰 Robux sotib olish', (ctx) => {
  const buttons = robuxPackages.map(p => [`💵 ${p.amount} ROBUX - ${p.price}`]);
  buttons.push(['⬅️ Orqaga']);
  ctx.reply('Quyidagi paketlardan birini tanlang:', Markup.keyboard(buttons).resize());
});

bot.hears(/💵 (\d+) ROBUX - (\d+)/, (ctx) => {
  const userId = ctx.from.id;
  ensureUser(userId, ctx.from.username);

  const match = ctx.message.text.match(/💵 (\d+) ROBUX - (\d+)/);
  if (!match) return;

  const robux = parseInt(match[1]);
  const price = parseInt(match[2]);

  // Pending payment
  db.pendingPayments[userId] = { robux, price };
  saveDB();

  ctx.reply(`✅ Siz ${robux} ROBUX sotib olishni tanladingiz.\n💵 Narxi: ${price} so'm\n\nIltimos, to‘lov chekini yoki rasmni yuboring.`);
});

// ===== QAYTARIB OLISH RASM =====
bot.on('photo', (ctx) => {
  const userId = ctx.from.id;
  ensureUser(userId, ctx.from.username);

  if (!db.pendingPayments[userId]) return;

  const { robux, price } = db.pendingPayments[userId];

  // Adminlarga yuborish
  ADMIN_IDS.forEach(admin => {
    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    ctx.telegram.sendPhoto(admin, fileId, {
      caption: `💰 Robux sotish\n@${ctx.from.username} ${robux} ROBUX sotib olmoqchi.\n💵 Narxi: ${price} so'm`
    });
  });

  ctx.reply("📩 Sizning to‘lov chek rasm yuborildi. Tez orada adminlar tekshiradi.");

  delete db.pendingPayments[userId];
  saveDB();
});

// ===== BALANSNI KO'RISH =====
bot.hears('💳 Balansni ko‘rish', (ctx) => {
  const userId = ctx.from.id;
  ensureUser(userId, ctx.from.username);
  ctx.reply(`💰 Sizning balansingiz: ${db.users[userId].balance || 0} ROBUX`);
});

// ===== ROBUX YECHIB OLISH =====
bot.hears('💸 Robux yechib olish', (ctx) => {
  const userId = ctx.from.id;
  ensureUser(userId, ctx.from.username);

  const balance = db.users[userId].balance || 0;
  if (balance < 40) {
    ctx.reply("⚠️ Balansingizda yetarli Robux yo'q. Minimal 40 ROBUX bo'lishi kerak.");
    return;
  }

  db.users[userId].balance = 0;
  saveDB();

  ctx.reply(`✅ Siz ${balance} ROBUX yechib oldingiz.\n💳 Yangi balans: 0 ROBUX`);

  ADMIN_IDS.forEach(admin => {
    ctx.telegram.sendMessage(admin, `💰 Yechar olish\n@${ctx.from.username} ${balance} ROBUX yechib oldi.`);
  });
});

// ===== REFERRAL LINK =====
bot.hears('🔗 Mening linkim', (ctx) => {
  const userId = ctx.from.id;
  ensureUser(userId, ctx.from.username);
  ctx.reply(`Sizning referral linkingiz:\nhttps://t.me/gojoshop_bot?start=${userId}`);
});

// ===== ADMIN MUROJAT =====
bot.hears('📞 Adminga murojaat', (ctx) => {
  ctx.reply('🪪 Savolingiz yoki murojaatingizni yozing, adminga yetkaziladi.');
  bot.on('text', (ctx2) => {
    if (!ADMIN_IDS.includes(ctx2.from.id)) {
      ADMIN_IDS.forEach(admin => {
        ctx2.telegram.sendMessage(admin, `📩 Foydalanuvchi @${ctx2.from.username} dan xabar: ${ctx2.message.text}`);
      });
    }
  });
});

// ===== ORQAGA =====
bot.hears('⬅️ Orqaga', (ctx) => ctx.reply('Asosiy menyu:', mainMenu));

// ===== LAUNCH =====
bot.launch().then(() => console.log('✅ Bot ishga tushdi'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
