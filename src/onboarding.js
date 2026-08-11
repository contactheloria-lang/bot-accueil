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
const fs = require("fs"); // Ajout de fs pour lire correctement les fichiers images

const CONFIG = {
    CATEGORY_ID: "1534953439908593857",
    LOGS_CHANNEL_ID: "1535026560896204922",

    ROLE_ONBOARDING: "1532058943570837656",

    ROLES_MEMBER: [
        "1532014889848143964",
        "1532014895657128098"
    ],

    ROLES_NOTIFS: {
        anim: [
            "1532014836463177739",
            "1532014855698120794"
        ],
        sondage: [
            "1532014839659237587",
            "1532014855698120794"
        ],
        webtv: [
            "1532014842637058058",
            "1532014855698120794"
        ],
        partenaire: [
            "1532014845963010119",
            "1532014855698120794"
        ],
        reseaux: [
            "1532014849582829659",
            "1532014855698120794"
        ],
        annonces: [
            "1532014852724363416",
            "1532014855698120794"
        ]
    },

    CEO: {
        name: "HLR Logs"
    },

    DG: {
        name: "HLR Raxeur"
    }
};

module.exports = (client) => {

    client.on("guildMemberAdd", async (member) => {

        try {

            await member.roles.add(CONFIG.ROLE_ONBOARDING).catch(() => {});

            let selectedNotifs = [];
            let shouldAddTag = false;
            let selectedGame = "Non spécifié";
            let selectedIntent = "Non spécifié";

            // Préparation des fichiers locaux avec vérification fs
            const ceoAvatarPath = path.join(__dirname, "assets", "ceo.png");
            const dgAvatarPath = path.join(__dirname, "assets", "dg.png");
            const logoPath = path.join(__dirname, "assets", "logo.png");

            const channel = await member.guild.channels.create({
                name: `accueil-${member.user.username}`,
                parent: CONFIG.CATEGORY_ID,

                permissionOverwrites: [
                    {
                        id: member.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: member.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    }
                ]
            });

            const timeoutAutoDelete = setTimeout(async () => {
                if (channel) {
                    await channel.delete().catch(() => {});
                }
            }, 15 * 60 * 1000);

            // Lecture sécurisée des images via Buffer
            const ceoBuffer = fs.existsSync(ceoAvatarPath) ? fs.readFileSync(ceoAvatarPath) : null;
            const dgBuffer = fs.existsSync(dgAvatarPath) ? fs.readFileSync(dgAvatarPath) : null;

            // Création propre des webhooks avec Buffer
            const webhookCEO = await channel.createWebhook({
                name: CONFIG.CEO.name,
                avatar: ceoBuffer
            });

            const webhookDG = await channel.createWebhook({
                name: CONFIG.DG.name,
                avatar: dgBuffer
            });

            // =====================================================
            // 1. PRÉSENTATION CEO
            // =====================================================

            await webhookCEO.send({
                content: `Bienvenue <@${member.id}> chez **Team HeLoRiA** !`
            });

            // Préparation du logo pour l'embed
            const filesSend = [];
            let logoAttachmentName = null;

            if (fs.existsSync(logoPath)) {
                const logoAttachment = new AttachmentBuilder(logoPath, { name: "logo.png" });
                filesSend.push(logoAttachment);
                logoAttachmentName = "attachment://logo.png";
            }

            const embedPres = new EmbedBuilder()
                .setColor("#FFFFFF")
                .setTitle("Team HeLoRiA — Esport & Community")
                .setDescription(
                    `Bienvenue parmi nous !\n\n` +
                    `Team HeLoRiA est une structure esport axée sur la compétition et la communauté.\n\n` +
                    `**Fondateur :** <@1431661348218998948>`
                );

            if (logoAttachmentName) {
                embedPres.setThumbnail(logoAttachmentName);
            }

            await webhookCEO.send({
                embeds: [embedPres],
                files: filesSend
            });

            // =====================================================
            // 2. QUESTION INTENTION
            // =====================================================

            const intentRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("intent_player")
                    .setLabel("Joueur / Compétition")
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId("intent_creator")
                    .setLabel("Créateur / Streamer")
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId("intent_community")
                    .setLabel("Communauté / Fan")
                    .setStyle(ButtonStyle.Secondary)
            );

            const msgIntent = await channel.send({
                content: `**Question du CEO :** Quel est ton objectif principal sur le serveur ?`,
                components: [intentRow]
            });

            const intentCollector = msgIntent.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 120000,
                filter: i => i.user.id === member.id
            });

            intentCollector.on("collect", async (i) => {
                await i.deferUpdate();

                let intentAnswer = "";

                if (i.customId === "intent_player") {
                    selectedIntent = "Joueur / Compétition";
                    intentAnswer = "Super ! On cherche toujours des compétiteurs déterminés.";
                } else if (i.customId === "intent_creator") {
                    selectedIntent = "Créateur / Streamer";
                    intentAnswer = "Top ! La création de contenu est très importante pour nous.";
                } else {
                    selectedIntent = "Communauté / Fan";
                    intentAnswer = "Bienvenue ! La communauté est le cœur d'HeLoRiA.";
                }

                await webhookCEO.send({
                    content: intentAnswer
                });

                await msgIntent.delete().catch(() => {});
                intentCollector.stop();

                startDGStep();
            });

            // =====================================================
            // 3. RÈGLEMENT & QUESTION JEU
            // =====================================================

            async function startDGStep() {
                const embedReg = new EmbedBuilder()
                    .setColor("#000000")
                    .setTitle("Règles Essentielles")
                    .setDescription(
                        `• **Respect :** Attitude mûre et correcte.\n` +
                        `• **Sécurité :** Aucun spam, harcèlement ou lien suspect.\n` +
                        `• **Organisation :** Respect des thèmes de chaque salon.`
                    );

                await webhookDG.send({
                    content: "Un petit rappel des règles importantes :",
                    embeds: [embedReg]
                });

                const gameSelect = new StringSelectMenuBuilder()
                    .setCustomId("select_game")
                    .setPlaceholder("Ton jeu principal ?")
                    .addOptions([
                        { label: "Fortnite", value: "Fortnite" },
                        { label: "Rocket League", value: "Rocket League" },
                        { label: "Valorant / FPS", value: "Valorant / FPS" },
                        { label: "Autre", value: "Autre" }
                    ]);

                const msgGame = await channel.send({
                    content: "À quel jeu joues-tu le plus en ce moment ?",
                    components: [
                        new ActionRowBuilder().addComponents(gameSelect)
                    ]
                });

                const gameCollector = msgGame.createMessageComponentCollector({
                    componentType: ComponentType.StringSelect,
                    time: 120000,
                    filter: i => i.user.id === member.id
                });

                gameCollector.on("collect", async (i) => {
                    await i.deferUpdate();

                    selectedGame = i.values[0];

                    await webhookDG.send({
                        content: "C'est noté ! Tu trouveras plein de joueurs avec qui lancer des parties."
                    });

                    await msgGame.delete().catch(() => {});
                    gameCollector.stop();

                    startNotifStep();
                });
            }

            // =====================================================
            // 4. NOTIFICATIONS
            // =====================================================

            async function startNotifStep() {
                const notifSelect = new StringSelectMenuBuilder()
                    .setCustomId("select_notifs")
                    .setPlaceholder("Tes rôles de notifications...")
                    .setMinValues(0)
                    .setMaxValues(6)
                    .addOptions([
                        { label: "Annonces", value: "annonces" },
                        { label: "Animations / Events", value: "anim" },
                        { label: "Sondages", value: "sondage" },
                        { label: "WebTV / Lives", value: "webtv" },
                        { label: "Partenariats", value: "partenaire" },
                        { label: "Réseaux Sociaux", value: "reseaux" }
                    ]);

                const msgNotif = await channel.send({
                    content: "Sélectionne les notifications que tu veux activer :",
                    components: [
                        new ActionRowBuilder().addComponents(notifSelect)
                    ]
                });

                const notifCollector = msgNotif.createMessageComponentCollector({
                    componentType: ComponentType.StringSelect,
                    time: 120000,
                    filter: i => i.user.id === member.id
                });

                notifCollector.on("collect", async (i) => {
                    await i.deferUpdate();

                    selectedNotifs = i.values.flatMap(
                        notif => CONFIG.ROLES_NOTIFS[notif] || []
                    );

                    selectedNotifs = [...new Set(selectedNotifs)];

                    await msgNotif.delete().catch(() => {});
                    notifCollector.stop();

                    startTagStep();
                });
            }

            // =====================================================
            // 5. TAG
            // =====================================================

            async function startTagStep() {
                const tagRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("tag_yes")
                        .setLabel("Oui")
                        .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                        .setCustomId("tag_no")
                        .setLabel("Non")
                        .setStyle(ButtonStyle.Secondary)
                );

                const msgTag = await channel.send({
                    content: `Veux-tu porter notre tag ? (Exemple : \`HLR ${member.displayName}\`)`,
                    components: [tagRow]
                });

                const tagCollector = msgTag.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 120000,
                    filter: i => i.user.id === member.id
                });

                tagCollector.on("collect", async (i) => {
                    await i.deferUpdate();

                    if (i.customId === "tag_yes") {
                        shouldAddTag = true;
                        await webhookCEO.send({
                            content: "Merci de porter haut les couleurs d'HeLoRiA !"
                        });
                    }

                    await msgTag.delete().catch(() => {});
                    tagCollector.stop();

                    startCaptchaStep();
                });
            }

            // =====================================================
            // 6. CAPTCHA & LOGS
            // =====================================================

            async function startCaptchaStep() {
                const num1 = Math.floor(Math.random() * 120) + 10;
                const num2 = Math.floor(Math.random() * 120) + 10;

                const correct = num1 + num2;

                const answers = [
                    { label: `${correct}`, isCorrect: true },
                    { label: `${correct + 4}`, isCorrect: false },
                    { label: `${correct - 6}`, isCorrect: false }
                ].sort(() => Math.random() - 0.5);

                const captchaRow = new ActionRowBuilder();

                answers.forEach((ans, idx) => {
                    captchaRow.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`captcha_${ans.isCorrect ? "ok" : "err_" + idx}`)
                            .setLabel(ans.label)
                            .setStyle(ButtonStyle.Primary)
                    );
                });

                const msgCaptcha = await channel.send({
                    content: `**Vérification finale :** Combien font **${num1} + ${num2}** ?`,
                    components: [captchaRow]
                });

                const captchaCollector = msgCaptcha.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 120000,
                    filter: i => i.user.id === member.id
                });

                captchaCollector.on("collect", async (i) => {
                    if (i.customId === "captcha_ok") {
                        await i.deferUpdate();
                        clearTimeout(timeoutAutoDelete);

                        await msgCaptcha.delete().catch(() => {});

                        if (shouldAddTag) {
                            await member.setNickname(
                                `HLR ${member.displayName}`.substring(0, 32)
                            ).catch(() => {});
                        }

                        const finalRolesToAdd = [
                            ...CONFIG.ROLES_MEMBER,
                            ...selectedNotifs
                        ];

                        await member.roles.remove(CONFIG.ROLE_ONBOARDING).catch(() => {});
                        await member.roles.add(finalRolesToAdd).catch(() => {});

                        await webhookCEO.send({
                            content: `Accès validé ! Bienvenue officiellement sur le serveur HeLoRiA <@${member.id}> !`
                        });

                        const logsChannel = member.guild.channels.cache.get(CONFIG.LOGS_CHANNEL_ID);

                        if (logsChannel) {
                            const embedLog = new EmbedBuilder()
                                .setColor("#00FF00")
                                .setTitle("📥 Nouvel Arrivant Validé")
                                .setThumbnail(member.user.displayAvatarURL())
                                .addFields(
                                    { name: "Membre", value: `<@${member.id}> (${member.user.tag})`, inline: true },
                                    { name: "ID", value: `${member.id}`, inline: true },
                                    { name: "Objectif / Profil", value: selectedIntent, inline: false },
                                    { name: "Jeu principal", value: selectedGame, inline: true },
                                    { name: "Tag HLR accepté ?", value: shouldAddTag ? "Oui" : "Non", inline: true },
                                    { name: "Rôles notifs attribués", value: `${selectedNotifs.length} rôle(s)`, inline: true }
                                )
                                .setTimestamp();

                            await logsChannel.send({ embeds: [embedLog] }).catch(() => {});
                        }

                        setTimeout(async () => {
                            await channel.delete().catch(() => {});
                        }, 5000);

                    } else {
                        await i.reply({
                            content: "Mauvaise réponse, essaie encore !",
                            ephemeral: true
                        });
                    }
                });
            }

        } catch (err) {
            console.error("Erreur onboarding :", err);
        }

    });

};