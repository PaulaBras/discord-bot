import { Bot } from './bot/bot';
import { Config } from './config/config';

const config = new Config();
const bot = new Bot(config);

bot.start();