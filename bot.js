// Import the necessary libraries
const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config(); // Load environment variables from .env file

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Event handler when the bot is ready
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Event handler for message creation
client.on("messageCreate", (message) => {
  // Ignore messages from the bot itself
  if (message.author.bot) return;

  // Check for a command (e.g., '!ping')
  if (message.content === "!ping") {
    message.channel.send("Pong!");
  }
});

// Log in to Discord using the token from the .env file
client.login(process.env.DISCORD_TOKEN);
