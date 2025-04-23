const djs = require('discord.js');

module.exports.message = async msg => {
	if (msg.author.id !== process.env.OWNER_ID) return;
	const ctf = msg.content.replace('!setup ', '').trim();
	if (!ctf) return msg.reply('Please provide the CTF name.');

	msg.channel.sendTyping();

	const role = await msg.guild.roles.create({
		name: ctf,
		reason: `Setup command for ${ctf}`,
		color: [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)],
	});

	const category = await msg.guild.channels.create({
		name: ctf,
		type: djs.ChannelType.GuildCategory,
		position: 2,
		permissionOverwrites: [
			{
				id: msg.guild.id,
				deny: [djs.PermissionFlagsBits.ViewChannel],
			},
			{
				id: role.id,
				allow: [djs.PermissionFlagsBits.ViewChannel],
			},
		],
	});

	//Create 3 text channels, link-echipa, chat, solutii and a voice called voice
	const channels = ['link-echipa', 'chat', 'solutii'];
	//Make random string for voice channel name
	const voiceChannels = [Math.random().toString(36).substring(2, 7), Math.random().toString(36).substring(2, 7)];

	for (const channel of channels) {
		await msg.guild.channels.create({
			name: channel,
			type: djs.ChannelType.GuildText,
			parent: category.id,
		});
	}
	for (const voice of voiceChannels) {
		await msg.guild.channels.create({
			name: voice,
			type: djs.ChannelType.GuildVoice,
			parent: category.id,
		});
	}

	await msg.channel.send(`Done! <@${process.env.RAUL}>`);
};
