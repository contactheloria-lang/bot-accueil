const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    ComponentType,
    AttachmentBuilder
} = require("discord.js");
const path = require("path");
const fs = require("fs");

const EMOJIS = {
    TELESCOPE:  { text: "<:65264telescope:1537586517453832222>", id: "1537586517453832222" },
    CROWN:      { text: "<a:darkbluecrown:1533535362566324245>", id: "1533535362566324245" },
    QUILL:      { text: "<:6880quill:1537585310794391563>", id: "1537585310794391563" },
    HLR_WIN:    { text: "<:hlrwin:1537584105536094248>", id: "1537584105536094248" },
    RULES:      { text: "<:580437rules:1537583160345366578>", id: "1537583160345366578" },
    TRIALMOD:   { text: "<:94919trialmod:1537582836318609521>", id: "1537582836318609521" },
    ANIMATION:  { text: "<:68052micanimation:1537582247278813204>", id: "1537582247278813204" },
    MODERATOR:  { text: "<:3446blurplecertifiedmoderator:1533535324309815367>", id: "1533535324309815367" },
    BAN:        { text: "<:9299blurpleban:1533535325996056807>", id: "1533535325996056807" },
    TICKET:     { text: "<:29909ticket:1537580036159316108>", id: "1537580036159316108" },
    BRIEFCASE:  { text: "<:75828briefcase:1537579702812807248>", id: "1537579702812807248" },
    CERTIFIED:  { text: "<:20336certified:1537579306690281544>", id: "1537579306690281544" },
    HANDSHAKE:  { text: "<:600404handshake:1537578056447828058>", id: "1537578056447828058" },
    PAYPAL:     { text: "<:1716_PAYPAL:1537578291593093240>", id: "1537578291593093240" },
    MONEY:      { text: "<:63043moneyspread:1537577805829636117>", id: "1537577805829636117" },
    PREMIUM:    { text: "<:5647premiumicon:1533535330538360942>", id: "1533535330538360942" },
    LOCK:       { text: "<a:lockicon:1533535370787033198>", id: "1533535370787033198" },
    UPDATE:     { text: "<:update:1533535384674369777>", id: "1533535384674369777" },
    LOADING:    { text: "<a:loadingicon:1533535386951749683>", id: "1533535386951749683" },
    WARNING:    { text: "<:warningd:1533535400176386068>", id: "1533535400176386068" }
};

const CONFIG = {
    CATEGORY_ID: "1534953439908593857",
    ROLE_ONBOARDING: "1532058943570837656",
    ROLE_SPECIAL_ACCESS: "1532015026851020871", // Rôle autorisé
    IS_MAINTENANCE: true
};

module.exports = (client) => {

    client.on("interactionCreate", async (interaction) => {
        if (CONFIG.IS_MAINTENANCE && (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isCommand())) {
            return interaction.reply({
                content: "🛠️ **Le serveur est actuellement en maintenance.** Les fonctionnalités interactives sont temporairement désactivées.",
                ephemeral: true
            }).catch(() => {});
        }
    });

    client.on("guildMemberAdd", async (member) => {
        try {
            await member.roles.add(CONFIG.ROLE_ONBOARDING).catch(() => {});

            const permissions = [
                {
                    id: member.guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: member.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.ReadMessageHistory
                    ],
                    deny: [
                        PermissionFlagsBits.SendMessages
                    ]
                },
                {
                    id: CONFIG.ROLE_SPECIAL_ACCESS,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                }
            ];

            const channel = await member.guild.channels.create({
                name: `accueil-${member.user.username}`,
                parent: CONFIG.CATEGORY_ID,
                permissionOverwrites: permissions
            });

            if (CONFIG.IS_MAINTENANCE) {
                const embedMaintenance = new EmbedBuilder()
                    .setColor("#FFCC00")
                    .setTitle("🛠️ Serveur en Maintenance")
                    .setDescription(
                        `Bienvenue <@${member.id}> !\n\n` +
                        `Le serveur **HeLoRiA** est actuellement en cours de maintenance.\n` +
                        `Merci de patienter jusqu'à la validation d'un membre de l'équipe du staff pour obtenir vos accès complets.\n\n` +
                        `*Aucun membre du staff n'a été notifié automatiquement. Merci pour votre patience !*`
                    )
                    .setFooter({ text: "HeLoRiA Esport — Système de Maintenance" })
                    .setTimestamp();

                await channel.send({ embeds: [embedMaintenance] });
                return;
            }

        } catch (err) {
            console.error("❌ Erreur lors du traitement de l'accueil :", err);
        }
    });
};
