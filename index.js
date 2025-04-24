const djs = require('discord.js');
const fs = require('fs');
require('dotenv').config();

// Create a new client instance
const client = new djs.Client({
	intents: [
		djs.GatewayIntentBits.Guilds,
		djs.GatewayIntentBits.GuildMessages,
		djs.GatewayIntentBits.MessageContent,
		djs.GatewayIntentBits.GuildMembers,
		djs.GatewayIntentBits.GuildMessageReactions,
	],
});

// When the client is ready
client.once(djs.Events.ClientReady, async c => {
	console.log(`Ready! Logged in as ${c.user.tag} at ${new Date().toLocaleString()}`);
	require('./deploy-commands.js')(client);
	const msgs = await client.channels.cache.get(process.env.ANNOUNCEMENTS).messages.fetch();
	console.log(`Fetched ${msgs.size} messages from the ${client.channels.cache.get(process.env.ANNOUNCEMENTS).name} channel.`);
});

//Commands handler
const files = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commands = {};
files.forEach(file => {
	commands[file.slice(0, -3)] = require(`./commands/${file}`);
});

client.on(djs.Events.MessageCreate, async msg => {
	if (msg.author.bot) return;

	if (msg.content.startsWith('!remind_me')) {
		await commands['remind_me'].message(msg);
	} else if (msg.content.startsWith('!setup')) {
		await commands['setup'].message(msg);
	} else if (msg.content.startsWith('!finish')) {
		await commands['finish'].message(msg);
	}

	//Disabled, llm's are expensive

	// else if (msg.content.startsWith('!gpt')) {
	// 	await commands['generate'].message(msg);
	// } else if (msg.content.startsWith('!prompt')) {
	// 	await commands['generate'].prompt(msg);
	// }
});

client.on(djs.Events.InteractionCreate, async interaction => {
	if (!interaction.member) return;
	try {
		if (interaction.isCommand()) {
			const command = commands[interaction.commandName];
			if (command?.interaction) {
				await command.interaction(interaction);
			}
		} else if (interaction.isButton()) {
			const command = commands[interaction.customId.split('-')[0]];
			if (command?.button) {
				await command.button(interaction);
			}
		}
	} catch (err) {
		const err_payload = { content: `There was an error while executing this command!\n${err}`, ephemeral: true };
		console.log(err);
		if (interaction.replied || interaction.deferred) interaction.followUp(err_payload);
		else await interaction.reply(err_payload);
	}
});

client.on(djs.Events.MessageReactionAdd, async (reaction, user) => {
	if (reaction.emoji.name != '1️⃣') return;
	if (!reaction?.message?.embeds?.[0]) return;
	if (reaction?.message?.channel?.id != process.env.ANNOUNCEMENTS) return;

	const title = reaction.message.embeds[0].data.title;
	for (const word of title.split(' ')) {
		if (!isNaN(word) || word.toLowerCase() === 'ctf') continue;

		const role = reaction.message.guild.roles.cache.find(r => r.name.toLowerCase().includes(word.toLowerCase()));
		if (!role) continue;

		const member = reaction.message.guild.members.cache.get(user.id);
		await member.roles.add(role).catch(err => {
			console.log(`Error adding role ${role.name} to user ${user.username}: ${err}`);
		});
		break;
	}
});

client.on(djs.Events.MessageReactionRemove, async (reaction, user) => {
	if (reaction.emoji.name != '1️⃣') return;
	if (!reaction?.message?.embeds?.[0]) return;
	if (reaction?.message?.channel?.id != process.env.ANNOUNCEMENTS) return;

	const title = reaction.message.embeds[0].data.title;
	for (const word of title.split(' ')) {
		if (!isNaN(word) || word.toLowerCase() === 'ctf') continue;

		const role = reaction.message.guild.roles.cache.find(r => r.name.toLowerCase().includes(word.toLowerCase()));
		if (!role) continue;

		const member = reaction.message.guild.members.cache.get(user.id);
		await member.roles.remove(role).catch(err => {
			console.log(`Error removing role ${role.name} to user ${user.username}: ${err}`);
		});
		break;
	}
});

// Login to Discord with your token - USE ENVIRONMENT VARIABLE!
client.login(process.env.DISCORD_TOKEN);
