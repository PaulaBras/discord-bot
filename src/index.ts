import { Config } from './config/config';
import { Bot } from './bot/bot';
import { ApiServer } from './api/server';

const config = new Config();
const bot = new Bot(config);
const apiServer = new ApiServer(config);

async function main() {
  try {
    await bot.start();
    apiServer.start(3000); // Start the API server on port 3000
    console.log('Bot and API server started successfully');
  } catch (error) {
    console.error('Error starting the application:', error);
  }
}

main();