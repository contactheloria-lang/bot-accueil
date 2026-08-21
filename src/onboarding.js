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
// DICTIONNAIRE DES EMOJIS SERVEUR
// =====================================================
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
    LOGS_CHANNEL_ID: "1535026560896204922",
    ROLE_ONBOARDING: "1532058943570837656",
    ROLES_STAFF: ["1532015045800628244", "1532015039806963763"],
    ROLES_MEMBER: ["1532014889848143964", "1532014895657128098"],
    ROLES_NOTIFS: {
        anim: ["1532014836463177739", "1532014855698120794"],
        sondage: ["1532014839659237587", "1532014855698120794"],
        webtv: ["1532014842637058058", "1532014855698120794"],
        partenaire: ["1532014845963010119", "1532014855698120794"],
        reseaux: ["1532014849582829659", "1532014855698120794"],
        annonces: ["1532014852724363416", "1532014855698120794"]
    },
    CEO: { name: "HLR Logs" },
    DG: { name: "HLR Raxeur" },
    TIMEOUT_MS: 900_000 // 15 minutes par étape
};

// Désactiver proprement les composants d'un message
async function disableComponents(msg) {
    if (!msg || !msg.editable) return;
    const disabledRows = msg.components.map(row => {
        const newRow = ActionRowBuilder.from(row);
        newRow.components.forEach(c => c.setDisabled(true));
        return newRow;
    });
    await msg.edit({ components: disabledRows }).catch(() => {});
}

