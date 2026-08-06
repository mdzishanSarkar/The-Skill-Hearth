import api from './api';
import type { BotInstallation, InstallBotInput, SlashCommandResult } from '../types/bot.types';

export async function installBot(input: InstallBotInput): Promise<BotInstallation> {
  const { data } = await api.post('/bots', input);
  return data.data.installation;
}

export async function uninstallBot(id: string): Promise<void> {
  await api.delete(`/bots/${id}`);
}

export async function listBots(): Promise<BotInstallation[]> {
  const { data } = await api.get('/bots');
  return data.data.bots;
}

export async function sendSlashCommand(
  command: string,
  args: string[],
  installationId: string,
  platform: string
): Promise<SlashCommandResult> {
  const { data } = await api.post('/bots/command', { command, args, installationId, platform });
  return data.data;
}
