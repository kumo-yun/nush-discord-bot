// Required dependencies
const Discord = require('discord.js');
const config = require('./config.js').config;
const coursemology = require('./coursemology.js');
const covid = require('./covid.js');
const azurlane = require('./azurlane.js');
const music = require('./music.js');
const waifulabs = require('./waifulabs.js');
const timetable = require('./timetable.js');

// Constants
const PREFIX = process.env.PREFIX || "!";
const client = new Discord.Client();

// Embed Presets
const PING_EMBED = new Discord.RichEmbed().setTitle("Ping Results").setColor(0x21f8ff).addField("Latency", 0).addField("Discord API Latency", 0);
const HELP_EMBED = new Discord.RichEmbed().setTitle("Help").setColor(0x21f8ff)
    .addField(`${PREFIX}ping`, "Get the bot's ping")
    .addField(`${PREFIX}azurlane`, `Find information on your ship waifu\nUsage: \`${PREFIX}azurlane (ship-name)\``)
    .addField(`${PREFIX}azurlane find`, `Query for a list of ships\nUsage: \`${PREFIX}azurlane find (field=value)/(field>value)+\`\nSeperated by ',' (comma)`)
    .addField(`${PREFIX}coursemology`, `Access Coursemology.\nUsage: \`${PREFIX}coursemology (info|list|user) [args]\``)
    .addField(`${PREFIX}timetable`, `Access time table\nUsage: \`${PREFIX}timetable [next|now]? [classname]?\``)
    .addField(`${PREFIX}sleep`, "Tell you whether or not you should sleep.")
chainUpStdOut();
console.log('====== ZY Discord Bot Started! ======');

// coursemology.initiate();
client.on('ready', () => {
    console.log("=> Bot Running in " + client.guilds.keyArray().length + " servers!");
    client.guilds.get('665471208757657620').channels.get('665471209277882400').send("READY!");
    client.user.setPresence(config.PRESENCE);
    config.offset = 8 + new Date().getTimezoneOffset() / 60;
    config.HOOK = new Discord.WebhookClient('644427303719403521', process.env.HKTOKEN);
    config.HOOK2 = new Discord.WebhookClient('676309488021798912', process.env.HKTOKEN2);
    config.id = client.user.id;
    coursemology.init();
    setInterval(() => coursemology.update(config.DEFAULT_COURSE), 20000);
    const covidChannel = client.guilds.get('642273802520231936').channels.get('693051246885470209');
    covid.update(covidChannel);
    setInterval(() => covid.update(covidChannel), 60 * 60 * 1000);
});