module.exports = (client) => {

    client.on("guildMemberAdd", async (member) => {
        try {
            await member.roles.add(CONFIG.ROLE_ONBOARDING).catch(() => {});

            let selectedNotifs = [];
            let shouldAddTag = false;
            let selectedGame = "Non spécifié";
            let selectedIntent = "Non spécifié";

            // Chemins ajustés pour correspondre à ton dossier src/assets/
            const ceoAvatarPath = path.join(__dirname, "assets", "ceo.png");
            const dgAvatarPath  = path.join(__dirname, "assets", "dg.png");
            const logoPath      = path.join(__dirname, "assets", "logo.png");

            // Permissions
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

            // Écouteur de départ du membre
            const leaveListener = async (leftMember) => {
                if (leftMember.id === member.id) {
                    client.off("guildMemberRemove", leaveListener);
                    await channel.delete().catch(() => {});
                }
            };
            client.on("guildMemberRemove", leaveListener);

            // Fonction centralisée de finalisation
            async function finalizeOnboarding({ isBypass = false, staffUser = null, forceTag = false }) {
                client.off("guildMemberRemove", leaveListener);

                const applyTag = isBypass ? forceTag : shouldAddTag;

                if (applyTag && member.manageable) {
                    await member.setNickname(`HLR ${member.displayName}`.substring(0, 32)).catch(() => {});
                }

                const finalRolesToAdd = [...new Set([
                    ...CONFIG.ROLES_MEMBER,
                    ...(isBypass ? [...CONFIG.ROLES_NOTIFS.annonces, ...CONFIG.ROLES_NOTIFS.anim] : selectedNotifs)
                ])];

                await member.roles.remove(CONFIG.ROLE_ONBOARDING).catch(() => {});
                await member.roles.add(finalRolesToAdd).catch(() => {});

                const logsChannel = member.guild.channels.cache.get(CONFIG.LOGS_CHANNEL_ID);
                if (logsChannel) {
                    const embedLog = new EmbedBuilder()
                        .setColor(isBypass ? "#FFA500" : "#22C55E")
                        .setTitle(isBypass ? `${EMOJIS.WARNING.text} ONBOARDING — Validation Manuelle (Bypass)` : `${EMOJIS.CERTIFIED.text} ONBOARDING — Membre Validé`)
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                        .addFields(
                            { name: "👤 Membre Concerné", value: `<@${member.id}> (\`${member.user.tag}\`)`, inline: true },
                            { name: isBypass ? "👑 Modérateur" : "🆔 ID Unique", value: isBypass ? `<@${staffUser.id}>` : `\`${member.id}\``, inline: true },
                            { name: "🎯 Profil / Intentions", value: selectedIntent, inline: false },
                            { name: "🎮 Jeu Principal", value: selectedGame, inline: true },
                            { name: "🏷️ Tag Affiché", value: applyTag ? "`Oui [HLR]`" : "`Non`", inline: true },
                            { name: "🔔 Rôles Notifs", value: `\`${selectedNotifs.length} rôle(s)\``, inline: true }
                        )
                        .setFooter({ text: "HeLoRiA Esport System", iconURL: member.guild.iconURL() })
                        .setTimestamp();

                    await logsChannel.send({ embeds: [embedLog] }).catch(() => {});
                }

                await channel.send(isBypass ? `✅ **Accès accordé manuellement par <@${staffUser.id}> !** Fermeture du salon dans 5 secondes...` : `# ${EMOJIS.CERTIFIED.text} Bienvenue officiellement chez HeLoRiA <@${member.id}> !\nFermeture du salon dans 5 secondes...`);

                setTimeout(async () => {
                    await channel.delete().catch(() => {});
                }, 5000);
            }

            // Webhooks
            const ceoBuffer = fs.existsSync(ceoAvatarPath) ? fs.readFileSync(ceoAvatarPath) : null;
            const dgBuffer = fs.existsSync(dgAvatarPath) ? fs.readFileSync(dgAvatarPath) : null;

            const webhookCEO = await channel.createWebhook({ name: CONFIG.CEO.name, avatar: ceoBuffer });
            const webhookDG = await channel.createWebhook({ name: CONFIG.DG.name, avatar: dgBuffer });

            // =====================================================
            // PANNEAU STAFF BYPASS
            // =====================================================
            const staffRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("staff_force_validate")
                    .setLabel("Validation Forcée Staff")
                    .setEmoji(EMOJIS.MODERATOR.id)
                    .setStyle(ButtonStyle.Danger)
            );

            const staffMsg = await channel.send({
                content: `${EMOJIS.MODERATOR.text} **CONSOLE DE MODÉRATION :** Panneau réservé au Staff & à la Direction.`,
                components: [staffRow]
            });

            const staffCollector = staffMsg.createMessageComponentCollector({ componentType: ComponentType.Button });

            staffCollector.on("collect", async (i) => {
                const isStaff = CONFIG.ROLES_STAFF.some(id => i.member.roles.cache.has(id)) || i.member.permissions.has(PermissionFlagsBits.Administrator);

                if (!isStaff) {
                    return i.reply({ content: `❌ Seul le personnel autorisé peut utiliser cette fonction.`, ephemeral: true });
                }

                if (i.customId === "staff_force_validate") {
                    const tagChoiceRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId("staff_tag_yes").setLabel("Valider + Tag [HLR]").setEmoji("✅").setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId("staff_tag_no").setLabel("Valider SANS Tag").setEmoji("❌").setStyle(ButtonStyle.Secondary)
                    );

                    await i.reply({
                        content: `${EMOJIS.WARNING.text} **Procédure de bypass d'urgence pour <@${member.id}> :**\nSouhaitez-vous attribuer automatiquement le tag officiel au pseudonyme ?`,
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
                await finalizeOnboarding({ isBypass: true, staffUser: i.user, forceTag });
            });

            // =====================================================
            // 1. BIENVENUE & PRESENTATION
            // =====================================================
            await webhookCEO.send({ content: `# ${EMOJIS.HLR_WIN.text} Bienvenue chez Team HeLoRiA, <@${member.id}> !` });

            const filesSend = [];
            let logoAttachmentName = null;

            if (fs.existsSync(logoPath)) {
                filesSend.push(new AttachmentBuilder(logoPath, { name: "logo.png" }));
                logoAttachmentName = "attachment://logo.png";
            }

            const embedPres = new EmbedBuilder()
                .setColor("#2B2D31")
                .setTitle(`${EMOJIS.CROWN.text} STRUCTURE OFFICIELLE — ESPORT & PERFORMANCE`)
                .setDescription(
                    `Ravi de te compter parmi nous ! **HeLoRiA** est une organisation e-sport ambitieuse fondée sur l'excellence, la cohésion et le développement de talents.\n\n` +
                    `Avant d'accéder à l'intégralité du serveur, nous allons configurer ton profil en **4 étapes rapides**.\n\n` +
                    `📌 **Fondateur / CEO :** <@1431661348218998948>\n` +
                    `🌐 **Soutenir la structure :** N'hésite pas à consulter nos salons d'information !`
                );

            if (logoAttachmentName) embedPres.setThumbnail(logoAttachmentName);

            await webhookCEO.send({ embeds: [embedPres], files: filesSend });

            // =====================================================
            // 2. CHOIX DU PROFIL
            // =====================================================
            const intentMenu = new StringSelectMenuBuilder()
                .setCustomId("select_intent")
                .setPlaceholder("Sélectionne ton profil principal...")
                .addOptions([
                    { label: "Joueur / Compétition", value: "intent_player", description: "Viser la performance, tournois et scrims", emoji: EMOJIS.HLR_WIN.id },
                    { label: "Créateur / Streamer", value: "intent_creator", description: "Proposer du contenu, live et événements", emoji: EMOJIS.ANIMATION.id },
                    { label: "Staff / Administration", value: "intent_staff", description: "Aider au développement de la structure", emoji: EMOJIS.TRIALMOD.id },
                    { label: "Audiovisuel / Design", value: "intent_av", description: "Montage vidéo, graphisme et créations", emoji: EMOJIS.QUILL.id },
                    { label: "Communauté / Supporter", value: "intent_community", description: "Suivre nos actualités et passer de bons moments", emoji: EMOJIS.HANDSHAKE.id }
                ]);

            const msgIntent = await channel.send({
                content: `### ${EMOJIS.TELESCOPE.text} Étape 1/4 — Quel est ton objectif principal chez HeLoRiA ?`,
                components: [new ActionRowBuilder().addComponents(intentMenu)]
            });

            const intentCollector = msgIntent.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                filter: i => i.user.id === member.id,
                time: CONFIG.TIMEOUT_MS
            });

            intentCollector.on("collect", async (i) => {
                await i.deferUpdate();
                await disableComponents(msgIntent);

                const choice = i.values[0];
                let intentAnswer = "";

                if (choice === "intent_player") {
                    selectedIntent = `${EMOJIS.HLR_WIN.text} Joueur / Compétition`;
                    intentAnswer = `✅ Excellent choix ! Nous recherchons continuellement des joueurs déterminés à atteindre le sommet.`;
                } else if (choice === "intent_creator") {
                    selectedIntent = `${EMOJIS.ANIMATION.text} Créateur / Streamer`;
                    intentAnswer = `✅ Impressionnant ! La création de contenu est une vitrine majeure pour **HeLoRiA**.`;
                } else if (choice === "intent_staff") {
                    selectedIntent = `${EMOJIS.TRIALMOD.text} Staff / Administration`;
                    intentAnswer = `✅ Parfait ! Une grande structure repose avant tout sur une équipe dédiée et rigoureuse.`;
                } else if (choice === "intent_av") {
                    selectedIntent = `${EMOJIS.QUILL.text} Audiovisuel / Design`;
                    intentAnswer = `✅ Super ! L'image de marque et l'identité visuelle sont fondamentales chez nous.`;
                } else {
                    selectedIntent = `${EMOJIS.HANDSHAKE.text} Communauté / Supporter`;
                    intentAnswer = `✅ Bienvenue ! La communauté est le véritable cœur palpitant d'**HeLoRiA**.`;
                }

                await webhookCEO.send({ content: intentAnswer });
                intentCollector.stop("completed");
                startDGStep();
            });

            intentCollector.on("end", (_, reason) => {
                if (reason === "time") {
                    channel.send("⚠️ Temps écoulé pour l'onboarding. Le salon sera fermé.").catch(() => {});
                    setTimeout(() => channel.delete().catch(() => {}), 5000);
                }
            });

            // =====================================================
            // 3. CHARTE & SÉLECTION DU JEU
            // =====================================================
            async function startDGStep() {
                const embedReg = new EmbedBuilder()
                    .setColor("#1E1F22")
                    .setTitle(`${EMOJIS.RULES.text} CHARTE ÉTHIQUE & RÈGLEMENT`)
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
                        { label: "Fortnite", value: "Fortnite", emoji: "🎮" },
                        { label: "Rocket League", value: "Rocket League", emoji: "🚗" },
                        { label: "Valorant / FPS", value: "Valorant / FPS", emoji: "🎯" },
                        { label: "Autre Jeu / Multigaming", value: "Autre", emoji: "🕹️" }
                    ]);

                const msgGame = await channel.send({
                    content: `### 🎮 Étape 2/4 — Sur quel jeu évolues-tu principalement ?`,
                    components: [new ActionRowBuilder().addComponents(gameSelect)]
                });

                const gameCollector = msgGame.createMessageComponentCollector({
                    componentType: ComponentType.StringSelect,
                    filter: i => i.user.id === member.id,
                    time: CONFIG.TIMEOUT_MS
                });

                gameCollector.on("collect", async (i) => {
                    await i.deferUpdate();
                    await disableComponents(msgGame);

                    selectedGame = i.values[0];
                    await webhookDG.send({ content: `✅ C'est bien noté pour **${selectedGame}** ! Tu vas pouvoir échanger avec nos joueurs très rapidement.` });

                    gameCollector.stop("completed");
                    startNotifStep();
                });

                gameCollector.on("end", (_, reason) => {
                    if (reason === "time") {
                        channel.send("⚠️ Temps écoulé pour l'onboarding. Le salon sera fermé.").catch(() => {});
                        setTimeout(() => channel.delete().catch(() => {}), 5000);
                    }
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
                        { label: "Annonces Officielles", value: "annonces", description: "Mises à jour et informations majeures", emoji: EMOJIS.UPDATE.id },
                        { label: "Animations & Events", value: "anim", description: "Soirées communautaires et tournois", emoji: EMOJIS.ANIMATION.id },
                        { label: "Sondages & Projets", value: "sondage", description: "Donne ton avis pour faire évoluer la team", emoji: EMOJIS.BRIEFCASE.id },
                        { label: "WebTV & Streams", value: "webtv", description: "Notifications lors des lives officiels", emoji: "📺" },
                        { label: "Partenariats & Offres", value: "partenaire", description: "Réductions et avantages exclusifs", emoji: EMOJIS.HANDSHAKE.id },
                        { label: "Réseaux Sociaux", value: "reseaux", description: "Alertes YouTube, X, TikTok et Instagram", emoji: EMOJIS.PREMIUM.id }
                    ]);

                const msgNotif = await channel.send({
                    content: `### 🔔 Étape 3/4 — Personnalise tes notifications :`,
                    components: [new ActionRowBuilder().addComponents(notifSelect)]
                });

                const notifCollector = msgNotif.createMessageComponentCollector({
                    componentType: ComponentType.StringSelect,
                    filter: i => i.user.id === member.id,
                    time: CONFIG.TIMEOUT_MS
                });

                notifCollector.on("collect", async (i) => {
                    await i.deferUpdate();
                    await disableComponents(msgNotif);

                    selectedNotifs = i.values.flatMap(notif => CONFIG.ROLES_NOTIFS[notif] || []);
                    selectedNotifs = [...new Set(selectedNotifs)];

                    notifCollector.stop("completed");
                    startTagStep();
                });

                notifCollector.on("end", (_, reason) => {
                    if (reason === "time") {
                        channel.send("⚠️ Temps écoulé pour l'onboarding. Le salon sera fermé.").catch(() => {});
                        setTimeout(() => channel.delete().catch(() => {}), 5000);
                    }
                });
            }

            // =====================================================
            // 5. APPARTENANCE AU TAG [HLR]
            // =====================================================
            async function startTagStep() {
                const tagRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId("tag_yes").setLabel("Oui, arborer le tag HLR").setEmoji(EMOJIS.CERTIFIED.id).setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId("tag_no").setLabel("Non, pas maintenant").setEmoji("❌").setStyle(ButtonStyle.Secondary)
                );

                const msgTag = await channel.send({
                    content: `### ${EMOJIS.CERTIFIED.text} Étape 4/4 — Souhaites-tu arborer le tag **HLR** dans ton pseudo ?\n*Exemple : \`HLR ${member.displayName}\`*`,
                    components: [tagRow]
                });

                const tagCollector = msgTag.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    filter: i => i.user.id === member.id,
                    time: CONFIG.TIMEOUT_MS
                });

                tagCollector.on("collect", async (i) => {
                    await i.deferUpdate();
                    await disableComponents(msgTag);

                    if (i.customId === "tag_yes") {
                        shouldAddTag = true;
                        await webhookCEO.send({ content: `✅ Un énorme merci pour ton soutien ! Porter nos couleurs démontre ta fierté envers **HeLoRiA**.` });
                    }

                    tagCollector.stop("completed");
                    startCaptchaStep();
                });

                tagCollector.on("end", (_, reason) => {
                    if (reason === "time") {
                        channel.send("⚠️ Temps écoulé pour l'onboarding. Le salon sera fermé.").catch(() => {});
                        setTimeout(() => channel.delete().catch(() => {}), 5000);
                    }
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
                    content: `### 🤖 Vérification de sécurité Anti-Bot :\nCalcule le résultat suivant : **${num1} + ${num2}** = ?`,
                    components: [captchaRow]
                });

                const captchaCollector = msgCaptcha.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    filter: i => i.user.id === member.id,
                    time: CONFIG.TIMEOUT_MS
                });

                captchaCollector.on("collect", async (i) => {
                    if (i.customId === "captcha_ok") {
                        await i.deferUpdate();
                        await disableComponents(msgCaptcha);

                        captchaCollector.stop("completed");
                        await finalizeOnboarding({ isBypass: false });
                    } else {
                        await i.reply({ content: `❌ Calcul incorrect, essaie à nouveau !`, ephemeral: true });
                    }
                });

                captchaCollector.on("end", (_, reason) => {
                    if (reason === "time") {
                        channel.send("⚠️ Temps écoulé pour l'onboarding. Le salon sera fermé.").catch(() => {});
                        setTimeout(() => channel.delete().catch(() => {}), 5000);
                    }
                });
            }

        } catch (err) {
            console.error("Erreur durant l'onboarding :", err);
        }
    });
};