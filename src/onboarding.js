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

// =====================================================
// CONFIGURATION DES EMOJIS ET DU SYSTÈME
// =====================================================
const EMOJIS = {
    // Branding & HeLoRiA
    HLR: "<:Heloria:1347621453989806141>",
    VERIFIED: "<:Verification_HLR:1347621451213303868>",
    CROWN: "<:Crown:1347621448822489118>",
    STAR: "<:Etoile:1347621445941006457>",
    
    // Status & Modération
    ADMIN: "<:Shield_Admin:1347621443424161823>",
    WARNING: "<:Warning_HLR:1347621440781779036>",
    SUCCESS: "<:Check_HLR:1347621438210670673>",
    CROSS: "<:Cross_HLR:1347621435803271218>",
    ROBOT: "<:Bot_HLR:1347621433290620958>",
    
    // Profils & Métiers
    PLAYER: "<:Esport_Player:1347621430799335505>",
    CREATOR: "<:Streamer_HLR:1347621428312117288>",
    STAFF: "<:Staff_HLR:1347621425824890983>",
    DESIGNER: "<:GFX_HLR:1347621423400583208>",
    COMMUNITY: "<:Community_HLR:1347621420791746621>",
    
    // Jeux
    FORTNITE: "<:Fortnite_HLR:1347621418296270929>",
    ROCKET: "<:RocketLeague_HLR:1347621415779696700>",
    VALORANT: "<:Valorant_HLR:1347621413225234515>",
    OTHER: "<:Gaming_HLR:1347621410712780830>",
    
    // Notifications & Divers
    BELL: "<:Notif_HLR:1347621408309448825>",
    ANNOUNCEMENTS: "<:Announce_HLR:1347621405826588724>",
    EVENTS: "<:Event_HLR:1347621403251282052>",
    POLLS: "<:Poll_HLR:1347621400843616256>",
    WEBTV: "<:WebTV_HLR:1347621398285226065>",
    PARTNERS: "<:Partner_HLR:1347621395802390558>",
    SOCIALS: "<:Socials_HLR:1347621393315299438>",
    DONATE: "<:Soutenir_HLR:1347621390824001556>"
};

const CONFIG = {
    CATEGORY_ID: "1534953439908593857",
    LOGS_CHANNEL_ID: "1535026560896204922",

    ROLE_ONBOARDING: "1532058943570837656",
    ROLES_STAFF: [
        "1532015045800628244", 
        "1532015039806963763"
    ],
    ROLES_MEMBER: [
        "1532014889848143964",
        "1532014895657128098"
    ],

    ROLES_NOTIFS: {
        anim: ["1532014836463177739", "1532014855698120794"],
        sondage: ["1532014839659237587", "1532014855698120794"],
        webtv: ["1532014842637058058", "1532014855698120794"],
        partenaire: ["1532014845963010119", "1532014855698120794"],
        reseaux: ["1532014849582829659", "1532014855698120794"],
        annonces: ["1532014852724363416", "1532014855698120794"]
    },

    CEO: { name: "HLR Logs" },
    DG: { name: "HLR Raxeur" }
};

