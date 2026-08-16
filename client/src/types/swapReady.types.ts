export interface SwapReadyUserRef {
  _id: string;
  displayName: string;
  avatar?: string;
  status?: string;
  location?: { city?: string; neighborhood?: string };
}

export interface SwapReadySkillRef {
  _id: string;
  skillName: string;
  categoryName: string;
  format?: string;
}

export type SwapReadyMatchStatus = 'available' | 'hidden' | 'proposed' | 'accepted' | 'declined';

export interface SwapReadyMatch {
  _id: string;
  userAId: SwapReadyUserRef;
  userATeachesSkillId: SwapReadySkillRef;
  userBId: SwapReadyUserRef;
  userBTeachesSkillId: SwapReadySkillRef;
  status: SwapReadyMatchStatus;
  lastMatchDate: string;
  userIsA: boolean;
}
