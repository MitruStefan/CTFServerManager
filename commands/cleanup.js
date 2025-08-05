const djs = require('discord.js');

module.exports.message = async msg => {
	const messages = await msg.channel.messages.fetch({ limit: 30 });

	const botMessages = messages.filter(
		m => msg.content.startsWith('$ai') || msg.content.startsWith('!gpt') || m.author.id === process.env.CLIENT_ID,
	);

	const botMessagesCount = botMessages.size;

	msg.delete();

	if (!msg.content.includes('100%'))
		return msg.reply(
			`I would delete ${botMessagesCount} messages, but you didn't include "100%" in your message. You sure you want to delete so many?`,
		);

	msg.channel.bulkDelete(botMessages);
	msg.channel.send('Deleted ' + botMessagesCount + ' messages.').then(msg => {
		setTimeout(() => {
			msg.delete();
		}, 5000);
	});
};
