const djs = require('discord.js');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const handleLargeMessage = async (fullResponse, msg) => {
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

	// let replyMessage;
	// if (msg.reference) replyMessage = await msg.channel.messages.fetch({ message: msg.reference.messageId });
	// while (replyMessage) {
	// 	if (replyMessage.author.id === process.env.CLIENT_ID) {
	// 		messages.push({ role: 'assistant', content: replyMessage.content });
	// 	} else {
	// 		messages.push({ role: 'user', content: replyMessage.content.replace('!gpt ', '') });
	// 	}
	// 	if (replyMessage.reference) {
	// 		replyMessage = await msg.channel.messages.fetch({ message: replyMessage.reference.messageId });
	// 	} else {
	// 		replyMessage = null;
	// 	}
	// }

	// const attachment = msg.attachments.first();
	// const imageUrl = attachment?.url;

	messages.push(
		...msg.channel.messages.cache
			.filter(m => m.content.startsWith('!gpt') || m.content.startsWith('$ai') || m.author.bot)
			.map(m => {
				if (m.author.id === process.env.CLIENT_ID) {
					return { role: 'model', parts: [{ text: m.content }] };
				} else
					return {
						role: 'user',
						parts: [{ text: `${msg.author.username} said:\n` + m.content.replace('!gpt ', '') }],
					};
			}),
	);
	// console.log(messages);
	messages.push({ role: 'user', parts: [{ text: `${msg.author.username} said:\n` + query }] });

	for (const m of messages) {
		const matches = m.parts[0].text.match(/<@!?(\d+)>/g);
		for (const match of matches || []) {
			const userId = match.replace(/<@!?/, '').replace(/>/, '');
			const mentionedUser = await msg.guild.members.fetch(userId);
			if (mentionedUser) {
				m.parts[0].text = m.parts[0].text.replace(match, `${mentionedUser.user.username}`);
			}
		}
	}

	try {
		const responseData = await ai.models.generateContent({
			model: `${process.env.MODEL}`,
			temperature: 1.1, // Higher = more creative/random responses
			// top_p: 0.9, // Nucleus sampling - for more diverse responses
			// presence_penalty: 0.6, // Encourages the model to talk about new topics
			// frequency_penalty: 0.5, // Reduces repetition of phrases/words
			config: {
				systemInstruction: process.env.AI_PROMPT,
				maxOutputTokens: 1500, // Controls response length
				thinkingConfig: {
					thinkingBudget: 0, // Disables thinking
				},
			},
			contents: messages,
		});
		if (!responseData?.candidates?.[0]?.content?.parts?.[0]?.text) return msg.reply('No response.');
		const fullResponse = responseData.candidates[0].content.parts[0].text
			.replace(/@tudorrrr/g, '<@1208854004382306484>')
			.replace(/@\.justraul/g, '<@890748230059589652>')
			.replace(/@justraul/g, '<@890748230059589652>')
			.replace(/@stefanin/g, '<@320844424672182275>')
			.replace(/@tomadimitrie/g, '<@340082905734840321>');

		if (fullResponse.length > 2000) {
			await handleLargeMessage(fullResponse, msg);
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
