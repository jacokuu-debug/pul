const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

// ===== CONFIG =====
const BOT_TOKEN = '8466964240:AAFnraSAV1Dif2rzj76E6-OWum2bhgNFJFk';
const ADMIN_IDS = [8309765828];

// ===== BOT =====
const bot = new Telegraf(BOT_TOKEN);

// ===== DATABASE =====
const DB_FILE = './db.json';
let db = {
  users: {},
  pendingPayments: {}
};

if (fs.existsSync(DB_FILE)) {
  db = JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function ensureUser(id, username) {
  if (!db.users[id]) {
    db.users[id] = {
      username: username || 'user',
      balance: 0,
      ref: null
    };
    saveDB();
  }
}

// ===== MENUS =====
const mainMenu = Markup.keyboard([
  ['💰 Robux sotib olish'],
  ['🎁 Balans', '👥 Referral link'],
  ['📤 Yechib olish'],
  ['📞 Admin']
]).resize();

// ===== ROBUX PAKETLAR =====
const packages = [
  { r: 40, p: 6000 },
  { r: 80, p: 12000 },
  { r: 120, p: 19000 },
  { r: 160, p: 25000 }
];

// ===== START =====
bot.start(ctx => {
  const id = ctx.from.id;
  ensureUser(id, ctx.from.username);

  if (ctx.startPayload) {
    const refId = parseInt(ctx.startPayload);
    if (
      refId &&
      refId !== id &&
      db.users[refId] &&
      !db.users[id].ref
    ) {
      db.users[id].ref = refId;
      db.users[refId].balance += 4;
      saveDB();

      ctx.telegram.sendMessage(
        refId,
        '🎉 Sizga 4 Robux referral bonus berildi!'
      );
    }
  }

  ctx.reply('Xush kelibsiz!', mainMenu);
});

// ===== ROBUX SOTIB OLISH =====
bot.hears('💰 Robux sotib olish', ctx => {
  const btns = packages.map(p => [`💵 ${p.r} ROBUX - ${p.p}`]);
  btns.push(['⬅️ Orqaga']);
  ctx.reply('Paketni tanlang:', Markup.keyboard(btns).resize());
});

bot.hears(/💵 (\d+) ROBUX - (\d+)/, ctx => {
  const id = ctx.from.id;
  ensureUser(id, ctx.from.username);

  const [, robux, price] = ctx.message.text.match(/(\d+)/g);

  db.pendingPayments[id] = {
    robux,
    price,
    step: 'photo'
  };
  saveDB();

  ctx.reply(
`💳 TO‘LOV QILING:

💰 ${robux} ROBUX
💵 ${price} so‘m

💳 KARTA:
5614 6818 7469 8719
Xashimov X

📸 To‘lov chekini rasm qilib yuboring`
  );
});

// ===== CHEK QABUL QILISH =====
bot.on('photo', ctx => {
  const id = ctx.from.id;
  if (!db.pendingPayments[id]) return;

  ADMIN_IDS.forEach(a => {
    ctx.telegram.sendPhoto(
      a,
      ctx.message.photo.at(-1).file_id,
      {
        caption:
`💰 YANGI TO‘LOV

👤 @${ctx.from.username}
🎁 ${db.pendingPayments[id].robux} ROBUX
💵 ${db.pendingPayments[id].price} so‘m`
      }
    );
  });

  delete db.pendingPayments[id];
  saveDB();

  ctx.reply('✅ Chek yuborildi. Admin tekshiradi.');
});

// ===== BALANS =====
bot.hears('🎁 Balans', ctx => {
  ensureUser(ctx.from.id, ctx.from.username);
  ctx.reply(`💎 Balansingiz: ${db.users[ctx.from.id].balance} Robux`);
});

// ===== YECHIB OLISH =====
bot.hears('📤 Yechib olish', ctx => {
  const user = db.users[ctx.from.id];
  if (user.balance < 40) {
    return ctx.reply('❌ Kamida 40 Robux bo‘lishi kerak');
  }

  ADMIN_IDS.forEach(a => {
    ctx.telegram.sendMessage(
      a,
      `📤 YECHIB OLISH\n@${ctx.from.username}\n💎 ${user.balance} Robux`
    );
  });

  user.balance = 0;
  saveDB();
  ctx.reply('✅ So‘rov yuborildi');
});

// ===== REFERRAL LINK =====
bot.hears('👥 Referral link', ctx => {
  const id = ctx.from.id;
  let count = 0;
  for (let u in db.users) {
    if (db.users[u].ref === id) count++;
  }

  ctx.reply(
`👥 REFERRAL LINKINGIZ

🔗 https://t.me/${ctx.botInfo.username}?start=${id}

👤 Taklif qilingan: ${count}
🎁 Bonus: ${count * 4} Robux`
  );
});

// ===== ADMIN =====
bot.hears('📞 Admin', ctx => {
  ctx.reply('✍️ Xabaringizni yozing');
});

bot.on('text', ctx => {
  if (ctx.message.text.startsWith('/')) return;
  ADMIN_IDS.forEach(a => {
    ctx.telegram.sendMessage(
      a,
      `📩 @${ctx.from.username}: ${ctx.message.text}`
    );
  });
});

// ===== LAUNCH =====
bot.launch();
console.log('✅ Bot ishga tushdi');
