export interface BotInstallation {
  _id: string;
  externalId: string;
  name: string;
  platform: 'slack' | 'discord';
  teamId?: string;
  teamName?: string;
  channelId?: string;
  channelName?: string;
  status: 'active' | 'disabled' | 'error';
  lastUsedAt?: string;
  commandCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface InstallBotInput {
  externalId: string;
  name: string;
  platform: 'slack' | 'discord';
  accessToken: string;
  botToken: string;
  teamId?: string;
  teamName?: string;
  channelId?: string;
  channelName?: string;
}

export interface SlashCommandResult {
  text: string;
}
