require("dotenv").config();

const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const express = require("express");
const onboarding = require("./src/onboarding.js");

// Express WebServer (Render / Replit)
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("⚙️ Bot HeLoRiA (Mode Maintenance) est en ligne !");
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

client.once("ready", () => {
    console.log(`\n==========================================`);
    console.log(`✅ [SYSTEM] Connecté en tant que : ${client.user.tag}`);
    console.log(`🛠️ Statut : Mode Maintenance Actif`);
    console.log(`==========================================\n`);

    client.user.setPresence({
        activities: [{ name: "🛠️ Maintenance en cours...", type: ActivityType.Custom }],
        status: "dnd"
    });
});

// Anti-Crash Global
process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ [ANTI-CRASH] Erreur non gérée :", reason);
});

process.on("uncaughtException", (err, origin) => {
    console.error("❌ [ANTI-CRASH] Exception non capturée :", err);
});

// Lancement du module d'onboarding
try {
    onboarding(client);
} catch (err) {
    console.error("❌ Erreur au lancement du module onboarding :", err);
}

client.login(process.env.DISCORD_TOKEN);
