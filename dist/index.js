"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
require("dotenv/config");
const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds] });
client.once(discord_js_1.Events.ClientReady, (c) => {
    console.log(`Connected. Logged in as ${c.user.tag}`);
});
client.login(process.env.TOKEN);