module.exports = (client) => {

    client.on("guildMemberAdd", async (member) => {

        try {
            await member.roles.add(CONFIG.ROLE_ONBOARDING).catch(() => {});

            let selectedNotifs = [];
            let shouldAddTag = false;
            let selectedGame = "Non spécifié";
            let selectedIntent = "Non spécifié";

            const ceoAvatarPath = path.join(__dirname, "assets", "ceo.png");
            const dgAvatarPath = path.join(__dirname, "assets", "dg.png");
            const logoPath = path.join(__dirname, "assets", "logo.png");

            // =====================================================
            // PERMISSIONS SECURISEES
            // =====================================================
            const permissions = [
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
            ];

            if (Array.isArray(CONFIG.ROLES_STAFF)) {
                CONFIG.ROLES_STAFF.forEach(staffId => {
                    if (member.guild.roles.cache.has(staffId)) {
                        permissions.push({
                            id: staffId,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory
                            ]
                        });
                    }
                });
            }

            const channel = await member.guild.channels.create({
                name: `accueil-${member.user.username}`,
                parent: CONFIG.CATEGORY_ID,
                permissionOverwrites: permissions
            });

            const ceoBuffer = fs.existsSync(ceoAvatarPath) ? fs.readFileSync(ceoAvatarPath) : null;
            const dgBuffer = fs.existsSync(dgAvatarPath) ? fs.readFileSync(dgAvatarPath) : null;

            const webhookCEO = await channel.createWebhook({
                name: CONFIG.CEO.name,
                avatar: ceoBuffer
            });

            const webhookDG = await channel.createWebhook({
                name: CONFIG.DG.name,
                avatar: dgBuffer
            });

            // =====================================================
            // PANNEAU ADMINISTRATION / STAFF BYPASS
            // =====================================================
            const staffRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("staff_force_validate")
                    .setLabel("Validation Forcée Staff")
                    .setEmoji("1347621443424161823")
                    .setStyle(ButtonStyle.Danger)
            );

            const staffMsg = await channel.send({
                content: `${EMOJIS.ADMIN} **CONSOLE DE MODÉRATION :** Panneau réservé au Staff & à la Direction.`,
                components: [staffRow]
            });

            const staffCollector = staffMsg.createMessageComponentCollector({
                componentType: ComponentType.Button
            });

            staffCollector.on("collect", async (i) => {
                const isStaff = CONFIG.ROLES_STAFF.some(id => i.member.roles.cache.has(id)) || i.member.permissions.has(PermissionFlagsBits.Administrator);

                if (!isStaff) {
                    return i.reply({ content: `${EMOJIS.CROSS} Seul le personnel autorisé peut utiliser cette fonction.`, ephemeral: true });
                }

                if (i.customId === "staff_force_validate") {
                    const tagChoiceRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId("staff_tag_yes").setLabel("Valider + Tag [HLR]").setEmoji("1347621438210670673").setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId("staff_tag_no").setLabel("Valider SANS Tag").setEmoji("1347621435803271218").setStyle(ButtonStyle.Secondary)
                    );

                    await i.reply({
                        content: `${EMOJIS.WARNING} **Procédure de bypass d'urgence pour <@${member.id}> :**\nSouhaitez-vous attribuer automatiquement le tag officiel au pseudonyme ?`,
                        components: [tagChoiceRow],
                        ephemeral: true
                    });
                }
            });

            const filterStaffChoice = (i) => (i.customId === "staff_tag_yes" || i.customId === "staff_tag_no") && (CONFIG.ROLES_STAFF.some(id => i.member.roles.cache.has(id)) || i.member.permissions.has(PermissionFlagsBits.Administrator));
            const staffChoiceCollector = channel.createMessageComponentCollector({
                filter: filterStaffChoice,
                componentType: ComponentType.Button
            });

            staffChoiceCollector.on("collect", async (i) => {
                await i.deferUpdate();
                const forceTag = (i.customId === "staff_tag_yes");

                if (forceTag) {
                    await member.setNickname(`HLR ${member.displayName}`.substring(0, 32)).catch(() => {});
                }

                const defaultNotifs = [...CONFIG.ROLES_NOTIFS.annonces, ...CONFIG.ROLES_NOTIFS.anim];
                const finalRolesToAdd = [...new Set([...CONFIG.ROLES_MEMBER, ...defaultNotifs])];

                await member.roles.remove(CONFIG.ROLE_ONBOARDING).catch(() => {});
                await member.roles.add(finalRolesToAdd).catch(() => {});

                await channel.send(`${EMOJIS.SUCCESS} **Accès accordé manuellement par <@${i.user.id}> !** Fermeture du salon dans 5 secondes...`);

                const logsChannel = member.guild.channels.cache.get(CONFIG.LOGS_CHANNEL_ID);
                if (logsChannel) {
                    const embedLog = new EmbedBuilder()
                        .setColor("#FFA500")
                        .setTitle(`${EMOJIS.WARNING} ONBOARDING — Validation Manuelle (Bypass)`)
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                        .addFields(
                            { name: "👤 Membre Concerné", value: `<@${member.id}> (\`${member.user.tag}\`)`, inline: true },
                            { name: "👑 Modérateur", value: `<@${i.user.id}>`, inline: true },
                            { name: "🏷️ Tag Structure", value: forceTag ? "`Activé [HLR]`" : "`Désactivé`", inline: true }
                        )
                        .setFooter({ text: "HeLoRiA Esport System", iconURL: member.guild.iconURL() })
                        .setTimestamp();

                    await logsChannel.send({ embeds: [embedLog] }).catch(() => {});
                }

                setTimeout(async () => {
                    await channel.delete().catch(() => {});
                }, 5000);
            });

            // =====================================================
            // 1. BIENVENUE & PRESENTATION OFFICIELLE
            // =====================================================
            await webhookCEO.send({
                content: `# ${EMOJIS.HLR} Bienvenue chez Team HeLoRiA, <@${member.id}> !`
            });

            const filesSend = [];
            let logoAttachmentName = null;

            if (fs.existsSync(logoPath)) {
                const logoAttachment = new AttachmentBuilder(logoPath, { name: "logo.png" });
                filesSend.push(logoAttachment);
                logoAttachmentName = "attachment://logo.png";
            }

            const embedPres = new EmbedBuilder()
                .setColor("#2B2D31")
                .setTitle(`${EMOJIS.STAR} STRUCTURE OFFICIELLE — ESPORT & PERFORMANCE`)
                .setDescription(
                    `Ravi de te compter parmi nous ! **HeLoRiA** est une organisation e-sport ambitieuse fondée sur l'excellence, la cohésion et le développement de talents.\n\n` +
                    `Avant d'accéder à l'intégralité du serveur, nous allons configurer ton profil en **4 étapes rapides**.\n\n` +
                    `📌 **Fondateur / CEO :** <@1431661348218998948>\n` +
                    `🌐 **Soutenir la structure :** N'hésite pas à consulter nos salons d'information !`
                );

            if (logoAttachmentName) {
                embedPres.setThumbnail(logoAttachmentName);
            }

            await webhookCEO.send({
                embeds: [embedPres],
                files: filesSend
            });

            // =====================================================
            // 2. CHOIX DU PROFIL (INTENTION)
            // =====================================================
            const intentMenu = new StringSelectMenuBuilder()
                .setCustomId("select_intent")
                .setPlaceholder("Sélectionne ton profil principal...")
                .addOptions([
                    { label: "Joueur / Compétition", value: "intent_player", description: "Viser la performance, tournois et scrims", emoji: "1347621430799335505" },
                    { label: "Créateur / Streamer", value: "intent_creator", description: "Proposer du contenu, live et événements", emoji: "1347621428312117288" },
                    { label: "Staff / Administration", value: "intent_staff", description: "Aider au développement de la structure", emoji: "1347621425824890983" },
                    { label: "Audiovisuel / Design", value: "intent_av", description: "Montage vidéo, graphisme et créations", emoji: "1347621423400583208" },
                    { label: "Communauté / Supporter", value: "intent_community", description: "Suivre nos actualités et passer de bons moments", emoji: "1347621420791746621" }
                ]);

            const msgIntent = await channel.send({
                content: `### ${EMOJIS.CROWN} Étape 1/4 — Quel est ton objectif principal chez HeLoRiA ?`,
                components: [new ActionRowBuilder().addComponents(intentMenu)]
            });

            const intentCollector = msgIntent.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                filter: i => i.user.id === member.id
            });

            intentCollector.on("collect", async (i) => {
                await i.deferUpdate();
                const choice = i.values[0];
                let intentAnswer = "";

                if (choice === "intent_player") {
                    selectedIntent = `${EMOJIS.PLAYER} Joueur / Compétition`;
                    intentAnswer = `${EMOJIS.SUCCESS} Excellent choix ! Nous recherchons continuellement des joueurs déterminés à atteindre le sommet.`;
                } else if (choice === "intent_creator") {
                    selectedIntent = `${EMOJIS.CREATOR} Créateur / Streamer`;
                    intentAnswer = `${EMOJIS.SUCCESS} Impressionnant ! La création de contenu est une vitrine majeure pour **HeLoRiA**.`;
                } else if (choice === "intent_staff") {
                    selectedIntent = `${EMOJIS.STAFF} Staff / Administration`;
                    intentAnswer = `${EMOJIS.SUCCESS} Parfait ! Une grande structure repose avant tout sur une équipe dédiée et rigoureuse.`;
                } else if (choice === "intent_av") {
                    selectedIntent = `${EMOJIS.DESIGNER} Audiovisuel / Design`;
                    intentAnswer = `${EMOJIS.SUCCESS} Super ! L'image de marque et l'identité visuelle sont fondamentales chez nous.`;
                } else {
                    selectedIntent = `${EMOJIS.COMMUNITY} Communauté / Supporter`;
                    intentAnswer = `${EMOJIS.SUCCESS} Bienvenue ! La communauté est le véritable cœur palpitant d'**HeLoRiA**.`;
                }

                await webhookCEO.send({ content: intentAnswer });
                await msgIntent.delete().catch(() => {});
                intentCollector.stop();

                startDGStep();
            });

            // =====================================================
            // 3. CHARTE & SÉLECTION DU JEU
            // =====================================================
            async function startDGStep() {
                const embedReg = new EmbedBuilder()
                    .setColor("#1E1F22")
                    .setTitle(`${EMOJIS.ADMIN} CHARTE ÉTHIQUE & RÈGLEMENT`)
                    .setDescription(
                        `• **Respect & Esprit d'équipe :** Traite chaque membre avec courtoisie.\n` +
                        `• **Fair-Play & Image :** Représente la structure dignement en jeu comme en dehors.\n` +
                        `• **Zéro Tolérance :** Aucun comportement toxique, triche ou spam ne sera toléré.`
                    );

                await webhookDG.send({
                    content: `Afin d'assurer un environnement sain et compétitif, merci de respecter nos principes :`,
                    embeds: [embedReg]
                });

                const gameSelect = new StringSelectMenuBuilder()
                    .setCustomId("select_game")
                    .setPlaceholder("Sélectionne ton jeu principal...")
                    .addOptions([
                        { label: "Fortnite", value: "Fortnite", emoji: "1347621418296270929" },
                        { label: "Rocket League", value: "Rocket League", emoji: "1347621415779696700" },
                        { label: "Valorant / FPS", value: "Valorant / FPS", emoji: "1347621413225234515" },
                        { label: "Autre Jeu / Multigaming", value: "Autre", emoji: "1347621410712780830" }
                    ]);

                const msgGame = await channel.send({
                    content: `### ${EMOJIS.OTHER} Étape 2/4 — Sur quel jeu évolues-tu principalement ?`,
                    components: [new ActionRowBuilder().addComponents(gameSelect)]
                });

                const gameCollector = msgGame.createMessageComponentCollector({
                    componentType: ComponentType.StringSelect,
                    filter: i => i.user.id === member.id
                });

                gameCollector.on("collect", async (i) => {
                    await i.deferUpdate();
                    selectedGame = i.values[0];

                    await webhookDG.send({
                        content: `${EMOJIS.SUCCESS} C'est bien noté pour **${selectedGame}** ! Tu vas pouvoir échanger avec nos joueurs très rapidement.`
                    });

                    await msgGame.delete().catch(() => {});
                    gameCollector.stop();

                    startNotifStep();
                });
            }

            // =====================================================
            // 4. NOTIFICATIONS PERSONNALISÉES
            // =====================================================
            async function startNotifStep() {
                const notifSelect = new StringSelectMenuBuilder()
                    .setCustomId("select_notifs")
                    .setPlaceholder("Sélectionne tes abonnements...")
                    .setMinValues(0)
                    .setMaxValues(6)
                    .addOptions([
                        { label: "Annonces Officielles", value: "annonces", description: "Mises à jour et informations majeures", emoji: "1347621405826588724" },
                        { label: "Animations & Events", value: "anim", description: "Soirées communautaires et tournois", emoji: "1347621403251282052" },
                        { label: "Sondages & Projets", value: "sondage", description: "Donne ton avis pour faire évoluer la team", emoji: "1347621400843616256" },
                        { label: "WebTV & Streams", value: "webtv", description: "Notifications lors des lives officiels", emoji: "1347621398285226065" },
                        { label: "Partenariats & Offres", value: "partenaire", description: "Réductions et avantages exclusifs", emoji: "1347621395802390558" },
                        { label: "Réseaux Sociaux", value: "reseaux", description: "Alertes YouTube, X, TikTok et Instagram", emoji: "1347621393315299438" }
                    ]);

                const msgNotif = await channel.send({
                    content: `### ${EMOJIS.BELL} Étape 3/4 — Personnalise tes notifications :`,
                    components: [new ActionRowBuilder().addComponents(notifSelect)]
                });

                const notifCollector = msgNotif.createMessageComponentCollector({
                    componentType: ComponentType.StringSelect,
                    filter: i => i.user.id === member.id
                });

                notifCollector.on("collect", async (i) => {
                    await i.deferUpdate();
                    selectedNotifs = i.values.flatMap(notif => CONFIG.ROLES_NOTIFS[notif] || []);
                    selectedNotifs = [...new Set(selectedNotifs)];

                    await msgNotif.delete().catch(() => {});
                    notifCollector.stop();

                    startTagStep();
                });
            }

            // =====================================================
            // 5. APPARTENANCE AU TAG [HLR]
            // =====================================================
            async function startTagStep() {
                const tagRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId("tag_yes").setLabel("Oui, arborer le tag HLR").setEmoji("1347621438210670673").setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId("tag_no").setLabel("Non, pas maintenant").setEmoji("1347621435803271218").setStyle(ButtonStyle.Secondary)
                );

                const msgTag = await channel.send({
                    content: `### ${EMOJIS.HLR} Étape 4/4 — Souhaites-tu arborer le tag **HLR** dans ton pseudo ?\n*Exemple : \`HLR ${member.displayName}\`*`,
                    components: [tagRow]
                });

                const tagCollector = msgTag.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    filter: i => i.user.id === member.id
                });

                tagCollector.on("collect", async (i) => {
                    await i.deferUpdate();

                    if (i.customId === "tag_yes") {
                        shouldAddTag = true;
                        await webhookCEO.send({
                            content: `${EMOJIS.SUCCESS} Un énorme merci pour ton soutien ! Porter nos couleurs démontre ta fierté envers **HeLoRiA**.`
                        });
                    }

                    await msgTag.delete().catch(() => {});
                    tagCollector.stop();

                    startCaptchaStep();
                });
            }

            // =====================================================
            // 6. CAPTCHA SÉCURITÉ & FINALISATION
            // =====================================================
            async function startCaptchaStep() {
                const num1 = Math.floor(Math.random() * 40) + 10;
                const num2 = Math.floor(Math.random() * 40) + 10;
                const correct = num1 + num2;

                const answers = [
                    { label: `${correct}`, isCorrect: true },
                    { label: `${correct + 4}`, isCorrect: false },
                    { label: `${correct - 3}`, isCorrect: false }
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
                    content: `### ${EMOJIS.ROBOT} Vérification de sécurité Anti-Bot :\nCalcule le résultat suivant : **${num1} + ${num2}** = ?`,
                    components: [captchaRow]
                });

                const captchaCollector = msgCaptcha.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    filter: i => i.user.id === member.id
                });

                captchaCollector.on("collect", async (i) => {
                    if (i.customId === "captcha_ok") {
                        await i.deferUpdate();
                        await msgCaptcha.delete().catch(() => {});

                        if (shouldAddTag) {
                            await member.setNickname(`HLR ${member.displayName}`.substring(0, 32)).catch(() => {});
                        }

                        const finalRolesToAdd = [...new Set([...CONFIG.ROLES_MEMBER, ...selectedNotifs])];

                        await member.roles.remove(CONFIG.ROLE_ONBOARDING).catch(() => {});
                        await member.roles.add(finalRolesToAdd).catch(() => {});

                        await webhookCEO.send({
                            content: `# ${EMOJIS.VERIFIED} Bienvenue officiellement chez HeLoRiA <@${member.id}> !\nTes rôles ont été attribués avec succès. Préparation du nettoyage du salon...`
                        });

                        // Envoi des logs
                        const logsChannel = member.guild.channels.cache.get(CONFIG.LOGS_CHANNEL_ID);
                        if (logsChannel) {
                            const embedLog = new EmbedBuilder()
                                .setColor("#22C55E")
                                .setTitle(`${EMOJIS.VERIFIED} ONBOARDING — Membre Validé`)
                                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                                .addFields(
                                    { name: "👤 Membre", value: `<@${member.id}> (\`${member.user.tag}\`)`, inline: true },
                                    { name: "🆔 ID Unique", value: `\`${member.id}\``, inline: true },
                                    { name: "🎯 Profil / Intentions", value: selectedIntent, inline: false },
                                    { name: "🎮 Jeu Principal", value: selectedGame, inline: true },
                                    { name: "🏷️ Tag Affiché", value: shouldAddTag ? "`Oui [HLR]`" : "`Non`", inline: true },
                                    { name: "🔔 Rôles Notifs", value: `\`${selectedNotifs.length} rôle(s)\``, inline: true }
                                )
                                .setFooter({ text: "HeLoRiA Esport System", iconURL: member.guild.iconURL() })
                                .setTimestamp();

                            await logsChannel.send({ embeds: [embedLog] }).catch(() => {});
                        }

                        setTimeout(async () => {
                            await channel.delete().catch(() => {});
                        }, 5000);

                    } else {
                        await i.reply({
                            content: `${EMOJIS.CROSS} Calcul incorrect, essaie à nouveau !`,
                            ephemeral: true
                        });
                    }
                });
            }

        } catch (err) {
            console.error("Erreur durant l'onboarding :", err);
        }

    });

};