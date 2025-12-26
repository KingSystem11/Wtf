module.exports = {
    en: {
        // General
        help_title: '👻 Spectre Command List',
        help_footer: '👻 Spectre Security | ⭐ = Premium Feature',
        error_title: '❌ Execution Error',
        error_desc: 'An unexpected error occurred while running this command.',
        premium_warn: '❌ This feature requires a **Premium** subscription.',
        lang_set: '✅ Language set to English.',
        no_perm: '❌ You do not have permission to use this command.',
        
        // Security Violations - Anti-Spam
        antispam_action: 'Spam detected (Pipeline Escalation)',
        antispam_log_title: '📢 Anti-Spam Triggered',
        antispam_log_desc: 'User **{user}** sent {count} messages in {interval}s.',
        
        // Security Violations - Anti-Link
        antilink_action: 'Unauthorized link (Pipeline Escalation)',
        antilink_log_title: '🔗 Anti-Link Triggered',
        antilink_log_desc: 'User **{user}** posted unauthorized link/invite.',
        
        // Security Violations - Anti-Mention-Everyone
        antieveryone_action: 'Unauthorized mention of @everyone/@here',
        antieveryone_log_title: '⚠️ Anti-@everyone Triggered',
        antieveryone_log_desc: 'User **{user}** attempted mass mention.',
        
        // Security Violations - Word Filter
        wordfilter_action: 'Word filter matched: {pattern}',
        wordfilter_log_title: '🚫 Word Filter Triggered',
        wordfilter_log_desc: 'User **{user}** triggered filter: {pattern}',
        
        // Security Violations - AI Filter
        aifilter_action: 'Content Moderation ({categories})',
        aifilter_log_title: '🤖 AI Filter Triggered',
        aifilter_log_desc: 'User **{user}** sent flagged content: {categories}',
        
        // Beast Mode
        beast_log_title: '🦁 BEAST MODE: BETRAYAL DETECTED',
        beast_log_desc: 'Whitelisted user **{user}** exceeded **{type}** limit ({count}/{limit}).',
        beast_perms_removed: 'Administrative permissions revoked.',
        
        // Whitelist
        whitelist_updated: '✅ Whitelist updated for **{user}**',
        whitelist_modules: 'Enabled Modules',
        whitelist_cancelled: 'Whitelist setup cancelled.',
        whitelist_expired: '⏱️ Whitelist session expired',
        
        // Token Leak Detection
        token_leak_title: '⚠️ Potential Token Leak',
        token_leak_desc: 'User **{user}** sent a message with a bot token.',
        
        // Global Ban
        globalban_log_title: '🌍 Global Ban Auto-Triggered',
        globalban_log_desc: 'User **{user}** is on global ban list. Reason: {reason}',
        globalban_alert: 'User **{user}** is on global ban list but auto-ban failed.',
        
        // Verification
        verify_code_sent: '🔐 Verification code sent to **{user}** via DM.',
    },
    hi: {
        // General
        help_title: '👻 स्पेक्टर कमांड सूची',
        help_footer: '👻 स्पेक्टर सुरक्षा | ⭐ = प्रीमियम सुविधा',
        error_title: '❌ निष्पादन त्रुटि',
        error_desc: 'इस कमांड को चलाते समय एक अप्रत्याशित त्रुटि हुई।',
        premium_warn: '❌ इस सुविधा के लिए **प्रीमियम** सदस्यता की आवश्यकता है।',
        lang_set: '✅ भाषा हिंदी में सेट की गई है।',
        no_perm: '❌ आपके पास इस कमांड का उपयोग करने की अनुमति नहीं है।',
        
        // Security Violations - Anti-Spam
        antispam_action: 'स्पैम का पता चला (पाइपलाइन एस्केलेशन)',
        antispam_log_title: '📢 एंटी-स्पैम सक्रिय किया गया',
        antispam_log_desc: 'उपयोगकर्ता **{user}** ने {interval}s में {count} संदेश भेजे।',
        
        // Security Violations - Anti-Link
        antilink_action: 'अनुमति रहित लिंक (पाइपलाइन एस्केलेशन)',
        antilink_log_title: '🔗 एंटी-लिंक सक्रिय किया गया',
        antilink_log_desc: 'उपयोगकर्ता **{user}** ने अनुमति रहित लिंक/निमंत्रण पोस्ट किया।',
        
        // Security Violations - Anti-Mention-Everyone
        antieveryone_action: '@everyone/@here का अनुमति रहित उल्लेख',
        antieveryone_log_title: '⚠️ एंटी-@everyone सक्रिय किया गया',
        antieveryone_log_desc: 'उपयोगकर्ता **{user}** ने सामूहिक उल्लेख करने का प्रयास किया।',
        
        // Security Violations - Word Filter
        wordfilter_action: 'शब्द फिल्टर मेल खाया: {pattern}',
        wordfilter_log_title: '🚫 शब्द फिल्टर सक्रिय किया गया',
        wordfilter_log_desc: 'उपयोगकर्ता **{user}** ने फिल्टर को सक्रिय किया: {pattern}',
        
        // Security Violations - AI Filter
        aifilter_action: 'सामग्री मॉडरेशन ({categories})',
        aifilter_log_title: '🤖 AI फिल्टर सक्रिय किया गया',
        aifilter_log_desc: 'उपयोगकर्ता **{user}** ने फ़्लैग की गई सामग्री भेजी: {categories}',
        
        // Beast Mode
        beast_log_title: '🦁 बीस्ट मोड: विश्वासघात का पता चला',
        beast_log_desc: 'व्हाइटलिस्ट किया गया उपयोगकर्ता **{user}** ने **{type}** सीमा ({count}/{limit}) को पार किया।',
        beast_perms_removed: 'प्रशासनिक अनुमतियाँ रद्द कर दी गईं।',
        
        // Whitelist
        whitelist_updated: '✅ **{user}** के लिए व्हाइटलिस्ट अपडेट किया गया',
        whitelist_modules: 'सक्षम मॉड्यूल',
        whitelist_cancelled: 'व्हाइटलिस्ट सेटअप रद्द किया गया।',
        whitelist_expired: '⏱️ व्हाइटलिस्ट सत्र समाप्त हो गया',
        
        // Token Leak Detection
        token_leak_title: '⚠️ संभावित टोकन लीक',
        token_leak_desc: 'उपयोगकर्ता **{user}** ने बॉट टोकन के साथ एक संदेश भेजा।',
        
        // Global Ban
        globalban_log_title: '🌍 वैश्विक प्रतिबंध स्वचालित रूप से सक्रिय किया गया',
        globalban_log_desc: 'उपयोगकर्ता **{user}** वैश्विक प्रतिबंध सूची में है। कारण: {reason}',
        globalban_alert: 'उपयोगकर्ता **{user}** वैश्विक प्रतिबंध सूची में है लेकिन स्वचालित प्रतिबंध विफल रहा।',
        
        // Verification
        verify_code_sent: '🔐 **{user}** को DM के माध्यम से सत्यापन कोड भेजा गया।',
    },
    sp: {
        help_title: '👻 Lista de Comandos de Spectre',
        help_footer: '👻 Seguridad Spectre | ⭐ = Función Premium',
        error_title: '❌ Error de Ejecución',
        error_desc: 'Ocurrió un error inesperado al ejecutar este comando.',
        premium_warn: '❌ Esta función requiere una suscripción **Premium**.',
        lang_set: '✅ Idioma configurado a Español.',
        no_perm: '❌ No tienes permiso para usar este comando.'
    },
    ru: {
        help_title: '👻 Список команд Spectre',
        help_footer: '👻 Безопасность Spectre | ⭐ = Премиум-функция',
        error_title: '❌ Ошибка выполнения',
        error_desc: 'Произошла непредвиденная ошибка при выполнении этой команды.',
        premium_warn: '❌ Эта функция требует подписки **Premium**.',
        lang_set: '✅ Язык установлен на Русский.',
        no_perm: '❌ У вас нет прав для использования этой команды.'
    },
    ge: {
        help_title: '👻 Spectre Befehlsliste',
        help_footer: '👻 Spectre Sicherheit | ⭐ = Premium-Funktion',
        error_title: '❌ Ausführungsfehler',
        error_desc: 'Beim Ausführen dieses Befehls ist ein unerwarteter Fehler aufgetreten.',
        premium_warn: '❌ Diese Funktion erfordert ein **Premium**-Abonnement.',
        lang_set: '✅ Sprache auf Deutsch eingestellt.',
        no_perm: '❌ Du hast keine Berechtigung, diesen Befehl zu verwenden.'
    }
};