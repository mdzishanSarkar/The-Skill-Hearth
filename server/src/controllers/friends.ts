import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as friendshipService from '../services/friendship';
import { asyncHandler } from '../utils/errors';

export const listFriends = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { q } = req.query;
  const friends = await friendshipService.listFriends(req.userId!, q as string | undefined);
  res.json({ success: true, data: { friends } });
});

export const getIncomingRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const requests = await friendshipService.getFriendRequests(req.userId!, 'incoming');
  res.json({ success: true, data: { requests } });
});

export const getOutgoingRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const requests = await friendshipService.getFriendRequests(req.userId!, 'outgoing');
  res.json({ success: true, data: { requests } });
});

export const sendFriendRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const friendship = await friendshipService.sendFriendRequest(req.userId!, String(req.params.userId));
  res.status(201).json({ success: true, data: { friendship } });
});

export const acceptFriendRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const friendship = await friendshipService.acceptFriendRequest(String(req.params.id), req.userId!);
  res.json({ success: true, data: { friendship } });
});

export const declineFriendRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const friendship = await friendshipService.declineFriendRequest(String(req.params.id), req.userId!);
  res.json({ success: true, data: { friendship } });
});

export const cancelFriendRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await friendshipService.cancelFriendRequest(String(req.params.id), req.userId!);
  res.json({ success: true, data: result });
});

export const unfriend = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await friendshipService.unfriend(req.userId!, String(req.params.userId));
  res.json({ success: true, data: result });
});

export const setFriendTier = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { tier } = req.body;
  if (!['friend', 'close_friend'].includes(tier)) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'tier must be friend or close_friend' } });
    return;
  }
  const friendship = await friendshipService.setFriendTier(req.userId!, String(req.params.userId), tier);
  res.json({ success: true, data: { friendship } });
});

export const updateFriendPrivacy = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { showStreak } = req.body;
  const friendship = await friendshipService.updateFriendPrivacy(
    req.userId!,
    String(req.params.userId),
    Boolean(showStreak),
  );
  res.json({ success: true, data: { friendship } });
});

export const getMutualFriends = asyncHandler(async (req: AuthRequest, res: Response) => {
  const mutual = await friendshipService.getMutualFriends(req.userId!, String(req.params.userId));
  res.json({ success: true, data: { mutual } });
});

export const getSuggestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const suggestions = await friendshipService.getFriendSuggestions(req.userId!);
  res.json({ success: true, data: { suggestions } });
});

export const getFriendsOnline = asyncHandler(async (req: AuthRequest, res: Response) => {
  const online = await friendshipService.getFriendsOnline(req.userId!);
  res.json({ success: true, data: { online } });
});

export const getFriendStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const status = await friendshipService.getFriendStatus(req.userId!, String(req.params.userId));
  res.json({ success: true, data: { status } });
});
