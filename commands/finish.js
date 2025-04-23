const djs = require('discord.js');

module.exports.message = async msg => {
	if (msg.author.id !== process.env.OWNER_ID) return;
	const ctf = msg.content.replace('!finish ', '').trim();
	if (!ctf) return msg.reply('Please provide the CTF name.');

	msg.channel.sendTyping();

	const category = msg.guild.channels.cache.find(c => c.name === ctf && c.type === djs.ChannelType.GuildCategory);

	if (!category) return msg.reply(`Category ${ctf} not found.`);

	await category.setName(`[finished] ${ctf}`);

	const role = msg.guild.roles.cache.find(r => r.name === ctf);
	if (role) {
		await role.delete();
	} else {
		await msg.channel.send(`Done! <@${process.env.OWNER_ID}>\nBut role ${ctf} not found`);
		console.log(`Role ${ctf} not found`);
	}

	await msg.channel.send(`Done! <@${process.env.OWNER_ID}>`);
};
