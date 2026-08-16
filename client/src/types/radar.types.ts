export type RadarConfidence = 'high' | 'medium' | 'low';
export type RadarIntentStatus = 'active' | 'paused' | 'dismissed';
export type RadarFormat = 'online' | 'in-person' | 'either';

export interface RadarIntent {
  category: string;
  inferredSkillNames: string[];
  confidence: RadarConfidence;
  preferredFormat: RadarFormat;
  preferredRadius?: number;
  reasoning: string;
  status: RadarIntentStatus;
  lastAlertedAt?: string;
  alertedSkillIds: string[];
  matchCount: number;
}

export interface ManualRadar {
  _id: string;
  name: string;
  filters: {
    category?: string;
    type?: 'teach' | 'learn';
    format?: string;
    proficiencyLevel?: string;
    radius?: number;
    availability?: string[];
  };
  lastAlertedAt?: string;
  alertedSkillIds: string[];
}

export interface SkillRadarDoc {
  userId: string;
  intents: RadarIntent[];
  manualRadars: ManualRadar[];
  updatedAt?: string;
}
