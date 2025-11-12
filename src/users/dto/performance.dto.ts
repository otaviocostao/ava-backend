export interface PerformanceMetric {
  title: string;
  value: number;
  displayValue: string;
  description: string;
}

export interface RecentGrade {
  discipline: string;
  grade: number;
  date: string;
  concept: string;
  teacher: string | null;
  trend: 'up' | 'down' | 'stable';
}

export interface Achievement {
  title: string;
  description: string;
  date: string;
  type: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface PerformanceData {
  metrics: PerformanceMetric[];
  recentGrades: RecentGrade[];
  performanceByDiscipline: {
    disc: string;
    nota: number;
  }[];
}