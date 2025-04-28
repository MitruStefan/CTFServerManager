const djs = require('discord.js');
const openai = require('openai');

const client = new openai.OpenAI({
	baseURL: process.env.API_URL,
	apiKey: process.env.API_KEY,
});

const message = username => {
	return {
		role: 'system',
		content: `${process.env.AIPROMPT}

Current user: ${username}`,
	};
};

module.exports.message = async msg => {
	let query, search;
	if (msg.content.startsWith('!gpt search')) {
		query = msg.content.replace('!gpt search ', '').trim();
		search = true;
	} else query = msg.content.replace('!gpt ', '').trim();

	if (!query) {
		return msg.reply('Please provide a question after !gpt');
	}

	msg.channel.sendTyping();
	const messages = [];
	let replyMessage;
	if (msg.reference) replyMessage = await msg.channel.messages.fetch({ message: msg.reference.messageId });
	while (replyMessage) {
		if (replyMessage.author.id === process.env.CLIENT_ID) {
			messages.push({ role: 'assistant', content: replyMessage.content });
		} else {
			messages.push({ role: 'user', content: replyMessage.content.replace('!gpt ', '') });
		}
		if (replyMessage.reference) {
			replyMessage = await msg.channel.messages.fetch({ message: replyMessage.reference.messageId });
		} else {
			replyMessage = null;
		}
	}

	const attachment = msg.attachments.first();
	const imageUrl = attachment?.url;

	messages.push(message(msg.member?.displayName || msg.author.globalName));
	messages.reverse();
	if (imageUrl) {
		messages.push({
			role: 'user',
			content: [
				{ type: 'text', text: query },
				{ type: 'image_url', image_url: { url: imageUrl } },
			],
		});
	} else {
		messages.push({ role: 'user', content: query });
	}

	try {
		const responseData = await client.chat.completions.create({
			model: `${process.env.MODEL}${search ? ':online' : ''}`,
			messages,
		});
		if (!responseData?.choices?.length) return msg.reply('No response.');
		const fullResponse = responseData.choices[0].message.content; //+ `\n\nRemaining credits: ${responseData.usage.zj_usage.credits_remaining}`;
		//console.log(`Remaining credits: ${responseData.usage.zj_usage.credits_remaining}`);
		if (fullResponse.length > 2000) {
			const chunks = [];
			let startPos = 0;

			while (startPos < fullResponse.length) {
				let endPos = Math.min(startPos + 2000, fullResponse.length);
				if (endPos < fullResponse.length && fullResponse[endPos] !== ' ') {
					while (endPos > startPos && fullResponse[endPos - 1] !== ' ') {
						endPos--;
					}
					if (endPos === startPos) {
						endPos = Math.min(startPos + 2000, fullResponse.length);
					}
				}
				chunks.push(fullResponse.substring(startPos, endPos));
				startPos = endPos;
			}
			let latest = await msg.reply(chunks[0]);
			for (let i = 1; i < chunks.length; i++) {
				latest = await latest.reply(chunks[i]);
			}
		} else {
			await msg.reply(fullResponse);
		}
	} catch (error) {
		console.error('Error querying AI:', error);
		await msg.reply('Sorry, I encountered an error skill issue.');
	}
};
module.exports.interaction = async interaction => {
	const query = interaction.options.getString('query');

	if (!query) {
		return interaction.reply({ content: 'Please provide a question.', flags: [djs.MessageFlags.Ephemeral] });
	}

	const search = interaction.options.getBoolean('search');

	await interaction.deferReply();

	const messages = [];
	messages.push(message(interaction.member?.displayName || interaction.user.globalName));
	messages.push({ role: 'user', content: query });
	try {
		console.log(messages);
		const responseData = await client.chat.completions.create({
			model: `${process.env.MODEL}${search ? ':online' : ''}`,
			messages: messages,
		});

		if (!responseData?.choices?.length) return interaction.editReply('No response.');
		const fullResponse = responseData.choices[0].message.content;

		if (fullResponse.length > 2000) {
			const chunks = [];
			let startPos = 0;

			while (startPos < fullResponse.length) {
				let endPos = Math.min(startPos + 2000, fullResponse.length);
				if (endPos < fullResponse.length && fullResponse[endPos] !== ' ') {
					while (endPos > startPos && fullResponse[endPos - 1] !== ' ') {
						endPos--;
					}
					if (endPos === startPos) {
						endPos = Math.min(startPos + 2000, fullResponse.length);
					}
				}
				chunks.push(fullResponse.substring(startPos, endPos));
				startPos = endPos;
			}
			await interaction.editReply(chunks[0]);
			for (let i = 1; i < chunks.length; i++) {
				await interaction.followUp(chunks[i]);
			}
		} else {
			await interaction.editReply(fullResponse);
		}

		await interaction.followUp({
			content: `Remaining credits: ${responseData.usage?.zj_usage?.credits_remaining}`,
			flags: [djs.MessageFlags.Ephemeral],
		});
	} catch (error) {
		console.error('Error querying AI:', error);
		await interaction.editReply('Sorry, I encountered an error skill issue.');
	}
};
module.exports.application_command = () => {
	return new djs.SlashCommandBuilder()
		.setName('generate')
		.setDescription('Generate a response from the AI')
		.addStringOption(option => option.setName('query').setDescription('The query to send to the AI').setRequired(true))
		.addBooleanOption(option => option.setName('search').setDescription('Search the web for the answer'))
		.setIntegrationTypes(['GuildInstall', 'UserInstall'])
		.setContexts(['BotDM', 'Guild', 'PrivateChannel']);
};
