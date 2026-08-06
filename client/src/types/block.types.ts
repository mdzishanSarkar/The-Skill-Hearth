export interface BlockedUser {
  _id: string;
  displayName: string;
  avatar: string;
  blockedAt: string;
}

export interface BlockedUsersResult {
  users: BlockedUser[];
}
