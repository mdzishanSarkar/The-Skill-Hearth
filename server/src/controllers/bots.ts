import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as botService from '../services/bot';
import { asyncHandler } from '../utils/errors';

export const installBot = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { externalId, name, platform, accessToken, botToken, teamId, teamName, channelId, channelName } =
    req.body || {};
  if (!externalId || !name || !platform || !accessToken || !botToken) {
    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'externalId, name, platform, accessToken, and botToken are required',
      },
    });
    return;
  }
  if (!['slack', 'discord'].includes(platform)) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'platform must be "slack" or "discord"' },
    });
    return;
  }
  const installation = await botService.installBot({
    externalId,
    name,
    platform,
    accessToken,
    botToken,
    teamId,
    teamName,
    channelId,
    channelName,
    installedBy: req.userId!,
  });
  res.status(201).json({ success: true, data: { installation } });
});

export const uninstallBot = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await botService.uninstallBot(String(req.params.id), req.userId!);
  res.json({ success: true, data: result });
});

export const listBots = asyncHandler(async (req: AuthRequest, res: Response) => {
  const bots = await botService.listBots(req.userId!);
  res.json({ success: true, data: { bots } });
});

export const handleSlashCommand = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { command, args, installationId, platform } = req.body || {};
  if (!command || !installationId || !platform) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'command, installationId, and platform are required' },
    });
    return;
  }
  const result = await botService.handleSlashCommand({
    platform,
    command,
    args: args || [],
    userId: req.userId!,
    installationId,
  });
  res.json({ success: true, data: result });
});
