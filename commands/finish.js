const djs = require('discord.js');

module.exports.message = async msg => {
	if (msg.author.id !== process.env.OWNER_ID) return;
	const ctf = msg.content.replace('!finish ', '').trim();
	if (!ctf) return msg.reply('Please provide the CTF name.');

	msg.channel.sendTyping();

	const category = msg.guild.channels.cache.find(c => c.name === ctf && c.type === djs.ChannelType.GuildCategory);

	if (!category) return msg.reply(`Category ${ctf} not found.`);

	await Promise.all([
		category.setName(`[finished] ${ctf}`),
		category.permissionOverwrites.set([
			{
				id: msg.guild.id,
				allow: [djs.PermissionFlagsBits.ViewChannel],
			},
		]),
	]);

	const role = msg.guild.roles.cache.find(r => r.name === ctf);
	if (role) {
		await role.delete();
	} else {
		await msg.channel.send(`Done! <@${process.env.OWNER_ID}>\nBut role ${ctf} not found`);
		console.log(`Role ${ctf} not found`);
	}

	const childChannels = msg.guild.channels.cache.filter(ch => ch.parentId === category.id);
	await Promise.all(childChannels.map(ch => ch.lockPermissions().catch(() => null)));

	await msg.channel.send(`Done! <@${process.env.OWNER_ID}>`);
};

module.exports.interaction = async interaction => {
	if (interaction.user.id !== process.env.OWNER_ID) {
		return interaction.reply({
			content: 'You are not authorized to use this command.',
			flags: [djs.MessageFlags.Ephemeral],
		});
	}
	const ctf = interaction.options.getString('ctf_name');

	await interaction.deferReply();

	const category = interaction.guild.channels.cache.find(c => c.name === ctf && c.type === djs.ChannelType.GuildCategory);

	if (!category) return interaction.editReply(`Category ${ctf} not found.`);

	await Promise.all([
		category.setName(`[finished] ${ctf}`),
		category.permissionOverwrites.set([
			{
				id: interaction.guild.id,
				allow: [djs.PermissionFlagsBits.ViewChannel],
			},
		]),
	]);

	const role = interaction.guild.roles.cache.find(r => r.name === ctf);
	if (role) {
		await role.delete();
	} else {
		await interaction.editReply(`Done! <@${process.env.OWNER_ID}>\nBut role ${ctf} not found`);
		console.log(`Role ${ctf} not found`);
	}

	const childChannels = interaction.guild.channels.cache.filter(ch => ch.parentId === category.id);
	await Promise.all(childChannels.map(ch => ch.lockPermissions().catch(() => null)));

	await interaction.editReply(`Done! <@${process.env.OWNER_ID}>`);
};

module.exports.application_command = () => {
	return new djs.SlashCommandBuilder()
		.setName('finish')
		.setDescription('Mark a CTF as finished, deleting the role and renaming the category')
		.setDefaultMemberPermissions(djs.PermissionFlagsBits.Administrator)
		.setContexts(djs.InteractionContextType.Guild)
		.addStringOption(option => option.setName('ctf_name').setDescription('The name of the CTF to finish').setRequired(true));
};
