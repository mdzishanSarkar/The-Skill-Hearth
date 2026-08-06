export interface GroupSessionTeacher {
  _id: string;
  displayName: string;
  avatar: string;
  stats?: {
    sessionsCompleted: number;
    averageRating: number;
    reviewCount: number;
  };
}

export interface GroupSessionSkill {
  _id: string;
  skillName: string;
  categoryName: string;
  description?: string;
}

export interface GroupSessionParticipant {
  _id: string;
  displayName: string;
  avatar: string;
}

export type GroupSessionStatus = 'open' | 'full' | 'completed' | 'cancelled';
export type GroupSessionType = 'regular' | 'workshop';

export interface GroupSession {
  _id: string;
  teacherId: GroupSessionTeacher;
  skillId: GroupSessionSkill;
  title: string;
  description: string;
  maxParticipants: number;
  participants: GroupSessionParticipant[];
  format: 'in-person' | 'online' | 'either';
  location?: string;
  scheduledAt?: string;
  status: GroupSessionStatus;
  sessionType: GroupSessionType;
  chatRoomId: string;
  cancelledReason?: string;
  isFlagged: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroupSessionListResult {
  sessions: GroupSession[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateGroupSessionInput {
  skillId: string;
  title: string;
  description?: string;
  maxParticipants?: number;
  format: 'in-person' | 'online' | 'either';
  location?: string;
  scheduledAt?: string;
  sessionType?: GroupSessionType;
}
