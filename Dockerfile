FROM node:23-alpine3.20

WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

COPY deploy-commands.js ./

COPY index.js  ./

COPY commands ./commands

# Command to run the bot
CMD ["node", "index.js"]