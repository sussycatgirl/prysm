const Discord = require('discord.js');
const { exec } = require("child_process");
var hastebin = require('hastebin')

module.exports = {
    name: 'shell',
    aliases: ["run", "r"],
    flag: 10000,
    execute(message, args) {
        if (args.length == 0) return message.channel.send("how about telling me what to do bitch");
        exec(args.join(" "), (error, stdout, stderr) => {
            let embed = new Discord.MessageEmbed();

            if (stdout && (error || stderr)) {
                embed.addField('stdout', stdout);
                embed.setColor('ff0000');
            } else if (stdout) embed.setDescription(stdout);
            
            if (stderr) {
                embed.addField('stderr', stderr);
                embed.setColor('ff0000');
            }

            if (error) {
                embed.addField('Error', error);
                embed.setColor('ff0000');
            }
            
            message.channel.send(embed).catch(e => {
                // Upload to hastebin
                let uploaded = false;
                let failed = false;
                hastebin.createPaste(`stdout: \n${stdout ? "    " + stdout.replace(/\n/g, "\n    ") : "No output"}\n\nstderr: \n${stderr ? "    " + stderr.replace(/\n/g, "\n    ") : "No output"}\n\nerror: \n${error ? "    " + error.replace(/\n/g, "\n    ") : "No output"}`, {
                    raw: true,
                    contentType: 'text/plain',
                    server: 'https://hastebin.janderedev.xyz'
                  })
                    .then((url) => {
                        uploaded = url;
                        console.log(url);
                        send();
                    })
                    .catch((requestError) => {
                        failed = requestError;
                        console.log(requestError);
                        send();
                    })

                    function send() {
                    message.channel.send(
                        new Discord.MessageEmbed()
                            .setTitle('Failed to display output')
                            .setColor('ff0000')
                            .setDescription(`${e}\n\n${uploaded ? `The output has been uploaded [here](${uploaded}).` : failed ? `Failed to upload to hastebin: ${failed}` : "Failed to upload to hastebin."}`) // to do: actually upload command output somewhere 
                    );
                }
            });
        });
    }
}

module.exports.devCommand = true;
