require("dotenv").config(); // Charge les variables du fichier .env

const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const express = require("express");

// Import du module Onboarding (Ajuste le chemin si besoin)
const onboarding = require("./src/onboarding.js");

// Initialisation du serveur Web pour Render / Replit
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("⚙️ Bot HeLoRiA Onboarding est en ligne !");
});

app.listen(PORT, () => {
    console.log(`🌐 [Render WebServer] Actif sur le port ${PORT}`);
});

// Initialisation du Bot Discord
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

// Compteur dynamique de nouveaux membres
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

        // Liste des statuts en mode Streaming Twitch
        const activities = [
            { name: "Accueil HeLoRiA", type: ActivityType.Streaming, url: TWITCH_URL },
            { name: `${joinsToday} nouveau(x) membre(s) aujourd'hui`, type: ActivityType.Streaming, url: TWITCH_URL },
            { name: "Dev By Logs", type: ActivityType.Streaming, url: TWITCH_URL }
        ];

        // Application de la présence
        client.user.setPresence({
            activities: [activities[activityIndex]],
            status: "online" // Le statut "Streaming" passe le voyant automatiquement en violet sur Discord
        });

        activityIndex = (activityIndex + 1) % activities.length;

    }, 15000);
});

// Lancement du système d'onboarding
try {
    onboarding(client);
} catch (err) {
    console.error("❌ Erreur au lancement du module onboarding :", err);
}

// Connexion du bot
client.login(process.env.DISCORD_TOKEN);