const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

// ===== CONFIG =====
const BOT_TOKEN = '8466964240:AAFnraSAV1Dif2rzj76E6-OWum2bhgNFJFk'; // o'z tokeningni shu yerga qo'y
const ADMIN_IDS = [6499472207, 8309765828];

// ===== BOT =====
const bot = new Telegraf(BOT_TOKEN);

// ===== DATABASE =====
const DB_FILE = './db.json';
let db = { users: {}, pendingPayments: {} };

if (fs.existsSync(DB_FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (!db.pendingPayments) db.pendingPayments = {};
  } catch (e) {
    console.log('DB error', e);
  }
}

const saveDB = () =>
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

const ensureUser = (id, username) => {
  if (!db.users[id]) {
    db.users[id] = { username: username || 'user', balance: 0, ref: null };
    saveDB();
  }
};

// ===== MENULAR =====
const mainMenu = Markup.keyboard([
  ['💰 Robux sotib olish'],
  ['🎁 Balans', '👥 Referral link'],
  ['📤 Yechib olish'],
  ['📞 Admin']
]).resize();

const backMenu = Markup.keyboard([['⬅️ Orqaga']]).resize();

// ===== ROBUX PAKETLARI =====
const robuxPackages = [
  [40, 7000],[80,14000],[120,21000],[160,28000],[200,35000],
  [240,42000],[280,49000],[320,56000],[360,60000],
  [500,65000],[540,72000],[580,79000],[620,86000],
  [660,100000],[700,106000],[740,121000],[780,128000],
  [820,130000],[2200,265000],[5250,660000],[11000,1310000],[26400,2620000]
];

// ===== START =====
bot.start(ctx => {
  const id = ctx.from.id;
  ensureUser(id, ctx.from.username);

  // Referral ishlashi
  if (ctx.startPayload) {
    const ref = Number(ctx.startPayload);
    if (ref && ref !== id && db.users[ref] && !db.users[id].ref) {
      db.users[id].ref = ref;
      db.users[ref].balance += 4; // referral bonus 4 Robux
      saveDB();
      ctx.telegram.sendMessage(ref, '🎁 Sizga 4 Robux referral bonus!');
    }
  }

  ctx.reply('🏪 Robux shopga xush kelibsiz', mainMenu);
});

// ===== ORQAGA =====
bot.hears('⬅️ Orqaga', ctx => {
  ctx.reply('Asosiy menyu', mainMenu);
});

// ===== ROBUX SOTIB OLISH =====
bot.hears('💰 Robux sotib olish', ctx => {
  const btns = robuxPackages.map(p => [`💵 ${p[0]} ROBUX - ${p[1]}`]);
  btns.push(['⬅️ Orqaga']);
  ctx.reply('Paketni tanlang:', Markup.keyboard(btns).resize());
});

// ===== PAKET TANLANDI =====
bot.hears(/💵 (\d+) ROBUX - (\d+)/, ctx => {
  const id = ctx.from.id;
  ensureUser(id, ctx.from.username);

  const [, robux, price] = ctx.message.text.match(/💵 (\d+) ROBUX - (\d+)/);

  db.pendingPayments[id] = { robux: Number(robux), price: Number(price) };
  saveDB();

  ctx.reply(
    `💳 TO‘LOV QILING

🎁 ${robux} ROBUX
💵 ${price} so'm

💳 KARTA:
5614 6818 7469 8719
Xashimov X

📸 Chek rasmini yuboring`,
    backMenu
  );
});

// ===== CHEK RASM =====
bot.on('photo', ctx => {
  const id = ctx.from.id;
  if (!db.pendingPayments[id]) return;

  ADMIN_IDS.forEach(a => {
    ctx.telegram.sendPhoto(
      a,
      ctx.message.photo.at(-1).file_id,
      {
        caption:
          `💰 YANGI BUYURTMA\n👤 @${ctx.from.username}\n🎁 ${db.pendingPayments[id].robux} ROBUX\n💵 ${db.pendingPayments[id].price}`
      }
    );
  });

  delete db.pendingPayments[id];
  saveDB();
  ctx.reply('✅ Chek yuborildi', mainMenu);
});

// ===== BALANS =====
bot.hears('🎁 Balans', ctx => {
  ensureUser(ctx.from.id, ctx.from.username);
  ctx.reply(`💎 Balans: ${db.users[ctx.from.id].balance} Robux`);
});

// ===== YECHIB OLISH =====
bot.hears('📤 Yechib olish', ctx => {
  const user = db.users[ctx.from.id];
  if (user.balance < 40) return ctx.reply('❌ Kamida 40 Robux kerak');

  ADMIN_IDS.forEach(a =>
    ctx.telegram.sendMessage(a, `📤 YECHIB OLISH\n@${user.username}\n${user.balance} Robux`)
  );

  user.balance = 0;
  saveDB();
  ctx.reply('✅ So‘rov yuborildi');
});

// ===== REFERRAL =====
bot.hears('👥 Referral link', ctx => {
  const id = ctx.from.id;
  const link = `https://t.me/${ctx.botInfo.username}?start=${id}`;

  let count = 0;
  for (let u in db.users) if (db.users[u].ref === id) count++;

  ctx.reply(
    `👥 Referral linkingiz:\n${link}\n\n👤 Takliflar: ${count}\n🎁 Bonus: ${count * 4} Robux`
  );
});

// ===== ADMIN =====
bot.hears('📞 Admin', ctx => {
  ctx.reply('✍️ Xabaringizni yozing');
});

bot.on('text', ctx => {
  if (ctx.message.text.startsWith('/')) return;
  ADMIN_IDS.forEach(a =>
    ctx.telegram.sendMessage(a, `📩 @${ctx.from.username}: ${ctx.message.text}`)
  );
});

// ===== LAUNCH =====
bot.launch();
console.log('✅ Bot ishga tushdi');
