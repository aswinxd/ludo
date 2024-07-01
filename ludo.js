const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const bot = new TelegramBot(config.telegramBotToken, { polling: true });

const app = express();
app.use(bodyParser.json());
app.set('port', process.env.PORT || 3000);

// Set up handlebars view engine
const handlebars = require('express-handlebars').create({ defaultLayout: 'main' });
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use(express.static(__dirname + '/public'));

let rooms = {};

// Telegram bot commands
bot.onText(/\/create/, (msg) => {
    const chatId = msg.chat.id;
    const roomId = `room-${Date.now()}`;
    rooms[roomId] = { players: [], spectators: [] };
    const webAppUrl = `http://your-server-ip:3000/game/${roomId}`;
    bot.sendMessage(chatId, `Room created! Room ID: ${roomId}\nJoin the game: ${webAppUrl}`);
});

bot.onText(/\/join (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const roomId = match[1];
    if (rooms[roomId]) {
        if (rooms[roomId].players.length < 4) {
            rooms[roomId].players.push(chatId);
            bot.sendMessage(chatId, `You joined room ${roomId} as a player!`);
        } else {
            rooms[roomId].spectators.push(chatId);
            bot.sendMessage(chatId, `You joined room ${roomId} as a spectator!`);
        }
    } else {
        bot.sendMessage(chatId, `Room ${roomId} does not exist.`);
    }
});

app.get('/', (req, res) => {
    res.render('login');
});

app.get('/home', (req, res) => {
    res.render('home', { user: 'User' });
});

app.get('/game/:roomId', (req, res) => {
    const roomId = req.params.roomId;
    if (rooms[roomId]) {
        res.render('game', { roomId: roomId });
    } else {
        res.status(404).render('404');
    }
});

// 404 catch-all handler (middleware)
app.use((req, res, next) => {
    res.status(404);
    res.render('404');
});

// 500 error handler (middleware)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500);
    res.render('500');
});

app.listen(app.get('port'), () => {
    console.log(`Express started on http://localhost:${app.get('port')}; press Ctrl-C to terminate.`);
});
