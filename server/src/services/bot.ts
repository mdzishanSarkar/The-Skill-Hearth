import { Types } from 'mongoose';
import { BotInstallation, Skill, User } from '../models';
import { HttpError } from '../utils/errors';

function toObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid id');
  }
  return new Types.ObjectId(value);
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
  installedBy: string;
}

export async function installBot(input: InstallBotInput) {
  const existing = await BotInstallation.findOne({ externalId: input.externalId });
  if (existing) {
    existing.accessToken = input.accessToken;
    existing.botToken = input.botToken;
    existing.status = 'active';
    await existing.save();
    return existing.toJSON();
  }

  const installation = await BotInstallation.create({
    externalId: input.externalId,
    name: input.name,
    platform: input.platform,
    accessToken: input.accessToken,
    botToken: input.botToken,
    teamId: input.teamId,
    teamName: input.teamName,
    channelId: input.channelId,
    channelName: input.channelName,
    installedBy: toObjectId(input.installedBy),
  });

  return installation.toJSON();
}

export async function uninstallBot(installationId: string, userId: string) {
  const installation = await BotInstallation.findOneAndDelete({
    _id: toObjectId(installationId),
    installedBy: toObjectId(userId),
  });
  if (!installation) throw new HttpError(404, 'NOT_FOUND', 'Bot installation not found');
  return { success: true };
}

export async function listBots(userId: string) {
  return BotInstallation.find({ installedBy: toObjectId(userId) })
    .sort({ createdAt: -1 })
    .lean();
}

export async function handleSlashCommand(params: {
  platform: 'slack' | 'discord';
  command: string;
  args: string[];
  userId: string;
  installationId: string;
}) {
  const installation = await BotInstallation.findById(toObjectId(params.installationId));
  if (!installation || installation.status !== 'active') {
    throw new HttpError(404, 'BOT_NOT_FOUND', 'Bot not found or inactive');
  }
  installation.commandCount += 1;
  installation.lastUsedAt = new Date();
  await installation.save();

  switch (params.command) {
    case '/find-skill':
      return handleFindSkill(params.args);
    case '/my-skills':
      return handleMySkills(params.userId);
    case '/stats':
      return handleStats();
    case '/help':
      return handleHelp();
    default:
      return {
        text: `Unknown command: ${params.command}. Available commands: /find-skill, /my-skills, /stats, /help`,
      };
  }
}

async function handleFindSkill(args: string[]) {
  if (args.length === 0) {
    return { text: 'Usage: /find-skill [skill name] [location] — e.g. /find-skill guitar Brooklyn' };
  }

  const q = args.join(' ');
  const skills = await Skill.find({
    isDeleted: false,
    $or: [
      { skillName: { $regex: q, $options: 'i' } },
      { categoryName: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ],
  })
    .select('skillName categoryName description location stats')
    .limit(5)
    .lean();

  if (skills.length === 0) {
    return { text: `No skills found matching "${q}". Try a different search term.` };
  }

  const results = skills.map((s, i) => {
    const city = s.location?.city || 'Location not set';
    return `${i + 1}. **${s.skillName}** (${s.categoryName}) — ⭐ ${(s.stats?.averageRating || 0).toFixed(1)} (${s.stats?.reviewCount || 0} reviews) — ${city}`;
  });

  return {
    text: `Found ${skills.length} skill(s) matching "${q}":\n\n${results.join('\n')}`,
  };
}

async function handleMySkills(userId: string) {
  const user = await User.findById(toObjectId(userId)).select('displayName').lean();
  if (!user) return { text: 'User not found.' };

  const skills = await Skill.find({ userId: toObjectId(userId), isDeleted: false })
    .select('skillName categoryName type')
    .limit(10)
    .lean();

  if (skills.length === 0) {
    return { text: "You haven't added any skills yet." };
  }

  const list = skills.map((s) => `• **${s.skillName}** (${s.categoryName}) — ${s.type}`);
  return { text: `Your skills:\n${list.join('\n')}` };
}

async function handleStats() {
  const [totalSkills, totalUsers] = await Promise.all([
    Skill.countDocuments({ isDeleted: false }),
    User.countDocuments({ isDeleted: { $ne: true } }),
  ]);

  return {
    text: `📊 **The Skill Hearth Stats**\n• ${totalUsers} members\n• ${totalSkills} skills shared\n• Growing every day!`,
  };
}

async function handleHelp() {
  return {
    text: [
      '🤝 **The Skill Hearth Bot**',
      '',
      'Commands:',
      '• `/find-skill [name] [location]` — Find skill teachers nearby',
      '• `/my-skills` — View your listed skills',
      '• `/stats` — Platform statistics',
      '• `/help` — Show this message',
    ].join('\n'),
  };
}
