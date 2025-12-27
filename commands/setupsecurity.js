const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    category: "Security",
    name: 'setupsecurity',
    description: 'Interactive security setup',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Only administrators can run the setup.');
        }

        const filter = m => m.author.id === message.author.id;
        const options = { max: 1, time: 30000, errors: ['time'] };

        try {
            // 1. Log Channel
            await message.reply('Step 1/6: Mention the **Log Channel** (or type `skip`).');
            const logMsg = await message.channel.awaitMessages(options);
            let logChannel = logMsg.first().mentions.channels.first()?.id;

            // 2. Anti-Nuke
            await message.reply('Step 2/6: Enable **Anti-Nuke**? (yes/no)');
            const anMsg = await message.channel.awaitMessages(options);
            const antinuke = anMsg.first().content.toLowerCase() === 'yes' ? 1 : 0;

            // 3. Anti-Raid
            await message.reply('Step 3/6: Enable **Anti-Raid**? (yes/no)');
            const arMsg = await message.channel.awaitMessages(options);
            const antiraid = arMsg.first().content.toLowerCase() === 'yes' ? 1 : 0;

            // 4. Anti-Spam
            await message.reply('Step 4/6: Enable **Anti-Spam**? (yes/no)');
            const asMsg = await message.channel.awaitMessages(options);
            const antispam = asMsg.first().content.toLowerCase() === 'yes' ? 1 : 0;

            // 5. Anti-Link
            await message.reply('Step 5/6: Enable **Anti-Link**? (yes/no)');
            const alMsg = await message.channel.awaitMessages(options);
            const antilink = alMsg.first().content.toLowerCase() === 'yes' ? 1 : 0;

            // 6. Staff Role
            await message.reply('Step 6/6: Mention the **Staff Role** (or type `skip`).');
            const staffMsg = await message.channel.awaitMessages(options);
            let staffRole = staffMsg.first().mentions.roles.first()?.id;

            // Update Database
            const stmt = db.prepare(`
                UPDATE guild_config SET 
                    log_channel = COALESCE(?, log_channel),
                    antinuke = ?,
                    antiraid = ?,
                    antispam = ?,
                    antilink = ?,
                    staff_role_id = COALESCE(?, staff_role_id)
                WHERE guild_id = ?
            `);
            stmt.run(logChannel || null, antinuke, antiraid, antispam, antilink, staffRole || null, message.guild.id);

            const summary = new EmbedBuilder()
                .setTitle('✅ Security Setup Complete')
                .setColor('#00FF00')
                .addFields(
                    { name: 'Log Channel', value: logChannel ? `<#${logChannel}>` : 'Unchanged', inline: true },
                    { name: 'Staff Role', value: staffRole ? `<@&${staffRole}>` : 'Unchanged', inline: true },
                    { name: 'Modules', value: `Anti-Nuke: ${antinuke ? '✅' : '❌'}\nAnti-Raid: ${antiraid ? '✅' : '❌'}\nAnti-Spam: ${antispam ? '✅' : '❌'}\nAnti-Link: ${antilink ? '✅' : '❌'}` }
                )
                .setTimestamp();

            message.reply({ embeds: [summary] });

            const { logEvent } = require('../utils/logger');
            await logEvent(message.guild, summary, 'minor');

        } catch (err) {
            message.reply('❌ Setup cancelled: You took too long to respond.');
        }
    }
};