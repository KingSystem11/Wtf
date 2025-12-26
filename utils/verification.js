// Lightweight CAPTCHA-style Verification System
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

const VERIFICATION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 3;

// Generate random code (5-6 characters, mix of letters and numbers)
function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = Math.random() > 0.5 ? 5 : 6;
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

module.exports = {
    generateCode,
    MAX_ATTEMPTS,

    async createVerificationChallenge(member) {
        const code = generateCode();
        const expiresAt = new Date(Date.now() + VERIFICATION_TIMEOUT).toISOString();
        
        try {
            db.prepare(`
                INSERT INTO verification_codes (guild_id, user_id, code, attempts, expires_at)
                VALUES (?, ?, ?, 0, ?)
            `).run(member.guild.id, member.id, code, expiresAt);
            
            return code;
        } catch (err) {
            console.error('Failed to create verification challenge:', err);
            return null;
        }
    },

    async verifyCode(member, submittedCode) {
        try {
            // Get the active code for this user
            const record = db.prepare(`
                SELECT code, attempts, expires_at FROM verification_codes
                WHERE guild_id = ? AND user_id = ? AND verified = 0
                ORDER BY created_at DESC LIMIT 1
            `).get(member.guild.id, member.id);

            if (!record) {
                return { success: false, message: 'No active verification challenge found.' };
            }

            // Check if expired
            if (new Date(record.expires_at) < new Date()) {
                db.prepare('UPDATE verification_codes SET verified = -1 WHERE guild_id = ? AND user_id = ?').run(member.guild.id, member.id);
                return { success: false, message: 'Verification code expired. Request a new one with `s!verify` in the verification channel.' };
            }

            // Increment attempts
            const newAttempts = record.attempts + 1;
            
            if (submittedCode.toUpperCase() === record.code.toUpperCase()) {
                // Correct code - mark as verified and assign role
                db.prepare('UPDATE verification_codes SET verified = 1, verified_at = CURRENT_TIMESTAMP WHERE guild_id = ? AND user_id = ?').run(member.guild.id, member.id);
                
                // Assign verified role
                const config = db.prepare('SELECT verified_role_id FROM guild_config WHERE guild_id = ?').get(member.guild.id);
                if (config?.verified_role_id) {
                    try {
                        const role = await member.guild.roles.fetch(config.verified_role_id);
                        if (role) {
                            await member.roles.add(role);
                        }
                    } catch (e) {
                        console.error('Failed to assign verified role:', e);
                    }
                }
                
                return { success: true, message: 'Verification successful! Welcome to the server.' };
            } else {
                // Wrong code
                db.prepare('UPDATE verification_codes SET attempts = ? WHERE guild_id = ? AND user_id = ?').run(newAttempts, member.guild.id, member.id);
                
                if (newAttempts >= MAX_ATTEMPTS) {
                    db.prepare('UPDATE verification_codes SET failed = 1 WHERE guild_id = ? AND user_id = ?').run(member.guild.id, member.id);
                    return { success: false, message: `Too many failed attempts (${newAttempts}/${MAX_ATTEMPTS}). A moderator will review.`, failed: true };
                }
                
                return { success: false, message: `Incorrect code. ${MAX_ATTEMPTS - newAttempts} attempts remaining.` };
            }
        } catch (err) {
            console.error('Verification error:', err);
            return { success: false, message: 'Verification system error. Please contact a moderator.' };
        }
    },

    async sendVerificationChallenge(member) {
        try {
            const code = await this.createVerificationChallenge(member);
            if (!code) return false;

            // Send DM with code
            const message = `
🔐 **Welcome to ${member.guild.name}!**

To verify and gain access, please reply with your verification code:

\`\`\`
${code}
\`\`\`

📋 Use the command: \`s!verify ${code}\`

This code expires in 5 minutes.
            `.trim();

            await member.send(message);
            return true;
        } catch (err) {
            console.error('Failed to send verification challenge:', err);
            return false;
        }
    },

    async logVerificationAction(guild, member, action, details = '') {
        try {
            const config = db.prepare('SELECT log_channel FROM guild_config WHERE guild_id = ?').get(guild.id);
            if (!config?.log_channel) return;

            const { logEvent } = require('./logger');
            
            const embed = {
                title: '🔐 Verification Action',
                color: action === 'verified' ? 0x00FF00 : 0xFF0000,
                fields: [
                    { name: 'User', value: `**${member.user.tag}** (${member.id})`, inline: true },
                    { name: 'Action', value: action.toUpperCase(), inline: true },
                ],
                timestamp: new Date(),
            };

            if (details) {
                embed.fields.push({ name: 'Details', value: details, inline: false });
            }

            await logEvent(guild, embed, 'normal');
        } catch (err) {
            console.error('Failed to log verification action:', err);
        }
    },
};
