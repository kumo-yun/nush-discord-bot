const {
    AzurLane,
    Category
} = require("azurlane");
const azurlane = new AzurLane();
const Discord = require('discord.js');
const config = require('./config.js').config;

const COLOR = {
    "Normal": 0xdcdcdc,
    "Rare": 0xb0e0e6,
    "Elite": 0xdda0dd,
    "Super Rare": 0xeee8aa,
    "Unreleased": 0x000000,
    "Decisive": 0xffffff
};
const DATA = {};

exports.handleCommnd = async function(args, msg, PREFIX) {
    console.log("running azurlane sub-system...");
    if (args.length < 1) return msg.channel.send("Correct Usage: `" + PREFIX + "azurlane (ship|ships) [args]`");
    let lang = "en";
    if (["--en", "--jp", "--cn"].includes(args[args.length - 1])) {
        console.log("user specified language " + args[args.length - 1]);
        lang = args.pop().substring(2);
    }
    switch (args.shift()) {
        case "ship":
        case "s":
        case "info":
        case "i":
            try {
                const ship = await azurlane.getShipByName(args.join(" "));
                let embed = new Discord.RichEmbed().setTitle(`**${ship.names[lang]}**`).setColor(COLOR[ship.rarity]).setThumbnail(ship.thumbnail).setURL(ship.wikiUrl);
                let stats = ship.stats.level120;
                embed.addField("**ID**", ship.id, true)
                    .addField("**Stars**", ship.stars.value, true)
                    .addField("**Rarity**", ship.rarity, true)
                    .addField("**Type**", ship.hullType, true)
                    .addField("**Class**", ship.class, true)
                    .addField("**Nationality**", ship.nationality, true)
                    .addField("Health", stats[0].value, true)
                    .addField("Armor", stats[1].value, true)
                    .addField("Reload", stats[2].value, true)
                    .addField("Luck", stats[3].value, true)
                    .addField("Firepower", stats[4].value, true)
                    .addField("Evasion", stats[6].value, true)
                    .addField("Anti-air", stats[8].value, true)
                    .addField("Aviation", stats[9].value, true)
                    .addField("Oil Usage", stats[10].value, true)
                    .addField("Designed by", ship.miscellaneous.artist.name)
                    .addField("Avaliable Skins", ship.skins.map(skin => skin.title).join("\n"));
                embed.setDescription("_All stats shown below are lv120 stats._");
                msg.channel.send(embed);
            } catch (err) {
                console.log(`ship subcommand, err code = ${err.statusCode}, args = ${args}`);
                msg.channel.send("Invalid ship name.");
            }
            break;
        case "ships":
        case "ss":
        case "ls":
        case "fs":
            if (args.length < 2) return msg.channel.send("Correct Usage: `" + PREFIX + "azurlane ships (rarity|type|affiliation) filter`");
            try {
                const ships = await azurlane.getShips(args[0], args.slice(1).join(" "));
                for (let i = 0; i < ships.length; i++) {
                    console.log(`[${ships[i].id}] = ${ships[i].name}`); // [036] = San Diego
                }
            } catch (err) {
                console.log(`ships subcommand, err code = ${err.statusCode}, args = ${args}`);
                msg.channel.send("Invalid ships category/type.");
            }
            break;
        case "viewskin":
        case "skin":
        case "sk":
        case "vs":
            break;
    }
}
