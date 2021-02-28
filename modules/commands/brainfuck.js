const Discord = require('discord.js');
const { run: runBrainfuck } = require('../../functions/brainfuck');

module.exports.name         = 'brainfuck';
module.exports.aliases      = ['bf'];
module.exports.description  = 'Run brainfuck code. (Somewhat broken)';
module.exports.syntax       = 'brainfuck [Brainfuck code or \'chars\']';
module.exports.guildOnly    = false;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES'];
module.exports.userPerms    = [];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = (message, args) => {
    if (args[0]?.toLowerCase() == 'chars') {
        let char_table =
        `A   B   C   D   E   F   G   H   I   J   K   L   M   N   O   P   Q   R   S   T   U   V   W   X   Y   Z\n` +
        `065 066 067 068 069 070 071 072 073 074 075 076 077 078 079 080 081 082 083 084 085 086 087 088 089 090\n` +
        `\n` +
        `a   b   c   d   e   f   g   h   i   j   k   l   m   n   o   p   q   r   s   t   u   v   w   x   y   z\n` +
        `097 098 099 100 101 102 103 104 105 106 107 108 109 110 111 112 113 114 115 116 117 118 119 120 121 122\n` +
        `\n` +
        `0   1   2   3   4   5   6   7   8   9   +   -   *   /   %   <   =   >\n` +
        `048 049 050 051 052 053 054 055 056 057 053 055 052 057 045 060 061 062\n` +
        `\n` +
        `!   "   #   $   &   '   (   )   ,   .   :   ;   ?   @   [   \\   ]   ^   _   \`   {   |   }   ~\n` +
        `041 042 043 044 046 047 050 051 054 056 058 059 063 064 091 092 093 094 095 096 123 124 125 126\n`
        
        message.channel.send(
            `\`\`\`diff\n${char_table}\`\`\``
        );
    } else {
        try {
            let { out, outStr, stats } = runBrainfuck(args.join(' '));
            outStr = outStr.replace(/\`/g, '\\`');
            
            message.channel.send(`${outStr}\n\n\`${out.join(', ').substr(0, 1000) || 'No output'}\`\n\nExecuted instructions: ${stats.executions}`);
        } catch(e) {
            message.channel.send(`\`\`\`brainfuck\n${e}\`\`\``);
        }
    }
}