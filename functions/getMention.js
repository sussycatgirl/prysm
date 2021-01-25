const { client } = require("../bot");

module.exports.getUserFromMention = (mention, isRole) => {
    if (!mention) return;

	if (mention.startsWith('<@') && mention.endsWith('>')) {
		mention = mention.slice(2, -1);

		if (mention.startsWith(isRole ? '&' : '!')) {
			mention = mention.slice(1);
		}

		return isRole ? mention : client.users.cache.get(mention);
    }
    else return isRole ? mention : client.users.cache.get(mention);
}