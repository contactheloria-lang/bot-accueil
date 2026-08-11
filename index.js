require("dotenv").config(); // Charge les variables du fichier .env

const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const express = require("express");

// ⚠️ AJUSTE CE CHEMIN :
// - Si onboarding.js est au même niveau que index.js : require("./onboarding.js")
// - Si onboarding.js est dans un dossier src : require("./src/onboarding.js")
const onboarding = require("./src/onboarding.js");

// Initialisation du serveur Web pour Render
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Bot HeLoRiA en ligne !");
});

app.listen(PORT, () => {
    console.log(`Serveur Web connecté sur le port ${PORT}`);
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

// Compteur de nouveaux membres
client.on("guildMemberAdd", () => {
    const today = new Date().getDate();
    if (today !== lastResetDate) {
        joinsToday = 0;
        lastResetDate = today;
    }
    joinsToday++;
});

client.once("ready", () => {
    console.log(`Bot connecté sous le nom : ${client.user.tag}`);

    const statuses = ["online", "idle", "dnd"];
    let statusIndex = 0;
    let activityIndex = 0;

    setInterval(() => {
        const today = new Date().getDate();
        if (today !== lastResetDate) {
            joinsToday = 0;
            lastResetDate = today;
        }

        const activities = [
            { name: "Les nouveaux arrivants", type: ActivityType.Watching },
            { name: `${joinsToday} nouveau(x) membre(s) aujourd'hui`, type: ActivityType.Watching },
            { name: "L'accueil HeLoRiA", type: ActivityType.Competing }
        ];

        client.user.setPresence({
            status: statuses[statusIndex],
            activities: [activities[activityIndex]]
        });

        statusIndex = (statusIndex + 1) % statuses.length;
        activityIndex = (activityIndex + 1) % activities.length;

    }, 15000);
});

// Lancement du système d'onboarding
onboarding(client);

// Connexion du bot
client.login(process.env.DISCORD_TOKEN);