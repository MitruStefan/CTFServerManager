const djs = require('discord.js');
const openai = require('openai');
const fs = require('fs');
const path = require('path');
const voices = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'sage', 'verse'];

const client = new openai.OpenAI({
	baseURL: process.env.API_URL,
	apiKey: process.env.API_KEY,
});

module.exports.message = async msg => {
	const query = msg.content.replace('!speak ', '').trim();

	if (!query) {
		return msg.reply('Please provide something to say after `!speak`');
	}

	const voice = query.split('\n')[0].trim().split(' ')[0].toLowerCase();

	const instructions = query.replace(voice, '').split('\n')[0].trim();

	const input = query.split('\n').slice(1).join(' ');

	if (!voices.includes(voice)) return msg.reply(`Please provide a valid voice. Available voices are: ${voices.join(', ')}`);
	try {
		msg.channel.sendTyping();

		const speechFile = path.resolve(`./speech-${msg.id}.mp3`);

		const mp3 = await client.audio.speech.create({
			model: 'gpt-4o-mini-tts',
			voice,
			input: input,
			instructions: instructions,
		});

		const buffer = Buffer.from(await mp3.arrayBuffer());
		await fs.promises.writeFile(speechFile, buffer);

		await msg.channel.send({
			content: `Here's your speech, <@${msg.author.id}> 🎤`,
			files: [speechFile],
		});

		fs.unlink(speechFile, () => {});
	} catch (err) {
		console.error('TTS error:', err);
		msg.reply("Sorry, I couldn't generate the speech 😢");
	}
};
