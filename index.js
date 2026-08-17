const { Client, GatewayIntentBits, Partials, ActivityType } = require('discord.js');
const express = require('express');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

let joinsToday = 0;
let lastResetDate = new Date().getDate();

// Import des modules Accueil / Onboarding
const welcomeManager = require('./modules/welcomeManager');
let onboarding = null;
try { onboarding = require("./src/onboarding.js"); } catch (e) {}

// Vérifie si la maintenance de nuit est toujours active (< 08h00)
function isNightMaintenance() {
    return new Date().getHours() < 8;
}

client.once('ready', (c) => {
    console.log(`\n✅ [BOT ACCUEIL] Connecté sous : ${c.user.tag}`);

    if (typeof welcomeManager === 'function') welcomeManager(client);
    if (typeof onboarding === 'function') onboarding(client);

    // Mise à jour de la présence
    setInterval(() => {
        if (isNightMaintenance()) {
            client.user.setPresence({
                activities: [{ name: "🚨 SERVEUR EN PANNE | Entrées fermées jusqu'à 08h00", type: ActivityType.Custom }],
                status: 'dnd'
            });
        } else {
            client.user.setPresence({
                activities: [{ name: `Accueil HeLoRiA | ${joinsToday} rejoint(s)`, type: ActivityType.Custom }],
                status: 'online'
            });
        }
    }, 15000);
});

// Gestion des arrivées
client.on('guildMemberAdd', async (member) => {
    // Si nous sommes avant 08h00 : blocage des entrées
    if (isNightMaintenance()) {
        await member.send("🚨 **SERVEUR EN PANNE / MAINTENANCE** : Le serveur est actuellement fermé. Vous pourrez le rejoindre à partir de 08h00 AM.").catch(() => {});
        if (member.kickable) {
            await member.kick("Maintenance serveur jusqu'à 08h00 AM");
        }
        return;
    }

    // Après 08h00 : fonctionnement normal
    const today = new Date().getDate();
    if (today !== lastResetDate) {
        joinsToday = 0;
        lastResetDate = today;
    }
    joinsToday++;
});

// Serveur Web Express
const app = express();
const PORT = process.env.PORT || 3001;
app.get('/', (req, res) => res.send('⚙️ Bot Accueil en ligne'));
app.listen(PORT, () => console.log(`🌐 [Bot Accueil] Actif sur le port ${PORT}`));

client.login(process.env.DISCORD_TOKEN);
