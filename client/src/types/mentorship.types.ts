export interface MentorshipGoal {
  title: string;
  description: string;
  targetDate?: string;
  completed: boolean;
  completedAt?: string;
}

export interface MentorshipCheckIn {
  date: string;
  notes: string;
  mentorNotes?: string;
}

export interface Mentorship {
  _id: string;
  mentorId: {
    _id: string;
    displayName: string;
    avatar: string;
  };
  menteeId: {
    _id: string;
    displayName: string;
    avatar: string;
  };
  skillId: {
    _id: string;
    skillName: string;
    categoryName: string;
  };
  status: 'pending' | 'active' | 'paused' | 'completed' | 'cancelled';
  goals: MentorshipGoal[];
  checkIns: MentorshipCheckIn[];
  startDate: string;
  targetEndDate?: string;
  completedAt?: string;
  durationMonths: number;
  meetingFrequency: 'weekly' | 'biweekly' | 'monthly';
  createdAt: string;
  updatedAt: string;
}

export interface CreateMentorshipInput {
  mentorId: string;
  skillId: string;
  goals?: Array<{ title: string; description?: string; targetDate?: string }>;
  durationMonths?: number;
  meetingFrequency?: 'weekly' | 'biweekly' | 'monthly';
}
