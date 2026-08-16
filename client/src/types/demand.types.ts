export interface DemandRegion {
  name: string;
  count: number;
}

export interface DemandSkill {
  skillName: string;
  categoryName: string;
  demandScore: number;
  topRegions: DemandRegion[];
}

export interface DemandSnapshot {
  skills: DemandSkill[];
  windowStart: string;
  windowEnd: string;
  generatedAt: string;
}