client.on('message', async msg => {
    let startTime = Date.now();
    console.log(`=> Message "${msg.content}" received from ${msg.author.tag}.`);
    if (!msg.channel.type === "text") return;
    if (!msg.guild && msg.author.id !== "456001047756800000") return;
    if (msg.author.id === config.id) return;
    let matcher = msg.content.replace(/[^\w ]+/g, '').trim().toLowerCase()
    if (msg.guild.id !== "642273802520231936") {
        if (config.SIMPLE_REPLIES[matcher])
            return msg.channel.send(config.SIMPLE_REPLIES[matcher]);
        for (let key of Object.keys(config.CONTAINS_REPLIES))
            if (msg.content.includes(key)) return msg.channel.send(config.CONTAINS_REPLIES[key]);
    }
    if (msg.content.indexOf(PREFIX) !== 0) return;
    console.log(`====== Message is a valid command.`);
    let args = msg.content.slice(1).trim().split(/\s+/g);
    const command = args.shift().toLowerCase();
    console.log(`running "${command}", args = [${args.join(", ")}]...`);
    if (command === "help") msg.channel.send(HELP_EMBED);
    if (command === "ping") {
        const m = await msg.channel.send("Ping?");
        PING_EMBED.fields[0].value = m.createdTimestamp - msg.createdTimestamp;
        PING_EMBED.fields[1].value = Math.round(client.ping);
        PING_EMBED.setFooter("Requested By " + msg.author.username, msg.author.displayAvatarURL);
        console.log(` ping results obtained. lat = ${m.createdTimestamp - msg.createdTimestamp}, discord lat = ${Math.round(client.ping)}`);
        m.edit(PING_EMBED);
    }
    //if (command === "coursemology" || command === "cm") msg.reply("Coursemology command is currently disabled.\nHelp me design some embed and send it to me! (The data side is perfectly fine, just the design)")
    if (command === "coursemology" || command === "cm") coursemology.handleCommand(args, msg);

    if (command === "covid" || command === "coronavirus" || command === "corona" || command === "c") covid.handleCommand(args, msg, PREFIX);

    if ((msg.channel.id === "644112354879078411" || msg.guild.id !== "642273802520231936") && (command === "azurlane" || command === "al" || command === "azur" || command === "az")) azurlane.handleCommand(args, msg, PREFIX);
    if (command === "music" || command === "am" || command === "m" || command === "song") await music.handleCommand(args, msg, PREFIX);
    if (command.startsWith("!")) {
        console.log("Double !!: end command = " + command.substring(1));
        await music.handleCommand([command.substring(1)].concat(args), msg, PREFIX);
    }
    if (command === "waifulabs") waifulabs.newBatch(msg);
    if (command === "timetable" || command === "tt") timetable.handleCommand(args, msg, PREFIX);
    if (msg.author.id === "456001047756800000" && (command === "toggledebug" || command === "td")) {
        config.debug = !config.debug;
        console.log("DEBUG TOGGLED, debug = " + config.debug)
        msg.channel.send(`DEBUG: debug output has been turned ${config.debug?"on":"off"}!`);
    }
    if (msg.author.id === "456001047756800000" && (command === "forcestop" || command === "fs" || command === "restart" || command === "rs")) {
        console.log("Restarting program due to request from owner...");
        await msg.channel.send("Forcing a **Restart**...");
        process.exit(1);
    }
    if (command === "shouldisleep" || command === "sleep") {
        var currentHour = (new Date().getHours() + 8) % 24;
        console.log("current hour = " + currentHour);
        if (currentHour < 6 || currentHour > 21) {
            let preset = config.SLEEP_MESSAGES[Math.floor(Math.random() * config.SLEEP_MESSAGES.length)];
            let embed = new Discord.RichEmbed().setTitle(preset.title.replace("${username}", msg.author.username)).setColor(0x21f8ff);
            embed.setDescription(preset.body.replace("${username}", msg.author.username));
            if (currentHour < 6 && currentHour > 2) embed.setThumbnail(config.SLEEP_LATE[Math.floor(Math.random() * config.SLEEP_LATE.length)]);
            else embed.setThumbnail(config.SLEEP_IMAGES[Math.floor(Math.random() * config.SLEEP_IMAGES.length)]);
            msg.channel.send(embed);
            console.log("told " + msg.author.username + " to to goto sleep");
        } else {
            let embed = new Discord.RichEmbed().setTitle("Get some **coffee**!").setColor(0x6f4e37);
            embed.setDescription("There is so much to do, better go get a cup of coffee **" + msg.author.username + "**");
            embed.setThumbnail("https://res.cloudinary.com/chatboxzy/image/upload/v1573747645/coffee.png");
            msg.channel.send(embed);
            console.log("told " + msg.author.username + " to not to goto sleep");
        }
    }
    console.log("====== Message Processed, Elapsed time = " + (Date.now() - startTime) + "ms\n");
});

client.on('reconnecting', () => {
    console.log('Reconnecting!');
});
client.on('disconnect', () => {
    console.log('Disconnect!');
});
client.on('guildCreate', (guild) => {
    console.log("Joined " + guild.id);
});

client.login(process.env.TOKEN);

function chainUpStdOut() {
    const hook = new Discord.WebhookClient('670179846005063681', 'UckNPFVsz2nJ4bUAMtPMq_z0jFL0d66YNaq-C3OhhvXEDtid1hBj4tAOp5WVM9hFYYYn');
    var util = require('util')
    var events = require('events')

    function hook_stdout(callback) {
        var old_write = process.stdout.write
        process.stdout.write = (function(write) {
            return function(string, encoding, fd) {
                write.apply(process.stdout, arguments)
                callback(string, encoding, fd)
            }
        })(process.stdout.write)
        return () => process.stdout.write = old_write;
    }
    let str = [];
    hook_stdout((s) => {
        str.push(s);
        if (s.endsWith('\n')) {
            hook.send("`[" + new Date().toISOString() + "] " + str.join("") + "`");
            str = [];
        }
    });
}
