const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

const registrarHandlerIA = require("./src/ai/messageHandler");
const registrarChangelog = require("./src/changelog/changelogNotifier");
const registrarModeracao = require("./src/moderation/messageModeration");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

registrarModeracao(client);
registrarChangelog(client);
registrarHandlerIA(client);

client.login(process.env.TOKEN);
