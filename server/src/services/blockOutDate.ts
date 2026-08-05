import { BlockOutDate } from '../models';
import { HttpError } from '../utils/errors';

export async function getBlockOutDates(userId: string) {
  const dates = await BlockOutDate.find({ userId })
    .sort({ date: 1 })
    .lean();
  return dates;
}

export async function addBlockOutDate(userId: string, date: string, reason: string) {
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    throw new HttpError(400, 'INVALID_DATE', 'Invalid date');
  }

  const existing = await BlockOutDate.findOne({ userId, date: dateObj });
  if (existing) {
    throw new HttpError(409, 'DATE_EXISTS', 'This date is already blocked out');
  }

  const blockOut = await BlockOutDate.create({
    userId,
    date: dateObj,
    reason: reason.trim().slice(0, 200),
  });

  return blockOut.toJSON();
}

export async function removeBlockOutDate(userId: string, blockOutId: string) {
  const result = await BlockOutDate.deleteOne({ _id: blockOutId, userId });
  if (result.deletedCount === 0) {
    throw new HttpError(404, 'NOT_FOUND', 'Block-out date not found');
  }
  return { success: true };
}

export async function isAvailableOnDate(userId: string, date: string): Promise<boolean> {
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return false;

  const blocked = await BlockOutDate.findOne({ userId, date: dateObj });
  return !blocked;
}
