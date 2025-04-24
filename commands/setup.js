const djs = require('discord.js');

const setup = async (guild, ctf) => {
	const role = await guild.roles.create({
		name: ctf,
		reason: `Setup command for ${ctf}`,
		color: [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)],
	});

	const category = await guild.channels.create({
		name: ctf,
		type: djs.ChannelType.GuildCategory,
		position: 2,
		permissionOverwrites: [
			{
				id: guild.id,
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

	//Random string for voice channel name
	const voiceChannels = [Math.random().toString(36).substring(2, 7), Math.random().toString(36).substring(2, 7)];

	for (const channel of channels) {
		await guild.channels.create({
			name: channel,
			type: djs.ChannelType.GuildText,
			parent: category.id,
		});
	}
	for (const voice of voiceChannels) {
		await guild.channels.create({
			name: voice,
			type: djs.ChannelType.GuildVoice,
			parent: category.id,
		});
	}
};

module.exports.message = async msg => {
	if (msg.author.id !== process.env.OWNER_ID) return;
	const ctf = msg.content.replace('!setup ', '').trim();
	if (!ctf) return msg.reply('Please provide the CTF name.');

	msg.channel.sendTyping();

	await setup(msg.guild, ctf);

	await msg.channel.send(`Done! <@${process.env.RAUL}>`);
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

	await setup(interaction.guild, ctf);

	await interaction.editReply(`Done! <@${process.env.RAUL}>`);
};

module.exports.application_command = () => {
	return new djs.SlashCommandBuilder()
		.setName('setup')
		.setDescription('Setup roles and channels for a CTF')
		.setDefaultMemberPermissions(djs.PermissionFlagsBits.Administrator)
		.setContexts(djs.InteractionContextType.Guild)
		.addStringOption(option => option.setName('ctf_name').setDescription('The name of the CTF').setRequired(true));
};
