const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');
const { getEmoji } = require('../helpers/emoji');

module.exports = {
    name: 'pipeline',
    description: 'Manage the escalating punishment pipeline',
    highRisk: true,
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply(`${getEmoji('ERROR')} Administrators only.`);
        }

        const sub = args[0]?.toLowerCase();
        if (sub === 'show') {
            const config = db.prepare('SELECT punishment_pipeline FROM guild_config WHERE guild_id = ?').get(message.guild.id);
            const pipeline = config?.punishment_pipeline || 'warn,mute10,mute60,kick,ban';
            return message.reply(`${getEmoji('PIPELINE')} **Current Pipeline:** \`${pipeline}\` (Keywords: warn, mute10, mute60, kick, ban)`);
        }

        if (sub === 'set') {
            const pipelineStr = args[1];
            if (!pipelineStr) return message.reply('Usage: `s!pipeline set <warn,mute10,mute60,kick,ban>`');
            
            const keywords = ['warn', 'mute10', 'mute60', 'kick', 'ban'];
            const steps = pipelineStr.split(',').map(s => s.trim().toLowerCase());
            
            if (steps.some(s => !keywords.includes(s))) {
                return message.reply(`${getEmoji('ERROR')} Invalid keyword. Use: \`warn, mute10, mute60, kick, ban\``);
            }

            db.prepare('UPDATE guild_config SET punishment_pipeline = ? WHERE guild_id = ?').run(steps.join(','), message.guild.id);
            return message.reply(`${getEmoji('SUCCESS')} **Punishment pipeline updated to:** \`${steps.join(', ')}\``);
        }

        message.reply('Usage: `s!pipeline <show|set>`');
    }
};