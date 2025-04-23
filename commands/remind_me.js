const djs = require('discord.js');

module.exports.message = async msg => {
	const args = msg.content.trim().split(/\s+/).slice(1);
	const time = args[0];
	const reminder = args.slice(1).join(' ');
	if (!time || !reminder) return msg.reply('Please provide a time and reminder message after !remind_me');
	if (isNaN(time)) return msg.reply('Please provide a valid time in minutes after !remind_me');
	await msg.react('👍');
	setTimeout(() => {
		msg.reply(`<@${msg.author.id}>\n${reminder}`);
	}, time * 1000 * 60);
};

module.exports.interaction = async interaction => {
	const time = interaction.options.getInteger('time');
	const reminder = interaction.options.getString('reminder');

	if (!time || !reminder) {
		return interaction.reply({
			content: 'Please provide both a time and reminder message.',
			flags: [djs.MessageFlags.Ephemeral],
		});
	}

	await interaction.reply({
		content: `I'll remind you about "${reminder}" in ${time} minutes.`,
		flags: [djs.MessageFlags.Ephemeral],
	});

	setTimeout(async () => {
		try {
			await interaction.channel.send(`<@${interaction.user.id}>\n${reminder}`);
		} catch (error) {
			console.error('Error sending reminder:', error);
		}
	}, time * 1000 * 60);
};

module.exports.application_command = () => {
	return new djs.SlashCommandBuilder()
		.setName('remind_me')
		.setDescription('Set a reminder for yourself')
		.addIntegerOption(option =>
			option
				.setName('time')
				.setDescription('Time in minutes before the reminder is triggered')
				.setRequired(true)
				.setMinValue(1)
				.setMaxValue(10080),
		)
		.addStringOption(option => option.setName('reminder').setDescription('The reminder message').setRequired(true))
		.setIntegrationTypes(['GuildInstall'])
		.setContexts(['BotDM', 'Guild']);
};
