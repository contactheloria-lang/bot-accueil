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
            // PERMISSIONS SECURISEES (Fix InvalidType Crash)
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

            // Ajout sécurisé des rôles Staff uniquement s'ils existent dans la guilde
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
            // BOUTON DE BYPASS STAFF (ADMINISTRATION)
            // =====================================================
            const staffRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("staff_force_validate")
                    .setLabel("⚡ Validation Forcée (Staff)")
                    .setStyle(ButtonStyle.Danger)
            );

            const staffMsg = await channel.send({
                content: `🛠️ **Panneau d'Administration :** Réservé aux membres de la direction & modération.`,
                components: [staffRow]
            });

            const staffCollector = staffMsg.createMessageComponentCollector({
                componentType: ComponentType.Button
            });

            staffCollector.on("collect", async (i) => {
                const isStaff = CONFIG.ROLES_STAFF.some(id => i.member.roles.cache.has(id)) || i.member.permissions.has(PermissionFlagsBits.Administrator);

                if (!isStaff) {
                    return i.reply({ content: "❌ Seul le personnel autorisé peut exécuter cette action.", ephemeral: true });
                }

                if (i.customId === "staff_force_validate") {
                    const tagChoiceRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId("staff_tag_yes").setLabel("Valider AVEC Tag [HLR]").setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId("staff_tag_no").setLabel("Valider SANS Tag").setStyle(ButtonStyle.Secondary)
                    );

                    await i.reply({
                        content: `⚙️ **Procédure de validation manuelle pour ${member.user.tag}** :\nSouhaitez-vous attribuer le tag officiel au pseudonyme ?`,
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

                await channel.send(`✅ **Accès accordé manuellement par <@${i.user.id}> !** Nettoyage du salon dans 5 secondes...`);

                const logsChannel = member.guild.channels.cache.get(CONFIG.LOGS_CHANNEL_ID);
                if (logsChannel) {
                    const embedLog = new EmbedBuilder()
                        .setColor("#FFA500")
                        .setTitle("🛡️ Système d'Accueil — Validation Manuelle")
                        .setThumbnail(member.user.displayAvatarURL())
                        .addFields(
                            { name: "👤 Membre Concerné", value: `<@${member.id}> (\`${member.user.tag}\`)`, inline: true },
                            { name: "👑 Modérateur", value: `<@${i.user.id}>`, inline: true },
                            { name: "🏷️ Tag Structure", value: forceTag ? "Activé" : "Désactivé", inline: true }
                        )
                        .setTimestamp();

                    await logsChannel.send({ embeds: [embedLog] }).catch(() => {});
                }

                setTimeout(async () => {
                    await channel.delete().catch(() => {});
                }, 5000);
            });

            // =====================================================
            // 1. PRÉSENTATION OFFICIELLE
            // =====================================================
            await webhookCEO.send({
                content: `Bienvenue parmi nous <@${member.id}> !`
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
                .setTitle("🏆 Team HeLoRiA — Esport & Performance")
                .setDescription(
                    `Ravi de t'accueillir sur notre serveur officiel !\n\n` +
                    `**HeLoRiA** est un collectif axé sur l'ambition, la compétition et la cohésion communautaire. Que tu sois ici pour performer, créer du contenu ou simplement échanger avec des passionnés, tu es au bon endroit.\n\n` +
                    `📌 **Fondateur :** <@1431661348218998948>`
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
                    { label: "Joueur / Compétition", value: "intent_player", description: "Performer, faire des tournois et scrims", emoji: "🎮" },
                    { label: "Créateur / Streamer", value: "intent_creator", description: "Proposer du contenu, faire des lives", emoji: "🎥" },
                    { label: "Staff / Modération", value: "intent_staff", description: "Aider au développement de la structure", emoji: "🛡️" },
                    { label: "Audiovisuel / Graphiste", value: "intent_av", description: "Gérer le montage, le design ou l'image", emoji: "🎨" },
                    { label: "Communauté / Fan", value: "intent_community", description: "Suivre la structure et passer de bons moments", emoji: "💬" }
                ]);

            const msgIntent = await channel.send({
                content: `🔍 **Étape 1/4 :** Quel est le motif principal de ta venue parmi nous ?`,
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
                    selectedIntent = "🎮 Joueur / Compétition";
                    intentAnswer = "Excellent ! Nous sommes constamment à la recherche de profils déterminés à viser le sommet.";
                } else if (choice === "intent_creator") {
                    selectedIntent = "🎥 Créateur / Streamer";
                    intentAnswer = "Ravi de l'apprendre ! La visibilité et le contenu sont des piliers majeurs chez HeLoRiA.";
                } else if (choice === "intent_staff") {
                    selectedIntent = "🛡️ Staff / Modération";
                    intentAnswer = "Top ! Une structure forte repose sur une équipe d'encadrement solide et passionnée.";
                } else if (choice === "intent_av") {
                    selectedIntent = "🎨 Audiovisuel / Graphiste";
                    intentAnswer = "Génial ! L'identité visuelle est primordiale pour faire rayonner nos joueurs.";
                } else {
                    selectedIntent = "💬 Communauté / Fan";
                    intentAnswer = "Bienvenue à toi ! La communauté est le cœur palpitant d'HeLoRiA.";
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
                    .setTitle("📜 Charte & Règles de la Structure")
                    .setDescription(
                        `• **Respect & Entraide :** Un comportement irréprochable est exigé.\n` +
                        `• **Sécurité :** Zéro tolérance pour le spam, le harcèlement ou la publicité sauvage.\n` +
                        `• **Cohérence :** Merci d'utiliser les salons adaptés à tes besoins.`
                    );

                await webhookDG.send({
                    content: "Afin de garantir une bonne expérience pour tous, voici nos principes fondamentaux :",
                    embeds: [embedReg]
                });

                const gameSelect = new StringSelectMenuBuilder()
                    .setCustomId("select_game")
                    .setPlaceholder("Sélectionne ton jeu principal...")
                    .addOptions([
                        { label: "Fortnite", value: "Fortnite", emoji: "🪂" },
                        { label: "Rocket League", value: "Rocket League", emoji: "🚗" },
                        { label: "Valorant / FPS", value: "Valorant / FPS", emoji: "🎯" },
                        { label: "Autre discipline", value: "Autre", emoji: "🎲" }
                    ]);

                const msgGame = await channel.send({
                    content: "🎮 **Étape 2/4 :** Quel est ton jeu de prédilection ?",
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
                        content: `C'est noté pour **${selectedGame}** ! Tu trouveras des équipiers très rapidement.`
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
                    .setPlaceholder("Choisis tes notifications...")
                    .setMinValues(0)
                    .setMaxValues(6)
                    .addOptions([
                        { label: "Annonces Officielle", value: "annonces", description: "Mises à jour stratégiques de la structure", emoji: "📢" },
                        { label: "Animations & Events", value: "anim", description: "Tournois internes et soirées communautaires", emoji: "🎉" },
                        { label: "Sondages", value: "sondage", description: "Donne ton avis sur le futur du serveur", emoji: "📊" },
                        { label: "WebTV & Lives", value: "webtv", description: "Alertes lors des streams officiels", emoji: "📡" },
                        { label: "Partenariats", value: "partenaire", description: "Offres et avantages de nos partenaires", emoji: "🤝" },
                        { label: "Réseaux Sociaux", value: "reseaux", description: "Nouveaux posts X, TikTok et YouTube", emoji: "📲" }
                    ]);

                const msgNotif = await channel.send({
                    content: "🔔 **Étape 3/4 :** Coche les alertes que tu souhaites recevoir :",
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
            // 5. APPARTENANCE AU TAG
            // =====================================================
            async function startTagStep() {
                const tagRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId("tag_yes").setLabel("Oui, avec fierté !").setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId("tag_no").setLabel("Non, pas pour le moment").setStyle(ButtonStyle.Secondary)
                );

                const msgTag = await channel.send({
                    content: `🏷️ **Étape 4/4 :** Souhaites-tu porter le prefixe **HLR** dans ton pseudo sur le serveur ? (Exemple : \`HLR ${member.displayName}\`)`,
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
                            content: "Un grand merci pour ton soutien et ta fierté d'arborer nos couleurs !"
                        });
                    }

                    await msgTag.delete().catch(() => {});
                    tagCollector.stop();

                    startCaptchaStep();
                });
            }

            // =====================================================
            // 6. CAPTCHA ANTI-BOT & FINALISATION
            // =====================================================
            async function startCaptchaStep() {
                const num1 = Math.floor(Math.random() * 50) + 10;
                const num2 = Math.floor(Math.random() * 50) + 10;
                const correct = num1 + num2;

                const answers = [
                    { label: `${correct}`, isCorrect: true },
                    { label: `${correct + 3}`, isCorrect: false },
                    { label: `${correct - 5}`, isCorrect: false }
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
                    content: `🤖 **Sécurité :** Pour valider ton accès, résous ce calcul mental simple : **${num1} + ${num2}** = ?`,
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
                            content: `🎉 Configuration terminée ! Tes rôles ont été attribués. Bienvenue officiellement chez **HeLoRiA** <@${member.id}> !`
                        });

                        const logsChannel = member.guild.channels.cache.get(CONFIG.LOGS_CHANNEL_ID);
                        if (logsChannel) {
                            const embedLog = new EmbedBuilder()
                                .setColor("#22C55E")
                                .setTitle("📥 Nouvel Arrivant Validé")
                                .setThumbnail(member.user.displayAvatarURL())
                                .addFields(
                                    { name: "👤 Membre", value: `<@${member.id}> (\`${member.user.tag}\`)`, inline: true },
                                    { name: "🆔 ID Unique", value: `\`${member.id}\``, inline: true },
                                    { name: "🎯 Profil / Métier", value: selectedIntent, inline: false },
                                    { name: "🎮 Discipline", value: selectedGame, inline: true },
                                    { name: "🏷️ Tag Affiché", value: shouldAddTag ? "Oui" : "Non", inline: true },
                                    { name: "🔔 Notifs Sélectionnées", value: `${selectedNotifs.length} rôle(s)`, inline: true }
                                )
                                .setTimestamp();

                            await logsChannel.send({ embeds: [embedLog] }).catch(() => {});
                        }

                        setTimeout(async () => {
                            await channel.delete().catch(() => {});
                        }, 5000);

                    } else {
                        await i.reply({
                            content: "❌ Calcul incorrect, essaie à nouveau !",
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