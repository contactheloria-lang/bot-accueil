require("dotenv").config();

const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const express = require("express");
const onboarding = require("./src/onboarding.js");

// Express WebServer (Render / Replit)
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("⚙️ Bot HeLoRiA Onboarding est en ligne !");
});

app.get("/ping", (req, res) => {
    res.status(200).send("OK");
});

app.listen(PORT, () => {
    console.log(`🌐 [Render WebServer] Actif sur le port ${PORT}`);
});

// Client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

let joinsToday = 0;
let lastResetDate = new Date().getDate();

client.on("guildMemberAdd", () => {
    const today = new Date().getDate();
    if (today !== lastResetDate) {
        joinsToday = 0;
        lastResetDate = today;
    }
    joinsToday++;
});

client.once("ready", () => {
    console.log(`\n==========================================`);
    console.log(`✅ [SYSTEM] Connecté en tant que : ${client.user.tag}`);
    console.log(`🎥 Status Mode : Streaming (Twitch Live)`);
    console.log(`==========================================\n`);

    let activityIndex = 0;
    const TWITCH_URL = "https://www.twitch.tv/heloriaesport";

    setInterval(() => {
        const today = new Date().getDate();
        if (today !== lastResetDate) {
            joinsToday = 0;
            lastResetDate = today;
        }

        const activities = [
            { name: "Accueil HeLoRiA", type: ActivityType.Streaming, url: TWITCH_URL },
            { name: `${joinsToday} nouveau(x) membre(s) aujourd'hui`, type: ActivityType.Streaming, url: TWITCH_URL },
            { name: "Dev By Logs", type: ActivityType.Streaming, url: TWITCH_URL }
        ];

        client.user.setPresence({
            activities: [activities[activityIndex]],
            status: "online"
        });

        activityIndex = (activityIndex + 1) % activities.length;
    }, 15000);
});

// Anti-Crash Global
process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ [ANTI-CRASH] Erreur non gérée :", reason);
});

process.on("uncaughtException", (err, origin) => {
    console.error("❌ [ANTI-CRASH] Exception non capturée :", err);
});

// Lancement de l'onboarding & Connexion
try {
    onboarding(client);
} catch (err) {
    console.error("❌ Erreur au lancement du module onboarding :", err);
}

client.login(process.env.DISCORD_TOKEN);