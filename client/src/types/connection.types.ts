export type ConnectionStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'completed'
  | 'withdrawn'
  | 'cancelled';

export interface ConnectionUser {
  _id: string;
  displayName: string;
  avatar: string;
}

export interface ConnectionSkill {
  _id: string;
  skillName: string;
  categoryName: string;
  type: 'teach' | 'learn';
}

export interface Connection {
  _id: string;
  requesterId: ConnectionUser;
  teacherId: ConnectionUser;
  skillId: ConnectionSkill;
  status: ConnectionStatus;
  message: string;
  responseMessage?: string;
  proposedFormat: 'in-person' | 'online' | 'either';
  completedAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionListResult {
  connections: Connection[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SendConnectionRequestInput {
  teacherId: string;
  skillId: string;
  message: string;
  proposedFormat: 'in-person' | 'online' | 'either';
}
