export interface ImpactData {
  teaching: {
    sessionsTaught: number;
    learnersHelped: number;
    hoursContributed: number;
    neighborhoodsReached: number;
    neighborhoods: string[];
    activeSkills: number;
  };
  learning: {
    sessionsLearned: number;
  };
  reviews: {
    totalReviews: number;
    averageRating: number;
  };
}
