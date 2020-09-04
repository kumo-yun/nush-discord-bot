const solver = require('./solver24.js');
const Discord = require('discord.js');
const stats = require("stats-lite");
const db = require("../db");
const GAMES = [];
const round = (n, p) => parseFloat(String(n)).toFixed(p);
exports.handleCommand = function (args, msg, PREFIX) {
    if (args.length === 0) {
        let game = GAMES[msg.author.id] = {
            digits: [0, 1, 2, 3].map(() => Math.floor(Math.random() * 9) + 1),
            start: Date.now()
        };
        msg.reply('Your numbers are `' + game.digits.map(i => String(i)).join(" ") + '`');
    } else if (["hard", "difficult", "full"].includes(args[0])) {
        let game = GAMES[msg.author.id] = {
            digits: [0, 1, 2, 3].map(() => Math.floor(Math.random() * 13) + 1),
            start: Date.now()
        };
        msg.reply('Your harder numbers are `' + game.digits.map(i => String(i)).join(" ") + '`');
    } else if (['impos', 'imposs', 'impossible'].includes(args[0])) {
        if (!GAMES[msg.author.id]) return msg.reply("You are not playing");
        let solution = solver.solve24Array(GAMES[msg.author.id].digits);
        if (!solution) msg.reply('It is **impossible**!');
        else msg.reply('Sorry but one **possible** solution is `' + solution + '`');
        delete GAMES[msg.author.id];
    } else if (['profile'].includes(args[0])) {
        db.User.findOne({id: msg.author.id}).then(user => {
            if (!user) return msg.reply("You do not have a profile!");
            if (user.game24_history.length === 0) return msg.reply("You have not played any 24 games!");
            let embed = new Discord.RichEmbed();
            embed.setColor(0x00FFFF);
            embed.setTitle("24 Game Profile");
            embed.addField("Min", `${round(Math.min.apply(null, user.game24_history) / 1000, 2)}s`, true);
            embed.addField("Max", `${round(Math.max.apply(null, user.game24_history) / 1000, 2)}s`, true);
            embed.addField("Total", `${round(stats.sum(user.game24_history) / 1000, 2)}s`, true);
            embed.addField("Average", `${round(stats.mean(user.game24_history) / 1000, 2)}s`, true);
            embed.addField("Median", `${round(stats.median(user.game24_history) / 1000, 2)}s`, true);
            embed.addField("Mode", `${round(stats.mode(user.game24_history) / 1000, 2)}s`, true);
            embed.addField("σ (STDEV)", `${round(stats.stdev(user.game24_history) / 1000, 2)}s`, true);
            embed.setFooter("Profile of " + msg.author.tag, msg.author.avatarURL);
            return msg.channel.send(embed);
        });
    } else if (['leaderboard', 'lb'].includes(args[0])) {
        db.User.find({appeared_in: msg.guild.id}).limit(12).sort('game24_average').exec((err, users) => {
            let embed = new Discord.RichEmbed();
            embed.setTitle("24 Game Leaderboard");
            embed.setColor(0x00FFFF);
            embed.setDescription(users.map((user, i) => `\`#${i + 1}\` <@${user.id}>: **${round(user.game24_average / 1000, 2)}s**`).join("\n"));
            return msg.channel.send(embed);
        });
    }
}
const ANSWER_REGEX = /^[()+\-*/\s]*\d+[()+\-*/\s]+\d+[()+\-*/\s]+\d+[()+\-*/\s]+\d+[()+\-*/\s]*$/;
exports.directControl = async function (msg) {
    let game = GAMES[msg.author.id];
    if (!game) return false;
    if (!ANSWER_REGEX.test(msg.content)) return;
    if (eval(msg.content) === 24 && arraysEqual(
        msg.content.replace(/[^\d]/g, '').split('').map(c => parseInt(c)).sort(),
        game.digits.join('').split('').map(c => parseInt(c)).sort()
    )) {
        let millis = Date.now() - game.start;
        msg.reply('You are **correct**! Time used = `' + (Math.floor(millis / 10) / 100) + 's`');
        db.User.findOrCreate({id: msg.author.id}, function (err, user) {
            if (!user.game24_history) user.game24_history = [];
            if (!user.appeared_in.includes(msg.guild.id)) user.appeared_in.push(msg.guild.id);
            user.game24_history.push(millis);
            user.game24_average = stats.mean(user.game24_history);
            user.save();
        });
        delete GAMES[msg.author.id];
    } else {
        let solution = solver.solve24Array(game.digits);
        if (solution) msg.reply('Sorry but you are **wrong**! One possible answer would be `' + solution + '`');
        else msg.reply('Sorry but it is actually **impossible**!');
        delete GAMES[msg.author.id];
    }
    return true;
}

function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; ++i) if (a[i] !== b[i]) return false;
    return true;
}